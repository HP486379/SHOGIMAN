import { UNIT_GUIDE_PANEL_IMAGE } from '../assets/unitGuidePanelImage';

export function UnitGuide() {
  return (
    <aside className="unit-guide unit-guide-image-only" aria-label="Unit guide">
      <img
        className="unit-guide-panel-image"
        src={UNIT_GUIDE_PANEL_IMAGE}
        alt="UNIT GUIDE 駒対応図"
        draggable={false}
      />
    </aside>
  );
}
