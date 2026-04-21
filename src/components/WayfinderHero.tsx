'use client';

import { memo, useEffect, useRef } from 'react';

const SIZE = 560;
const ROWS = 20;
const COLUMNS = 46;
const FRAME_INTERVAL = 1000 / 30;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function WayfinderHeroImpl({
  activeIndex = null,
}: {
  activeIndex?: number | null;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const groupRef = useRef<SVGGElement | null>(null);
  const nodesRef = useRef<SVGTextElement[]>([]);
  const pointerTarget = useRef({ x: 0, y: 0 });
  const pointerCurrent = useRef({ x: 0, y: 0 });
  const pointerActive = useRef(false);
  const activeIndexRef = useRef<number | null>(activeIndex);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  // Build the SVG nodes once, imperatively. This avoids React
  // reconciling 920 <text> elements on every animation frame, which
  // was the root cause of clicks on list items feeling slow.
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    const nodes: SVGTextElement[] = [];
    const svgNS = 'http://www.w3.org/2000/svg';

    // Clear anything left from a previous mount (e.g. HMR).
    while (group.firstChild) group.removeChild(group.firstChild);

    for (let i = 0; i < ROWS * COLUMNS; i += 1) {
      const text = document.createElementNS(svgNS, 'text');
      text.setAttribute('class', 'wayfinder-hero__wave-digit');
      group.appendChild(text);
      nodes.push(text);
    }
    nodesRef.current = nodes;

    return () => {
      nodesRef.current = [];
      while (group.firstChild) group.removeChild(group.firstChild);
    };
  }, []);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const startedAt =
      typeof performance !== 'undefined' ? performance.now() : Date.now();
    let rafId = 0;
    let lastCommittedAt = 0;

    const render = (now: number) => {
      pointerCurrent.current.x +=
        (pointerTarget.current.x - pointerCurrent.current.x) * 0.085;
      pointerCurrent.current.y +=
        (pointerTarget.current.y - pointerCurrent.current.y) * 0.085;

      if (now - lastCommittedAt >= FRAME_INTERVAL) {
        lastCommittedAt = now;
        const time = (now - startedAt) / 1000;
        const fx = pointerCurrent.current.x;
        const fy = pointerCurrent.current.y;
        const pointerOn = pointerActive.current;
        const ai = activeIndexRef.current;
        const normalizedIndex = ai && ai > 0 ? ((ai - 1) % 12) / 11 : 0.38;
        const pointerX = SIZE * (0.5 + fx * 0.5);
        const pointerY = SIZE * (0.5 + fy * 0.5);
        const nodes = nodesRef.current;

        for (let row = 0; row < ROWS; row += 1) {
          const rowProgress = row / (ROWS - 1);
          const baseY = 48 + rowProgress * (SIZE - 96);
          const amplitude =
            18 +
            Math.sin(rowProgress * Math.PI) * 34 +
            (1 - Math.abs(rowProgress - 0.5) * 2) * 16;
          const secondaryAmplitude = 8 + rowProgress * 10;
          const frequency = 0.2 + rowProgress * 0.06;
          const speed = 0.95 + rowProgress * 0.28;
          const rowPhase = row * 0.54 + normalizedIndex * 2.6;

          for (let column = 0; column < COLUMNS; column += 1) {
            const columnProgress = column / (COLUMNS - 1);
            const baseX = 14 + columnProgress * (SIZE - 28);
            const primary = Math.sin(
              column * frequency + time * speed + rowPhase
            );
            const secondary = Math.cos(
              column * (frequency * 0.62) - time * (speed * 0.72) + row * 0.41
            );
            const longWave = Math.sin(
              columnProgress * Math.PI * 3.4 -
                time * 0.55 +
                normalizedIndex * Math.PI
            );
            let y =
              baseY +
              primary * amplitude +
              secondary * secondaryAmplitude +
              longWave * 18;
            let x = baseX;
            const dx = baseX - pointerX;
            const dy = y - pointerY;
            const distance = Math.hypot(dx, dy);
            const radius = SIZE * 0.19;
            const influence =
              pointerOn && distance < radius
                ? Math.pow(1 - distance / radius, 1.65)
                : 0;
            const ripple =
              Math.sin(distance * 0.11 - time * 4.8 + row * 0.55) *
              influence *
              18;
            const driftX =
              Math.cos(time * 2.1 + row * 0.42 + column * 0.18) *
              influence *
              5.2;
            const pushX = (dx / (distance + 28)) * influence * 34;
            const pushY = (dy / (distance + 28)) * influence * 26;
            const swirlX = (-dy / (distance + 28)) * influence * 8;
            const swirlY = (dx / (distance + 28)) * influence * 8;

            x += driftX + pushX + swirlX;
            y += ripple + pushY + swirlY;

            const crest = (primary + 1) / 2;
            const shimmer =
              (Math.sin(time * 2.4 + column * 0.35 + row * 0.8) + 1) / 2;
            const opacity = clamp(
              0.28 + crest * 0.34 + shimmer * 0.18 + influence * 0.12,
              0.28,
              0.92
            );
            const scale =
              0.92 + crest * 0.32 + shimmer * 0.08 + influence * 0.12;
            const value =
              (row + column + Math.round(time * 3)) % 2 === 0 ? '0' : '1';
            const accent =
              crest > 0.72 || shimmer > 0.76 || influence > 0.34;

            const node = nodes[row * COLUMNS + column];
            if (!node) continue;

            node.setAttribute('x', x.toFixed(2));
            node.setAttribute('y', y.toFixed(2));
            node.setAttribute(
              'class',
              accent
                ? 'wayfinder-hero__wave-digit wayfinder-hero__wave-digit--accent'
                : 'wayfinder-hero__wave-digit'
            );
            // Use inline style for opacity/transform so it matches the
            // previous rendering output.
            const style = node.style;
            style.opacity = String(opacity);
            style.transform = `scale(${scale})`;
            style.transformOrigin = `${x.toFixed(2)}px ${y.toFixed(2)}px`;

            if (node.textContent !== value) {
              node.textContent = value;
            }
          }
        }
      }

      rafId = window.requestAnimationFrame(render);
    };

    if (prefersReducedMotion) {
      // Draw a single static frame and stop.
      render(startedAt);
      return () => {};
    }

    rafId = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  return (
    <div
      ref={containerRef}
      className="wayfinder-hero"
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const x =
          ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
        const y =
          ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;

        pointerActive.current = true;
        pointerTarget.current = {
          x: clamp(x, -1, 1),
          y: clamp(y, -1, 1),
        };
      }}
      onPointerLeave={() => {
        pointerActive.current = false;
        pointerTarget.current = { x: 0, y: 0 };
      }}
      aria-hidden="true"
    >
      <svg
        className="wayfinder-hero__svg"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        fill="none"
        role="presentation"
        preserveAspectRatio="none"
      >
        <g ref={groupRef} className="wayfinder-hero__digit-wave" />
      </svg>
    </div>
  );
}

// React.memo so that parent re-renders (e.g. when activeIndex changes in
// HomeExperience) don't reconcile the SVG subtree — we handle activeIndex
// imperatively via a ref.
const WayfinderHero = memo(WayfinderHeroImpl, (prev, next) => {
  return prev.activeIndex === next.activeIndex;
});

export default WayfinderHero;
