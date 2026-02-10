import { useState, useEffect } from 'react';
import { getLeaderboard } from '../utils/storage';
import { fetchLeaderboard, fetchStats } from '../utils/api';
import type { Player } from '../types';
import type { LeaderboardEntry, GameStats } from '../utils/api';

interface LeaderboardProps {
  currentPlayer: Player;
}

const DEPARTMENTS = [
  'Tất cả',
  'Ban Giám Đốc',
  'Phòng Nhân Sự',
  'Phòng Marketing',
  'Phòng Chăm Sóc Khách Hàng',
  'Phòng Kinh Doanh',
  'Phòng Xuất Nhập Khẩu',
  'Bộ Phận Kho',
  'Bộ Phận Bán Hàng Senliving',
];

export default function Leaderboard({ currentPlayer }: LeaderboardProps) {
  const [serverPlayers, setServerPlayers] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [filterDept, setFilterDept] = useState('Tất cả');
  const [loading, setLoading] = useState(true);
  const [useServer, setUseServer] = useState(true);

  // Fallback to localStorage
  const localPlayers = getLeaderboard();

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const [lb, st] = await Promise.all([fetchLeaderboard(), fetchStats()]);
        if (mounted) {
          if (lb.length > 0) {
            setServerPlayers(lb);
            setUseServer(true);
          } else {
            setUseServer(false);
          }
          setStats(st);
        }
      } catch {
        if (mounted) {
          setUseServer(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    load();

    // Auto-refresh every 30s
    const interval = setInterval(load, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  // Merge server data with local data for display
  const players = useServer
    ? serverPlayers.map(p => ({
        id: p.id,
        name: p.name,
        department: p.department,
        totalCoins: p.total_coins,
        gamesPlayed: p.games_played,
      }))
    : localPlayers.map(p => ({
        id: p.id,
        name: p.name,
        department: p.department,
        totalCoins: p.totalCoins,
        gamesPlayed: p.gamesPlayed,
      }));

  const filtered = filterDept === 'Tất cả'
    ? players
    : players.filter(p => p.department === filterDept);

  const currentRank = filtered.findIndex((p) => p.id === currentPlayer.id) + 1;

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
        {useServer && <span className="lb-live-badge">TRỰC TIẾP</span>}
        {currentRank > 0 && (
          <p className="lb-your-rank">
            Hạng của bạn: <strong>{getMedal(currentRank)}</strong> ({currentPlayer.totalCoins.toLocaleString()} xu)
          </p>
        )}
      </div>

      {/* Statistics */}
      {stats && (
        <div className="lb-stats-bar">
          <div className="lb-stat">
            <span className="lb-stat-num">{stats.total_players}</span>
            <span className="lb-stat-label">Người chơi</span>
          </div>
          <div className="lb-stat">
            <span className="lb-stat-num">{(stats.total_coins || 0).toLocaleString()}</span>
            <span className="lb-stat-label">Tổng xu</span>
          </div>
          <div className="lb-stat">
            <span className="lb-stat-num">{stats.total_games || 0}</span>
            <span className="lb-stat-label">Lượt chơi</span>
          </div>
        </div>
      )}

      {/* Department filter */}
      <div className="lb-dept-filter">
        {DEPARTMENTS.map(dept => (
          <button
            key={dept}
            className={`lb-dept-btn ${filterDept === dept ? 'active' : ''}`}
            onClick={() => setFilterDept(dept)}
          >
            {dept}
          </button>
        ))}
      </div>

      {/* Department stats */}
      {stats && filterDept === 'Tất cả' && stats.departments.length > 0 && (
        <div className="lb-dept-ranking">
          <h4>🏢 Xếp hạng theo phòng ban</h4>
          <div className="lb-dept-cards">
            {stats.departments.map((d, i) => (
              <div key={d.department} className="lb-dept-card">
                <span className="lb-dept-rank">{getMedal(i + 1)}</span>
                <span className="lb-dept-name">{d.department}</span>
                <span className="lb-dept-coins">🪙 {(d.total_coins || 0).toLocaleString()}</span>
                <span className="lb-dept-count">{d.player_count} người</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <p className="lb-loading">Đang tải bảng xếp hạng...</p>
      ) : filtered.length === 0 ? (
        <p className="lb-empty">Chưa có ai chơi{filterDept !== 'Tất cả' ? ` trong ${filterDept}` : ''}. Hãy là người đầu tiên!</p>
      ) : (
        <div className="lb-table">
          <div className="lb-row lb-row-header">
            <span className="lb-rank">Hạng</span>
            <span className="lb-name">Tên</span>
            <span className="lb-dept">Phòng Ban</span>
            <span className="lb-games">Lượt Chơi</span>
            <span className="lb-coins">Xu</span>
          </div>
          {filtered.slice(0, 50).map((p, i) => (
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
