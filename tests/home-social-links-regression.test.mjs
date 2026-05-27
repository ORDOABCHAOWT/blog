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
