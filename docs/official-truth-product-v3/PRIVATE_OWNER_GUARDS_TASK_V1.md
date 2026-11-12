# PG1 binding task and review amendment

Persisted TASK V1: https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6815884525

The following TASK V1 body is preserved verbatim. The R1 amendment below is part of the same author/session task; neither document grants runtime or publication authority.

## V3-PRIVATE-OWNER-GUARDS-1 — TASK V1 / source-only implementation

Root / Technical Lead, 12 November 2026. This is an explicitly selected necessary CH→DE task within the Product Owner's existing all-five-steps authorization and15November target. No additional PO approval is requested. Operating mode freshly read NORMAL; current main dfd692440762b50183fdebbfd6bf8dabde4662d0 / treecbc79e627161d4ace132b84cf057c18adc86586c is independently accepted after #1191.

### Why this is an independent path

Root read the exact #1142 authority source407c28bc7623f659e49c3f408bee28302ef717e1, MA1 source6af3e5a76d1eaa4343ee0b1fb812454cce9f7f3e, existing MA1 Auth fixture and M04 composition, and reconciled a separate read-only architecture review by /root/ch_de_method_readiness. MA1 human governance directly calls jetnity_ot_auth.require_current_owner_session_v1(), which in turn calls own_active_session_v1() under postgres. It does not consume the old public capability, PilotGrant or Stage1 ledger as positive authority. Removing the old public INVOKER consumer from this new installation permits both private functions and their namespace to remain owner-only.

This is a NEW private V3 prerequisite, not the unchanged full #1142 package and not a repair/closure of Legacy P1 or all14 remaining #1139 rows. E25 and the original #917 denied capability/ledger/Pilot/Grant readback remain untouched. No historical denied fact is to be queried, reconstructed, delegated, retried or normalized. #1131 remains NOT_REQUIRED and untouched.

### Actual author and controlled scope

Assigned exact name: **Jetnity Official Truth V3 Private Owner Guards 1 — Codex Generation1**. New module, new actual session /root/v3_private_owner_guards_writer_g1; report the actual returned session, never claim a Cursor UI/session. Root alone publishes, decides PASS, Ready or merge.

Prepare only these seven new paths:
- scripts/db/official-truth-v3-private-owner-guards-1/install-candidate.sql
- scripts/db/official-truth-v3-private-owner-guards-1/recovery-candidate.sql
- scripts/db/official-truth-v3-private-owner-guards-1/native.ts
- lib/readiness/official-truth-v3-private-owner-guards-1.test.ts
- docs/official-truth-product-v3/PRIVATE_OWNER_GUARDS_TASK_V1.md
- docs/official-truth-product-v3/PRIVATE_OWNER_GUARDS_HANDOFF_V1.md
- docs/official-truth-product-v3/PRIVATE_OWNER_GUARDS_MANIFEST_V1.json

No existing file modification, workflow/package/budget/oldfixture/MA1/M04/production-port change. If these paths cannot deliver the narrow scope correctly, report the concrete dependency before expanding it.

### Required install artifact

One explicit transaction, postgres-owned new jetnity_ot_auth namespace and exactly two functions. Copy BOTH complete bodies and all SECURITY DEFINER/volatility/parallel/search_path/lock_timeout/signature semantics exactly from #1142. Blocking guard body SHA256 must remain ba3667edd483f0a0abcf53f70f4dc71906f0ffdbc192ee569232c78dd359635b. Bind both complete declarations/bodies independently; MA1's existing single-body check is insufficient as proof for the second function.

Keep schema and both functions owner-only: no USAGE or EXECUTE for PUBLIC, anon, authenticated, service_role or any additional nonowner grantee. Do not create/replace/read the public capability, Pilot RPCs/Grant table or old migration ledger. No Auth rows, privileges, roles, RLS, global helpers/default ACLs are changed. Install must reject collisions instead of IF NOT EXISTS/adopting objects. Explicitly validate creator/owner and baseline ACLs before removing documented default PUBLIC EXECUTE; unexpected inherited/default or additional grants fail the transaction rather than being silently cleaned up. Validate final exact bounded object inventory and effective ACLs; allow no hidden foreign objects. Source comment/metadata can identify this independent package, not fake historical installation.

Hosted apply remains a separate Root step after source/CI/target gates. The new SQL is an unapplied candidate, not a canonical migration filename invented from a timestamp. Do not claim the actual apply_migration identity or hosted auth semantics from synthetic fixtures.

### Recovery boundaries

Author a NEW small recovery for these new objects, not an edited copy of MA1's disposable-only rollback. Existing MA1 rollback2b6f0e0007fb03587347ac56ae9c8d5f374642cb requires disposable/local/SUPERUSER/empty-history checks and must remain exact.

Pre-use removal may remove ONLY the exactly identified new namespace/two guards with exact owners/bodies/ACLs/metadata, no foreign objects, no CASCADE, and explicit refusal if MA1 namespaces/roles or other known new consumers have appeared. Do not rely on DROP RESTRICT alone: PL/pgSQL textual dependencies are not a complete consumer proof. Document the separately required current bounded target/consumer/time-of-use evidence and quiescence for a Root recovery; unknown means no removal. Do not inspect original stopped objects as a recovery precondition.

After MA1 binding or methods/history exist, this removal artifact MUST refuse. Preserve evidence/history; a later versioned forward repair or supported revocation/kill switch is required. This task must not invent an unreviewed bypass of real method authority. Unknown commit outcome never permits blind repeat: inspect only the newly created allowed object scope via a separately reviewed ordinary readback.

### Exact native proof to author, not execute here

Add a wrapper discovered by existing test:core, using the existing disposable native PostgreSQL/owned-lifetime infrastructure. Reuse the exact MA1 SQL source and its established API/behavior checks; do NOT load the old full #1142 authority artifact as a substitute for the new private installation. Provide minimal synthetic Auth/Profile prerequisite fixture in the new native module; no changed old fixtures or imported code that secretly installs old authority.

Prove:
1. Exact final namespace/two-body/owner/config/ACL inventory.
2. anon/authenticated/service_role cannot directly use either guard.
3. Actual MA1 Definer calls succeed for a valid synthetic own active owner+AAL2 session.
4. Missing/malformed/foreign/expired/revoked/banned/deleted/anonymous/nonowner/inactive-profile states and concurrent lock conflict refuse; expired-after-wait/fresh final check as applicable.
5. A synthetic legacy boolean cannot substitute for private session authority; no real legacy object queried.
6. Installation collisions and unexpected default/extra ACLs refuse atomically; existing unrelated objects unchanged.
7. Exact unused recovery succeeds and its consumed/MA1-bound/foreign-object/drift cases refuse without deleting history.
8. All connections/operations/children settle and owned clusters stop on pass, failure and timeout. Fixed bounded time/resource limits, no broad sleeps or unowned retry loops. Use existing infrastructure instead of a new runner.

Required full type/lint/core/native/hygiene/build/CI later runs only in existing reviewed GitHub CI after Root publication. No claimed execution now. Tests must substantiate the security/recovery risks, not merely repeat source strings.

### Deliverable / STOP

Preserve this complete task+persisted URL in task file. Handoff distinguishes source preparation, native synthetic proof, actual Dev target validation/install, real signed Owner request and public activation. Manifest records all source identities, both original guard-body bindings, reused fixture/runtime/MA1 pins and tested-vs-unexecuted status. Never call a synthetic JWT a real signed Owner request or chat PO approval a runtime grant.

Prepare immutable objects/commit with sole parent dfd692440762b50183fdebbfd6bf8dabde4662d0, exactly seven added paths, all old leaves unchanged. Deliver full source, commit/tree/blobs/UTF8bytes/SHA256, self-review/risks and STOP for Root+independent review. No branch/ref/PR publication yet: AA CI4120 selection must not be consumed by another workflow. Root handles any later base update.

**Do not mark Ready. Do not merge. Do not start a follow-up slice. No project/parser/compiler/test/build/native/SQL/network execution, local install/download/clone, Supabase query/apply, Auth data, credentials, external research, source GET, provider, scheduler or public activation by the author.** Immutable Git objects and pure in-memory source/metadata operations only. The original platform STOPs remain unchanged.

Actual hosted prerequisites already partially evidenced: #1139/6815106311 (new namespace absent) and6815636025 (selected Auth rights/FKs/aal enum). Missing direct target/Auth/API/default-ACL/install/recovery/runtime facts remain missing. M04 has separate strict postgres-role assumptions and still unbound publication/cache/visitor ports; this small private-guard slice must not pretend to complete those.


---

Persisted TASK V1 amendment R1: https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6816224733

The following R1 body is preserved verbatim.

## Technical Lead — PG1 source CHANGES REQUIRED / TASK V1 amendment R1

Exact intermediate native source: daf49f23c9254dd3f29181de42b0d507dc5c4a68. No complete candidate, execution or publication has occurred. Same actual author/session: Jetnity Official Truth V3 Private Owner Guards 1 — Codex Generation1 /root/v3_private_owner_guards_writer_g1.

Independent reviewer /root/ch_de_release_gate_audit identified cleanup preemption; Root read the complete native source and complete existing OwnedTestLifetime b1a81a0f63fb0debaffa4db739adbb483ac1efc5 and independently confirms it. In the main finally, f?.close() precedes await lifetime.dispose() inside one try. A throwing close skips owned disposal/drain/cluster stop after the effect timer has been cleared.

Fix this bounded failure path before final delivery: use the existing owned lifetime as the authoritative cleanup, removing the redundant fixture-close preamble/helper, or unconditionally attempt disposal independently while retaining both primary and cleanup failures. No early exception may bypass disposal. Do not weaken negative cases, counters, deadlines or existing ownership infrastructure. Existing owned disposal already captures each individual close/stop error and continues through the remaining resources. Preserve truthful receipts when disposal itself fails.

The reported Auth helper-fidelity improvement (exact two bodies from actual Dev receipt6816048537 plus claim/claims/sub mismatch negatives) is within V1 and remains synthetic. Deliver the final new native/source pins and full seven-path candidate only after both corrections, with this R1 and URL preserved in Task/Handoff. All previous seven-path/source-only/no-Ready/no-merge/no-follow-on/STOP boundaries remain. No project/native/SQL execution, branch/ref/PR or external call is authorized for the author.

---

## Persisted same-session CI review amendment R3

URL: https://github.com/Jetnity/jetnity/pull/1193#issuecomment-6822141580

The complete previous Task above is preserved verbatim. The following R3 body is appended verbatim.

## Technical Lead — PG1 CI CHANGES REQUIRED / TASK V1 amendment R3

**12 November 2026.** Exact Draft #1193 head `9ed5b60d7ca77974864a32a03ed029fc51234e22`, tree `7921abb6dc8dfd9110ada61ab5af62469c28008f`; main `dfd692440762b50183fdebbfd6bf8dabde4662d0`, mode NORMAL.

### Actual failure, independently read by Root

Run `43206051112` / #4122 / attempt1, Repository verification job `131141360305`, completed **FAILURE** at 11:15:51Z. Full original log is 4,279,667 UTF-8 bytes / SHA256 `0d1e1ef3799c62ad0070b19cef89172625151fb10d55f4dbe484ae52cc00d9cb`. Typecheck/Lint passed; Tests failed and all following verification steps were skipped. Core: 8,732 tests, 8,728 pass, 2 failures, 2 pre-existing skips, 971 suites. The second failure is the enclosing PG1 test, not a separate proved production defect.

PG1-03 fails with `local_pg_duplicate_column` during `bindRecovery`. Root read the actual native source and unchanged pg-wire RowDescription decoder: duplicate output names correctly refuse. Both unaliased set_config calls in the same SELECT default to `set_config`. Native source has two such two-call SELECTs: recovery context+OID at line191, and claim.sub clearing+claim setting at line490. The later case has not executed and would repeat the same defect. PG1-01/02 actually completed. Receipt confirms 130 operations started/settled, 7 connections all closed, 1 owned cluster stopped, no cleanup failure. Groups03–09 are not PASS. SQL installation/recovery are not changed by this fixture failure.

The separate Auth job `131141360881` also failed: all55 expected values match and no unexpected provider/hook is enabled, but Supabase now returns the previously unclassified key `external_email_magic_link_disabled`. This is an independent newly discovered CI blocker under separate Root investigation; do not weaken or change Auth in this task. Full log: 21,280 bytes / SHA256 `e15a71b71a45543cf0db3c77832a63a33f67b120de2c17037efa3ff2ec7ed589`. No credential value is recorded here.

### Same-session R3 scope

Author remains **Jetnity Official Truth V3 Private Owner Guards 1 — Codex Generation1**, original session `/root/v3_private_owner_guards_writer_g1`.

Create an immutable successor with sole parent `9ed5b60d7ca77974864a32a03ed029fc51234e22`. In the existing native.ts only, add distinct explicit output aliases to each of the two set_config expressions in each of those two SELECTs. Preserve function arguments, parameters, ordering, number of queries, fixture claims/context, guards, all nine proof groups, cleanup/lifetime/budgets, shared pg-wire behavior and runtime source. Do not suppress duplicate-column validation, remove negative cases, or catch/ignore this error. Inspect the whole new native module for any other actual repeated output names and report any additional finding to Root before expanding this bounded edit.

Preserve installer, recovery SQL, test wrapper and all existing base files byte exact. Only native.ts and the existing Task/Handoff/Manifest may change. Preserve complete previous Task content and append this R3 verbatim with URL. Preserve the previous Handoff as dated history, then record actual failure and truthful new NOT_RUN state; update only the changed native/source/ancestry pins in Manifest. No invented new CI or PG1 acceptance.

Deliver exact new commit/tree, all seven current pins, four-path parent delta and complete unchanged-tree proof. Source-only immutable Git objects. **No project/parser/compiler/native/SQL/test/build/APT execution, no hosted query/apply, no Auth change, no branch/ref/PR publication, Ready or merge.** Root independently reviews and may publish the correction with a fresh complete exact-head gate. The current published head remains unchanged until Root does so. Stop after delivery; no automatic follow-on. #917/#1131 STOPs remain intact.

---

## Persisted same-session integration review amendment R4

URL: https://github.com/Jetnity/jetnity/pull/1193#issuecomment-6823360792

The complete previous Task above remains byte-exact. The following R4 body is appended verbatim; immutable preparation does not release Root's publication HOLD or transfer prior runtime gates.

## Technical Lead — PG1 integration review-fix R4 / exact Auth-main source preparation

**12 November 2026. Explicitly selected by Root for CH→DE.** Continue with **Jetnity Official Truth V3 Private Owner Guards 1 — Codex Generation1**, original reachable session /root/v3_private_owner_guards_writer_g1. This is the same scoped #1193 prerequisite, not a new product slice.

### Live integration basis

#1194 was independently TL-PASS at https://github.com/Jetnity/jetnity/pull/1194#issuecomment-6823268643 and merged at12:12:26Z. Fresh actual main is **ee6801e99e86144e60dbe86d72576f9ad7c3e9bb**, tree **c2fad9aff45aa07addb541fea8e6a38fb9f2a19e**, parents[dfd692440762b50183fdebbfd6bf8dabde4662d0,72ec65f55e2e69e737b774b83b20201fed1e1892]. This merge tree equals the exact successful #4127 tested checkout tree. Production dpl_9K9EfdobAp4ySCBbWoBnqE4vw78B is READY on that exact main and jetnity.com alias points to it.

Separate merged-main CI **#4129/43215792152** is still running; actual Auth job131174573164 already SUCCESS. **Full post-merge acceptance is not yet asserted.** This task authorizes immutable source preparation in parallel; Root keeps executable publication on HOLD until the main post-merge evidence and independent successor review are complete.

Existing Draft #1193 head **e464f6d8ffac77a124d5ab28637c7435337b222e**, tree **693400d99182fcf5bb48449cceb4fc2158c33c40**. Its actual #4124 PG1/Core/build/five companions passed; Auth alone failed on the field now classified in #1194. Preserve that evidence and failure truth: https://github.com/Jetnity/jetnity/pull/1193#issuecomment-6822867554 .

### Exact permitted successor

Prepare one immutable integration commit with ordered parents:
1. **e464f6d8ffac77a124d5ab28637c7435337b222e**
2. **ee6801e99e86144e60dbe86d72576f9ad7c3e9bb**

Retain every actual-main leaf byte/mode/type exact. Add only the existing seven-file PG1 package. Of that package, the four code files **install-candidate.sql, recovery-candidate.sql, native.ts, mandatory wrapper** remain exactly R3. Only existing **PRIVATE_OWNER_GUARDS_TASK_V1.md, PRIVATE_OWNER_GUARDS_HANDOFF_V1.md, PRIVATE_OWNER_GUARDS_MANIFEST_V1.json** may change for this integration's provenance. Use their actual existing repository paths, do not create similarly named alternatives. No workflow/shared module/original MA1/Auth implementation change.

Preserve the complete previous Task and Handoff history byte exactly, append this R4 and its persisted URL verbatim, and put current head/base/history/gate truth at the front of the Handoff. Manifest binds both exact parents/base trees, all seven resulting PG1 file pins and unchanged code, the full-tree comparison and the fact that previous runtime gates do not transfer to the successor. No circular embedded self-pin; final manifest/commit/tree identities belong in the external immutable delivery receipt.

Required source-level comparison:
- all9,479 current-main leaves preserved exactly;
- exactly seven PG1 new leaves relative to main, total9,486;
- no additional changed/new/deleted path;
- all five Auth-main changed paths exact to actual main;
- all four R3 PG1 source blobs exact.

Do not include HMA1, HS1, AA, HM04 or a caller/Owner binding. No runtime repair or budget change is selected; if any unexpected conflict or source mismatch exists, stop and report the exact evidence rather than invent a fix.

### Delivery and gates

Deliver immutable commit/tree/ordered parents, full untruncated tree comparison, all seven byte/blob/SHA256 pins, complete provenance documents and explicit NOT_RUN status. Source-only in-memory preparation and immutable Git object writes/readback are allowed. No local/project/parser/compiler/SQL/native/test/build/CI/hosted/source-GET execution, package installation, ref/PR update, Ready or merge.

Root independently reviews and publishes a new head only after the stated HOLD is resolved, then requires complete fresh exact-head CI/Preview/review-thread/source/target gates. All nine PG1 native groups and fixed budgets stay unchanged. Actual Dev remains UNAPPLIED; no signed Owner/AAL2 request or public CH→DE truth may be fabricated.

Same reachable session handles any review finding. Root alone Ready/merge. #917/#1131 denied-action boundaries remain unchanged. STOP after this delivery; no follow-on.
