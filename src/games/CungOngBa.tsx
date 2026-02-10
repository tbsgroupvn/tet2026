import { useState, useEffect, useCallback, useRef } from 'react';
import type { Player } from '../types';
import { addCoins } from '../utils/storage';
import { getGreeting } from '../utils/greetings';
import { canPlay, recordPlay, getRemainingPlays } from '../utils/limits';
import GameRules from '../components/GameRules';

const RULES = [
  'Trên bàn có 16 thẻ úp (8 cặp lễ vật cúng ông bà).',
  'Nhấn vào thẻ để lật lên. Mỗi lượt lật 2 thẻ.',
  'Nếu 2 thẻ giống nhau → ghép cặp thành công, thẻ sẽ biến mất.',
  'Nếu 2 thẻ khác nhau → thẻ úp lại. Hãy nhớ vị trí!',
  'Tìm hết 8 cặp lễ vật để hoàn thành mâm cỗ.',
  'Giới hạn thời gian: 90 giây. Giới hạn lượt lật: 30 lượt.',
  'Hết thời gian hoặc hết lượt lật mà chưa xong → thua!',
  'Xu thưởng = 30 + thưởng thời gian + thưởng lượt lật. Càng nhanh, ít lượt → càng nhiều xu!',
  'Giới hạn 10 lượt chơi mỗi ngày.',
];

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

const TOTAL_PAIRS = 8;
const TIME_LIMIT = 90; // seconds
const MAX_MOVES = 30; // max moves allowed

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
  const [gameFailed, setGameFailed] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [gameStarted, setGameStarted] = useState(false);
  const [remaining, setRemaining] = useState(getRemainingPlays('cung-ong-ba'));
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const initGame = useCallback(() => {
    if (!canPlay('cung-ong-ba')) return;
    const selected = shuffleArray(ALL_OFFERINGS).slice(0, TOTAL_PAIRS);
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
    setGameFailed(false);
    setGreeting('');
    setTimeLeft(TIME_LIMIT);
    setGameStarted(true);
  }, []);

  useEffect(() => {
    if (canPlay('cung-ong-ba')) {
      initGame();
    }
  }, [initGame]);

  // Timer countdown
  useEffect(() => {
    if (gameStarted && !gameOver && !gameFailed) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setGameFailed(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [gameStarted, gameOver, gameFailed]);

  useEffect(() => {
    if (firstPick !== null && secondPick !== null) {
      const newMoves = moves + 1;
      setMoves(newMoves);
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
            if (newM === TOTAL_PAIRS) {
              if (timerRef.current) clearInterval(timerRef.current);
              const timeUsed = TIME_LIMIT - timeLeft;
              const timeBonus = Math.max(0, Math.floor((TIME_LIMIT - timeUsed) / 3));
              const moveBonus = Math.max(0, (MAX_MOVES - newMoves) * 2);
              const bonus = Math.max(10, 30 + timeBonus + moveBonus);
              setGreeting(getGreeting(player.department));
              recordPlay('cung-ong-ba');
              setRemaining(getRemainingPlays('cung-ong-ba'));
              const updated = addCoins(player, bonus, 'Cúng Ông Bà', `Hoàn thành! ${newMoves} lượt, ${timeUsed}s → +${bonus} xu`);
              onUpdate(updated);
              setGameOver(true);
            }
            return newM;
          });
          setFirstPick(null);
          setSecondPick(null);
        }, 500);
      } else {
        // Check max moves
        if (newMoves >= MAX_MOVES) {
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c, i) =>
                i === firstPick || i === secondPick ? { ...c, flipped: false } : c
              )
            );
            setFirstPick(null);
            setSecondPick(null);
            if (timerRef.current) clearInterval(timerRef.current);
            setGameFailed(true);
          }, 800);
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
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstPick, secondPick]);

  const handleFlip = (index: number) => {
    if (gameOver || gameFailed) return;
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

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  if (remaining <= 0 && !gameStarted) {
    return (
      <div className="game-page cung-ong-ba">
        <button className="back-btn" onClick={onBack}>← Quay Lại</button>
        <div className="game-content">
          <h2>🪷 Cúng Ông Bà Tổ Tiên</h2>
          <div className="limit-notice">
            🔒 Đã hết lượt chơi hôm nay. Quay lại vào ngày mai nhé!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-page cung-ong-ba">
      <button className="back-btn" onClick={onBack}>← Quay Lại</button>
      <div className="game-content">
        <h2>🪷 Cúng Ông Bà Tổ Tiên</h2>
        <p className="game-instruction">
          Lật tìm {TOTAL_PAIRS} cặp lễ vật trong {TIME_LIMIT}s và tối đa {MAX_MOVES} lượt lật! Càng nhanh càng nhiều xu!
        </p>
        <GameRules rules={RULES} />

        {remaining > 0 && !gameOver && !gameFailed && (
          <div className="limit-info">
            🪷 Còn {remaining} lượt chơi hôm nay
          </div>
        )}

        <div className="cob-stats">
          <span>🎯 Đã tìm: {matches}/{TOTAL_PAIRS}</span>
          <span>👆 Lượt: {moves}/{MAX_MOVES}</span>
          <span className={`cob-timer ${timeLeft <= 15 ? 'urgent' : ''}`}>
            ⏱️ {formatTime(timeLeft)}
          </span>
        </div>

        <div className="cob-grid cob-grid-8">
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
            <p>Hoàn thành trong <strong>{moves}</strong> lượt lật, <strong>{TIME_LIMIT - timeLeft}</strong> giây</p>
            <p className="cob-bonus">
              🪙 +{Math.max(10, 30 + Math.max(0, Math.floor(timeLeft / 3)) + Math.max(0, (MAX_MOVES - moves) * 2))} xu
            </p>
            {greeting && (
              <div className="greeting-box">
                <p className="greeting-text">🌸 {greeting}</p>
              </div>
            )}
            {remaining > 0 && (
              <button className="bq-again-btn" onClick={initGame}>
                🪷 Bày Mâm Cỗ Mới
              </button>
            )}
          </div>
        )}

        {gameFailed && !gameOver && (
          <div className="cob-failed">
            <h3>😢 Chưa hoàn thành!</h3>
            <p>
              {timeLeft <= 0 ? 'Hết thời gian rồi!' : `Đã hết ${MAX_MOVES} lượt lật!`}
            </p>
            <p>Đã tìm được {matches}/{TOTAL_PAIRS} cặp lễ vật.</p>
            {remaining > 0 && (
              <button className="bq-again-btn" onClick={initGame}>
                🪷 Thử Lại
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
