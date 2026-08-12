# Security

## Current Reality

- Admin pages and CMS API routes remain passwordless in the trusted local CMS.
- `src/lib/cms-access.ts` makes `/admin`, `/api/posts`, `/api/upload`, and `/api/deploy` unavailable on every Vercel deployment.
- Locally, `/api/posts` can write and delete Markdown files.
- Locally, `/api/upload` can upload to Alibaba OSS when credentials are available.
- Locally, `/api/deploy` can stage, commit, and push repository changes.

The CMS is intentionally local-only. Public deployment must not rely on Vercel filesystem or Git failures as an access-control mechanism.

## Required Constraints

- Never commit `.env*`, OSS credentials, cookies, tokens, or private deployment details.
- Keep Vercel Analytics credentials server-side. The local CMS may read an ignored environment token or the existing Vercel CLI login file, but must never expose either credential to client components, API responses, logs, or public deployments.
- Preserve slug allowlist validation before filesystem access.
- Preserve upload MIME type, extension, and 10MB size checks; continue blocking SVG.
- Keep deployment commands parameterized with `execFile`; never use shell-interpolated `exec`.
- Preserve the Vercel CMS guard in every admin page and CMS API route.
- Enable CMS capabilities only through the explicit loopback-bound `BLOG_CMS_LOCAL=1` development command.
- Require a fixed loopback `Origin` on every local CMS mutation before reading a body or invoking filesystem, OSS, Git, or process operations; never derive trust from `Host`.
- Preserve bounded request sizes and upstream timeouts on public Worker proxy routes.
- Do not invoke write, delete, upload, deploy, or credential-rotation actions during routine validation.

## Security Decision Gate

Adding remote authentication, exposing the CMS on any deployment, changing deploy behavior, widening upload types, or changing credential handling requires an explicit plan and user approval.
