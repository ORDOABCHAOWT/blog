'use client';

import { useEffect, useRef } from 'react';

const W = 460;
const H = 460;
const CELL = 8;
const COLS = Math.floor(W / CELL);
const ROWS = Math.floor(H / CELL);

const SCENE_DURATION = 6.0;
const FADE_DURATION = 1.2;

type Scene = 'planet' | 'jellyfish' | 'rose';
const SCENES: Scene[] = ['planet', 'jellyfish', 'rose'];

// Each grid slot = a "particle" with character + weight.
// Position is computed at draw time so the mouse can displace it.
type Cell = {
  ch: string;     // '0' or '1'
  w: number;      // 0..1 visual weight
};

export default function AsciiHeroDemo() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const pointer = useRef({ x: -9999, y: -9999, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(dpr, dpr);

    const grid: Cell[] = new Array(COLS * ROWS);
    for (let i = 0; i < grid.length; i++) {
      grid[i] = { ch: '0', w: 0 };
    }

    const start = performance.now();
    let raf = 0;

    function clearGrid() {
      for (let i = 0; i < grid.length; i++) {
        grid[i].w = 0;
      }
    }

    function baseChar(c: number, r: number, t: number) {
      const flow =
        Math.sin(c * 0.22 + t * 0.7 + r * 0.08) +
        Math.cos(r * 0.18 - t * 0.5 + c * 0.05) * 0.8;
      return flow > 0 ? '1' : '0';
    }

    function addWeight(c: number, r: number, t: number, w: number) {
      if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return;
      if (w <= 0) return;
      const idx = r * COLS + c;
      const cell = grid[idx];
      cell.ch = baseChar(c, r, t);
      cell.w = Math.min(1, cell.w + w);
    }

    /* ---------- background flow ---------- */
    function drawBackground(t: number) {
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const ripple = (Math.sin(c * 0.3 - t * 1.1 + r * 0.2) + 1) / 2;
          const base = 0.06 + ripple * 0.05;
          const idx = r * COLS + c;
          grid[idx].ch = baseChar(c, r, t);
          grid[idx].w = base;
        }
      }
    }

    /* ---------- SCENE: Planet + ring ---------- */
    function drawPlanet(t: number, weight: number) {
      if (weight <= 0) return;
      const cx = COLS * 0.5;
      const cy = ROWS * 0.5;
      const R = Math.min(COLS, ROWS) * 0.22;

      // --- ring (drawn first so the planet overlaps it in front) ---
      // Saturn-style ring: tilted ellipse, two thin bands.
      const tilt = 0.35;          // squash factor (vertical / horizontal)
      const ringRotation = -0.18; // slight rotation (radians)
      const cosA = Math.cos(ringRotation);
      const sinA = Math.sin(ringRotation);
      // Two band radii (relative to planet R) + half-thickness
      const ringRadii = [
        { r: R * 1.55, half: 0.22 },
        { r: R * 1.85, half: 0.18 },
      ];
      // Sample around the ellipse densely so cells fill in by 0/1
      const samples = 360;
      for (const band of ringRadii) {
        for (let off = -band.half; off <= band.half; off += 0.18) {
          const rad = band.r + off * R * 0.6;
          for (let s = 0; s < samples; s++) {
            const a = (s / samples) * Math.PI * 2;
            // unrotated, squashed ellipse
            const ex = Math.cos(a) * rad;
            const ey = Math.sin(a) * rad * tilt;
            // rotate
            const rx = ex * cosA - ey * sinA;
            const ry = ex * sinA + ey * cosA;
            const c = Math.round(cx + rx);
            const r = Math.round(cy + ry);
            // Hide the back half of the ring that goes behind the planet:
            // simple depth test — points with negative ey (top of ellipse)
            // are "behind" the planet center and should be drawn weaker
            // when they overlap the disk.
            const dPlanet = Math.hypot(c - cx, r - cy);
            if (dPlanet < R + 0.5 && ey < 0) continue;
            // Edge fade: brighter at the rim, dimmer toward planet
            const edgeFade = 1 - Math.abs(off) / band.half;
            addWeight(c, r, t, (0.55 + edgeFade * 0.4) * weight);
          }
        }
      }

      // --- planet disk ---
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const dx = c - cx;
          const dy = r - cy;
          const d = Math.hypot(dx, dy);
          if (d > R) continue;
          // crescent: brighter on upper-left
          const lightDir = (-dx - dy) / (R * 1.4);
          const lit = Math.max(0.3, 0.55 + lightDir * 0.55);
          addWeight(c, r, t, lit * weight);
        }
      }
    }

    /* ---------- SCENE: Jellyfish (centered, larger) ---------- */
    function drawJellyfish(t: number, weight: number) {
      if (weight <= 0) return;
      const cx = COLS * 0.5;
      const cy = ROWS * 0.5 + Math.sin(t * 0.6) * 0.6;
      const bell = Math.min(COLS, ROWS) * 0.32;

      // Bell: top half-disk
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const dx = (c - cx) / bell;
          const dy = (r - cy) / (bell * 0.85);
          if (dy > 0) continue;
          const d = dx * dx + dy * dy;
          if (d > 1) continue;
          const w = 0.7 + (1 - d) * 0.3;
          addWeight(c, r, t, w * weight);
        }
      }
      // Rim
      const rimR = Math.round(cy);
      for (let c = Math.ceil(cx - bell); c <= Math.floor(cx + bell); c++) {
        const dx = (c - cx) / bell;
        const fall = 1 - dx * dx;
        if (fall <= 0) continue;
        addWeight(c, rimR, t, 0.85 * weight);
        addWeight(c, rimR + 1, t, 0.5 * weight);
      }

      // Tentacles: 7 columns since bell is wider
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
          if (y >= ROWS) break;
          const w = 0.95 - p * 0.55;
          addWeight(x, y, t, w * weight);
        }
      }
    }

    /* ---------- SCENE: Single rose ----------
       One bloom (logarithmic spiral) at the top, one stem running
       down to the bottom, and two leaves on either side of the stem.
    */
    function drawRose(t: number, weight: number) {
      if (weight <= 0) return;
      const cx = COLS * 0.5;
      const bloom = { x: cx, y: ROWS * 0.28, R: 6.5, dir: 1, rot: 0 };
      const stemTop = { x: bloom.x, y: bloom.y + bloom.R * 0.85 };
      const stemBottom = { x: cx, y: ROWS - 2 };

      const sway = Math.sin(t * 0.6) * 0.06;

      // --- Bloom: thick Archimedean spiral (r = b·θ),
      //     filled inside its outermost loop so it reads as a flat
      //     top-view rose with a coiled center.
      const turns = 3.4;
      const samples = 520;
      const b = bloom.R / (turns * Math.PI * 2);
      for (let s = 0; s < samples; s++) {
        const p = s / samples;                    // 0..1
        const theta = p * turns * Math.PI * 2 * bloom.dir + bloom.rot + sway;
        const rad = b * (p * turns * Math.PI * 2);
        const sx = bloom.x + Math.cos(theta) * rad;
        const sy = bloom.y + Math.sin(theta) * rad * 0.92;
        // 3-wide stamp for ribbon thickness; inner whorls darker.
        const stamp = 1.5;
        for (let dy = -stamp; dy <= stamp; dy += 0.5) {
          for (let dx = -stamp; dx <= stamp; dx += 0.5) {
            if (dx * dx + dy * dy > stamp * stamp) continue;
            const w = 0.92 - p * 0.4;
            addWeight(Math.round(sx + dx), Math.round(sy + dy), t, w * weight);
          }
        }
      }
      // Outer petal silhouette: scalloped ring at r = R
      const ringSamples = 200;
      for (let s = 0; s < ringSamples; s++) {
        const a2 = (s / ringSamples) * Math.PI * 2;
        const scallop = 1 + 0.13 * Math.sin(5 * a2 + bloom.rot);
        const rr = bloom.R * scallop;
        const sx = bloom.x + Math.cos(a2) * rr;
        const sy = bloom.y + Math.sin(a2) * rr * 0.92;
        addWeight(Math.round(sx), Math.round(sy), t, 0.7 * weight);
      }

      // --- Stem: gentle vertical curve, 2 cells wide ---
      const stemSteps = 80;
      for (let i = 0; i < stemSteps; i++) {
        const p = i / (stemSteps - 1);
        // small horizontal sway along stem so it doesn't look like a ruler
        const s2 = Math.sin(p * Math.PI + t * 0.4) * 0.6;
        const x = stemTop.x + (stemBottom.x - stemTop.x) * p + s2;
        const y = stemTop.y + (stemBottom.y - stemTop.y) * p;
        addWeight(Math.round(x), Math.round(y), t, 0.95 * weight);
        addWeight(Math.round(x) + 1, Math.round(y), t, 0.55 * weight);
      }

      // --- Two symmetric leaves attached to the stem ---
      const leaves = [
        { x: cx - 4.5, y: ROWS * 0.62, rx: 4.5, ry: 2.0, rot: -0.7 },
        { x: cx + 4.5, y: ROWS * 0.62, rx: 4.5, ry: 2.0, rot: 0.7 },
      ];
      for (const lf of leaves) {
        const cosA = Math.cos(lf.rot);
        const sinA = Math.sin(lf.rot);
        for (let r = Math.floor(lf.y - lf.rx - 1); r <= Math.ceil(lf.y + lf.rx + 1); r++) {
          for (let c = Math.floor(lf.x - lf.rx - 1); c <= Math.ceil(lf.x + lf.rx + 1); c++) {
            const dx = c - lf.x;
            const dy = r - lf.y;
            const lx = dx * cosA + dy * sinA;
            const ly = -dx * sinA + dy * cosA;
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

      // Pointer in pixel space
      const ppx = pointer.current.x;
      const ppy = pointer.current.y;
      const pActive = pointer.current.active;
      // Avoidance radius (pixels) and strength — kept subtle so the
      // characters only nudge aside, not blast outward.
      const avoidR = 45;
      const avoidStrength = 14;

      // Paint
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f3f3f1';
      ctx.fillRect(0, 0, W, H);

      ctx.font = `${CELL}px ui-monospace, "SF Mono", Menlo, monospace`;
      ctx.textBaseline = 'top';

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const cell = grid[r * COLS + c];
          if (cell.w <= 0.04) continue;

          // Particle's "home" position (center of its grid cell)
          let x = c * CELL + CELL * 0.5;
          let y = r * CELL + CELL * 0.5;

          // Mouse displacement: push particle outward along the (x,y)->pointer
          // vector, with strength falling off with distance. The particle
          // doesn't fade — it slides around the cursor.
          if (pActive) {
            const dx = x - ppx;
            const dy = y - ppy;
            const dist = Math.hypot(dx, dy);
            if (dist < avoidR && dist > 0.01) {
              const fall = 1 - dist / avoidR; // 1 at center, 0 at edge
              // Higher exponent => only very close particles move much,
              // distant ones barely shift. Feels natural / gentle.
              const push = Math.pow(fall, 1.9) * avoidStrength;
              x += (dx / dist) * push;
              y += (dy / dist) * push;
            }
          }

          const k = Math.min(1, cell.w);
          const shade = Math.round(180 - k * 165);
          const alpha = 0.35 + k * 0.65;
          ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade - 4}, ${alpha})`;
          // Draw with the home glyph dimensions; offset by half cell so we
          // can place the particle by its center.
          ctx.fillText(cell.ch, x - CELL * 0.5, y - CELL * 0.5);
        }
      }

      raf = requestAnimationFrame(render);
    }

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'relative',
        width: W,
        height: H,
        cursor: 'crosshair',
      }}
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
