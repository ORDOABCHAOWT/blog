import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const appCreator = fs.readFileSync(
  new URL('../create-automator-app.sh', import.meta.url),
  'utf8'
);
const starter = fs.readFileSync(
  new URL('../start-blog-cms.sh', import.meta.url),
  'utf8'
);

test('Automator app creator uses the current project directory instead of an old absolute path', () => {
  assert.doesNotMatch(
    appCreator,
    /\/Users\/whitney\/Downloads\/minimal-blog/,
    'Desktop app generation must not point at the old project location'
  );
  assert.match(
    appCreator,
    /SCRIPT_DIR=/,
    'Expected the app creator to derive paths from its own location'
  );
});

test('Automator app creator writes a command-file fallback when app creation fails', () => {
  assert.match(
    appCreator,
    /COMMAND_PATH=/,
    'Expected a desktop .command fallback path'
  );
  assert.match(
    appCreator,
    /chmod \+x "\$COMMAND_PATH"/,
    'Expected the fallback command file to be executable'
  );
});

test('CMS starter uses the local loopback address and LaunchAgent startup path', () => {
  assert.match(
    starter,
    /open_admin_url/,
    'Expected a helper that handles browser-opening failures'
  );
  assert.match(
    starter,
    /http:\/\/127\.0\.0\.1:\$\{PORT\}\/admin/,
    'Expected the admin URL to use the explicit IPv4 loopback address'
  );
  assert.match(
    starter,
    /LAUNCH_LABEL="com\.taffy\.blogcms\.server"/,
    'Expected the starter to use the CMS LaunchAgent instead of direct nohup startup'
  );
  assert.doesNotMatch(
    starter,
    /nohup npm run dev/,
    'Expected the starter to avoid nohup because GUI app launches are restricted by macOS System Policy'
  );
});
