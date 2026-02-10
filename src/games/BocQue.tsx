import { useState } from 'react';
import type { Player } from '../types';
import { addCoins } from '../utils/storage';
import { getGreeting } from '../utils/greetings';
import { canPlay, recordPlay, getRemainingPlays } from '../utils/limits';
import GameRules from '../components/GameRules';

const RULES = [
  'Nhập họ tên và ngày tháng năm sinh trước khi bốc quẻ.',
  'Hệ thống sẽ tính con giáp và ngũ hành dựa trên năm sinh.',
  'Nhấn vào ống quẻ để bốc quẻ — mỗi quẻ kèm bài thơ và lời giải.',
  'Có 6 mức quẻ: Thượng Thượng, Thượng, Trung Thượng, Trung, Trung Hạ, Hạ.',
  'Lần bốc quẻ đầu tiên trong ngày sẽ nhận xu thưởng (10-50 xu tùy quẻ).',
  'Các lần bốc sau vẫn xem được quẻ nhưng không nhận thêm xu.',
];

interface BocQueProps {
  player: Player;
  onUpdate: (player: Player) => void;
  onBack: () => void;
}

const QUE_LIST = [
  {
    name: 'Quẻ Thượng Thượng',
    rank: '🏆',
    poem: 'Rồng mây gặp hội ưng bay bổng\nPhú quý vinh hoa tự nhiên thành',
    meaning: 'Vận may tột đỉnh! Mọi việc đều thuận lợi, tài lộc dồi dào, công danh rực rỡ.',
    coins: 50,
    color: '#ffd700',
    weight: 5,
  },
  {
    name: 'Quẻ Thượng',
    rank: '⭐',
    poem: 'Xuân về hoa nở khắp vườn đào\nChim hót líu lo gió ngọt ngào',
    meaning: 'Năm mới nhiều may mắn, công việc hanh thông, gia đạo bình an.',
    coins: 30,
    color: '#ff6b6b',
    weight: 15,
  },
  {
    name: 'Quẻ Trung Thượng',
    rank: '🌟',
    poem: 'Cần cù bù thông minh\nKiên nhẫn ắt thành công',
    meaning: 'Nỗ lực sẽ được đền đáp. Giữ vững tinh thần, thành quả sẽ đến.',
    coins: 20,
    color: '#4ecdc4',
    weight: 25,
  },
  {
    name: 'Quẻ Trung',
    rank: '☯️',
    poem: 'Nước chảy đá mòn, trời quang mây tạnh\nBình tâm xử thế, vạn sự an lành',
    meaning: 'Năm bình ổn, không sóng gió lớn. Giữ tâm an nhiên sẽ vượt qua mọi thử thách.',
    coins: 15,
    color: '#45b7d1',
    weight: 25,
  },
  {
    name: 'Quẻ Trung Hạ',
    rank: '🌙',
    poem: 'Mây đen che nhật nguyệt\nGió lớn rồi trời quang',
    meaning: 'Đầu năm có chút trắc trở nhưng cuối năm sẽ tốt đẹp. Kiên nhẫn là chìa khóa.',
    coins: 10,
    color: '#96ceb4',
    weight: 20,
  },
  {
    name: 'Quẻ Hạ',
    rank: '🍀',
    poem: 'Sau cơn mưa trời lại sáng\nHết khổ rồi sẽ đến ngày vui',
    meaning: 'Cần cẩn thận trong chi tiêu và quyết định. Nhưng đừng lo, vận may đang chờ phía trước!',
    coins: 10,
    color: '#a8e6cf',
    weight: 10,
  },
];

function getRandomQue() {
  const totalWeight = QUE_LIST.reduce((sum, q) => sum + q.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const que of QUE_LIST) {
    rand -= que.weight;
    if (rand <= 0) return que;
  }
  return QUE_LIST[3];
}

function getZodiac(year: number): string {
  const zodiacs = ['Thân (Khỉ)', 'Dậu (Gà)', 'Tuất (Chó)', 'Hợi (Lợn)', 'Tý (Chuột)', 'Sửu (Trâu)', 'Dần (Hổ)', 'Mão (Mèo)', 'Thìn (Rồng)', 'Tỵ (Rắn)', 'Ngọ (Ngựa)', 'Mùi (Dê)'];
  return zodiacs[year % 12];
}

function getElement(year: number): string {
  const elements = ['Kim', 'Kim', 'Thủy', 'Thủy', 'Mộc', 'Mộc', 'Hỏa', 'Hỏa', 'Thổ', 'Thổ'];
  return elements[year % 10];
}

export default function BocQue({ player, onUpdate, onBack }: BocQueProps) {
  const [fullName, setFullName] = useState(player.name);
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [infoSubmitted, setInfoSubmitted] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [result, setResult] = useState<typeof QUE_LIST[0] | null>(null);
  const [greeting, setGreeting] = useState('');
  const [coinAwarded, setCoinAwarded] = useState(!canPlay('boc-que'));
  const remaining = getRemainingPlays('boc-que');

  const handleSubmitInfo = () => {
    if (!fullName.trim() || !birthDay || !birthMonth || !birthYear) return;
    setInfoSubmitted(true);
  };

  const handleBocQue = () => {
    if (shaking) return;
    setShaking(true);
    setResult(null);
    setGreeting('');

    setTimeout(() => {
      const que = getRandomQue();
      setResult(que);
      setGreeting(getGreeting(player.department));

      if (!coinAwarded && canPlay('boc-que')) {
        recordPlay('boc-que');
        const updated = addCoins(player, que.coins, 'Bốc Quẻ', `${que.name}: +${que.coins} xu`);
        onUpdate(updated);
        setCoinAwarded(true);
      }

      setShaking(false);
    }, 2500);
  };

  const yearNum = parseInt(birthYear);
  const zodiac = yearNum ? getZodiac(yearNum) : '';
  const element = yearNum ? getElement(yearNum) : '';

  if (!infoSubmitted) {
    return (
      <div className="game-page boc-que">
        <button className="back-btn" onClick={onBack}>← Quay Lại</button>
        <div className="game-content">
          <h2>🔮 Bốc Quẻ Đầu Năm</h2>
          <p className="game-instruction">
            Nhập thông tin để bốc quẻ xem vận mệnh năm mới!
          </p>
          <GameRules rules={RULES} />

          <div className="fortune-form">
            <div className="fortune-field">
              <label>Họ và Tên:</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="fortune-input"
              />
            </div>
            <div className="fortune-field">
              <label>Ngày sinh:</label>
              <div className="fortune-date-row">
                <select value={birthDay} onChange={(e) => setBirthDay(e.target.value)} className="fortune-select">
                  <option value="">Ngày</option>
                  {Array.from({ length: 31 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
                  ))}
                </select>
                <select value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)} className="fortune-select">
                  <option value="">Tháng</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1)}>Tháng {i + 1}</option>
                  ))}
                </select>
                <select value={birthYear} onChange={(e) => setBirthYear(e.target.value)} className="fortune-select">
                  <option value="">Năm</option>
                  {Array.from({ length: 60 }, (_, i) => {
                    const y = 2008 - i;
                    return <option key={y} value={String(y)}>{y}</option>;
                  })}
                </select>
              </div>
            </div>
            <button
              className="fortune-submit-btn"
              onClick={handleSubmitInfo}
              disabled={!fullName.trim() || !birthDay || !birthMonth || !birthYear}
            >
              🔮 Xem Quẻ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-page boc-que">
      <button className="back-btn" onClick={onBack}>← Quay Lại</button>
      <div className="game-content">
        <h2>🔮 Bốc Quẻ Đầu Năm</h2>
        <p className="game-instruction">
          Thành tâm bốc quẻ để xem vận mệnh năm mới!
        </p>
        <GameRules rules={RULES} />

        <div className="fortune-info-display">
          <p><strong>{fullName}</strong> — Sinh ngày {birthDay}/{birthMonth}/{birthYear}</p>
          <p>Tuổi: {zodiac} | Mệnh: {element}</p>
        </div>

        {coinAwarded && (
          <div className="limit-notice">
            🔒 Đã nhận xu hôm nay. Bạn vẫn có thể bốc quẻ xem vận mệnh (không nhận thêm xu).
          </div>
        )}
        {!coinAwarded && remaining > 0 && (
          <div className="limit-info">
            🎁 Còn {remaining} lượt nhận xu hôm nay
          </div>
        )}

        <div className="bq-altar">
          <div className="bq-incense">🕯️ 🪷 🕯️</div>
          <div
            className={`bq-tube ${shaking ? 'shaking' : ''}`}
            onClick={handleBocQue}
          >
            {shaking ? (
              <>
                <span className="bq-tube-icon">🎋</span>
                <span className="bq-tube-text">Đang xin quẻ...</span>
              </>
            ) : (
              <>
                <span className="bq-tube-icon">🎋</span>
                <span className="bq-tube-text">Nhấn để bốc quẻ</span>
              </>
            )}
          </div>
        </div>

        {result && (
          <div className="bq-result" style={{ borderColor: result.color }}>
            <div className="bq-result-header" style={{ background: result.color }}>
              <span className="bq-rank">{result.rank}</span>
              <span className="bq-name">{result.name}</span>
              {!coinAwarded || remaining === 0 ? null : (
                <span className="bq-coins">+{result.coins} xu</span>
              )}
            </div>
            <div className="bq-poem">
              {result.poem.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
            <div className="bq-meaning">
              <strong>Giải quẻ:</strong> {result.meaning}
            </div>
            {greeting && (
              <div className="greeting-box">
                <p className="greeting-text">🌸 {greeting}</p>
              </div>
            )}
            <button className="bq-again-btn" onClick={handleBocQue}>
              🔮 Bốc Quẻ Lần Nữa
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
