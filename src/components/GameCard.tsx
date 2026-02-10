import { playHover } from '../utils/sounds';

interface GameCardProps {
  emoji: string;
  title: string;
  description: string;
  color: string;
  onClick: () => void;
}

export default function GameCard({ emoji, title, description, color, onClick }: GameCardProps) {
  return (
    <div
      className="game-card"
      style={{ '--card-color': color } as React.CSSProperties}
      onClick={onClick}
      onMouseEnter={playHover}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      role="button"
      tabIndex={0}
      aria-label={`Chơi game ${title}`}
    >
      <div className="game-card-emoji" aria-hidden="true">{emoji}</div>
      <h3 className="game-card-title">{title}</h3>
      <p className="game-card-desc">{description}</p>
      <span className="game-card-btn" aria-hidden="true">Chơi Ngay</span>
    </div>
  );
}
