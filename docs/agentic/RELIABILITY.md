# Reliability

## Local Operation

- `npm run dev` starts Next.js on `127.0.0.1`.
- `start-blog-cms.sh` and `stop-blog-cms.sh` operate a macOS user LaunchAgent on port 3000.
- `npm run build` validates that the production application can compile and generate pages.
- Vercel deployments return 404 for the local-only CMS pages and APIs; local development and `next start` retain CMS access.

## Failure Modes

- Missing or malformed Markdown posts can break static generation or regression tests.
- Missing OSS environment variables break uploads.
- Port 3000 or LaunchAgent state can break the desktop CMS launcher.
- `/api/deploy` can commit or push unintended working-tree changes.
- Removing the Vercel CMS guard would expose destructive local-only routes on public deployments.
- Next builds can succeed while independent type checking fails because type errors are skipped.
- A static Vercel external rewrite can leave `/notebook/sw.js` stale after the Worker deploys. The dynamic notebook proxy disables caching and content encoding, then materializes text or binary responses before returning them.
- Vercel canonicalizes `/notebook/` to `/notebook`. The PWA manifest, registration scope, Worker header, and proxy `Service-Worker-Allowed` header must therefore all use `/notebook` so an installed app remains controlled and can update itself.
- Vercel also canonicalizes `/japanese/` to `/japanese`. Keep the Japanese manifest,
  service-worker registration, precache URL, proxy header, and public links on that
  no-trailing-slash scope.

## Debugging

- Start with `npm run check`.
- Run diagnostics from `docs/agentic/QUALITY.md`.
- Inspect `.cms-server.log` for LaunchAgent startup problems.
- Inspect browser and Next terminal logs for route/API errors.
- Use `git status --short` before and after CMS/deploy-related work.

## Recovery

- Use Git history to restore posts or implementation changes.
- If the installed notebook does not update, compare `/notebook/sw.js` with the direct Worker response and confirm both report the same cache version before troubleshooting the iPhone.
- If the installed Japanese textbook does not update, compare `/japanese/sw.js` with
  the direct Worker response and confirm both report the same `nihongo-core-*` cache version.
- Rotate OSS credentials if exposed.
- Stop the CMS with `./stop-blog-cms.sh` if its LaunchAgent or port is stuck.
- Never use `/api/deploy` as a verification step.
