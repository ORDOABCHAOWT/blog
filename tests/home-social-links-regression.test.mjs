import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const homeExperience = fs.readFileSync(
  new URL('../src/components/HomeExperience.tsx', import.meta.url),
  'utf8'
);
const globalsCss = fs.readFileSync(
  new URL('../src/app/globals.css', import.meta.url),
  'utf8'
);

test('homepage renders the requested social icon row', () => {
  assert.match(
    homeExperience,
    /const socialLinks(?::[^=]+)? = \[/,
    'Expected homepage social links to be declared in one editable list'
  );

  for (const label of ['微信公众号', '小红书', 'GitHub', '个人作品集']) {
    assert.match(
      homeExperience,
      new RegExp(`label: '${label}'`),
      `Expected a social link for ${label}`
    );
  }

  assert.match(
    homeExperience,
    /className="home-social-links"/,
    'Expected the social links to render in the hero identity panel'
  );
  assert.match(
    homeExperience,
    /target=\{link\.href\.startsWith\('http'\) \? '_blank' : undefined\}/,
    'Expected external social links to open in a new tab'
  );
});

test('homepage social links are icon-only but accessible', () => {
  assert.match(
    homeExperience,
    /aria-label=\{link\.label\}/,
    'Expected each icon link to expose an accessible label'
  );
  assert.match(
    homeExperience,
    /<span className="sr-only">\{link\.label\}<\/span>/,
    'Expected visible icon-only links to retain screen-reader text'
  );

  assert.match(
    globalsCss,
    /\.home-social-links\s*{/,
    'Expected social row styling'
  );
  assert.match(
    globalsCss,
    /\.home-social-link\s*{/,
    'Expected individual icon link styling'
  );
  assert.match(
    globalsCss,
    /\.sr-only\s*{/,
    'Expected a reusable screen-reader-only utility'
  );
});

test('homepage social links align to the bottom of the hero art on desktop', () => {
  assert.match(
    globalsCss,
    /--home-art-height\s*:\s*clamp\(19rem,\s*28vw,\s*24rem\)/,
    'Expected the hero art height to be shared as a CSS variable'
  );
  assert.match(
    globalsCss,
    /\.identity-panel\s*{[^}]*display\s*:\s*flex;[^}]*min-height\s*:\s*calc\(var\(--home-art-height\) \+ 0\.35rem\)/s,
    'Expected the identity panel to share the hero art height on desktop'
  );
  assert.match(
    globalsCss,
    /\.home-social-links\s*{[^}]*margin-top\s*:\s*auto;/s,
    'Expected the social row to sit at the bottom of the identity panel'
  );
  assert.match(
    globalsCss,
    /@media \(max-width: 960px\)[\s\S]*?\.identity-panel\s*{[^}]*min-height\s*:\s*auto;/,
    'Expected stacked layouts to return the identity panel to natural height'
  );
});
