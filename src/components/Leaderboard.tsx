import { getLeaderboard } from '../utils/storage';
import type { Player } from '../types';

interface LeaderboardProps {
  currentPlayer: Player;
}

export default function Leaderboard({ currentPlayer }: LeaderboardProps) {
  const players = getLeaderboard();
  const currentRank = players.findIndex((p) => p.id === currentPlayer.id) + 1;

  const getMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="leaderboard">
      <div className="lb-header">
        <h2>🏆 Bảng Xếp Hạng</h2>
        {currentRank > 0 && (
          <p className="lb-your-rank">
            Hạng của bạn: <strong>{getMedal(currentRank)}</strong> ({currentPlayer.totalCoins.toLocaleString()} xu)
          </p>
        )}
      </div>

      {players.length === 0 ? (
        <p className="lb-empty">Chưa có ai chơi. Hãy là người đầu tiên!</p>
      ) : (
        <div className="lb-table">
          <div className="lb-row lb-row-header">
            <span className="lb-rank">Hạng</span>
            <span className="lb-name">Tên</span>
            <span className="lb-dept">Phòng Ban</span>
            <span className="lb-games">Lượt Chơi</span>
            <span className="lb-coins">Xu</span>
          </div>
          {players.slice(0, 50).map((p, i) => (
            <div
              key={p.id}
              className={`lb-row ${p.id === currentPlayer.id ? 'lb-row-me' : ''} ${i < 3 ? 'lb-row-top' : ''}`}
            >
              <span className="lb-rank">{getMedal(i + 1)}</span>
              <span className="lb-name">{p.name}</span>
              <span className="lb-dept">{p.department}</span>
              <span className="lb-games">{p.gamesPlayed}</span>
              <span className="lb-coins">🪙 {p.totalCoins.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
