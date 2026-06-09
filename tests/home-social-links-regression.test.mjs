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

  for (const label of ['微信公众号', 'GitHub', '个人作品集']) {
    assert.match(
      homeExperience,
      new RegExp(`label: '${label}'`),
      `Expected a social link for ${label}`
    );
  }

  assert.doesNotMatch(
    homeExperience,
    /label: '小红书'/,
    'Expected the Xiaohongshu social link to be removed from the homepage'
  );
  assert.doesNotMatch(
    homeExperience,
    /\/globe\.svg/,
    'Expected the portfolio link to use the 作 glyph instead of the globe icon'
  );
  assert.match(
    homeExperience,
    /glyph: '作'/,
    'Expected the portfolio link to render the 作 glyph'
  );

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
    /\.home-social-glyph\s*{/,
    'Expected custom glyph styling for the portfolio link'
  );
  assert.match(
    globalsCss,
    /\.sr-only\s*{/,
    'Expected a reusable screen-reader-only utility'
  );
});

test('WeChat social icon reveals an accessible QR popover and GitHub opens the requested profile', () => {
  assert.match(
    homeExperience,
    /href: 'https:\/\/github\.com\/ORDOABCHAOWT'/,
    'Expected the GitHub icon to open the requested profile'
  );
  assert.match(
    homeExperience,
    /className="home-social-wechat-trigger"/,
    'Expected WeChat to render as an interactive button instead of navigating to the QR image'
  );
  assert.match(
    homeExperience,
    /aria-expanded=\{isWechatPinned\}/,
    'Expected the WeChat trigger to expose pinned popover state'
  );
  assert.match(
    homeExperience,
    /className="home-social-qr-popover"/,
    'Expected a dedicated QR popover'
  );
  assert.match(
    homeExperience,
    /src="\/wechat-official-account-qr\.jpg"/,
    'Expected the approved QR asset to use a stable public path'
  );
  assert.match(
    homeExperience,
    /event\.key === 'Escape'/,
    'Expected Escape to close a pinned QR popover'
  );
  assert.match(
    homeExperience,
    /wechatPopoverRef\.current\?\.contains\(event\.target as Node\)/,
    'Expected outside pointer interaction to close a pinned QR popover'
  );

  assert.match(
    globalsCss,
    /\.home-social-wechat:hover \.home-social-qr-popover/,
    'Expected pointer hover to reveal the QR popover'
  );
  assert.match(
    globalsCss,
    /\.home-social-wechat:has\(\.home-social-wechat-trigger:focus-visible\) \.home-social-qr-popover/,
    'Expected keyboard-visible focus to reveal the QR popover'
  );
  assert.doesNotMatch(
    globalsCss,
    /\.home-social-wechat:focus-within \.home-social-qr-popover/,
    'Mouse focus must not keep the QR popover visible after click-to-close'
  );
  assert.match(
    globalsCss,
    /\.home-social-wechat\.is-open \.home-social-qr-popover/,
    'Expected click-pinned state to reveal the QR popover'
  );
  assert.match(
    globalsCss,
    /@media \(max-width: 680px\)[\s\S]*?\.home-social-qr-popover\s*{[^}]*left:\s*0;/,
    'Expected narrow screens to keep the QR popover inside the viewport'
  );
});

test('homepage social links sit just above the bottom of the hero art on desktop', () => {
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
    'Expected the social row to anchor near the bottom of the identity panel'
  );
  assert.match(
    globalsCss,
    /\.home-social-links\s*{[^}]*transform\s*:\s*translateY\(-1\.1rem\);/s,
    'Expected the social row to be lifted slightly from the bottom edge'
  );
  assert.match(
    globalsCss,
    /@media \(max-width: 960px\)[\s\S]*?\.identity-panel\s*{[^}]*min-height\s*:\s*auto;/,
    'Expected stacked layouts to return the identity panel to natural height'
  );
});

test('homepage keeps a light neutral page background', () => {
  assert.match(
    globalsCss,
    /--site-background\s*:\s*#f7f7f5;/,
    'Expected the site background token to stay light and neutral'
  );
  assert.match(
    globalsCss,
    /linear-gradient\(180deg,\s*#fbfbfa 0%,\s*var\(--site-background\) 52%,\s*#f3f3f1 100%\)/,
    'Expected the homepage background gradient to use neutral near-white stops'
  );
  assert.doesNotMatch(
    globalsCss,
    /#f0e8db/,
    'Expected the visible page background not to use the darker warm beige stop'
  );
});
