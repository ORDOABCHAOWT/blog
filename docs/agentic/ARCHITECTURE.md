# Architecture

## Runtime Map

- Next.js App Router renders the public homepage, Markdown posts, CMS admin pages, and API routes.
- `posts/*.md` is the source of truth for blog content. `src/lib/posts.ts` parses it synchronously with `gray-matter`.
- Admin pages call `/api/posts` to create, edit, and delete local Markdown files.
- Image uploads flow from `ImageUploader` to `/api/upload`, then to Alibaba OSS.
- `/api/deploy` stages repository changes, commits, and pushes `main`, which may trigger Vercel deployment.
- macOS helper scripts start and stop the local CMS through a user LaunchAgent.

## Boundaries

- Public reading behavior belongs in public pages/components and post parsing.
- CMS behavior belongs under `src/app/admin/`.
- Filesystem mutation belongs only in post API routes.
- External object-storage behavior belongs in `src/lib/oss.ts` and `/api/upload`.
- Process execution belongs only in `/api/deploy` and must use parameterized `execFile`.
- Markdown posts and public assets are user content, not implementation scratch space.

## Known Architectural Exceptions

- Next production builds currently skip TypeScript errors.
- Admin and API routes are intentionally unauthenticated according to an existing regression test.
- Deploy API stages broadly and can push all current changes.

Changing any exception requires a dedicated plan and explicit user approval.
