declare const process: { env: Record<string, string | undefined> };

type Player = 'black' | 'white';
type PieceType = 'king' | 'rook' | 'bishop' | 'gold' | 'silver' | 'knight' | 'lance' | 'pawn';
type AdvisorLanguage = 'ja' | 'en';

interface PieceInput {
  type: PieceType;
  player: Player;
  promoted?: boolean;
}

interface AdvisorRequestBody {
  board: (PieceInput | null)[][];
  hands: Record<Player, PieceType[]>;
  currentPlayer: Player;
  checkPlayer: Player | null;
  lastMovePlayer: Player | null;
  language: AdvisorLanguage;
}

interface VercelRequest {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
}

interface VercelResponse {
  status(code: number): VercelResponse;
  json(body: unknown): void;
  setHeader(name: string, value: string): void;
  end(): void;
}

const PIECE_TYPES = new Set<PieceType>([
  'king', 'rook', 'bishop', 'gold', 'silver', 'knight', 'lance', 'pawn',
]);
const PLAYERS = new Set<Player>(['black', 'white']);
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 30;
const MIN_INTERVAL_MS = 700;
const rateBuckets = new Map<string, { windowStart: number; count: number; lastAt: number }>();

const SYSTEM_PROMPT = `You are the tactical advisor in SHOGI FRONTLINE, a standard-shogi game with a military visual theme.
Black = human 1P and starts from the bottom side. White = CPU and starts from the top side.
Board coordinates are zero-based: row 0 is the CPU home side and row 8 is the 1P home side.
Military names map to shogi pieces as follows: king=HQ/司令部, rook=Tank/戦車, bishop=Rocket Launcher/ロケット砲, gold=Guard/近衛兵, silver=Special Forces/特殊部隊, knight=Drone/ドローン, lance=Artillery/自走砲, pawn=Infantry/歩兵.
Analyze only the supplied position. Give concise, useful advice from 1P's perspective. Prefer positional/tactical observations that are clearly supported by the board and captured pieces. Do not invent a check, capture, promotion, or exact legal move if you are not certain. Do not mention that you are an AI or discuss the API.
If language is ja, write natural Japanese. If language is en, write natural English.
The summary should be one short sentence. Return 2 to 4 short bullet points. No markdown.`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isPlayer(value: unknown): value is Player {
  return typeof value === 'string' && PLAYERS.has(value as Player);
}

function isPieceType(value: unknown): value is PieceType {
  return typeof value === 'string' && PIECE_TYPES.has(value as PieceType);
}

function isPiece(value: unknown): value is PieceInput | null {
  if (value === null) return true;
  if (!isRecord(value) || !isPieceType(value.type) || !isPlayer(value.player)) return false;
  return value.promoted === undefined || typeof value.promoted === 'boolean';
}

function isAdvisorRequestBody(value: unknown): value is AdvisorRequestBody {
  if (!isRecord(value)) return false;
  if (!Array.isArray(value.board) || value.board.length !== 9) return false;
  if (!value.board.every(row => Array.isArray(row) && row.length === 9 && row.every(isPiece))) return false;
  if (!isRecord(value.hands)) return false;
  if (!Array.isArray(value.hands.black) || !Array.isArray(value.hands.white)) return false;
  if (value.hands.black.length > 40 || value.hands.white.length > 40) return false;
  if (!value.hands.black.every(isPieceType) || !value.hands.white.every(isPieceType)) return false;
  if (!isPlayer(value.currentPlayer)) return false;
  if (value.checkPlayer !== null && !isPlayer(value.checkPlayer)) return false;
  if (value.lastMovePlayer !== null && !isPlayer(value.lastMovePlayer)) return false;
  return value.language === 'ja' || value.language === 'en';
}

function headerValue(req: VercelRequest, name: string): string | null {
  const value = req.headers[name];
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function clientIp(req: VercelRequest): string {
  const forwarded = headerValue(req, 'x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return headerValue(req, 'x-real-ip') ?? 'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const current = rateBuckets.get(ip);
  if (!current || now - current.windowStart >= RATE_WINDOW_MS) {
    rateBuckets.set(ip, { windowStart: now, count: 1, lastAt: now });
    return false;
  }
  if (now - current.lastAt < MIN_INTERVAL_MS || current.count >= RATE_LIMIT) return true;
  current.count += 1;
  current.lastAt = now;
  rateBuckets.set(ip, current);
  return false;
}

function parseBody(body: unknown): unknown {
  if (typeof body !== 'string') return body;
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return null;
  }
}

function extractOutputText(payload: unknown): string | null {
  if (!isRecord(payload)) return null;
  if (typeof payload.output_text === 'string') return payload.output_text;
  if (!Array.isArray(payload.output)) return null;

  for (const item of payload.output) {
    if (!isRecord(item) || !Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (isRecord(content) && content.type === 'output_text' && typeof content.text === 'string') {
        return content.text;
      }
    }
  }
  return null;
}

function sanitizeAdvice(value: unknown): { summary: string; bullets: string[] } | null {
  if (!isRecord(value) || typeof value.summary !== 'string' || !Array.isArray(value.bullets)) return null;
  const summary = value.summary.trim().slice(0, 260);
  const bullets = value.bullets
    .filter((item): item is string => typeof item === 'string')
    .map(item => item.trim().slice(0, 260))
    .filter(Boolean)
    .slice(0, 4);
  if (!summary || bullets.length === 0) return null;
  return { summary, bullets };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const origin = headerValue(req, 'origin');
  const host = headerValue(req, 'host');
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) {
        res.status(403).json({ error: 'Origin not allowed' });
        return;
      }
    } catch {
      res.status(403).json({ error: 'Origin not allowed' });
      return;
    }
  }

  const ip = clientIp(req);
  if (isRateLimited(ip)) {
    res.setHeader('Retry-After', '1');
    res.status(429).json({ error: 'Too many requests' });
    return;
  }

  const body = parseBody(req.body);
  if (!isAdvisorRequestBody(body) || JSON.stringify(body).length > 24_000) {
    res.status(400).json({ error: 'Invalid position data' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'OPENAI_API_KEY is not configured' });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18_000);

  try {
    const openAiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5.4-mini',
        store: false,
        instructions: SYSTEM_PROMPT,
        input: JSON.stringify(body),
        max_output_tokens: 320,
        text: {
          format: {
            type: 'json_schema',
            name: 'shogiman_advice',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                summary: { type: 'string', minLength: 1, maxLength: 220 },
                bullets: {
                  type: 'array',
                  minItems: 2,
                  maxItems: 4,
                  items: { type: 'string', minLength: 1, maxLength: 220 },
                },
              },
              required: ['summary', 'bullets'],
            },
          },
        },
      }),
      signal: controller.signal,
    });

    if (!openAiResponse.ok) {
      console.error('OpenAI Responses API error:', openAiResponse.status);
      res.status(502).json({ error: 'AI advisor is temporarily unavailable' });
      return;
    }

    const payload: unknown = await openAiResponse.json();
    const outputText = extractOutputText(payload);
    if (!outputText) {
      res.status(502).json({ error: 'AI advisor returned no text' });
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(outputText) as unknown;
    } catch {
      res.status(502).json({ error: 'AI advisor returned invalid JSON' });
      return;
    }

    const advice = sanitizeAdvice(parsed);
    if (!advice) {
      res.status(502).json({ error: 'AI advisor returned invalid advice' });
      return;
    }

    res.status(200).json({ ...advice, model: 'gpt-5.4-mini' });
  } catch (error) {
    const message = error instanceof Error ? error.name : 'UnknownError';
    console.error('AI advisor request failed:', message);
    res.status(502).json({ error: 'AI advisor is temporarily unavailable' });
  } finally {
    clearTimeout(timeout);
  }
}
