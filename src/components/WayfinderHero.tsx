'use client';

import { memo, useEffect, useRef } from 'react';

const CELL = 8;
const SCENE_DURATION = 6.0;
const FADE_DURATION = 1.2;

type Scene = 'planet' | 'jellyfish' | 'rose';
const SCENES: Scene[] = ['planet', 'jellyfish', 'rose'];

type Cell = {
  ch: string;
  w: number;
};

function WayfinderHeroImpl(_props: { activeIndex?: number | null }) {
  // activeIndex is intentionally unused — the new hero rotates through
  // its own scenes; the prop is kept for API compatibility.
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointer = useRef({ x: -9999, y: -9999, active: false });

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const canvasContext = canvas.getContext('2d');
    if (!canvasContext) return;
    const ctx: CanvasRenderingContext2D = canvasContext;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let cols = 0;
    let rows = 0;
    let grid: Cell[] = [];
    let widthPx = 0;
    let heightPx = 0;

    function resize() {
      if (!wrap || !canvas || !ctx) return;
      const rect = wrap.getBoundingClientRect();
      widthPx = rect.width;
      heightPx = rect.height;
      cols = Math.max(1, Math.floor(widthPx / CELL));
      rows = Math.max(1, Math.floor(heightPx / CELL));
      canvas.width = widthPx * dpr;
      canvas.height = heightPx * dpr;
      canvas.style.width = `${widthPx}px`;
      canvas.style.height = `${heightPx}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      grid = new Array(cols * rows);
      for (let i = 0; i < grid.length; i++) grid[i] = { ch: '0', w: 0 };
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const start = performance.now();
    let raf = 0;

    // Detect dark vs light scheme so we can flip the digit color.
    let darkMode =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    const mql =
      typeof window !== 'undefined'
        ? window.matchMedia('(prefers-color-scheme: dark)')
        : null;
    const onSchemeChange = (e: MediaQueryListEvent) => {
      darkMode = e.matches;
    };
    mql?.addEventListener?.('change', onSchemeChange);

    function clearGrid() {
      for (let i = 0; i < grid.length; i++) grid[i].w = 0;
    }

    function baseChar(c: number, r: number, t: number) {
      const flow =
        Math.sin(c * 0.22 + t * 0.7 + r * 0.08) +
        Math.cos(r * 0.18 - t * 0.5 + c * 0.05) * 0.8;
      return flow > 0 ? '1' : '0';
    }

    function addWeight(c: number, r: number, t: number, w: number) {
      if (c < 0 || c >= cols || r < 0 || r >= rows) return;
      if (w <= 0) return;
      const idx = r * cols + c;
      const cell = grid[idx];
      cell.ch = baseChar(c, r, t);
      cell.w = Math.min(1, cell.w + w);
    }

    function drawBackground(t: number) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const ripple = (Math.sin(c * 0.3 - t * 1.1 + r * 0.2) + 1) / 2;
          const base = 0.06 + ripple * 0.05;
          const idx = r * cols + c;
          grid[idx].ch = baseChar(c, r, t);
          grid[idx].w = base;
        }
      }
    }

    function drawPlanet(t: number, weight: number) {
      if (weight <= 0) return;
      const cx = cols * 0.5;
      const cy = rows * 0.5;
      const R = Math.min(cols, rows) * 0.22;
      // Saturn-style ring (drawn first, partly behind the planet)
      const tilt = 0.35;
      const ringRotation = -0.18;
      const cosA = Math.cos(ringRotation);
      const sinA = Math.sin(ringRotation);
      const ringRadii = [
        { rad: R * 1.55, half: 0.22 },
        { rad: R * 1.85, half: 0.18 },
      ];
      const samples = 360;
      for (const band of ringRadii) {
        for (let off = -band.half; off <= band.half; off += 0.18) {
          const rr2 = band.rad + off * R * 0.6;
          for (let s = 0; s < samples; s++) {
            const a = (s / samples) * Math.PI * 2;
            const ex = Math.cos(a) * rr2;
            const ey = Math.sin(a) * rr2 * tilt;
            const rx = ex * cosA - ey * sinA;
            const ry = ex * sinA + ey * cosA;
            const c = Math.round(cx + rx);
            const r = Math.round(cy + ry);
            const dPlanet = Math.hypot(c - cx, r - cy);
            if (dPlanet < R + 0.5 && ey < 0) continue;
            const edgeFade = 1 - Math.abs(off) / band.half;
            addWeight(c, r, t, (0.55 + edgeFade * 0.4) * weight);
          }
        }
      }
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const dx = c - cx;
          const dy = r - cy;
          const d = Math.hypot(dx, dy);
          if (d > R) continue;
          const lightDir = (-dx - dy) / (R * 1.4);
          const lit = Math.max(0.3, 0.55 + lightDir * 0.55);
          addWeight(c, r, t, lit * weight);
        }
      }
    }

    function drawJellyfish(t: number, weight: number) {
      if (weight <= 0) return;
      const cx = cols * 0.5;
      const cy = rows * 0.5 + Math.sin(t * 0.6) * 0.6;
      const bell = Math.min(cols, rows) * 0.32;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const dx = (c - cx) / bell;
          const dy = (r - cy) / (bell * 0.85);
          if (dy > 0) continue;
          const d = dx * dx + dy * dy;
          if (d > 1) continue;
          const w = 0.7 + (1 - d) * 0.3;
          addWeight(c, r, t, w * weight);
        }
      }
      const rimR = Math.round(cy);
      for (let c = Math.ceil(cx - bell); c <= Math.floor(cx + bell); c++) {
        const dx = (c - cx) / bell;
        const fall = 1 - dx * dx;
        if (fall <= 0) continue;
        addWeight(c, rimR, t, 0.85 * weight);
        addWeight(c, rimR + 1, t, 0.5 * weight);
      }
      const tentCount = 7;
      for (let i = 0; i < tentCount; i++) {
        const tx0 = (i / (tentCount - 1) - 0.5) * bell * 1.6;
        const length = bell * 1.7;
        const segs = Math.round(length);
        for (let s = 0; s < segs; s++) {
          const p = s / segs;
          const sway = Math.sin(t * 1.3 + i * 0.7 + p * 2.6) * (1 + p * 2);
          const x = Math.round(cx + tx0 + sway);
          const y = Math.round(cy + 1 + s);
          if (y >= rows) break;
          const w = 0.95 - p * 0.55;
          addWeight(x, y, t, w * weight);
        }
      }
    }

    function drawRose(t: number, weight: number) {
      if (weight <= 0) return;
      const cx = cols * 0.5;
      const bloom = { x: cx, y: rows * 0.28, R: 6.5, dir: 1, rot: 0 };
      const stemTop = { x: bloom.x, y: bloom.y + bloom.R * 0.85 };
      const stemBottom = { x: cx, y: rows - 2 };
      const sway = Math.sin(t * 0.6) * 0.06;

      // Bloom: thick Archimedean spiral
      const turns = 3.4;
      const samples = 520;
      const b = bloom.R / (turns * Math.PI * 2);
      for (let s = 0; s < samples; s++) {
        const p = s / samples;
        const theta = p * turns * Math.PI * 2 * bloom.dir + bloom.rot + sway;
        const rad = b * (p * turns * Math.PI * 2);
        const sx = bloom.x + Math.cos(theta) * rad;
        const sy = bloom.y + Math.sin(theta) * rad * 0.92;
        const stamp = 1.5;
        for (let dy = -stamp; dy <= stamp; dy += 0.5) {
          for (let dx = -stamp; dx <= stamp; dx += 0.5) {
            if (dx * dx + dy * dy > stamp * stamp) continue;
            const w = 0.92 - p * 0.4;
            addWeight(Math.round(sx + dx), Math.round(sy + dy), t, w * weight);
          }
        }
      }
      // Outer scalloped petal silhouette
      const ringSamples = 200;
      for (let s = 0; s < ringSamples; s++) {
        const a2 = (s / ringSamples) * Math.PI * 2;
        const scallop = 1 + 0.13 * Math.sin(5 * a2 + bloom.rot);
        const rr = bloom.R * scallop;
        const sx = bloom.x + Math.cos(a2) * rr;
        const sy = bloom.y + Math.sin(a2) * rr * 0.92;
        addWeight(Math.round(sx), Math.round(sy), t, 0.7 * weight);
      }
      // Stem
      const stemSteps = 80;
      for (let i = 0; i < stemSteps; i++) {
        const p = i / (stemSteps - 1);
        const s2 = Math.sin(p * Math.PI + t * 0.4) * 0.6;
        const x = stemTop.x + (stemBottom.x - stemTop.x) * p + s2;
        const y = stemTop.y + (stemBottom.y - stemTop.y) * p;
        addWeight(Math.round(x), Math.round(y), t, 0.95 * weight);
        addWeight(Math.round(x) + 1, Math.round(y), t, 0.55 * weight);
      }
      // Two leaves
      const leaves = [
        { x: cx - 4.5, y: rows * 0.62, rx: 4.5, ry: 2.0, rot: -0.7 },
        { x: cx + 4.5, y: rows * 0.62, rx: 4.5, ry: 2.0, rot: 0.7 },
      ];
      for (const lf of leaves) {
        const cosL = Math.cos(lf.rot);
        const sinL = Math.sin(lf.rot);
        for (let r = Math.floor(lf.y - lf.rx - 1); r <= Math.ceil(lf.y + lf.rx + 1); r++) {
          for (let c = Math.floor(lf.x - lf.rx - 1); c <= Math.ceil(lf.x + lf.rx + 1); c++) {
            const dx = c - lf.x;
            const dy = r - lf.y;
            const lx = dx * cosL + dy * sinL;
            const ly = -dx * sinL + dy * cosL;
            const nx = lx / lf.rx;
            const ny = ly / lf.ry;
            if (nx * nx + ny * ny > 1) continue;
            const edge = 1 - (nx * nx + ny * ny);
            addWeight(c, r, t, (0.6 + edge * 0.35) * weight);
          }
        }
      }
    }

    function render(now: number) {
      const t = (now - start) / 1000;
      clearGrid();
      drawBackground(t);

      const cycle = SCENE_DURATION;
      const localT = (t % cycle) / cycle;
      const sceneIdx = Math.floor(t / cycle) % SCENES.length;
      const fade = FADE_DURATION / cycle;
      let curW = 1;
      let nextW = 0;
      if (localT > 1 - fade) {
        const k = (localT - (1 - fade)) / fade;
        curW = 1 - k;
        nextW = k;
      }
      const cur = SCENES[sceneIdx];
      const next = SCENES[(sceneIdx + 1) % SCENES.length];
      const paint = (s: Scene, w: number) => {
        if (s === 'planet') drawPlanet(t, w);
        else if (s === 'jellyfish') drawJellyfish(t, w);
        else drawRose(t, w);
      };
      paint(cur, curW);
      paint(next, nextW);

      const ppx = pointer.current.x;
      const ppy = pointer.current.y;
      const pActive = pointer.current.active;
      const avoidR = 45;
      const avoidStrength = 14;

      ctx.clearRect(0, 0, widthPx, heightPx);
      // Transparent background — let the page color show through.

      ctx.font = `${CELL}px ui-monospace, "SF Mono", Menlo, monospace`;
      ctx.textBaseline = 'top';

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = grid[r * cols + c];
          if (cell.w <= 0.04) continue;
          let x = c * CELL + CELL * 0.5;
          let y = r * CELL + CELL * 0.5;
          if (pActive) {
            const dx = x - ppx;
            const dy = y - ppy;
            const dist = Math.hypot(dx, dy);
            if (dist < avoidR && dist > 0.01) {
              const fall = 1 - dist / avoidR;
              const push = Math.pow(fall, 1.9) * avoidStrength;
              x += (dx / dist) * push;
              y += (dy / dist) * push;
            }
          }
          const k = Math.min(1, cell.w);
          // Light mode: cells go from light gray (180) to dark (15).
          // Dark mode: cells go from dim gray (60) to bright (235).
          const shade = darkMode
            ? Math.round(60 + k * 175)
            : Math.round(180 - k * 165);
          const alpha = 0.35 + k * 0.65;
          ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade - 4}, ${alpha})`;
          ctx.fillText(cell.ch, x - CELL * 0.5, y - CELL * 0.5);
        }
      }

      raf = requestAnimationFrame(render);
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      render(performance.now());
    } else {
      raf = requestAnimationFrame(render);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mql?.removeEventListener?.('change', onSchemeChange);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="wayfinder-hero"
      aria-hidden="true"
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        pointer.current.x = e.clientX - rect.left;
        pointer.current.y = e.clientY - rect.top;
        pointer.current.active = true;
      }}
      onPointerLeave={() => {
        pointer.current.active = false;
        pointer.current.x = -9999;
        pointer.current.y = -9999;
      }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}

const WayfinderHero = memo(WayfinderHeroImpl, (prev, next) => {
  return prev.activeIndex === next.activeIndex;
});

export default WayfinderHero;
