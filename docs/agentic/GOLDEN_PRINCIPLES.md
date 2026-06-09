# Golden Principles

- Preserve the blog as an editorial, readable experience rather than a generic SaaS interface.
- Keep blog and CMS visually related.
- Protect deliberate design decisions with focused regression tests.
- Keep posts and public assets separate from implementation scratch work.
- Treat filesystem writes, OSS uploads, process execution, and Git pushes as explicit boundaries.
- Prefer actionable checks over repeated review comments.
- Do not manufacture a green dashboard by weakening diagnostics or hiding known debt.

## Mechanically Enforced

- Environment, dependency, and Next output ignore rules.
- Parameterized deployment process execution.
- Slug allowlist validation.
- Upload type/extension/size constraints.
- Agent documentation presence and local links.
- Numerous product and visual source-level regression decisions.
