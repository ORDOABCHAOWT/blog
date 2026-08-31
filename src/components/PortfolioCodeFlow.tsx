'use client';

import { useEffect, useRef } from 'react';

const CELL_X = 9;
const CELL_Y = 9;

type FlowSource = {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  phase: number;
  speed: number;
  texture: number;
};

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function createSources(width: number, height: number) {
  const sourceCount = Math.max(6, Math.min(14, Math.ceil(width / 170)));
  const random = seededRandom(Math.round(width * 13 + height * 29));

  return Array.from({ length: sourceCount }, (_, index): FlowSource => {
    const segmentStart = index / sourceCount;
    const segmentWidth = 1 / sourceCount;

    return {
      x: segmentStart + segmentWidth * (0.32 + random() * 0.36),
      y: 0.38 + random() * 0.46,
      radiusX: segmentWidth * (0.72 + random() * 0.42),
      radiusY: 0.2 + random() * 0.2,
      phase: random() * Math.PI * 2,
      speed: 0.28 + random() * 0.42,
      texture: 2.1 + random() * 3.2,
    };
  });
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
    let sources: FlowSource[] = [];
    let animationFrame = 0;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      columns = Math.max(1, Math.floor(width / CELL_X));
      rows = Math.max(1, Math.floor(height / CELL_Y));
      sources = createSources(width, height);

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
        const topFade = Math.min(1, Math.max(0, (normalizedY - 0.03) / 0.42));

        for (let column = 0; column < columns; column++) {
          const normalizedX = columns <= 1 ? 0 : column / (columns - 1);
          const backgroundWave =
            0.025 +
            (Math.sin(column * 0.19 - time * 0.72 + row * 0.23) + 1) * 0.018;
          let weight = backgroundWave;

          for (const source of sources) {
            const sourceY = source.y + Math.sin(time * source.speed + source.phase) * 0.075;
            const pulse = 0.82 + Math.sin(time * source.speed * 0.73 + source.phase) * 0.18;
            const dx = (normalizedX - source.x) / (source.radiusX * pulse);
            const dy = (normalizedY - sourceY) / source.radiusY;
            const distance = dx * dx + dy * dy;
            const envelope = Math.exp(-distance * 1.45);
            const texture =
              0.36 +
              Math.abs(
                Math.sin(
                  dx * source.texture +
                    dy * (source.texture + 1.3) -
                    time * (0.34 + source.speed) +
                    source.phase
                )
              ) *
                0.64;
            const presence =
              0.2 +
              ((Math.sin(time * source.speed + source.phase) + 1) / 2) * 0.8;

            weight = Math.max(weight, envelope * texture * presence);
          }

          weight *= topFade;
          if (weight < 0.018) continue;

          const digitWave =
            Math.sin(column * 0.41 + row * 0.27 - time * 1.15) +
            Math.cos(column * 0.09 - row * 0.34 + time * 0.63);
          const digit = digitWave > 0 ? '1' : '0';
          const intensity = Math.min(1, weight);
          const shade = darkMode
            ? Math.round(82 + intensity * 142)
            : Math.round(205 - intensity * 130);
          const alpha = 0.16 + intensity * 0.68;

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
