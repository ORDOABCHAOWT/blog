'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const SIZE = 560;
const ROWS = 20;
const COLUMNS = 46;
const FRAME_INTERVAL = 1000 / 30;

type FrameState = {
  time: number;
  x: number;
  y: number;
};

type WaveDigit = {
  x: number;
  y: number;
  value: '0' | '1';
  opacity: number;
  scale: number;
  tone: 'soft' | 'accent';
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function WayfinderHero({
  activeIndex = null,
}: {
  activeIndex?: number | null;
}) {
  const [frame, setFrame] = useState<FrameState>({ time: 0, x: 0, y: 0 });
  const [pointerActive, setPointerActive] = useState(false);
  const pointerTarget = useRef({ x: 0, y: 0 });
  const pointerCurrent = useRef({ x: 0, y: 0 });
  const lastCommittedAt = useRef(0);

  useEffect(() => {
    const startedAt = performance.now();
    let rafId = 0;

    const animate = (now: number) => {
      pointerCurrent.current.x +=
        (pointerTarget.current.x - pointerCurrent.current.x) * 0.085;
      pointerCurrent.current.y +=
        (pointerTarget.current.y - pointerCurrent.current.y) * 0.085;

      if (now - lastCommittedAt.current >= FRAME_INTERVAL) {
        lastCommittedAt.current = now;
        setFrame({
          time: (now - startedAt) / 1000,
          x: pointerCurrent.current.x,
          y: pointerCurrent.current.y,
        });
      }

      rafId = window.requestAnimationFrame(animate);
    };

    rafId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  const digits = useMemo(() => {
    const normalizedIndex =
      activeIndex && activeIndex > 0 ? ((activeIndex - 1) % 12) / 11 : 0.38;
    const pointerX = SIZE * (0.5 + frame.x * 0.5);
    const pointerY = SIZE * (0.5 + frame.y * 0.5);

    return Array.from({ length: ROWS }, (_, row) => {
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

      return Array.from({ length: COLUMNS }, (_, column) => {
        const columnProgress = column / (COLUMNS - 1);
        const baseX = 14 + columnProgress * (SIZE - 28);
        const primary = Math.sin(column * frequency + frame.time * speed + rowPhase);
        const secondary = Math.cos(
          column * (frequency * 0.62) - frame.time * (speed * 0.72) + row * 0.41
        );
        const longWave = Math.sin(
          columnProgress * Math.PI * 3.4 - frame.time * 0.55 + normalizedIndex * Math.PI
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
          pointerActive && distance < radius
            ? Math.pow(1 - distance / radius, 1.65)
            : 0;
        const ripple =
          Math.sin(distance * 0.11 - frame.time * 4.8 + row * 0.55) *
          influence *
          18;
        const driftX =
          Math.cos(frame.time * 2.1 + row * 0.42 + column * 0.18) *
          influence *
          5.2;
        const pushX =
          (dx / (distance + 28)) *
          influence *
          34;
        const pushY =
          (dy / (distance + 28)) *
          influence *
          26;
        const swirlX =
          (-dy / (distance + 28)) *
          influence *
          8;
        const swirlY =
          (dx / (distance + 28)) *
          influence *
          8;

        x += driftX + pushX + swirlX;
        y += ripple + pushY + swirlY;
        const crest = (primary + 1) / 2;
        const shimmer = (Math.sin(frame.time * 2.4 + column * 0.35 + row * 0.8) + 1) / 2;
        const opacity = clamp(
          0.28 + crest * 0.34 + shimmer * 0.18 + influence * 0.12,
          0.28,
          0.92
        );
        const scale = 0.92 + crest * 0.32 + shimmer * 0.08 + influence * 0.12;
        const value = (row + column + Math.round(frame.time * 3)) % 2 === 0 ? '0' : '1';
        const tone =
          crest > 0.72 || shimmer > 0.76 || influence > 0.34 ? 'accent' : 'soft';

        return {
          x,
          y,
          value,
          opacity,
          scale,
          tone,
        };
      });
    }).flat();
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
        preserveAspectRatio="none"
      >
        <g className="wayfinder-hero__digit-wave">
          {digits.map((digit, index) => (
            <text
              key={`wave-digit-${index}`}
              className={
                digit.tone === 'accent'
                  ? 'wayfinder-hero__wave-digit wayfinder-hero__wave-digit--accent'
                  : 'wayfinder-hero__wave-digit'
              }
              x={digit.x}
              y={digit.y}
              style={{
                opacity: digit.opacity,
                transform: `scale(${digit.scale})`,
                transformOrigin: `${digit.x}px ${digit.y}px`,
              }}
            >
              {digit.value}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
}
