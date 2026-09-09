import { DisplayMode, HandPieces, PieceType, Player } from '../types/shogi';
import { getBattlefieldPieceTypeIcon } from '../assets/battlefieldUnitIcons';
import { PIECE_KANJI } from '../utils/pieceLabels';

const PIECE_ORDER: PieceType[] = ['rook', 'bishop', 'gold', 'silver', 'knight', 'lance', 'pawn'];
const UNIT_LABELS: Partial<Record<PieceType, string>> = {
  pawn: 'INF', lance: 'ART', knight: 'DRN', silver: 'SPC', gold: 'GRD', bishop: 'RKT', rook: 'TNK',
};

interface PieceStandProps {
  player: Player;
  label: string;
  hands: HandPieces;
  selectedHandPiece: PieceType | null;
  currentPlayer: Player;
  displayMode: DisplayMode;
  onSelectHandPiece: (pieceType: PieceType) => void;
}

function countPieces(pieces: PieceType[]): Partial<Record<PieceType, number>> {
  return pieces.reduce<Partial<Record<PieceType, number>>>((counts, pieceType) => {
    counts[pieceType] = (counts[pieceType] ?? 0) + 1;
    return counts;
  }, {});
}

export function PieceStand({ player, label, hands, selectedHandPiece, currentPlayer, displayMode, onSelectHandPiece }: PieceStandProps) {
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
              className={`hand-piece hand-piece-${displayMode} ${isSelected ? 'hand-piece-selected' : ''}`}
              type="button"
              disabled={!canUse}
              aria-label={`${PIECE_KANJI[pieceType]} ×${count}`}
              onClick={() => onSelectHandPiece(pieceType)}
            >
              {displayMode !== 'shogi' && <img className="hand-unit-icon" src={getBattlefieldPieceTypeIcon(pieceType)} alt="" draggable={false} />}
              {displayMode !== 'military' && <span className="hand-kanji-label" aria-hidden="true">{PIECE_KANJI[pieceType]}</span>}
              {displayMode === 'military' && <span className="hand-unit-label" aria-hidden="true">{UNIT_LABELS[pieceType]}</span>}
              <span className="hand-piece-count">×{count}</span>
            </button>
          );
        })}
        {hands[player].length === 0 && <span className="stand-empty">EMPTY</span>}
      </div>
    </div>
  );
}
