import { useState } from 'react';
import type { Player } from '../types';
import { addCoins } from '../utils/storage';
import {
  getDailyChallenge,
  isDailyChallengeCompleted,
  completeDailyChallenge,
  getDailyChallengeResult,
} from '../utils/tbsQuiz';

interface Props {
  player: Player;
  onUpdate: (player: Player) => void;
}

const BONUS_COINS = 15;

export default function DailyCultureChallenge({ player, onUpdate }: Props) {
  const question = getDailyChallenge();
  const savedResult = getDailyChallengeResult();
  const [selected, setSelected] = useState<number | null>(null);
  const [done, setDone] = useState(isDailyChallengeCompleted());
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(savedResult?.correct ?? null);

  const handleAnswer = (idx: number) => {
    if (done || selected !== null) return;
    setSelected(idx);
    const correct = idx === question.correct;
    setWasCorrect(correct);
    completeDailyChallenge(correct);
    setDone(true);
    if (correct) {
      const updated = addCoins(player, BONUS_COINS, 'Thử Thách Văn Hóa', `Đúng: +${BONUS_COINS} xu bonus`);
      onUpdate(updated);
    }
  };

  return (
    <div className="daily-challenge">
      <div className="daily-challenge-header">
        <span className="daily-challenge-icon">🏆</span>
        <div>
          <h4 className="daily-challenge-title">Thử Thách Văn Hóa Hôm Nay</h4>
          <p className="daily-challenge-sub">Trả lời đúng nhận {BONUS_COINS} xu bonus — không giới hạn lượt!</p>
        </div>
      </div>

      {done && wasCorrect !== null ? (
        <div className={`daily-challenge-result ${wasCorrect ? 'correct' : 'wrong'}`}>
          <span className="daily-challenge-result-icon">{wasCorrect ? '🎉' : '📚'}</span>
          <div>
            <p className="daily-challenge-result-text">
              {wasCorrect
                ? `Chính xác! +${BONUS_COINS} xu bonus`
                : `Đáp án đúng: ${question.options[question.correct]}`}
            </p>
            <p className="daily-challenge-explain">💡 {question.explanation}</p>
          </div>
        </div>
      ) : (
        <div className="daily-challenge-body">
          <p className="daily-challenge-question">{question.question}</p>
          <div className="daily-challenge-options">
            {question.options.map((opt, idx) => (
              <button
                key={idx}
                className="daily-challenge-opt"
                onClick={() => handleAnswer(idx)}
              >
                <span className="daily-opt-letter">{['A', 'B', 'C', 'D'][idx]}</span>
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
