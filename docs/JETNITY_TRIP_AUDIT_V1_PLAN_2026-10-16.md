# Trip Audit V1 — PLAN

Author: Jetnity Trip Audit V1 — Codex Generation 1. Session `01a141ad-1220-7462-bced-c75469dab1d3`. Issue #954; existing draft #955; branch `feat/trip-audit-v1-readonly`.

## Resume gate and baseline

The initial permission STOP remains historical evidence. On resumption the execution policy is `workspace-write`, restricted network, `approvals_reviewer=auto_review`; the process reports `CODEX_SANDBOX=seatbelt` and `CODEX_SANDBOX_NETWORK_DISABLED=1`. It is no longer danger-full-access/never. No permissions were changed by the author. A host/DNS/npm block requires STOP, not another runner, proxy, mirror or credential route.

Live main and merge base: `9847b2c9e1bf9840c5557a71663a0f56c8b9d50c`, tree `d66a33a0f50539e9d0b40dba9ae9e88c2b919a2b`. Seed HEAD `8871abc10cf733f005ec40915a81eea7ab155e49`, ahead 1 / behind 0. TASK blob independently read from GitHub and local Git: `c224d3fbddd031d030d825b6895d1423a5586f67`. Mode NORMAL. #751, new #748 material, #954 and #955 re-read; #953 is a separate writer and remains untouched.

## Implementation

1. Add a versioned, pure report under `lib/trips/trip-audit-v1/`. Use the workspace's existing unplanned selection; make a shallow read-only Trip view with that exact inventory for all four canonical readers. This avoids the temporal adapter unioning an obsolete inventory into the already selected workspace projection. Never mutate or persist that view.
2. Bound input traversal, counts, lodging date work and report output before canonical evaluation. Preserve partial/unknown/error and truncation explicitly. Keep original canonical evidence and references, without copying notes, providers or booking links into the report. No additional coverage, timezone or transfer mathematics.
3. Add the user-triggered panel immediately after Jetzt wichtig. Mount results only while open and recompute from current props on every render, including changes without a revision increment. Show domain groups, provenance, scope limits and paginated findings. The two existing components receive only the typed prop/import/mount and existing `ungeplantePunkte` pass-through.
4. Add synthetic tests T01–T10, including exact canonical comparisons, pathological input, inventory identity, live component interactions and nonactivation. Run the unchanged full project checks. Attempt browser verification with existing local tools only; distinguish harness evidence from authenticated runtime evidence.
5. Write REPORT, SELF_REVIEW and HANDOFF, commit/push only the existing branch, then inspect original Actions/Auth/Preview for that exact HEAD. STOP for independent TL; no Ready or merge.

## Risks and exclusions

The current Trip time adapter admits civil/unknown clocks, not verified UTC instants. Tests must preserve its possible/not-evaluable results, not manufacture a proven live conflict. Selected accommodation is planning data; user-marked booked is not provider confirmation. Unknown stays suppress definitive lodging gaps. A bounded report must not say that the whole trip has no problems.

No DB/schema/migration/API/Auth changes, no provider/Official Truth/Safety/Seasonal/Traveller/Payment activation, no network or storage in the feature, no new service/cost, no public launch or indexing change. Existing #917, #944, DEV-PREP-1, #911/#913, #934/#937 and #626 gates and residual npm findings remain unchanged. Only TASK §4 paths may change; task blob is immutable.

## Initial evidence

Offline installation from the existing npm cache succeeded within the regular sandbox; no alternative registry or credentials. This is not a fresh advisory clearance. Original lodging, flight, mobility, temporal and workspace baseline: 129 tests passed, 0 failed. Exact final-head results belong in the report/handoff, not this plan.

## TL R1 delivery amendment

The complete [TL decision 6204035806](https://github.com/Jetnity/jetnity/pull/955#issuecomment-6204035806), explicitly invoked by the Product Owner, permits preserving a local commit and publication to the existing Draft branch for original automatic CI. TASK and eleven-file scope are unchanged. No blocked-command retry, installation, permission/credential/config change, alternate runner or upload is authorized.

Revalidate main/mode/#751/new #748/PR and the full local diff. Run ordinary final typecheck, lint and focused pure tests, including static checking of ui.test.ts. Document environmental blocks; commit the candidate; push once only if normal existing HTTPS authentication is available. Otherwise keep the commit and publish a sanitized BLOCKED receipt on #955. Exact post-commit SHA/tree are recorded in that receipt; the commit cannot contain its own hash. Independent UI acceptance remains open.

## TL R2 immediate review fix

Read both full reviews 6204499241 and 6204596934. Effective execution is workspace-write with restricted network and automatic approval review; no Full Access or escalation is authorized. Live main is `69a182ea4b7f9dbd934abf314266b7d8f59a5d73`, NORMAL; #751 comment 6204608990 confirms the same-author correction and main integration. No new #748 MATERIAL after 6198868156. Existing local/remote author HEAD is `7672373f6420aabb82d2625068bbb4ac4cb6bcb1`, clean; TASK unchanged. Old-head CI passed, but cannot qualify any correction.

1. Add only presentation data to retained findings, reading existing titles and nullable start/end dates/times from the same validated, bounded workspace inventory. Keep references/evidence and canonical status calculations unchanged. No persistent registry/cache; missing/ID-only names remain unknown, never an ID fallback. Do not infer dates, timezones or booking facts.
2. Render those plain text fields in the existing panel. Add focused synthetic projection and actual finding-markup tests for names, absent names, escaping, no opaque IDs, exact times, snapshot changes, nonmutation and original limits. Static rendering is not browser acceptance.
3. Run feasible original checks, preserve a correction commit, and use only normal Git access to merge origin/main without conflicts or history rewriting. Stop on Git/network/auth failure. Recheck the integrated tree and publish only this branch if normal authentication works.
4. Update the three task-owned delivery documents and exact-head PR receipt with actual results and remaining gates. No new API/DB/Auth/provider/dependency/workflow/Production behavior or recurring cost; T09 remains independently unverified. STOP for TL.
