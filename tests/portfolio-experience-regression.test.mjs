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
const portfolioTerminal = fs.readFileSync(
  new URL('../src/components/PortfolioTerminal.tsx', import.meta.url),
  'utf8'
);
const portfolioStarfield = fs.readFileSync(
  new URL('../src/components/PortfolioStarfield.tsx', import.meta.url),
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

test('portfolio page lists four categories on the screen of a vintage computer', () => {
  for (const [dir, label] of [
    ['vibe-coding/', 'Vibe coding'],
    ['graphic-design/', '平面设计'],
    ['video/', '视频'],
    ['social-media/', '新媒体运营'],
  ]) {
    assert.match(
      portfolioComponent,
      new RegExp(`dir: '${dir}', label: '${label}'`),
      `Expected the ${label} category as ${dir}`
    );
  }
  assert.match(
    portfolioComponent,
    /<PortfolioTerminal entries=\{portfolioCategories\} badge="PORTFOLIO" \/>/,
    'Expected the categories on the computer screen, with PORTFOLIO on its badge'
  );
  assert.match(
    portfolioComponent,
    /<h1 id="portfolio-title" className="sr-only">/,
    'Expected the page title to stay available to search engines and screen readers while hidden'
  );
  assert.match(
    portfolioTerminal,
    /ls -l/,
    'Expected the screen to show the categories as ls -l output'
  );
  assert.match(
    portfolioTerminal,
    /type="button"/,
    'Expected unpublished categories to stay native keyboard-accessible buttons'
  );
  assert.match(
    portfolioTerminal,
    /作品整理中/,
    'Expected unpublished categories to answer on the screen instead of navigating'
  );
  assert.match(
    portfolioTerminal,
    /ArrowDown[\s\S]*Enter[\s\S]*Escape/,
    'Expected arrow keys, Enter and Escape to work on the focused screen'
  );
  assert.match(
    globalsCss,
    /animation: portfolio-terminal-type/,
    'Expected the command to type itself through CSS, so the server-rendered list never flashes'
  );
  assert.match(
    globalsCss,
    /\.portfolio-terminal-row\.is-selected\s*{\s*background: var\(--mac-screen-ink\);/,
    'Expected the selected row to be inverted like the first Macs'
  );
  assert.doesNotMatch(
    portfolioComponent,
    /SELECTED WORKS|Word Notebook|在不同媒介中|portfolio-category-detail/,
    'Expected no header tagline, project link, introduction, or detail copy'
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

test('portfolio pages share an ASCII starfield with the Milky Way behind them', () => {
  assert.match(
    portfolioComponent,
    /<PortfolioStarfield \/>/,
    'Expected the starfield behind the computer'
  );
  assert.doesNotMatch(
    portfolioComponent + globalsCss,
    /PortfolioCodeFlow|portfolio-code-flow/,
    'Expected the old digit flow to be gone'
  );
  assert.match(
    portfolioStarfield,
    /The Milky Way runs from lower left to upper right, split along its length by a dark dust lane/,
    'Expected a Milky Way band with a dust lane'
  );
  assert.match(
    portfolioStarfield,
    /A shooting star every few seconds/,
    'Expected an occasional shooting star'
  );
  assert.match(
    portfolioStarfield,
    /prefers-reduced-motion: reduce/,
    'Expected a still sky for visitors who reduce motion'
  );
  assert.match(
    portfolioStarfield,
    /IntersectionObserver/,
    'Expected the sky to stop drawing while it is off screen'
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

test('Vibe coding opens its own project index with its work pages', () => {
  const vibePage = fs.readFileSync(
    new URL('../src/app/vibe-coding/page.tsx', import.meta.url),
    'utf8'
  );
  const officeAssistant = fs.readFileSync(
    new URL('../public/vibe-coding/office-assistant.html', import.meta.url),
    'utf8'
  );
  assert.match(
    portfolioComponent,
    /label: 'Vibe coding'.*href: '\/vibe-coding'/,
    'Expected the Vibe coding category to link to its index page'
  );
  assert.match(
    vibePage,
    /href: '\/vibe-coding\/office-assistant'/,
    'Expected the index to list the office assistant page'
  );
  assert.match(
    vibePage,
    /<PortfolioStarfield \/>/,
    'Expected the index to share the portfolio shell and starfield'
  );
  assert.match(
    nextConfig,
    /source: '\/vibe-coding\/office-assistant', destination: '\/vibe-coding\/office-assistant\.html'/,
    'Expected the work page to be served without its .html extension'
  );
  for (const slug of ['chordlens', 'word-notebook', 'office-assistant', 'glance']) {
    const page = fs.readFileSync(
      new URL(`../public/vibe-coding/${slug}.html`, import.meta.url),
      'utf8'
    );
    assert.match(
      vibePage,
      new RegExp(`href: '/vibe-coding/${slug}'`),
      `Expected the index to list ${slug}`
    );
    assert.match(
      nextConfig,
      new RegExp(`source: '/vibe-coding/${slug}', destination: '/vibe-coding/${slug}\\.html'`),
      `Expected ${slug} to be served without its .html extension`
    );
    assert.match(
      page,
      /href="https:\/\/www\.taffy\.wang\/vibe-coding">← 返回 Vibe coding/,
      `Expected ${slug} to lead back to the Vibe coding index`
    );
  }
});

test('the homepage reaches the portfolio by flying through the stars', () => {
  const pageTransition = fs.readFileSync(new URL('../src/components/PageTransition.tsx', import.meta.url), 'utf8');
  const warp = fs.readFileSync(new URL('../src/components/portfolio-warp.ts', import.meta.url), 'utf8');
  assert.match(
    pageTransition,
    /url\.pathname === '\/posts\/aboutMyProjects' && window\.location\.pathname === '\/'/,
    'Expected only the homepage link to the portfolio to start the warp'
  );
  assert.match(
    pageTransition,
    /if \(reduceMotion\) \{\s*router\.push\(fullPath\);\s*return;\s*\}[\s\S]*playPortfolioWarp/,
    'Expected visitors who reduce motion to skip the warp'
  );
  assert.match(warp, /setAttribute\(PORTFOLIO_WARP_ATTRIBUTE/, 'Expected the warp to tell the portfolio page to wait for it');
  assert.match(warp, /Navigation must never wait on the animation/, 'Expected navigation to happen even if frames stop');
  assert.match(
    globalsCss,
    /animation: portfolio-mac-arrive[\s\S]*\[data-portfolio-warp\] \.portfolio-mac \{\s*animation-delay/,
    'Expected the computer to grow in, later when it arrives through the warp'
  );
  assert.match(
    globalsCss,
    /\[data-portfolio-warp\] \.portfolio-terminal-command \{\s*animation-delay: 1\.9s;/,
    'Expected the screen to type only once the computer has arrived'
  );
});

test('Vibe coding shows its projects as a gallery of covers', () => {
  const vibePage = fs.readFileSync(new URL('../src/app/vibe-coding/page.tsx', import.meta.url), 'utf8');
  assert.match(vibePage, /className="vibe-gallery"/, 'Expected a gallery instead of a list');
  for (const slug of ['chordlens', 'word-notebook', 'office-assistant', 'glance']) {
    assert.match(vibePage, new RegExp(`cover: '/vibe-coding/covers/${slug}\\.webp'`), `Expected a cover for ${slug}`);
    assert.ok(
      fs.existsSync(new URL(`../public/vibe-coding/covers/${slug}.webp`, import.meta.url)),
      `Expected the ${slug} cover file`
    );
  }
  assert.match(
    globalsCss,
    /\.vibe-gallery \{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/,
    'Expected four equal covers, two to a row'
  );
  assert.doesNotMatch(vibePage + globalsCss, /vibe-project/, 'Expected the old list to be gone');
});


test('Vibe coding tiles reveal stack and a learn-more action for hover, focus and touch', () => {
  const page = fs.readFileSync(new URL('../src/app/vibe-coding/page.tsx', import.meta.url), 'utf8');
  assert.equal((page.match(/stack: '/g) || []).length, 4);
  assert.match(page, /vibe-card-stack/);
  assert.match(page, /Learn more/);
  assert.match(globalsCss, /\.vibe-card:hover \.vibe-card-cover,[\s\S]*?opacity: 0;/);
  assert.match(globalsCss, /\.vibe-card:focus-visible \.vibe-card-meta\s*\{\s*opacity: 1;/);
  assert.match(globalsCss, /@media \(hover: none\), \(pointer: coarse\)/);
  assert.match(globalsCss, /\.vibe-gallery-section\s*\{\s*animation: none;/);
});


test('graphic design publishes the approved gallery and retains continuous phone reading', () => {
  const page = fs.readFileSync(new URL('../public/graphic-design/index.html', import.meta.url), 'utf8');
  assert.match(portfolioComponent, /href: '\/graphic-design', staticPage: true/);
  assert.match(portfolioTerminal, /entry.href && entry.staticPage\) window.location.assign\(entry.href\)/);
  assert.match(nextConfig, /source: '\/graphic-design', destination: '\/graphic-design\/index.html'/);
  assert.match(page, /story-complete.webp/);
  assert.match(page, /shots-iphone17pro-deep-blue.png/);
  assert.doesNotMatch(page, /data-story|expand-story|127\.0\.0\.1|localhost/);
  const galleryCss = fs.readFileSync(new URL('../public/graphic-design/style.css', import.meta.url), 'utf8');
  assert.match(galleryCss, /\.story-continuous \.story-scroll[^}]*height:100%/);
  assert.equal((page.match(/class="story-scroll"/g) || []).length, 2);
  for (const [, asset] of page.matchAll(/src="(\/graphic-design\/assets\/[^"]+)"/g)) {
    assert.ok(fs.existsSync(new URL(`../public${asset}`, import.meta.url)), `Missing gallery asset: ${asset}`);
  }
});
