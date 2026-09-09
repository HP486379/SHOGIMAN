import { CpuLevel } from '../types/shogi';

interface ControlsProps {
  cpuLevel: CpuLevel;
  showPieceKanji: boolean;
  onCpuLevelChange: (level: CpuLevel) => void;
  onTogglePieceKanji: () => void;
}

export function Controls({ cpuLevel, showPieceKanji, onCpuLevelChange, onTogglePieceKanji }: ControlsProps) {
  return (
    <div className="controls-bar">
      <div className="controls-inner">
        <div className="legend-title">■ LEGEND</div>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-swatch flame-swatch"></span>
            <span>MOVE</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch capture-swatch"></span>
            <span>CAPTURE</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch cross-swatch"></span>
            <span>ROOK BLAST</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch diagonal-swatch"></span>
            <span>BISHOP BLAST</span>
          </div>
        </div>
        <div className="piece-id-box">
          <span className="piece-id-label">PIECE ID</span>
          <button
            type="button"
            className={`retro-btn piece-id-btn ${showPieceKanji ? 'piece-id-on' : 'piece-id-off'}`}
            aria-pressed={showPieceKanji}
            onClick={onTogglePieceKanji}
          >
            {showPieceKanji ? 'ON' : 'OFF'}
          </button>
        </div>
        <div className="cpu-level-box">
          <label className="cpu-level-label" htmlFor="cpu-level-select">CPU LV</label>
          <select
            id="cpu-level-select"
            className="cpu-level-select"
            value={cpuLevel}
            onChange={(event) => onCpuLevelChange(event.target.value as CpuLevel)}
          >
            <option value="easy">EASY</option>
            <option value="normal">NORMAL</option>
            <option value="hard">HARD</option>
          </select>
        </div>
        <div className="controls-guide">
          <span className="guide-item">▶ CLICK PIECE → SELECT</span>
          <span className="guide-item">▶ CLICK HIGHLIGHT → MOVE</span>
          <span className="guide-item">▶ 1P = BLACK ／ CPU = WHITE</span>
        </div>
      </div>
    </div>
  );
}
