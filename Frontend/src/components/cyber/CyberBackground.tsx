'use client';

import { useEffect, useRef } from 'react';

// ── Professional Cyberpunk 2077 Background ──
// Multi-layer Canvas with depth, HUD elements, and cinematic grading

function drawScene(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const cx = w / 2;

  // ── 1. Deep Space Gradient ──
  const bgGrad = ctx.createRadialGradient(cx, h * 0.3, 0, cx, h * 0.3, h * 1.2);
  bgGrad.addColorStop(0, '#08080C');
  bgGrad.addColorStop(0.4, '#050508');
  bgGrad.addColorStop(1, '#020203');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // ── 2. Depth Grid ──
  const vpY = h * 0.4;
  ctx.lineWidth = 0.3;

  // Horizontal bands
  for (let i = 1; i < 50; i++) {
    const z = i * 18;
    const y = vpY + z * 0.12 * (1 + Math.sin(t * 0.0001) * 0.02);
    if (y > h) break;
    const spread = w * 0.5 * (1 / (1 + z * 0.003));
    const alpha = 0.025 * (1 - z / 2000);
    ctx.strokeStyle = `rgba(0,246,255,${Math.max(0.005, alpha)})`;
    ctx.beginPath();
    ctx.moveTo(cx - spread, y);
    ctx.lineTo(cx + spread, y);
    ctx.stroke();
  }

  // ── 3. Subtle horizontal scan line ──
  const beamY = (t * 0.03) % (h + 20) - 10;
  ctx.fillStyle = 'rgba(0,246,255,0.015)';
  ctx.fillRect(0, beamY, w, 1);

  // ── 4. Floating Nodes ──
  const nodes = [
    { x: 0.1, y: 0.7, vx: 0.007, vy: -0.004, r: 2.0, c: '0,246,255' },
    { x: 0.2, y: 0.3, vx: -0.005, vy: 0.005, r: 1.6, c: '255,0,100' },
    { x: 0.4, y: 0.65, vx: 0.005, vy: -0.003, r: 1.8, c: '0,246,255' },
    { x: 0.5, y: 0.2, vx: -0.006, vy: 0.006, r: 1.5, c: '255,200,0' },
    { x: 0.66, y: 0.55, vx: 0.004, vy: -0.005, r: 1.9, c: '0,246,255' },
    { x: 0.76, y: 0.35, vx: -0.005, vy: 0.004, r: 1.4, c: '255,0,100' },
    { x: 0.3, y: 0.5, vx: 0.006, vy: 0.004, r: 1.2, c: '255,200,0' },
    { x: 0.6, y: 0.75, vx: -0.004, vy: -0.005, r: 1.7, c: '0,246,255' },
    { x: 0.48, y: 0.45, vx: 0.003, vy: -0.002, r: 1.3, c: '255,0,100' },
    { x: 0.86, y: 0.6, vx: -0.005, vy: 0.003, r: 1.5, c: '0,246,255' },
    { x: 0.15, y: 0.4, vx: 0.004, vy: 0.005, r: 1.1, c: '255,200,0' },
    { x: 0.35, y: 0.78, vx: -0.007, vy: -0.003, r: 1.8, c: '0,246,255' },
  ];

  for (const node of nodes) {
    let nx = (node.x * w + t * node.vx) % w;
    if (nx < 0) nx += w;
    let ny = (node.y * h + t * node.vy) % h;
    if (ny < 0) ny += h;
    const pulse = 0.7 + 0.3 * Math.sin(t * 0.002 + node.x * 10);
    ctx.shadowBlur = 15;
    ctx.shadowColor = `rgba(${node.c},${0.3 * pulse})`;
    ctx.fillStyle = `rgba(${node.c},${0.4 * pulse})`;
    ctx.beginPath();
    ctx.arc(nx, ny, node.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 10;
    ctx.shadowColor = `rgba(${node.c},${0.5 * pulse})`;
    ctx.fillStyle = `rgba(${node.c},${0.8 * pulse})`;
    ctx.beginPath();
    ctx.arc(nx, ny, node.r * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Connection lines between nearby nodes
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const n1x = (nodes[i].x * w + t * nodes[i].vx) % w;
      const n1y = (nodes[i].y * h + t * nodes[i].vy) % h;
      const n2x = (nodes[j].x * w + t * nodes[j].vx) % w;
      const n2y = (nodes[j].y * h + t * nodes[j].vy) % h;
      const dx = n1x - n2x;
      const dy = n1y - n2y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < w * 0.3) {
        const alpha = 0.08 * (1 - dist / (w * 0.3));
        ctx.strokeStyle = `rgba(0,246,255,${alpha})`;
        ctx.lineWidth = 0.4;
        ctx.beginPath();
        ctx.moveTo(n1x, n1y);
        ctx.lineTo(n2x, n2y);
        ctx.stroke();
      }
    }
  }

  // ── 5. Holographic Data Fragments ──
  const hexChars = '0123456789ABCDEF';
  const fragCount = 28;
  for (let i = 0; i < fragCount; i++) {
    const seed = i * 137.5;
    const fx = ((seed * 1.7 + t * 0.005) % (w + 100)) - 50;
    const fy = ((seed * 0.9 + t * 0.003 + 300) % (h + 120)) - 60;
    const drift = Math.sin(t * 0.001 + i * 0.7) * 15;
    const alpha = 0.12 + Math.sin(seed + t * 0.001) * 0.06;
    if (alpha < 0.04) continue;
    const chars = '0123456789ABCDEF';
    const txt = chars[Math.floor((seed + t * 0.004) % 16)] + chars[Math.floor((seed * 2 + t * 0.006) % 16)];
    ctx.shadowBlur = 6;
    ctx.shadowColor = i % 3 === 0 ? 'rgba(252,238,9,0.2)' : 'rgba(0,246,255,0.2)';
    ctx.fillStyle = i % 3 === 0 ? `rgba(252,238,9,${alpha})` : `rgba(0,246,255,${alpha})`;
    ctx.font = '8px "Share Tech Mono", monospace';
    ctx.fillText(txt, fx + drift, fy);
    ctx.shadowBlur = 0;
  }

  // ── 6. Floating micro particles ──
  for (let i = 0; i < 50; i++) {
    const seed = i * 63.5;
    const px = ((seed * 1.3 + t * 0.004 + i * 23) % (w + 60)) - 30;
    const py = ((seed * 0.7 + t * 0.003 + i * 13) % (h + 60)) - 30;
    const pulse = 0.4 + 0.6 * Math.sin(t * 0.0015 + i * 0.9);
    const alpha = 0.1 + pulse * 0.15;
    const colors = ['0,246,255', '255,0,100', '255,200,0', '0,255,65'];
    const ci = i % 4;
    ctx.shadowBlur = 8;
    ctx.shadowColor = `rgba(${colors[ci]},${alpha * 0.2})`;
    ctx.fillStyle = `rgba(${colors[ci]},${alpha})`;
    ctx.beginPath();
    ctx.arc(px, py, 0.5 + pulse * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // ── 7. Minimal HUD corners ──
  const s = 18, p = 16;
  ctx.strokeStyle = 'rgba(0,246,255,0.04)';
  ctx.lineWidth = 0.4;
  ctx.beginPath(); ctx.moveTo(p + s, p); ctx.lineTo(p, p); ctx.lineTo(p, p + s); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w - p - s, p); ctx.lineTo(w - p, p); ctx.lineTo(w - p, p + s); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(p + s, h - p); ctx.lineTo(p, h - p); ctx.lineTo(p, h - p - s); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w - p - s, h - p); ctx.lineTo(w - p, h - p); ctx.lineTo(w - p, h - p - s); ctx.stroke();

  // ── 8. Subtle Glitch (rare, refined) ──
  if (Math.random() > 0.998) {
    const gy = Math.random() * h;
    const gh = 1 + Math.random() * 3;
    ctx.fillStyle = `rgba(0,246,255,${0.015 + Math.random() * 0.015})`;
    ctx.fillRect(0, gy, w, gh);
    ctx.fillStyle = `rgba(252,238,9,${0.008 + Math.random() * 0.01})`;
    ctx.fillRect(2, gy, w - 4, gh);
  }

  // ── 9. Cinematic Vignette ──
  const vig = ctx.createRadialGradient(cx, h * 0.4, h * 0.15, cx, h * 0.5, h * 0.85);
  vig.addColorStop(0, 'transparent');
  vig.addColorStop(0.5, 'transparent');
  vig.addColorStop(0.85, 'rgba(5,5,8,0.2)');
  vig.addColorStop(1, 'rgba(5,5,8,0.5)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  // ── 10. Scanline flicker ──
  if (Math.random() > 0.997) {
    const slY = Math.random() * h;
    ctx.fillStyle = 'rgba(0,246,255,0.02)';
    ctx.fillRect(0, slY, w, 1);
  }
}

export function CyberBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    function animate() {
      timeRef.current = performance.now();
      drawScene(ctx, canvas!.width, canvas!.height, timeRef.current);
      animRef.current = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <>
      {/* Canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 z-[-2] pointer-events-none" />

      {/* Scanlines */}
      <div className="fixed inset-0 z-[-1] pointer-events-none opacity-30"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(0,246,255,0.003) 3px, rgba(0,246,255,0.003) 4px)',
          animation: 'scanline 10s linear infinite',
        }} />

      {/* Ambient glow top */}
      <div className="fixed inset-0 z-[-2] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 40% 20% at 50% -5%, rgba(0,246,255,0.03), transparent)' }} />

      {/* Ambient glow bottom */}
      <div className="fixed inset-0 z-[-2] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 40% 15% at 50% 105%, rgba(252,238,9,0.02), transparent)' }} />

      {/* Noise texture */}
      <div className="fixed inset-0 z-[-1] pointer-events-none opacity-[0.008]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '256px 256px',
        }} />
    </>
  );
}
