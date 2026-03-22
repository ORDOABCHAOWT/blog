'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const SIZE = 420;
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
        (pointerTarget.current.x - pointerCurrent.current.x) * 0.065;
      pointerCurrent.current.y +=
        (pointerTarget.current.y - pointerCurrent.current.y) * 0.065;

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
      activeIndex && activeIndex > 0 ? ((activeIndex - 1) % 12) / 11 : 0.36;
    const centerX = 222 + frame.x * 24 + (normalizedIndex - 0.5) * 20;
    const centerY = 208 + frame.y * 12 - Math.sin(frame.time * 0.55) * 5;
    const cityHeight = 110 + normalizedIndex * 26;
    const ringRadius = 62 + normalizedIndex * 18;
    const shear = frame.x * 14;
    const swell = frame.y * 10;

    const wavePaths = Array.from({ length: 12 }, (_, layer) => {
      const baseY = 146 + layer * 16;
      const amplitude = 7 + layer * 0.95;
      const speed = 0.24 + layer * 0.016;
      const frequency = 0.014 + layer * 0.0019;

      return pointPath(49, (step) => {
        const x = (SIZE / 48) * step;
        const xDelta = x - centerX;
        const influence = Math.exp(-(xDelta * xDelta) / 18000);
        const primary =
          Math.sin(x * frequency + frame.time * (1.2 + speed) + layer * 0.58) *
          amplitude;
        const secondary =
          Math.cos(x * (frequency * 0.64) - frame.time * (0.72 + speed) + layer) *
          (4.8 + layer * 0.45);
        const tide =
          Math.sin(frame.time * 0.82 + layer * 0.7 + x * 0.006) * 2.8;
        const lift =
          influence *
          (Math.sin(x * 0.03 - frame.time * 1.35 + layer) * (12 + layer * 1.1) +
            shear * 0.4 -
            swell * 0.55);

        return {
          x,
          y: baseY + primary + secondary + tide + lift,
        };
      });
    });

    const canopyPaths = Array.from({ length: 6 }, (_, layer) => {
      const radius = ringRadius + layer * 12;
      const height = 44 + layer * 8;
      return pointPath(44, (step) => {
        const t = step / 43;
        const angle = -Math.PI + t * Math.PI;
        const x =
          centerX +
          Math.cos(angle) * radius +
          Math.sin(frame.time * 0.72 + layer + t * 4) * 5 +
          frame.x * layer * 0.55;
        const y =
          centerY -
          16 -
          Math.sin(angle) * height +
          Math.cos(frame.time * 0.6 + t * 6 + layer) * 3;
        return { x, y };
      });
    });

    const orbitalRings = Array.from({ length: 3 }, (_, ringIndex) => {
      const radiusX = 42 + ringIndex * 18 + normalizedIndex * 8;
      const radiusY = 14 + ringIndex * 8;
      return pointPath(56, (step) => {
        const t = step / 55;
        const angle = t * TAU;
        const radialNoise =
          Math.sin(frame.time * 0.9 + ringIndex * 1.7 + angle * 3) * 2.1;

        return {
          x:
            centerX +
            Math.cos(angle + frame.time * 0.08 + ringIndex * 0.16) *
              (radiusX + radialNoise) +
            frame.x * 5,
          y:
            centerY -
            8 +
            Math.sin(angle) * (radiusY + radialNoise * 0.5) +
            Math.cos(angle * 2 + frame.time * 0.42) * 1.8,
        };
      });
    });

    const spires = Array.from({ length: 8 }, (_, index) => {
      const offset = (index - 3.5) * 16 + Math.sin(frame.time + index) * 2.4;
      const height =
        cityHeight -
        Math.abs(index - 3.5) * 13 +
        Math.sin(frame.time * 1.1 + index * 0.9) * 8;
      const x = centerX + offset + frame.x * index * 0.4;
      const topY = centerY - height * 0.52;
      const baseY = centerY + 54 + Math.cos(index + frame.time) * 3;

      return {
        shaft: `M${x.toFixed(2)} ${baseY.toFixed(2)} L${x.toFixed(2)} ${topY.toFixed(2)}`,
        leftBrace: `M${(x - 5).toFixed(2)} ${(baseY - 12).toFixed(2)} L${x.toFixed(2)} ${(topY + 18).toFixed(2)}`,
        rightBrace: `M${(x + 5).toFixed(2)} ${(baseY - 12).toFixed(2)} L${x.toFixed(2)} ${(topY + 18).toFixed(2)}`,
      };
    });

    const terraces = Array.from({ length: 5 }, (_, level) => {
      const width = 124 - level * 18 + normalizedIndex * 10;
      const height = 10 + level * 13;
      return pointPath(34, (step) => {
        const t = step / 33;
        const arc = Math.cos((t - 0.5) * Math.PI * 2) * 0.5 + 0.5;
        return {
          x:
            centerX -
            width / 2 +
            t * width +
            Math.sin(frame.time * 0.84 + level + t * 5) * 2,
          y:
            centerY +
            28 +
            level * 12 +
            arc * height +
            Math.cos(frame.time * 0.65 + t * 7 + level) * 1.6,
        };
      });
    });

    const particles = Array.from({ length: 164 }, (_, index) => {
      const column = index % 12;
      const band = Math.floor(index / 12);
      const radius = 18 + column * 8 + noise(index + normalizedIndex * 11) * 6;
      const spin = frame.time * (0.16 + column * 0.01) + band * 0.26;
      const angle = spin + noise(index * 2.1) * TAU;
      const drift = Math.sin(frame.time * 1.05 + index * 0.31) * 8;
      const x =
        centerX +
        Math.cos(angle) * (radius + drift * 0.24) +
        Math.sin(frame.time * 0.6 + band) * 6 +
        frame.x * (10 - column * 0.45);
      const y =
        centerY -
        42 +
        (band - 6) * 12 +
        Math.sin(angle * 1.8 + frame.time * 0.94) * 8 +
        Math.cos(frame.time * 0.52 + column) * 5 -
        radius * 0.08 +
        frame.y * (band - 5) * 0.9;
      return {
        x,
        y,
        r: 0.9 + (column % 4) * 0.28,
        opacity: clamp(0.14 + band * 0.028 - column * 0.01, 0.08, 0.32),
      };
    });

    const atmosphere = Array.from({ length: 4 }, (_, index) => {
      const y = 96 + index * 38;
      return pointPath(30, (step) => {
        const x = (SIZE / 29) * step;
        return {
          x,
          y:
            y +
            Math.sin(frame.time * 0.22 + index + x * 0.012) * (8 + index * 2) -
            Math.exp(-((x - centerX) * (x - centerX)) / 20000) * (8 + index * 2),
        };
      });
    });

    return {
      wavePaths,
      canopyPaths,
      orbitalRings,
      spires,
      terraces,
      particles,
      atmosphere,
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
        <g className="wayfinder-hero__atmosphere">
          {scene.atmosphere.map((path, index) => (
            <path key={`air-${index}`} d={path} />
          ))}
        </g>

        <g className="wayfinder-hero__waves">
          {scene.wavePaths.map((path, index) => (
            <path key={`wave-${index}`} d={path} />
          ))}
        </g>

        <g className="wayfinder-hero__canopy">
          {scene.canopyPaths.map((path, index) => (
            <path key={`canopy-${index}`} d={path} />
          ))}
        </g>

        <g className="wayfinder-hero__terraces">
          {scene.terraces.map((path, index) => (
            <path key={`terrace-${index}`} d={path} />
          ))}
        </g>

        <g className="wayfinder-hero__spires">
          {scene.spires.map((spire, index) => (
            <g key={`spire-${index}`}>
              <path d={spire.shaft} />
              <path d={spire.leftBrace} />
              <path d={spire.rightBrace} />
            </g>
          ))}
        </g>

        <g className="wayfinder-hero__rings">
          {scene.orbitalRings.map((path, index) => (
            <path key={`ring-${index}`} d={path} />
          ))}
        </g>

        <g className="wayfinder-hero__particles">
          {scene.particles.map((particle, index) => (
            <circle
              key={`particle-${index}`}
              cx={particle.x}
              cy={particle.y}
              r={particle.r}
              style={{ opacity: particle.opacity }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
