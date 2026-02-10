import { useMemo } from 'react';
import type { Player } from '../types';
import { getPlaysToday } from '../utils/limits';
import { isDailyChallengeCompleted } from '../utils/tbsQuiz';

interface Badge {
  id: string;
  icon: string;
  name: string;
  desc: string;
  check: (player: Player) => boolean;
}

const BADGES: Badge[] = [
  {
    id: 'first-login',
    icon: '🌅',
    name: 'Người Mới',
    desc: 'Đăng nhập lần đầu',
    check: () => true,
  },
  {
    id: 'coin-100',
    icon: '🪙',
    name: 'Tay Chơi',
    desc: 'Sở hữu 100 xu',
    check: (p) => p.totalCoins >= 100,
  },
  {
    id: 'coin-500',
    icon: '💰',
    name: 'Nhà Giàu',
    desc: 'Sở hữu 500 xu',
    check: (p) => p.totalCoins >= 500,
  },
  {
    id: 'coin-1000',
    icon: '🏦',
    name: 'Đại Gia',
    desc: 'Sở hữu 1,000 xu',
    check: (p) => p.totalCoins >= 1000,
  },
  {
    id: 'coin-5000',
    icon: '👑',
    name: 'Vua Xu',
    desc: 'Sở hữu 5,000 xu',
    check: (p) => p.totalCoins >= 5000,
  },
  {
    id: 'games-5',
    icon: '🎮',
    name: 'Khởi Động',
    desc: 'Chơi 5 lượt game',
    check: (p) => p.gamesPlayed >= 5,
  },
  {
    id: 'games-20',
    icon: '🔥',
    name: 'Siêng Năng',
    desc: 'Chơi 20 lượt game',
    check: (p) => p.gamesPlayed >= 20,
  },
  {
    id: 'games-50',
    icon: '⚡',
    name: 'Nghiện Game',
    desc: 'Chơi 50 lượt game',
    check: (p) => p.gamesPlayed >= 50,
  },
  {
    id: 'reward-1',
    icon: '🎁',
    name: 'Đổi Thưởng',
    desc: 'Đổi thưởng lần đầu',
    check: (p) => p.rewards.length >= 1,
  },
  {
    id: 'reward-3',
    icon: '🏆',
    name: 'Săn Thưởng',
    desc: 'Đổi 3 phần thưởng',
    check: (p) => p.rewards.length >= 3,
  },
  {
    id: 'all-games',
    icon: '🌟',
    name: 'Nhân Viên Toàn Diện',
    desc: 'Chơi thử tất cả 10 game trong ngày',
    check: () => {
      const games = ['lac-li-xi', 'bau-cua', 'vong-quay', 'tai-xiu', 'bai-cao', 'boc-que', 'xin-xam', 'cung-ong-ba', 'do-vui-tbs', 'cao-ve-so'];
      return games.every(g => getPlaysToday(g) > 0);
    },
  },
  {
    id: 'early-bird',
    icon: '🐓',
    name: 'Chim Sớm',
    desc: 'Chơi trước 8 giờ sáng',
    check: () => new Date().getHours() < 8,
  },
  // === THÀNH TÍCH VĂN HÓA TBS ===
  {
    id: 'culture-quiz-player',
    icon: '⚖️',
    name: 'Bách Khoa TBS',
    desc: 'Chơi Đố Vui TBS ít nhất 1 lượt',
    check: () => getPlaysToday('do-vui-tbs') > 0,
  },
  {
    id: 'culture-quiz-master',
    icon: '📢',
    name: 'Hiểu Biết Văn Hóa',
    desc: 'Chơi Đố Vui TBS 3 lượt trong ngày',
    check: () => getPlaysToday('do-vui-tbs') >= 3,
  },
  {
    id: 'culture-daily',
    icon: '🎯',
    name: 'Thử Thách Hằng Ngày',
    desc: 'Hoàn thành Thử Thách Văn Hóa trong ngày',
    check: () => isDailyChallengeCompleted(),
  },
  {
    id: 'culture-messenger',
    icon: '💌',
    name: 'Truyền Thông Tích Cực',
    desc: 'Gửi lời chúc cho đồng nghiệp',
    check: () => {
      try {
        const wishes = JSON.parse(localStorage.getItem('tbs_tet2026_wishes') || '[]');
        return wishes.length >= 1;
      } catch { return false; }
    },
  },
  {
    id: 'culture-connector',
    icon: '🤝',
    name: 'Gắn Kết Đồng Nghiệp',
    desc: 'Gửi 5 lời chúc cho đồng nghiệp',
    check: () => {
      try {
        const wishes = JSON.parse(localStorage.getItem('tbs_tet2026_wishes') || '[]');
        return wishes.length >= 5;
      } catch { return false; }
    },
  },
  {
    id: 'nice-professional',
    icon: '🏅',
    name: 'Nice & Professional',
    desc: 'Chơi 30+ lượt game — kiên trì và chuyên nghiệp!',
    check: (p) => p.gamesPlayed >= 30,
  },
];

interface Props {
  player: Player;
}

export default function Achievements({ player }: Props) {
  const earned = useMemo(
    () => BADGES.filter(b => b.check(player)),
    [player]
  );
  const locked = BADGES.filter(b => !b.check(player));

  return (
    <div className="achievements">
      <h3>🏅 Thành Tích</h3>
      <p className="achieve-count">
        Đã mở khóa <strong>{earned.length}</strong> / {BADGES.length} thành tích
      </p>

      <div className="achieve-progress-bar">
        <div
          className="achieve-progress-fill"
          style={{ width: `${(earned.length / BADGES.length) * 100}%` }}
        />
      </div>

      <div className="achieve-grid">
        {earned.map(b => (
          <div key={b.id} className="achieve-card earned">
            <span className="achieve-icon">{b.icon}</span>
            <span className="achieve-name">{b.name}</span>
            <span className="achieve-desc">{b.desc}</span>
          </div>
        ))}
        {locked.map(b => (
          <div key={b.id} className="achieve-card locked">
            <span className="achieve-icon">🔒</span>
            <span className="achieve-name">???</span>
            <span className="achieve-desc">{b.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
