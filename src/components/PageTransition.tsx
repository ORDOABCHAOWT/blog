'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Grayscale 0/1 ash route transition.
 *
 * Internal links burn away from the clicked row. The burned part is covered
 * by the page's own background while grey 0/1 ash lifts off the two burn
 * edges. No color tint, no radial bloom.
 */
const TOTAL_MS = 1120;
const NAV_AT = 0.68;
const REVEAL_START = 0.72;
const BURN_BAND = 92;
const ASH_GLYPH_COUNT = 360;
const GREY_ASH = {
  light: { r: 72, g: 72, b: 68 },
  dark: { r: 198, g: 198, b: 190 },
};

type AshGlyph = {
  x: number;
  y: number;
  ch: '0' | '1';
  size: number;
  seed: number;
  sway: number;
  lift: number;
  delay: number;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const easeInOutCubic = (value: number) => {
  const t = clamp01(value);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
const easeOutCubic = (value: number) => 1 - Math.pow(1 - clamp01(value), 3);

function rgba(color: { r: number; g: number; b: number }, alpha: number) {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}

function copyBodyBackground(target: HTMLElement) {
  const bodyStyle = getComputedStyle(document.body);
  target.style.backgroundColor = bodyStyle.backgroundColor;
  target.style.backgroundImage = bodyStyle.backgroundImage;
  target.style.backgroundPosition = bodyStyle.backgroundPosition;
  target.style.backgroundSize = bodyStyle.backgroundSize;
  target.style.backgroundRepeat = bodyStyle.backgroundRepeat;
  target.style.backgroundAttachment = 'fixed';
}

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

      if (document.querySelector('.page-dust-overlay')) return;

      const w = window.innerWidth;
      const h = window.innerHeight;
      const linkRect = anchor.getBoundingClientRect();
      const originY = Math.max(
        0,
        Math.min(h, event.clientY || linkRect.top + linkRect.height * 0.5)
      );
      const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const ashColor = darkMode ? GREY_ASH.dark : GREY_ASH.light;

      const overlay = document.createElement('div');
      overlay.className = 'page-dust-overlay';
      copyBodyBackground(overlay);
      overlay.style.clipPath = `inset(${originY}px 0 ${Math.max(0, h - originY)}px 0)`;

      const canvas = document.createElement('canvas');
      canvas.className = 'page-dust-canvas';
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      overlay.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        router.push(fullPath);
        return;
      }
      ctx.scale(dpr, dpr);
      document.body.appendChild(overlay);

      const glyphs: AshGlyph[] = Array.from({ length: ASH_GLYPH_COUNT }, () => {
        const seed = Math.random();

        return {
          x: Math.random() * w,
          y: Math.random() * h,
          ch: Math.random() > 0.5 ? '1' : '0',
          size: 9 + seed * 5,
          seed,
          sway: (Math.random() - 0.5) * 24,
          lift: 34 + Math.random() * 76,
          delay: Math.random() * 0.12,
        };
      });

      const start = performance.now();
      let pushed = false;
      let raf = 0;

      const draw = (now: number) => {
        const t = (now - start) / TOTAL_MS;
        const burn = easeInOutCubic(t / NAV_AT);
        const reveal =
          t < REVEAL_START ? 0 : easeOutCubic((t - REVEAL_START) / (1 - REVEAL_START));
        const overlayAlpha = 1 - reveal;
        const topEdge = originY - burn * (originY + BURN_BAND);
        const bottomEdge = originY + burn * (h - originY + BURN_BAND);
        const clipTop = Math.max(0, topEdge);
        const clipBottom = Math.max(0, h - bottomEdge);

        overlay.style.clipPath = `inset(${clipTop}px 0 ${clipBottom}px 0)`;
        overlay.style.opacity = `${overlayAlpha}`;

        ctx.clearRect(0, 0, w, h);
        ctx.save();
        ctx.globalAlpha = overlayAlpha;

        const edgeAlpha = Math.sin(clamp01(burn) * Math.PI) * 0.18;
        if (edgeAlpha > 0.01) {
          const topGradient = ctx.createLinearGradient(0, topEdge - BURN_BAND, 0, topEdge + 8);
          topGradient.addColorStop(0, rgba(ashColor, 0));
          topGradient.addColorStop(0.76, rgba(ashColor, edgeAlpha));
          topGradient.addColorStop(1, rgba(ashColor, 0));
          ctx.fillStyle = topGradient;
          ctx.fillRect(0, topEdge - BURN_BAND, w, BURN_BAND + 12);

          const bottomGradient = ctx.createLinearGradient(0, bottomEdge - 8, 0, bottomEdge + BURN_BAND);
          bottomGradient.addColorStop(0, rgba(ashColor, 0));
          bottomGradient.addColorStop(0.24, rgba(ashColor, edgeAlpha));
          bottomGradient.addColorStop(1, rgba(ashColor, 0));
          ctx.fillStyle = bottomGradient;
          ctx.fillRect(0, bottomEdge - 8, w, BURN_BAND + 12);
        }

        for (const glyph of glyphs) {
          const travel =
            glyph.y < originY
              ? (originY - glyph.y) / Math.max(1, originY + BURN_BAND)
              : (glyph.y - originY) / Math.max(1, h - originY + BURN_BAND);
          const life = (burn - travel - glyph.delay) / 0.28;
          if (life <= 0 || life >= 1) continue;

          const flicker = Math.sin((life + glyph.seed) * Math.PI * 2) * 0.5 + 0.5;
          const alpha = Math.sin(life * Math.PI) * (0.24 + glyph.seed * 0.42);
          if (alpha < 0.025) continue;

          const lift = easeOutCubic(life) * glyph.lift;
          const x =
            glyph.x +
            Math.sin(life * 5 + glyph.seed * 9) * glyph.sway +
            (glyph.seed - 0.5) * life * 18;
          const y = glyph.y - lift;
          if (x < -20 || x > w + 20 || y < -20 || y > h + 20) continue;

          const size = glyph.size * (1 - life * 0.32);
          const ashAlpha = alpha * (0.82 + flicker * 0.18);
          ctx.font = `${size}px ui-monospace, "SF Mono", Menlo, monospace`;
          ctx.fillStyle = rgba(ashColor, ashAlpha);
          ctx.fillText(glyph.ch, x, y);
        }

        ctx.restore();

        if (!pushed && t >= NAV_AT) {
          pushed = true;
          router.push(fullPath);
        }

        if (t < 1) {
          raf = requestAnimationFrame(draw);
        } else {
          overlay.remove();
        }
      };

      raf = requestAnimationFrame(draw);

      window.setTimeout(() => {
        cancelAnimationFrame(raf);
        if (overlay.isConnected) overlay.remove();
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
