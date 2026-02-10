import { useState, useEffect, useCallback } from 'react';
import type { Player } from '../types';

interface Wish {
  id: string;
  from: string;
  department: string;
  to: string;
  message: string;
  coins: number;
  emoji: string;
  timestamp: number;
}

const WISH_KEY = 'tbs_tet2026_wishes';
const ENVELOPE_EMOJIS = ['🧧', '🌸', '🎋', '🪷', '🏮', '🎊'];
const SAMPLE_MESSAGES = [
  'Chúc bạn năm mới An Khang Thịnh Vượng!',
  'Năm mới Phát Tài Phát Lộc!',
  'Chúc bạn sức khỏe, hạnh phúc!',
  'Năm mới vạn sự như ý!',
  'Chúc bạn thăng tiến trong công việc!',
  'Tết vui vẻ, sum vầy cùng gia đình!',
  // Lời chúc gắn 3 văn hóa doanh nghiệp TBS
  '⚖️ Chúc bạn luôn Bình Đẳng — cùng đi trên một con thuyền TBS!',
  '📢 Năm mới Báo Cáo kịp thời — truyền thông tích cực, cùng phát triển!',
  '🎯 Chúc bạn Ôn Hòa & Chuyên Nghiệp — Nice and Professional!',
  '🤝 Đoàn kết TBS — ba cây chụm lại nên hòn núi cao!',
  '💡 Năm mới Sáng Tạo — cùng TBS chinh phục mục tiêu mới!',
  '❤️ Tận Tâm phục vụ, tự hào là thành viên TBS Group!',
];

function getWishes(): Wish[] {
  try {
    return JSON.parse(localStorage.getItem(WISH_KEY) || '[]');
  } catch { return []; }
}

function saveWish(wish: Wish) {
  const all = getWishes();
  all.unshift(wish);
  localStorage.setItem(WISH_KEY, JSON.stringify(all.slice(0, 100)));
}

interface Props {
  player: Player;
}

export default function LiXiBanBe({ player }: Props) {
  const [wishes, setWishes] = useState<Wish[]>(getWishes());
  const [showForm, setShowForm] = useState(false);
  const [to, setTo] = useState('');
  const [message, setMessage] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🧧');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    setWishes(getWishes());
  }, []);

  // Close modal on Escape key
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && showForm) setShowForm(false);
  }, [showForm]);

  useEffect(() => {
    if (showForm) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showForm, handleEscape]);

  const handleSend = () => {
    if (!to.trim() || !message.trim()) return;

    const wish: Wish = {
      id: Date.now().toString(36),
      from: player.name,
      department: player.department,
      to: to.trim(),
      message: message.trim(),
      coins: 0,
      emoji: selectedEmoji,
      timestamp: Date.now(),
    };

    saveWish(wish);
    setWishes(prev => [wish, ...prev]);
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setShowForm(false);
      setTo('');
      setMessage('');
    }, 2000);
  };

  const myWishes = wishes.filter(w => w.to === player.name || w.from === player.name);
  const allWishes = wishes;

  return (
    <div className="lixi-banbe">
      <div className="lixi-header">
        <h3>🧧 Lì Xì & Lời Chúc Bạn Bè</h3>
        <p>Gửi lời chúc Tết đến đồng nghiệp TBS Group!</p>
        <button className="lixi-send-btn" onClick={() => setShowForm(true)}>
          ✉️ Gửi Lời Chúc
        </button>
      </div>

      {/* Send Form Modal */}
      {showForm && (
        <div className="payment-modal-overlay" onClick={() => setShowForm(false)} onKeyDown={(e) => { if (e.key === 'Escape') setShowForm(false); }} role="dialog" aria-modal="true" aria-label="Gửi lời chúc Tết">
          <div className="payment-modal lixi-modal" onClick={e => e.stopPropagation()}>
            {sent ? (
              <div className="lixi-sent-anim">
                <span className="lixi-sent-emoji">{selectedEmoji}</span>
                <h3>Đã gửi lời chúc!</h3>
              </div>
            ) : (
              <>
                <h3>🧧 Gửi Lời Chúc Tết</h3>

                <div className="lixi-emoji-picker">
                  {ENVELOPE_EMOJIS.map(e => (
                    <button
                      key={e}
                      className={`lixi-emoji-opt ${selectedEmoji === e ? 'active' : ''}`}
                      onClick={() => setSelectedEmoji(e)}
                    >
                      {e}
                    </button>
                  ))}
                </div>

                <div className="payment-field">
                  <label>Gửi đến (tên đồng nghiệp):</label>
                  <input
                    type="text"
                    value={to}
                    onChange={e => setTo(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="payment-input"
                    maxLength={50}
                  />
                </div>

                <div className="payment-field">
                  <label>Lời chúc:</label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Nhập lời chúc Tết..."
                    className="payment-input lixi-textarea"
                    maxLength={200}
                    rows={3}
                  />
                </div>

                <div className="lixi-quick-msgs">
                  {SAMPLE_MESSAGES.map((m, i) => (
                    <button
                      key={i}
                      className="lixi-quick-btn"
                      onClick={() => setMessage(m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                <div className="payment-actions">
                  <button
                    className="payment-submit-btn"
                    onClick={handleSend}
                    disabled={!to.trim() || !message.trim()}
                  >
                    {selectedEmoji} Gửi Lời Chúc
                  </button>
                  <button className="payment-cancel-btn" onClick={() => setShowForm(false)}>
                    Hủy
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* My Wishes */}
      {myWishes.length > 0 && (
        <div className="lixi-section">
          <h4>💌 Lời chúc của tôi</h4>
          <div className="lixi-wish-list">
            {myWishes.slice(0, 10).map(w => (
              <div key={w.id} className="lixi-wish-card">
                <span className="lixi-wish-emoji">{w.emoji}</span>
                <div className="lixi-wish-content">
                  <div className="lixi-wish-header">
                    <strong>{w.from}</strong> → <strong>{w.to}</strong>
                  </div>
                  <p className="lixi-wish-msg">{w.message}</p>
                  <span className="lixi-wish-time">
                    {new Date(w.timestamp).toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Wishes Wall */}
      <div className="lixi-section">
        <h4>🌸 Bảng Lời Chúc TBS Group</h4>
        {allWishes.length === 0 ? (
          <p className="lixi-empty">Chưa có lời chúc nào. Hãy là người đầu tiên!</p>
        ) : (
          <div className="lixi-wall">
            {allWishes.slice(0, 20).map(w => (
              <div key={w.id} className="lixi-wall-card">
                <span className="lixi-wall-emoji">{w.emoji}</span>
                <div className="lixi-wall-body">
                  <span className="lixi-wall-from">{w.from} ({w.department})</span>
                  <span className="lixi-wall-arrow">→</span>
                  <span className="lixi-wall-to">{w.to}</span>
                </div>
                <p className="lixi-wall-msg">"{w.message}"</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
