import { BoardGrid, HandPieces, Player } from '../types/shogi';
import { AdvisorLanguage, buildAiAdvice } from '../utils/aiAdvisor';

interface AiAdvisorProps {
  board: BoardGrid;
  hands: HandPieces;
  currentPlayer: Player;
  checkPlayer: Player | null;
  lastMovePlayer: Player | null;
  language: AdvisorLanguage;
  onLanguageChange: (language: AdvisorLanguage) => void;
}

export function AiAdvisor({
  board,
  hands,
  currentPlayer,
  checkPlayer,
  lastMovePlayer,
  language,
  onLanguageChange,
}: AiAdvisorProps) {
  const advice = buildAiAdvice(board, hands, currentPlayer, checkPlayer, lastMovePlayer, language);

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
