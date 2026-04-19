import { pieceLabel } from '../game/pieces';
import type { Board, MoveOption, Piece, PieceType, Position } from '../game/types';

interface ShogiBoardProps {
  board: Board;
  selected: Position | null;
  legalMoves: MoveOption[];
  selectedPieceType: PieceType | null;
  onCellClick: (row: number, col: number) => void;
}

const fileLabel = ['９', '８', '７', '６', '５', '４', '３', '２', '１'];
const rankLabel = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];

const moveLookup = (moves: MoveOption[]): Map<string, MoveOption> => {
  const map = new Map<string, MoveOption>();
  moves.forEach((move) => map.set(`${move.row}-${move.col}`, move));
  return map;
};

const pieceClass = (piece: Piece): string =>
  piece.owner === 'sente' ? 'piece piece-sente' : 'piece piece-gote';

const blastDirectionClass = (selected: Position | null, row: number, col: number): string => {
  if (!selected) {
    return '';
  }

  const dr = row - selected.row;
  const dc = col - selected.col;

  if (dc === 0) {
    return dr < 0 ? 'blast-dir-n' : 'blast-dir-s';
  }
  if (dr === 0) {
    return dc < 0 ? 'blast-dir-w' : 'blast-dir-e';
  }
  if (Math.abs(dr) === Math.abs(dc)) {
    if (dr < 0 && dc < 0) return 'blast-dir-nw';
    if (dr < 0 && dc > 0) return 'blast-dir-ne';
    if (dr > 0 && dc < 0) return 'blast-dir-sw';
    return 'blast-dir-se';
  }
  return 'blast-dir-jump';
};

export const ShogiBoard = ({ board, selected, legalMoves, selectedPieceType, onCellClick }: ShogiBoardProps) => {
  const legalMoveMap = moveLookup(legalMoves);

  return (
    <div className="board-frame">
      <div className="coordinate-row top-coordinates">
        <span className="corner-label" />
        {fileLabel.map((label) => (
          <span key={label} className="coord-file">
            {label}
          </span>
        ))}
      </div>

      <div className="board-grid-wrapper">
        <div className="coordinate-column">
          {rankLabel.map((label) => (
            <span key={label} className="coord-rank">
              {label}
            </span>
          ))}
        </div>

        <div className="board-grid" role="grid" aria-label="shogi board">
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const key = `${rowIndex}-${colIndex}`;
              const move = legalMoveMap.get(key);
              const isSelected = selected?.row === rowIndex && selected?.col === colIndex;
              const pieceBlastClass = selectedPieceType ? `blast-piece-${selectedPieceType}` : '';
              const directionClass = move ? blastDirectionClass(selected, rowIndex, colIndex) : '';

              return (
                <button
                  key={key}
                  type="button"
                  className={[
                    'board-cell',
                    isSelected ? 'is-selected blast-origin' : '',
                    move ? `has-blast blast-${move.kind}` : '',
                    move ? 'blast-anim' : '',
                    pieceBlastClass,
                    directionClass,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => onCellClick(rowIndex, colIndex)}
                >
                  {cell && <span className={pieceClass(cell)}>{pieceLabel(cell)}</span>}
                  {move?.kind === 'capture' && <span className="capture-icon">⚔</span>}
                </button>
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
};
