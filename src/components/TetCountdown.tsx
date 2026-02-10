import { useState, useEffect } from 'react';

// Tết Nguyên Đán 2026: January 17, 2026 (Lunar New Year)
const TET_DATE = new Date('2026-01-17T00:00:00+07:00');

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  passed: boolean;
}

function getTimeLeft(): TimeLeft {
  const now = new Date();
  const diff = TET_DATE.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, passed: true };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    passed: false,
  };
}

export default function TetCountdown() {
  const [time, setTime] = useState(getTimeLeft());

  useEffect(() => {
    const interval = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (time.passed) {
    return (
      <div className="countdown-box countdown-tet">
        <div className="countdown-tet-msg">
          🎆🧧 CHÚC MỪNG NĂM MỚI 2026! 🧧🎆
        </div>
        <p className="countdown-sub">Tết Bính Ngọ - An Khang Thịnh Vượng!</p>
      </div>
    );
  }

  return (
    <div className="countdown-box">
      <h4 className="countdown-title">⏰ Đếm Ngược Giao Thừa</h4>
      <div className="countdown-digits">
        <div className="countdown-unit">
          <span className="countdown-num">{String(time.days).padStart(2, '0')}</span>
          <span className="countdown-label">Ngày</span>
        </div>
        <span className="countdown-sep">:</span>
        <div className="countdown-unit">
          <span className="countdown-num">{String(time.hours).padStart(2, '0')}</span>
          <span className="countdown-label">Giờ</span>
        </div>
        <span className="countdown-sep">:</span>
        <div className="countdown-unit">
          <span className="countdown-num">{String(time.minutes).padStart(2, '0')}</span>
          <span className="countdown-label">Phút</span>
        </div>
        <span className="countdown-sep">:</span>
        <div className="countdown-unit">
          <span className="countdown-num countdown-seconds">{String(time.seconds).padStart(2, '0')}</span>
          <span className="countdown-label">Giây</span>
        </div>
      </div>
    </div>
  );
}
