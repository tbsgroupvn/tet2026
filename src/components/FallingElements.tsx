import { useEffect, useState } from 'react';

interface FallingItem {
  id: number;
  emoji: string;
  left: number;
  delay: number;
  duration: number;
  size: number;
}

const EMOJIS = ['🧧', '🏮', '🎋', '🌸', '💮', '🎊', '✨', '🍊'];

export default function FallingElements() {
  const [items, setItems] = useState<FallingItem[]>([]);

  useEffect(() => {
    const newItems: FallingItem[] = [];
    for (let i = 0; i < 20; i++) {
      newItems.push({
        id: i,
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
        left: Math.random() * 100,
        delay: Math.random() * 10,
        duration: 8 + Math.random() * 12,
        size: 16 + Math.random() * 20,
      });
    }
    setItems(newItems);
  }, []);

  return (
    <div className="falling-container">
      {items.map((item) => (
        <span
          key={item.id}
          className="falling-item"
          style={{
            left: `${item.left}%`,
            animationDelay: `${item.delay}s`,
            animationDuration: `${item.duration}s`,
            fontSize: `${item.size}px`,
          }}
        >
          {item.emoji}
        </span>
      ))}
    </div>
  );
}
