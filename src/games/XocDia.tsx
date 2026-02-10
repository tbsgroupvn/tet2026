import { useState, useCallback } from 'react';
import type { Player } from '../types';
import { addCoins } from '../utils/storage';
import { getGreeting } from '../utils/greetings';
import { canPlay, recordPlay, getRemainingPlays } from '../utils/limits';
import { playWin, playLose, playDrum } from '../utils/sounds';
import GameRules from '../components/GameRules';
import CultureTipCard from '../components/CultureTipCard';

const RULES = [
  'Chọn mức cược: 10, 20 hoặc 50 xu.',
  'Đoán kết quả: Chẵn (số đồng xu ngửa là chẵn: 0, 2, 4) hoặc Lẻ (1, 3).',
  'Bát xóc 4 đồng xu. Kết quả hiện ra: ⚫ sấp, 🔴 ngửa.',
  'Đoán đúng: thắng gấp đôi tiền cược. Đoán sai: mất tiền cược.',
  'Nếu 4 đồng cùng 1 mặt (toàn sấp/toàn ngửa): thắng gấp 3!',
  'Giới hạn 15 lượt mỗi ngày.',
];

interface Props {
  player: Player;
  onUpdate: (player: Player) => void;
  onBack: () => void;
}

const BET_OPTIONS = [10, 20, 50];

export default function XocDia({ player, onUpdate, onBack }: Props) {
  const [bet, setBet] = useState(10);
  const [choice, setChoice] = useState<'chan' | 'le' | null>(null);
  const [coins, setCoins] = useState<boolean[]>([]); // true = ngửa (đỏ), false = sấp (đen)
  const [shaking, setShaking] = useState(false);
  const [result, setResult] = useState<{ won: boolean; payout: number; nguaCount: number } | null>(null);
  const [greeting, setGreeting] = useState('');
  const [remaining, setRemaining] = useState(getRemainingPlays('xoc-dia'));

  const handleShake = useCallback(() => {
    if (!choice || shaking || !canPlay('xoc-dia') || player.totalCoins < bet) return;
    playDrum();
    setShaking(true);
    setResult(null);
    setCoins([]);
    setGreeting('');

    setTimeout(() => {
      // Random 4 coins
      const newCoins = Array.from({ length: 4 }, () => Math.random() > 0.5);
      const nguaCount = newCoins.filter(c => c).length;
      const isEven = nguaCount % 2 === 0;
      const won = (choice === 'chan' && isEven) || (choice === 'le' && !isEven);
      const allSame = nguaCount === 0 || nguaCount === 4;

      setCoins(newCoins);
      setShaking(false);

      let payout: number;
      if (won) {
        payout = allSame ? bet * 3 : bet * 2;
        playWin();
      } else {
        payout = -bet;
        playLose();
      }

      recordPlay('xoc-dia');
      setRemaining(getRemainingPlays('xoc-dia'));
      setGreeting(won ? getGreeting(player.department) : '');

      const updated = addCoins(
        player,
        payout,
        'Xóc Đĩa',
        `${choice === 'chan' ? 'Chẵn' : 'Lẻ'} — ${nguaCount} ngửa → ${won ? '+' : ''}${payout} xu${allSame && won ? ' (x3!)' : ''}`
      );
      onUpdate(updated);
      setResult({ won, payout, nguaCount });
    }, 1200);
  }, [choice, shaking, bet, player, onUpdate]);

  return (
    <div className="game-page xoc-dia">
      <button className="back-btn" onClick={onBack}>← Quay Lại</button>
      <div className="game-content">
        <h2>🪙 Xóc Đĩa</h2>
        <p className="game-instruction">Đoán Chẵn hay Lẻ — trò chơi dân gian kinh điển!</p>
        <GameRules rules={RULES} />

        {remaining > 0 ? (
          <div className="limit-info">🪙 Còn {remaining} lượt hôm nay</div>
        ) : (
          <div className="limit-notice">🔒 Hết lượt hôm nay!</div>
        )}

        {/* Coins display */}
        {coins.length > 0 && (
          <div className="xd-coins-display">
            {coins.map((c, i) => (
              <span key={i} className={`xd-coin ${c ? 'ngua' : 'sap'}`}>
                {c ? '🔴' : '⚫'}
              </span>
            ))}
            <span className="xd-coins-count">
              {result?.nguaCount} ngửa — {result && (result.nguaCount % 2 === 0 ? 'CHẴN' : 'LẺ')}
            </span>
          </div>
        )}

        {shaking && (
          <div className="xd-shaking">
            <span className="xd-bowl">🥣</span>
            <p>Đang xóc...</p>
          </div>
        )}

        {result && (
          <div className={`tx-result ${result.won ? 'win' : 'lose'}`}>
            <span className="tx-result-icon">{result.won ? '🎉' : '😅'}</span>
            <span>
              {result.won
                ? `Thắng! +${result.payout} xu${result.nguaCount === 0 || result.nguaCount === 4 ? ' (x3 toàn sấp/ngửa!)' : ''}`
                : `Thua! ${result.payout} xu`}
            </span>
          </div>
        )}

        {greeting && (
          <div className="greeting-box">
            <p className="greeting-text">🌸 {greeting}</p>
          </div>
        )}

        {result && <CultureTipCard />}

        {/* Choice */}
        <div className="tx-choice">
          <button
            className={`tx-choice-btn tx-xiu ${choice === 'chan' ? 'selected' : ''}`}
            onClick={() => !shaking && setChoice('chan')}
            disabled={shaking || remaining <= 0}
          >
            <span className="tx-choice-label">CHẴN</span>
            <span className="tx-choice-range">0, 2, 4 ngửa</span>
          </button>
          <button
            className={`tx-choice-btn tx-tai ${choice === 'le' ? 'selected' : ''}`}
            onClick={() => !shaking && setChoice('le')}
            disabled={shaking || remaining <= 0}
          >
            <span className="tx-choice-label">LẺ</span>
            <span className="tx-choice-range">1, 3 ngửa</span>
          </button>
        </div>

        {/* Bet */}
        <div className="tx-bet">
          <span>Mức cược:</span>
          {BET_OPTIONS.map(amt => (
            <button
              key={amt}
              className={`bet-option ${bet === amt ? 'active' : ''}`}
              onClick={() => !shaking && setBet(amt)}
              disabled={shaking || amt > player.totalCoins}
            >
              🪙 {amt}
            </button>
          ))}
        </div>

        <button
          className="spin-btn"
          onClick={handleShake}
          disabled={!choice || shaking || remaining <= 0 || player.totalCoins < bet}
        >
          {shaking ? '🥣 Đang xóc...' : remaining <= 0 ? 'Hết lượt' : !choice ? 'Chọn Chẵn/Lẻ trước' : `🪙 Xóc! (🪙 ${bet} xu)`}
        </button>
      </div>
    </div>
  );
}
