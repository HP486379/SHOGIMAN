import { BoardGrid, CpuLevel, HandPieces, Piece, PieceType, Player, Position } from '../types/shogi';
import { getValidMoves, mustPromote, promotePiece, moveTouchesPromotionZone } from './moveRules';

export interface CpuMove {
  from?: Position;
  to: Position;
  dropPiece?: PieceType;
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

function canDropPiece(board: BoardGrid, pieceType: PieceType, player: Player, to: Position): boolean {
  if (board[to.row][to.col]) return false;

  if ((pieceType === 'pawn' || pieceType === 'lance') && (player === 'black' ? to.row === 0 : to.row === 8)) return false;
  if (pieceType === 'knight' && (player === 'black' ? to.row <= 1 : to.row >= 7)) return false;

  if (pieceType === 'pawn') {
    return !board.some(row => row[to.col]?.player === player && row[to.col]?.type === 'pawn' && !row[to.col]?.promoted);
  }

  return true;
}

function collectDropMoves(board: BoardGrid, hands: HandPieces, player: Player): CpuMove[] {
  const moves: CpuMove[] = [];
  const uniqueHandPieces = Array.from(new Set(hands[player]));

  for (const dropPiece of uniqueHandPieces) {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const to = { row, col };
        if (canDropPiece(board, dropPiece, player, to)) {
          moves.push({ to, dropPiece, score: 0, promote: false });
        }
      }
    }
  }

  return moves;
}

function collectLegalMoves(board: BoardGrid, hands: HandPieces, player: Player): CpuMove[] {
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

  return [...moves, ...collectDropMoves(board, hands, player)];
}

function applyMove(board: BoardGrid, move: CpuMove, player: Player): BoardGrid {
  const nextBoard = cloneBoard(board);

  if (move.dropPiece) {
    nextBoard[move.to.row][move.to.col] = { type: move.dropPiece, player };
    return nextBoard;
  }

  if (!move.from) return nextBoard;

  const movingPiece = nextBoard[move.from.row][move.from.col];
  nextBoard[move.to.row][move.to.col] = movingPiece && move.promote ? promotePiece(movingPiece) : movingPiece;
  nextBoard[move.from.row][move.from.col] = null;
  return nextBoard;
}

function isSquareAttacked(board: BoardGrid, hands: HandPieces, pos: Position, byPlayer: Player): boolean {
  return collectLegalMoves(board, hands, byPlayer).some(
    move => move.to.row === pos.row && move.to.col === pos.col
  );
}

function evaluateMove(board: BoardGrid, hands: HandPieces, move: CpuMove, player: Player, level: CpuLevel): number {
  const movingPiece = move.from ? board[move.from.row][move.from.col] : null;
  const targetPiece = board[move.to.row][move.to.col];
  let score = Math.random();

  if (targetPiece) {
    score += PIECE_VALUES[targetPiece.type] * 100;
    if (movingPiece) score -= PIECE_VALUES[movingPiece.type] * 2;
  }

  if (move.dropPiece) {
    score += PIECE_VALUES[move.dropPiece] * 8;
  }

  if (move.promote && movingPiece) {
    score += movingPiece.type === 'rook' || movingPiece.type === 'bishop' ? 50 : 25;
  }

  if (level === 'easy') return score;

  const nextBoard = applyMove(board, move, player);
  const opponent = getOpponent(player);

  if (movingPiece && isSquareAttacked(nextBoard, hands, move.to, opponent)) {
    score -= PIECE_VALUES[movingPiece.type] * 45;
  }

  if (level === 'normal') return score;

  const centerDistance = Math.abs(move.to.row - 4) + Math.abs(move.to.col - 4);
  score += (8 - centerDistance) * 4;

  const opponentReplies = collectLegalMoves(nextBoard, hands, opponent);
  const biggestOpponentCapture = opponentReplies.reduce((max, reply) => {
    const captured = nextBoard[reply.to.row][reply.to.col];
    return captured && captured.player === player
      ? Math.max(max, PIECE_VALUES[captured.type])
      : max;
  }, 0);

  score -= biggestOpponentCapture * 30;

  return score;
}

export function chooseCpuMove(board: BoardGrid, hands: HandPieces, level: CpuLevel): CpuMove | null {
  const moves = collectLegalMoves(board, hands, 'white');
  if (moves.length === 0) return null;

  if (level === 'easy') {
    return randomItem(moves);
  }

  const scoredMoves = moves.map(move => ({
    ...move,
    score: evaluateMove(board, hands, move, 'white', level),
  }));

  scoredMoves.sort((a, b) => b.score - a.score);

  if (level === 'normal') {
    return randomItem(scoredMoves.slice(0, Math.min(5, scoredMoves.length)));
  }

  return scoredMoves[0];
}
