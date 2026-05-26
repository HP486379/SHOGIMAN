import { BoardGrid, HandPieces, Player } from '../types/shogi';
import { buildAiAdvice } from '../utils/aiAdvisor';

interface AiAdvisorProps {
  board: BoardGrid;
  hands: HandPieces;
  currentPlayer: Player;
  checkPlayer: Player | null;
  lastMovePlayer: Player | null;
}

export function AiAdvisor({ board, hands, currentPlayer, checkPlayer, lastMovePlayer }: AiAdvisorProps) {
  const advice = buildAiAdvice(board, hands, currentPlayer, checkPlayer, lastMovePlayer);

  return (
    <section className={`ai-advisor ${checkPlayer ? 'ai-advisor-alert' : ''}`}>
      <div className="ai-advisor-header">
        <span className="ai-advisor-title">{advice.title}</span>
        <span className="ai-advisor-score">{advice.scoreLabel}</span>
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
