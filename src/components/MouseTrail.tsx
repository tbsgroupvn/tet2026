import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  emoji?: string;
}

const TRAIL_COLORS = ['#ffd700', '#ff6b6b', '#ff9ff3', '#ffeaa7', '#fab1a0', '#e74c3c'];
const TRAIL_EMOJIS = ['✨', '🌸', '🪙', '⭐', '🏮', '🎋'];

export default function MouseTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const mouse = useRef({ x: -100, y: -100 });
  const raf = useRef<number>(0);
  const lastEmit = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      const now = Date.now();
      if (now - lastEmit.current > 50) {
        lastEmit.current = now;
        // Spawn 1-2 particles
        const count = Math.random() > 0.6 ? 2 : 1;
        for (let i = 0; i < count; i++) {
          const useEmoji = Math.random() > 0.7;
          particles.current.push({
            x: e.clientX + (Math.random() - 0.5) * 10,
            y: e.clientY + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -Math.random() * 2 - 0.5,
            life: 1,
            maxLife: 1,
            size: useEmoji ? 14 : 3 + Math.random() * 4,
            color: TRAIL_COLORS[Math.floor(Math.random() * TRAIL_COLORS.length)],
            emoji: useEmoji ? TRAIL_EMOJIS[Math.floor(Math.random() * TRAIL_EMOJIS.length)] : undefined,
          });
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const t = e.touches[0];
        mouse.current = { x: t.clientX, y: t.clientY };
        const now = Date.now();
        if (now - lastEmit.current > 80) {
          lastEmit.current = now;
          particles.current.push({
            x: t.clientX,
            y: t.clientY,
            vx: (Math.random() - 0.5) * 1,
            vy: -Math.random() * 1.5 - 0.3,
            life: 1,
            maxLife: 1,
            size: 3 + Math.random() * 3,
            color: TRAIL_COLORS[Math.floor(Math.random() * TRAIL_COLORS.length)],
            emoji: Math.random() > 0.8 ? TRAIL_EMOJIS[Math.floor(Math.random() * TRAIL_EMOJIS.length)] : undefined,
          });
        }
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.current = particles.current.filter(p => p.life > 0);

      // Keep max particles reasonable
      if (particles.current.length > 60) {
        particles.current = particles.current.slice(-60);
      }

      for (const p of particles.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.02; // gravity
        p.life -= 0.02;

        const alpha = Math.max(0, p.life / p.maxLife);

        if (p.emoji) {
          ctx.globalAlpha = alpha;
          ctx.font = `${p.size}px serif`;
          ctx.fillText(p.emoji, p.x, p.y);
          ctx.globalAlpha = 1;
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = alpha * 0.7;
          ctx.fill();
          ctx.globalAlpha = 1;

          // Glow
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * alpha * 2, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = alpha * 0.15;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="mouse-trail-canvas"
    />
  );
}
