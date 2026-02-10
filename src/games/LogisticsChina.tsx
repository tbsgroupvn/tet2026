import { useState, useRef, useEffect } from 'react';
import type { Player } from '../types';
import { addCoins } from '../utils/storage';
import { canPlay, recordPlay, getRemainingPlays } from '../utils/limits';
import { getRandomLogisticsQuestions, CATEGORY_LABELS } from '../utils/logisticsQuiz';
import type { LogisticsQuestion } from '../utils/logisticsQuiz';
import GameRules from '../components/GameRules';
import CultureTipCard from '../components/CultureTipCard';

const RULES = [
  'Mỗi lượt chơi gồm 10 câu hỏi về logistics, thị trường Trung Quốc, Incoterms, hải quan và thanh toán quốc tế.',
  'Đọc câu hỏi và chọn 1 trong 4 đáp án. Bạn có 25 giây cho mỗi câu.',
  'Trả lời đúng: nhận xu thưởng (15-25 xu tùy độ khó). Trả lời sai: không mất xu.',
  'Sau mỗi câu sẽ hiển thị giải thích chuyên sâu giúp bạn nâng cao kiến thức nghiệp vụ.',
  'Hoàn thành 10 câu = 1 lượt. Giới hạn 5 lượt mỗi ngày.',
  'Kiến thức logistics & thị trường TQ là lợi thế cạnh tranh trong XNK!',
];

interface Props {
  player: Player;
  onUpdate: (player: Player) => void;
  onBack: () => void;
}

const QUESTIONS_PER_ROUND = 10;
const TIME_PER_QUESTION = 25;

export default function LogisticsChina({ player, onUpdate, onBack }: Props) {
  const [phase, setPhase] = useState<'start' | 'playing' | 'result' | 'summary'>('start');
  const [questions, setQuestions] = useState<LogisticsQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timer, setTimer] = useState(TIME_PER_QUESTION);
  const [score, setScore] = useState({ correct: 0, totalCoins: 0 });
  const [remaining, setRemaining] = useState(getRemainingPlays('logistics-china'));
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startRound = () => {
    if (!canPlay('logistics-china')) return;
    const qs = getRandomLogisticsQuestions(QUESTIONS_PER_ROUND);
    setQuestions(qs);
    setCurrentIdx(0);
    setScore({ correct: 0, totalCoins: 0 });
    setSelectedAnswer(null);
    setShowExplanation(false);
    setPhase('playing');
    startTimer();
  };

  const startTimer = () => {
    setTimer(TIME_PER_QUESTION);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeout = () => {
    setSelectedAnswer(-1);
    setShowExplanation(true);
  };

  const handleAnswer = (answerIdx: number) => {
    if (selectedAnswer !== null) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedAnswer(answerIdx);
    setShowExplanation(true);

    const q = questions[currentIdx];
    if (answerIdx === q.correct) {
      setScore(prev => ({
        correct: prev.correct + 1,
        totalCoins: prev.totalCoins + q.coins,
      }));
      const updated = addCoins(player, q.coins, 'Logistics & TQ', `Đúng: "${q.question.slice(0, 30)}..." → +${q.coins} xu`);
      onUpdate(updated);
    }
  };

  const nextQuestion = () => {
    if (currentIdx + 1 >= questions.length) {
      recordPlay('logistics-china');
      setRemaining(getRemainingPlays('logistics-china'));
      setPhase('summary');
      return;
    }
    setCurrentIdx(prev => prev + 1);
    setSelectedAnswer(null);
    setShowExplanation(false);
    startTimer();
  };

  const currentQ = questions[currentIdx];

  return (
    <div className="game-page logistics-china">
      <button className="back-btn" onClick={onBack}>← Quay Lại</button>
      <div className="game-content">
        <h2>🚢 Logistics & Thị Trường Trung Quốc</h2>
        <p className="game-instruction">
          Nâng cao kiến thức logistics, XNK và thị trường Trung Quốc — vừa chơi vừa học nghiệp vụ!
        </p>
        <GameRules rules={RULES} />

        {remaining > 0 ? (
          <div className="limit-info">
            📝 Còn {remaining} lượt chơi hôm nay
          </div>
        ) : (
          <div className="limit-notice">
            🔒 Đã hết lượt chơi hôm nay. Quay lại vào ngày mai nhé!
          </div>
        )}

        {/* START */}
        {phase === 'start' && (
          <div className="quiz-start">
            <div className="quiz-start-icon">🚢</div>
            <h3>Bạn biết gì về Logistics & Thị Trường TQ?</h3>
            <p>Trả lời 10 câu hỏi về XNK, vận chuyển, hải quan và thị trường Trung Quốc!</p>
            <div className="quiz-categories">
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <span key={key} className="quiz-category-tag">{label}</span>
              ))}
            </div>
            <button
              className="quiz-start-btn"
              onClick={startRound}
              disabled={remaining <= 0}
            >
              {remaining > 0 ? '🚢 Bắt Đầu Thử Thách!' : 'Hết lượt hôm nay'}
            </button>
          </div>
        )}

        {/* QUESTION */}
        {phase === 'playing' && currentQ && (
          <div className="quiz-question-area">
            <div className="quiz-progress">
              <span className="quiz-progress-text">
                Câu {currentIdx + 1}/{questions.length}
              </span>
              <div className="quiz-progress-bar">
                <div
                  className="quiz-progress-fill"
                  style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                />
              </div>
              <span className={`quiz-timer ${timer <= 5 ? 'urgent' : ''}`}>
                ⏱️ {timer}s
              </span>
            </div>

            <div className="quiz-category-badge">
              {CATEGORY_LABELS[currentQ.category]}
            </div>

            <div className="quiz-question-card">
              <p className="quiz-question-text">{currentQ.question}</p>
              <div className="quiz-options">
                {currentQ.options.map((opt, idx) => {
                  let optClass = 'quiz-option';
                  if (selectedAnswer !== null) {
                    if (idx === currentQ.correct) optClass += ' correct';
                    else if (idx === selectedAnswer && idx !== currentQ.correct) optClass += ' wrong';
                    else optClass += ' disabled';
                  }
                  return (
                    <button
                      key={idx}
                      className={optClass}
                      onClick={() => handleAnswer(idx)}
                      disabled={selectedAnswer !== null}
                    >
                      <span className="quiz-option-letter">
                        {['A', 'B', 'C', 'D'][idx]}
                      </span>
                      <span className="quiz-option-text">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {showExplanation && (
              <div className={`quiz-explanation ${selectedAnswer === currentQ.correct ? 'correct' : 'wrong'}`}>
                <div className="quiz-answer-result">
                  {selectedAnswer === -1 ? (
                    <span>⏰ Hết giờ!</span>
                  ) : selectedAnswer === currentQ.correct ? (
                    <span>🎉 Chính xác! +{currentQ.coins} xu</span>
                  ) : (
                    <span>❌ Sai rồi! Đáp án đúng: {currentQ.options[currentQ.correct]}</span>
                  )}
                </div>
                <p className="quiz-explanation-text">
                  💡 {currentQ.explanation}
                </p>
                <button className="quiz-next-btn" onClick={nextQuestion}>
                  {currentIdx + 1 >= questions.length ? '📊 Xem Kết Quả' : '➡️ Câu Tiếp Theo'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* SUMMARY */}
        {phase === 'summary' && (
          <div className="quiz-summary">
            <div className="quiz-summary-icon">
              {score.correct >= 8 ? '🏆' : score.correct >= 6 ? '🌟' : score.correct >= 4 ? '👍' : '📚'}
            </div>
            <h3>Kết Quả Thử Thách Logistics</h3>
            <div className="quiz-summary-stats">
              <div className="quiz-summary-stat">
                <span className="quiz-summary-num">{score.correct}/{questions.length}</span>
                <span className="quiz-summary-label">Câu đúng</span>
              </div>
              <div className="quiz-summary-stat">
                <span className="quiz-summary-num">🪙 +{score.totalCoins}</span>
                <span className="quiz-summary-label">Xu nhận được</span>
              </div>
            </div>
            <div className="quiz-summary-msg">
              {score.correct === questions.length ? (
                <p>🎉 Xuất sắc! 10/10 — Bạn là chuyên gia logistics & thị trường TQ!</p>
              ) : score.correct >= 8 ? (
                <p>🏆 Tuyệt vời! Kiến thức logistics của bạn rất vững! Tiếp tục phát huy!</p>
              ) : score.correct >= 6 ? (
                <p>🌟 Khá lắm! Bạn nắm khá rõ về XNK và thị trường TQ!</p>
              ) : score.correct >= 4 ? (
                <p>👍 Không tệ! Mỗi câu hỏi là một bài học nghiệp vụ quý giá!</p>
              ) : (
                <p>📚 Hãy đọc kỹ giải thích — kiến thức logistics sẽ giúp bạn rất nhiều trong công việc!</p>
              )}
            </div>
            <CultureTipCard />
            <div className="quiz-summary-actions">
              <button className="quiz-start-btn" onClick={startRound} disabled={remaining <= 0}>
                {remaining > 0 ? '🔄 Chơi Lại' : 'Hết lượt hôm nay'}
              </button>
              <button className="quiz-back-btn" onClick={onBack}>
                ← Về Trang Chủ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
