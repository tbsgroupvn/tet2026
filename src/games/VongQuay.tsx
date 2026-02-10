import { useState, useRef, useCallback } from 'react';
import type { Player } from '../types';
import { addCoins } from '../utils/storage';
import { getGreeting } from '../utils/greetings';

interface VongQuayProps {
  player: Player;
  onUpdate: (player: Player) => void;
  onBack: () => void;
}

const SLICES = [
  { label: '10 xu', coins: 10, color: '#e74c3c', probability: 25 },
  { label: '20 xu', coins: 20, color: '#f39c12', probability: 20 },
  { label: '50 xu', coins: 50, color: '#27ae60', probability: 15 },
  { label: 'Mất lượt', coins: 0, color: '#95a5a6', probability: 15 },
  { label: '100 xu', coins: 100, color: '#3498db', probability: 10 },
  { label: '30 xu', coins: 30, color: '#9b59b6', probability: 10 },
  { label: '200 xu', coins: 200, color: '#e91e63', probability: 4 },
  { label: '500 xu', coins: 500, color: '#ff6f00', probability: 1 },
];

const SPIN_COST = 5;

function getWeightedIndex(): number {
  const total = SLICES.reduce((sum, s) => sum + s.probability, 0);
  let rand = Math.random() * total;
  for (let i = 0; i < SLICES.length; i++) {
    rand -= SLICES[i].probability;
    if (rand <= 0) return i;
  }
  return 0;
}

export default function VongQuay({ player, onUpdate, onBack }: VongQuayProps) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<typeof SLICES[0] | null>(null);
  const [greeting, setGreeting] = useState('');
  const wheelRef = useRef<SVGGElement>(null);

  const spin = useCallback(() => {
    if (spinning) return;
    if (player.totalCoins < SPIN_COST) return;

    setSpinning(true);
    setResult(null);

    // Deduct spin cost
    const afterCost = addCoins(player, -SPIN_COST, 'Vòng Quay', `Phí quay: -${SPIN_COST} xu`);
    onUpdate(afterCost);

    const winnerIdx = getWeightedIndex();
    const sliceAngle = 360 / SLICES.length;
    // Calculate where the winner slice needs to land (at top/pointer position)
    const targetAngle = 360 - (winnerIdx * sliceAngle + sliceAngle / 2);
    const spins = 5 + Math.random() * 3; // 5-8 full spins
    const finalRotation = rotation + spins * 360 + targetAngle;

    setRotation(finalRotation);

    setTimeout(() => {
      const prize = SLICES[winnerIdx];
      setResult(prize);
      if (prize.coins > 0) {
        setGreeting(getGreeting(player.department));
        const updated = addCoins(afterCost, prize.coins, 'Vòng Quay', `Trúng ${prize.label}`);
        onUpdate(updated);
      } else {
        setGreeting('');
      }
      setSpinning(false);
    }, 4000);
  }, [spinning, rotation, player, onUpdate]);

  const sliceAngle = 360 / SLICES.length;
  const radius = 150;

  return (
    <div className="game-page vong-quay">
      <button className="back-btn" onClick={onBack}>← Quay Lại</button>
      <div className="game-content">
        <h2>🎡 Vòng Quay Tài Lộc</h2>
        <p className="game-instruction">
          Quay vòng quay để nhận xu! Chi phí: 🪙 {SPIN_COST} xu/lượt
        </p>

        <div className="wheel-container">
          <div className="wheel-pointer">▼</div>
          <svg viewBox="-160 -160 320 320" className="wheel-svg">
            <g
              ref={wheelRef}
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                transformOrigin: 'center',
              }}
            >
              {SLICES.map((slice, i) => {
                const startAngle = (i * sliceAngle * Math.PI) / 180;
                const endAngle = ((i + 1) * sliceAngle * Math.PI) / 180;
                const x1 = radius * Math.cos(startAngle);
                const y1 = radius * Math.sin(startAngle);
                const x2 = radius * Math.cos(endAngle);
                const y2 = radius * Math.sin(endAngle);
                const largeArc = sliceAngle > 180 ? 1 : 0;

                const midAngle = ((i + 0.5) * sliceAngle * Math.PI) / 180;
                const textX = (radius * 0.65) * Math.cos(midAngle);
                const textY = (radius * 0.65) * Math.sin(midAngle);
                const textRotation = (i + 0.5) * sliceAngle;

                return (
                  <g key={i}>
                    <path
                      d={`M0,0 L${x1},${y1} A${radius},${radius} 0 ${largeArc},1 ${x2},${y2} Z`}
                      fill={slice.color}
                      stroke="#fff"
                      strokeWidth="2"
                    />
                    <text
                      x={textX}
                      y={textY}
                      fill="#fff"
                      fontSize="11"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                      style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
                    >
                      {slice.label}
                    </text>
                  </g>
                );
              })}
              <circle r="20" fill="#c0392b" stroke="#fff" strokeWidth="3" />
              <text x="0" y="0" fill="#fff" fontSize="12" textAnchor="middle" dominantBaseline="middle" fontWeight="bold">
                TBS
              </text>
            </g>
          </svg>
        </div>

        {result && (
          <div className={`vq-result ${result.coins > 0 ? 'win' : 'lose'}`}>
            {result.coins > 0 ? (
              <>
                <span className="result-emoji">🎉</span>
                <span>Chúc mừng! Bạn trúng <strong>{result.label}</strong>!</span>
              </>
            ) : (
              <>
                <span className="result-emoji">😅</span>
                <span>Tiếc quá! Mất lượt rồi!</span>
              </>
            )}
          </div>
        )}

        {greeting && (
          <div className="greeting-box">
            <p className="greeting-text">🌸 {greeting}</p>
          </div>
        )}

        <button
          className="spin-btn"
          onClick={spin}
          disabled={spinning || player.totalCoins < SPIN_COST}
        >
          {spinning ? '🌀 Đang quay...' : player.totalCoins < SPIN_COST ? 'Không đủ xu' : `🎡 Quay (🪙 ${SPIN_COST} xu)`}
        </button>
      </div>
    </div>
  );
}
