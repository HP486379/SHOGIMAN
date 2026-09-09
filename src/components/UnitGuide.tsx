import { PieceType } from '../types/shogi';
import { getBattlefieldPieceTypeIcon } from '../assets/battlefieldUnitIcons';
import { PIECE_KANJI } from '../utils/pieceLabels';

interface UnitGuideProps {
  activePieceType: PieceType | null;
}

const UNITS: Array<{ type: PieceType; code: string; name: string; english: string }> = [
  { type: 'pawn', code: 'INF', name: '歩兵', english: 'INFANTRY' },
  { type: 'lance', code: 'ART', name: '自走砲', english: 'ARTILLERY' },
  { type: 'knight', code: 'DRN', name: 'ドローン', english: 'DRONE' },
  { type: 'silver', code: 'SPC', name: '特殊部隊', english: 'SPECIAL FORCE' },
  { type: 'gold', code: 'GRD', name: '近衛兵', english: 'GUARD' },
  { type: 'bishop', code: 'RKT', name: 'ロケット砲', english: 'ROCKET LAUNCHER' },
  { type: 'rook', code: 'TNK', name: '戦車', english: 'TANK' },
  { type: 'king', code: 'HQ', name: '司令部', english: 'HEADQUARTERS' },
];

export function UnitGuide({ activePieceType }: UnitGuideProps) {
  return (
    <aside className="unit-guide" aria-label="Unit guide">
      <div className="unit-guide-frame">
        <h2 className="unit-guide-title">★ UNIT GUIDE ★</h2>
        <div className="unit-guide-subtitle">駒対応図</div>
        <div className="unit-guide-grid">
          {UNITS.map(unit => (
            <div key={unit.type} className={`unit-guide-card ${activePieceType === unit.type ? 'unit-guide-card-active' : ''}`}>
              <div className="unit-guide-kanji">{PIECE_KANJI[unit.type]}</div>
              <div className="unit-guide-image-box">
                <img className="unit-guide-image" src={getBattlefieldPieceTypeIcon(unit.type)} alt="" draggable={false} />
              </div>
              <div className="unit-guide-copy">
                <div className="unit-guide-main">{unit.code}</div>
                <div className="unit-guide-ja">{unit.name}</div>
                <div className="unit-guide-en">{unit.english}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
