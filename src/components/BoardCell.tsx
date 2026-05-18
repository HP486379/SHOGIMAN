import { Piece, EffectCell, Position } from '../types/shogi';
import { getUnitIcon } from '../assets/unitIcons';

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
  const isWhitePiece = piece?.player === 'white';
  const pieceOrientationStyle = isWhitePiece
    ? { transform: 'rotate(180deg)' }
    : undefined;
  const selectedPieceClass = isSelected && !isWhitePiece ? 'piece-selected' : '';
  const promotedPieceClass = piece?.promoted ? 'piece-promoted' : '';

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
          className={`piece unit-piece ${piece.player === 'black' ? 'piece-black' : 'piece-white'} ${selectedPieceClass} ${promotedPieceClass}`}
          style={pieceOrientationStyle}
        >
          <img className="unit-icon" src={getUnitIcon(piece)} alt="" draggable={false} />
          {piece.promoted && <span className="unit-promoted-badge">UP</span>}
        </div>
      )}
      {!piece && !effect && (
        <div className="cell-empty" />
      )}
    </div>
  );
}