# Direkte Reisebearbeitung 1 — Technical Lead preparation evidence

Date: 7 October 2026; live reads approximately 16:52–17:09 UTC.
Issue: #904
Baseline: `9ea0e068e1d28b18ed15059fa5bf9b63c0689cfe`
Purpose: bind the new independent task to observed current evidence. This is preparation, not implementation acceptance, a future-head certificate or a full security/privacy audit.

## 1. Entry reconstruction and current baseline

The required entry chain was read in order: START_HERE, TL/Cursor Operating Standard, its current Guardian handoff, ACTIVE_WORK_STATUS and canonical live index #751. Current mode is NORMAL. Older HOLD and author-ready claims were not adopted as current authority.

| Evidence | Observed result |
| --- | --- |
| Main | `9ea0e068e1d28b18ed15059fa5bf9b63c0689cfe`; tree `1ba08978a74094bc5217e21bc7b7fba7b703b640` |
| Main push CI | [37611874229](https://github.com/Jetnity/jetnity/actions/runs/37611874229), success; actual verify/Auth steps, hygiene and build successful |
| Production | `dpl_DnUPNJ1Z8cTrebw8WE9HjQzrM82A`, READY, aliasError null, exact main; jetnity.com separately resolves to it |
| Operating-mode blob | `1912bf56751a940acc56fad84e2bf9e6a174e0fa`, NORMAL |
| Open PR inventory before task creation | #900 current writer; historical Drafts #52/#50/#40/#39/#28, not new active tasks |
| Open issues before task creation | #899/#751/#748/#236/#741/#294/#440/#626/#395/#585/#20 |
| Latest relevant #748 raw MATERIAL | 6032030807; processed TL receipt6036558748; no newer raw MATERIAL found at inspection |
| Protection | Ruleset21875372 active/strict; required verify, Auth and Vercel; unresolved review threads matter; no bypass actors/current-user bypass |
| New branch collision check | `feat/direct-trip-editing-1` absent before publication; no duplicate open direct-edit task found |

No active process for another trip editor was found. A new dedicated worktree was prepared on exact main; the existing #900 checkout was not changed. This only prepares the new Codex session; it does not prove that one has started.

## 2. Separate #900 truth — not this task's work

[PR #900](https://github.com/Jetnity/jetnity/pull/900) is open/Draft on `4d8da35a09825963fe435184ab4305936f7d4869`, tree `56bc4c8ba4b0bba03b08995ead916c50571af698`. Merge-base `ecc0ecf3b9c024b295034b6985fa26ca40bc82f1`; 13 ahead/14 behind main; no main sync. Full diff:59 files,9585 additions/103 deletions, Official-Truth task paths plus package.json. Those paths are excluded from #904.

R3 author correction is published, but final independent acceptance and the new final delivery receipt are absent. [CI37652425354](https://github.com/Jetnity/jetnity/actions/runs/37652425354) fails. Root TL separately read the actual job log:
- 5766 tests;5765 passed;1 failed;0 skipped.
- New native R3 guard test: “must observe actual deferred COMMIT before losing its guard”, `r3-proof.ts:123` / `runR3NativeProof:166`.
- Typecheck/Lint passed; later hygiene/build steps skipped after test failure.
- [Auth job112898917801](https://github.com/Jetnity/jetnity/actions/runs/37652425354/job/112898917801) actually compared all55 required values successfully.
- Verify/Auth actually checked out synthetic merge `2f61b62c1aab470c3363adbbe95d5e5dac59e144`, parents exact main + exact #900 head; tree `3e1c5b63a1f628f7a551ba8d997a0a081580b493`.
- Native log environment PostgreSQL16.15; no evidence permits calling the failure a flake.
- Preview `dpl_EMakH8cEWKgbWYq1wDRqJ2iz2NX5` READY, matching exact head, aliasError null. Preview success does not override failed CI.

Writer evidence remains “Official Truth integrated development pilot 1 — Generation 1”, Codex Desktop session `01a11333-cbc2-7282-b194-27335e632c61`, reported actual `gpt-6-astra/xhigh`. New-head report/handoff contain author R3 claims. No independently observed current Desktop process status; do not say it is definitely running or finished. Last observed PR delivery comment was still R2 receipt6040374431. All three TL R2 threads remain unresolved; no new formal R3 acceptance exists. R3 review of06a07ba5 in issue#899 is historical head-bound evidence that remains binding for re-review. `realOfficialSourcePilot=BLOCKED` persists.

First unfinished #900 step: same-session correction/verification of the failed native R3 proof, truthful final-head gates/receipt, then independent TL full TASK/R1/R2/R3 review. Only after content acceptance may TL decide controlled main synchronization and complete renewed gates. #903/#902 are completed and were not restarted.

## 3. Actual product gap and scope judgment

Root TL plus two read-only specialists inspected current main, the binding build order/doctrine, actual normal change engine and #903 scope. Main `docs/REISEN.md` sections7–8 records missing direct basic/stage editing; `ReiseAenderung.tsx` only invokes model generation for preview. The independent write/application mechanisms already exist.

The chosen task is supported basic details, trip dates/duration and duration/removal of existing stages, complete consequences, confirmed Guest/Account apply/readback and current Workspace behavior. This stays inside the Trip core and creates no new main navigation/product category. It is not OP-02/What-if/Trip Audit activation or a redo of #903. Add/reorder/rename stages, new places/origin, traveller identity/count and new clearing/currency semantics are explicitly outside this bounded assignment.

Fresh primary-source competitive check found direct editing already documented by TripIt and Wanderlog; the TASK carries exact URLs and no uniqueness claim. Jetnity value is integration, existing graph preservation and clear consequences.

Static inspection identified precise compatibility risks for required reproduction and minimal correction inside this same task:
1. unconditional `anwenden.ts::reindex` overwrites explicit #903 item startsOn from dayDate while leaving endsOn;
2. unrelated Account apply resolves every place again; lookup failure can clear authoritative existing place references/coordinates;
3. Guest apply checks revision/mutation without first checking expected active trip identity;
4. Account apply guesses a revision on malformed RPC reply and treats callback/refresh as success without independent confirmed Trip readback;
5. old concise diff omits interests and travelWish and does not enumerate all material surviving-item consequences.

These are source-based precheck findings, not new executed runtime reproductions. TASK requires baseline/fixed evidence and permits the necessary narrowly specified shared fixes. It does not freeze a defective implementation or grant changes to protected truth contracts.

## 4. Supabase metadata-only verification

Root used the Supabase skill and current documentation, then read ONLY system metadata from the existing Jetnity project. No application rows, credentials, sessions or personal data were read; no hosted write/DDL/migration was run.

Live metadata:
- `public.reise_aendern(jsonb)` exists, SECURITY INVOKER (`prosecdef=false`);
- anon has no execute; authenticated has execute;
- current definition MD5 `c4c98e3744558608104755574d406669`;
- trips/trip_stages/trip_days/trip_items all have RLS enabled and four visible policies each;
- existing trip date, currency, budget, preferences, revision and last-mutation fields are present;
- trip_items starts_on/ends_on are date, starts_at/ends_at are time without time zone; updated_at and booking_status exist.

This establishes deployed structural availability, not full owner-concurrency/rollback correctness or hosted authenticated E2E. TASK requires real disposable local Auth/RLS/RPC/browser tests; hosted fixtures and schema changes are forbidden. No migration is needed to expose the scoped existing fields.

The Supabase markdown documentation endpoint was unsupported by the retrieval service; the normal changelog and database-functions documentation were read instead. The task changes no Supabase version, extension, token or Auth architecture.

## 5. Multi-agent and risk decision

One new writer with one dedicated branch/worktree/immutable TASK/Draft PR is suitable. Project concurrency is disjoint: #900 owns its Official Truth files and package.json; #904 owns the explicitly named direct editing seams. No stacking or main synchronization by an author. TL controls global docs/index, final review and merge order.

No special Product Owner decision is required to prepare or implement this precise normal scope under current user authorization/NORMAL mode. Production, security/ownership policy, migration, provider, cost, real personal data, retention, F8 and launch gates remain reserved. #395/#585/#626 are preserved.

No new task runtime was implemented or tested by this preparation. P1 data loss/cross-owner or cross-trip writes/false success and P2 date/location/preview/retry/integration/accessibility risks are explicit acceptance blockers. No general repository certification is claimed. The older #871 public-artifact hygiene P2 remains a separate historical concern, not erased or solved by this task.
