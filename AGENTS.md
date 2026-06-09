# AGENTS.md

## Repository Map

- `src/app/`: Next.js App Router pages, admin CMS, and server API routes.
- `src/components/`: interactive and visual React components.
- `src/lib/`: post parsing/formatting and Alibaba OSS integration.
- `posts/`: Markdown content and frontmatter; edits change the published blog.
- `public/`: stable public assets.
- `tests/`: source-level regression tests for product and visual decisions.
- `start-blog-cms.sh`, `stop-blog-cms.sh`, `create-automator-app.sh`: macOS local CMS operations.
- `docs/superpowers/`: historical designs and implementation plans.
- `docs/agentic/`: current architecture, product, quality, reliability, security, and maintenance guidance.

## Commands

- Reliable gate: `npm run check`
- Production build: `npm run build`
- Repository constraints: `npm run validate`
- Agent documentation audit: `npm run check:agentic`
- Full regression diagnostics: `npm test`
- Type diagnostics: `npm run typecheck`
- Lint diagnostics: `npm run lint`
- Local development: `npm run dev`

`npm test`, `npm run typecheck`, and `npm run lint` currently expose documented baseline debt. Do not hide or weaken those findings to make them green.

## Non-Negotiable Boundaries

- Do not edit `posts/` unless the user explicitly requests content changes.
- Treat `/api/deploy` as destructive: it stages, commits, and pushes repository changes. Do not invoke it during routine verification.
- Treat `/api/posts` write/delete operations and `/api/upload` as destructive or externally visible.
- Never expose or commit `.env*`, OSS credentials, cookies, tokens, or private deployment details.
- Preserve slug allowlist validation, upload MIME/extension/size checks, and parameterized `execFile` deployment commands.
- The admin/API surface is currently intentionally unauthenticated by regression test. Do not silently add or remove authentication; require an explicit security/product decision.
- `next.config.ts` currently skips TypeScript build errors. Do not remove that escape hatch until the existing type errors are fixed in a dedicated task.

## Working Agreements

- Read `docs/agentic/INDEX.md` before non-trivial work.
- Follow existing design-regression tests when changing visuals or interaction.
- Add a focused regression test for stable user-visible decisions.
- For UI changes, run the app and verify desktop/mobile routes with a browser.
- Keep API input validation at filesystem, process, upload, and external-service boundaries.
- Convert repeated review feedback into tests, lint rules, repository validation, or docs.

## Done Criteria

- `npm run check` passes.
- Relevant diagnostic commands were run and existing/new failures are distinguished.
- No unintended changes to posts, credentials, deploy behavior, or external uploads.
- User-visible changes have browser verification notes.
- Durable decisions and newly discovered risks are reflected under `docs/agentic/`.
