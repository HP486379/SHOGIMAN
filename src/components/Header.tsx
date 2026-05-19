interface HeaderProps {
  moveCount: number;
  currentPlayer: 'black' | 'white';
  seEnabled: boolean;
  onToggleSE: () => void;
  onReset: () => void;
}

export function Header({ moveCount, currentPlayer, seEnabled, onToggleSE, onReset }: HeaderProps) {
  return (
    <div className="header-bar">
      <div className="header-inner">
        <div className="header-title">
          <span className="title-main">★ SHOGI FRONTLINE ★</span>
          <span className="title-sub">将棋戦線 / 1P VS CPU</span>
        </div>
        <div className="header-stats">
          <div className="stat-block">
            <span className="stat-label">TURN</span>
            <span className={`stat-value ${currentPlayer === 'black' ? 'player-color' : 'cpu-color'}`}>
              {currentPlayer === 'black' ? '1P' : 'CPU'}
            </span>
          </div>
          <div className="stat-block">
            <span className="stat-label">MOVES</span>
            <span className="stat-value stat-moves">{String(moveCount).padStart(3, '0')}</span>
          </div>
          <div className="stat-block">
            <span className="stat-label">SCORE</span>
            <span className="stat-value stat-score">{String(moveCount * 100).padStart(6, '0')}</span>
          </div>
        </div>
        <div className="header-buttons">
          <button
            className="retro-btn se-btn"
            onClick={onToggleSE}
          >
            SE: {seEnabled ? 'ON' : 'OFF'}
          </button>
          <button
            className="retro-btn reset-btn"
            onClick={onReset}
          >
            RESET
          </button>
        </div>
      </div>
    </div>
  );
}