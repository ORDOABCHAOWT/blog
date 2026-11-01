/**
 * The way into the portfolio from the homepage: the homepage pushes forward and fades while
 * ASCII stars stream out from the centre, the route changes behind them, and the streaks slow
 * into the portfolio's own still sky while its computer grows in from a dot.
 *
 * The portfolio page times its arrival from `data-portfolio-warp` on <html>, which is set here
 * for the length of the effect.
 */

export const PORTFOLIO_WARP_ATTRIBUTE = 'data-portfolio-warp';

// Milliseconds from the click.
const PUSH_END = 520; // the homepage has pushed forward and faded
const NAVIGATE_AT = 480; // the route changes behind the opaque overlay
const CRUISE_UNTIL = 1150; // full speed until here, then slowing
const CLEAR_AT = 1150; // the overlay's background fades out to show the portfolio
const STOP_AT = 2450; // the streaks have settled into points
const END_AT = 2700; // overlay removed
const RELEASE_AT = 4800; // attribute removed, once the screen's intro has finished
const FRAME_MS = 33;
const FONT_SIZE = 13;
const LINE_HEIGHT = 1.15;

type WarpStar = { angle: number; distance: number; speed: number; accent: boolean };

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const easeIn = (value: number) => clamp01(value) ** 2.2;
const easeOut = (value: number) => 1 - (1 - clamp01(value)) ** 3;

// The character for a stroke going (dx, dy) in cells; a cell is about twice as tall as it is wide.
function slopeChar(dx: number, dy: number) {
  let angle = Math.abs(Math.atan2(dy * 2, dx));
  if (angle > Math.PI / 2) angle = Math.PI - angle;
  if (angle < Math.PI / 8) return '-';
  if (angle > (3 * Math.PI) / 8) return '|';
  return dx * dy < 0 ? '/' : '\\';
}

function speedAt(elapsed: number) {
  if (elapsed < CRUISE_UNTIL) return easeIn((elapsed - 120) / 640);
  return 1 - easeOut((elapsed - CRUISE_UNTIL) / (STOP_AT - CRUISE_UNTIL));
}

export function playPortfolioWarp(navigate: () => void, origin: { x: number; y: number }) {
  const root = document.documentElement;
  const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const colours = dark
    ? { paper: '#171619', ink: '#eeeaf0', accent: '#aaa1ff' }
    : { paper: '#f4f3f0', ink: '#18171a', accent: '#7771d1' };

  const overlay = document.createElement('div');
  overlay.className = 'portfolio-warp';
  overlay.style.setProperty('--portfolio-warp-paper', colours.paper);
  overlay.style.setProperty('--portfolio-warp-ink', colours.ink);
  overlay.style.setProperty('--portfolio-warp-accent', colours.accent);
  const streaks = document.createElement('pre');
  const accents = document.createElement('pre');
  streaks.className = 'portfolio-warp__streaks';
  accents.className = 'portfolio-warp__accents';
  overlay.append(streaks, accents);
  document.body.appendChild(overlay);

  const page = document.querySelector('main');
  if (page) {
    page.style.transformOrigin = `${origin.x}px ${origin.y + window.scrollY}px`;
    page.style.transition = `transform ${PUSH_END}ms cubic-bezier(0.55, 0, 1, 0.45), opacity ${PUSH_END}ms ease-in`;
    requestAnimationFrame(() => {
      page.style.transform = 'scale(1.22)';
      page.style.opacity = '0';
    });
  }

  const context = document.createElement('canvas').getContext('2d');
  let charWidth = FONT_SIZE * 0.6;
  if (context) {
    context.font = getComputedStyle(streaks).font;
    charWidth = context.measureText('M'.repeat(20)).width / 20 || charWidth;
  }
  const cols = Math.ceil(window.innerWidth / charWidth);
  const rows = Math.ceil(window.innerHeight / (FONT_SIZE * LINE_HEIGHT));
  const centreX = cols / 2;
  const centreY = rows * 0.48;
  const reach = Math.hypot(cols / 2, rows) * 1.05;
  const stars: WarpStar[] = Array.from({ length: Math.round((cols * rows) / 32) }, () => ({
    angle: Math.random() * Math.PI * 2,
    distance: Math.random(),
    speed: 0.6 + Math.random() * 0.8,
    accent: Math.random() < 0.08,
  }));

  root.setAttribute(PORTFOLIO_WARP_ATTRIBUTE, '');
  const start = performance.now();
  let last = start;
  let navigated = false;
  let raf = 0;

  const finish = () => {
    cancelAnimationFrame(raf);
    overlay.remove();
  };

  const frame = (now: number) => {
    const elapsed = now - start;
    if (!navigated && elapsed >= NAVIGATE_AT) {
      navigated = true;
      navigate();
    }
    if (elapsed >= END_AT) {
      finish();
      return;
    }
    raf = requestAnimationFrame(frame);
    if (now - last < FRAME_MS) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    overlay.style.setProperty('--portfolio-warp-cover', String(clamp01(elapsed / 360) * (1 - clamp01((elapsed - CLEAR_AT) / 380))));
    const speed = speedAt(elapsed);
    const base = new Array<string>(cols * rows).fill(' ');
    const accent = new Array<string>(cols * rows).fill(' ');
    const put = (cells: string[], x: number, y: number, char: string) => {
      const cx = Math.round(x);
      const cy = Math.round(y);
      if (cx >= 0 && cy >= 0 && cx < cols && cy < rows) cells[cy * cols + cx] = char;
    };
    for (const star of stars) {
      star.distance += dt * speed * star.speed * (0.18 + star.distance * 2.4);
      if (star.distance > 1.15) {
        star.distance = 0.02 + Math.random() * 0.06;
        star.angle = Math.random() * Math.PI * 2;
      }
      const ux = Math.cos(star.angle);
      const uy = Math.sin(star.angle) * 0.5;
      const radius = star.distance * reach;
      const cells = star.accent ? accent : base;
      const length = speed * (1 + star.distance * 16);
      if (length < 0.6) {
        put(cells, centreX + ux * radius, centreY + uy * radius, star.distance > 0.5 ? '*' : '.');
        continue;
      }
      const char = slopeChar(ux, uy);
      for (let step = 0; step <= length; step += 0.8) {
        put(cells, centreX + ux * (radius - step), centreY + uy * (radius - step), step > length * 0.6 ? '.' : char);
      }
    }
    const lines = (cells: string[]) => {
      const out: string[] = [];
      for (let y = 0; y < rows; y++) out.push(cells.slice(y * cols, (y + 1) * cols).join(''));
      return out.join('\n');
    };
    streaks.textContent = lines(base);
    accents.textContent = lines(accent);
  };

  raf = requestAnimationFrame(frame);
  // Navigation must never wait on the animation; clean up even if frames stop arriving.
  window.setTimeout(() => {
    if (!navigated) {
      navigated = true;
      navigate();
    }
  }, NAVIGATE_AT + 200);
  window.setTimeout(finish, END_AT + 400);
  window.setTimeout(() => root.removeAttribute(PORTFOLIO_WARP_ATTRIBUTE), RELEASE_AT);
}
