import { useState, useCallback, useEffect } from 'react';
import { GameState, Position, EffectCell, CpuLevel, Piece } from '../types/shogi';
import { createInitialBoard } from '../utils/initialBoard';
import { getValidMoves, moveTouchesPromotionZone, mustPromote, promotePiece } from '../utils/moveRules';
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
    pendingPromotion: null,
  };
}

function movePiece(board: GameState['board'], from: Position, to: Position, promote: boolean): GameState['board'] {
  const newBoard = cloneBoard(board);
  const movingPiece = newBoard[from.row][from.col];
  newBoard[to.row][to.col] = movingPiece && promote ? promotePiece(movingPiece) : movingPiece;
  newBoard[from.row][from.col] = null;
  return newBoard;
}

export function useShogi() {
  const [state, setState] = useState<GameState>(() => createInitialState());

  const handleCellClick = useCallback((pos: Position) => {
    setState(prev => {
      if (prev.currentPlayer === 'white' || prev.pendingPromotion) return prev;

      const { board, selectedPos, effects, currentPlayer } = prev;
      const clickedPiece = board[pos.row][pos.col];

      if (selectedPos && posEqual(selectedPos, pos)) {
        return { ...prev, selectedPos: null, effects: [] };
      }

      const existingEffect = effects.find(
        e => e.position.row === pos.row && e.position.col === pos.col
      );

      if (existingEffect && selectedPos) {
        const movingPiece = board[selectedPos.row][selectedPos.col] as Piece;

        if (mustPromote(movingPiece, pos)) {
          return {
            ...prev,
            board: movePiece(board, selectedPos, pos, true),
            selectedPos: null,
            effects: [],
            currentPlayer: 'white',
            moveCount: prev.moveCount + 1,
          };
        }

        if (moveTouchesPromotionZone(movingPiece, selectedPos, pos)) {
          return {
            ...prev,
            selectedPos: null,
            effects: [],
            pendingPromotion: { from: selectedPos, to: pos },
          };
        }

        return {
          ...prev,
          board: movePiece(board, selectedPos, pos, false),
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

  const answerPromotion = useCallback((promote: boolean) => {
    setState(prev => {
      if (!prev.pendingPromotion) return prev;

      return {
        ...prev,
        board: movePiece(prev.board, prev.pendingPromotion.from, prev.pendingPromotion.to, promote),
        selectedPos: null,
        effects: [],
        pendingPromotion: null,
        currentPlayer: 'white',
        moveCount: prev.moveCount + 1,
      };
    });
  }, []);

  useEffect(() => {
    if (state.currentPlayer !== 'white' || state.pendingPromotion) return;

    const timerId = window.setTimeout(() => {
      setState(prev => {
        if (prev.currentPlayer !== 'white' || prev.pendingPromotion) return prev;

        const cpuMove = chooseCpuMove(prev.board, prev.cpuLevel);
        if (!cpuMove) {
          return {
            ...prev,
            currentPlayer: 'black',
            selectedPos: null,
            effects: [],
          };
        }

        return {
          ...prev,
          board: movePiece(prev.board, cpuMove.from, cpuMove.to, cpuMove.promote),
          selectedPos: null,
          effects: [],
          currentPlayer: 'black',
          moveCount: prev.moveCount + 1,
        };
      });
    }, 450);

    return () => window.clearTimeout(timerId);
  }, [state.currentPlayer, state.board, state.cpuLevel, state.pendingPromotion]);

  const reset = useCallback(() => {
    setState(prev => createInitialState(prev.cpuLevel));
  }, []);

  const toggleSE = useCallback(() => {
    setState(prev => ({ ...prev, seEnabled: !prev.seEnabled }));
  }, []);

  const setCpuLevel = useCallback((cpuLevel: CpuLevel) => {
    setState(prev => ({ ...prev, cpuLevel }));
  }, []);

  return { state, handleCellClick, answerPromotion, reset, toggleSE, setCpuLevel };
}
