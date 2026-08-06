# Architecture

## Runtime Map

- Next.js App Router renders the public homepage, Markdown posts, CMS admin pages, and API routes.
- `posts/*.md` is the source of truth for blog content. `src/lib/posts.ts` parses it synchronously with `gray-matter`.
- Admin pages call `/api/posts` to create, edit, and delete local Markdown files.
- Image uploads flow from `ImageUploader` to `/api/upload`, then to Alibaba OSS.
- `/api/deploy` stages repository changes, commits, and pushes `main`, which may trigger Vercel deployment.
- The root layout loads Vercel Web Analytics on every route so public deployments report anonymized page views and visitor metadata to the project's Vercel dashboard.
- The local-only CMS dashboard calls `/api/analytics`, which reads aggregated traffic metrics from Vercel's official Web Analytics API with a server-side local access token.
- macOS helper scripts start and stop the local CMS through a user LaunchAgent.

## Boundaries

- Public reading behavior belongs in public pages/components and post parsing.
- CMS behavior belongs under `src/app/admin/`.
- `src/lib/cms-access.ts` keeps all CMS pages and APIs local-only by returning 404 on Vercel deployments.
- Filesystem mutation belongs only in post API routes.
- External object-storage behavior belongs in `src/lib/oss.ts` and `/api/upload`.
- External traffic analytics use the official `@vercel/analytics` component for collection and Vercel's official Web Analytics API for the local CMS dashboard.
- The server-side analytics adapter prefers `VERCEL_ANALYTICS_TOKEN` from an ignored local environment file and otherwise reuses the existing Vercel CLI login file. Neither credential path may be exposed through `NEXT_PUBLIC_*` variables or API responses.
- Process execution belongs only in `/api/deploy` and must use parameterized `execFile`.
- Markdown posts and public assets are user content, not implementation scratch space.
- `/notebook/[[...path]]` is a narrowly scoped dynamic proxy to the Word Notebook Worker. It requests identity encoding and returns decoded text or explicit binary bytes so Vercel does not cache or drop the PWA response; it must never claim the blog's `/api/*` routes.
- `/japanese/[[...path]]` uses the same decoded, no-cache proxy boundary for the static Japanese textbook and its PWA assets.
- `/blood-pressure/[[...path]]` proxies the family blood-pressure PWA, its scoped assets, and its GET/POST/PATCH/PUT/DELETE sync API to the dedicated Cloudflare Worker without claiming the blog's root `/api/*` routes.
- All three Worker proxies reject declared request bodies larger than 4MB and abort upstream fetches after 30 seconds.

## Known Architectural Exceptions

- Next production builds currently skip TypeScript errors.
- Local CMS routes are intentionally passwordless and unavailable on Vercel.
- Deploy API stages broadly and can push all current changes.

Changing any exception requires a dedicated plan and explicit user approval.
