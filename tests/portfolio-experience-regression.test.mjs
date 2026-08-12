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

test('portfolio page keeps the Figma cover structure and scroll transition hooks', () => {
  assert.match(
    globalsCss,
    /\.portfolio-cover-stage\s*{/,
    'Expected the 16:9 cover stage CSS'
  );
  assert.match(
    globalsCss,
    /\.portfolio-cover-image\s*[,{\s]/,
    'Expected the exported Figma cover image CSS'
  );
  assert.match(
    globalsCss,
    /\.portfolio-cover-fragment\.is-w\s*{/,
    'Expected letter-level cover fragments for scroll scatter'
  );
  assert.match(
    portfolioComponent,
    /\/portfolio-letters\/\$\{fragment\}\.png/,
    'Expected the scroll transition to use transparent letter assets'
  );
  assert.match(
    globalsCss,
    /--letter-left\s*:/,
    'Expected letter fragments to be positioned from the exported cover coordinates'
  );
  assert.match(
    globalsCss,
    /@keyframes portfolio-letter-forward/,
    'Expected Wang Teng letters to move forward during the transition'
  );
  assert.match(
    globalsCss,
    /animation-timeline\s*:\s*scroll\(root\);/,
    'Expected scroll-linked animation for the cover pieces'
  );
  assert.match(
    globalsCss,
    /\.portfolio-profile\s*{/,
    'Expected a follow-up profile section after the cover'
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
    /PORTFOLIO_DESCRIPTION\s*=\s*\n?\s*'平面设计、新媒体运营、媒介策划与品牌传播项目合集'/,
    'Expected a portfolio-specific description'
  );
  assert.match(
    postPage,
    /getAllPostSlugs\(\), PORTFOLIO_SLUG/,
    'Expected static params to include the reserved portfolio route without a Markdown file'
  );
});

test('portfolio page presents Word Notebook as a responsive project entry', () => {
  assert.match(
    portfolioComponent,
    /id="selected-projects"/,
    'Expected a stable anchor for the projects section'
  );
  assert.match(
    portfolioComponent,
    /Word Notebook/,
    'Expected the Word Notebook project title'
  );
  assert.match(
    portfolioComponent,
    /https:\/\/www\.taffy\.wang\/notebook\//,
    'Expected the project entry to use the mainland-friendly blog route'
  );
  assert.match(
    portfolioComponent,
    /aria-label="打开 Word Notebook 网页应用（新窗口）"/,
    'Expected an accessible external-link label'
  );
  assert.match(
    globalsCss,
    /\.portfolio-project-card\s*{/,
    'Expected the product-focused project card styling'
  );
  assert.match(
    globalsCss,
    /@media \(max-width: 900px\)[\s\S]*\.portfolio-project-card/,
    'Expected the project card to collapse for mobile screens'
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
