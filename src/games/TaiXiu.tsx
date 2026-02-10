import { useState, useCallback, useRef, useEffect } from 'react';
import type { Player } from '../types';
import { addCoins } from '../utils/storage';
import { getGreeting } from '../utils/greetings';
import { canPlay, recordPlay, getRemainingPlays } from '../utils/limits';
import { playWin, playLose, playDrum } from '../utils/sounds';
import GameRules from '../components/GameRules';

const RULES = [
  'Chọn "Tài" (tổng 11-18) hoặc "Xỉu" (tổng 3-10).',
  'Chọn mức cược: 10, 20, 50 hoặc 100 xu.',
  'Nhấn "Lắc Xúc Xắc" để lắc 3 xúc xắc.',
  'Tổng 3 xúc xắc từ 11 đến 18 là TÀI, từ 3 đến 10 là XỈU.',
  'Đoán đúng → thắng số xu bằng mức cược. Đoán sai → mất xu cược.',
  'Giới hạn 15 lượt chơi mỗi ngày.',
];

interface TaiXiuProps {
  player: Player;
  onUpdate: (player: Player) => void;
  onBack: () => void;
}

const BET_OPTIONS = [10, 20, 50, 100];

export default function TaiXiu({ player, onUpdate, onBack }: TaiXiuProps) {
  const [bet, setBet] = useState(10);
  const [choice, setChoice] = useState<'tai' | 'xiu' | null>(null);
  const [rolling, setRolling] = useState(false);
  const [dice, setDice] = useState<number[]>([]);
  const [result, setResult] = useState<{ won: boolean; total: number; payout: number } | null>(null);
  const [greeting, setGreeting] = useState('');
  const [remaining, setRemaining] = useState(getRemainingPlays('tai-xiu'));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const roll = useCallback(() => {
    if (rolling || !choice || bet > player.totalCoins) return;
    if (!canPlay('tai-xiu')) return;
    setRolling(true);
    setResult(null);
    setGreeting('');
    playDrum();

    let count = 0;
    intervalRef.current = setInterval(() => {
      setDice([
        Math.ceil(Math.random() * 6),
        Math.ceil(Math.random() * 6),
        Math.ceil(Math.random() * 6),
      ]);
      count++;
      if (count > 15) {
        clearInterval(intervalRef.current!);
        const final = [
          Math.ceil(Math.random() * 6),
          Math.ceil(Math.random() * 6),
          Math.ceil(Math.random() * 6),
        ];
        setDice(final);
        const total = final.reduce((s, v) => s + v, 0);
        const isTai = total >= 11;
        const won = (choice === 'tai' && isTai) || (choice === 'xiu' && !isTai);

        if (won) {
          setGreeting(getGreeting(player.department));
          playWin();
          const updated = addCoins(player, bet, 'Tài Xỉu', `${choice === 'tai' ? 'Tài' : 'Xỉu'} - Tổng ${total} - Thắng +${bet}`);
          onUpdate(updated);
          setResult({ won: true, total, payout: bet });
        } else {
          playLose();
          const updated = addCoins(player, -bet, 'Tài Xỉu', `${choice === 'tai' ? 'Tài' : 'Xỉu'} - Tổng ${total} - Thua -${bet}`);
          onUpdate(updated);
          setResult({ won: false, total, payout: -bet });
        }

        recordPlay('tai-xiu');
        setRemaining(getRemainingPlays('tai-xiu'));
        setRolling(false);
      }
    }, 100);
  }, [rolling, choice, bet, player, onUpdate]);

  const getDiceFace = (n: number) => {
    const faces = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    return faces[n] || '⚀';
  };

  return (
    <div className="game-page tai-xiu">
      <button className="back-btn" onClick={onBack}>← Quay Lại</button>
      <div className="game-content">
        <h2>🎲 Tài Xỉu</h2>
        <p className="game-instruction">
          Đoán tổng 3 xúc xắc: <strong>Tài</strong> (11-18) hoặc <strong>Xỉu</strong> (3-10). Đoán đúng thắng gấp đôi!
        </p>
        <GameRules rules={RULES} />

        {remaining > 0 ? (
          <div className="limit-info">
            🎲 Còn {remaining} lượt chơi hôm nay
          </div>
        ) : (
          <div className="limit-notice">
            🔒 Đã hết lượt chơi hôm nay. Quay lại vào ngày mai nhé!
          </div>
        )}

        <div className="tx-dice-area">
          {dice.length > 0 ? dice.map((d, i) => (
            <div key={i} className={`tx-die ${rolling ? 'rolling' : 'landed'}`}>
              <span className="tx-die-face">{getDiceFace(d)}</span>
              <span className="tx-die-num">{d}</span>
            </div>
          )) : (
            <>
              <div className="tx-die empty">❓</div>
              <div className="tx-die empty">❓</div>
              <div className="tx-die empty">❓</div>
            </>
          )}
        </div>

        {result && (
          <div className={`tx-result ${result.won ? 'win' : 'lose'}`}>
            <span className="tx-result-icon">{result.won ? '🎉' : '😅'}</span>
            <span>Tổng: <strong>{result.total}</strong> ({result.total >= 11 ? 'TÀI' : 'XỈU'}) — {result.won ? `Thắng +${result.payout} xu` : `Thua ${result.payout} xu`}</span>
          </div>
        )}

        {greeting && (
          <div className="greeting-box">
            <p className="greeting-text">🌸 {greeting}</p>
          </div>
        )}

        <div className="tx-choice">
          <button
            className={`tx-choice-btn tx-xiu ${choice === 'xiu' ? 'selected' : ''}`}
            onClick={() => !rolling && setChoice('xiu')}
            disabled={rolling || remaining <= 0}
          >
            <span className="tx-choice-label">XỈU</span>
            <span className="tx-choice-range">3 - 10</span>
          </button>
          <button
            className={`tx-choice-btn tx-tai ${choice === 'tai' ? 'selected' : ''}`}
            onClick={() => !rolling && setChoice('tai')}
            disabled={rolling || remaining <= 0}
          >
            <span className="tx-choice-label">TÀI</span>
            <span className="tx-choice-range">11 - 18</span>
          </button>
        </div>

        <div className="tx-bet">
          <span>Mức cược:</span>
          {BET_OPTIONS.map((amt) => (
            <button
              key={amt}
              className={`bet-option ${bet === amt ? 'active' : ''}`}
              onClick={() => !rolling && setBet(amt)}
              disabled={rolling || amt > player.totalCoins}
            >
              🪙 {amt}
            </button>
          ))}
        </div>

        <button
          className="tx-roll-btn"
          onClick={roll}
          disabled={rolling || !choice || bet > player.totalCoins || remaining <= 0}
        >
          {rolling ? '🎲 Đang lắc...' : remaining <= 0 ? 'Hết lượt hôm nay' : '🎲 Lắc Xúc Xắc!'}
        </button>
      </div>
    </div>
  );
}
