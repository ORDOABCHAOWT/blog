# Product

## Purpose

Provide a personal editorial blog, portfolio experience, and locally operated CMS for writing, image upload, and one-click Git/Vercel publishing.

## Core Workflows

- Readers browse the homepage, open posts, navigate adjacent articles, and view the portfolio experience.
- The owner uses `/admin` to list, create, edit, and delete Markdown posts.
- The owner uploads compressed images to OSS.
- The owner can invoke one-click deployment, which commits and pushes repository changes.

## Stable Product Decisions

- Blog and CMS share the same visual palette.
- Homepage uses the Wayfinder hero, neutral light background, approved social links, and portrait avatar.
- Route transitions use grayscale `0/1` ash rather than colored bloom effects.
- The portfolio post uses a dedicated portfolio experience.
- The portfolio experience ends with a responsive selected-projects section;
  each project uses a large, accessible product card with a visual interface preview.
- Word Notebook is exposed through the scoped `/notebook/` Vercel rewrite so readers
  do not need to connect to `workers.dev` directly; the proxy must not claim `/api/*`.
- Admin currently opens without a Basic Auth prompt.

## Acceptance

- Preserve source-level regression tests for stable visual/product decisions.
- Do not change posts, deploy behavior, authentication posture, or OSS behavior without explicit user intent.
- Visible changes require browser verification on relevant public and admin routes.
