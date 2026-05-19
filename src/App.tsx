import { useState } from 'react';
import { PieceType } from './types/shogi';
import { useShogi } from './hooks/useShogi';
import { Header } from './components/Header';
import { Board } from './components/Board';
import { Controls } from './components/Controls';
import { OpeningScreen } from './components/OpeningScreen';
import { PieceStand } from './components/PieceStand';
import { UnitGuide } from './components/UnitGuide';

function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const { state, handleCellClick, selectHandPiece, answerPromotion, reset, toggleSE, setCpuLevel } = useShogi();

  const selectedBoardPiece = state.selectedPos
    ? state.board[state.selectedPos.row]?.[state.selectedPos.col]
    : null;
  const activeGuidePieceType: PieceType | null = state.selectedHandPiece ?? selectedBoardPiece?.type ?? null;

  const handleRestart = () => {
    reset();
    setHasStarted(false);
  };

  return (
    <div className="app-root">
      <div className="scanlines" />
      {!hasStarted ? (
        <OpeningScreen
          cpuLevel={state.cpuLevel}
          onCpuLevelChange={setCpuLevel}
          onStart={() => setHasStarted(true)}
        />
      ) : (
        <div className="game-layout">
          <div className="app-content">
            <Header
              moveCount={state.moveCount}
              currentPlayer={state.currentPlayer}
              seEnabled={state.seEnabled}
              onToggleSE={toggleSE}
              onReset={reset}
            />
            <main className="main-area">
              <PieceStand
                player="white"
                label="CPU CAPTURED"
                hands={state.hands}
                selectedHandPiece={null}
                currentPlayer={state.currentPlayer}
                onSelectHandPiece={selectHandPiece}
              />
              <div className="player-tag cpu-tag">
                <span className="player-label cpu-label">▽ CPU  GOTE</span>
                <span className="player-hp">LV {state.cpuLevel.toUpperCase()}</span>
              </div>
              <Board
                board={state.board}
                selectedPos={state.selectedPos}
                effects={state.effects}
                captureEffect={state.captureEffect}
                checkPlayer={state.checkPlayer}
                onCellClick={handleCellClick}
              />
              <div className="player-tag p1-tag">
                <span className="player-label p1-label">▲ 1P  SENTE</span>
                <span className="player-hp">■■■■■■■■ 100%</span>
              </div>
              <PieceStand
                player="black"
                label="1P CAPTURED"
                hands={state.hands}
                selectedHandPiece={state.selectedHandPiece}
                currentPlayer={state.currentPlayer}
                onSelectHandPiece={selectHandPiece}
              />
            </main>
            <Controls cpuLevel={state.cpuLevel} onCpuLevelChange={setCpuLevel} />
          </div>
          <UnitGuide activePieceType={activeGuidePieceType} />
        </div>
      )}
      {state.pendingPromotion && (
        <div className="promotion-overlay">
          <div className="promotion-panel">
            <div className="promotion-title">PROMOTE?</div>
            <div className="promotion-text">敵陣に入りました。成りますか？</div>
            <div className="promotion-actions">
              <button className="retro-btn promote-btn" onClick={() => answerPromotion(true)}>成る</button>
              <button className="retro-btn decline-btn" onClick={() => answerPromotion(false)}>成らない</button>
            </div>
          </div>
        </div>
      )}
      {state.gameOverWinner && (
        <div className="game-over-overlay">
          <div className="game-over-panel">
            <div className="game-over-title">CHECKMATE</div>
            <div className="game-over-winner">
              {state.gameOverWinner === 'black' ? '1P WIN!' : 'CPU WIN!'}
            </div>
            <div className="game-over-text">玉の逃げ場がありません。終局です。</div>
            <button className="retro-btn start-btn" onClick={handleRestart}>TITLE</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
