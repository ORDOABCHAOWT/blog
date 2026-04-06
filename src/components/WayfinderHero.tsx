'use client';

import { useEffect, useMemo, useState } from 'react';

const SIZE = 480;
const ROWS = 16;
const COLUMNS = 34;

type FrameState = {
  time: number;
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
  const [frame, setFrame] = useState<FrameState>({ time: 0 });

  useEffect(() => {
    const startedAt = performance.now();
    let rafId = 0;

    const animate = (now: number) => {
      setFrame({
        time: (now - startedAt) / 1000,
      });

      rafId = window.requestAnimationFrame(animate);
    };

    rafId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  const digits = useMemo(() => {
    const normalizedIndex =
      activeIndex && activeIndex > 0 ? ((activeIndex - 1) % 12) / 11 : 0.38;

    return Array.from({ length: ROWS }, (_, row) => {
      const rowProgress = row / (ROWS - 1);
      const baseY = 46 + rowProgress * (SIZE - 92);
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
        const x = 22 + columnProgress * (SIZE - 44);
        const primary = Math.sin(column * frequency + frame.time * speed + rowPhase);
        const secondary = Math.cos(
          column * (frequency * 0.62) - frame.time * (speed * 0.72) + row * 0.41
        );
        const longWave = Math.sin(
          columnProgress * Math.PI * 3.4 - frame.time * 0.55 + normalizedIndex * Math.PI
        );
        const y =
          baseY +
          primary * amplitude +
          secondary * secondaryAmplitude +
          longWave * 18;
        const crest = (primary + 1) / 2;
        const shimmer = (Math.sin(frame.time * 2.4 + column * 0.35 + row * 0.8) + 1) / 2;
        const opacity = clamp(0.28 + crest * 0.34 + shimmer * 0.18, 0.28, 0.88);
        const scale = 0.92 + crest * 0.32 + shimmer * 0.08;
        const value = (row + column + Math.round(frame.time * 3)) % 2 === 0 ? '0' : '1';
        const tone = crest > 0.72 || shimmer > 0.76 ? 'accent' : 'soft';

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
  }, [activeIndex, frame.time]);

  return (
    <div className="wayfinder-hero" aria-hidden="true">
      <svg
        className="wayfinder-hero__svg"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        fill="none"
        role="presentation"
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
