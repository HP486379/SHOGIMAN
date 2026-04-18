import { BOARD_SIZE, type Board, type MoveOption, type Piece, type Player, type Position } from './types';

const inBounds = (row: number, col: number): boolean => row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;

const direction = (owner: Player): number => (owner === 'sente' ? -1 : 1);

const addStepMove = (
  board: Board,
  owner: Player,
  row: number,
  col: number,
  moves: MoveOption[],
): void => {
  if (!inBounds(row, col)) {
    return;
  }

  const target = board[row][col];
  if (!target) {
    moves.push({ row, col, kind: 'move' });
    return;
  }

  if (target.owner !== owner) {
    moves.push({ row, col, kind: 'capture' });
  }
};

const addRayMoves = (
  board: Board,
  piece: Piece,
  origin: Position,
  vectors: Array<[number, number]>,
  moves: MoveOption[],
): void => {
  vectors.forEach(([dr, dc]) => {
    let row = origin.row + dr;
    let col = origin.col + dc;

    while (inBounds(row, col)) {
      const target = board[row][col];
      if (!target) {
        moves.push({ row, col, kind: 'move' });
        row += dr;
        col += dc;
        continue;
      }

      if (target.owner !== piece.owner) {
        moves.push({ row, col, kind: 'capture' });
      }

      break;
    }
  });
};

export const getLegalMoves = (board: Board, position: Position): MoveOption[] => {
  const piece = board[position.row][position.col];
  if (!piece) {
    return [];
  }

  const moves: MoveOption[] = [];
  const forward = direction(piece.owner);

  switch (piece.type) {
    case 'rook':
      addRayMoves(
        board,
        piece,
        position,
        [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ],
        moves,
      );
      break;
    case 'bishop':
      addRayMoves(
        board,
        piece,
        position,
        [
          [1, 1],
          [1, -1],
          [-1, 1],
          [-1, -1],
        ],
        moves,
      );
      break;
    case 'lance':
      addRayMoves(board, piece, position, [[forward, 0]], moves);
      break;
    case 'pawn':
      addStepMove(board, piece.owner, position.row + forward, position.col, moves);
      break;
    case 'knight':
      addStepMove(board, piece.owner, position.row + forward * 2, position.col - 1, moves);
      addStepMove(board, piece.owner, position.row + forward * 2, position.col + 1, moves);
      break;
    case 'silver': {
      const vectors: Array<[number, number]> = [
        [forward, 0],
        [forward, 1],
        [forward, -1],
        [-forward, 1],
        [-forward, -1],
      ];
      vectors.forEach(([dr, dc]) => addStepMove(board, piece.owner, position.row + dr, position.col + dc, moves));
      break;
    }
    case 'gold': {
      const vectors: Array<[number, number]> = [
        [forward, 0],
        [0, 1],
        [0, -1],
        [-forward, 0],
        [forward, 1],
        [forward, -1],
      ];
      vectors.forEach(([dr, dc]) => addStepMove(board, piece.owner, position.row + dr, position.col + dc, moves));
      break;
    }
    case 'king': {
      const vectors: Array<[number, number]> = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ];
      vectors.forEach(([dr, dc]) => addStepMove(board, piece.owner, position.row + dr, position.col + dc, moves));
      break;
    }
    default:
      break;
  }

  return moves;
};
