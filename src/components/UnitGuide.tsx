import { DisplayMode, PieceType } from '../types/shogi';
import { getBattlefieldPieceTypeIcon } from '../assets/battlefieldUnitIcons';
import { PIECE_KANJI } from '../utils/pieceLabels';

interface UnitGuideProps {
  activePieceType: PieceType | null;
  displayMode: DisplayMode;
}

const UNITS: Array<{
  type: PieceType;
  code: string;
  name: string;
  english: string;
  shogiName: string;
  shogiEnglish: string;
}> = [
  { type: 'pawn', code: 'INF', name: '歩兵', english: 'INFANTRY', shogiName: '歩兵', shogiEnglish: 'PAWN' },
  { type: 'lance', code: 'ART', name: '自走砲', english: 'ARTILLERY', shogiName: '香車', shogiEnglish: 'LANCE' },
  { type: 'knight', code: 'DRN', name: 'ドローン', english: 'DRONE', shogiName: '桂馬', shogiEnglish: 'KNIGHT' },
  { type: 'silver', code: 'SPC', name: '特殊部隊', english: 'SPECIAL FORCE', shogiName: '銀将', shogiEnglish: 'SILVER' },
  { type: 'gold', code: 'GRD', name: '近衛兵', english: 'GUARD', shogiName: '金将', shogiEnglish: 'GOLD' },
  { type: 'bishop', code: 'RKT', name: 'ロケット砲', english: 'ROCKET LAUNCHER', shogiName: '角行', shogiEnglish: 'BISHOP' },
  { type: 'rook', code: 'TNK', name: '戦車', english: 'TANK', shogiName: '飛車', shogiEnglish: 'ROOK' },
  { type: 'king', code: 'HQ', name: '司令部', english: 'HEADQUARTERS', shogiName: '玉将', shogiEnglish: 'KING' },
];

function getGuideHeading(displayMode: DisplayMode) {
  if (displayMode === 'shogi') {
    return { title: '★ SHOGI GUIDE ★', subtitle: '駒一覧' };
  }
  if (displayMode === 'military') {
    return { title: '★ UNIT GUIDE ★', subtitle: '兵科一覧' };
  }
  return { title: '★ UNIT GUIDE ★', subtitle: '駒対応図' };
}

export function UnitGuide({ activePieceType, displayMode }: UnitGuideProps) {
  const heading = getGuideHeading(displayMode);

  return (
    <aside className={`unit-guide unit-guide-mode-${displayMode}`} aria-label="Unit guide">
      <div className="unit-guide-frame">
        <h2 className="unit-guide-title">{heading.title}</h2>
        <div className="unit-guide-subtitle">{heading.subtitle}</div>
        <div className="unit-guide-grid">
          {UNITS.map(unit => (
            <div
              key={unit.type}
              className={`unit-guide-card unit-guide-card-${displayMode} ${activePieceType === unit.type ? 'unit-guide-card-active' : ''}`}
            >
              {displayMode !== 'military' && (
                <div className="unit-guide-kanji">{PIECE_KANJI[unit.type]}</div>
              )}

              {displayMode !== 'shogi' && (
                <div className="unit-guide-image-box">
                  <img
                    className="unit-guide-image"
                    src={getBattlefieldPieceTypeIcon(unit.type)}
                    alt=""
                    draggable={false}
                  />
                </div>
              )}

              <div className="unit-guide-copy">
                {displayMode !== 'shogi' && <div className="unit-guide-main">{unit.code}</div>}
                <div className="unit-guide-ja">
                  {displayMode === 'shogi' ? unit.shogiName : unit.name}
                </div>
                <div className="unit-guide-en">
                  {displayMode === 'shogi' ? unit.shogiEnglish : unit.english}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
