import { PieceType } from '../types/shogi';

export const PIECE_KANJI: Record<PieceType, string> = {
  pawn: '歩',
  lance: '香',
  knight: '桂',
  silver: '銀',
  gold: '金',
  bishop: '角',
  rook: '飛',
  king: '玉',
};

export const PROMOTED_PIECE_KANJI: Partial<Record<PieceType, string>> = {
  pawn: 'と',
  lance: '杏',
  knight: '圭',
  silver: '全',
  bishop: '馬',
  rook: '龍',
};

export function getPieceKanji(pieceType: PieceType, promoted = false): string {
  if (promoted) {
    return PROMOTED_PIECE_KANJI[pieceType] ?? PIECE_KANJI[pieceType];
  }
  return PIECE_KANJI[pieceType];
}
