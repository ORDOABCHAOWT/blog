# Homepage Social QR Popover Design

## Goal

Make the homepage social icons functional without changing the existing hero layout:

- WeChat shows the provided official-account QR code in a small popover.
- GitHub opens `https://github.com/ORDOABCHAOWT` in a new tab.
- The portfolio icon keeps its existing behavior.

## Interaction

### WeChat

- On pointer devices, hovering or focusing the WeChat icon reveals the QR popover.
- Clicking the WeChat icon pins or closes the popover.
- Clicking outside the popover or pressing `Escape` closes a pinned popover.
- On touch devices, clicking toggles the popover because hover is unavailable.
- The trigger exposes `aria-expanded`; the popover has an accessible label.

### GitHub

- Clicking the GitHub icon opens the requested GitHub profile in a new tab with `noopener noreferrer`.

## Visual Design

- Preserve the existing social-icon size, spacing, muted color, and hover movement.
- Position the QR popover above the WeChat icon.
- Use a compact white surface, thin neutral border, restrained shadow, short caption, and a small pointer aimed at the icon.
- Keep the QR image square and large enough to scan.
- On narrow screens, align the popover to the left edge so it remains inside the viewport.

## Implementation

- Copy the provided QR image into `public/` with a stable descriptive filename.
- Keep the existing social-link data for normal links.
- Render WeChat as an interactive button/popover pair because it no longer navigates directly.
- Manage pinned state inside `HomeExperience`.
- Add document-level outside-click and `Escape` handling only while the popover is pinned.
- Add focused regression tests covering the GitHub URL, QR asset, trigger semantics, and popover CSS hooks.

## Verification

- Run the relevant social-link regression test.
- Run `npm run check`.
- Verify desktop hover, focus, click pinning, outside click, and `Escape`.
- Verify mobile click toggling and viewport-safe placement.
- Confirm GitHub opens the requested profile.
