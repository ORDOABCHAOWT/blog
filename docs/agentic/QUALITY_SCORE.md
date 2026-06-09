# Quality Score

| Area | Score (0-5) | Evidence | Next Improvement |
| --- | ---: | --- | --- |
| Agent map | 4 | Project-specific `AGENTS.md` and indexed docs. | Add nested instructions only if ownership grows. |
| Architecture clarity | 4 | Data, filesystem, OSS, process, and content boundaries documented. | Extract duplicated slug validation during a dedicated change. |
| Verification | 3 | Reliable build gate, many regression tests, repository validation, CI. | Repair stale test, type errors, and lint findings. |
| Reliability | 3 | Local/LaunchAgent operation and recovery documented. | Add stable browser smoke tests without destructive API calls. |
| Security | 2 | Important static constraints exist, but admin/API are unauthenticated. | Decide and implement an explicit access-control model. |
| Entropy control | 3 | Audit, docs, tests, and debt register exist. | Schedule periodic debt and doc-gardening reviews. |

## Scoring Guide

- 0: absent.
- 1: scaffolded.
- 2: accurate but mostly manual or materially risky.
- 3: executable checks cover common paths.
- 4: checks are reliable and integrated into CI/review.
- 5: agents can diagnose, fix, verify, and recover with minimal human input.
