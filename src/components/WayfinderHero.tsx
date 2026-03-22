'use client';

import { useMemo, useState } from 'react';

type PointerState = {
  x: number;
  y: number;
  active: boolean;
};

const CENTER = 160;
const OUTER_RADIUS = 112;
const INNER_RADIUS = 34;

function polarToCartesian(radius: number, angle: number) {
  return {
    x: CENTER + Math.cos(angle) * radius,
    y: CENTER + Math.sin(angle) * radius,
  };
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

  const normalizedIndex =
    activeIndex && activeIndex > 0 ? ((activeIndex - 1) % 18) / 17 : 0.32;
  const intensity = activeIndex ? (activeIndex % 9) / 8 : 0.35;
  const altRingRadius = 62 + intensity * 28;
  const spokeOpacity = 0.34 + intensity * 0.38;
  const waveOpacity = 0.18 + intensity * 0.28;
  const captionIndex = activeIndex ? String(activeIndex).padStart(2, '0') : '--';
  const focusSpoke = normalizedIndex * 17;
  const ambientOffsetX = (normalizedIndex - 0.5) * 10;
  const ambientOffsetY = Math.sin(normalizedIndex * Math.PI * 2) * 5;
  const ambientRotate = (normalizedIndex - 0.5) * 16;

  const spokes = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => {
        const angle = (index / 18) * Math.PI * 2 - Math.PI / 2;
        return {
          inner: polarToCartesian(INNER_RADIUS, angle),
          outer: polarToCartesian(OUTER_RADIUS, angle),
        };
      }),
    []
  );

  const waveRows = useMemo(
    () =>
      Array.from({ length: 6 }, (_, index) => ({
        y: 72 + index * 32,
        amplitude: 8 + index * 1.4,
        phase: index * 0.8,
      })),
    []
  );

  const offsetX = pointer.x * 10 + ambientOffsetX;
  const offsetY = pointer.y * 10 + ambientOffsetY;
  const slowRotate = ambientRotate + (pointer.active ? pointer.x * 8 : 0);
  const squareRotate =
    ambientRotate * 0.85 + (pointer.active ? pointer.x * 12 + pointer.y * -8 : 0);

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
      <svg viewBox="0 0 320 320" className="wayfinder-hero__svg" role="presentation">
        <defs>
          <radialGradient id="wayfinder-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.78)" />
            <stop offset="65%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <mask id="wayfinder-void">
            <rect width="320" height="320" fill="white" />
            <circle cx={CENTER} cy={CENTER} r="28" fill="black" />
          </mask>
        </defs>

        <circle cx={CENTER} cy={CENTER} r="126" className="wayfinder-hero__halo" />

        <g
          className="wayfinder-hero__drift"
          style={{
            transform: `translate(${offsetX}px, ${offsetY}px)`,
          }}
        >
          <g
            className="wayfinder-hero__spinner"
            style={{
              transform: `rotate(${slowRotate}deg)`,
            }}
          >
            <circle cx={CENTER} cy={CENTER} r={OUTER_RADIUS} className="wayfinder-hero__outer-ring" />
            <circle
              cx={CENTER}
              cy={CENTER}
              r={altRingRadius}
              className="wayfinder-hero__inner-ring"
            />

            <g mask="url(#wayfinder-void)" className="wayfinder-hero__spokes">
              {spokes.map((spoke, index) => (
                (() => {
                  const circularDistance = Math.min(
                    Math.abs(index - focusSpoke),
                    spokes.length - Math.abs(index - focusSpoke)
                  );
                  const emphasis = Math.max(0, 1 - circularDistance / 5.5);

                  return (
                    <line
                      key={index}
                      x1={spoke.inner.x}
                      y1={spoke.inner.y}
                      x2={spoke.outer.x}
                      y2={spoke.outer.y}
                      style={{
                        opacity: 0.12 + emphasis * spokeOpacity,
                      }}
                    />
                  );
                })()
              ))}
            </g>
          </g>

          <g
            className="wayfinder-hero__square-frame"
            style={{
              transform: `rotate(${45 + squareRotate}deg)`,
            }}
          >
            <rect x="92" y="92" width="136" height="136" rx="2" />
            <rect x="116" y="116" width="88" height="88" rx="2" />
          </g>

          <g className="wayfinder-hero__waves" mask="url(#wayfinder-void)">
            {waveRows.map((row) => (
              <path
                key={row.y}
                d={[
                  `M 42 ${row.y}`,
                  `C 96 ${row.y - row.amplitude + row.phase * pointer.x * 3 - normalizedIndex * 6},`,
                  `124 ${row.y + row.amplitude + normalizedIndex * 4},`,
                  `160 ${row.y}`,
                  `S 224 ${row.y - row.amplitude - normalizedIndex * 5},`,
                  `278 ${row.y + row.amplitude - row.phase * pointer.y * 3 + normalizedIndex * 3}`,
                ].join(' ')}
                style={{
                  opacity: waveOpacity + row.phase * 0.02,
                }}
              />
            ))}
          </g>

          <circle cx={CENTER} cy={CENTER} r="30" className="wayfinder-hero__void-ring" />
          <circle cx={CENTER} cy={CENTER} r="16" className="wayfinder-hero__core" />
        </g>
      </svg>

      <div className="wayfinder-hero__caption">
        <span>Entry {captionIndex} shifts the field. Move across it to disturb the geometry.</span>
      </div>
    </div>
  );
}
