import { useState, useEffect, useCallback } from 'react';
import type { Player } from '../types';
import { addCoins } from '../utils/storage';
import { getGreeting } from '../utils/greetings';

interface CungOngBaProps {
  player: Player;
  onUpdate: (player: Player) => void;
  onBack: () => void;
}

interface Offering {
  id: string;
  name: string;
  emoji: string;
}

const ALL_OFFERINGS: Offering[] = [
  { id: 'banh-chung', name: 'Bánh Chưng', emoji: '🟩' },
  { id: 'banh-tet', name: 'Bánh Tét', emoji: '🫔' },
  { id: 'hoa-mai', name: 'Hoa Mai', emoji: '🌼' },
  { id: 'hoa-dao', name: 'Hoa Đào', emoji: '🌸' },
  { id: 'mam-ngu-qua', name: 'Mâm Ngũ Quả', emoji: '🍊' },
  { id: 'huong', name: 'Nhang Hương', emoji: '🪔' },
  { id: 'ruou', name: 'Rượu', emoji: '🍶' },
  { id: 'tra', name: 'Trà', emoji: '🍵' },
  { id: 'gio', name: 'Giò Chả', emoji: '🥖' },
  { id: 'xoi', name: 'Xôi', emoji: '🍚' },
  { id: 'ga', name: 'Gà Luộc', emoji: '🍗' },
  { id: 'mut', name: 'Mứt Tết', emoji: '🍬' },
];

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function CungOngBa({ player, onUpdate, onBack }: CungOngBaProps) {
  const [cards, setCards] = useState<(Offering & { flipped: boolean; matched: boolean; idx: number })[]>([]);
  const [firstPick, setFirstPick] = useState<number | null>(null);
  const [secondPick, setSecondPick] = useState<number | null>(null);
  const [matches, setMatches] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [totalPairs] = useState(6);

  const initGame = useCallback(() => {
    const selected = shuffleArray(ALL_OFFERINGS).slice(0, totalPairs);
    const doubled = [...selected, ...selected].map((o, idx) => ({
      ...o,
      flipped: false,
      matched: false,
      idx,
    }));
    setCards(shuffleArray(doubled));
    setFirstPick(null);
    setSecondPick(null);
    setMatches(0);
    setMoves(0);
    setGameOver(false);
    setGreeting('');
  }, [totalPairs]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (firstPick !== null && secondPick !== null) {
      setMoves((m) => m + 1);
      const first = cards[firstPick];
      const second = cards[secondPick];

      if (first.id === second.id) {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === first.id ? { ...c, matched: true } : c
            )
          );
          setMatches((m) => {
            const newM = m + 1;
            if (newM === totalPairs) {
              const bonus = Math.max(10, 60 - (moves * 2));
              setGreeting(getGreeting(player.department));
              const updated = addCoins(player, bonus, 'Cúng Ông Bà', `Hoàn thành mâm cỗ! ${moves + 1} lượt → +${bonus} xu`);
              onUpdate(updated);
              setGameOver(true);
            }
            return newM;
          });
          setFirstPick(null);
          setSecondPick(null);
        }, 500);
      } else {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) =>
              i === firstPick || i === secondPick ? { ...c, flipped: false } : c
            )
          );
          setFirstPick(null);
          setSecondPick(null);
        }, 800);
      }
    }
  }, [firstPick, secondPick, cards, totalPairs, moves, player, onUpdate]);

  const handleFlip = (index: number) => {
    if (gameOver) return;
    if (cards[index].flipped || cards[index].matched) return;
    if (firstPick !== null && secondPick !== null) return;

    setCards((prev) =>
      prev.map((c, i) => (i === index ? { ...c, flipped: true } : c))
    );

    if (firstPick === null) {
      setFirstPick(index);
    } else {
      setSecondPick(index);
    }
  };

  return (
    <div className="game-page cung-ong-ba">
      <button className="back-btn" onClick={onBack}>← Quay Lại</button>
      <div className="game-content">
        <h2>🪷 Cúng Ông Bà Tổ Tiên</h2>
        <p className="game-instruction">
          Lật tìm cặp lễ vật giống nhau để bày mâm cỗ cúng Ông Bà! Càng ít lượt càng nhiều xu!
        </p>

        <div className="cob-stats">
          <span>🎯 Đã tìm: {matches}/{totalPairs}</span>
          <span>👆 Lượt lật: {moves}</span>
        </div>

        <div className="cob-grid">
          {cards.map((card, i) => (
            <div
              key={i}
              className={`cob-card ${card.flipped || card.matched ? 'flipped' : ''} ${card.matched ? 'matched' : ''}`}
              onClick={() => handleFlip(i)}
            >
              <div className="cob-card-inner">
                <div className="cob-card-front">
                  <span className="cob-card-emoji">{card.emoji}</span>
                  <span className="cob-card-name">{card.name}</span>
                </div>
                <div className="cob-card-back-face">
                  <span>🪷</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {gameOver && (
          <div className="cob-complete">
            <h3>🎊 Mâm cỗ đã bày xong!</h3>
            <p>Hoàn thành trong <strong>{moves}</strong> lượt lật</p>
            <p className="cob-bonus">
              🪙 +{Math.max(10, 60 - (moves * 2))} xu
            </p>
            {greeting && (
              <div className="greeting-box">
                <p className="greeting-text">🌸 {greeting}</p>
              </div>
            )}
            <button className="bq-again-btn" onClick={initGame}>
              🪷 Bày Mâm Cỗ Mới
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
