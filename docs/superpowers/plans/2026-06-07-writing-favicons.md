# Writing Favicons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the public blog and CMS distinct, crisp Apple writing-emoji favicons.

**Architecture:** Use Next.js file-based metadata for the public blog SVG and explicit nested-layout metadata for the CMS SVG. A focused regression test protects the icon files and metadata references.

**Tech Stack:** Next.js App Router, SVG, Node.js test runner

---

### Task 1: Protect favicon routing with a regression test

**Files:**
- Create: `tests/favicon-regression.test.mjs`

- [ ] Write assertions for the blog SVG, removed legacy ICO, CMS SVG, and admin metadata path.
- [ ] Run `node --test tests/favicon-regression.test.mjs` and confirm it fails because the new icons do not exist.

### Task 2: Add the coordinated writing favicons

**Files:**
- Delete: `src/app/favicon.ico`
- Create: `src/app/icon.svg`
- Create: `public/admin-favicon.svg`
- Modify: `src/app/admin/layout.tsx`

- [ ] Add the feather and fountain-pen-nib SVGs using the system Apple emoji font.
- [ ] Point CMS metadata at `/admin-favicon.svg`.
- [ ] Run `node --test tests/favicon-regression.test.mjs` and confirm it passes.

### Task 3: Verify the application

- [ ] Run `node --test tests/*.test.mjs`.
- [ ] Run `npm run build`.
- [ ] Inspect the public blog and CMS in the browser.
