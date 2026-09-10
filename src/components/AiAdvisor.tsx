import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BoardGrid, HandPieces, Player } from '../types/shogi';
import { AdvisorLanguage, buildAiAdvice } from '../utils/aiAdvisor';
import { AdvisorTrigger, OpenAiAdvice, requestOpenAiAdvice } from '../utils/openAiAdvisor';

interface AiAdvisorProps {
  board: BoardGrid;
  hands: HandPieces;
  currentPlayer: Player;
  checkPlayer: Player | null;
  lastMovePlayer: Player | null;
  moveCount: number;
  promotionPending: boolean;
  language: AdvisorLanguage;
  onLanguageChange: (language: AdvisorLanguage) => void;
}

type AdvisorSource = 'idle' | 'loading' | 'openai' | 'error';
type AutoEvent = Exclude<AdvisorTrigger, 'manual' | 'periodic' | 'multiple'>;

const AUTO_INTERVAL_MOVES = 5;
const INCOMING_PULSE_MS = 1400;
const SCORE_RANK: Record<string, number> = {
  'CPU ADVANTAGE': -2,
  'CPU SLIGHT LEAD': -1,
  BALANCED: 0,
  '1P SLIGHT LEAD': 1,
  '1P ADVANTAGE': 2,
};

function promotedCount(board: BoardGrid): number {
  let count = 0;
  board.forEach(row => row.forEach(piece => {
    if (piece?.promoted) count += 1;
  }));
  return count;
}

function scoreShiftedSignificantly(previous: string, current: string): boolean {
  const before = SCORE_RANK[previous];
  const after = SCORE_RANK[current];
  if (before === undefined || after === undefined) return false;
  return Math.abs(after - before) >= 2;
}

function chooseTrigger(events: Set<AutoEvent>, periodic: boolean): AdvisorTrigger | null {
  if (events.size > 1) return 'multiple';
  if (events.has('hq_attack')) return 'hq_attack';
  if (events.has('promotion')) return 'promotion';
  if (events.has('capture')) return 'capture';
  if (events.has('evaluation_swing')) return 'evaluation_swing';
  if (periodic) return 'periodic';
  return null;
}

export function AiAdvisor({
  board,
  hands,
  currentPlayer,
  checkPlayer,
  lastMovePlayer,
  moveCount,
  promotionPending,
  language,
  onLanguageChange,
}: AiAdvisorProps) {
  const localAdvice = useMemo(
    () => buildAiAdvice(board, hands, currentPlayer, checkPlayer, lastMovePlayer, language),
    [board, hands, currentPlayer, checkPlayer, lastMovePlayer, language],
  );
  const [remoteAdvice, setRemoteAdvice] = useState<OpenAiAdvice | null>(null);
  const [source, setSource] = useState<AdvisorSource>('idle');
  const [incomingPulse, setIncomingPulse] = useState(false);
  const previousBoardRef = useRef<BoardGrid>(board);
  const previousHandsRef = useRef<HandPieces>(hands);
  const previousCheckRef = useRef<Player | null>(checkPlayer);
  const previousScoreRef = useRef(localAdvice.scoreLabel);
  const previousMoveCountRef = useRef(moveCount);
  const pendingEventsRef = useRef<Set<AutoEvent>>(new Set());
  const lastAdviceMoveRef = useRef(0);
  const requestControllerRef = useRef<AbortController | null>(null);
  const pulseTimerRef = useRef<number | null>(null);

  const stopIncomingPulse = useCallback(() => {
    if (pulseTimerRef.current !== null) {
      window.clearTimeout(pulseTimerRef.current);
      pulseTimerRef.current = null;
    }
    setIncomingPulse(false);
  }, []);

  const startIncomingPulse = useCallback(() => {
    if (pulseTimerRef.current !== null) {
      window.clearTimeout(pulseTimerRef.current);
    }
    setIncomingPulse(true);
    pulseTimerRef.current = window.setTimeout(() => {
      setIncomingPulse(false);
      pulseTimerRef.current = null;
    }, INCOMING_PULSE_MS);
  }, []);

  const runAnalysis = useCallback((trigger: AdvisorTrigger) => {
    if (currentPlayer !== 'black' || promotionPending) return;

    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    lastAdviceMoveRef.current = moveCount;
    setSource('loading');

    void requestOpenAiAdvice(
      { board, hands, currentPlayer, checkPlayer, lastMovePlayer, language, trigger },
      controller.signal,
    )
      .then(advice => {
        if (controller.signal.aborted) return;
        setRemoteAdvice(advice);
        setSource('openai');
        if (trigger !== 'manual') {
          startIncomingPulse();
        }
      })
      .catch(error => {
        if (controller.signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) return;
        setSource('error');
      });
  }, [board, hands, currentPlayer, checkPlayer, lastMovePlayer, language, moveCount, promotionPending, startIncomingPulse]);

  useEffect(() => {
    const previousMoveCount = previousMoveCountRef.current;
    const didReset = moveCount < previousMoveCount || (moveCount === 0 && previousMoveCount !== 0);

    if (didReset) {
      requestControllerRef.current?.abort();
      pendingEventsRef.current.clear();
      lastAdviceMoveRef.current = 0;
      setRemoteAdvice(null);
      setSource('idle');
      stopIncomingPulse();
      previousBoardRef.current = board;
      previousHandsRef.current = hands;
      previousCheckRef.current = checkPlayer;
      previousScoreRef.current = localAdvice.scoreLabel;
      previousMoveCountRef.current = moveCount;
      return;
    }

    if (moveCount !== previousMoveCount) {
      requestControllerRef.current?.abort();
      setRemoteAdvice(null);
      setSource('idle');

      const previousHands = previousHandsRef.current;
      if (hands.black.length > previousHands.black.length || hands.white.length > previousHands.white.length) {
        pendingEventsRef.current.add('capture');
      }

      if (promotedCount(board) > promotedCount(previousBoardRef.current)) {
        pendingEventsRef.current.add('promotion');
      }

      if (checkPlayer && checkPlayer !== previousCheckRef.current) {
        pendingEventsRef.current.add('hq_attack');
      }

      if (scoreShiftedSignificantly(previousScoreRef.current, localAdvice.scoreLabel)) {
        pendingEventsRef.current.add('evaluation_swing');
      }

      previousBoardRef.current = board;
      previousHandsRef.current = hands;
      previousCheckRef.current = checkPlayer;
      previousScoreRef.current = localAdvice.scoreLabel;
      previousMoveCountRef.current = moveCount;
    }

    if (currentPlayer !== 'black' || promotionPending || moveCount === 0) return;

    const periodic = moveCount - lastAdviceMoveRef.current >= AUTO_INTERVAL_MOVES;
    const trigger = chooseTrigger(pendingEventsRef.current, periodic);
    if (!trigger) return;

    pendingEventsRef.current.clear();
    const timer = window.setTimeout(() => runAnalysis(trigger), 220);
    return () => window.clearTimeout(timer);
  }, [board, hands, currentPlayer, checkPlayer, localAdvice.scoreLabel, moveCount, promotionPending, runAnalysis, stopIncomingPulse]);

  useEffect(() => {
    requestControllerRef.current?.abort();
    setRemoteAdvice(null);
    setSource('idle');
    stopIncomingPulse();
  }, [language, stopIncomingPulse]);

  useEffect(() => () => {
    requestControllerRef.current?.abort();
    if (pulseTimerRef.current !== null) {
      window.clearTimeout(pulseTimerRef.current);
    }
  }, []);

  const sourceLabel = source === 'openai'
    ? 'GPT-5.4 MINI'
    : source === 'loading'
      ? 'ANALYZING...'
      : source === 'error'
        ? 'API ERR'
        : 'STANDBY';

  const idleText = language === 'ja'
    ? '重要な局面変化を検知した時だけAI参謀が介入します。'
    : 'AI advice appears only when the position changes meaningfully.';
  const waitingText = language === 'ja'
    ? 'CPU行動中。分析は1Pの手番で実行できます。'
    : 'CPU is moving. Analysis is available on 1P turn.';
  const promotionText = language === 'ja'
    ? '成るかどうかを決めた後に局面を分析します。'
    : 'Choose whether to upgrade before analyzing the position.';
  const errorText = language === 'ja'
    ? 'AI分析に失敗しました。必要ならANALYZEでもう一度実行できます。'
    : 'AI analysis failed. Use ANALYZE to try again.';

  return (
    <section className={`ai-advisor ${checkPlayer ? 'ai-advisor-alert' : ''} ${incomingPulse ? 'ai-advisor-incoming' : ''}`}>
      <div className="ai-advisor-header">
        <span className="ai-advisor-title">{localAdvice.title}</span>
        <div className="ai-advisor-actions">
          <button
            type="button"
            className={`ai-lang-btn ${language === 'ja' ? 'active' : ''}`}
            onClick={() => onLanguageChange('ja')}
          >
            JP
          </button>
          <button
            type="button"
            className={`ai-lang-btn ${language === 'en' ? 'active' : ''}`}
            onClick={() => onLanguageChange('en')}
          >
            EN
          </button>
          <span className={`ai-advisor-source ai-advisor-source-${source}`}>{sourceLabel}</span>
          <span className="ai-advisor-score">{localAdvice.scoreLabel}</span>
        </div>
      </div>

      {remoteAdvice ? (
        <div className="ai-advisor-message" aria-live="polite">
          <p className="ai-advisor-summary">{remoteAdvice.summary}</p>
          {remoteAdvice.bullets[0] && <p className="ai-advisor-detail">{remoteAdvice.bullets[0]}</p>}
        </div>
      ) : (
        <p className={`ai-advisor-idle ${source === 'error' ? 'ai-advisor-idle-error' : ''}`}>
          {source === 'loading'
            ? (language === 'ja' ? '局面を分析中…' : 'Analyzing position…')
            : source === 'error'
              ? errorText
              : promotionPending
                ? promotionText
                : currentPlayer === 'black'
                  ? idleText
                  : waitingText}
        </p>
      )}

      <button
        type="button"
        className="ai-analyze-btn"
        onClick={() => runAnalysis('manual')}
        disabled={currentPlayer !== 'black' || promotionPending || source === 'loading'}
      >
        {source === 'loading' ? 'ANALYZING...' : 'ANALYZE'}
      </button>
    </section>
  );
}
