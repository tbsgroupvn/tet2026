import { useState, useCallback } from 'react';
import type { Player } from '../types';
import { addCoins } from '../utils/storage';
import { canPlay, recordPlay, getRemainingPlays } from '../utils/limits';
import { playWin, playLose, playClick } from '../utils/sounds';
import GameRules from '../components/GameRules';
import CultureTipCard from '../components/CultureTipCard';

const RULES = [
  'Chọn Kéo ✌️, Búa ✊ hoặc Bao ✋ để đấu với máy.',
  'Kéo thắng Bao, Búa thắng Kéo, Bao thắng Búa.',
  'Mỗi ván Best of 5 (ai thắng 3 trước thì thắng).',
  'Thắng ván: +20 xu. Thua: -5 xu. Hòa cả ván (hiếm): +5 xu.',
  'Thắng 3-0 (sweep): bonus thêm 10 xu!',
  'Giới hạn 15 ván mỗi ngày.',
];

interface Props {
  player: Player;
  onUpdate: (player: Player) => void;
  onBack: () => void;
}

type Choice = 'keo' | 'bua' | 'bao';

const CHOICES: { id: Choice; emoji: string; name: string }[] = [
  { id: 'keo', emoji: '✌️', name: 'Kéo' },
  { id: 'bua', emoji: '✊', name: 'Búa' },
  { id: 'bao', emoji: '✋', name: 'Bao' },
];

function getWinner(p: Choice, c: Choice): 'win' | 'lose' | 'draw' {
  if (p === c) return 'draw';
  if (
    (p === 'keo' && c === 'bao') ||
    (p === 'bua' && c === 'keo') ||
    (p === 'bao' && c === 'bua')
  ) return 'win';
  return 'lose';
}

function randomChoice(): Choice {
  const idx = Math.floor(Math.random() * 3);
  return CHOICES[idx].id;
}

export default function OanTuTi({ player, onUpdate, onBack }: Props) {
  const [remaining, setRemaining] = useState(getRemainingPlays('oan-tu-ti'));
  const [roundWins, setRoundWins] = useState(0);
  const [roundLosses, setRoundLosses] = useState(0);
  const [lastPlay, setLastPlay] = useState<{ player: Choice; cpu: Choice; result: string } | null>(null);
  const [matchOver, setMatchOver] = useState(false);
  const [matchResult, setMatchResult] = useState<'win' | 'lose' | 'draw' | null>(null);
  const [shaking, setShaking] = useState(false);
  const [history, setHistory] = useState<{ result: string; coins: number }[]>([]);

  const resetMatch = useCallback(() => {
    setRoundWins(0);
    setRoundLosses(0);
    setLastPlay(null);
    setMatchOver(false);
    setMatchResult(null);
  }, []);

  const handleChoice = (choice: Choice) => {
    if (matchOver || shaking || !canPlay('oan-tu-ti')) return;
    playClick();
    setShaking(true);

    setTimeout(() => {
      const cpuChoice = randomChoice();
      const result = getWinner(choice, cpuChoice);

      const newWins = result === 'win' ? roundWins + 1 : roundWins;
      const newLosses = result === 'lose' ? roundLosses + 1 : roundLosses;

      setRoundWins(newWins);
      setRoundLosses(newLosses);
      setLastPlay({
        player: choice,
        cpu: cpuChoice,
        result: result === 'win' ? 'Thắng!' : result === 'lose' ? 'Thua!' : 'Hòa!',
      });
      setShaking(false);

      // Check if match is over (best of 5)
      if (newWins >= 3 || newLosses >= 3) {
        const matchRes = newWins >= 3 ? 'win' : 'lose';
        setMatchOver(true);
        setMatchResult(matchRes);
        recordPlay('oan-tu-ti');
        setRemaining(getRemainingPlays('oan-tu-ti'));

        if (matchRes === 'win') {
          playWin();
          const bonus = newLosses === 0 ? 30 : 20; // sweep bonus
          const updated = addCoins(player, bonus, 'Oẳn Tù Tì', `Thắng ${newWins}-${newLosses}${newLosses === 0 ? ' (Sweep!)' : ''} → +${bonus} xu`);
          onUpdate(updated);
          setHistory(prev => [{ result: `Thắng ${newWins}-${newLosses}`, coins: bonus }, ...prev.slice(0, 9)]);
        } else {
          playLose();
          const updated = addCoins(player, -5, 'Oẳn Tù Tì', `Thua ${newWins}-${newLosses} → -5 xu`);
          onUpdate(updated);
          setHistory(prev => [{ result: `Thua ${newWins}-${newLosses}`, coins: -5 }, ...prev.slice(0, 9)]);
        }
      }
    }, 600);
  };

  const choiceEmoji = (c: Choice) => CHOICES.find(x => x.id === c)?.emoji || '';

  return (
    <div className="game-page oan-tu-ti">
      <button className="back-btn" onClick={onBack}>← Quay Lại</button>
      <div className="game-content">
        <h2>✊✌️✋ Oẳn Tù Tì</h2>
        <p className="game-instruction">Kéo Búa Bao — Best of 5!</p>
        <GameRules rules={RULES} />

        {remaining > 0 ? (
          <div className="limit-info">🎯 Còn {remaining} ván hôm nay</div>
        ) : (
          <div className="limit-notice">🔒 Đã hết lượt hôm nay!</div>
        )}

        <div className="ott-scoreboard">
          <span className="ott-score you">Bạn: {roundWins}</span>
          <span className="ott-vs">VS</span>
          <span className="ott-score cpu">Máy: {roundLosses}</span>
        </div>

        {lastPlay && (
          <div className="ott-last-play">
            <div className="ott-play-hands">
              <div className="ott-hand">
                <span className="ott-hand-emoji">{choiceEmoji(lastPlay.player)}</span>
                <span className="ott-hand-label">Bạn</span>
              </div>
              <span className="ott-play-vs">⚡</span>
              <div className="ott-hand">
                <span className="ott-hand-emoji">{choiceEmoji(lastPlay.cpu)}</span>
                <span className="ott-hand-label">Máy</span>
              </div>
            </div>
            <span className={`ott-play-result ${lastPlay.result === 'Thắng!' ? 'win' : lastPlay.result === 'Thua!' ? 'lose' : 'draw'}`}>
              {lastPlay.result}
            </span>
          </div>
        )}

        {matchOver && matchResult && (
          <>
            <div className={`ott-match-result ${matchResult}`}>
              <span className="ott-match-icon">{matchResult === 'win' ? '🎉' : '😅'}</span>
              <span>
                {matchResult === 'win'
                  ? `Thắng ván ${roundWins}-${roundLosses}! ${roundLosses === 0 ? '🔥 Sweep!' : ''}`
                  : `Thua ván ${roundWins}-${roundLosses}`}
              </span>
            </div>
            <CultureTipCard />
          </>
        )}

        {!matchOver && remaining > 0 && (
          <div className="ott-choices">
            {CHOICES.map(c => (
              <button
                key={c.id}
                className={`ott-choice-btn ${shaking ? 'shaking' : ''}`}
                onClick={() => handleChoice(c.id)}
                disabled={shaking}
              >
                <span className="ott-choice-emoji">{c.emoji}</span>
                <span className="ott-choice-name">{c.name}</span>
              </button>
            ))}
          </div>
        )}

        {matchOver && remaining > 0 && (
          <button className="bq-again-btn" onClick={resetMatch}>
            ✊ Chơi Ván Mới
          </button>
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
