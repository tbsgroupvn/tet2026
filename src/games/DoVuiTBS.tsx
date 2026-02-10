import { useState, useRef, useEffect } from 'react';
import type { Player } from '../types';
import { addCoins } from '../utils/storage';
import { canPlay, recordPlay, getRemainingPlays } from '../utils/limits';
import { getRandomQuestions } from '../utils/tbsQuiz';
import type { QuizQuestion } from '../utils/tbsQuiz';
import GameRules from '../components/GameRules';

const RULES = [
  'Mỗi lượt chơi gồm 5 câu hỏi về văn hóa, dịch vụ và giá trị TBS Group.',
  'Đọc câu hỏi và chọn 1 trong 4 đáp án. Bạn có 20 giây cho mỗi câu.',
  'Trả lời đúng: nhận xu thưởng (10-20 xu tùy độ khó). Trả lời sai: không mất xu.',
  'Sau mỗi câu sẽ hiển thị giải thích giúp bạn hiểu thêm về công ty.',
  'Hoàn thành 5 câu = 1 lượt. Giới hạn 5 lượt mỗi ngày.',
  'Hãy chơi để hiểu thêm về TBS Group - nơi bạn làm việc mỗi ngày!',
];

interface DoVuiTBSProps {
  player: Player;
  onUpdate: (player: Player) => void;
  onBack: () => void;
}

const QUESTIONS_PER_ROUND = 5;
const TIME_PER_QUESTION = 20;

const CATEGORY_LABELS: Record<string, string> = {
  culture: '🏢 Văn hóa công ty',
  service: '📦 Dịch vụ & Sản phẩm',
  value: '⭐ Giá trị cốt lõi',
  team: '👥 Phòng ban & Đội ngũ',
  tet: '🧧 Tết & Truyền thống',
};

export default function DoVuiTBS({ player, onUpdate, onBack }: DoVuiTBSProps) {
  const [phase, setPhase] = useState<'start' | 'playing' | 'result' | 'summary'>('start');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timer, setTimer] = useState(TIME_PER_QUESTION);
  const [score, setScore] = useState({ correct: 0, totalCoins: 0 });
  const [remaining, setRemaining] = useState(getRemainingPlays('do-vui-tbs'));
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startRound = () => {
    if (!canPlay('do-vui-tbs')) return;
    const qs = getRandomQuestions(QUESTIONS_PER_ROUND);
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
    setSelectedAnswer(-1); // timeout marker
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
      const updated = addCoins(player, q.coins, 'Đố Vui TBS', `Đúng: "${q.question.slice(0, 30)}..." → +${q.coins} xu`);
      onUpdate(updated);
    }
  };

  const nextQuestion = () => {
    if (currentIdx + 1 >= questions.length) {
      recordPlay('do-vui-tbs');
      setRemaining(getRemainingPlays('do-vui-tbs'));
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
    <div className="game-page do-vui-tbs">
      <button className="back-btn" onClick={onBack}>← Quay Lại</button>
      <div className="game-content">
        <h2>🏢 Đố Vui TBS Group</h2>
        <p className="game-instruction">
          Trả lời câu hỏi về văn hóa, dịch vụ và giá trị TBS Group — vừa chơi vừa học!
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

        {/* START SCREEN */}
        {phase === 'start' && (
          <div className="quiz-start">
            <div className="quiz-start-icon">🏢</div>
            <h3>Bạn hiểu TBS Group bao nhiêu?</h3>
            <p>Trả lời {QUESTIONS_PER_ROUND} câu hỏi về công ty để nhận xu và khám phá thêm về nơi bạn làm việc!</p>
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
              {remaining > 0 ? '📝 Bắt Đầu Đố Vui!' : 'Hết lượt hôm nay'}
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
              {score.correct >= 4 ? '🏆' : score.correct >= 3 ? '🌟' : score.correct >= 2 ? '👍' : '📚'}
            </div>
            <h3>Kết Quả Đố Vui</h3>
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
                <p>🎉 Xuất sắc! Bạn hiểu rất rõ về TBS Group! Tự hào là thành viên TBS!</p>
              ) : score.correct >= 3 ? (
                <p>🌟 Tuyệt vời! Bạn nắm khá rõ về công ty. Hãy chơi thêm để hiểu hơn nhé!</p>
              ) : score.correct >= 1 ? (
                <p>👍 Không sao! Mỗi câu hỏi là một bài học. Hãy thử lại để biết thêm về TBS!</p>
              ) : (
                <p>📚 Đây là cơ hội để hiểu thêm về TBS Group! Hãy đọc giải thích và thử lại nhé!</p>
              )}
            </div>
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
