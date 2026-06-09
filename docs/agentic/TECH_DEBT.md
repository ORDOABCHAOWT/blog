# Technical Debt

| Area | Issue | Guardrail / Next Step | Status |
| --- | --- | --- | --- |
| Security | Admin and mutating API routes are unauthenticated. | Require explicit access-control design before remote exposure. | Open, high risk |
| Documentation | Root `SECURITY.md` claims Basic Auth exists, conflicting with current tests/code. | Treat agentic security doc as current reality; reconcile root guide during a dedicated security task. | Open |
| Tests | Portfolio regression suite expects missing `posts/aboutMyProjects.md`. | Decide whether to restore the content or update the product/test contract. | Open |
| Type safety | Independent typecheck reports existing errors; builds skip type errors. | Fix by area, then remove `ignoreBuildErrors`. | Open |
| Lint | ESLint now runs but reports 2 errors and 18 warnings. | Fix findings without weakening rules. | Open |
| Deploy safety | `/api/deploy` stages broadly and pushes `main`. | Add preview/confirmation or narrower staging in a dedicated task. | Open, high risk |
