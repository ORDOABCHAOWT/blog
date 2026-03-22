'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const SIZE = 480;
const TAU = Math.PI * 2;

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

function polygonPoints(
  centerX: number,
  centerY: number,
  radius: number,
  rotation: number
) {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = rotation + (index * TAU) / 6 - Math.PI / 2;
    return {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    };
  });
}

function polygonPath(points: Point[]) {
  return `${points
    .map((point, index) =>
      `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`
    )
    .join(' ')} Z`;
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
      activeIndex && activeIndex > 0 ? ((activeIndex - 1) % 12) / 11 : 0.4;
    const centerX = 248 + frame.x * 24 + (normalizedIndex - 0.5) * 18;
    const centerY = 236 + frame.y * 14 + Math.sin(frame.time * 0.32) * 4;
    const baseRotation =
      frame.time * 0.14 + normalizedIndex * 0.18 + frame.x * 0.2;
    const fieldLines = Array.from({ length: 7 }, (_, index) => {
      const baseY = 112 + index * 34;
      return pointPath(44, (step) => {
        const t = step / 43;
        const x = SIZE * t;
        const distance = x - centerX;
        const influence = Math.exp(-(distance * distance) / 24000);

        return {
          x,
          y:
            baseY +
            Math.sin(x * 0.012 + frame.time * 0.28 + index * 0.55) * (2.8 + index * 0.5) -
            influence * (7 + index * 1.25) +
            Math.cos(x * 0.02 - frame.time * 0.16 + index) * 1.6,
        };
      });
    });

    const rings = Array.from({ length: 6 }, (_, index) => {
      const radius = 34 + index * 28 + normalizedIndex * 10;
      const rotation =
        baseRotation +
        index * 0.08 +
        Math.sin(frame.time * 0.5 + index) * 0.03 +
        frame.y * 0.08;
      const points = polygonPoints(centerX, centerY, radius, rotation);

      return {
        path: polygonPath(points),
        points,
      };
    });

    const spokes = rings[rings.length - 1].points.map((outerPoint, index) => {
      const middlePoint = rings[2].points[index];
      return {
        d: `M${centerX.toFixed(2)} ${centerY.toFixed(2)} Q${middlePoint.x.toFixed(2)} ${middlePoint.y.toFixed(2)} ${outerPoint.x.toFixed(2)} ${outerPoint.y.toFixed(2)}`,
      };
    });

    const lattice = rings.flatMap((ring, ringIndex) => {
      if (ringIndex === rings.length - 1) {
        return [];
      }

      const nextRing = rings[ringIndex + 1];
      return ring.points.map((point, pointIndex) => {
        const target = nextRing.points[(pointIndex + (ringIndex % 2 === 0 ? 1 : 0)) % 6];
        return {
          d: `M${point.x.toFixed(2)} ${point.y.toFixed(2)} L${target.x.toFixed(2)} ${target.y.toFixed(2)}`,
        };
      });
    });

    const nodes = rings.flatMap((ring, ringIndex) =>
      ring.points
        .filter((_, pointIndex) => (pointIndex + ringIndex) % 2 === 0)
        .map((point, pointIndex) => ({
          x: point.x,
          y: point.y,
          r: 2 + ringIndex * 0.16 + (pointIndex % 2) * 0.2,
          opacity: clamp(0.18 + ringIndex * 0.04, 0.18, 0.34),
        }))
    );

    const centerHex = polygonPath(
      polygonPoints(
        centerX,
        centerY,
        16 + Math.sin(frame.time * 0.9) * 2,
        -baseRotation * 1.4
      )
    );

    return {
      fieldLines,
      rings,
      spokes,
      lattice,
      nodes,
      centerHex,
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

        <g className="wayfinder-hero__hexagons">
          {scene.rings.map((ring, index) => (
            <path key={`ring-${index}`} d={ring.path} />
          ))}
          <path d={scene.centerHex} />
        </g>

        <g className="wayfinder-hero__lattice">
          {scene.lattice.map((segment, index) => (
            <path key={`lattice-${index}`} d={segment.d} />
          ))}
        </g>

        <g className="wayfinder-hero__spokes">
          {scene.spokes.map((segment, index) => (
            <path key={`spoke-${index}`} d={segment.d} />
          ))}
        </g>

        <g className="wayfinder-hero__nodes">
          {scene.nodes.map((node, index) => (
            <circle
              key={`node-${index}`}
              cx={node.x}
              cy={node.y}
              r={node.r}
              style={{ opacity: node.opacity }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
