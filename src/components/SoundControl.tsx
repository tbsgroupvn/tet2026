import { useState } from 'react';
import { toggleMusic, isMusicPlaying, isSfxEnabled, setSfxEnabled } from '../utils/sounds';

export default function SoundControl() {
  const [music, setMusic] = useState(isMusicPlaying());
  const [sfx, setSfx] = useState(isSfxEnabled());
  const [open, setOpen] = useState(false);

  const handleToggleMusic = () => {
    const playing = toggleMusic();
    setMusic(playing);
  };

  const handleToggleSfx = () => {
    const next = !sfx;
    setSfxEnabled(next);
    setSfx(next);
  };

  return (
    <div className="sound-control">
      <button
        className="sound-toggle-btn"
        onClick={() => setOpen(!open)}
        title="Âm thanh"
      >
        {music || sfx ? '🔊' : '🔇'}
      </button>

      {open && (
        <div className="sound-menu">
          <button
            className={`sound-menu-item ${music ? 'active' : ''}`}
            onClick={handleToggleMusic}
          >
            {music ? '🎵 Nhạc nền: BẬT' : '🎵 Nhạc nền: TẮT'}
          </button>
          <button
            className={`sound-menu-item ${sfx ? 'active' : ''}`}
            onClick={handleToggleSfx}
          >
            {sfx ? '🔔 Hiệu ứng: BẬT' : '🔔 Hiệu ứng: TẮT'}
          </button>
        </div>
      )}
    </div>
  );
}
