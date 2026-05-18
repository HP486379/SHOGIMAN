import { useState } from 'react';
import { useShogi } from './hooks/useShogi';
import { Header } from './components/Header';
import { Board } from './components/Board';
import { Controls } from './components/Controls';
import { OpeningScreen } from './components/OpeningScreen';

function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const { state, handleCellClick, answerPromotion, reset, toggleSE, setCpuLevel } = useShogi();

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
        <div className="app-content">
          <Header
            moveCount={state.moveCount}
            currentPlayer={state.currentPlayer}
            seEnabled={state.seEnabled}
            onToggleSE={toggleSE}
            onReset={reset}
          />
          <main className="main-area">
            <div className="player-tag cpu-tag">
              <span className="player-label cpu-label">▽ CPU  GOTE</span>
              <span className="player-hp">LV {state.cpuLevel.toUpperCase()}</span>
            </div>
            <Board
              board={state.board}
              selectedPos={state.selectedPos}
              effects={state.effects}
              onCellClick={handleCellClick}
            />
            <div className="player-tag p1-tag">
              <span className="player-label p1-label">▲ 1P  SENTE</span>
              <span className="player-hp">■■■■■■■■ 100%</span>
            </div>
          </main>
          <Controls cpuLevel={state.cpuLevel} onCpuLevelChange={setCpuLevel} />
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
    </div>
  );
}

export default App;
