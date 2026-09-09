import { useEffect, useMemo, useState } from 'react';
import { BoardGrid, HandPieces, Player } from '../types/shogi';
import { AdvisorLanguage, buildAiAdvice } from '../utils/aiAdvisor';
import { OpenAiAdvice, requestOpenAiAdvice } from '../utils/openAiAdvisor';

interface AiAdvisorProps {
  board: BoardGrid;
  hands: HandPieces;
  currentPlayer: Player;
  checkPlayer: Player | null;
  lastMovePlayer: Player | null;
  language: AdvisorLanguage;
  onLanguageChange: (language: AdvisorLanguage) => void;
}

type AdvisorSource = 'loading' | 'openai' | 'local' | 'error';

export function AiAdvisor({
  board,
  hands,
  currentPlayer,
  checkPlayer,
  lastMovePlayer,
  language,
  onLanguageChange,
}: AiAdvisorProps) {
  const localAdvice = useMemo(
    () => buildAiAdvice(board, hands, currentPlayer, checkPlayer, lastMovePlayer, language),
    [board, hands, currentPlayer, checkPlayer, lastMovePlayer, language],
  );
  const [remoteAdvice, setRemoteAdvice] = useState<OpenAiAdvice | null>(null);
  const [source, setSource] = useState<AdvisorSource>('loading');

  useEffect(() => {
    setRemoteAdvice(null);

    // Advice is for the human player, so call OpenAI when the board has settled on 1P's turn.
    // During the CPU turn the deterministic local advisor remains available immediately.
    if (currentPlayer !== 'black') {
      setSource('local');
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setSource('loading');
      void requestOpenAiAdvice(
        { board, hands, currentPlayer, checkPlayer, lastMovePlayer, language },
        controller.signal,
      )
        .then(advice => {
          if (controller.signal.aborted) return;
          setRemoteAdvice(advice);
          setSource('openai');
        })
        .catch(error => {
          if (controller.signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) return;
          setSource('error');
        });
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [board, hands, currentPlayer, checkPlayer, lastMovePlayer, language]);

  const advice = remoteAdvice
    ? { ...localAdvice, summary: remoteAdvice.summary, bullets: remoteAdvice.bullets }
    : localAdvice;

  const sourceLabel = source === 'openai'
    ? 'GPT-5.4 MINI'
    : source === 'loading'
      ? 'AI...'
      : source === 'error'
        ? 'LOCAL / API ERR'
        : 'LOCAL';

  return (
    <section className={`ai-advisor ${checkPlayer ? 'ai-advisor-alert' : ''}`}>
      <div className="ai-advisor-header">
        <span className="ai-advisor-title">{advice.title}</span>
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
          <span className="ai-advisor-score">{advice.scoreLabel}</span>
        </div>
      </div>
      <p className="ai-advisor-summary">{advice.summary}</p>
      <ul className="ai-advisor-list">
        {advice.bullets.map((bullet, index) => (
          <li key={`${index}-${bullet}`}>{bullet}</li>
        ))}
      </ul>
    </section>
  );
}
