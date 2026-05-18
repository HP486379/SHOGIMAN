import { CpuLevel } from '../types/shogi';

interface OpeningScreenProps {
  cpuLevel: CpuLevel;
  onCpuLevelChange: (level: CpuLevel) => void;
  onStart: () => void;
}

export function OpeningScreen({ cpuLevel, onCpuLevelChange, onStart }: OpeningScreenProps) {
  return (
    <div className="opening-screen">
      <div className="opening-panel">
        <div className="opening-title">★ SHOGIMAN ★</div>
        <div className="opening-subtitle">FAMICOM SHOGI BLAST</div>
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
        <div className="opening-help">SELECT CPU LEVEL → START</div>
      </div>
    </div>
  );
}
