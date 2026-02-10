import { useState, useRef } from 'react';
import type { Player } from '../types';
import { addCoins } from '../utils/storage';
import { canPlay, recordPlay, getRemainingPlays } from '../utils/limits';
import { playWin, playLose, playCoinCollect } from '../utils/sounds';
import GameRules from '../components/GameRules';
import CultureTipCard from '../components/CultureTipCard';

const RULES = [
  'Máy sẽ chọn ngẫu nhiên 1 số bí mật từ 1-100.',
  'Bạn có tối đa 7 lần đoán để tìm ra số đó.',
  'Sau mỗi lần đoán, hệ thống gợi ý "Lớn hơn" hoặc "Nhỏ hơn".',
  'Đoán đúng trong 1-3 lần: 50 xu. 4-5 lần: 30 xu. 6-7 lần: 15 xu.',
  'Hết 7 lần mà chưa đúng: mất 10 xu.',
  'Giới hạn 10 lượt mỗi ngày.',
];

interface Props {
  player: Player;
  onUpdate: (player: Player) => void;
  onBack: () => void;
}

export default function DoanSo({ player, onUpdate, onBack }: Props) {
  const [remaining, setRemaining] = useState(getRemainingPlays('doan-so'));
  const [secret, setSecret] = useState(0);
  const [guess, setGuess] = useState('');
  const [guesses, setGuesses] = useState<{ num: number; hint: string }[]>([]);
  const [phase, setPhase] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
  const [history, setHistory] = useState<{ result: string; coins: number }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const MAX_GUESSES = 7;

  const startGame = () => {
    if (!canPlay('doan-so')) return;
    setSecret(Math.floor(Math.random() * 100) + 1);
    setGuesses([]);
    setGuess('');
    setPhase('playing');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleGuess = () => {
    const num = parseInt(guess, 10);
    if (isNaN(num) || num < 1 || num > 100) return;
    setGuess('');

    if (num === secret) {
      // Won!
      const attempts = guesses.length + 1;
      const coins = attempts <= 3 ? 50 : attempts <= 5 ? 30 : 15;
      setGuesses(prev => [...prev, { num, hint: '🎯 Chính xác!' }]);
      setPhase('won');
      playWin();
      playCoinCollect();
      recordPlay('doan-so');
      setRemaining(getRemainingPlays('doan-so'));
      const updated = addCoins(player, coins, 'Đoán Số May Mắn', `Đúng sau ${attempts} lần → +${coins} xu`);
      onUpdate(updated);
      setHistory(prev => [{ result: `Đúng (${attempts} lần)`, coins }, ...prev.slice(0, 9)]);
    } else if (guesses.length + 1 >= MAX_GUESSES) {
      // Lost
      setGuesses(prev => [...prev, { num, hint: num > secret ? '📉 Nhỏ hơn' : '📈 Lớn hơn' }]);
      setPhase('lost');
      playLose();
      recordPlay('doan-so');
      setRemaining(getRemainingPlays('doan-so'));
      const updated = addCoins(player, -10, 'Đoán Số May Mắn', `Hết lượt, số bí mật: ${secret} → -10 xu`);
      onUpdate(updated);
      setHistory(prev => [{ result: `Thua (số: ${secret})`, coins: -10 }, ...prev.slice(0, 9)]);
    } else {
      // Continue
      const hint = num > secret ? '📉 Nhỏ hơn' : '📈 Lớn hơn';
      setGuesses(prev => [...prev, { num, hint }]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  return (
    <div className="game-page doan-so">
      <button className="back-btn" onClick={onBack}>← Quay Lại</button>
      <div className="game-content">
        <h2>🔢 Đoán Số May Mắn</h2>
        <p className="game-instruction">Tìm số bí mật từ 1-100 trong 7 lần đoán!</p>
        <GameRules rules={RULES} />

        {remaining > 0 ? (
          <div className="limit-info">🎯 Còn {remaining} lượt hôm nay</div>
        ) : (
          <div className="limit-notice">🔒 Hết lượt hôm nay!</div>
        )}

        {phase === 'idle' && (
          <div className="quiz-start">
            <div className="quiz-start-icon">🔢</div>
            <h3>Thử vận may đoán số!</h3>
            <p>Máy chọn 1 số từ 1-100. Bạn có 7 lần đoán. Dùng gợi ý để thu hẹp phạm vi!</p>
            <button className="quiz-start-btn" onClick={startGame} disabled={remaining <= 0}>
              {remaining > 0 ? '🎲 Bắt Đầu!' : 'Hết lượt hôm nay'}
            </button>
          </div>
        )}

        {(phase === 'playing' || phase === 'won' || phase === 'lost') && (
          <div className="ds-game-area">
            <div className="ds-attempts">
              Lần đoán: <strong>{guesses.length}</strong> / {MAX_GUESSES}
            </div>

            <div className="ds-guesses">
              {guesses.map((g, i) => (
                <div key={i} className={`ds-guess ${g.hint.includes('Chính xác') ? 'correct' : ''}`}>
                  <span className="ds-guess-num">{g.num}</span>
                  <span className="ds-guess-hint">{g.hint}</span>
                </div>
              ))}
            </div>

            {phase === 'playing' && (
              <div className="ds-input-area">
                <input
                  ref={inputRef}
                  type="number"
                  min={1}
                  max={100}
                  value={guess}
                  onChange={e => setGuess(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleGuess()}
                  placeholder="Nhập số (1-100)"
                  className="ds-input"
                />
                <button
                  className="ds-guess-btn"
                  onClick={handleGuess}
                  disabled={!guess || parseInt(guess) < 1 || parseInt(guess) > 100}
                >
                  🎯 Đoán!
                </button>
              </div>
            )}

            {phase === 'won' && (
              <>
                <div className="ott-match-result win">
                  <span className="ott-match-icon">🎉</span>
                  <span>Chính xác! Số bí mật là <strong>{secret}</strong>. Đoán đúng sau {guesses.length} lần!</span>
                </div>
                <CultureTipCard />
              </>
            )}

            {phase === 'lost' && (
              <>
                <div className="ott-match-result lose">
                  <span className="ott-match-icon">😅</span>
                  <span>Hết lượt! Số bí mật là <strong>{secret}</strong>.</span>
                </div>
                <CultureTipCard />
              </>
            )}

            {(phase === 'won' || phase === 'lost') && remaining > 0 && (
              <button className="bq-again-btn" onClick={startGame}>
                🔢 Chơi Lại
              </button>
            )}
          </div>
        )}

        {history.length > 0 && (
          <div className="lixi-history">
            <h4>Lịch sử:</h4>
            <div className="history-list">
              {history.map((h, i) => (
                <span key={i} className={`history-item ${h.coins > 0 ? '' : 'lose'}`}>
                  {h.coins > 0 ? '🎉' : '😅'} {h.result} ({h.coins > 0 ? '+' : ''}{h.coins} xu)
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
