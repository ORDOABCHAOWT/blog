'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Page-to-page transition: dissolve the current page into a cloud of
 * drifting 0s and 1s, navigate beneath, then re-coalesce on the new
 * page.  Visual language matches the ASCII hero so the whole site
 * reads as the same instrument.
 *
 * Implementation:
 *   1. Click capture catches internal navigation.
 *   2. We mount a full-viewport <canvas> that draws ~480 0/1 particles
 *      sized to the viewport; particles begin densely covering the
 *      page (alpha 0 → 0.85) then drift outward and fade.
 *   3. router.push() runs in parallel so the new route mounts beneath
 *      the canvas while the dust is in the air.
 *   4. After ~360ms the particles reverse — they brighten from 0 → ~0.7
 *      while drifting back toward their origin, then fade to 0 to
 *      reveal the new page.
 *   5. Canvas is removed on completion (~900ms total).
 *
 * Falls back to plain navigation when prefers-reduced-motion is set or
 * the click target opens a new tab / external link.
 */
const TOTAL_MS = 900;
const FADE_OUT_END = 0.42; // 0..1 of total duration
const FADE_IN_START = 0.5;
const PARTICLE_DENSITY = 1 / 1500; // particles per viewport px²

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

      // Build the dust canvas.
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

      // Build particles. Each one starts at a "home" position spread
      // across the viewport with a random outward drift vector.
      const count = Math.round(w * h * PARTICLE_DENSITY);
      type Particle = {
        x0: number;
        y0: number;
        dx: number;
        dy: number;
        ch: '0' | '1';
        size: number;
        rotSpeed: number;
        seed: number;
      };
      const particles: Particle[] = [];
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 60 + Math.random() * 220;
        particles.push({
          x0: Math.random() * w,
          y0: Math.random() * h,
          dx: Math.cos(angle) * speed,
          dy: Math.sin(angle) * speed - 30, // bias upward
          ch: Math.random() > 0.5 ? '1' : '0',
          size: 9 + Math.random() * 7,
          rotSpeed: (Math.random() - 0.5) * 1.2,
          seed: Math.random(),
        });
      }

      const start = performance.now();
      let pushed = false;
      let raf = 0;

      // Dark mode? read body color.
      const darkMode =
        window.matchMedia('(prefers-color-scheme: dark)').matches;

      const draw = (now: number) => {
        const t = (now - start) / TOTAL_MS; // 0..1
        ctx.clearRect(0, 0, w, h);

        // ---- alpha envelope ----
        // Old page dust:   1 -> 0   over [0, FADE_OUT_END]
        // New page dust:   0 -> peak -> 0 over [FADE_IN_START, 1]
        const outAlpha = t < FADE_OUT_END
          ? Math.pow(1 - t / FADE_OUT_END, 1.3)
          : 0;
        const inAlpha = t > FADE_IN_START
          ? (() => {
              const k = (t - FADE_IN_START) / (1 - FADE_IN_START);
              // Peaks at k=0.4, fades back to 0 at k=1.
              return Math.sin(k * Math.PI) * 0.85;
            })()
          : 0;

        // Draw outgoing particles (drifting outward)
        if (outAlpha > 0.02) {
          for (const p of particles) {
            const k = t / FADE_OUT_END; // 0..1 within fade-out window
            const x = p.x0 + p.dx * k;
            const y = p.y0 + p.dy * k + 40 * k * k; // gentle gravity
            const a = outAlpha * (0.55 + p.seed * 0.45);
            const shade = darkMode
              ? Math.round(80 + p.seed * 130)
              : Math.round(170 - p.seed * 120);
            ctx.font = `${p.size}px ui-monospace, "SF Mono", Menlo, monospace`;
            ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade - 4}, ${a})`;
            ctx.fillText(p.ch, x, y);
          }
        }

        // Draw incoming particles (drifting inward + fading in/out)
        if (inAlpha > 0.02) {
          for (const p of particles) {
            const k = (t - FADE_IN_START) / (1 - FADE_IN_START); // 0..1
            // Start far from home, slide back toward home as k -> 1
            const ease = 1 - Math.pow(1 - k, 2.4); // easeOutQuart-like
            const x = p.x0 + p.dx * 0.7 * (1 - ease);
            const y = p.y0 + p.dy * 0.7 * (1 - ease) - 20 * (1 - ease);
            const a = inAlpha * (0.5 + p.seed * 0.5);
            const shade = darkMode
              ? Math.round(110 + p.seed * 110)
              : Math.round(150 - p.seed * 110);
            ctx.font = `${p.size}px ui-monospace, "SF Mono", Menlo, monospace`;
            ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade - 4}, ${a})`;
            ctx.fillText(p.ch, x, y);
          }
        }

        // Trigger navigation right when the old dust has fully faded —
        // the new page mounts during the brief gap between fades.
        if (!pushed && t >= FADE_OUT_END) {
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

      // Safety cleanup if something goes wrong.
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
