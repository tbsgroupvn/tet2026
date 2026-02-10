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
import BocQue from './games/BocQue';
import TaiXiu from './games/TaiXiu';
import BaiCao from './games/BaiCao';
import XinXam from './games/XinXam';
import CungOngBa from './games/CungOngBa';
import DoVuiTBS from './games/DoVuiTBS';
import { TBS_CORE_VALUES, getRandomCultureTip } from './utils/tbsQuiz';
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
          {currentGame === 'boc-que' && <BocQue {...gameProps} />}
          {currentGame === 'tai-xiu' && <TaiXiu {...gameProps} />}
          {currentGame === 'bai-cao' && <BaiCao {...gameProps} />}
          {currentGame === 'xin-xam' && <XinXam {...gameProps} />}
          {currentGame === 'cung-ong-ba' && <CungOngBa {...gameProps} />}
          {currentGame === 'do-vui-tbs' && <DoVuiTBS {...gameProps} />}
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
              <GameCard
                emoji="🎲"
                title="Tài Xỉu"
                description="Đoán tổng 3 xúc xắc Tài hay Xỉu! Đoán đúng thắng gấp đôi!"
                color="#9b59b6"
                onClick={() => setCurrentGame('tai-xiu')}
              />
              <GameCard
                emoji="🃏"
                title="Bài Cào"
                description="Chia 3 lá bài, so điểm với nhà cái! Được 8-9 nút thắng đậm!"
                color="#2ecc71"
                onClick={() => setCurrentGame('bai-cao')}
              />
              <GameCard
                emoji="🔮"
                title="Bốc Quẻ Đầu Năm"
                description="Bốc quẻ xem vận mệnh năm mới! Lời tiên tri và xu thưởng!"
                color="#e67e22"
                onClick={() => setCurrentGame('boc-que')}
              />
              <GameCard
                emoji="🛕"
                title="Xin Xăm Chùa"
                description="Lắc ống xăm đầu năm! Thẻ xăm kèm thơ và lời giải!"
                color="#1abc9c"
                onClick={() => setCurrentGame('xin-xam')}
              />
              <GameCard
                emoji="🪷"
                title="Cúng Ông Bà"
                description="Lật tìm cặp lễ vật bày mâm cỗ cúng Tổ Tiên! Trí nhớ tốt = nhiều xu!"
                color="#c0392b"
                onClick={() => setCurrentGame('cung-ong-ba')}
              />
              <GameCard
                emoji="🏢"
                title="Đố Vui TBS"
                description="Trả lời câu hỏi về văn hóa, dịch vụ và giá trị TBS Group — vừa chơi vừa học!"
                color="#3498db"
                onClick={() => setCurrentGame('do-vui-tbs')}
              />
            </div>

            {/* Giá Trị Cốt Lõi TBS Group */}
            <div className="culture-section">
              <h3 className="section-title">Giá Trị Cốt Lõi TBS Group</h3>
              <div className="culture-values-grid">
                {TBS_CORE_VALUES.map((v, i) => (
                  <div key={i} className="culture-value-card">
                    <span className="culture-value-icon">{v.icon}</span>
                    <h4 className="culture-value-title">{v.title}</h4>
                    <p className="culture-value-desc">{v.desc}</p>
                  </div>
                ))}
              </div>
              <div className="culture-tip-box">
                <p>{getRandomCultureTip()}</p>
              </div>
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
