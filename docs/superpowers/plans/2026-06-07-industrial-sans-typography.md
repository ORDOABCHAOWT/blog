# Industrial Sans Typography Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply IBM Plex Sans and Noto Sans SC across the blog and CMS, with wider tracking and JetBrains Mono metadata.

**Architecture:** Load the three Google fonts in the root layout and expose them as CSS variables. Centralize typography and tracking in global CSS variables, then make shared selectors consume those variables so blog and CMS remain synchronized.

**Tech Stack:** Next.js App Router, next/font/google, CSS, Node.js test runner

---

### Task 1: Protect the typography contract

**Files:**
- Create: `tests/typography-regression.test.mjs`

- [ ] Assert the layout loads IBM Plex Sans, Noto Sans SC, and JetBrains Mono without Fraunces.
- [ ] Assert global CSS defines sans-serif display/body stacks and the approved tracking tokens.
- [ ] Assert date and metadata selectors use the mono stack.
- [ ] Run `node --test tests/typography-regression.test.mjs` and confirm it fails.

### Task 2: Implement shared typography

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/components/MarkdownEditor.tsx`
- Modify: `src/components/ImageUploader.tsx`

- [ ] Load IBM Plex Sans and Noto Sans SC as root CSS variables.
- [ ] Replace serif stacks with the shared sans stack.
- [ ] Apply heading, body, and metadata tracking tokens.
- [ ] Keep dates and indices in JetBrains Mono.
- [ ] Run the typography regression test and confirm it passes.

### Task 3: Verify the application

- [ ] Run relevant regression tests.
- [ ] Run `npm run build`.
- [ ] Inspect the homepage, an article page, and CMS in the browser.
