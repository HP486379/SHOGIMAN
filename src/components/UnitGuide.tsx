import { PieceType } from '../types/shogi';
import { UNIT_GUIDE_PANEL_IMAGE } from '../assets/unitGuidePanelImage';

interface UnitGuideProps {
  activePieceType: PieceType | null;
}

const GUIDE_HIGHLIGHT_CLASS: Record<PieceType, string> = {
  pawn: 'guide-highlight-pawn',
  lance: 'guide-highlight-lance',
  knight: 'guide-highlight-knight',
  silver: 'guide-highlight-silver',
  gold: 'guide-highlight-gold',
  bishop: 'guide-highlight-bishop',
  rook: 'guide-highlight-rook',
  king: 'guide-highlight-king',
};

export function UnitGuide({ activePieceType }: UnitGuideProps) {
  return (
    <aside className="unit-guide unit-guide-image-only" aria-label="Unit guide">
      <div className="unit-guide-panel-wrap">
        <img
          className="unit-guide-panel-image"
          src={UNIT_GUIDE_PANEL_IMAGE}
          alt="UNIT GUIDE 駒対応図"
          draggable={false}
        />
        {activePieceType && (
          <span
            className={`unit-guide-active-highlight ${GUIDE_HIGHLIGHT_CLASS[activePieceType]}`}
            aria-hidden="true"
          />
        )}
      </div>
    </aside>
  );
}
