import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root=new URL('../public/graphic-design/',import.meta.url);
const read=name=>fs.readFileSync(new URL(name,root),'utf8');

test('graphic portfolio resolves every static reference from its canonical extensionless URL',()=>{
  for(const name of ['index.html','public-exhibition.html','sports-design.html','u18-design.html']){
    const html=read(name);
    assert.doesNotMatch(html,/127\.0\.0\.1|localhost|Design preview|\/Users\/|\/Volumes\//);
    for(const [,url] of html.matchAll(/(?:src|href)="([^"#]+)"/g)){
      if(url.startsWith('https:')||url.startsWith('http:'))continue;
      assert.ok(url.startsWith('/'),`${name}: relative reference ${url} breaks canonical /graphic-design`);
      if(url.startsWith('/graphic-design/')&&url.split('#')[0].match(/\.[a-z]+$/)){
        assert.ok(fs.existsSync(new URL(`../public${url.split('#')[0]}`,import.meta.url)),`${name}: missing ${url}`);
      }
    }
  }
});

test('approved chapters keep sports separate from public communication and retain complete app/wallpaper sets',()=>{
  const home=read('index.html'),publicPage=read('public-exhibition.html'),sports=read('sports-design.html');
  for(const id of ['public','vi','sports','app-design','wallpapers'])assert.match(home,new RegExp(`id="${id}"`));
  assert.match(publicPage,/safety-328\.webp/);
  assert.match(publicPage,/gallery-report\.webp/);
  assert.match(home,/public-portal[^>]*href="\/graphic-design\/public-exhibition\.html"/);
  assert.match(publicPage,/href="\/graphic-design#public"/);
  assert.doesNotMatch(publicPage,/jiangdong-|id="events"/);
  for(const material of ['standee','gate','bags','flags','booth','banners'])assert.match(sports,new RegExp(`jiangdong-${material}\\.webp`));
  for(const id of ['home','payment','services','mine'])assert.ok(fs.existsSync(new URL(`assets/app-before-${id}.webp`,root)));
  for(const id of ['home','payment','services','mine','reading','repair','payment-study'])assert.ok(fs.existsSync(new URL(`assets/app-after-${id}.webp`,root)));
  for(const id of ['meter','service','inspection'])assert.ok(fs.existsSync(new URL(`assets/wallpaper-${id}.webp`,root)));
});

test('native mockup images scale responsively and wallpaper overlays do not add an extra strip',()=>{
  assert.match(read('style.css'),/\.sports-portal>img\{height:auto;/);
  const css=read('ui-work.css');
  assert.match(css,/\.mac-wallpaper\{[^}]*inset:0;[^}]*height:100%;[^}]*object-fit:cover;/);
  assert.match(read('index.html'),/shots-macbook-air-m2\.png/);
  assert.match(read('ascii.js'),/prefers-reduced-motion: reduce/);
  assert.ok(fs.existsSync(new URL('vendor/ascii-magic/LICENSE',root)));
});

test('U18 opens as its own sports case alongside the Jiangdong Cup',()=>{
  const home=read('index.html');
  const sports=home.match(/<section[^>]+id="sports"[^>]*>[\s\S]*?<\/section>/)?.[0] ?? '';
  assert.match(sports,/href="\/graphic-design\/sports-design\.html"/);
  assert.match(sports,/href="\/graphic-design\/u18-design\.html"/);
  const u18=read('u18-design.html');
  assert.doesNotMatch(u18,/full-schedule|dinner-wayfinding|pass-front|pass-back|lanyard|screen-[23]\.webp/);
  assert.match(u18,/final-schedule\.webp/);
  assert.match(u18,/screen-1\.webp/);
  for(const view of ['arena','arena-wide'])assert.ok(u18.includes(`assets/u18/${view}-render.webp`));
  assert.match(u18,/href="\/graphic-design#sports"/);
  for(const id of ['promotion','schedule','venue','broadcast']){
    assert.match(u18,new RegExp(`aria-labelledby="${id}"`));
  }
});

test('graphic design showcases the book spread and broadcast zoom',()=>{
  const home=read('index.html');
  assert.match(home,/data-poster="poster-gaokao"/);
  assert.equal((home.match(/data-book-page="/g) || []).length,5);
  assert.match(read('flipbook.js'),/brochure-cover-latest[^\n]*\n\s*\['brochure-design-10'/);
  assert.match(read('ascii.js'),/pieces\/rule-30\.js/);
  assert.equal((read('u18-design.html').match(/class="u18-zoom"/g) || []).length,3);
});

test('new media chapter pairs both scrollable phone stories with five poster designs', () => {
  const home = read('index.html');
  const chapter = home.match(/<section[^>]+id="campaign"[^>]*>[\s\S]*?<\/section>/)?.[0] ?? '';
  assert.match(home, /href="#campaign">新媒体视觉<\/a>/);
  assert.match(chapter, /id="campaign-title">新媒体视觉<\/h2>/);
  assert.equal((chapter.match(/class="story-scroll"/g) ?? []).length, 2);
  assert.equal((chapter.match(/class="media-poster zoom-work"/g) ?? []).length, 5);
});

test('portfolio chapters and navigation follow the same order', () => {
  const home = read('index.html');
  const nav = home.match(/<nav[^>]+class="chapter-nav">([\s\S]*?)<\/nav>/)?.[1] ?? '';
  const order = ['campaign', 'sports', 'posters', 'editorial', 'vi', 'public', 'app-design', 'wallpapers'];
  assert.deepEqual([...home.matchAll(/<section[^>]+id="([^"]+)"/g)].map(match => match[1]), order);
  assert.deepEqual([...nav.matchAll(/href="#([^"]+)"/g)].map(match => match[1]), order);
  assert.match(nav, /href="#sports">赛事及活动视觉<\/a>/);
  assert.match(home, /id="sports-title">赛事及活动视觉<\/h2>/);
});

test('annual meeting shows the design overview last and UI screenshots are static', () => {
  const home = read('index.html');
  const rail = home.match(/id="annual-meeting-rail"[^>]*>([\s\S]*?)<\/div>/)?.[1] ?? '';
  const order = [...rail.matchAll(/assets\/(annual-meeting[^"]*)\.webp/g)].map(match => match[1]);
  assert.deepEqual(order, ['annual-meeting-stage', 'annual-meeting-podium', 'annual-meeting']);

  const gallery = home.split('class="ui-screen-gallery">')[1]?.split('</section>')[0] ?? '';
  assert.equal((gallery.match(/<div class="ui-screen-card"><img [^>]+\/><span>[^<]+<\/span><\/div>/g) ?? []).length, 7);
  assert.doesNotMatch(gallery, /<a\b|<button\b|zoom-work|↗/);
  const css = read('ui-work.css');
  assert.match(css, /\.ui-screen-gallery\{[^}]*gap:24px/);
  assert.match(css, /\.ui-screen-gallery\{gap:18px/);
  assert.match(css, /\.ui-screen-card span\{[^}]*font-size:10px/);
  assert.match(css, /\.ui-screen-card span\{font-size:9px/);
});
