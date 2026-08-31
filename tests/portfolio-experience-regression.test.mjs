import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const postPage = fs.readFileSync(
  new URL('../src/app/posts/[slug]/page.tsx', import.meta.url),
  'utf8'
);
const globalsCss = fs.readFileSync(
  new URL('../src/app/globals.css', import.meta.url),
  'utf8'
);
const portfolioComponent = fs.readFileSync(
  new URL('../src/components/PortfolioExperience.tsx', import.meta.url),
  'utf8'
);
const wayfinderHero = fs.readFileSync(
  new URL('../src/components/WayfinderHero.tsx', import.meta.url),
  'utf8'
);
const nextConfig = fs.readFileSync(
  new URL('../next.config.ts', import.meta.url),
  'utf8'
);
const notebookProxy = fs.readFileSync(
  new URL('../src/app/notebook/[[...path]]/route.ts', import.meta.url),
  'utf8'
);
const japaneseProxy = fs.readFileSync(
  new URL('../src/app/japanese/[[...path]]/route.ts', import.meta.url),
  'utf8'
);
test('aboutMyProjects uses the dedicated portfolio experience', () => {
  assert.match(
    postPage,
    /import PortfolioExperience from '@\/components\/PortfolioExperience';/,
    'Expected the post route to import the portfolio experience'
  );
  assert.match(
    postPage,
    /resolvedParams\.slug === PORTFOLIO_SLUG/,
    'Expected the reserved aboutMyProjects route to opt into the portfolio page before post lookup'
  );
  assert.match(
    postPage,
    /<PortfolioExperience \/>/,
    'Expected the route to render the dedicated portfolio experience'
  );
});

test('portfolio page presents four centred portfolio categories', () => {
  assert.match(
    portfolioComponent,
    /label: 'Vibe coding'/,
    'Expected the Vibe Coding category'
  );
  assert.match(
    portfolioComponent,
    /label: '平面设计'/,
    'Expected the graphic-design category'
  );
  assert.match(
    portfolioComponent,
    /label: '视频'/,
    'Expected the video category'
  );
  assert.match(
    portfolioComponent,
    /label: '新媒体运营'/,
    'Expected the social-media category'
  );
  assert.match(
    portfolioComponent,
    /type="button"/,
    'Expected every category control to be a native keyboard-accessible button'
  );
  assert.match(
    globalsCss,
    /\.portfolio-category-picker\s*{/,
    'Expected the centred category picker styling'
  );
  assert.doesNotMatch(
    portfolioComponent,
    /SELECTED WORKS|Word Notebook|在不同媒介中|portfolio-category-detail/,
    'Expected no header tagline, project link, introduction, or detail copy'
  );
  assert.doesNotMatch(
    portfolioComponent,
    /aria-pressed|activeCategory|setActiveCategory/,
    'Expected no persistent selected category state'
  );
  assert.match(
    globalsCss,
    /\.portfolio-category-button:hover\s*{/,
    'Expected category emphasis to be hover-only'
  );
  assert.doesNotMatch(
    globalsCss,
    /\.portfolio-category-button\[aria-pressed/,
    'Expected category emphasis to clear when the pointer leaves'
  );
});

test('portfolio post metadata names the portfolio link correctly', () => {
  assert.match(
    postPage,
    /PORTFOLIO_TITLE\s*=\s*'王腾作品集&项目经历'/,
    'Expected homepage/archive metadata to describe the portfolio'
  );
  assert.match(
    postPage,
    /PORTFOLIO_DESCRIPTION\s*=\s*\n?\s*'Vibe Coding、平面设计、视频与新媒体运营作品集'/,
    'Expected a portfolio-specific description'
  );
  assert.match(
    postPage,
    /getAllPostSlugs\(\), PORTFOLIO_SLUG/,
    'Expected static params to include the reserved portfolio route without a Markdown file'
  );
});

test('portfolio page reuses the homepage animated digit flow at the bottom', () => {
  assert.match(
    portfolioComponent,
    /import WayfinderHero from '@\/components\/WayfinderHero';/,
    'Expected the portfolio to reuse the homepage animation engine'
  );
  assert.match(
    portfolioComponent,
    /<WayfinderHero \/>/,
    'Expected a live digit canvas at the bottom of the page'
  );
  assert.match(
    globalsCss,
    /\.portfolio-code-flow\s*{/,
    'Expected the moving canvas to remain visible in normal page flow'
  );
  assert.match(
    wayfinderHero,
    /raf = requestAnimationFrame\(render\)/,
    'Expected continuous movement through animation frames'
  );
  assert.match(
    wayfinderHero,
    /prefers-reduced-motion: reduce/,
    'Expected the shared animation to retain its reduced-motion fallback'
  );
});

test('blog decodes the scoped notebook proxy without taking over blog routes', () => {
  assert.match(
    notebookProxy,
    /requestHeaders\.delete\('accept-encoding'\)/,
    'Expected the proxy to request an identity-encoded upstream response'
  );
  assert.match(
    notebookProxy,
    /new TextDecoder\(\)\.decode\(bytes\)/,
    'Expected text and JSON responses to be decoded before Vercel returns them'
  );
  assert.match(
    notebookProxy,
    /new Uint8Array\(bytes\)/,
    'Expected binary icons to be returned as an explicit byte array'
  );
  assert.match(
    notebookProxy,
    /X-Notebook-Proxy-Version', 'decoded-v2'/,
    'Expected a safe proxy-version diagnostic'
  );
  assert.match(
    notebookProxy,
    /Service-Worker-Allowed', '\/notebook'/,
    'Expected the service worker to control the canonical no-trailing-slash app URL'
  );
  assert.doesNotMatch(
    nextConfig,
    /\/api\/:path\*/,
    'Notebook proxy must not intercept the blog CMS API'
  );
});

test('blog exposes the Japanese textbook through a scoped no-cache proxy', () => {
  assert.match(
    japaneseProxy,
    /`\/japanese\/\$\{path\.map/,
    'Expected the public Japanese route to stay scoped to the Worker textbook path'
  );
  assert.match(
    japaneseProxy,
    /requestHeaders\.delete\('accept-encoding'\)/,
    'Expected the Japanese proxy to request an identity-encoded upstream response'
  );
  assert.match(
    japaneseProxy,
    /new TextDecoder\(\)\.decode\(bytes\)/,
    'Expected textual textbook assets to be decoded before Vercel returns them'
  );
  assert.match(
    japaneseProxy,
    /new Uint8Array\(bytes\)/,
    'Expected PWA icons to be returned as explicit binary bytes'
  );
  assert.match(
    japaneseProxy,
    /X-Japanese-Proxy-Version', 'decoded-v2'/,
    'Expected a safe Japanese proxy-version diagnostic'
  );
  assert.match(
    japaneseProxy,
    /body: requestBody/,
    'Expected Japanese sync requests to forward their JSON body to the Worker'
  );
  assert.match(
    japaneseProxy,
    /export const POST = proxyJapanese/,
    'Expected the public Japanese route to accept learning-record sync writes'
  );
  assert.match(
    japaneseProxy,
    /Service-Worker-Allowed', '\/japanese'/,
    'Expected the service worker to control the canonical no-trailing-slash app URL'
  );
});
