'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const SIZE = 480;
const TAU = Math.PI * 2;

type FrameState = {
  time: number;
  x: number;
  y: number;
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
    const centerX = 264 + frame.x * 42 + (normalizedIndex - 0.5) * 26;
    const centerY = 244 + frame.y * 18 + Math.sin(frame.time * 0.38) * 6;
    const tilt = frame.x * 22;
    const swell = frame.y * 16;
    const rotation = frame.time * (0.15 + normalizedIndex * 0.04);

    const gravityLines = Array.from({ length: 20 }, (_, layer) => {
      const baseY = 78 + layer * 16.5;
      const amplitude = 4.8 + layer * 0.58;
      const frequency = 0.012 + layer * 0.0007;
      const sinkDepth = 18 + layer * 1.9;

      return pointPath(68, (step) => {
        const t = step / 67;
        const x = SIZE * t;
        const distance = x - centerX;
        const well = Math.exp(-(distance * distance) / (13000 + layer * 900));
        const wave =
          Math.sin(x * frequency + frame.time * (0.9 + layer * 0.03) + layer * 0.64) *
            amplitude +
          Math.cos(x * (frequency * 0.54) - frame.time * (0.52 + layer * 0.02)) *
            (2.8 + layer * 0.22);
        const draw =
          well *
          (sinkDepth +
            Math.sin(frame.time * 1.12 + layer * 0.6 + x * 0.01) * (5 + layer * 0.18) +
            tilt * 0.22 -
            swell * 0.3);

        return {
          x,
          y: baseY + wave + draw,
        };
      });
    });

    const orbitPaths = Array.from({ length: 14 }, (_, orbitIndex) => {
      const turns = 1.45 + orbitIndex * 0.06;
      const spread = 18 + orbitIndex * 8.5;
      const flatten = 0.58 + orbitIndex * 0.015;
      const localRotation = rotation + orbitIndex * 0.16;

      return pointPath(84, (step) => {
        const t = step / 83;
        const theta = -Math.PI * turns + t * TAU * turns;
        const radius =
          24 +
          spread * t +
          Math.sin(theta * 3 + frame.time * 1.2 + orbitIndex) * 3.2 +
          Math.cos(theta * 1.5 - frame.time * 0.9) * 2.2;
        const x =
          centerX +
          Math.cos(theta + localRotation) * radius +
          Math.sin(theta * 0.7 + frame.time + orbitIndex) * 6 +
          frame.x * (18 - orbitIndex);
        const y =
          centerY +
          Math.sin(theta + localRotation) * radius * flatten +
          Math.cos(theta * 2.1 + frame.time * 0.8) * 5 +
          frame.y * (8 - orbitIndex * 0.35);

        return { x, y };
      });
    });

    const wellContours = Array.from({ length: 8 }, (_, index) => {
      const radiusX = 38 + index * 16 + normalizedIndex * 8;
      const radiusY = 18 + index * 8;
      const localRotation = rotation * 0.8 + index * 0.1;

      return pointPath(72, (step) => {
        const t = step / 71;
        const angle = t * TAU;
        const ripple =
          Math.sin(angle * 4 + frame.time * 0.95 + index) * 2.6 +
          Math.cos(angle * 2 - frame.time * 0.55 + index) * 1.4;

        return {
          x:
            centerX +
            Math.cos(angle + localRotation) * (radiusX + ripple) +
            Math.sin(frame.time * 0.4 + index) * 2.4,
          y:
            centerY +
            Math.sin(angle + localRotation) * (radiusY + ripple * 0.65) +
            Math.cos(angle * 3 + frame.time * 0.7) * 1.8,
        };
      });
    });

    const stars = Array.from({ length: 340 }, (_, index) => {
      const arm = index % 5;
      const band = Math.floor(index / 5);
      const baseRadius =
        16 +
        band * 2.15 +
        noise(index + normalizedIndex * 19) * 18 +
        arm * 5;
      const angle =
        arm * (TAU / 5) +
        baseRadius * 0.08 +
        rotation * (1.8 + arm * 0.22) +
        noise(index * 1.7) * 0.8;
      const spiralDrift = Math.sin(frame.time * 0.92 + index * 0.12) * 5;
      const x =
        centerX +
        Math.cos(angle) * (baseRadius + spiralDrift) * 1.08 +
        Math.sin(frame.time * 0.6 + band) * 4 +
        frame.x * (14 - arm * 1.6);
      const y =
        centerY +
        Math.sin(angle) * (baseRadius + spiralDrift) * 0.56 +
        Math.cos(frame.time * 0.5 + arm + band * 0.08) * 5 +
        frame.y * (10 - arm);

      return {
        x,
        y,
        r: 0.45 + (index % 7) * 0.12,
        opacity: clamp(0.08 + band * 0.008 - arm * 0.01, 0.08, 0.34),
      };
    });

    const dustBands = Array.from({ length: 6 }, (_, index) => {
      const height = 148 + index * 26;
      return pointPath(52, (step) => {
        const t = step / 51;
        const x = SIZE * t;
        const distance = x - centerX;
        const influence = Math.exp(-(distance * distance) / 16000);

        return {
          x,
          y:
            height +
            Math.sin(x * 0.01 + frame.time * 0.26 + index * 0.5) * (4 + index) -
            influence * (8 + index * 2.5) +
            Math.cos(x * 0.021 - frame.time * 0.18) * 2.4,
        };
      });
    });

    return {
      gravityLines,
      orbitPaths,
      wellContours,
      stars,
      dustBands,
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
        <g className="wayfinder-hero__dust">
          {scene.dustBands.map((path, index) => (
            <path key={`dust-${index}`} d={path} />
          ))}
        </g>

        <g className="wayfinder-hero__gravity">
          {scene.gravityLines.map((path, index) => (
            <path key={`gravity-${index}`} d={path} />
          ))}
        </g>

        <g className="wayfinder-hero__contours">
          {scene.wellContours.map((path, index) => (
            <path key={`contour-${index}`} d={path} />
          ))}
        </g>

        <g className="wayfinder-hero__orbits">
          {scene.orbitPaths.map((path, index) => (
            <path key={`orbit-${index}`} d={path} />
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
