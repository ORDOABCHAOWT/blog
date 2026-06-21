# CMS Following Editor Tools Design

Date: 2026-06-21

## Context

The CMS currently uses EasyMDE/CodeMirror for Markdown editing. Its format toolbar is rendered at the top of the editor, and image upload is a separate form section above the Markdown editor. When the writer is working in the middle or lower part of a long article, formatting and image insertion require scrolling away from the active paragraph.

The reference interaction at `https://sspai.com/write` uses a CKEditor-style rich text editing surface. Observed behavior:

- The article body is a `contenteditable` editor.
- Focusing a paragraph reveals a block toolbar button beside the current paragraph.
- Clicking the block toolbar opens a balloon panel beside that paragraph with block insert actions such as image, multiple images, video, link card, code block, divider, app card, product card, and table.
- Text formatting is handled by contextual floating UI rather than a top-only toolbar.
- Global actions such as save, preview, publish, and article settings remain outside the body editing flow.

## Goal

Bring the useful parts of that editing experience into the local CMS while preserving the blog's Markdown source of truth.

The writer should be able to place the cursor anywhere in the Markdown editor and use nearby controls to:

- Insert an image at the current cursor position.
- Apply common Markdown formatting to the current line or selection.
- Avoid scrolling back to the top of the form for routine writing operations.

## Non-Goals

- Do not replace the Markdown storage model with HTML or rich text.
- Do not rewrite the public post renderer.
- Do not change OSS upload API behavior, deploy behavior, admin authentication posture, or existing Markdown post files.
- Do not reproduce every SSPAI menu item. The first version should focus on common blog writing operations.

## Recommended Approach

Keep EasyMDE/CodeMirror and add a custom floating Markdown command layer.

This gives the CMS the reference interaction's locality without taking on a full rich-text migration. The implementation should treat CodeMirror as the editing engine and build a lightweight UI around its cursor, selection, line, and scrolling APIs.

## UX Model

### Current-Line Insert Button

When the Markdown editor is focused, show a small `+` button in the editor gutter beside the active line. The button follows cursor movement and editor scroll position.

The button opens a compact menu near the active line:

- Image
- H2
- H3
- Quote
- Bulleted list
- Numbered list
- Divider
- Code block

### Selection Formatting Toolbar

When text is selected, show a compact floating toolbar above or near the selection. It should include:

- Bold
- Italic
- Link
- H2
- H3
- Quote

Commands should modify Markdown text directly. Examples:

- Bold wraps selection with `**`.
- Italic wraps selection with `*`.
- H2/H3 prefixes the current line with `## ` or `### ` after removing existing heading markers.
- Quote prefixes selected lines or current line with `> `.
- Lists prefix selected lines or current line with `- ` or `1. `.
- Divider inserts `\n---\n`.
- Code block wraps selection or inserts an empty fenced block.

### Image Insertion

Image upload should move from a required top-of-form workflow to an action available from the active line's `+` menu.

The existing upload behavior should be reused:

- Client-side image compression stays intact.
- `/api/upload` remains the upload endpoint.
- The returned Markdown image string is inserted at the current cursor position.

The existing large upload drop zone can remain as a secondary affordance at first, but routine insertion should not depend on it.

## Architecture

### `MarkdownEditor`

`MarkdownEditor` remains the owner of the EasyMDE instance and CodeMirror instance. It should expose enough imperative methods for parent pages to insert text and trigger image upload safely, but the floating writing controls should live inside or directly adjacent to `MarkdownEditor` so they can track CodeMirror geometry without leaking implementation details.

### Upload Reuse

Extract the reusable upload/compression logic from `ImageUploader` into a small client utility or hook. Both the existing drop zone and the new inline image command should use the same helper.

### Position Tracking

Use CodeMirror APIs to locate cursor and selection geometry:

- Cursor line: derive the active line from `doc.getCursor()`.
- Line coordinates: use CodeMirror cursor or character coordinates and adjust relative to the editor wrapper.
- Selection coordinates: use CodeMirror selection/cursor coordinates to place the toolbar near the selected text.
- Recompute positions on cursor activity, selection changes, editor scroll, editor focus, window resize, and content change.

Controls should hide when the editor is blurred, unless focus moves into the floating menu itself.

## Responsive Behavior

Desktop:

- Show the line `+` button beside the current line.
- Show menus as compact floating panels.

Mobile or narrow admin layouts:

- Use a bottom fixed command bar or inline compact menu instead of a left-side gutter button if the editor width is too narrow.
- Preserve access to image insertion and heading/list/quote commands without horizontal overflow.

## Error Handling

- If image upload fails, show the same failure message path used by the existing upload component.
- If CodeMirror is unavailable, hide floating controls and keep the editor usable.
- If a command is applied with no selection, act on the current line or insert a sensible Markdown template.

## Testing

Add source-level regression tests for:

- `MarkdownEditor` owns a following line action button tied to CodeMirror cursor activity.
- Selection formatting toolbar exists and includes the supported Markdown commands.
- Inline image insertion reuses the existing upload/compression path rather than duplicating upload rules.
- Existing image compression and cache-header tests still pass.

Manual browser verification:

- Open `/admin/new`.
- Focus the body editor and confirm the `+` button appears beside the active line.
- Move the cursor to different lines and scroll the editor; confirm the button follows the active line.
- Select text and confirm the floating format toolbar appears near the selection.
- Use H2, quote, list, divider, code block, and link commands and confirm Markdown changes in the editor.
- Insert an image from the floating menu and confirm the Markdown image lands at the current cursor position.

## Acceptance Criteria

- Routine formatting and image insertion are available near the active writing position.
- Markdown remains the saved source format.
- Existing `/api/upload` behavior is reused.
- No article files in `posts/` are modified by the implementation or tests.
- `npm run check` passes, with any known baseline diagnostic failures clearly separated if additional diagnostics are run.
