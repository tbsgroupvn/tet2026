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
              <img src="/tbs-logo.svg" alt="TBS Group" className="welcome-logo" />
              <h2>Chúc Mừng Năm Mới 2026!</h2>
              <p className="welcome-wish">
                Kính chúc Quý Anh Chị Em cán bộ nhân viên TBS Group
                <br />
                một năm mới <strong>An Khang Thịnh Vượng</strong>, vạn sự như ý,
                <br />
                sức khỏe dồi dào, tài lộc đầy nhà!
              </p>
              <div className="tet-greeting">
                🌸 Tân Xuân Bính Ngọ - Phúc Lộc Song Toàn 🌸
              </div>
              <div className="welcome-stats">
                <div className="stat">
                  <span className="stat-value">{player.totalCoins.toLocaleString()}</span>
                  <span className="stat-label">Xu của bạn</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{player.gamesPlayed}</span>
                  <span className="stat-label">Lượt chơi</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{player.rewards.length}</span>
                  <span className="stat-label">Quà đã đổi</span>
                </div>
              </div>
            </div>

            <h3 className="section-title">Chọn Trò Chơi</h3>
            <div className="games-grid">
              <GameCard
                emoji="🧧"
                title="Lắc Lì Xì"
                description="Lắc lì xì nhận xu may mắn! Mỗi phong bao là một bất ngờ!"
                color="#e74c3c"
                onClick={() => setCurrentGame('lac-li-xi')}
              />
              <GameCard
                emoji="🎲"
                title="Bầu Cua Tôm Cá"
                description="Game dân gian kinh điển! Đặt cược và lắc xúc xắc!"
                color="#f39c12"
                onClick={() => setCurrentGame('bau-cua')}
              />
              <GameCard
                emoji="🎡"
                title="Vòng Quay Tài Lộc"
                description="Quay vòng quay may mắn! Cơ hội trúng lớn!"
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
        <img src="/tbs-logo.svg" alt="TBS Group" className="footer-logo" />
        <p>TBS Group - Tết Nguyên Đán 2026</p>
        <p>Chúc Mừng Năm Mới - Vạn Sự Như Ý - An Khang Thịnh Vượng</p>
      </footer>
    </div>
  );
}
