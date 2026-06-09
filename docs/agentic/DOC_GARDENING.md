# Doc Gardening

## Maintenance Rules

- Keep `AGENTS.md` operational and concise.
- Update architecture/security docs when API, filesystem, OSS, deploy, authentication, or environment boundaries change.
- Update product and golden-principle docs when stable design decisions change.
- Record new baseline failures in `QUALITY.md` and `TECH_DEBT.md`; do not normalize them silently.
- Move completed plans from `plans/active/` to `plans/completed/`.

## Audit

```bash
npm run check:agentic
npm run check
```

Review these docs after major features, security decisions, deployment changes, or repeated agent mistakes.
