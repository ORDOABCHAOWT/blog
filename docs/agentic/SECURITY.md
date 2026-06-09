# Security

## Current Reality

- Admin pages and API routes are currently unauthenticated by explicit regression test.
- `/api/posts` can write and delete Markdown files.
- `/api/upload` can upload to Alibaba OSS when credentials are available.
- `/api/deploy` can stage, commit, and push repository changes.

This is suitable only for a trusted local environment unless authentication and deployment boundaries are deliberately redesigned. The root `SECURITY.md` contains older guidance that describes Basic Auth as implemented; treat that section as historical/aspirational until the code and regression tests change.

## Required Constraints

- Never commit `.env*`, OSS credentials, cookies, tokens, or private deployment details.
- Preserve slug allowlist validation before filesystem access.
- Preserve upload MIME type, extension, and 10MB size checks; continue blocking SVG.
- Keep deployment commands parameterized with `execFile`; never use shell-interpolated `exec`.
- Do not invoke write, delete, upload, deploy, or credential-rotation actions during routine validation.

## Security Decision Gate

Adding authentication, exposing the CMS remotely, changing deploy behavior, widening upload types, or changing credential handling requires an explicit plan and user approval.
