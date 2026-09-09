import { BoardGrid, HandPieces, Player } from '../types/shogi';
import { AdvisorLanguage } from './aiAdvisor';

export interface OpenAiAdvice {
  summary: string;
  bullets: string[];
  model: string;
}

interface OpenAiAdviceRequest {
  board: BoardGrid;
  hands: HandPieces;
  currentPlayer: Player;
  checkPlayer: Player | null;
  lastMovePlayer: Player | null;
  language: AdvisorLanguage;
}

const CACHE_LIMIT = 24;
const adviceCache = new Map<string, OpenAiAdvice>();

function cacheKey(input: OpenAiAdviceRequest): string {
  return JSON.stringify(input);
}

function remember(key: string, advice: OpenAiAdvice) {
  if (adviceCache.size >= CACHE_LIMIT) {
    const oldestKey = adviceCache.keys().next().value;
    if (oldestKey) adviceCache.delete(oldestKey);
  }
  adviceCache.set(key, advice);
}

function isAdvice(value: unknown): value is OpenAiAdvice {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.summary === 'string' &&
    Array.isArray(candidate.bullets) &&
    candidate.bullets.length > 0 &&
    candidate.bullets.every(item => typeof item === 'string') &&
    typeof candidate.model === 'string'
  );
}

export async function requestOpenAiAdvice(
  input: OpenAiAdviceRequest,
  signal?: AbortSignal,
): Promise<OpenAiAdvice> {
  const key = cacheKey(input);
  const cached = adviceCache.get(key);
  if (cached) return cached;

  const response = await fetch('/api/advice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal,
  });

  if (!response.ok) {
    throw new Error(`AI advisor request failed (${response.status})`);
  }

  const payload: unknown = await response.json();
  if (!isAdvice(payload)) {
    throw new Error('AI advisor returned an invalid response');
  }

  const advice: OpenAiAdvice = {
    summary: payload.summary,
    bullets: payload.bullets.slice(0, 4),
    model: payload.model,
  };
  remember(key, advice);
  return advice;
}
