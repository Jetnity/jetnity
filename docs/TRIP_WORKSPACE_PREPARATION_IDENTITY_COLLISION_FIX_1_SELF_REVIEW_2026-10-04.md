# Trip Workspace preparation identity collision fix 1 — Self-review

Date: 4 October 2026 (Europe/Zurich)
Writer: **Jetnity Trip Workspace preparation identity collision fix 1**, Generation 1
Issue #828 · Draft PR #829 · Codex Desktop · `gpt-6-astra` / `xhigh`

**Writer self-review only. Not independent assurance and not a Technical-Lead PASS.**

Reviewed production/test commit: `da8127024eaef4d098d4346b25f8de4e1ad672c2`.
The subsequent delivery commit adds the three required documents only; the published exact tip remains the independent review target. Baseline/merge-base `1396d1251c7fe0c52f2b1d3096dba814da6adbee`; task seed `d118d1e0f5acde631fd9c92b221e5a61f7a6d61a` unchanged.

## Adversarial checks

| Question | Evidence / conclusion |
| --- | --- |
| Can B02 or 80-character titles collide because of a shared prefix? | Actual UI submission tests failed with equal refs before the fix and produce distinct refs/rows afterwards. The generator takes only a kind prefix. |
| Does an identical title twice remain two deliberate points? | Form/account and real guest tests preserve two points, including after trim/case normalization. |
| Is an ID generated during rendering or repeatedly during transport retry? | Generation is in the new-point submit handler. Once constructed, the payload carries its ref unchanged into the callback and account/guest action. Reusing that payload does not insert a second target. |
| Can B overwrite or reopen A? | Tests set A done, then create/retry/update B. A's full row/item remains byte-for-byte unchanged; B has the changed title/status. |
| Can guest no-ref preparation creation use a prior same-kind/country/item point? | The `preparation` branch returns no existing target before building. Executable guest tests originally collapsed to one item and now preserve both through storage reload. |
| Do old custom refs stop working? | No ID rewrite. An old `preparation:<title>` ref is updated exactly and siblings are preserved. |
| Have system IDs/fallback changed? | `clientRefFuerAbgeleitet` and derivation are untouched; tests pin exact derived strings and retain the existing insurance-check fallback update. |
| Could account and guest semantics diverge? | Shared builder and form ref; account already exact-ref scoped. New tests execute its real action with fake DB transport; guest tests execute the real local writer. Only preparation's no-ref guest fallback changed. |
| Does Guest→Account merge identical-title points? | It keys on clientRef. Repeated transfer payloads retain two separate refs exactly once, with title/status preserved. Existing transfer suites pass. |
| Do bounds or privacy weaken? | Schemas unchanged. Generated refs stay within 64; tests reject invalid/sensitive/HTML/URL titles, retain 50-item limit and force user evidence. |
| Is another ID algorithm or dependency introduced? | No. Existing randomUUID/time-random fallback is exposed with a narrower prefix type and reused; package files unchanged. |
| Was a prohibited runtime area changed? | Only the three allowed runtime files. No account action, schema, callback, DB, Official Truth or visual change. |

## Limitations and remaining gates

The existing RNG fallback retains its probabilistic collision properties. The scope removes content-derived collisions; it does not claim a new global mathematical uniqueness mechanism. Production uses the existing generator's crypto path where available.

The tests are function-level integration and guest serialization evidence. The React state harness is shallow and the database transport is in memory. They do not claim browser/layout, live Auth/RLS, cross-tab/concurrent-write isolation or hosted DB verification. Existing concurrent database uniqueness and exact-update behavior are unchanged. A late replay with the same ref retains the existing update semantics; this slice is not a versioning change.

The full test suite is **not locally all green**: 5,154 pass and three known PostgreSQL tests fail because the hard-coded Linux PostgreSQL 16 executable is absent. No skipped or fabricated PASS. Focused 220/220, typecheck, lint (zero errors, 149 existing warnings), all requested hygiene checks and local build pass. Independent exact-head CI/Preview and the Technical-Lead verdict remain required.

Scope includes the immutable TASK plus the three allowed production files, two test files and the three required delivery documents. The TASK was not edited. No Supabase API/DB, Development/Production write, Vercel API/configuration mutation, manual deployment, secret/provider action or cost increase was performed. Existing Git integration can create a Preview after branch publication. No additional agent or writer was started.

Observed native session metadata proves Codex Desktop / `gpt-6-astra` / `xhigh` for session `01a10885-cf05-7fa3-aaad-e727a9b0e2a0`; it is not merely the requested dispatch setting.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW. Keep #829 Draft. No Ready, merge or follow-up.**
