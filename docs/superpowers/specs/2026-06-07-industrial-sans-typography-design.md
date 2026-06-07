# Industrial Sans Typography Design

## Goal

Replace the blog and CMS serif typography with a readable industrial sans-serif system while preserving technical metadata as wide-tracked monospace.

## Font System

- Primary Latin font: IBM Plex Sans.
- Primary Chinese font: Noto Sans SC.
- Metadata font: JetBrains Mono.
- Remove Fraunces and serif fallbacks from the shared blog and CMS typography.

## Tracking

- Headings: `0.035em`.
- Body and descriptive copy: `0.04em`.
- Dates, indices, eyebrows, labels, buttons, and footer metadata: `0.2em`.
- Large Latin brand title: lightly tracked at `-0.01em` so it remains cohesive.

## Scope

- Apply the sans-serif system to the homepage, article pages, portfolio content, demos, Markdown preview, image uploader, and all CMS pages and form controls.
- Keep dates, article indices, stamps, and CMS date cells in JetBrains Mono.

## Verification

- Regression tests protect Google font imports, shared font tokens, tracking tokens, and date metadata styling.
- Verify the homepage, an article page, and CMS visually.
- Run the production build.
