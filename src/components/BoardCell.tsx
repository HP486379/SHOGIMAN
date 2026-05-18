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

const PROMOTED_KANJI: Partial<Record<Piece['type'], string>> = {
  rook:   '龍',
  bishop: '馬',
  silver: '全',
  knight: '圭',
  lance:  '杏',
  pawn:   'と',
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

function getPieceKanji(piece: Piece): string {
  return piece.promoted ? PROMOTED_KANJI[piece.type] ?? PIECE_KANJI[piece.type] : PIECE_KANJI[piece.type];
}

export function BoardCell({ row, col, piece, isSelected, effect, onClick }: BoardCellProps) {
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
      {piece && (
        <div
          className={`piece ${piece.player === 'black' ? 'piece-black' : 'piece-white'} ${selectedPieceClass} ${promotedPieceClass}`}
          style={pieceOrientationStyle}
        >
          <span className="piece-kanji">{getPieceKanji(piece)}</span>
          <span className="piece-dot">
            {piece.promoted ? '成' : piece.player === 'black' ? '▲' : '▽'}
          </span>
        </div>
      )}
      {!piece && !effect && (
        <div className="cell-empty" />
      )}
    </div>
  );
}