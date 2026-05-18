import { Piece, EffectCell, Position } from '../types/shogi';

const PIECE_KANJI: Record<Piece['type'], string> = {
  king:   '王',
  rook:   '飛',
  bishop: '角',
  gold:   '金',
  silver: '銀',
  knight: '桂',
  lance:  '香',
  pawn:   '歩',
};

interface BoardCellProps {
  row: number;
  col: number;
  piece: Piece | null;
  isSelected: boolean;
  effect: EffectCell | null;
  onClick: (pos: Position) => void;
}

function getEffectClass(effect: EffectCell): string {
  const base = `effect-cell effect-${effect.kind}`;
  const delay = `delay-${Math.min(effect.distance, 8)}`;
  return `${base} ${delay}`;
}

export function BoardCell({ row, col, piece, isSelected, effect, onClick }: BoardCellProps) {
  const isLight = (row + col) % 2 === 0;
  const forceUprightStyle = piece?.player === 'white'
    ? { transform: 'none' }
    : undefined;

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
      {piece && (
        <div
          className={`piece ${piece.player === 'black' ? 'piece-black' : 'piece-white'} ${isSelected ? 'piece-selected' : ''}`}
          style={forceUprightStyle}
        >
          <span className="piece-kanji" style={forceUprightStyle}>{PIECE_KANJI[piece.type]}</span>
          <span className="piece-dot" style={forceUprightStyle}>
            {piece.player === 'black' ? '▲' : '▽'}
          </span>
        </div>
      )}
      {!piece && !effect && (
        <div className="cell-empty" />
      )}
    </div>
  );
}