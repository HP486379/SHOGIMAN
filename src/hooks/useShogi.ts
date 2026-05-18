import { useState, useCallback, useEffect } from 'react';
import { GameState, Position, EffectCell, CpuLevel, Piece, PieceType, Player, HandPieces } from '../types/shogi';
import { createInitialBoard } from '../utils/initialBoard';
import { getValidMoves, moveTouchesPromotionZone, mustPromote, promotePiece } from '../utils/moveRules';
import { chooseCpuMove } from '../utils/cpuPlayer';

function cloneBoard(board: GameState['board']): GameState['board'] {
  return board.map(row => row.map(cell => cell ? { ...cell } : null));
}

function cloneHands(hands: HandPieces): HandPieces {
  return {
    black: [...hands.black],
    white: [...hands.white],
  };
}

function posEqual(a: Position | null, b: Position | null): boolean {
  if (!a || !b) return false;
  return a.row === b.row && a.col === b.col;
}

function createInitialState(cpuLevel: CpuLevel = 'normal'): GameState {
  return {
    board: createInitialBoard(),
    hands: { black: [], white: [] },
    selectedPos: null,
    selectedHandPiece: null,
    effects: [],
    captureEffect: null,
    currentPlayer: 'black',
    gameOverWinner: null,
    moveCount: 0,
    seEnabled: true,
    cpuLevel,
    pendingPromotion: null,
  };
}

function canDropPiece(board: GameState['board'], pieceType: PieceType, player: Player, to: Position): boolean {
  if (board[to.row][to.col]) return false;

  if ((pieceType === 'pawn' || pieceType === 'lance') && (player === 'black' ? to.row === 0 : to.row === 8)) return false;
  if (pieceType === 'knight' && (player === 'black' ? to.row <= 1 : to.row >= 7)) return false;

  if (pieceType === 'pawn') {
    return !board.some(row => row[to.col]?.player === player && row[to.col]?.type === 'pawn' && !row[to.col]?.promoted);
  }

  return true;
}

function getDropEffects(board: GameState['board'], pieceType: PieceType, player: Player): EffectCell[] {
  const effects: EffectCell[] = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (canDropPiece(board, pieceType, player, { row, col })) {
        effects.push({ position: { row, col }, kind: 'flame', distance: 1 });
      }
    }
  }
  return effects;
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

function movePiece(board: GameState['board'], from: Position, to: Position, promote: boolean): GameState['board'] {
  const newBoard = cloneBoard(board);
  const movingPiece = newBoard[from.row][from.col];
  newBoard[to.row][to.col] = movingPiece && promote ? promotePiece(movingPiece) : movingPiece;
  newBoard[from.row][from.col] = null;
  return newBoard;
}

function dropPiece(board: GameState['board'], pieceType: PieceType, player: Player, to: Position): GameState['board'] {
  const newBoard = cloneBoard(board);
  newBoard[to.row][to.col] = { type: pieceType, player };
  return newBoard;
}

function isKingCaptured(piece: Piece | null): boolean {
  return piece?.type === 'king';
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
        if (!isValidDrop) {
          return { ...prev, selectedHandPiece: null, effects: [] };
        }

        return {
          ...prev,
          board: dropPiece(board, selectedHandPiece, currentPlayer, pos),
          hands: removeHandPiece(prev.hands, currentPlayer, selectedHandPiece),
          selectedPos: null,
          selectedHandPiece: null,
          effects: [],
          captureEffect: null,
          currentPlayer: 'white',
          moveCount: prev.moveCount + 1,
        };
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
        const winsByCapture = isKingCaptured(capturedPiece);

        if (mustPromote(movingPiece, pos)) {
          return {
            ...prev,
            board: movePiece(board, selectedPos, pos, true),
            hands: handsAfterCapture,
            selectedPos: null,
            selectedHandPiece: null,
            effects: [],
            captureEffect,
            currentPlayer: winsByCapture ? currentPlayer : 'white',
            gameOverWinner: winsByCapture ? currentPlayer : null,
            pendingPromotion: null,
            moveCount: prev.moveCount + 1,
          };
        }

        if (!winsByCapture && moveTouchesPromotionZone(movingPiece, selectedPos, pos)) {
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

        return {
          ...prev,
          board: movePiece(board, selectedPos, pos, false),
          hands: handsAfterCapture,
          selectedPos: null,
          selectedHandPiece: null,
          effects: [],
          captureEffect,
          currentPlayer: winsByCapture ? currentPlayer : currentPlayer === 'black' ? 'white' : 'black',
          gameOverWinner: winsByCapture ? currentPlayer : null,
          pendingPromotion: null,
          moveCount: prev.moveCount + 1,
        };
      }

      if (clickedPiece && clickedPiece.player === currentPlayer) {
        const newEffects: EffectCell[] = getValidMoves(board, pos, clickedPiece);
        return { ...prev, selectedPos: pos, selectedHandPiece: null, effects: newEffects };
      }

      return { ...prev, selectedPos: null, selectedHandPiece: null, effects: [] };
    });
  }, []);

  const selectHandPiece = useCallback((pieceType: PieceType) => {
    setState(prev => {
      if (prev.gameOverWinner || prev.currentPlayer === 'white' || prev.pendingPromotion) return prev;
      const isAlreadySelected = prev.selectedHandPiece === pieceType;
      return {
        ...prev,
        selectedPos: null,
        selectedHandPiece: isAlreadySelected ? null : pieceType,
        effects: isAlreadySelected ? [] : getDropEffects(prev.board, pieceType, 'black'),
      };
    });
  }, []);

  const answerPromotion = useCallback((promote: boolean) => {
    setState(prev => {
      if (!prev.pendingPromotion || prev.gameOverWinner) return prev;

      return {
        ...prev,
        board: movePiece(prev.board, prev.pendingPromotion.from, prev.pendingPromotion.to, promote),
        selectedPos: null,
        selectedHandPiece: null,
        effects: [],
        pendingPromotion: null,
        currentPlayer: 'white',
        moveCount: prev.moveCount + 1,
      };
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
          return {
            ...prev,
            currentPlayer: 'black',
            selectedPos: null,
            selectedHandPiece: null,
            effects: [],
          };
        }

        if (cpuMove.dropPiece) {
          return {
            ...prev,
            board: dropPiece(prev.board, cpuMove.dropPiece, 'white', cpuMove.to),
            hands: removeHandPiece(prev.hands, 'white', cpuMove.dropPiece),
            selectedPos: null,
            selectedHandPiece: null,
            effects: [],
            captureEffect: null,
            currentPlayer: 'black',
            moveCount: prev.moveCount + 1,
          };
        }

        if (!cpuMove.from) return prev;

        const capturedPiece = prev.board[cpuMove.to.row][cpuMove.to.col];
        const winsByCapture = isKingCaptured(capturedPiece);

        return {
          ...prev,
          board: movePiece(prev.board, cpuMove.from, cpuMove.to, cpuMove.promote),
          hands: addCapturedPiece(prev.hands, 'white', capturedPiece),
          selectedPos: null,
          selectedHandPiece: null,
          effects: [],
          captureEffect: capturedPiece ? cpuMove.to : null,
          currentPlayer: winsByCapture ? 'white' : 'black',
          gameOverWinner: winsByCapture ? 'white' : null,
          pendingPromotion: null,
          moveCount: prev.moveCount + 1,
        };
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
