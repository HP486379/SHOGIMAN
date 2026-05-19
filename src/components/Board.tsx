import { BoardGrid, Position, EffectCell, Player, LastMove } from '../types/shogi';
import { BoardCell } from './BoardCell';

interface BoardProps {
  board: BoardGrid;
  selectedPos: Position | null;
  effects: EffectCell[];
  captureEffect: Position | null;
  checkPlayer: Player | null;
  lastMove: LastMove | null;
  onCellClick: (pos: Position) => void;
}

const FILES = ['９','８','７','６','５','４','３','２','１'];
const RANKS = ['一','二','三','四','五','六','七','八','九'];

function getEffect(effects: EffectCell[], row: number, col: number): EffectCell | null {
  return effects.find(e => e.position.row === row && e.position.col === col) ?? null;
}

function isSamePos(a: Position | null | undefined, row: number, col: number): boolean {
  return !!a && a.row === row && a.col === col;
}

export function Board({ board, selectedPos, effects, captureEffect, checkPlayer, lastMove, onCellClick }: BoardProps) {
  return (
    <div className="board-wrapper">
      {checkPlayer && (
        <div className={`check-warning check-warning-${checkPlayer}`}>
          <span>CHECK!</span>
          <small>{checkPlayer === 'black' ? '1P KING IN DANGER' : 'CPU KING IN DANGER'}</small>
        </div>
      )}
      <div className={`board-container ${checkPlayer ? 'board-in-check' : ''}`}>
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
                  isLastMoveFrom={isSamePos(lastMove?.from, rIdx, cIdx)}
                  isLastMoveTo={isSamePos(lastMove?.to, rIdx, cIdx)}
                  isCheckedKing={piece?.type === 'king' && piece.player === checkPlayer}
                  effect={getEffect(effects, rIdx, cIdx)}
                  showCaptureExplosion={
                    captureEffect?.row === rIdx && captureEffect?.col === cIdx
                  }
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
