import { BoardGrid, CpuLevel, Piece, PieceType, Player, Position } from '../types/shogi';
import { getValidMoves, mustPromote, promotePiece, moveTouchesPromotionZone } from './moveRules';

export interface CpuMove {
  from: Position;
  to: Position;
  score: number;
  promote: boolean;
}

const PIECE_VALUES: Record<PieceType, number> = {
  king: 1000,
  rook: 12,
  bishop: 10,
  gold: 7,
  silver: 6,
  knight: 4,
  lance: 3,
  pawn: 1,
};

function cloneBoard(board: BoardGrid): BoardGrid {
  return board.map(row => row.map(cell => cell ? { ...cell } : null));
}

function getOpponent(player: Player): Player {
  return player === 'black' ? 'white' : 'black';
}

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function shouldCpuPromote(piece: Piece, from: Position, to: Position): boolean {
  return mustPromote(piece, to) || moveTouchesPromotionZone(piece, from, to);
}

function collectLegalMoves(board: BoardGrid, player: Player): CpuMove[] {
  const moves: CpuMove[] = [];

  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      const piece = board[row][col];
      if (!piece || piece.player !== player) continue;

      const from = { row, col };
      const validMoves = getValidMoves(board, from, piece);
      for (const effect of validMoves) {
        moves.push({
          from,
          to: effect.position,
          score: 0,
          promote: shouldCpuPromote(piece, from, effect.position),
        });
      }
    }
  }

  return moves;
}

function applyMove(board: BoardGrid, move: CpuMove): BoardGrid {
  const nextBoard = cloneBoard(board);
  const movingPiece = nextBoard[move.from.row][move.from.col];
  nextBoard[move.to.row][move.to.col] = movingPiece && move.promote ? promotePiece(movingPiece) : movingPiece;
  nextBoard[move.from.row][move.from.col] = null;
  return nextBoard;
}

function isSquareAttacked(board: BoardGrid, pos: Position, byPlayer: Player): boolean {
  return collectLegalMoves(board, byPlayer).some(
    move => move.to.row === pos.row && move.to.col === pos.col
  );
}

function evaluateMove(board: BoardGrid, move: CpuMove, player: Player, level: CpuLevel): number {
  const movingPiece = board[move.from.row][move.from.col] as Piece;
  const targetPiece = board[move.to.row][move.to.col];
  let score = Math.random();

  if (targetPiece) {
    score += PIECE_VALUES[targetPiece.type] * 100;
    score -= PIECE_VALUES[movingPiece.type] * 2;
  }

  if (move.promote) {
    score += movingPiece.type === 'rook' || movingPiece.type === 'bishop' ? 50 : 25;
  }

  if (level === 'easy') return score;

  const nextBoard = applyMove(board, move);
  const opponent = getOpponent(player);

  if (isSquareAttacked(nextBoard, move.to, opponent)) {
    score -= PIECE_VALUES[movingPiece.type] * 45;
  }

  if (level === 'normal') return score;

  const centerDistance = Math.abs(move.to.row - 4) + Math.abs(move.to.col - 4);
  score += (8 - centerDistance) * 4;

  const opponentReplies = collectLegalMoves(nextBoard, opponent);
  const biggestOpponentCapture = opponentReplies.reduce((max, reply) => {
    const captured = nextBoard[reply.to.row][reply.to.col];
    return captured && captured.player === player
      ? Math.max(max, PIECE_VALUES[captured.type])
      : max;
  }, 0);

  score -= biggestOpponentCapture * 30;

  return score;
}

export function chooseCpuMove(board: BoardGrid, level: CpuLevel): CpuMove | null {
  const moves = collectLegalMoves(board, 'white');
  if (moves.length === 0) return null;

  if (level === 'easy') {
    return randomItem(moves);
  }

  const scoredMoves = moves.map(move => ({
    ...move,
    score: evaluateMove(board, move, 'white', level),
  }));

  scoredMoves.sort((a, b) => b.score - a.score);

  if (level === 'normal') {
    return randomItem(scoredMoves.slice(0, Math.min(5, scoredMoves.length)));
  }

  return scoredMoves[0];
}
