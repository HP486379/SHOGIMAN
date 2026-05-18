export function Controls() {
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
        <div className="controls-guide">
          <span className="guide-item">▶ CLICK PIECE → SELECT</span>
          <span className="guide-item">▶ CLICK HIGHLIGHT → MOVE</span>
          <span className="guide-item">▶ 1P = BLACK ／ CPU = WHITE</span>
        </div>
      </div>
    </div>
  );
}
