import { HandPieces, PieceType, Player } from '../types/shogi';

const PIECE_KANJI: Record<PieceType, string> = {
  king:   '王',
  rook:   '飛',
  bishop: '角',
  gold:   '金',
  silver: '銀',
  knight: '桂',
  lance:  '香',
  pawn:   '歩',
};

const PIECE_ORDER: PieceType[] = ['rook', 'bishop', 'gold', 'silver', 'knight', 'lance', 'pawn'];

interface PieceStandProps {
  player: Player;
  label: string;
  hands: HandPieces;
  selectedHandPiece: PieceType | null;
  currentPlayer: Player;
  onSelectHandPiece: (pieceType: PieceType) => void;
}

function countPieces(pieces: PieceType[]): Partial<Record<PieceType, number>> {
  return pieces.reduce<Partial<Record<PieceType, number>>>((counts, pieceType) => {
    counts[pieceType] = (counts[pieceType] ?? 0) + 1;
    return counts;
  }, {});
}

export function PieceStand({ player, label, hands, selectedHandPiece, currentPlayer, onSelectHandPiece }: PieceStandProps) {
  const counts = countPieces(hands[player]);
  const isPlayerStand = player === 'black';
  const canUse = isPlayerStand && currentPlayer === 'black';

  return (
    <div className={`piece-stand ${player === 'black' ? 'stand-black' : 'stand-white'}`}>
      <div className="stand-title">{label}</div>
      <div className="stand-pieces">
        {PIECE_ORDER.map(pieceType => {
          const count = counts[pieceType] ?? 0;
          if (count === 0) return null;

          const isSelected = selectedHandPiece === pieceType;
          return (
            <button
              key={pieceType}
              className={`hand-piece ${isSelected ? 'hand-piece-selected' : ''}`}
              type="button"
              disabled={!canUse}
              onClick={() => onSelectHandPiece(pieceType)}
            >
              <span className="hand-piece-kanji">{PIECE_KANJI[pieceType]}</span>
              <span className="hand-piece-count">×{count}</span>
            </button>
          );
        })}
        {hands[player].length === 0 && <span className="stand-empty">EMPTY</span>}
      </div>
    </div>
  );
}
