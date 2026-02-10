import { useState } from 'react';
import type { Player } from '../types';
import { addCoins } from '../utils/storage';
import { getGreeting } from '../utils/greetings';
import { canPlay, recordPlay, getRemainingPlays } from '../utils/limits';

interface XinXamProps {
  player: Player;
  onUpdate: (player: Player) => void;
  onBack: () => void;
}

const XAM_LIST = [
  {
    number: 1,
    title: 'Xăm Đệ Nhất - Khai Thiên',
    poem: 'Nhật nguyệt soi cùng trời đất sáng\nMây lành phủ khắp cõi nhân gian\nNăm mới vạn điều đều tốt đẹp\nPhúc lộc thọ toàn đến muôn nơi',
    advice: 'Đại cát! Năm nay bạn được trời phù hộ, làm gì cũng thuận, đầu tư sinh lời.',
    category: '🏆 Thượng Thượng Xăm',
    coins: 40,
    weight: 5,
  },
  {
    number: 7,
    title: 'Xăm Đệ Thất - Minh Nguyệt',
    poem: 'Trăng sáng chiếu trên dòng sông bạc\nGió đưa hương hoa đến khắp nơi\nLòng thành tâm nguyện đều viên mãn\nPhước báu chan hòa khắp mọi nơi',
    advice: 'Tình duyên tốt đẹp. Người độc thân sẽ gặp người ý. Gia đạo hòa thuận.',
    category: '⭐ Thượng Xăm',
    coins: 30,
    weight: 10,
  },
  {
    number: 14,
    title: 'Xăm Đệ Thập Tứ - Thuận Phong',
    poem: 'Gió thuận buồm xuôi ra biển lớn\nCá chép vượt vũ môn hóa rồng\nChí lớn nam nhi nay thỏa nguyện\nCông thành danh toại rạng non sông',
    advice: 'Công danh sự nghiệp lên như diều gặp gió. Cơ hội thăng tiến trong tầm tay.',
    category: '⭐ Thượng Xăm',
    coins: 25,
    weight: 15,
  },
  {
    number: 22,
    title: 'Xăm Đệ Nhị Thập Nhị - An Bình',
    poem: 'Nhà yên vườn tĩnh chim ca hót\nCon hiếu vợ hiền cửa đẹp xinh\nBốn mùa hoa nở hương thơm ngát\nPhước đức truyền đời mãi thịnh vinh',
    advice: 'Gia đạo bình an, con cái ngoan ngoãn. Sức khỏe ổn định, tâm hồn thanh thản.',
    category: '🌟 Trung Thượng Xăm',
    coins: 20,
    weight: 20,
  },
  {
    number: 36,
    title: 'Xăm Đệ Tam Thập Lục - Cần Kiệm',
    poem: 'Kiến tha lâu đầy tổ\nNước chảy mãi đá mòn\nSiêng năng và tiết kiệm\nĐức tốt sẽ trường tồn',
    advice: 'Năm nay cần cần kiệm, đừng hoang phí. Tích tiểu thành đại, cuối năm sẽ có thành quả.',
    category: '☯️ Trung Xăm',
    coins: 15,
    weight: 25,
  },
  {
    number: 48,
    title: 'Xăm Đệ Tứ Thập Bát - Chuyển Vận',
    poem: 'Đông qua xuân đến hoa lại nở\nMưa tạnh trời quang nắng chan hòa\nKhổ tận cam lai xưa nay vậy\nNhẫn nại chờ thời phúc sẽ xa',
    advice: 'Nửa đầu năm có chút khó khăn nhưng nửa sau sẽ hanh thông. Giữ vững niềm tin!',
    category: '🌙 Trung Hạ Xăm',
    coins: 10,
    weight: 25,
  },
];

function getRandomXam() {
  const totalWeight = XAM_LIST.reduce((sum, x) => sum + x.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const xam of XAM_LIST) {
    rand -= xam.weight;
    if (rand <= 0) return xam;
  }
  return XAM_LIST[4];
}

function getZodiac(year: number): string {
  const zodiacs = ['Thân (Khỉ)', 'Dậu (Gà)', 'Tuất (Chó)', 'Hợi (Lợn)', 'Tý (Chuột)', 'Sửu (Trâu)', 'Dần (Hổ)', 'Mão (Mèo)', 'Thìn (Rồng)', 'Tỵ (Rắn)', 'Ngọ (Ngựa)', 'Mùi (Dê)'];
  return zodiacs[year % 12];
}

function getElement(year: number): string {
  const elements = ['Kim', 'Kim', 'Thủy', 'Thủy', 'Mộc', 'Mộc', 'Hỏa', 'Hỏa', 'Thổ', 'Thổ'];
  return elements[year % 10];
}

export default function XinXam({ player, onUpdate, onBack }: XinXamProps) {
  const [fullName, setFullName] = useState(player.name);
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [infoSubmitted, setInfoSubmitted] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [result, setResult] = useState<typeof XAM_LIST[0] | null>(null);
  const [greeting, setGreeting] = useState('');
  const [coinAwarded, setCoinAwarded] = useState(!canPlay('xin-xam'));
  const remaining = getRemainingPlays('xin-xam');

  const handleSubmitInfo = () => {
    if (!fullName.trim() || !birthDay || !birthMonth || !birthYear) return;
    setInfoSubmitted(true);
  };

  const handleXinXam = () => {
    if (shaking) return;
    setShaking(true);
    setResult(null);
    setGreeting('');

    setTimeout(() => {
      const xam = getRandomXam();
      setResult(xam);
      setGreeting(getGreeting(player.department));

      if (!coinAwarded && canPlay('xin-xam')) {
        recordPlay('xin-xam');
        const updated = addCoins(player, xam.coins, 'Xin Xăm', `Xăm số ${xam.number}: +${xam.coins} xu`);
        onUpdate(updated);
        setCoinAwarded(true);
      }

      setShaking(false);
    }, 3000);
  };

  const yearNum = parseInt(birthYear);
  const zodiac = yearNum ? getZodiac(yearNum) : '';
  const element = yearNum ? getElement(yearNum) : '';

  if (!infoSubmitted) {
    return (
      <div className="game-page xin-xam">
        <button className="back-btn" onClick={onBack}>← Quay Lại</button>
        <div className="game-content">
          <h2>🛕 Xin Xăm Chùa Đầu Năm</h2>
          <p className="game-instruction">
            Nhập thông tin để xin xăm xem vận mệnh năm mới!
          </p>

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
              🛕 Xin Xăm
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-page xin-xam">
      <button className="back-btn" onClick={onBack}>← Quay Lại</button>
      <div className="game-content">
        <h2>🛕 Xin Xăm Chùa Đầu Năm</h2>
        <p className="game-instruction">
          Thành tâm lắc ống xăm, rút một thẻ xăm để biết vận mệnh năm mới!
        </p>

        <div className="fortune-info-display">
          <p><strong>{fullName}</strong> — Sinh ngày {birthDay}/{birthMonth}/{birthYear}</p>
          <p>Tuổi: {zodiac} | Mệnh: {element}</p>
        </div>

        {coinAwarded && (
          <div className="limit-notice">
            🔒 Đã nhận xu hôm nay. Bạn vẫn có thể xin xăm xem vận mệnh (không nhận thêm xu).
          </div>
        )}
        {!coinAwarded && remaining > 0 && (
          <div className="limit-info">
            🎁 Còn {remaining} lượt nhận xu hôm nay
          </div>
        )}

        <div className="xam-temple">
          <div className="xam-decor">🏮 ☸️ 🏮</div>
          <div
            className={`xam-tube ${shaking ? 'shaking' : ''}`}
            onClick={handleXinXam}
          >
            <div className="xam-sticks">
              {shaking ? '🎋🎋🎋' : '🎋'}
            </div>
            <span className="xam-tube-text">
              {shaking ? 'Đang lắc xăm...' : 'Nhấn để xin xăm'}
            </span>
          </div>
        </div>

        {result && (
          <div className="xam-result">
            <div className="xam-card">
              <div className="xam-card-header">
                <span className="xam-number">Số {result.number}</span>
                <span className="xam-category">{result.category}</span>
              </div>
              <h3 className="xam-title">{result.title}</h3>
              <div className="xam-poem">
                {result.poem.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
              <div className="xam-advice">
                <strong>🔮 Lời giải:</strong> {result.advice}
              </div>
              <div className="xam-coins">🪙 +{result.coins} xu</div>
            </div>

            {greeting && (
              <div className="greeting-box">
                <p className="greeting-text">🌸 {greeting}</p>
              </div>
            )}

            <button className="bq-again-btn" onClick={handleXinXam}>
              🛕 Xin Xăm Lần Nữa
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
