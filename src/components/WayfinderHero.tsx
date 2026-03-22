'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const SIZE = 480;
const TAU = Math.PI * 2;

type FrameState = {
  time: number;
  x: number;
  y: number;
};

type FractalSegment = {
  d: string;
  opacity: number;
  width: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pointPath(
  count: number,
  getPoint: (index: number) => { x: number; y: number }
) {
  let path = '';

  for (let index = 0; index < count; index += 1) {
    const point = getPoint(index);
    path += `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)} ${point.y.toFixed(2)} `;
  }

  return path.trim();
}

function noise(seed: number) {
  const value = Math.sin(seed * 91.221 + 19.73) * 43758.5453;
  return value - Math.floor(value);
}

function buildFractalBranch(
  segments: FractalSegment[],
  x: number,
  y: number,
  length: number,
  angle: number,
  depth: number,
  spread: number,
  bend: number,
  time: number,
  driftX: number,
  driftY: number,
  family: number
) {
  if (depth <= 0 || length < 12) {
    return;
  }

  const pulse = Math.sin(time * 0.8 + family * 0.9 + depth * 0.7);
  const curve = bend * (0.7 + depth * 0.08) + pulse * 0.18;
  const controlX =
    x +
    Math.cos(angle - curve * 0.55) * length * 0.56 +
    driftX * depth * 2.8;
  const controlY =
    y +
    Math.sin(angle + curve * 0.35) * length * 0.44 +
    pulse * 9 +
    driftY * depth * 2.1;
  const nextX = x + Math.cos(angle + pulse * 0.08) * length;
  const nextY = y + Math.sin(angle + pulse * 0.08) * length;

  segments.push({
    d: `M${x.toFixed(2)} ${y.toFixed(2)} Q${controlX.toFixed(2)} ${controlY.toFixed(2)} ${nextX.toFixed(2)} ${nextY.toFixed(2)}`,
    opacity: clamp(0.38 - depth * 0.04, 0.12, 0.34),
    width: 0.9 + depth * 0.12,
  });

  const childLength = length * (0.72 - depth * 0.015);
  const childSpread = spread * (0.92 + depth * 0.035);
  const nextBend = bend * 0.78;
  const sway = Math.sin(time * 0.62 + family + depth) * 0.08;

  buildFractalBranch(
    segments,
    nextX,
    nextY,
    childLength,
    angle - childSpread + sway,
    depth - 1,
    spread,
    nextBend,
    time,
    driftX,
    driftY,
    family
  );

  buildFractalBranch(
    segments,
    nextX,
    nextY,
    childLength,
    angle + childSpread - sway,
    depth - 1,
    spread,
    nextBend,
    time,
    driftX,
    driftY,
    family
  );
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
        (pointerTarget.current.x - pointerCurrent.current.x) * 0.06;
      pointerCurrent.current.y +=
        (pointerTarget.current.y - pointerCurrent.current.y) * 0.06;

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
    const centerX = 244 + frame.x * 34 + (normalizedIndex - 0.5) * 16;
    const centerY = 234 + frame.y * 18 + Math.sin(frame.time * 0.32) * 6;
    const spread = 0.44 + normalizedIndex * 0.08 + frame.x * 0.08;
    const fieldLines = Array.from({ length: 8 }, (_, index) => {
      const baseY = 96 + index * 34;
      return pointPath(52, (step) => {
        const t = step / 51;
        const x = SIZE * t;
        const distance = x - centerX;
        const influence = Math.exp(-(distance * distance) / 22000);

        return {
          x,
          y:
            baseY +
            Math.sin(x * 0.011 + frame.time * 0.32 + index * 0.55) * (3.5 + index * 0.8) -
            influence * (10 + index * 1.6) +
            Math.cos(x * 0.018 - frame.time * 0.18 + index) * 1.9,
        };
      });
    });

    const contourLoops = Array.from({ length: 6 }, (_, index) => {
      const radiusX = 28 + index * 20 + normalizedIndex * 10;
      const radiusY = 18 + index * 11;
      const localRotation = frame.time * 0.12 + index * 0.07;

      return pointPath(64, (step) => {
        const t = step / 63;
        const angle = t * TAU;
        const ripple =
          Math.sin(angle * 3 + frame.time * 0.75 + index) * 2.2 +
          Math.cos(angle * 2 - frame.time * 0.44 + index) * 1.4;

        return {
          x:
            centerX +
            Math.cos(angle + localRotation) * (radiusX + ripple) +
            frame.x * (8 - index * 0.4),
          y:
            centerY +
            Math.sin(angle + localRotation) * (radiusY + ripple * 0.75) +
            frame.y * (6 - index * 0.3),
        };
      });
    });

    const fractalSegments: FractalSegment[] = [];
    const familyCount = 5;

    for (let family = 0; family < familyCount; family += 1) {
      const baseAngle =
        -Math.PI / 2 +
        (family * TAU) / familyCount +
        Math.sin(frame.time * 0.22 + family) * 0.08;

      buildFractalBranch(
        fractalSegments,
        centerX,
        centerY,
        92 + family * 4 + normalizedIndex * 12,
        baseAngle,
        4,
        spread,
        0.36 + family * 0.04,
        frame.time,
        frame.x,
        frame.y,
        family
      );
    }

    const stars = Array.from({ length: 112 }, (_, index) => {
      const band = Math.floor(index / 14);
      const offset = index % 14;
      const radius = 26 + band * 18 + noise(index + normalizedIndex * 9) * 12;
      const angle =
        (offset / 14) * TAU +
        frame.time * (0.1 + band * 0.015) +
        band * 0.45;

      return {
        x:
          centerX +
          Math.cos(angle) * radius +
          Math.sin(frame.time * 0.4 + band + offset) * 4,
        y:
          centerY +
          Math.sin(angle) * radius * 0.72 +
          Math.cos(frame.time * 0.34 + offset) * 3,
        r: 0.45 + (index % 5) * 0.12,
        opacity: clamp(0.08 + band * 0.02, 0.08, 0.22),
      };
    });

    return {
      fieldLines,
      contourLoops,
      fractalSegments,
      stars,
    };
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
        <g className="wayfinder-hero__field">
          {scene.fieldLines.map((path, index) => (
            <path key={`field-${index}`} d={path} />
          ))}
        </g>

        <g className="wayfinder-hero__contours">
          {scene.contourLoops.map((path, index) => (
            <path key={`contour-${index}`} d={path} />
          ))}
        </g>

        <g className="wayfinder-hero__fractal">
          {scene.fractalSegments.map((segment, index) => (
            <path
              key={`fractal-${index}`}
              d={segment.d}
              style={{
                opacity: segment.opacity,
                strokeWidth: segment.width,
              }}
            />
          ))}
        </g>

        <g className="wayfinder-hero__stars">
          {scene.stars.map((star, index) => (
            <circle
              key={`star-${index}`}
              cx={star.x}
              cy={star.y}
              r={star.r}
              style={{ opacity: star.opacity }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
