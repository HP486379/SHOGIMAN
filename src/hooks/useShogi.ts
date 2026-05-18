import { useState, useCallback } from 'react';
import { GameState, Position, EffectCell } from '../types/shogi';
import { createInitialBoard } from '../utils/initialBoard';
import { getValidMoves } from '../utils/moveRules';

function cloneBoard(board: GameState['board']): GameState['board'] {
  return board.map(row => row.map(cell => cell ? { ...cell } : null));
}

function posEqual(a: Position | null, b: Position | null): boolean {
  if (!a || !b) return false;
  return a.row === b.row && a.col === b.col;
}

export function useShogi() {
  const [state, setState] = useState<GameState>({
    board: createInitialBoard(),
    selectedPos: null,
    effects: [],
    currentPlayer: 'black',
    moveCount: 0,
    seEnabled: true,
  });

  const handleCellClick = useCallback((pos: Position) => {
    setState(prev => {
      const { board, selectedPos, effects, currentPlayer } = prev;
      const clickedPiece = board[pos.row][pos.col];

      if (selectedPos && posEqual(selectedPos, pos)) {
        return { ...prev, selectedPos: null, effects: [] };
      }

      const existingEffect = effects.find(
        e => e.position.row === pos.row && e.position.col === pos.col
      );

      if (existingEffect && selectedPos) {
        const newBoard = cloneBoard(board);
        newBoard[pos.row][pos.col] = newBoard[selectedPos.row][selectedPos.col];
        newBoard[selectedPos.row][selectedPos.col] = null;
        return {
          ...prev,
          board: newBoard,
          selectedPos: null,
          effects: [],
          currentPlayer: currentPlayer === 'black' ? 'white' : 'black',
          moveCount: prev.moveCount + 1,
        };
      }

      if (clickedPiece && clickedPiece.player === currentPlayer) {
        const newEffects: EffectCell[] = getValidMoves(board, pos, clickedPiece);
        return { ...prev, selectedPos: pos, effects: newEffects };
      }

      return { ...prev, selectedPos: null, effects: [] };
    });
  }, []);

  const reset = useCallback(() => {
    setState({
      board: createInitialBoard(),
      selectedPos: null,
      effects: [],
      currentPlayer: 'black',
      moveCount: 0,
      seEnabled: true,
    });
  }, []);

  const toggleSE = useCallback(() => {
    setState(prev => ({ ...prev, seEnabled: !prev.seEnabled }));
  }, []);

  return { state, handleCellClick, reset, toggleSE };
}
