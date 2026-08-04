# Technical Debt

| Area | Issue | Guardrail / Next Step | Status |
| --- | --- | --- | --- |
| Security | Local CMS routes are passwordless. | Preserve the Vercel 404 guard; require explicit authentication design before any remote exposure. | Mitigated; local-only |
| Dependency security | `ali-oss` still pulls the legacy `urllib` / `proxy-agent` chain with residual SSRF advisories. | Wait for a compatible upstream release or verify a dedicated major-version migration; never force the override blindly. | Open, constrained path |
| Tests | Portfolio regression suite expects missing `posts/aboutMyProjects.md`. | Decide whether to restore the content or update the product/test contract. | Open |
| Type safety | Independent typecheck reports existing errors; builds skip type errors. | Fix by area, then remove `ignoreBuildErrors`. | Open |
| Lint | ESLint runs without errors and reports 12 warnings. | Fix warnings without weakening rules. | Open |
| Deploy safety | `/api/deploy` stages broadly and pushes `main`. | Add preview/confirmation or narrower staging in a dedicated task. | Open, high risk |
