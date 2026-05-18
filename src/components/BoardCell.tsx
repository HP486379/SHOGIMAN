import { Piece, EffectCell, Position, PieceType } from '../types/shogi';
import { getUnitIcon } from '../assets/unitIcons';

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
  effect: EffectCell | null;
  showCaptureExplosion: boolean;
  onClick: (pos: Position) => void;
}

function getEffectClass(effect: EffectCell): string {
  const base = `effect-cell effect-${effect.kind}`;
  const delay = `delay-${Math.min(effect.distance, 8)}`;
  return `${base} ${delay}`;
}

export function BoardCell({ row, col, piece, isSelected, effect, showCaptureExplosion, onClick }: BoardCellProps) {
  const isLight = (row + col) % 2 === 0;
  const selectedPieceClass = isSelected ? 'piece-selected' : '';
  const promotedPieceClass = piece?.promoted ? 'piece-promoted' : '';
  const sideClass = piece?.player === 'white' ? 'unit-cpu' : 'unit-player';

  return (
    <div
      className={`board-cell ${isLight ? 'cell-light' : 'cell-dark'} ${isSelected ? 'cell-selected' : ''}`}
      onClick={() => onClick({ row, col })}
    >
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
        <div
          className={`piece unit-piece ${sideClass} ${selectedPieceClass} ${promotedPieceClass}`}
        >
          <img className="unit-icon" src={getUnitIcon(piece)} alt="" draggable={false} />
          <span className="unit-type-label">{UNIT_LABELS[piece.type]}</span>
          {piece.promoted && <span className="unit-promoted-badge">UP</span>}
        </div>
      )}
      {!piece && !effect && (
        <div className="cell-empty" />
      )}
    </div>
  );
}