import { BoardGrid, Piece, PieceType, Player, Position, EffectCell, EffectKind } from '../types/shogi';

type Direction = [number, number];

function isInBounds(row: number, col: number): boolean {
  return row >= 0 && row < 9 && col >= 0 && col < 9;
}

function forwardDir(player: Player): number {
  return player === 'black' ? -1 : 1;
}

export function canPromotePiece(piece: Piece): boolean {
  return !piece.promoted && piece.type !== 'king' && piece.type !== 'gold';
}

export function isPromotionZone(player: Player, row: number): boolean {
  return player === 'black' ? row <= 2 : row >= 6;
}

export function moveTouchesPromotionZone(piece: Piece, from: Position, to: Position): boolean {
  return canPromotePiece(piece) && (
    isPromotionZone(piece.player, from.row) || isPromotionZone(piece.player, to.row)
  );
}

export function mustPromote(piece: Piece, to: Position): boolean {
  if (!canPromotePiece(piece)) return false;
  if (piece.type === 'pawn' || piece.type === 'lance') {
    return piece.player === 'black' ? to.row === 0 : to.row === 8;
  }
  if (piece.type === 'knight') {
    return piece.player === 'black' ? to.row <= 1 : to.row >= 7;
  }
  return false;
}

export function promotePiece(piece: Piece): Piece {
  return canPromotePiece(piece) ? { ...piece, promoted: true } : piece;
}

function getStepDirs(type: PieceType, player: Player, promoted?: boolean): Direction[] {
  const fwd = forwardDir(player);

  if (promoted && ['silver', 'knight', 'lance', 'pawn'].includes(type)) {
    return [[fwd,-1],[fwd,0],[fwd,1],[0,-1],[0,1],[-fwd,0]];
  }

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

function getSlidingDirs(type: PieceType, player: Player, promoted?: boolean): Direction[] {
  const fwd = forwardDir(player);
  switch (type) {
    case 'rook':
      return [[-1,0],[1,0],[0,-1],[0,1]];
    case 'bishop':
      return [[-1,-1],[-1,1],[1,-1],[1,1]];
    case 'lance':
      return promoted ? [] : [[fwd,0]];
    default:
      return [];
  }
}

function getPromotedExtraStepDirs(type: PieceType): Direction[] {
  if (type === 'rook') return [[-1,-1],[-1,1],[1,-1],[1,1]];
  if (type === 'bishop') return [[-1,0],[1,0],[0,-1],[0,1]];
  return [];
}

function effectKindForPiece(type: PieceType): EffectKind {
  if (type === 'rook') return 'cross';
  if (type === 'bishop') return 'diagonal';
  return 'flame';
}

const SLIDING_TYPES: PieceType[] = ['rook', 'bishop', 'lance'];

function addStepMove(board: BoardGrid, effects: EffectCell[], row: number, col: number, piece: Piece, kind: EffectKind, distance: number) {
  if (!isInBounds(row, col)) return;
  const target = board[row][col];
  if (target === null) {
    effects.push({ position: { row, col }, kind, distance });
  } else if (target.player !== piece.player) {
    effects.push({ position: { row, col }, kind: 'capture', distance });
  }
}

export function getValidMoves(board: BoardGrid, pos: Position, piece: Piece): EffectCell[] {
  const effects: EffectCell[] = [];
  const { row, col } = pos;
  const { type, player, promoted } = piece;

  if (SLIDING_TYPES.includes(type) && !(promoted && type === 'lance')) {
    const dirs = getSlidingDirs(type, player, promoted);
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
  }

  const stepDirs = getStepDirs(type, player, promoted);
  const isKnight = type === 'knight' && !promoted;
  for (const [dr, dc] of stepDirs) {
    addStepMove(board, effects, row + dr, col + dc, piece, 'flame', isKnight ? 2 : 1);
  }

  if (promoted) {
    const extraDirs = getPromotedExtraStepDirs(type);
    for (const [dr, dc] of extraDirs) {
      addStepMove(board, effects, row + dr, col + dc, piece, 'flame', 1);
    }
  }

  return effects;
}
