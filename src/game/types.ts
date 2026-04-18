export const BOARD_SIZE = 9;

export type Player = 'sente' | 'gote';

export type PieceType = 'king' | 'gold' | 'silver' | 'knight' | 'lance' | 'rook' | 'bishop' | 'pawn';

export interface Piece {
  id: string;
  owner: Player;
  type: PieceType;
}

export interface Position {
  row: number;
  col: number;
}

export type Board = (Piece | null)[][];

export type MoveKind = 'move' | 'capture';

export interface MoveOption {
  row: number;
  col: number;
  kind: MoveKind;
}

export type BlastVisualType = 'cross' | 'diagonal' | 'forward-line' | 'adjacent-panel' | 'jump-marker' | 'single-step';
