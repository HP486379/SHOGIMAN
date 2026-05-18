import { PieceType } from '../types/shogi';
import { getBattlefieldPieceTypeIcon } from '../assets/battlefieldUnitIcons';

interface UnitGuideItem {
  pieceType: PieceType;
  shogi: string;
  code: string;
  ja: string;
  en: string;
}

const GUIDE_ITEMS: UnitGuideItem[] = [
  { pieceType: 'pawn', shogi: '歩', code: 'INF', ja: '歩兵', en: 'INFANTRY' },
  { pieceType: 'lance', shogi: '香', code: 'ART', ja: '自走砲', en: 'ARTILLERY' },
  { pieceType: 'knight', shogi: '桂', code: 'DRN', ja: 'ドローン', en: 'DRONE' },
  { pieceType: 'silver', shogi: '銀', code: 'SPC', ja: '特殊部隊', en: 'SPECIAL FORCES' },
  { pieceType: 'gold', shogi: '金', code: 'GRD', ja: '近衛兵', en: 'GUARD' },
  { pieceType: 'bishop', shogi: '角', code: 'RKT', ja: 'ロケット砲', en: 'ROCKET LAUNCHER' },
  { pieceType: 'rook', shogi: '飛', code: 'TNK', ja: '戦車', en: 'TANK' },
  { pieceType: 'king', shogi: '王', code: 'HQ', ja: '司令部', en: 'HEADQUARTERS' },
];

export function UnitGuide() {
  return (
    <aside className="unit-guide" aria-label="Unit guide">
      <div className="unit-guide-frame">
        <div className="unit-guide-title">★ UNIT GUIDE ★</div>
        <div className="unit-guide-subtitle">駒対応図</div>
        <div className="unit-guide-grid">
          {GUIDE_ITEMS.map(item => (
            <div key={item.pieceType} className="unit-guide-card">
              <div className="unit-guide-image-box">
                <img
                  className="unit-guide-image"
                  src={getBattlefieldPieceTypeIcon(item.pieceType)}
                  alt={`${item.ja} icon`}
                  draggable={false}
                />
              </div>
              <div className="unit-guide-copy">
                <div className="unit-guide-main">{item.shogi} / {item.code}</div>
                <div className="unit-guide-ja">{item.ja}</div>
                <div className="unit-guide-en">{item.en}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
