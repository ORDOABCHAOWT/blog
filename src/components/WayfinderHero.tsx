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

type RippleLine = {
  path: string;
  points: Point[];
  opacity: number;
};

type BinaryGlyph = {
  x: number;
  y: number;
  value: '0' | '1';
  opacity: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pointsToPath(points: Point[]) {
  let path = '';

  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
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
  const [pointerActive, setPointerActive] = useState(false);
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

  const scene = useMemo(() => {
    const normalizedIndex =
      activeIndex && activeIndex > 0 ? ((activeIndex - 1) % 12) / 11 : 0.42;
    const centerX = SIZE * (0.52 + frame.x * 0.08 + (normalizedIndex - 0.5) * 0.04);
    const centerY = SIZE * (0.49 + frame.y * 0.06);
    const hoverX = ((frame.x + 1) / 2) * SIZE;
    const hoverY = ((frame.y + 1) / 2) * SIZE;
    const hoverRadius = 92;

    const lines: RippleLine[] = Array.from({ length: 72 }, (_, layer) => {
      const baseY = 24 + layer * 6.05;
      const amplitude = 1.45 + layer * 0.08;
      const frequency = 0.013 + layer * 0.00015;
      const speed = 0.22 + layer * 0.006;
      const pull = 3.2 + layer * 0.36;
      const points = Array.from({ length: 72 }, (_, step) => {
        const t = step / 71;
        const x = SIZE * t;
        const distance = x - centerX;
        const influence = Math.exp(-(distance * distance) / 16000);
        const primary =
          Math.sin(x * frequency + frame.time * speed + layer * 0.42) *
          amplitude;
        const secondary =
          Math.cos(
            x * (frequency * 0.55) - frame.time * (speed * 0.68) + layer * 0.2
          ) * (1.9 + layer * 0.12);
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

      const minDistance = pointerActive
        ? Math.min(
            ...points.map((point) =>
              Math.hypot(point.x - hoverX, point.y - hoverY)
            )
          )
        : hoverRadius * 2;
      const opacity = pointerActive
        ? clamp(0.32 + minDistance / (hoverRadius * 1.25), 0.32, 1)
        : 1;

      return {
        path: pointsToPath(points),
        points,
        opacity,
      };
    });

    const glyphs: BinaryGlyph[] = [];

    if (pointerActive) {
      lines.forEach((line, layer) => {
        line.points.forEach((point, step) => {
          if (step % 3 !== 0) {
            return;
          }

          const distance = Math.hypot(point.x - hoverX, point.y - hoverY);
          if (distance > hoverRadius) {
            return;
          }

          const opacity = clamp(1 - distance / hoverRadius, 0.18, 0.94);
          glyphs.push({
            x: point.x,
            y: point.y,
            value:
              (layer + step + Math.floor(frame.time * 8)) % 2 === 0 ? '0' : '1',
            opacity,
          });
        });
      });
    }

    return {
      lines,
      glyphs,
    };
  }, [activeIndex, frame.time, frame.x, frame.y, pointerActive]);

  return (
    <div
      className="wayfinder-hero"
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
        const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;

        setPointerActive(true);
        pointerTarget.current = {
          x: clamp(x, -1, 1),
          y: clamp(y, -1, 1),
        };
      }}
      onPointerLeave={() => {
        setPointerActive(false);
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
          {scene.lines.map((line, index) => (
            <path
              key={`ripple-${index}`}
              d={line.path}
              style={{ opacity: line.opacity }}
            />
          ))}
        </g>

        <g className="wayfinder-hero__binary">
          {scene.glyphs.map((glyph, index) => (
            <text
              key={`binary-${index}`}
              x={glyph.x}
              y={glyph.y}
              style={{ opacity: glyph.opacity }}
            >
              {glyph.value}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
}
