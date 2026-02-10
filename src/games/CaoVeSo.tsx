import { useState, useRef, useEffect, useCallback } from 'react';
import type { Player } from '../types';
import { addCoins } from '../utils/storage';
import { getGreeting } from '../utils/greetings';
import { canPlay, recordPlay, getRemainingPlays } from '../utils/limits';
import { playWin, playLose, playCoinCollect } from '../utils/sounds';
import GameRules from '../components/GameRules';

const RULES = [
  'Mỗi vé tốn 10 xu để cào',
  'Dùng chuột hoặc ngón tay cào lớp phủ bạc',
  'Cào 60% diện tích để mở thưởng',
  'Giải thưởng: 0 ~ 200 xu',
  'Giới hạn 8 vé/ngày',
];

interface Prize {
  label: string;
  coins: number;
  emoji: string;
  chance: number;
}

const PRIZES: Prize[] = [
  { label: 'Trúng 200 xu!', coins: 200, emoji: '💎', chance: 0.02 },
  { label: 'Trúng 100 xu!', coins: 100, emoji: '🏆', chance: 0.05 },
  { label: 'Trúng 50 xu!', coins: 50, emoji: '🎉', chance: 0.10 },
  { label: 'Trúng 20 xu!', coins: 20, emoji: '🧧', chance: 0.20 },
  { label: 'Trúng 10 xu!', coins: 10, emoji: '⭐', chance: 0.25 },
  { label: 'Không trúng', coins: 0, emoji: '😢', chance: 0.38 },
];

function getPrize(): Prize {
  const r = Math.random();
  let cumulative = 0;
  for (const p of PRIZES) {
    cumulative += p.chance;
    if (r <= cumulative) return p;
  }
  return PRIZES[PRIZES.length - 1];
}

const CARD_W = 280;
const CARD_H = 180;
const SCRATCH_RADIUS = 22;
const REVEAL_THRESHOLD = 0.55;

interface GameProps {
  player: Player;
  onUpdate: (player: Player) => void;
  onBack: () => void;
}

export default function CaoVeSo({ player, onUpdate, onBack }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [prize, setPrize] = useState<Prize | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [scratching, setScratching] = useState(false);
  const [, setCardReady] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [remaining, setRemaining] = useState(getRemainingPlays('cao-ve-so'));
  const [history, setHistory] = useState<{ coins: number; label: string }[]>([]);
  const isDown = useRef(false);
  const scratchedPixels = useRef(0);
  const totalPixels = useRef(CARD_W * CARD_H);

  const COST = 10;

  const initCard = useCallback(() => {
    const p = getPrize();
    setPrize(p);
    setRevealed(false);
    setScratching(false);
    setCardReady(true);
    setGreeting('');
    scratchedPixels.current = 0;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw silver scratch layer
    ctx.globalCompositeOperation = 'source-over';
    const grad = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
    grad.addColorStop(0, '#c0c0c0');
    grad.addColorStop(0.3, '#d4d4d4');
    grad.addColorStop(0.5, '#a8a8a8');
    grad.addColorStop(0.7, '#d0d0d0');
    grad.addColorStop(1, '#b0b0b0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CARD_W, CARD_H);

    // Add pattern dots
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    for (let x = 0; x < CARD_W; x += 12) {
      for (let y = 0; y < CARD_H; y += 12) {
        if (Math.random() > 0.5) {
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // "Cào tại đây" text
    ctx.fillStyle = 'rgba(100,100,100,0.5)';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎟️ Cào tại đây', CARD_W / 2, CARD_H / 2 + 6);
  }, []);

  const buyAndInit = useCallback(() => {
    if (player.totalCoins < COST) return;
    if (!canPlay('cao-ve-so')) return;
    recordPlay('cao-ve-so');
    setRemaining(getRemainingPlays('cao-ve-so'));
    const updated = addCoins(player, -COST, 'Cào Vé Số', `Mua vé: -${COST} xu`);
    onUpdate(updated);
    initCard();
  }, [player, onUpdate, initCard]);

  useEffect(() => {
    if (canvasRef.current) {
      buyAndInit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scratch = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, SCRATCH_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    scratchedPixels.current += Math.PI * SCRATCH_RADIUS * SCRATCH_RADIUS;
    const ratio = scratchedPixels.current / totalPixels.current;

    if (ratio >= REVEAL_THRESHOLD && !revealed) {
      // Reveal the card
      ctx.clearRect(0, 0, CARD_W, CARD_H);
      setRevealed(true);

      if (prize && prize.coins > 0) {
        playWin();
        playCoinCollect();
        setGreeting(getGreeting(player.department));
        const updated = addCoins(player, prize.coins, 'Cào Vé Số', prize.label);
        onUpdate(updated);
      } else {
        playLose();
      }
      setHistory(prev => [{ coins: prize?.coins || 0, label: prize?.label || '' }, ...prev.slice(0, 9)]);
    }
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const touch = 'touches' in e ? e.touches[0] || e.changedTouches[0] : null;
    const clientX = touch ? touch.clientX : (e as React.MouseEvent).clientX;
    const clientY = touch ? touch.clientY : (e as React.MouseEvent).clientY;
    return {
      x: (clientX - rect.left) * (CARD_W / rect.width),
      y: (clientY - rect.top) * (CARD_H / rect.height),
    };
  };

  const onDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (revealed) return;
    e.preventDefault();
    isDown.current = true;
    setScratching(true);
    const { x, y } = getPos(e);
    scratch(x, y);
  };

  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDown.current || revealed) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    scratch(x, y);
  };

  const onUp = () => {
    isDown.current = false;
    setScratching(false);
  };

  return (
    <div className="game-page cao-ve-so">
      <button className="back-btn" onClick={onBack}>← Quay Lại</button>
      <GameRules title="Cào Vé Số Tết" rules={RULES} />

      <div className="game-content">
        <h2>🎟️ Cào Vé Số Tết</h2>
        <p className="game-subtitle">
          Còn <strong>{remaining}</strong> vé | Xu: 🪙 {player.totalCoins.toLocaleString()} | Giá vé: 10 xu
        </p>

        <div className="scratch-card-wrapper">
          {/* Prize layer (behind canvas) */}
          <div className="scratch-prize-layer">
            {prize && (
              <>
                <span className="scratch-prize-emoji">{prize.emoji}</span>
                <span className="scratch-prize-text">
                  {prize.coins > 0 ? prize.label : 'Chúc may mắn lần sau!'}
                </span>
                {prize.coins > 0 && (
                  <span className="scratch-prize-coins">+{prize.coins} xu</span>
                )}
              </>
            )}
          </div>

          {/* Scratch canvas */}
          <canvas
            ref={canvasRef}
            width={CARD_W}
            height={CARD_H}
            className={`scratch-canvas ${scratching ? 'scratching' : ''}`}
            onMouseDown={onDown}
            onMouseMove={onMove}
            onMouseUp={onUp}
            onMouseLeave={onUp}
            onTouchStart={onDown}
            onTouchMove={onMove}
            onTouchEnd={onUp}
          />
        </div>

        {revealed && (
          <div className={`scratch-result ${prize && prize.coins > 0 ? 'win' : 'lose'}`}>
            <span>{prize?.emoji}</span>
            <span>{prize?.coins ? `+${prize.coins} xu!` : 'Không trúng!'}</span>
          </div>
        )}

        {revealed && (
          <button
            className="scratch-new-btn"
            onClick={buyAndInit}
            disabled={player.totalCoins < COST || !canPlay('cao-ve-so')}
          >
            {player.totalCoins < COST
              ? 'Không đủ xu'
              : !canPlay('cao-ve-so')
              ? 'Hết vé hôm nay'
              : '🎟️ Mua Vé Mới (10 xu)'}
          </button>
        )}

        {greeting && (
          <div className="greeting-box">
            <p className="greeting-text">🌸 {greeting}</p>
          </div>
        )}

        {history.length > 0 && (
          <div className="game-history">
            <h4>Lịch sử cào:</h4>
            {history.map((h, i) => (
              <div key={i} className={`history-item ${h.coins > 0 ? 'win' : ''}`}>
                {h.coins > 0 ? `🎉 ${h.label}` : '😢 Không trúng'}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
