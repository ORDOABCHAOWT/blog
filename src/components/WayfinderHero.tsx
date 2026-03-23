'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const SIZE = 480;

type FrameState = {
  time: number;
  x: number;
  y: number;
};

type Point = {
  x: number;
  y: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pointPath(
  count: number,
  getPoint: (index: number) => Point
) {
  let path = '';

  for (let index = 0; index < count; index += 1) {
    const point = getPoint(index);
    path += `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)} ${point.y.toFixed(2)} `;
  }

  return path.trim();
}

export default function WayfinderHero({
  activeIndex = null,
}: {
  activeIndex?: number | null;
}) {
  const [frame, setFrame] = useState<FrameState>({
    time: 0,
    x: 0,
    y: 0,
  });
  const pointerTarget = useRef({ x: 0, y: 0 });
  const pointerCurrent = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const startedAt = performance.now();
    let rafId = 0;

    const animate = (now: number) => {
      const elapsed = (now - startedAt) / 1000;
      pointerCurrent.current.x +=
        (pointerTarget.current.x - pointerCurrent.current.x) * 0.055;
      pointerCurrent.current.y +=
        (pointerTarget.current.y - pointerCurrent.current.y) * 0.055;

      setFrame({
        time: elapsed,
        x: pointerCurrent.current.x,
        y: pointerCurrent.current.y,
      });

      rafId = window.requestAnimationFrame(animate);
    };

    rafId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  const ripples = useMemo(() => {
    const normalizedIndex =
      activeIndex && activeIndex > 0 ? ((activeIndex - 1) % 12) / 11 : 0.42;
    const centerX = SIZE * (0.52 + frame.x * 0.08 + (normalizedIndex - 0.5) * 0.04);
    const centerY = SIZE * (0.49 + frame.y * 0.06);

    return Array.from({ length: 18 }, (_, layer) => {
      const baseY = 74 + layer * 18;
      const amplitude = 3.8 + layer * 0.44;
      const frequency = 0.013 + layer * 0.00035;
      const speed = 0.26 + layer * 0.02;
      const pull = 8 + layer * 1.35;

      return pointPath(64, (step) => {
        const t = step / 63;
        const x = SIZE * t;
        const distance = x - centerX;
        const influence = Math.exp(-(distance * distance) / 16000);
        const primary =
          Math.sin(x * frequency + frame.time * speed + layer * 0.42) *
          amplitude;
        const secondary =
          Math.cos(x * (frequency * 0.55) - frame.time * (speed * 0.68) + layer * 0.2) *
          (1.9 + layer * 0.12);
        const tide =
          influence *
          (Math.sin(frame.time * 0.95 + x * 0.016 + layer * 0.48) * pull -
            (centerY - baseY) * 0.08 +
            frame.x * 14 -
            frame.y * 10);

        return {
          x,
          y: baseY + primary + secondary + tide,
        };
      });
    });
  }, [activeIndex, frame.time, frame.x, frame.y]);

  return (
    <div
      className="wayfinder-hero"
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
        const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;

        pointerTarget.current = {
          x: clamp(x, -1, 1),
          y: clamp(y, -1, 1),
        };
      }}
      onPointerLeave={() => {
        pointerTarget.current = { x: 0, y: 0 };
      }}
      aria-hidden="true"
    >
      <svg
        className="wayfinder-hero__svg"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        fill="none"
        role="presentation"
      >
        <g className="wayfinder-hero__ripples">
          {ripples.map((path, index) => (
            <path key={`ripple-${index}`} d={path} />
          ))}
        </g>
      </svg>
    </div>
  );
}
