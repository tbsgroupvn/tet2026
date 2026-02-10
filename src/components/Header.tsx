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
        <div className="header-brand" onClick={() => nav('home')} onKeyDown={(e) => { if (e.key === 'Enter') nav('home'); }} role="button" tabIndex={0} aria-label="Về trang chủ">
          <img src="/tbs-logo.svg" alt="TBS Group" className="header-logo-img" />
          <div>
            <h1 className="header-title">TBS Group</h1>
            <p className="header-subtitle">Tết Nguyên Đán 2026</p>
          </div>
        </div>
        <nav className="header-nav" aria-label="Điều hướng chính">
          <button
            className={`nav-btn ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => nav('home')}
            aria-current={currentPage === 'home' ? 'page' : undefined}
          >
            🏠 Trang Chủ
          </button>
          <button
            className={`nav-btn ${currentPage === 'wishes' ? 'active' : ''}`}
            onClick={() => nav('wishes')}
            aria-current={currentPage === 'wishes' ? 'page' : undefined}
          >
            🧧 Lời Chúc
          </button>
          <button
            className={`nav-btn ${currentPage === 'achievements' ? 'active' : ''}`}
            onClick={() => nav('achievements')}
            aria-current={currentPage === 'achievements' ? 'page' : undefined}
          >
            🏅 Thành Tích
          </button>
          <button
            className={`nav-btn ${currentPage === 'rewards' ? 'active' : ''}`}
            onClick={() => nav('rewards')}
            aria-current={currentPage === 'rewards' ? 'page' : undefined}
          >
            🎁 Đổi Thưởng
          </button>
          <button
            className={`nav-btn ${currentPage === 'leaderboard' ? 'active' : ''}`}
            onClick={() => nav('leaderboard')}
            aria-current={currentPage === 'leaderboard' ? 'page' : undefined}
          >
            🏆 Xếp Hạng
          </button>
        </nav>
        <div className="header-player" aria-label={`Người chơi: ${player.name}, ${player.totalCoins} xu`}>
          <span className="player-name">{player.name}</span>
          <span className="player-coins">🪙 {player.totalCoins.toLocaleString()}</span>
        </div>
      </div>
    </header>
  );
}
