# Writing Favicons Design

## Goal

Replace the visually busy blog and CMS favicons with a coordinated Apple writing-emoji pair.

## Design

- Blog: use the feather emoji `🪶` to represent personal writing and essays.
- CMS: use the fountain pen nib emoji `✒️` to represent editing and publishing.
- Keep the icons distinct so the public blog and CMS tabs are easy to identify.
- Render each emoji in an SVG using the system `Apple Color Emoji` font. On macOS this preserves the native Apple artwork and remains crisp at browser-tab sizes.

## Integration

- Replace the root file-convention `src/app/favicon.ico` with `src/app/icon.svg`.
- Add `public/admin-favicon.svg`.
- Update the admin layout metadata to reference `/admin-favicon.svg`.

## Verification

- A regression test checks that the blog icon exists, the obsolete root ICO is absent, and CMS metadata points to the pen-nib SVG.
- Run the full Node regression suite and a production Next.js build.
