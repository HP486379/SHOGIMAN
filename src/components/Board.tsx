import { BoardGrid, Position, EffectCell } from '../types/shogi';
import { BoardCell } from './BoardCell';

interface BoardProps {
  board: BoardGrid;
  selectedPos: Position | null;
  effects: EffectCell[];
  onCellClick: (pos: Position) => void;
}

const FILES = ['９','８','７','６','５','４','３','２','１'];
const RANKS = ['一','二','三','四','五','六','七','八','九'];

function getEffect(effects: EffectCell[], row: number, col: number): EffectCell | null {
  return effects.find(e => e.position.row === row && e.position.col === col) ?? null;
}

export function Board({ board, selectedPos, effects, onCellClick }: BoardProps) {
  return (
    <div className="board-wrapper">
      <div className="board-container">
        <div className="board-col-labels">
          {FILES.map(f => (
            <span key={f} className="coord-label">{f}</span>
          ))}
        </div>
        <div className="board-with-rows">
          {board.map((row, rIdx) => (
            <div key={rIdx} className="board-row">
              {row.map((piece, cIdx) => (
                <BoardCell
                  key={`${rIdx}-${cIdx}`}
                  row={rIdx}
                  col={cIdx}
                  piece={piece}
                  isSelected={
                    selectedPos?.row === rIdx && selectedPos?.col === cIdx
                  }
                  effect={getEffect(effects, rIdx, cIdx)}
                  onClick={onCellClick}
                />
              ))}
              <span className="rank-label">{RANKS[rIdx]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="board-shadow" />
    </div>
  );
}
