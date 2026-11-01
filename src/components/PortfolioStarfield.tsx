'use client';

import { useEffect, useRef } from 'react';

const FPS = 12;
const FONT_SIZE = 13;
const LINE_HEIGHT = 1.15;

function hash(x: number, y: number, seed = 0) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 982451653)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

class Grid {
  readonly cells: string[];

  constructor(readonly cols: number, readonly rows: number) {
    this.cells = new Array(cols * rows).fill(' ');
  }

  set(x: number, y: number, char: string) {
    const cx = Math.round(x);
    const cy = Math.round(y);
    if (cx >= 0 && cy >= 0 && cx < this.cols && cy < this.rows) this.cells[cy * this.cols + cx] = char;
  }

  toString() {
    const lines: string[] = [];
    for (let y = 0; y < this.rows; y++) lines.push(this.cells.slice(y * this.cols, (y + 1) * this.cols).join(''));
    return lines.join('\n');
  }
}

type Lean = { x: number; y: number };

// One frame of sky: scattered stars, the Milky Way band and a few accent marks, as three text layers.
function drawSky(cols: number, rows: number, t: number, lean: Lean, animate: boolean) {
  const stars = new Grid(cols, rows);
  const band = new Grid(cols, rows);
  const accent = new Grid(cols, rows);

  // The Milky Way runs from lower left to upper right, split along its length by a dark dust lane.
  const cos = Math.cos(-0.36);
  const sin = Math.sin(-0.36);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const px = x - cols / 2 + lean.x * 3;
      const py = (y - rows * 0.46) * 2.1 + lean.y * 2;
      const across = -px * sin + py * cos;
      const along = px * cos + py * sin;
      const width = 9 + 3 * Math.sin(along * 0.045);
      let density = Math.exp(-(across * across) / (2 * width * width));
      density *= 1 - 0.8 * Math.exp(-((across - 1.5) ** 2) / (2 * 1.7 * 1.7));
      const roll = hash(x, y, 81);
      if (roll >= density * 0.45) continue;
      if (animate && hash(x, y, Math.floor(t * 1.4 + hash(x, y, 9) * 7)) < 0.1) continue;
      band.set(x, y, roll < density * 0.05 ? '*' : roll < density * 0.15 ? ':' : '.');
    }
  }

  // Scattered stars at two depths drift slowly left; the nearer ones lean further with the pointer.
  const count = Math.round((cols * rows) / 34);
  for (let i = 0; i < count; i++) {
    const near = hash(i, 4, 83) < 0.45;
    const x = (((hash(i, 1, 83) * cols - t * (near ? 0.22 : 0.08) + lean.x * (near ? 6 : 2)) % cols) + cols) % cols;
    const y = hash(i, 2, 83) * rows + lean.y * (near ? 2.5 : 1);
    const glow = Math.sin(t * (0.5 + hash(i, 3, 83) * 1.5) + i * 1.3);
    if (glow > 0.86) stars.set(x, y, '*');
    else if (glow > -0.2) stars.set(x, y, near && glow > 0.6 ? '+' : '.');
  }

  // A handful of bright stars in the accent colour.
  for (let k = 0; k < 5; k++) {
    const glow = Math.sin(t * 0.7 + k * 2.1);
    accent.set(hash(k, 1, 87) * cols + lean.x * 6, hash(k, 2, 87) * rows * 0.9 + lean.y * 2.5, glow > 0.3 ? '*' : '+');
  }

  // A shooting star every few seconds across the upper sky.
  const period = 6.5;
  const index = Math.floor(t / period);
  const age = t - index * period;
  if (animate && age < 1.1) {
    const headX = (0.1 + 0.55 * hash(index, 1, 89)) * cols + age * 42;
    const headY = (0.04 + 0.3 * hash(index, 2, 89)) * rows + age * 10;
    for (let j = 0; j < 11; j++) {
      (j < 3 ? accent : stars).set(headX - j * 1.9, headY - j * 0.46, j === 0 ? '*' : j < 5 ? '\\' : '.');
    }
  }

  return { stars: stars.toString(), band: band.toString(), accent: accent.toString() };
}

export default function PortfolioStarfield() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const starsRef = useRef<HTMLPreElement | null>(null);
  const bandRef = useRef<HTMLPreElement | null>(null);
  const accentRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const layers = [starsRef.current, bandRef.current, accentRef.current];
    if (!wrap || layers.some((layer) => !layer)) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = { x: 0, y: 0, inside: false };
    const lean: Lean = { x: 0, y: 0 };
    let charWidth = FONT_SIZE * 0.6;
    let cols = 0;
    let rows = 0;
    let visible = true;
    let lastFrame = 0;
    let animationFrame = 0;

    const measure = () => {
      const context = document.createElement('canvas').getContext('2d');
      if (context) {
        context.font = getComputedStyle(layers[0] as HTMLPreElement).font;
        charWidth = context.measureText('M'.repeat(40)).width / 40 || charWidth;
      }
      cols = Math.ceil(wrap.clientWidth / charWidth);
      rows = Math.ceil(wrap.clientHeight / (FONT_SIZE * LINE_HEIGHT));
    };

    const render = (now: number) => {
      const animate = !reduceMotion.matches;
      const rect = wrap.getBoundingClientRect();
      const targetX = pointer.inside ? (pointer.x - rect.left) / rect.width - 0.5 : 0;
      const targetY = pointer.inside ? (pointer.y - rect.top) / rect.height - 0.5 : 0;
      lean.x += (targetX - lean.x) * 0.15;
      lean.y += (targetY - lean.y) * 0.15;
      const frame = drawSky(cols, rows, animate ? now / 1000 : 3, lean, animate);
      (layers[0] as HTMLPreElement).textContent = frame.stars;
      (layers[1] as HTMLPreElement).textContent = frame.band;
      (layers[2] as HTMLPreElement).textContent = frame.accent;
    };

    const loop = (now: number) => {
      animationFrame = requestAnimationFrame(loop);
      if (!visible || document.hidden || now - lastFrame < 1000 / FPS) return;
      lastFrame = now;
      render(now);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.inside = true;
    };
    const onPointerLeave = () => {
      pointer.inside = false;
    };

    measure();
    render(performance.now());
    const resizeObserver = new ResizeObserver(() => {
      measure();
      render(performance.now());
    });
    resizeObserver.observe(wrap);
    const intersectionObserver = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true;
    });
    intersectionObserver.observe(wrap);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    document.fonts?.ready.then(() => {
      measure();
      render(performance.now());
    });
    if (!reduceMotion.matches) animationFrame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
    };
  }, []);

  return (
    <div className="portfolio-starfield" ref={wrapRef} aria-hidden="true">
      <pre className="portfolio-starfield__layer portfolio-starfield__stars" ref={starsRef} />
      <pre className="portfolio-starfield__layer portfolio-starfield__band" ref={bandRef} />
      <pre className="portfolio-starfield__layer portfolio-starfield__accent" ref={accentRef} />
    </div>
  );
}
