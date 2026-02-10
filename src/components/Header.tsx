import type { Player } from '../types';
import { playClick } from '../utils/sounds';

interface HeaderProps {
  player: Player;
  onNavigate: (page: string) => void;
  currentPage: string;
}

export default function Header({ player, onNavigate, currentPage }: HeaderProps) {
  const nav = (page: string) => {
    playClick();
    onNavigate(page);
  };

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand" onClick={() => nav('home')}>
          <img src="/tbs-logo.svg" alt="TBS Group" className="header-logo-img" />
          <div>
            <h1 className="header-title">TBS Group</h1>
            <p className="header-subtitle">Tết Nguyên Đán 2026</p>
          </div>
        </div>
        <nav className="header-nav">
          <button
            className={`nav-btn ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => nav('home')}
          >
            🏠 Trang Chủ
          </button>
          <button
            className={`nav-btn ${currentPage === 'wishes' ? 'active' : ''}`}
            onClick={() => nav('wishes')}
          >
            🧧 Lời Chúc
          </button>
          <button
            className={`nav-btn ${currentPage === 'achievements' ? 'active' : ''}`}
            onClick={() => nav('achievements')}
          >
            🏅 Thành Tích
          </button>
          <button
            className={`nav-btn ${currentPage === 'rewards' ? 'active' : ''}`}
            onClick={() => nav('rewards')}
          >
            🎁 Đổi Thưởng
          </button>
          <button
            className={`nav-btn ${currentPage === 'leaderboard' ? 'active' : ''}`}
            onClick={() => nav('leaderboard')}
          >
            🏆 Xếp Hạng
          </button>
        </nav>
        <div className="header-player">
          <span className="player-name">{player.name}</span>
          <span className="player-coins">🪙 {player.totalCoins.toLocaleString()}</span>
        </div>
      </div>
    </header>
  );
}
