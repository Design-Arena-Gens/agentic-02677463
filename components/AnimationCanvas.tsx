'use client';
import { useEffect, useRef } from 'react';

type Props = { started: boolean; caption: string };

export default function AnimationCanvas({ started, caption }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    let width = 1280;
    let height = 720;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.parentElement?.getBoundingClientRect();
      width = Math.max(640, Math.floor((rect?.width || 960)));
      height = Math.floor(width * (9 / 16));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const palette = {
      bg: '#1b140f',
      bgAlt: '#2a1f18',
      gold: '#d6aa5c',
      mid: '#3b2d24',
      fg: '#f2e8d8',
      shadow: 'rgba(0,0,0,0.45)'
    };

    const drawStreetLight = (x: number, y: number, r: number) => {
      const g = ctx.createRadialGradient(x, y, 10, x, y, r);
      g.addColorStop(0, 'rgba(214,170,92,0.9)');
      g.addColorStop(0.4, 'rgba(214,170,92,0.35)');
      g.addColorStop(1, 'rgba(214,170,92,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      // Pole
      ctx.strokeStyle = palette.mid;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 280);
      ctx.stroke();
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 60, y - 30);
      ctx.stroke();
      ctx.fillStyle = palette.gold;
      ctx.beginPath();
      ctx.arc(x + 60, y - 30, 8, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawBoy = (t: number, x: number, y: number) => {
      const breath = 4 * Math.sin(t * 2);
      // Desk
      ctx.fillStyle = palette.mid;
      ctx.fillRect(x - 120, y + 40, 260, 18);
      // Body
      ctx.fillStyle = '#3e2f25';
      ctx.beginPath();
      ctx.roundRect(x - 30, y + breath, 60, 70, 10);
      ctx.fill();
      // Head
      ctx.fillStyle = '#6b4b39';
      ctx.beginPath();
      ctx.arc(x, y - 10 + breath * 0.3, 24, 0, Math.PI * 2);
      ctx.fill();
      // Hair
      ctx.fillStyle = '#2a1c15';
      ctx.beginPath();
      ctx.arc(x, y - 22 + breath * 0.3, 26, Math.PI, 0);
      ctx.fill();
      // Arms typing
      const hand = 6;
      const ty = y + 38 + (Math.sin(t * 8) * 3);
      ctx.fillStyle = '#6b4b39';
      ctx.fillRect(x - 28, ty, 20, 8);
      ctx.fillRect(x + 8, ty, 20, 8);
      ctx.beginPath();
      ctx.arc(x - 10, ty + 4, hand, 0, Math.PI * 2);
      ctx.arc(x + 28, ty + 4, hand, 0, Math.PI * 2);
      ctx.fill();
      // Laptop glow
      const glow = ctx.createLinearGradient(x - 40, y + 20, x + 40, y + 50);
      glow.addColorStop(0, 'rgba(214,170,92,0.25)');
      glow.addColorStop(1, 'rgba(214,170,92,0.08)');
      ctx.fillStyle = glow;
      ctx.fillRect(x - 40, y + 20, 80, 20);
    };

    const drawJudges = (t: number) => {
      ctx.save();
      ctx.globalAlpha = 0.55;
      for (let i = 0; i < 5; i++) {
        const jx = 80 + i * 220 + Math.sin(t + i) * 6;
        const jy = 180 + (i % 2) * 10;
        ctx.fillStyle = '#2b211a';
        ctx.beginPath();
        ctx.arc(jx, jy, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3b2d24';
        ctx.fillRect(jx - 18, jy + 18, 36, 60);
        // Subtle speech ovals
        if (i % 2 === 0) {
          ctx.strokeStyle = 'rgba(200,180,140,0.15)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(jx + 28, jy - 18, 22, 12, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.restore();
    };

    const drawMentor = (t: number, x: number, y: number) => {
      // Figure
      ctx.fillStyle = '#2d241d';
      ctx.beginPath();
      ctx.roundRect(x - 26, y - 10, 52, 92, 12);
      ctx.fill();
      ctx.fillStyle = '#5c4334';
      ctx.beginPath();
      ctx.arc(x, y - 16, 20 + Math.sin(t * 1.2) * 0.8, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawScene = (t: number) => {
      // Background
      const g = ctx.createLinearGradient(0, 0, 0, height);
      g.addColorStop(0, palette.bg);
      g.addColorStop(1, palette.bgAlt);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);

      // Ground plane
      ctx.fillStyle = '#231a14';
      ctx.fillRect(0, height - 160, width, 160);

      // Street light glow and mentor
      const lightX = width * 0.78;
      const lightY = height * 0.36 + Math.sin(t * 3) * 1.5;
      drawStreetLight(lightX, lightY, 240);
      drawMentor(t, lightX - 30, height - 210);

      // Judges silhouettes in background
      drawJudges(t * 0.7);

      // Boy in foreground
      drawBoy(t, width * 0.35 + Math.sin(t * 0.4) * 8, height - 230);

      // Filmic vignette
      const v = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.2, width / 2, height / 2, Math.max(width, height) * 0.7);
      v.addColorStop(0, 'rgba(0,0,0,0)');
      v.addColorStop(1, 'rgba(0,0,0,0.45)');
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, width, height);

      // Soft film grain
      const grain = 0.05;
      ctx.globalAlpha = grain;
      for (let i = 0; i < 40; i++) {
        const gx = Math.random() * width;
        const gy = Math.random() * height;
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.fillRect(gx, gy, 2, 2);
      }
      ctx.globalAlpha = 1;
    };

    const tick = (now: number) => {
      if (startTimeRef.current === null) startTimeRef.current = now;
      const t = (now - startTimeRef.current) / 1000;

      // Flicker with subtle amplitude mod when started
      const flicker = started ? (0.96 + Math.sin(t * 8) * 0.03) : 1;
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      drawScene(t);
      ctx.globalCompositeOperation = 'soft-light';
      ctx.globalAlpha = 0.25 * flicker;
      ctx.fillStyle = '#d6aa5c';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [started, caption]);

  return <canvas ref={canvasRef} />;
}
