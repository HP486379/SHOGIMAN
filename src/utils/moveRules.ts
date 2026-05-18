import { BoardGrid, Piece, PieceType, Player, Position, EffectCell, EffectKind } from '../types/shogi';

type Direction = [number, number];

function isInBounds(row: number, col: number): boolean {
  return row >= 0 && row < 9 && col >= 0 && col < 9;
}

function forwardDir(player: Player): number {
  return player === 'black' ? -1 : 1;
}

function getStepDirs(type: PieceType, player: Player): Direction[] {
  const fwd = forwardDir(player);
  switch (type) {
    case 'king':
      return [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    case 'gold':
      return [[fwd,-1],[fwd,0],[fwd,1],[0,-1],[0,1],[-fwd,0]];
    case 'silver':
      return [[fwd,-1],[fwd,0],[fwd,1],[-fwd,-1],[-fwd,1]];
    case 'pawn':
      return [[fwd,0]];
    case 'knight':
      return [[fwd*2,-1],[fwd*2,1]];
    default:
      return [];
  }
}

function getSlidingDirs(type: PieceType, player: Player): Direction[] {
  const fwd = forwardDir(player);
  switch (type) {
    case 'rook':
      return [[-1,0],[1,0],[0,-1],[0,1]];
    case 'bishop':
      return [[-1,-1],[-1,1],[1,-1],[1,1]];
    case 'lance':
      return [[fwd,0]];
    default:
      return [];
  }
}

function effectKindForPiece(type: PieceType): EffectKind {
  if (type === 'rook') return 'cross';
  if (type === 'bishop') return 'diagonal';
  return 'flame';
}

const SLIDING_TYPES: PieceType[] = ['rook', 'bishop', 'lance'];

export function getValidMoves(board: BoardGrid, pos: Position, piece: Piece): EffectCell[] {
  const effects: EffectCell[] = [];
  const { row, col } = pos;
  const { type, player } = piece;

  if (SLIDING_TYPES.includes(type)) {
    const dirs = getSlidingDirs(type, player);
    for (const [dr, dc] of dirs) {
      let dist = 1;
      let r = row + dr;
      let c = col + dc;
      while (isInBounds(r, c)) {
        const target = board[r][c];
        const kind = effectKindForPiece(type);
        if (target === null) {
          effects.push({ position: { row: r, col: c }, kind, distance: dist });
          r += dr; c += dc; dist++;
        } else if (target.player !== player) {
          effects.push({ position: { row: r, col: c }, kind: 'capture', distance: dist });
          break;
        } else {
          break;
        }
      }
    }
  } else {
    const dirs = getStepDirs(type, player);
    const isKnight = type === 'knight';
    for (const [dr, dc] of dirs) {
      const r = row + dr;
      const c = col + dc;
      if (!isInBounds(r, c)) continue;
      if (isKnight) {
        const target = board[r][c];
        if (target === null) {
          effects.push({ position: { row: r, col: c }, kind: 'flame', distance: 2 });
        } else if (target.player !== player) {
          effects.push({ position: { row: r, col: c }, kind: 'capture', distance: 2 });
        }
      } else {
        const target = board[r][c];
        if (target === null) {
          effects.push({ position: { row: r, col: c }, kind: 'flame', distance: 1 });
        } else if (target.player !== player) {
          effects.push({ position: { row: r, col: c }, kind: 'capture', distance: 1 });
        }
      }
    }
  }

  return effects;
}
