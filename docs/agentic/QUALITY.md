# Quality

## Reliable Gate

Run:

```bash
npm run check
```

It runs repository constraints, agent-documentation audit, and the production build. These checks pass on the current baseline and are used by CI.

## Diagnostic Commands

Run these when touching related areas, but distinguish existing failures from regressions:

```bash
npm test
npm run typecheck
npm run lint
```

Current baseline:

- `npm test`: 24 tests pass; one suite fails because `posts/aboutMyProjects.md` is missing.
- `npm run typecheck`: reports existing canvas-nullability, React child-props, editor-options, and missing `ali-oss` declaration issues.
- `npm run lint`: runs correctly after the Next 16/ESLint 9 config update; currently reports 2 errors and 18 warnings.

Do not delete tests, weaken lint rules, enable blanket ignores, or create missing blog content merely to make diagnostics green.

## Browser Verification

For UI/runtime changes:

1. Start `npm run dev`.
2. Verify `/`, representative `/posts/[slug]`, `/admin`, `/admin/new`, and relevant edit/API flows.
3. Check desktop and mobile layouts.
4. Check browser and terminal consoles.
5. Do not trigger `/api/deploy` or real OSS uploads unless explicitly requested.
