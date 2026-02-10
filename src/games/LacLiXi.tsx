import { useState, useCallback, useRef, useEffect } from 'react';
import type { Player } from '../types';
import { addCoins } from '../utils/storage';
import { getGreeting } from '../utils/greetings';
import { canPlay, recordPlay, getRemainingPlays } from '../utils/limits';
import { playCoinCollect } from '../utils/sounds';
import GameRules from '../components/GameRules';

const RULES = [
  'Nhấn vào phong bao lì xì để lắc.',
  'Sau khi lắc xong, nhấn tiếp để mở phong bao và nhận xu.',
  'Mỗi phong bao chứa ngẫu nhiên từ 5 đến 500 xu.',
  'Phong bao giá trị cao (200, 500 xu) rất hiếm — hãy thử vận may!',
  'Giới hạn 10 lượt lắc mỗi ngày. Lượt mới sẽ được cấp vào ngày hôm sau.',
];

interface LacLiXiProps {
  player: Player;
  onUpdate: (player: Player) => void;
  onBack: () => void;
}

const ENVELOPES = [
  { coins: 5, label: '5 xu', weight: 30, message: 'Lì xì nhỏ, tình cảm to!' },
  { coins: 10, label: '10 xu', weight: 25, message: 'Xuân về, tài đến!' },
  { coins: 20, label: '20 xu', weight: 20, message: 'Phát tài phát lộc!' },
  { coins: 50, label: '50 xu', weight: 15, message: 'Hên quá! Năm mới phát đạt!' },
  { coins: 100, label: '100 xu', weight: 7, message: 'Đại cát đại lợi!' },
  { coins: 200, label: '200 xu', weight: 2, message: 'JACKPOT! Vạn sự như ý!' },
  { coins: 500, label: '500 xu', weight: 1, message: 'SIÊU JACKPOT! Phú quý mãn đường!' },
];

function getRandomEnvelope() {
  const totalWeight = ENVELOPES.reduce((sum, e) => sum + e.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const env of ENVELOPES) {
    rand -= env.weight;
    if (rand <= 0) return env;
  }
  return ENVELOPES[0];
}

export default function LacLiXi({ player, onUpdate, onBack }: LacLiXiProps) {
  const [isShaking, setIsShaking] = useState(false);
  const [result, setResult] = useState<typeof ENVELOPES[0] | null>(null);
  const [opened, setOpened] = useState(false);
  const [showHistory, setShowHistory] = useState<{ coins: number; label: string }[]>([]);
  const [greeting, setGreeting] = useState('');
  const [remaining, setRemaining] = useState(getRemainingPlays('lac-li-xi'));
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  const handleShake = useCallback(() => {
    if (isShaking) return;
    if (!canPlay('lac-li-xi')) return;
    setIsShaking(true);
    setOpened(false);
    setResult(null);

    timeoutRef.current = setTimeout(() => {
      const envelope = getRandomEnvelope();
      setResult(envelope);
      setIsShaking(false);
    }, 1500);
  }, [isShaking]);

  const handleOpen = () => {
    if (!result || opened) return;
    if (!canPlay('lac-li-xi')) return;
    setOpened(true);
    recordPlay('lac-li-xi');
    setRemaining(getRemainingPlays('lac-li-xi'));
    setGreeting(getGreeting(player.department));
    playCoinCollect();
    const updated = addCoins(player, result.coins, 'Lắc Lì Xì', `Nhận ${result.label}`);
    onUpdate(updated);
    setShowHistory((prev) => [{ coins: result.coins, label: result.label }, ...prev.slice(0, 9)]);
  };

  return (
    <div className="game-page lac-li-xi">
      <button className="back-btn" onClick={onBack}>← Quay Lại</button>
      <div className="game-content">
        <h2>🧧 Lắc Lì Xì May Mắn</h2>
        <p className="game-instruction">
          Lắc lì xì để nhận xu may mắn! Mỗi phong bao chứa phần thưởng bất ngờ!
        </p>
        <GameRules rules={RULES} />

        {remaining > 0 ? (
          <div className="limit-info">
            🎁 Còn {remaining} lượt lắc hôm nay
          </div>
        ) : (
          <div className="limit-notice">
            🔒 Đã hết lượt lắc hôm nay. Quay lại vào ngày mai nhé!
          </div>
        )}

        <div className="lixi-area">
          <div
            className={`lixi-envelope ${isShaking ? 'shaking' : ''} ${result && !opened ? 'ready' : ''} ${opened ? 'opened' : ''}`}
            onClick={result && !opened ? handleOpen : remaining > 0 ? handleShake : undefined}
          >
            {!result && !isShaking && (
              <div className="envelope-front">
                <span className="envelope-icon">🧧</span>
                <span className="envelope-text">{remaining > 0 ? 'Nhấn để lắc!' : 'Hết lượt!'}</span>
              </div>
            )}
            {isShaking && (
              <div className="envelope-front">
                <span className="envelope-icon shaking-icon">🧧</span>
                <span className="envelope-text">Đang lắc...</span>
              </div>
            )}
            {result && !opened && (
              <div className="envelope-front ready-open">
                <span className="envelope-icon pulse">🧧</span>
                <span className="envelope-text">Nhấn để mở!</span>
              </div>
            )}
            {result && opened && (
              <div className="envelope-result">
                <span className="result-coins">🪙 +{result.coins}</span>
                <span className="result-message">{result.message}</span>
                {remaining > 0 && (
                  <button className="shake-again-btn" onClick={(e) => { e.stopPropagation(); handleShake(); }}>
                    Lắc Tiếp! 🧧
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {opened && greeting && (
          <div className="greeting-box">
            <p className="greeting-text">🌸 {greeting}</p>
          </div>
        )}

        {showHistory.length > 0 && (
          <div className="lixi-history">
            <h4>Lịch sử lắc:</h4>
            <div className="history-list">
              {showHistory.map((h, i) => (
                <span key={i} className="history-item">🪙 +{h.coins}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
