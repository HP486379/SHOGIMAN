import { useState, useCallback, useEffect } from 'react';
import { GameState, Position, EffectCell, CpuLevel } from '../types/shogi';
import { createInitialBoard } from '../utils/initialBoard';
import { getValidMoves } from '../utils/moveRules';
import { chooseCpuMove } from '../utils/cpuPlayer';

function cloneBoard(board: GameState['board']): GameState['board'] {
  return board.map(row => row.map(cell => cell ? { ...cell } : null));
}

function posEqual(a: Position | null, b: Position | null): boolean {
  if (!a || !b) return false;
  return a.row === b.row && a.col === b.col;
}

function createInitialState(cpuLevel: CpuLevel = 'normal'): GameState {
  return {
    board: createInitialBoard(),
    selectedPos: null,
    effects: [],
    currentPlayer: 'black',
    moveCount: 0,
    seEnabled: true,
    cpuLevel,
  };
}

export function useShogi() {
  const [state, setState] = useState<GameState>(() => createInitialState());

  const handleCellClick = useCallback((pos: Position) => {
    setState(prev => {
      if (prev.currentPlayer === 'white') return prev;

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

  useEffect(() => {
    if (state.currentPlayer !== 'white') return;

    const timerId = window.setTimeout(() => {
      setState(prev => {
        if (prev.currentPlayer !== 'white') return prev;

        const cpuMove = chooseCpuMove(prev.board, prev.cpuLevel);
        if (!cpuMove) {
          return {
            ...prev,
            currentPlayer: 'black',
            selectedPos: null,
            effects: [],
          };
        }

        const newBoard = cloneBoard(prev.board);
        newBoard[cpuMove.to.row][cpuMove.to.col] = newBoard[cpuMove.from.row][cpuMove.from.col];
        newBoard[cpuMove.from.row][cpuMove.from.col] = null;

        return {
          ...prev,
          board: newBoard,
          selectedPos: null,
          effects: [],
          currentPlayer: 'black',
          moveCount: prev.moveCount + 1,
        };
      });
    }, 450);

    return () => window.clearTimeout(timerId);
  }, [state.currentPlayer, state.board, state.cpuLevel]);

  const reset = useCallback(() => {
    setState(prev => createInitialState(prev.cpuLevel));
  }, []);

  const toggleSE = useCallback(() => {
    setState(prev => ({ ...prev, seEnabled: !prev.seEnabled }));
  }, []);

  const setCpuLevel = useCallback((cpuLevel: CpuLevel) => {
    setState(prev => ({ ...prev, cpuLevel }));
  }, []);

  return { state, handleCellClick, reset, toggleSE, setCpuLevel };
}
