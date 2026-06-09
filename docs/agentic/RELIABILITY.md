# Reliability

## Local Operation

- `npm run dev` starts Next.js on `127.0.0.1`.
- `start-blog-cms.sh` and `stop-blog-cms.sh` operate a macOS user LaunchAgent on port 3000.
- `npm run build` validates that the production application can compile and generate pages.

## Failure Modes

- Missing or malformed Markdown posts can break static generation or regression tests.
- Missing OSS environment variables break uploads.
- Port 3000 or LaunchAgent state can break the desktop CMS launcher.
- `/api/deploy` can commit or push unintended working-tree changes.
- Next builds can succeed while independent type checking fails because type errors are skipped.

## Debugging

- Start with `npm run check`.
- Run diagnostics from `docs/agentic/QUALITY.md`.
- Inspect `.cms-server.log` for LaunchAgent startup problems.
- Inspect browser and Next terminal logs for route/API errors.
- Use `git status --short` before and after CMS/deploy-related work.

## Recovery

- Use Git history to restore posts or implementation changes.
- Rotate OSS credentials if exposed.
- Stop the CMS with `./stop-blog-cms.sh` if its LaunchAgent or port is stuck.
- Never use `/api/deploy` as a verification step.
