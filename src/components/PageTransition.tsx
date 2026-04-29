'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Bottom-up ash-burn route transition.
 *
 * Visual:
 *   1. Click captures internal navigation.
 *   2. A fullscreen canvas paints the viewport densely with 0/1 chars.
 *   3. A "burn line" sweeps from the bottom of the screen to the top
 *      over ~600ms. Anything below the line is its current state;
 *      anything just above the line is on fire (warm tint); anything
 *      farther above has been turned into ash that floats upward and
 *      fades.
 *   4. Once the burn line crosses the top, router.push() is called.
 *   5. The incoming page settles in with a quick descending coalesce:
 *      sparse 0/1 falls from the top to its resting position and fades
 *      out, revealing the freshly mounted page.
 *
 * No particle drift outward — strictly upward motion, like rising ash.
 */
const TOTAL_MS = 1100;
const BURN_END = 0.55;       // 0..1 — burn line reaches top of screen here
const REVEAL_START = 0.55;   // incoming dust starts now
const REVEAL_END = 1.0;
const COL_WIDTH = 14;        // px between column anchors
const ROW_HEIGHT = 16;

export default function PageTransition() {
  const router = useRouter();

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (typeof window === 'undefined') return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest('a');
      if (!anchor) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;
      const href = anchor.getAttribute('href');
      if (!href) return;
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        return;
      }

      event.preventDefault();
      const fullPath = `${url.pathname}${url.search}${url.hash}`;

      if (reduceMotion) {
        router.push(fullPath);
        return;
      }

      // Mount canvas
      const canvas = document.createElement('canvas');
      canvas.className = 'page-dust-overlay';
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        router.push(fullPath);
        return;
      }
      ctx.scale(dpr, dpr);
      document.body.appendChild(canvas);

      // Build a dense grid of particles. Each one has a "home" position
      // on the page; its ignition time is determined by how high up it
      // is (lower particles ignite first → fire sweeps upward).
      type Particle = {
        x: number;     // home x
        y: number;     // home y
        ch: '0' | '1';
        size: number;
        seed: number;  // 0..1 stable random
        ignite: number; // 0..1 — fraction of TOTAL_MS at which it ignites
      };
      const particles: Particle[] = [];
      const cols = Math.ceil(w / COL_WIDTH);
      const rows = Math.ceil(h / ROW_HEIGHT);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const seed = Math.random();
          // Slight jitter so the grid doesn't look too rigid
          const jx = (Math.random() - 0.5) * (COL_WIDTH * 0.5);
          const jy = (Math.random() - 0.5) * (ROW_HEIGHT * 0.4);
          const x = c * COL_WIDTH + COL_WIDTH * 0.5 + jx;
          const y = r * ROW_HEIGHT + ROW_HEIGHT * 0.5 + jy;
          // Ignition: bottom-most rows ignite at t=0, top-most at t=BURN_END.
          // Add small per-particle jitter so it's not a perfectly straight line.
          const heightFrac = 1 - y / h;          // 0 at bottom, 1 at top
          const jitter = (Math.random() - 0.5) * 0.06;
          const ignite = Math.max(0, Math.min(BURN_END, heightFrac * BURN_END + jitter));
          particles.push({
            x,
            y,
            ch: Math.random() > 0.5 ? '1' : '0',
            size: 10 + seed * 4,
            seed,
            ignite,
          });
        }
      }

      // Incoming dust (sparse, descends from top)
      type InParticle = {
        x: number;
        y: number;       // resting y
        ch: '0' | '1';
        size: number;
        seed: number;
        appear: number;  // 0..1 within the reveal window
      };
      const incoming: InParticle[] = [];
      const inCount = Math.round((cols * rows) * 0.35);
      for (let i = 0; i < inCount; i++) {
        const seed = Math.random();
        incoming.push({
          x: Math.random() * w,
          y: Math.random() * h,
          ch: Math.random() > 0.5 ? '1' : '0',
          size: 9 + seed * 4,
          seed,
          appear: Math.random() * 0.85,
        });
      }

      const start = performance.now();
      let pushed = false;
      let raf = 0;

      const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const baseShade = darkMode ? 235 : 30;
      const emberWarm = darkMode
        ? { r: 255, g: 196, b: 130 }   // ember tint on dark bg
        : { r: 180, g: 90, b: 40 };     // ember tint on light bg

      const draw = (now: number) => {
        const t = (now - start) / TOTAL_MS;
        ctx.clearRect(0, 0, w, h);

        // ---- Burn phase (0..BURN_END) ----
        if (t < BURN_END + 0.05) {
          ctx.font = 'bold 12px ui-monospace, "SF Mono", Menlo, monospace';
          for (const p of particles) {
            // Fraction of "burn life": -inf..1
            //   < 0  → not yet ignited (still solid char)
            //   0..1 → burning + ashing
            //   > 1  → fully gone
            const burnLife = (t - p.ignite) / 0.32; // 0.32s burn duration
            if (burnLife < 0) {
              // Solid: render as normal char
              const a = 0.7 + p.seed * 0.25;
              const shade = darkMode
                ? Math.round(150 + p.seed * 70)
                : Math.round(60 + p.seed * 70);
              ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade - 4}, ${a})`;
              ctx.font = `${p.size}px ui-monospace, "SF Mono", Menlo, monospace`;
              ctx.fillText(p.ch, p.x - p.size * 0.3, p.y);
              continue;
            }
            if (burnLife > 1.4) continue; // gone

            // Burning particle: rise, shrink, drift slightly sideways,
            // fade through ember color to grey ash to transparent.
            const k = burnLife;          // 0..1.4
            const rise = -k * (60 + p.seed * 80);   // upward, varying speed
            const sway = Math.sin(k * 4 + p.seed * 6) * 6 * k;
            const x = p.x + sway;
            const y = p.y + rise;
            const sz = p.size * (1 - k * 0.55);
            if (sz < 1) continue;

            // First half: warm ember; second half: cooling grey ash.
            let r: number, g: number, b: number;
            if (k < 0.4) {
              // Hot ember
              const t2 = k / 0.4;
              r = emberWarm.r;
              g = emberWarm.g;
              b = emberWarm.b;
              // Slight brightening at the very moment of ignition
              const flare = Math.max(0, 1 - t2);
              r = Math.min(255, r + flare * 40);
              g = Math.min(255, g + flare * 40);
            } else {
              // Cooling: lerp from ember to base shade
              const t2 = (k - 0.4) / 1.0;
              r = emberWarm.r + (baseShade - emberWarm.r) * t2;
              g = emberWarm.g + (baseShade - emberWarm.g) * t2;
              b = emberWarm.b + (baseShade - emberWarm.b) * t2;
            }
            const alpha = Math.max(0, 1 - k / 1.4) * (0.55 + p.seed * 0.45);
            ctx.font = `${sz}px ui-monospace, "SF Mono", Menlo, monospace`;
            ctx.fillStyle = `rgba(${r | 0}, ${g | 0}, ${b | 0}, ${alpha})`;
            ctx.fillText(p.ch, x - sz * 0.3, y);
          }

          // Draw a thin glow line at the burn front for extra "fire" feel
          const burnY = h * (1 - t / BURN_END); // y of the burn line
          if (t < BURN_END) {
            const grad = ctx.createLinearGradient(0, burnY - 30, 0, burnY + 4);
            const warm = darkMode
              ? 'rgba(255, 170, 80, '
              : 'rgba(220, 110, 50, ';
            grad.addColorStop(0, warm + '0)');
            grad.addColorStop(0.7, warm + '0.10)');
            grad.addColorStop(1, warm + '0.32)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, burnY - 30, w, 34);
          }
        }

        // ---- Reveal phase (REVEAL_START..1) ----
        if (t > REVEAL_START) {
          const tr = (t - REVEAL_START) / (REVEAL_END - REVEAL_START); // 0..1
          for (const p of incoming) {
            // Particle hasn't appeared yet
            if (tr < p.appear) continue;
            const local = (tr - p.appear) / Math.max(0.01, 1 - p.appear);
            // Fall from a bit above its resting y, ease into place,
            // then fade out so the page reads cleanly.
            const ease = 1 - Math.pow(1 - local, 2.2);
            const yOff = (1 - ease) * (-30 - p.seed * 80);
            const x = p.x;
            const y = p.y + yOff;
            // Alpha: fade in then back out across local 0..1
            const a = Math.sin(local * Math.PI) * (0.5 + p.seed * 0.4);
            if (a < 0.04) continue;
            const shade = darkMode
              ? Math.round(120 + p.seed * 100)
              : Math.round(150 - p.seed * 110);
            ctx.font = `${p.size}px ui-monospace, "SF Mono", Menlo, monospace`;
            ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade - 4}, ${a})`;
            ctx.fillText(p.ch, x, y);
          }
        }

        // Trigger navigation right at the moment the burn finishes.
        if (!pushed && t >= BURN_END) {
          pushed = true;
          router.push(fullPath);
        }

        if (t < 1) {
          raf = requestAnimationFrame(draw);
        } else {
          canvas.remove();
        }
      };
      raf = requestAnimationFrame(draw);

      // Safety net
      window.setTimeout(() => {
        cancelAnimationFrame(raf);
        if (canvas.isConnected) canvas.remove();
        if (!pushed) {
          pushed = true;
          router.push(fullPath);
        }
      }, TOTAL_MS + 400);
    };

    document.addEventListener('click', onClick, { capture: true });
    return () =>
      document.removeEventListener(
        'click',
        onClick,
        { capture: true } as EventListenerOptions
      );
  }, [router]);

  return null;
}
