import { useState, useCallback, useRef, useEffect } from 'react';
import type { Player } from '../types';
import { addCoins } from '../utils/storage';
import { getGreeting } from '../utils/greetings';
import { canPlay, recordPlay, getRemainingPlays } from '../utils/limits';
import { playWin, playLose, playChime } from '../utils/sounds';
import GameRules from '../components/GameRules';

const RULES = [
  'Chọn mức cược: 10, 20, 50 hoặc 100 xu.',
  'Nhấn "Chia Bài" — bạn và Nhà Cái mỗi người nhận 3 lá bài.',
  'Điểm = tổng giá trị 3 lá bài, chỉ lấy hàng đơn vị (ví dụ: tổng 17 → 7 nút).',
  'Giá trị bài: A=1, 2-9 theo mặt, 10/J/Q/K=10 (tính là 0 nút).',
  'Ai nhiều nút hơn thắng. Bằng điểm → hòa (không mất xu).',
  'Được 8 hoặc 9 nút (Bát/Cửu) → thắng gấp đôi!',
  'Thua → mất số xu đã cược.',
  'Giới hạn 15 lượt chơi mỗi ngày.',
];

interface BaiCaoProps {
  player: Player;
  onUpdate: (player: Player) => void;
  onBack: () => void;
}

const SUITS = ['♠️', '♥️', '♦️', '♣️'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10];

interface Card {
  suit: string;
  rank: string;
  value: number;
}

function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let i = 0; i < RANKS.length; i++) {
      deck.push({ suit, rank: RANKS[i], value: VALUES[i] });
    }
  }
  return deck;
}

function shuffle(deck: Card[]): Card[] {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getScore(cards: Card[]): number {
  const total = cards.reduce((s, c) => s + c.value, 0);
  return total % 10;
}

function getScoreName(score: number): string {
  if (score === 9) return 'Cửu (9 nút)';
  if (score === 8) return 'Bát (8 nút)';
  if (score === 0) return 'Bù (0 nút)';
  return `${score} nút`;
}

const BET_OPTIONS = [10, 20, 50, 100];

export default function BaiCao({ player, onUpdate, onBack }: BaiCaoProps) {
  const [bet, setBet] = useState(10);
  const [dealing, setDealing] = useState(false);
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState<{ won: boolean; tie: boolean; playerScore: number; dealerScore: number } | null>(null);
  const [greeting, setGreeting] = useState('');
  const [remaining, setRemaining] = useState(getRemainingPlays('bai-cao'));
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  const deal = useCallback(() => {
    if (dealing || bet > player.totalCoins) return;
    if (!canPlay('bai-cao')) return;
    setDealing(true);
    setRevealed(false);
    setResult(null);
    setGreeting('');

    const deck = shuffle(createDeck());
    const pCards = [deck[0], deck[1], deck[2]];
    const dCards = [deck[3], deck[4], deck[5]];

    setPlayerCards(pCards);
    setDealerCards(dCards);

    timeoutRef.current = setTimeout(() => {
      setRevealed(true);
      const pScore = getScore(pCards);
      const dScore = getScore(dCards);

      let won = false;
      let tie = false;
      if (pScore > dScore) {
        won = true;
      } else if (pScore === dScore) {
        tie = true;
      }

      setResult({ won, tie, playerScore: pScore, dealerScore: dScore });

      if (won) {
        setGreeting(getGreeting(player.department));
        playWin();
        const coins = pScore >= 8 ? bet * 2 : bet;
        const updated = addCoins(player, coins, 'Bài Cào', `${getScoreName(pScore)} thắng ${getScoreName(dScore)} → +${coins} xu`);
        onUpdate(updated);
      } else if (!tie) {
        playLose();
        const updated = addCoins(player, -bet, 'Bài Cào', `${getScoreName(pScore)} thua ${getScoreName(dScore)} → -${bet} xu`);
        onUpdate(updated);
      } else {
        playChime();
      }

      recordPlay('bai-cao');
      setRemaining(getRemainingPlays('bai-cao'));
      setDealing(false);
    }, 1500);
  }, [dealing, bet, player, onUpdate]);

  const renderCard = (card: Card, faceDown: boolean) => {
    const isRed = card.suit === '♥️' || card.suit === '♦️';
    return (
      <div className={`bc-card ${faceDown ? 'face-down' : ''} ${isRed ? 'red' : 'black'}`}>
        {faceDown ? (
          <span className="bc-card-back">🎴</span>
        ) : (
          <>
            <span className="bc-card-rank">{card.rank}</span>
            <span className="bc-card-suit">{card.suit}</span>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="game-page bai-cao">
      <button className="back-btn" onClick={onBack}>← Quay Lại</button>
      <div className="game-content">
        <h2>🃏 Bài Cào (Ba Cây)</h2>
        <p className="game-instruction">
          Chia 3 lá bài, tính điểm hàng đơn vị. Ai cao hơn thắng! Được 8-9 nút thắng gấp đôi!
        </p>
        <GameRules rules={RULES} />

        {remaining > 0 ? (
          <div className="limit-info">
            🃏 Còn {remaining} lượt chơi hôm nay
          </div>
        ) : (
          <div className="limit-notice">
            🔒 Đã hết lượt chơi hôm nay. Quay lại vào ngày mai nhé!
          </div>
        )}

        <div className="bacao-table">
          <div className="bacao-hand">
            <h4>🏦 Nhà Cái</h4>
            <div className="bacao-cards">
              {dealerCards.length > 0 ? dealerCards.map((c, i) => (
                <div key={i} className="bacao-card-wrap">
                  {renderCard(c, !revealed)}
                </div>
              )) : (
                <>
                  <div className="bacao-card-wrap"><div className="bc-card face-down"><span className="bc-card-back">🎴</span></div></div>
                  <div className="bacao-card-wrap"><div className="bc-card face-down"><span className="bc-card-back">🎴</span></div></div>
                  <div className="bacao-card-wrap"><div className="bc-card face-down"><span className="bc-card-back">🎴</span></div></div>
                </>
              )}
            </div>
            {revealed && result && (
              <span className="bacao-score">{getScoreName(result.dealerScore)}</span>
            )}
          </div>

          <div className="bacao-vs">VS</div>

          <div className="bacao-hand">
            <h4>🧑 {player.name}</h4>
            <div className="bacao-cards">
              {playerCards.length > 0 ? playerCards.map((c, i) => (
                <div key={i} className="bacao-card-wrap">
                  {renderCard(c, false)}
                </div>
              )) : (
                <>
                  <div className="bacao-card-wrap"><div className="bc-card face-down"><span className="bc-card-back">🎴</span></div></div>
                  <div className="bacao-card-wrap"><div className="bc-card face-down"><span className="bc-card-back">🎴</span></div></div>
                  <div className="bacao-card-wrap"><div className="bc-card face-down"><span className="bc-card-back">🎴</span></div></div>
                </>
              )}
            </div>
            {playerCards.length > 0 && (
              <span className="bacao-score">{getScoreName(getScore(playerCards))}</span>
            )}
          </div>
        </div>

        {result && (
          <div className={`bacao-result ${result.won ? 'win' : result.tie ? 'tie' : 'lose'}`}>
            {result.won ? `🎉 Bạn thắng! ${result.playerScore >= 8 ? '(Thắng đậm x2!)' : ''}` :
             result.tie ? '🤝 Hòa! Không mất xu.' : '😅 Thua rồi!'}
          </div>
        )}

        {greeting && (
          <div className="greeting-box">
            <p className="greeting-text">🌸 {greeting}</p>
          </div>
        )}

        <div className="tx-bet">
          <span>Mức cược:</span>
          {BET_OPTIONS.map((amt) => (
            <button
              key={amt}
              className={`bet-option ${bet === amt ? 'active' : ''}`}
              onClick={() => !dealing && setBet(amt)}
              disabled={dealing || amt > player.totalCoins}
            >
              🪙 {amt}
            </button>
          ))}
        </div>

        <button
          className="tx-roll-btn"
          onClick={deal}
          disabled={dealing || bet > player.totalCoins || remaining <= 0}
        >
          {dealing ? '🃏 Đang chia bài...' : remaining <= 0 ? 'Hết lượt hôm nay' : '🃏 Chia Bài!'}
        </button>
      </div>
    </div>
  );
}
