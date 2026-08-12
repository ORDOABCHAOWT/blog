import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const cmsAccess = fs.readFileSync(
  new URL('../src/lib/cms-access.ts', import.meta.url),
  'utf8'
);

const mutationRoutes = [
  ['posts POST', '../src/app/api/posts/route.ts', 'POST'],
  ['post PUT', '../src/app/api/posts/[slug]/route.ts', 'PUT'],
  ['post DELETE', '../src/app/api/posts/[slug]/route.ts', 'DELETE'],
  ['upload POST', '../src/app/api/upload/route.ts', 'POST'],
  ['deploy POST', '../src/app/api/deploy/route.ts', 'POST'],
];

function getHandlerSource(source, method) {
  const start = source.indexOf(`export async function ${method}`);
  assert.notEqual(start, -1, `Expected ${method} handler to exist`);
  const nextHandler = source.indexOf('\nexport async function ', start + 1);
  return source.slice(start, nextHandler === -1 ? source.length : nextHandler);
}

test('CMS is fail-closed unless the loopback-only local mode is explicit', () => {
  assert.match(cmsAccess, /process\.env\.BLOG_CMS_LOCAL\s*===\s*['"]1['"]/);
  assert.match(cmsAccess, /process\.env\.VERCEL\s*!==\s*['"]1['"]/);

  const packageJson = JSON.parse(
    fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  );
  assert.match(packageJson.scripts.dev, /^BLOG_CMS_LOCAL=1 /);
  assert.match(packageJson.scripts.dev, /-H 127\.0\.0\.1/);
  assert.match(packageJson.scripts.start, /-H 127\.0\.0\.1/);
});

test('CMS mutation routes require a fixed loopback origin before doing work', () => {
  assert.match(cmsAccess, /new URL\(request\.url\)/);
  assert.match(cmsAccess, /http:\/\/127\.0\.0\.1:3000/);
  assert.match(cmsAccess, /http:\/\/localhost:3000/);
  assert.match(cmsAccess, /request\.headers\.get\(['"]origin['"]\)/);
  assert.doesNotMatch(cmsAccess, /request\.headers\.get\(['"]host['"]\)/);
  assert.match(cmsAccess, /!trustedLocalOrigins\.has\(requestUrl\.origin\)/);
  assert.match(cmsAccess, /requestOrigin\s*===\s*null/);
  assert.match(cmsAccess, /!trustedLocalOrigins\.has\(requestOrigin\)/);
  assert.match(cmsAccess, /status:\s*403/);

  for (const [label, relativePath, method] of mutationRoutes) {
    const source = fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8');
    const handler = getHandlerSource(source, method);
    const availabilityCheck = handler.indexOf('!isCmsAvailable()');
    const originCheck = handler.indexOf('cmsMutationOriginResponse(request)');

    assert.notEqual(originCheck, -1, `${label} must enforce the CMS origin guard`);
    assert.ok(
      availabilityCheck !== -1 && availabilityCheck < originCheck,
      `${label} must preserve the Vercel 404 boundary before the origin check`
    );
  }
});
