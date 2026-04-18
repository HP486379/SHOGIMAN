import { BOARD_SIZE, type BlastVisualType, type Board, type Piece, type PieceType, type Player } from './types';

const pieceOrder: PieceType[] = ['lance', 'knight', 'silver', 'gold', 'king', 'gold', 'silver', 'knight', 'lance'];

const addPiece = (board: Board, row: number, col: number, owner: Player, type: PieceType) => {
  board[row][col] = {
    id: `${owner}-${type}-${row}-${col}`,
    owner,
    type,
  };
};

export const createInitialBoard = (): Board => {
  const board: Board = Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => null));

  pieceOrder.forEach((pieceType, col) => {
    addPiece(board, 8, col, 'sente', pieceType);
    addPiece(board, 0, BOARD_SIZE - 1 - col, 'gote', pieceType);
  });

  addPiece(board, 7, 1, 'sente', 'bishop');
  addPiece(board, 7, 7, 'sente', 'rook');
  addPiece(board, 1, 1, 'gote', 'rook');
  addPiece(board, 1, 7, 'gote', 'bishop');

  for (let col = 0; col < BOARD_SIZE; col += 1) {
    addPiece(board, 6, col, 'sente', 'pawn');
    addPiece(board, 2, col, 'gote', 'pawn');
  }

  return board;
};

const pieceSymbolByType: Record<PieceType, string> = {
  king: '王',
  gold: '金',
  silver: '銀',
  knight: '桂',
  lance: '香',
  rook: '飛',
  bishop: '角',
  pawn: '歩',
};

export const pieceLabel = (piece: Piece): string => pieceSymbolByType[piece.type];

const blastByType: Record<PieceType, BlastVisualType> = {
  rook: 'cross',
  bishop: 'diagonal',
  lance: 'forward-line',
  king: 'adjacent-panel',
  gold: 'adjacent-panel',
  silver: 'adjacent-panel',
  knight: 'jump-marker',
  pawn: 'single-step',
};

export const pieceBlastType = (type: PieceType): BlastVisualType => blastByType[type];
