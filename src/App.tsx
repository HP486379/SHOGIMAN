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
    if (!selectedPiece) {
      return 'SELECT PIECE';
    }
    if (legalMoves.length === 0) {
      return 'NO BLAST RANGE';
    }
    return 'SELECT DESTINATION';
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
      <div className="crt-overlay" aria-hidden="true" />

      <header className="retro-header">
        <p className="blink">1P VS CPU</p>
        <h1>SHOGIMAN BLAST BOARD</h1>
        <p>CPU STATUS: STANDBY (DUMMY)</p>
      </header>

      <section className="status-panel">
        <span>SHOW BLAST RANGE</span>
        <span className="blast-type">EFFECT: {blastType ?? '---'}</span>
      </section>

      <ShogiBoard
        board={board}
        selected={selected}
        legalMoves={legalMoves}
        selectedPieceType={selectedType}
        onCellClick={onCellClick}
      />

      <div className="controls">
        <button type="button" className="retro-button" onClick={resetGame}>
          RESET ROUND
        </button>
      </div>

      <footer className="retro-footer">
        <p className="footer-main">▶ {footerMessage}</p>
        <p className="footer-sub">A: SELECT PIECE / B: SHOW BLAST RANGE / START: SELECT DESTINATION</p>
      </footer>
    </main>
  );
}

export default App;
