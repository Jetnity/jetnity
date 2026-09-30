# Jetnity Next.js 16.3.8 Security Upgrade 1 — Self-Review

Stand: 30 September 2026
Autor: Jetnity Next.js 16.3.8 security upgrade 1, generation 1
Session: https://cursor.com/agents/bc-4391c41c-ebdc-485c-b1a2-a6de70b69c1f
`originalModelName`: `grok-4.7-high-fast`

This is an author self-review. It is not an independent Technical-Lead PASS. It does not set Ready and it does not merge.

## Checks against the task

| Question | Result |
| --- | --- |
| Was the model the required Grok 4.7 High Fast? | Yes. `originalModelName` is `grok-4.7-high-fast`. |
| Were dependencies edited before the npm registry gate? | No. `npm view` proved `next@16.3.8` and `eslint-config-next@16.3.8`, and `latest` is that stable version. |
| Was 16.3.7 or a canary installed? | No. |
| Did the lockfile move unrelated direct dependencies? | No. Twelve paths, all Next 16.3.3 to 16.3.8. |
| Was `next.config.js` tightened or loosened without call-site proof? | No. It is unchanged. |
| Was a third-party host probed as an exploit? | No. Disallowed-host coverage used `not-allowlisted.invalid`, which the optimizer rejected with 400 before a fetch. |
| Were app or component runtime files edited? | No. The framework contract test assertion changed because it encoded the old pin. |
| Were global continuity pointers edited? | No. They still say 16.3.3. That is an intentional scope limit, not a claim that those docs are current. |
| Did local gates pass? | Test, typecheck, lint, build, and the named hygiene checks passed. `npm audit` still reports pre-existing non-Next findings and was not auto-fixed. |
| Was browser evidence taken from the old 16.3.3 server on port 3000? | No. Evidence is from `next start` 16.3.8 on port 3010. |
| Is "not affected" claimed only because one search was empty? | No. Route tree, config, and call sites were inspected. The image advisory stays config-exposed. |
| Did GitHub's `16.3.?` redaction get rewritten as a precise range I did not see? | No. The literal `?` is preserved. The 16.3.8 release notes and compare commits are separate evidence. |

## Main integration

#657 landed on main during CI of `03e4f537`. That head's CI was green and is now superseded. The branch merged `a2685812` and is 0 behind. Footer was not edited; the white footer class remains `brightness-0 invert`. Local gates were rerun after the merge and passed, including the three new footer tests (4095 pass).

## Residual risk

- The Azure image pathname remains `/**` with no in-repo `next/image` caller. Removing it would collide with the sanitation closure invariant and was not proven necessary for the vendor patch.
- `GHSA-3w37-wq28-93x7` and `GHSA-h694-7cp9-m8p3` publish the vulnerable range as the literal string `16.3.0`. That string does not by itself prove 16.3.3 is inside it. The code prerequisites are absent either way, and 16.3.8 still lists the fixes.
- `npm audit` remains red for `ws` and dev tooling. That is outside this slice.
- Exact-head CI and Vercel Preview are not a substitute for Technical-Lead review, and they are not known until the pushed tip is re-read.

## Author verdict

The bounded upgrade and the Jetnity applicability audit are in the draft branch. Independent Technical-Lead review is still required.

**This self-review is not a PASS.**
