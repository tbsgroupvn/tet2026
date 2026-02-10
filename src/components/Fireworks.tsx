import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
  decay: number;
}

export default function Fireworks() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let particles: Particle[] = [];

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const colors = ['#ff0000', '#ffd700', '#ff6347', '#ff69b4', '#ffff00', '#ff4500', '#ffa500'];

    function createBurst(x: number, y: number) {
      const count = 30 + Math.random() * 20;
      const color = colors[Math.floor(Math.random() * colors.length)];
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2;
        const speed = 1 + Math.random() * 3;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color,
          size: 1.5 + Math.random() * 2,
          decay: 0.008 + Math.random() * 0.01,
        });
      }
    }

    function animate() {
      ctx!.globalCompositeOperation = 'destination-out';
      ctx!.fillStyle = 'rgba(0,0,0,0.15)';
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);
      ctx!.globalCompositeOperation = 'lighter';

      particles = particles.filter((p) => p.alpha > 0.01);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.02;
        p.alpha -= p.decay;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle =
          p.color +
          Math.floor(p.alpha * 255)
            .toString(16)
            .padStart(2, '0');
        ctx!.fill();
      }

      animId = requestAnimationFrame(animate);
    }

    animate();

    const interval = setInterval(() => {
      createBurst(
        100 + Math.random() * (canvas!.width - 200),
        50 + Math.random() * (canvas!.height * 0.4)
      );
    }, 2000);

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(interval);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
