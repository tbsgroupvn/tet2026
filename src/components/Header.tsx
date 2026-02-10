import type { Player } from '../types';

interface HeaderProps {
  player: Player;
  onNavigate: (page: string) => void;
  currentPage: string;
}

export default function Header({ player, onNavigate, currentPage }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand" onClick={() => onNavigate('home')}>
          <span className="header-logo">🧧</span>
          <div>
            <h1 className="header-title">TBS Group</h1>
            <p className="header-subtitle">Tết Nguyên Đán 2026</p>
          </div>
        </div>
        <nav className="header-nav">
          <button
            className={`nav-btn ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => onNavigate('home')}
          >
            🏠 Trang Chủ
          </button>
          <button
            className={`nav-btn ${currentPage === 'rewards' ? 'active' : ''}`}
            onClick={() => onNavigate('rewards')}
          >
            🎁 Phần Thưởng
          </button>
          <button
            className={`nav-btn ${currentPage === 'leaderboard' ? 'active' : ''}`}
            onClick={() => onNavigate('leaderboard')}
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
