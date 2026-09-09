import { DisplayMode, Piece, EffectCell, Position, PieceType } from '../types/shogi';
import { getBattlefieldUnitIcon } from '../assets/battlefieldUnitIcons';
import { PIECE_KANJI } from '../utils/pieceLabels';

const UNIT_LABELS: Record<PieceType, string> = {
  pawn: 'INF',
  lance: 'ART',
  knight: 'DRN',
  silver: 'SPC',
  gold: 'GRD',
  bishop: 'RKT',
  rook: 'TNK',
  king: 'HQ',
};

interface BoardCellProps {
  row: number;
  col: number;
  piece: Piece | null;
  isSelected: boolean;
  isLastMoveFrom: boolean;
  isLastMoveTo: boolean;
  isCheckedKing: boolean;
  effect: EffectCell | null;
  showCaptureExplosion: boolean;
  displayMode: DisplayMode;
  onClick: (pos: Position) => void;
}

function getEffectClass(effect: EffectCell): string {
  const base = `effect-cell effect-${effect.kind}`;
  const delay = `delay-${Math.min(effect.distance, 8)}`;
  return `${base} ${delay}`;
}

export function BoardCell({ row, col, piece, isSelected, isLastMoveFrom, isLastMoveTo, isCheckedKing, effect, showCaptureExplosion, displayMode, onClick }: BoardCellProps) {
  const isLight = (row + col) % 2 === 0;
  const selectedPieceClass = isSelected ? 'piece-selected' : '';
  const checkedKingClass = isCheckedKing ? 'piece-check-target' : '';
  const promotedPieceClass = piece?.promoted ? 'piece-promoted' : '';
  const sideClass = piece?.player === 'white' ? 'unit-cpu' : 'unit-player';

  return (
    <div
      className={`board-cell ${isLight ? 'cell-light' : 'cell-dark'} ${isSelected ? 'cell-selected' : ''} ${isLastMoveFrom ? 'cell-last-from' : ''} ${isLastMoveTo ? 'cell-last-to' : ''} ${isCheckedKing ? 'cell-check-target' : ''}`}
      onClick={() => onClick({ row, col })}
    >
      {isLastMoveTo && <span className="last-move-beacon" aria-hidden="true">LAST</span>}
      {isLastMoveFrom && <span className="last-move-tail" aria-hidden="true" />}
      {effect && (
        <div className={getEffectClass(effect)}>
          {effect.kind === 'capture' && <span className="capture-symbol">✕</span>}
          {effect.kind === 'cross' && <span className="flame-symbol">╋</span>}
          {effect.kind === 'diagonal' && <span className="flame-symbol">✦</span>}
          {effect.kind === 'flame' && <span className="flame-symbol">◆</span>}
        </div>
      )}
      {showCaptureExplosion && (
        <div className="bomb-explosion" aria-hidden="true">
          <span className="bomb-core">●</span>
          <span className="bomb-spark spark-1">✹</span>
          <span className="bomb-spark spark-2">✸</span>
          <span className="bomb-spark spark-3">✹</span>
        </div>
      )}
      {piece && (
        <>
          <div className={`piece unit-piece piece-mode-${displayMode} ${sideClass} ${selectedPieceClass} ${checkedKingClass} ${promotedPieceClass}`}>
            {displayMode !== 'shogi' && <img className="unit-icon" src={getBattlefieldUnitIcon(piece)} alt="" draggable={false} />}
            {displayMode === 'military' && <span className="unit-type-label">{UNIT_LABELS[piece.type]}</span>}
            {displayMode === 'shogi' && <span className="unit-kanji-label" aria-hidden="true">{PIECE_KANJI[piece.type]}</span>}
            {piece.promoted && <span className="unit-promoted-badge">UP</span>}
          </div>

          {displayMode === 'hybrid' && (
            <>
              <span
                className={`hybrid-kanji-label ${piece.player === 'white' ? 'hybrid-kanji-cpu' : 'hybrid-kanji-player'}`}
                aria-hidden="true"
              >
                {PIECE_KANJI[piece.type]}
              </span>
              <span
                className={`hybrid-code-label ${piece.player === 'white' ? 'hybrid-code-cpu' : 'hybrid-code-player'}`}
                aria-hidden="true"
              >
                {UNIT_LABELS[piece.type]}
              </span>
            </>
          )}
        </>
      )}
      {!piece && !effect && <div className="cell-empty" />}
    </div>
  );
}
