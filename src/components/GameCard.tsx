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
    >
      <div className="game-card-emoji">{emoji}</div>
      <h3 className="game-card-title">{title}</h3>
      <p className="game-card-desc">{description}</p>
      <button className="game-card-btn">Chơi Ngay</button>
    </div>
  );
}
