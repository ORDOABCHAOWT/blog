import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const globals = fs.readFileSync(
  new URL('../src/app/globals.css', import.meta.url),
  'utf8'
);
const markdownEditor = fs.readFileSync(
  new URL('../src/components/MarkdownEditor.tsx', import.meta.url),
  'utf8'
);

test('CMS uses native Mac typography and controls without changing its page structure', () => {
  assert.match(
    globals,
    /\.admin-container\s*\{[\s\S]*?font-family:\s*-apple-system,\s*BlinkMacSystemFont/,
    'Expected the CMS to lead with the native macOS font stack'
  );
  assert.match(
    globals,
    /\.admin-button\s*\{[\s\S]*?backdrop-filter:\s*blur\(18px\)\s+saturate\(145%\)/,
    'Expected interactive CMS controls to use the restrained Liquid Glass layer'
  );
  assert.match(
    globals,
    /\.admin-button-primary\s*\{[\s\S]*?background:\s*#0071e3/,
    'Expected the primary CMS action to use the macOS action blue'
  );
  assert.match(
    globals,
    /\.admin-button\s*\{[\s\S]*?text-transform:\s*none/,
    'Expected CMS controls to avoid the previous wide-tracked utility-label treatment'
  );
});

test('CMS content surfaces stay opaque while editor popovers use glass', () => {
  assert.match(
    globals,
    /\.admin-card\s*\{[\s\S]*?backdrop-filter:\s*none/,
    'Expected the article form to stay in the standard content-material layer'
  );
  assert.match(
    globals,
    /\.admin-table\s*\{[\s\S]*?backdrop-filter:\s*none/,
    'Expected the article list to remain a stable content surface'
  );
  assert.match(
    markdownEditor,
    /\.markdown-line-command-menu,[\s\S]*?backdrop-filter:\s*blur\(24px\)\s+saturate\(150%\)/,
    'Expected transient editor controls to carry the Liquid Glass treatment'
  );
  assert.match(
    markdownEditor,
    /\.markdown-editor \.EasyMDEContainer\s*\{[\s\S]*?border-radius:\s*16px/,
    'Expected the editor itself to remain a clearly bounded content surface'
  );
});

test('CMS visual motion respects the system accessibility preference', () => {
  assert.match(
    globals,
    /@media \(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\.admin-button/,
    'Expected CMS control motion to honor Reduce Motion'
  );
  assert.match(
    markdownEditor,
    /@media \(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\.markdown-following-plus/,
    'Expected editor control motion to honor Reduce Motion'
  );
});

test('CMS preserves field order while stacking the existing form grid on small screens', () => {
  assert.match(
    globals,
    /@media \(max-width:\s*720px\)\s*\{[\s\S]*?\.admin-card \.grid-cols-2\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/,
    'Expected the existing two-column form groups to stack without changing their markup'
  );
  assert.match(
    globals,
    /\.admin-table table\s*\{[\s\S]*?min-width:\s*760px/,
    'Expected the existing four-column article table to remain readable through horizontal scrolling'
  );
  assert.match(
    globals,
    /@media \(max-width:\s*720px\)\s*\{[\s\S]*?\.admin-editor-actions\s*\{[\s\S]*?position:\s*static/,
    'Expected the mobile save controls not to cover the writing surface'
  );
});
