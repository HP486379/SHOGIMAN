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

interface AdvisorResult {
  summary: string;
  bullets: string[];
}

const PIECE_TYPES = new Set<PieceType>([
  'king', 'rook', 'bishop', 'gold', 'silver', 'knight', 'lance', 'pawn',
]);
const PLAYERS = new Set<Player>(['black', 'white']);
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 30;
const MIN_INTERVAL_MS = 700;
const rateBuckets = new Map<string, { windowStart: number; count: number; lastAt: number }>();

const UNIT_NAMES_JA: Record<PieceType, string> = {
  king: '司令部',
  rook: '戦車',
  bishop: 'ロケット砲',
  gold: '近衛兵',
  silver: '特殊部隊',
  knight: 'ドローン',
  lance: '自走砲',
  pawn: '歩兵',
};

const UNIT_NAMES_EN: Record<PieceType, string> = {
  king: 'HQ',
  rook: 'Tank',
  bishop: 'Rocket Launcher',
  gold: 'Guard',
  silver: 'Special Forces',
  knight: 'Drone',
  lance: 'Artillery',
  pawn: 'Infantry',
};

const SYSTEM_PROMPT = `# Role
You are the tactical field advisor in SHOGI FRONTLINE. The rules are based on shogi, but your visible language must stay inside SHOGI FRONTLINE's military setting.
Black = human 1P and starts from the bottom side. White = CPU and starts from the top side.
The board is a 9x9 nested array. Array row 0 is the CPU home side and row 8 is the 1P home side.

# Response rules
- Analyze only the supplied position and advise from 1P's perspective.
- Ground every observation in the supplied board, reserve units, turn, and HQ attack status.
- Do not invent a promotion/upgrade, capture, direct HQ attack, unit count, or exact legal move.
- Do not claim a unit is upgraded unless its upgraded field is true.
- Prefer broad tactical language such as left flank, center, right flank, frontline, home area, enemy area, attack route, retreat route, and reserve units.
- Never use numbered shogi coordinates such as 7筋 or 1段目. Do not use 筋/段 notation at all.
- The summary is one short sentence. Return 2 to 4 short bullet points. No markdown.

# Japanese vocabulary rules
When language=ja, use ONLY these unit names when referring to units:
司令部 / 戦車 / ロケット砲 / 近衛兵 / 特殊部隊 / ドローン / 自走砲 / 歩兵.
For an upgraded unit, say 強化戦車, 強化ロケット砲, 強化特殊部隊, 強化ドローン, 強化自走砲, or 強化歩兵 as appropriate.
Do NOT use conventional shogi vocabulary in the visible answer. Forbidden examples include 王, 玉, 飛車, 角, 金, 銀, 桂, 香, 歩 by itself, と金, 馬, 龍, 竜, 成り, 王手, 玉頭, 駒, 持ち駒, and numbered 筋/段 notation.
Say 司令部への直接攻撃 instead of 王手, and 予備戦力 instead of 持ち駒.
Write natural Japanese with a military operations tone, not textbook shogi commentary.

# English vocabulary rules
When language=en, use only HQ, Tank, Rocket Launcher, Guard, Special Forces, Drone, Artillery, and Infantry for unit names. Prefer military positional language over traditional shogi jargon.`;

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

function buildModelInput(body: AdvisorRequestBody): unknown {
  const names = body.language === 'ja' ? UNIT_NAMES_JA : UNIT_NAMES_EN;
  const sideName = (player: Player) => player === 'black' ? '1P' : 'CPU';
  const attackStatus = body.checkPlayer === null
    ? 'none'
    : body.checkPlayer === 'black'
      ? '1P_HQ_under_direct_attack'
      : 'CPU_HQ_under_direct_attack';

  return {
    language: body.language,
    perspective: '1P',
    currentTurn: sideName(body.currentPlayer),
    hqAttackStatus: attackStatus,
    lastActionBy: body.lastMovePlayer ? sideName(body.lastMovePlayer) : 'none',
    board: body.board.map(row => row.map(piece => piece ? {
      side: sideName(piece.player),
      unit: names[piece.type],
      upgraded: Boolean(piece.promoted),
    } : null)),
    reserveUnits: {
      '1P': body.hands.black.map(piece => names[piece]),
      'CPU': body.hands.white.map(piece => names[piece]),
    },
  };
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

function sanitizeAdvice(value: unknown): AdvisorResult | null {
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

function containsForbiddenJapaneseVocabulary(advice: AdvisorResult): boolean {
  const text = [advice.summary, ...advice.bullets].join('\n');
  return /[王玉飛角金銀桂香馬竜龍駒]|歩(?!兵)|成り|[1-9一二三四五六七八九]筋|[1-9一二三四五六七八九]段(?:目)?/.test(text);
}

async function requestAdvice(
  apiKey: string,
  input: unknown,
  instructions: string,
  signal: AbortSignal,
): Promise<AdvisorResult | null> {
  const openAiResponse = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5.4-mini',
      store: false,
      instructions,
      input: JSON.stringify(input),
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
    signal,
  });

  if (!openAiResponse.ok) {
    console.error('OpenAI Responses API error:', openAiResponse.status);
    return null;
  }

  const payload: unknown = await openAiResponse.json();
  const outputText = extractOutputText(payload);
  if (!outputText) return null;

  try {
    return sanitizeAdvice(JSON.parse(outputText) as unknown);
  } catch {
    return null;
  }
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
    const modelInput = buildModelInput(body);
    let advice = await requestAdvice(apiKey, modelInput, SYSTEM_PROMPT, controller.signal);

    if (advice && body.language === 'ja' && containsForbiddenJapaneseVocabulary(advice)) {
      const repairPrompt = `${SYSTEM_PROMPT}\n\n# Rewrite requirement\nThe previous draft violated the Japanese vocabulary rules. Rewrite it from the same position data. Remove every conventional shogi term and every numbered 筋/段 reference. Preserve only observations that are directly supported by the position.`;
      advice = await requestAdvice(
        apiKey,
        { position: modelInput, previousDraft: advice },
        repairPrompt,
        controller.signal,
      );
    }

    if (!advice || (body.language === 'ja' && containsForbiddenJapaneseVocabulary(advice))) {
      res.status(502).json({ error: 'AI advisor returned off-theme advice' });
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
