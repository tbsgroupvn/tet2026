import { useState } from 'react';

interface GameRulesProps {
  rules: string[];
  title?: string;
}

export default function GameRules({ rules, title = 'Luật Chơi' }: GameRulesProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`game-rules ${open ? 'open' : ''}`}>
      <button className="game-rules-toggle" onClick={() => setOpen(!open)}>
        <span className="game-rules-icon">📜</span>
        <span>{title}</span>
        <span className="game-rules-arrow">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="game-rules-content">
          <ol>
            {rules.map((rule, i) => (
              <li key={i}>{rule}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
