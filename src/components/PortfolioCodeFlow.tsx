'use client';

import { useEffect, useRef } from 'react';

const CELL_X = 9;
const CELL_Y = 9;

type Point = {
  x: number;
  y: number;
};

type CircuitSegment = {
  from: Point;
  to: Point;
  phase: number;
};

type CircuitTrace = {
  segments: CircuitSegment[];
  nodes: Point[];
  phase: number;
  speed: number;
};

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function createCircuit(width: number, height: number) {
  const random = seededRandom(Math.round(width * 13 + height * 29));
  const laneCount = Math.max(7, Math.min(13, Math.ceil(width / 160)));
  const traces: CircuitTrace[] = [];

  const addTrace = (points: Point[], phase: number, speed: number) => {
    const trace: CircuitTrace = { segments: [], nodes: [], phase, speed };
    for (let index = 0; index < points.length - 1; index++) {
      trace.segments.push({
        from: points[index],
        to: points[index + 1],
        phase: random() * Math.PI * 2,
      });
    }
    trace.nodes.push(...points.slice(1, -1));
    traces.push(trace);
    return trace;
  };

  // Full-width horizontal buses establish the regular circuit-board rhythm.
  for (let lane = 0; lane < laneCount; lane++) {
    const y = clamp(
      0.1 + (lane / Math.max(1, laneCount - 1)) * 0.86 + (random() - 0.5) * 0.025,
      0.04,
      0.98
    );
    const trace = addTrace(
      [
        { x: -0.04, y },
        { x: 1.04, y },
      ],
      random() * Math.PI * 2,
      0.22 + random() * 0.3
    );

    const branchCount = 1 + Math.floor(random() * 3);
    for (let branch = 0; branch < branchCount; branch++) {
      const x = 0.08 + random() * 0.84;
      const direction = random() > 0.5 ? 1 : -1;
      const branchY = clamp(y + direction * (0.055 + random() * 0.16), 0.03, 0.97);
      const branchX = clamp(x + (random() - 0.5) * 0.16, 0.04, 0.96);
      trace.nodes.push({ x, y });
      addTrace(
        [
          { x, y },
          { x, y: branchY },
          { x: branchX, y: branchY },
        ],
        trace.phase + random() * 1.8,
        trace.speed * (0.8 + random() * 0.5)
      );
    }
  }

  // A few vertical rails make the field read as connected circuitry instead of waves.
  const railCount = Math.max(3, Math.min(6, Math.round(width / 280)));
  for (let rail = 0; rail < railCount; rail++) {
    const x = clamp(
      0.08 + (rail / Math.max(1, railCount - 1)) * 0.84 + (random() - 0.5) * 0.04,
      0.04,
      0.96
    );
    const top = 0.08 + random() * 0.14;
    const bottom = 0.8 + random() * 0.16;
    addTrace(
      [
        { x, y: top },
        { x, y: bottom },
      ],
      random() * Math.PI * 2,
      0.18 + random() * 0.24
    );
  }

  return traces;
}

function segmentDistance(point: Point, segment: CircuitSegment) {
  const vx = segment.to.x - segment.from.x;
  const vy = segment.to.y - segment.from.y;
  const lengthSquared = vx * vx + vy * vy || 1;
  const progress = clamp(
    ((point.x - segment.from.x) * vx + (point.y - segment.from.y) * vy) /
      lengthSquared,
    0,
    1
  );
  const nearestX = segment.from.x + vx * progress;
  const nearestY = segment.from.y + vy * progress;
  return {
    distance: Math.hypot(point.x - nearestX, point.y - nearestY),
    progress,
  };
}

function circularDistance(first: number, second: number) {
  const distance = Math.abs(first - second);
  return Math.min(distance, 1 - distance);
}

export default function PortfolioCodeFlow() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const ctx: CanvasRenderingContext2D = context;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let columns = 0;
    let rows = 0;
    let circuit: CircuitTrace[] = [];
    let animationFrame = 0;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      columns = Math.max(1, Math.floor(width / CELL_X));
      rows = Math.max(1, Math.floor(height / CELL_Y));
      circuit = createCircuit(width, height);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(wrap);

    let darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const updateColorScheme = (event: MediaQueryListEvent) => {
      darkMode = event.matches;
    };
    colorScheme.addEventListener?.('change', updateColorScheme);

    const startedAt = performance.now();

    const render = (now: number) => {
      const time = (now - startedAt) / 1000;
      ctx.clearRect(0, 0, width, height);
      ctx.font = `${CELL_Y}px ui-monospace, "SF Mono", Menlo, monospace`;
      ctx.textBaseline = 'top';

      for (let row = 0; row < rows; row++) {
        const normalizedY = rows <= 1 ? 1 : row / (rows - 1);
        const topFade = Math.min(1, Math.max(0, (normalizedY - 0.015) / 0.25));

        for (let column = 0; column < columns; column++) {
          const point = {
            x: columns <= 1 ? 0 : column / (columns - 1),
            y: normalizedY,
          };
          let weight = 0.012;

          for (const trace of circuit) {
            const tracePulse =
              0.16 +
              Math.abs(Math.sin(time * trace.speed + trace.phase)) * 0.2;

            for (let segmentIndex = 0; segmentIndex < trace.segments.length; segmentIndex++) {
              const segment = trace.segments[segmentIndex];
              const nearest = segmentDistance(point, segment);
              if (nearest.distance > 0.045) continue;

              const lineWeight = (1 - nearest.distance / 0.045) * tracePulse;
              const pulsePosition =
                (time * trace.speed * 0.38 +
                  trace.phase / (Math.PI * 2) +
                  segmentIndex * 0.19) %
                1;
              const pulse = Math.exp(
                -circularDistance(nearest.progress, pulsePosition) * 120
              );
              weight = Math.max(weight, lineWeight + pulse * lineWeight * 2.8);
            }

            for (const node of trace.nodes) {
              const nodeDistance = Math.hypot(point.x - node.x, point.y - node.y);
              if (nodeDistance > 0.04) continue;
              const nodePulse =
                0.55 + Math.abs(Math.sin(time * trace.speed + trace.phase)) * 0.45;
              weight = Math.max(weight, (1 - nodeDistance / 0.04) * nodePulse);
            }
          }

          weight *= topFade;
          if (weight < 0.025) continue;

          const digit =
            Math.sin(column * 0.53 + row * 0.17 + time * 0.22) > 0 ? '1' : '0';
          const intensity = Math.min(1, weight);
          const shade = darkMode
            ? Math.round(74 + intensity * 156)
            : Math.round(188 - intensity * 132);
          const alpha = 0.18 + intensity * 0.72;

          ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade + (darkMode ? 8 : 14)}, ${alpha})`;
          ctx.fillText(digit, column * CELL_X, row * CELL_Y);
        }
      }

      animationFrame = requestAnimationFrame(render);
    };

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (reducedMotion) {
      render(performance.now());
      cancelAnimationFrame(animationFrame);
    } else {
      animationFrame = requestAnimationFrame(render);
    }

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      colorScheme.removeEventListener?.('change', updateColorScheme);
    };
  }, []);

  return (
    <div ref={wrapRef} className="portfolio-code-flow" aria-hidden="true">
      <canvas ref={canvasRef} className="portfolio-code-flow__canvas" />
    </div>
  );
}
