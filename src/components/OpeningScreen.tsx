import { CpuLevel, Player } from '../types/shogi';

interface OpeningScreenProps {
  cpuLevel: CpuLevel;
  firstPlayer: Player;
  onCpuLevelChange: (level: CpuLevel) => void;
  onStart: () => void;
}

export function OpeningScreen({ cpuLevel, firstPlayer, onCpuLevelChange, onStart }: OpeningScreenProps) {
  const firstTurnText = firstPlayer === 'black' ? '1P SENTE' : 'CPU SENTE';

  return (
    <div className="opening-screen">
      <div className="opening-panel">
        <div className="opening-title">★ SHOGI FRONTLINE ★</div>
        <div className="opening-subtitle">将棋戦線</div>
        <div className="opening-first-turn">FIRST TURN: {firstTurnText}</div>
        <div className="opening-menu">
          <label className="opening-label" htmlFor="opening-cpu-level">CPU LEVEL</label>
          <select
            id="opening-cpu-level"
            className="opening-select"
            value={cpuLevel}
            onChange={(event) => onCpuLevelChange(event.target.value as CpuLevel)}
          >
            <option value="easy">EASY</option>
            <option value="normal">NORMAL</option>
            <option value="hard">HARD</option>
          </select>
          <button className="retro-btn start-btn" onClick={onStart}>START</button>
        </div>
        <div className="opening-help">SENTE / GOTE IS RANDOM → START</div>
      </div>
    </div>
  );
}
