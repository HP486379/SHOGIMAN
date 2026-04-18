import { useMemo, useState } from 'react';
import { ShogiBoard } from './components/ShogiBoard';
import { getLegalMoves } from './game/moves';
import { createInitialBoard, pieceBlastType } from './game/pieces';
import type { Board, MoveOption, Piece, PieceType, Position } from './game/types';

const samePosition = (a: Position, b: Position): boolean => a.row === b.row && a.col === b.col;

const cloneBoard = (board: Board): Board => board.map((row) => [...row]);

const movePiece = (board: Board, from: Position, to: Position): Board => {
  const nextBoard = cloneBoard(board);
  const moving = nextBoard[from.row][from.col];
  nextBoard[from.row][from.col] = null;
  nextBoard[to.row][to.col] = moving;
  return nextBoard;
};

function App() {
  const [board, setBoard] = useState<Board>(() => createInitialBoard());
  const [selected, setSelected] = useState<Position | null>(null);
  const [legalMoves, setLegalMoves] = useState<MoveOption[]>([]);

  const selectedPiece: Piece | null = selected ? board[selected.row][selected.col] : null;
  const selectedType: PieceType | null = selectedPiece?.type ?? null;
  const blastType = selectedPiece ? pieceBlastType(selectedPiece.type) : null;

  const footerMessage = useMemo(() => {
    if (!selectedPiece) return 'READY';
    if (legalMoves.length === 0) return 'NO RANGE';
    return 'SELECT DEST';
  }, [legalMoves.length, selectedPiece]);

  const onCellClick = (row: number, col: number) => {
    const clickedPiece = board[row][col];

    if (selected) {
      const move = legalMoves.find((m: MoveOption) => m.row === row && m.col === col);
      if (move) {
        setBoard((prev: Board) => movePiece(prev, selected, { row, col }));
        setSelected(null);
        setLegalMoves([]);
        return;
      }

      if (samePosition(selected, { row, col })) {
        setSelected(null);
        setLegalMoves([]);
        return;
      }
    }

    if (clickedPiece && clickedPiece.owner === 'sente') {
      setSelected({ row, col });
      setLegalMoves(getLegalMoves(board, { row, col }));
      return;
    }

    setSelected(null);
    setLegalMoves([]);
  };

  const resetGame = () => {
    setBoard(createInitialBoard());
    setSelected(null);
    setLegalMoves([]);
  };

  return (
    <main className="screen">
      <header className="hud top-hud">
        <div className="hud-block">1P</div>
        <div className="hud-block vs-block">VS</div>
        <div className="hud-block">CPU</div>
        <div className="hud-block">TURN 1P</div>
        <div className="hud-block">BLAST {blastType ?? '---'}</div>
      </header>

      <section className="playfield">
        <ShogiBoard
          board={board}
          selected={selected}
          legalMoves={legalMoves}
          selectedPieceType={selectedType}
          onCellClick={onCellClick}
        />
      </section>

      <footer className="hud bottom-hud">
        <div className="bottom-left">▶ {footerMessage}</div>
        <div className="bottom-center">SELECT PIECE / BLAST RANGE / SELECT DEST</div>
        <button type="button" className="retro-button" onClick={resetGame}>
          RESET
        </button>
      </footer>
    </main>
  );
}

export default App;
