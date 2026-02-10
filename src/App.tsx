import { useState, useEffect } from 'react';
import type { Player, GameType } from './types';
import { getPlayer, createPlayer } from './utils/storage';
import Fireworks from './components/Fireworks';
import FallingElements from './components/FallingElements';
import Header from './components/Header';
import LoginScreen from './components/LoginScreen';
import GameCard from './components/GameCard';
import RewardShop from './components/RewardShop';
import Leaderboard from './components/Leaderboard';
import LacLiXi from './games/LacLiXi';
import BauCua from './games/BauCua';
import VongQuay from './games/VongQuay';
import './App.css';

type Page = 'home' | 'rewards' | 'leaderboard';

export default function App() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [currentGame, setCurrentGame] = useState<GameType | null>(null);

  useEffect(() => {
    const saved = getPlayer();
    if (saved) setPlayer(saved);
  }, []);

  const handleLogin = (name: string, department: string) => {
    const p = createPlayer(name, department);
    setPlayer(p);
  };

  const handlePlayerUpdate = (updated: Player) => {
    setPlayer(updated);
  };

  if (!player) {
    return (
      <div className="app">
        <Fireworks />
        <FallingElements />
        <LoginScreen onLogin={handleLogin} />
      </div>
    );
  }

  if (currentGame) {
    const gameProps = {
      player,
      onUpdate: handlePlayerUpdate,
      onBack: () => setCurrentGame(null),
    };

    return (
      <div className="app">
        <Fireworks />
        <Header player={player} onNavigate={(p) => { setCurrentGame(null); setCurrentPage(p as Page); }} currentPage={currentPage} />
        <main className="main-content">
          {currentGame === 'lac-li-xi' && <LacLiXi {...gameProps} />}
          {currentGame === 'bau-cua' && <BauCua {...gameProps} />}
          {currentGame === 'vong-quay' && <VongQuay {...gameProps} />}
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <Fireworks />
      <FallingElements />
      <Header player={player} onNavigate={(p) => setCurrentPage(p as Page)} currentPage={currentPage} />
      <main className="main-content">
        {currentPage === 'home' && (
          <div className="home-page">
            <div className="welcome-banner">
              <h2>Chuc Mung Nam Moi 2026!</h2>
              <p>Chuc anh chi em TBS Group suc khoe, hanh phuc, phat tai!</p>
              <div className="welcome-stats">
                <div className="stat">
                  <span className="stat-value">{player.totalCoins.toLocaleString()}</span>
                  <span className="stat-label">Xu cua ban</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{player.gamesPlayed}</span>
                  <span className="stat-label">Luot choi</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{player.rewards.length}</span>
                  <span className="stat-label">Qua da doi</span>
                </div>
              </div>
            </div>

            <h3 className="section-title">Chon Tro Choi</h3>
            <div className="games-grid">
              <GameCard
                emoji="🧧"
                title="Lac Li Xi"
                description="Lac li xi nhan xu may man! Moi phong bao la mot bat ngo!"
                color="#e74c3c"
                onClick={() => setCurrentGame('lac-li-xi')}
              />
              <GameCard
                emoji="🎲"
                title="Bau Cua Tom Ca"
                description="Game dan gian kinh dien! Dat cuoc va lac xuc xac!"
                color="#f39c12"
                onClick={() => setCurrentGame('bau-cua')}
              />
              <GameCard
                emoji="🎡"
                title="Vong Quay Tai Loc"
                description="Quay vong quay may man! Co hoi trung lon!"
                color="#e91e63"
                onClick={() => setCurrentGame('vong-quay')}
              />
            </div>
          </div>
        )}

        {currentPage === 'rewards' && (
          <RewardShop player={player} onUpdate={handlePlayerUpdate} />
        )}

        {currentPage === 'leaderboard' && (
          <Leaderboard currentPlayer={player} />
        )}
      </main>

      <footer className="footer">
        <p>TBS Group - Tet Nguyen Dan 2026</p>
        <p>Chuc Mung Nam Moi - Van Su Nhu Y</p>
      </footer>
    </div>
  );
}
