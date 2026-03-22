'use client';

import { useEffect, useMemo, useState } from 'react';

type PointerState = {
  x: number;
  y: number;
  active: boolean;
};

const ROWS = 27;
const COLS = 27;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function createGrid() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(' '));
}

function setGlyph(
  grid: string[][],
  x: number,
  y: number,
  glyph: string,
  overwrite = true
) {
  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return;
  if (!overwrite && grid[y][x] !== ' ') return;
  grid[y][x] = glyph;
}

function plotLine(
  grid: string[][],
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  glyph: string
) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));

  for (let i = 0; i <= steps; i += 1) {
    const t = steps === 0 ? 0 : i / steps;
    const x = Math.round(x0 + (x1 - x0) * t);
    const y = Math.round(y0 + (y1 - y0) * t);
    setGlyph(grid, x, y, glyph);
  }
}

function noise(x: number, y: number) {
  const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

export default function WayfinderHero({
  activeIndex = null,
}: {
  activeIndex?: number | null;
}) {
  const [pointer, setPointer] = useState<PointerState>({
    x: 0,
    y: 0,
    active: false,
  });
  const [time, setTime] = useState(0);

  useEffect(() => {
    const startedAt = performance.now();
    const intervalId = window.setInterval(() => {
      setTime((performance.now() - startedAt) / 1000);
    }, 80);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const captionIndex = activeIndex ? String(activeIndex).padStart(2, '0') : '--';

  const asciiArt = useMemo(() => {
    const grid = createGrid();
    const normalizedIndex =
      activeIndex && activeIndex > 0 ? ((activeIndex - 1) % 10) / 9 : 0.35;
    const cityCenterX = 13 + pointer.x * 2.4 + (normalizedIndex - 0.5) * 3;
    const domeHeight = 4 + Math.round(normalizedIndex * 2);
    const towerPulse = Math.sin(time * 1.4 + normalizedIndex * Math.PI) * 1.2;
    const tideLift = pointer.y * 1.8 + Math.sin(time * 0.9 + normalizedIndex * 3) * 0.8;
    const currentPush = pointer.x * 2.8;

    for (let y = 1; y < 10; y += 1) {
      for (let x = 1; x < COLS - 1; x += 1) {
        const sparkleChance =
          0.028 + Math.max(0, (6 - y)) * 0.002 + normalizedIndex * 0.01;
        const seed = noise(x + normalizedIndex * 13, y + time * 0.1);
        if (seed < sparkleChance) {
          setGlyph(grid, x, y, seed < sparkleChance * 0.3 ? '*' : '.');
        }
      }
    }

    const horizon = 14;
    for (let x = 0; x < COLS; x += 1) {
      const arch = Math.cos(((x - cityCenterX) / 7) * Math.PI) * domeHeight;
      const domeY = Math.round(horizon - arch - 2);

      if (x > cityCenterX - 8 && x < cityCenterX + 8) {
        setGlyph(grid, x, domeY, '_');
      }

      if (Math.abs(x - cityCenterX) < 7) {
        const shellY = Math.round(horizon - Math.sqrt(Math.max(0, 46 - (x - cityCenterX) ** 2)) * 0.38);
        setGlyph(grid, x, shellY, shellY < domeY ? '.' : '_', false);
      }
    }

    plotLine(grid, Math.round(cityCenterX - 8), 13, Math.round(cityCenterX - 3), 8, '/');
    plotLine(grid, Math.round(cityCenterX + 8), 13, Math.round(cityCenterX + 3), 8, '\\');
    plotLine(grid, Math.round(cityCenterX - 3), 8, Math.round(cityCenterX + 3), 8, '_');

    const towerHeights = [
      { x: Math.round(cityCenterX - 5), h: 5 + Math.round(towerPulse) },
      { x: Math.round(cityCenterX - 1), h: 7 + Math.round(normalizedIndex * 2) },
      { x: Math.round(cityCenterX + 3), h: 6 + Math.round(Math.abs(towerPulse)) },
      { x: Math.round(cityCenterX + 6), h: 4 + Math.round(normalizedIndex * 2) },
    ];

    towerHeights.forEach(({ x, h }, index) => {
      const topY = clamp(horizon - h, 4, horizon - 2);
      for (let y = topY; y <= horizon - 1; y += 1) {
        setGlyph(grid, x, y, '|');
      }

      setGlyph(grid, x, topY - 1, index % 2 === 0 ? 'A' : '^');
      setGlyph(grid, x - 1, horizon - 1, '[');
      setGlyph(grid, x + 1, horizon - 1, ']');
      setGlyph(grid, x, horizon - 2, ':', false);
    });

    const bridgeY = horizon - 1;
    for (let x = Math.round(cityCenterX - 6); x <= Math.round(cityCenterX + 6); x += 1) {
      setGlyph(grid, x, bridgeY, '=');
      if ((x + Math.round(time * 2)) % 4 === 0) {
        setGlyph(grid, x, bridgeY - 1, ':', false);
      }
    }

    for (let row = 0; row < 8; row += 1) {
      const y = horizon + row;
      for (let x = 0; x < COLS; x += 1) {
        const wave =
          y -
          (17 +
            row * 0.58 +
            Math.sin(x * 0.45 + time * 1.8 + currentPush) * (0.7 + row * 0.08) +
            Math.cos(x * 0.22 - time * 1.1 + normalizedIndex * 5) * 0.75 +
            tideLift);

        if (wave > -0.45 && wave < 0.55) {
          setGlyph(grid, x, y, row < 2 ? '~' : row < 5 ? '=' : '-');
        } else if (wave >= 0.55) {
          const glyph =
            row < 2 ? '~' : row < 4 ? '=' : row < 6 ? '-' : '_';
          setGlyph(grid, x, y, glyph, false);
        } else if (wave > -1 && noise(x * 0.8 + time, y) < 0.08 + row * 0.01) {
          setGlyph(grid, x, y, '`', false);
        }
      }
    }

    const reflectionBand = horizon + 2;
    for (let x = Math.round(cityCenterX - 7); x <= Math.round(cityCenterX + 7); x += 1) {
      if ((x + Math.round(time * 3)) % 2 === 0) {
        setGlyph(
          grid,
          x + Math.round(Math.sin(time + x) * 0.6),
          reflectionBand + Math.round(Math.cos(time * 1.4 + x) * 0.8),
          '|',
          false
        );
      }
    }

    return grid.map((row) => row.join('')).join('\n');
  }, [activeIndex, pointer.x, pointer.y, time]);

  return (
    <div
      className="wayfinder-hero"
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
        const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;

        setPointer({
          x,
          y,
          active: true,
        });
      }}
      onPointerLeave={() =>
        setPointer({
          x: 0,
          y: 0,
          active: false,
        })
      }
      aria-hidden="true"
    >
      <div className="wayfinder-hero__frame">
        <pre className="wayfinder-hero__ascii">{asciiArt}</pre>
      </div>

      <div className="wayfinder-hero__caption">
        <span>Entry {captionIndex} drifts the tide around the orbital city. Hover to bend the current.</span>
      </div>
    </div>
  );
}
