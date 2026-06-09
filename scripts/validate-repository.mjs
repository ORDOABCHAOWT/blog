import assert from 'node:assert/strict';
import fs from 'node:fs';

function read(relativePath) {
  return fs.readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');
}

const gitignore = read('.gitignore');
const packageJson = JSON.parse(read('package.json'));
const nextConfig = read('next.config.ts');
const deployRoute = read('src/app/api/deploy/route.ts');
const postsRoute = read('src/app/api/posts/route.ts');
const postRoute = read('src/app/api/posts/[slug]/route.ts');
const uploadRoute = read('src/app/api/upload/route.ts');

for (const command of ['check', 'validate', 'check:agentic', 'build', 'test', 'typecheck', 'lint']) {
  assert.ok(packageJson.scripts?.[command], `package.json must define npm run ${command}`);
}

assert.match(gitignore, /^\.env\*$/m, 'all environment files must remain ignored');
assert.match(gitignore, /^\/node_modules$/m, 'node_modules must remain ignored');
assert.match(gitignore, /^\/\.next\/$/m, '.next output must remain ignored');

assert.match(deployRoute, /execFile/, 'deploy route must keep parameterized process execution');
assert.doesNotMatch(deployRoute, /\bexec\s*\(/, 'deploy route must not use shell-interpolated exec');
assert.doesNotMatch(deployRoute, /\bshell\s*:\s*true/, 'deploy route must not enable a command shell');

for (const [name, source] of [
  ['src/app/api/posts/route.ts', postsRoute],
  ['src/app/api/posts/[slug]/route.ts', postRoute],
]) {
  assert.match(source, /\^\[a-zA-Z0-9_-\]\+\$/, `${name} must keep slug allowlist validation`);
}

assert.match(uploadRoute, /10 \* 1024 \* 1024/, 'upload route must retain the 10MB size limit');
assert.match(uploadRoute, /image\/webp/, 'upload route must retain explicit image MIME allowlisting');
assert.doesNotMatch(uploadRoute, /image\/svg\+xml/, 'upload route must not allow SVG uploads');

assert.match(
  nextConfig,
  /ignoreBuildErrors:\s*true/,
  'known baseline expects Next build to skip existing TypeScript errors; change only with a dedicated cleanup'
);

console.log('Repository safety and architecture constraints are valid.');
