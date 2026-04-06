'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const SIZE = 480;
const LINE_COUNT = 124;
const POINTS_PER_LINE = 118;
const HOVER_RADIUS = 112;

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
  strokeWidth: number;
  tone: 'soft' | 'accent';
};

type BinaryGlyph = {
  x: number;
  y: number;
  zeroOpacity: number;
  oneOpacity: number;
  driftX: number;
  driftY: number;
  fontSize: number;
};

type SignalColumn = {
  x: number;
  y1: number;
  y2: number;
  opacity: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pointsToPath(points: Point[]) {
  if (points.length === 0) {
    return '';
  }

  if (points.length === 1) {
    return `M${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  }

  let path = `M${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  for (let index = 1; index < points.length - 1; index += 1) {
    const point = points[index];
    const next = points[index + 1];
    const midX = (point.x + next.x) / 2;
    const midY = (point.y + next.y) / 2;

    path += ` Q${point.x.toFixed(2)} ${point.y.toFixed(2)} ${midX.toFixed(2)} ${midY.toFixed(2)}`;
  }

  const last = points[points.length - 1];
  path += ` T${last.x.toFixed(2)} ${last.y.toFixed(2)}`;

  return path;
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
        (pointerTarget.current.x - pointerCurrent.current.x) * 0.075;
      pointerCurrent.current.y +=
        (pointerTarget.current.y - pointerCurrent.current.y) * 0.075;

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
    const ambientSway =
      Math.sin(frame.time * 0.48 + normalizedIndex * Math.PI * 1.2) * 0.75;
    const scanlineY =
      SIZE * (0.16 + (((frame.time * 0.08) + normalizedIndex * 0.14) % 1) * 0.68);
    const pointerStrength = pointerActive
      ? clamp(1 - Math.hypot(frame.x, frame.y) * 0.18, 0.72, 1)
      : 0;

    const lines: RippleLine[] = Array.from({ length: LINE_COUNT }, (_, layer) => {
      const layerProgress = layer / (LINE_COUNT - 1);
      const baseY = 20 + layerProgress * (SIZE - 40);
      const amplitude = 0.8 + layerProgress * 4.6;
      const frequency = 0.0135 + layerProgress * 0.006;
      const speed = 0.32 + layerProgress * 0.44;
      const drift = 1.3 + layerProgress * 1.8;
      const linePhase = layer * 0.18 + normalizedIndex * 1.4;
      const points = Array.from({ length: POINTS_PER_LINE }, (_, step) => {
        const t = step / (POINTS_PER_LINE - 1);
        const x = SIZE * t;
        const distance = x - centerX;
        const influence = Math.exp(-(distance * distance) / 11000);
        const verticalDistance = centerY - baseY;
        const scanDistance = Math.abs(baseY - scanlineY);
        const scanInfluence = Math.exp(-(scanDistance * scanDistance) / 2200);
        const localLift = pointerActive
          ? Math.exp(
              -(
                ((x - hoverX) * (x - hoverX) +
                  (baseY - hoverY) * (baseY - hoverY)) /
                7600
              )
            )
          : 0;
        const primary =
          Math.sin(x * frequency + frame.time * speed + linePhase) *
          amplitude;
        const secondary =
          Math.cos(
            x * (frequency * 0.58) - frame.time * (speed * 0.74) + layer * 0.13
          ) * (0.82 + layerProgress * 3.6);
        const tertiary =
          Math.sin(
            x * (frequency * 0.2) + frame.time * (speed * 0.38) - layer * 0.17
          ) * (0.5 + layerProgress * 1.55);
        const undercurrent =
          Math.cos(
            x * (frequency * 0.1) -
              frame.time * (0.24 + layerProgress * 0.18) +
              linePhase
          ) *
          (0.34 + layerProgress * 0.92);
        const tide =
          influence *
          (Math.sin(frame.time * 1.18 + x * 0.015 + layer * 0.22) * drift -
            verticalDistance * 0.074 +
            frame.x * 14 -
            frame.y * 11);
        const digitalPulse =
          Math.sin(x * 0.05 - frame.time * 4.2 + layer * 0.21) *
          scanInfluence *
          (0.42 + layerProgress * 0.8);
        const wake =
          localLift *
          Math.sin(
            Math.hypot(x - hoverX, baseY - hoverY) * 0.09 -
              frame.time * 5.2 +
              layer * 0.14
          ) *
          1.45 *
          pointerStrength;
        const eddy =
          localLift *
          (Math.sin(frame.time * 2.4 + x * 0.032 + layer * 0.31) * 2.1 +
            Math.cos(frame.time * 1.7 - baseY * 0.022) * 1.3) *
          pointerStrength;

        return {
          x,
          y:
            baseY +
            primary +
            secondary +
            tertiary +
            undercurrent +
            tide +
            digitalPulse +
            wake +
            eddy +
            ambientSway,
        };
      });

      const minDistance = pointerActive
        ? Math.min(
            ...points.map((point) =>
              Math.hypot(point.x - hoverX, point.y - hoverY)
            )
          )
        : HOVER_RADIUS * 2;
      const opacity = pointerActive
        ? clamp(0.28 + minDistance / (HOVER_RADIUS * 1.38), 0.28, 1)
        : 1;
      const strokeWidth = 0.42 + (1 - layerProgress) * 0.18;
      const scanInfluence = Math.exp(
        -((baseY - scanlineY) * (baseY - scanlineY)) / 2200
      );
      const tone = scanInfluence > 0.58 || layer % 19 === 0 ? 'accent' : 'soft';

      return {
        path: pointsToPath(points),
        points,
        opacity,
        strokeWidth,
        tone,
      };
    });

    const glyphs: BinaryGlyph[] = [];
    const signalColumns: SignalColumn[] = Array.from({ length: 10 }, (_, index) => {
      const phase = frame.time * 0.55 + index * 0.73 + normalizedIndex * 0.9;
      const x = 86 + index * 31 + Math.sin(phase) * 4;
      const y1 = 56 + Math.sin(phase * 1.4) * 8;
      const length = 48 + ((Math.sin(phase * 1.2) + 1) / 2) * 52;
      const opacity = clamp(0.05 + ((Math.sin(phase * 1.7) + 1) / 2) * 0.18, 0.05, 0.22);

      return {
        x,
        y1,
        y2: y1 + length,
        opacity,
      };
    });

    if (pointerActive) {
      lines.forEach((line, layer) => {
        line.points.forEach((point, step) => {
          if (step % 4 !== layer % 3) {
            return;
          }

          const distance = Math.hypot(point.x - hoverX, point.y - hoverY);
          if (distance > HOVER_RADIUS) {
            return;
          }

          const distanceProgress = 1 - distance / HOVER_RADIUS;
          const phase =
            frame.time * (1.5 + distanceProgress * 1.2) +
            layer * 0.31 +
            step * 0.23 +
            Math.sin((point.x + point.y) * 0.012) +
            Math.cos((point.x - point.y) * 0.008) * 0.5;
          const mix = (Math.sin(phase) + 1) / 2;
          const glow = clamp(0.18 + distanceProgress * 0.68, 0.18, 0.9);
          const zeroOpacity = clamp((1 - mix) * 0.82 + glow * 0.24, 0.12, 0.94);
          const oneOpacity = clamp(mix * 0.88 + glow * 0.26, 0.12, 0.96);
          glyphs.push({
            x: point.x + Math.sin(phase * 1.4) * 1.4 * distanceProgress,
            y: point.y + Math.cos(phase * 1.12) * 1.9 * distanceProgress,
            zeroOpacity,
            oneOpacity,
            driftX: Math.cos(phase * 1.7) * 0.9 * distanceProgress,
            driftY: Math.sin(phase * 1.35) * 1.2 * distanceProgress,
            fontSize: 6.8 + mix * 2.2 + distanceProgress * 0.8,
          });
        });
      });
    }

    return {
      lines,
      glyphs,
      signalColumns,
      scanlineY,
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
        <g className="wayfinder-hero__signals">
          {scene.signalColumns.map((column, index) => (
            <line
              key={`signal-${index}`}
              x1={column.x}
              y1={column.y1}
              x2={column.x}
              y2={column.y2}
              style={{ opacity: column.opacity }}
            />
          ))}
          <rect
            className="wayfinder-hero__scanline"
            x={36}
            y={scene.scanlineY - 9}
            width={SIZE - 72}
            height={18}
            rx={9}
          />
        </g>

        <g className="wayfinder-hero__ripples">
          {scene.lines.map((line, index) => (
            <path
              key={`ripple-${index}`}
              d={line.path}
              className={
                line.tone === 'accent'
                  ? 'wayfinder-hero__ripple wayfinder-hero__ripple--accent'
                  : 'wayfinder-hero__ripple'
              }
              style={{ opacity: line.opacity, strokeWidth: line.strokeWidth }}
            />
          ))}
        </g>

        <g className="wayfinder-hero__binary">
          {scene.glyphs.map((glyph, index) => (
            <g
              key={`binary-${index}`}
              transform={`translate(${(glyph.x + glyph.driftX).toFixed(2)} ${(glyph.y + glyph.driftY).toFixed(2)})`}
            >
              <text
                className="wayfinder-hero__digit wayfinder-hero__digit--zero"
                x={-0.45}
                y={0.35}
                style={{
                  opacity: glyph.zeroOpacity,
                  fontSize: `${glyph.fontSize}px`,
                }}
              >
                0
              </text>
              <text
                className="wayfinder-hero__digit wayfinder-hero__digit--one"
                x={0.45}
                y={-0.35}
                style={{
                  opacity: glyph.oneOpacity,
                  fontSize: `${glyph.fontSize}px`,
                }}
              >
                1
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
