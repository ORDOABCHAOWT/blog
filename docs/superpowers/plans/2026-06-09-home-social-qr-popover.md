# Homepage Social QR Popover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an accessible WeChat QR-code popover and ensure the GitHub icon opens the requested profile without changing the homepage layout.

**Architecture:** Keep social-link rendering inside `HomeExperience`. Normal links remain data-driven anchors; WeChat becomes a button/popover pair with local pinned state and document-level close handlers. CSS owns hover/focus reveal and viewport-safe placement, while React owns click pinning, outside click, and Escape.

**Tech Stack:** Next.js 16, React 19, TypeScript, CSS, Node built-in test runner

---

### Task 1: Define The Social Popover Contract

**Files:**
- Modify: `tests/home-social-links-regression.test.mjs`

- [ ] **Step 1: Add failing assertions**

Assert that the homepage source contains the requested GitHub URL, WeChat button semantics, `aria-expanded`, popover hooks, outside-click/Escape handling, and the stable QR asset path. Assert that CSS contains hover/focus/open-state reveal and mobile alignment hooks.

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `node --test tests/home-social-links-regression.test.mjs`

Expected: FAIL because the WeChat popover hooks and QR asset path do not exist yet.

### Task 2: Implement The Approved Interaction

**Files:**
- Modify: `src/components/HomeExperience.tsx`
- Modify: `src/app/globals.css`
- Create: `public/wechat-official-account-qr.jpg`

- [ ] **Step 1: Copy the approved QR image**

Copy `/Users/whitney/Downloads/qrcode_for_gh_b8a56ea26e5e_430.jpg` to `public/wechat-official-account-qr.jpg`.

- [ ] **Step 2: Implement minimal React behavior**

Add pinned state, a WeChat wrapper/button/popover, outside-pointer close, and Escape close. Preserve the GitHub anchor and portfolio anchor.

- [ ] **Step 3: Implement the approved visual behavior**

Add a compact QR popover above the icon with white background, thin neutral border, restrained shadow, pointer, hover/focus/open reveal, and narrow-screen left alignment.

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `node --test tests/home-social-links-regression.test.mjs`

Expected: PASS.

### Task 3: Verify The Feature

**Files:**
- Modify only if verification finds a feature-specific defect.

- [ ] **Step 1: Run project checks**

Run: `npm run check`

Expected: repository validation, agent docs audit, and production build pass.

- [ ] **Step 2: Run diagnostic tests**

Run: `npm test`

Expected: new social-link tests pass; the pre-existing missing `posts/aboutMyProjects.md` failure may remain.

- [ ] **Step 3: Verify in browser**

Start the local app, then verify desktop hover/focus/click, outside click, Escape, mobile click placement, and the GitHub destination.
