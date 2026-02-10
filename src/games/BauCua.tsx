import { useState, useCallback } from 'react';
import type { Player } from '../types';
import { addCoins } from '../utils/storage';

interface BauCuaProps {
  player: Player;
  onUpdate: (player: Player) => void;
  onBack: () => void;
}

const SYMBOLS = [
  { id: 'bau', name: 'Bầu', emoji: '🍐' },
  { id: 'cua', name: 'Cua', emoji: '🦀' },
  { id: 'tom', name: 'Tôm', emoji: '🦐' },
  { id: 'ca', name: 'Cá', emoji: '🐟' },
  { id: 'ga', name: 'Gà', emoji: '🐓' },
  { id: 'nai', name: 'Nai', emoji: '🦌' },
];

const BET_OPTIONS = [10, 20, 50];

export default function BauCua({ player, onUpdate, onBack }: BauCuaProps) {
  const [bets, setBets] = useState<Record<string, number>>({});
  const [rolling, setRolling] = useState(false);
  const [dice, setDice] = useState<string[]>([]);
  const [result, setResult] = useState<{ won: number; details: string } | null>(null);
  const [betAmount, setBetAmount] = useState(10);

  const totalBet = Object.values(bets).reduce((s, v) => s + v, 0);

  const placeBet = (symbolId: string) => {
    if (rolling) return;
    if (totalBet + betAmount > player.totalCoins) return;
    setBets((prev) => ({
      ...prev,
      [symbolId]: (prev[symbolId] || 0) + betAmount,
    }));
    setResult(null);
  };

  const clearBets = () => {
    if (rolling) return;
    setBets({});
    setResult(null);
  };

  const rollDice = useCallback(() => {
    if (rolling || totalBet === 0) return;
    setRolling(true);
    setResult(null);

    // Animate dice rolling
    let count = 0;
    const interval = setInterval(() => {
      setDice([
        SYMBOLS[Math.floor(Math.random() * 6)].id,
        SYMBOLS[Math.floor(Math.random() * 6)].id,
        SYMBOLS[Math.floor(Math.random() * 6)].id,
      ]);
      count++;
      if (count > 15) {
        clearInterval(interval);
        // Final result
        const finalDice = [
          SYMBOLS[Math.floor(Math.random() * 6)].id,
          SYMBOLS[Math.floor(Math.random() * 6)].id,
          SYMBOLS[Math.floor(Math.random() * 6)].id,
        ];
        setDice(finalDice);

        // Calculate winnings
        let winnings = 0;
        const matchDetails: string[] = [];
        for (const [symbolId, bet] of Object.entries(bets)) {
          const matches = finalDice.filter((d) => d === symbolId).length;
          if (matches > 0) {
            const won = bet * matches;
            winnings += won + bet; // return bet + winnings
            const sym = SYMBOLS.find((s) => s.id === symbolId)!;
            matchDetails.push(`${sym.emoji} x${matches} = +${won}`);
          }
        }

        const netResult = winnings - totalBet;
        const details = matchDetails.length > 0
          ? matchDetails.join(', ')
          : 'Không trúng!';

        setResult({ won: netResult, details });

        if (netResult !== 0) {
          const updated = addCoins(player, netResult, 'Bầu Cua', details);
          onUpdate(updated);
        }

        setBets({});
        setRolling(false);
      }
    }, 100);
  }, [rolling, totalBet, bets, player, onUpdate]);

  return (
    <div className="game-page bau-cua">
      <button className="back-btn" onClick={onBack}>← Quay Lại</button>
      <div className="game-content">
        <h2>🎲 Bầu Cua Tôm Cá</h2>
        <p className="game-instruction">
          Đặt cược vào biểu tượng, lắc 3 xúc xắc. Trúng bao nhiêu thưởng bấy nhiêu!
        </p>

        <div className="bc-dice-area">
          <div className="bc-dice-row">
            {dice.length > 0 ? dice.map((d, i) => {
              const sym = SYMBOLS.find((s) => s.id === d)!;
              return (
                <div key={i} className={`bc-die ${rolling ? 'rolling' : 'landed'}`}>
                  <span>{sym.emoji}</span>
                </div>
              );
            }) : (
              <>
                <div className="bc-die empty">❓</div>
                <div className="bc-die empty">❓</div>
                <div className="bc-die empty">❓</div>
              </>
            )}
          </div>
        </div>

        {result && (
          <div className={`bc-result ${result.won >= 0 ? 'win' : 'lose'}`}>
            <span className="result-amount">
              {result.won >= 0 ? `🎉 +${result.won} xu` : `😅 ${result.won} xu`}
            </span>
            <span className="result-detail">{result.details}</span>
          </div>
        )}

        <div className="bc-bet-amount">
          <span>Mức cược:</span>
          {BET_OPTIONS.map((amt) => (
            <button
              key={amt}
              className={`bet-option ${betAmount === amt ? 'active' : ''}`}
              onClick={() => setBetAmount(amt)}
            >
              🪙 {amt}
            </button>
          ))}
        </div>

        <div className="bc-board">
          {SYMBOLS.map((sym) => (
            <div
              key={sym.id}
              className={`bc-cell ${bets[sym.id] ? 'has-bet' : ''} ${rolling ? 'disabled' : ''}`}
              onClick={() => placeBet(sym.id)}
            >
              <span className="bc-emoji">{sym.emoji}</span>
              <span className="bc-name">{sym.name}</span>
              {bets[sym.id] && (
                <span className="bc-bet-badge">🪙 {bets[sym.id]}</span>
              )}
            </div>
          ))}
        </div>

        <div className="bc-actions">
          <div className="bc-total">Tổng cược: 🪙 {totalBet} / {player.totalCoins.toLocaleString()}</div>
          <div className="bc-buttons">
            <button className="bc-clear" onClick={clearBets} disabled={rolling || totalBet === 0}>
              Xóa Cược
            </button>
            <button className="bc-roll" onClick={rollDice} disabled={rolling || totalBet === 0}>
              {rolling ? 'Đang lắc...' : '🎲 Lắc Xúc Xắc!'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
