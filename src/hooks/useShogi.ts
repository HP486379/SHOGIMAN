import { useState, useCallback, useEffect } from 'react';
import { GameState, Position, EffectCell, CpuLevel, Piece, PieceType, Player, HandPieces, LastMove } from '../types/shogi';
import { createInitialBoard } from '../utils/initialBoard';
import { mustPromote, moveTouchesPromotionZone } from '../utils/moveRules';
import { chooseCpuMove } from '../utils/cpuPlayer';
import {
  applyMoveToBoard,
  canDropPiece,
  cloneHands,
  collectLegalMoves,
  getCheckStatus,
  getCheckmateWinner,
  getDropEffects,
  getLegalMoveEffects,
} from '../utils/shogiEngine';

function posEqual(a: Position | null, b: Position | null): boolean {
  if (!a || !b) return false;
  return a.row === b.row && a.col === b.col;
}

function randomFirstPlayer(): Player {
  return Math.random() < 0.5 ? 'black' : 'white';
}

function createInitialState(cpuLevel: CpuLevel = 'normal'): GameState {
  const firstPlayer = randomFirstPlayer();
  return {
    board: createInitialBoard(),
    hands: { black: [], white: [] },
    selectedPos: null,
    selectedHandPiece: null,
    effects: [],
    captureEffect: null,
    checkPlayer: null,
    currentPlayer: firstPlayer,
    firstPlayer,
    lastMove: null,
    gameOverWinner: null,
    moveCount: 0,
    seEnabled: true,
    cpuLevel,
    pendingPromotion: null,
  };
}

function addCapturedPiece(hands: HandPieces, player: Player, capturedPiece: Piece | null): HandPieces {
  if (!capturedPiece || capturedPiece.type === 'king') return hands;
  const nextHands = cloneHands(hands);
  nextHands[player].push(capturedPiece.type);
  return nextHands;
}

function removeHandPiece(hands: HandPieces, player: Player, pieceType: PieceType): HandPieces {
  const nextHands = cloneHands(hands);
  const index = nextHands[player].indexOf(pieceType);
  if (index >= 0) nextHands[player].splice(index, 1);
  return nextHands;
}

function dropPieceToBoard(board: GameState['board'], pieceType: PieceType, player: Player, to: Position): GameState['board'] {
  return applyMoveToBoard(board, { to, dropPiece: pieceType, promote: false }, player);
}

function movePieceOnBoard(board: GameState['board'], from: Position, to: Position, promote: boolean, player: Player): GameState['board'] {
  return applyMoveToBoard(board, { from, to, promote }, player);
}

function applyPostMoveState(
  prev: GameState,
  board: GameState['board'],
  hands: HandPieces,
  nextPlayer: Player,
  captureEffect: Position | null,
  lastMove: LastMove,
  incrementMove = true,
): GameState {
  const winner = getCheckmateWinner(board, hands);
  return {
    ...prev,
    board,
    hands,
    selectedPos: null,
    selectedHandPiece: null,
    effects: [],
    captureEffect,
    checkPlayer: winner ? null : getCheckStatus(board),
    currentPlayer: winner ?? nextPlayer,
    gameOverWinner: winner,
    pendingPromotion: null,
    lastMove,
    moveCount: incrementMove ? prev.moveCount + 1 : prev.moveCount,
  };
}

export function useShogi() {
  const [state, setState] = useState<GameState>(() => createInitialState());

  const handleCellClick = useCallback((pos: Position) => {
    setState(prev => {
      if (prev.gameOverWinner || prev.currentPlayer === 'white' || prev.pendingPromotion) return prev;

      const { board, selectedPos, selectedHandPiece, effects, currentPlayer } = prev;
      const clickedPiece = board[pos.row][pos.col];

      if (selectedHandPiece) {
        const isValidDrop = effects.some(e => e.position.row === pos.row && e.position.col === pos.col);
        if (!isValidDrop || !canDropPiece(board, selectedHandPiece, currentPlayer, pos)) {
          return { ...prev, selectedHandPiece: null, effects: [] };
        }

        const nextBoard = dropPieceToBoard(board, selectedHandPiece, currentPlayer, pos);
        const nextHands = removeHandPiece(prev.hands, currentPlayer, selectedHandPiece);
        return applyPostMoveState(prev, nextBoard, nextHands, 'white', null, { from: null, to: pos, player: currentPlayer });
      }

      if (selectedPos && posEqual(selectedPos, pos)) {
        return { ...prev, selectedPos: null, effects: [] };
      }

      const existingEffect = effects.find(
        e => e.position.row === pos.row && e.position.col === pos.col
      );

      if (existingEffect && selectedPos) {
        const movingPiece = board[selectedPos.row][selectedPos.col] as Piece;
        const capturedPiece = board[pos.row][pos.col];
        const handsAfterCapture = addCapturedPiece(prev.hands, currentPlayer, capturedPiece);
        const captureEffect = capturedPiece ? pos : null;

        if (mustPromote(movingPiece, pos)) {
          const nextBoard = movePieceOnBoard(board, selectedPos, pos, true, currentPlayer);
          return applyPostMoveState(prev, nextBoard, handsAfterCapture, 'white', captureEffect, { from: selectedPos, to: pos, player: currentPlayer });
        }

        if (moveTouchesPromotionZone(movingPiece, selectedPos, pos)) {
          return {
            ...prev,
            hands: handsAfterCapture,
            selectedPos: null,
            selectedHandPiece: null,
            effects: [],
            captureEffect,
            pendingPromotion: { from: selectedPos, to: pos },
          };
        }

        const nextBoard = movePieceOnBoard(board, selectedPos, pos, false, currentPlayer);
        return applyPostMoveState(prev, nextBoard, handsAfterCapture, 'white', captureEffect, { from: selectedPos, to: pos, player: currentPlayer });
      }

      if (clickedPiece && clickedPiece.player === currentPlayer) {
        const newEffects: EffectCell[] = getLegalMoveEffects(board, prev.hands, pos, clickedPiece);
        return { ...prev, selectedPos: pos, selectedHandPiece: null, effects: newEffects };
      }

      return { ...prev, selectedPos: null, selectedHandPiece: null, effects: [] };
    });
  }, []);

  const selectHandPiece = useCallback((pieceType: PieceType) => {
    setState(prev => {
      if (prev.gameOverWinner || prev.currentPlayer === 'white' || prev.pendingPromotion) return prev;
      const isAlreadySelected = prev.selectedHandPiece === pieceType;
      const legalDropTargets = new Set(
        collectLegalMoves(prev.board, prev.hands, 'black')
          .filter(move => move.dropPiece === pieceType)
          .map(move => `${move.to.row}-${move.to.col}`)
      );
      return {
        ...prev,
        selectedPos: null,
        selectedHandPiece: isAlreadySelected ? null : pieceType,
        effects: isAlreadySelected
          ? []
          : getDropEffects(prev.board, pieceType, 'black').filter(effect => legalDropTargets.has(`${effect.position.row}-${effect.position.col}`)),
      };
    });
  }, []);

  const answerPromotion = useCallback((promote: boolean) => {
    setState(prev => {
      if (!prev.pendingPromotion || prev.gameOverWinner) return prev;

      const movingPiece = prev.board[prev.pendingPromotion.from.row][prev.pendingPromotion.from.col];
      const safePromote = movingPiece ? promote || mustPromote(movingPiece, prev.pendingPromotion.to) : promote;
      const nextBoard = movePieceOnBoard(prev.board, prev.pendingPromotion.from, prev.pendingPromotion.to, safePromote, 'black');
      return applyPostMoveState(
        prev,
        nextBoard,
        prev.hands,
        'white',
        prev.captureEffect,
        { from: prev.pendingPromotion.from, to: prev.pendingPromotion.to, player: 'black' },
        true,
      );
    });
  }, []);

  useEffect(() => {
    if (!state.captureEffect) return;
    const timerId = window.setTimeout(() => {
      setState(prev => ({ ...prev, captureEffect: null }));
    }, 650);
    return () => window.clearTimeout(timerId);
  }, [state.captureEffect]);

  useEffect(() => {
    if (state.gameOverWinner || state.currentPlayer !== 'white' || state.pendingPromotion) return;

    const timerId = window.setTimeout(() => {
      setState(prev => {
        if (prev.gameOverWinner || prev.currentPlayer !== 'white' || prev.pendingPromotion) return prev;

        const cpuMove = chooseCpuMove(prev.board, prev.hands, prev.cpuLevel);
        if (!cpuMove) {
          const winner = getCheckmateWinner(prev.board, prev.hands);
          return {
            ...prev,
            currentPlayer: winner ?? 'black',
            gameOverWinner: winner,
            checkPlayer: winner ? null : getCheckStatus(prev.board),
            selectedPos: null,
            selectedHandPiece: null,
            effects: [],
          };
        }

        if (cpuMove.dropPiece) {
          const nextBoard = dropPieceToBoard(prev.board, cpuMove.dropPiece, 'white', cpuMove.to);
          const nextHands = removeHandPiece(prev.hands, 'white', cpuMove.dropPiece);
          return applyPostMoveState(prev, nextBoard, nextHands, 'black', null, { from: null, to: cpuMove.to, player: 'white' });
        }

        if (!cpuMove.from) return prev;

        const capturedPiece = prev.board[cpuMove.to.row][cpuMove.to.col];
        const nextBoard = movePieceOnBoard(prev.board, cpuMove.from, cpuMove.to, cpuMove.promote, 'white');
        const nextHands = addCapturedPiece(prev.hands, 'white', capturedPiece);
        return applyPostMoveState(prev, nextBoard, nextHands, 'black', capturedPiece ? cpuMove.to : null, { from: cpuMove.from, to: cpuMove.to, player: 'white' });
      });
    }, 450);

    return () => window.clearTimeout(timerId);
  }, [state.gameOverWinner, state.currentPlayer, state.board, state.hands, state.cpuLevel, state.pendingPromotion]);

  const reset = useCallback(() => {
    setState(prev => createInitialState(prev.cpuLevel));
  }, []);

  const toggleSE = useCallback(() => {
    setState(prev => ({ ...prev, seEnabled: !prev.seEnabled }));
  }, []);

  const setCpuLevel = useCallback((cpuLevel: CpuLevel) => {
    setState(prev => ({ ...prev, cpuLevel }));
  }, []);

  return { state, handleCellClick, selectHandPiece, answerPromotion, reset, toggleSE, setCpuLevel };
}
