import { useShogi } from './hooks/useShogi';
import { Header } from './components/Header';
import { Board } from './components/Board';
import { Controls } from './components/Controls';

function App() {
  const { state, handleCellClick, reset, toggleSE } = useShogi();

  return (
    <div className="app-root">
      <div className="scanlines" />
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
            <span className="player-hp">■■■■■■■■ 100%</span>
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
        <Controls />
      </div>
    </div>
  );
}

export default App;
