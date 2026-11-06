# Official Truth AA Application Protocol 2 Integration 1

Date: 6 November 2026
Status: VERSIONED IMPLEMENTATION TASK / Draft only / Technical Lead controls Ready and merge
Issue: #1144 · Parent function: #917

## Outcome and verified baseline

Implement the missing source-specific protocol and size handling in the existing CH→DE application path. A complete synthetic AA-shaped response above 64 KiB must reach the actual canonical Evidence → Review → trusted extractor → Rule acceptance → requirement projection chain under explicit isolated test admission. The production admission gates remain closed. This is an application integration prerequisite, not a claim that a real official source, database, or the whole entry function is live.

Independently verified main: `364fb378b965b953e0a50cab6fbc6b5f8a5f4fe9`; tree `492000100db7a14762456e469193fef8b9b14ac3`.
Operating mode: NORMAL. Main CI 42276770333 completed/success. Production `dpl_4JTt6DYpxWymA4WSQu5JTTtgc3r3` READY at that exact SHA, with jetnity.com bound to it.
The current evaluator fixes the maximum at 65,536 bytes, assumes V1 hashing, and omits the fingerprint protocol from extractor input.
The existing source budget helper admits Bern only, and its V2 predicate hard-codes the Bern request URL.
The researched AA representation was 93,365 bytes; this historical observation is not current transport custody.
#1143 delivered the AA identity candidate; it remains current=false and unregistered.
#1142 already delivered the offline current-owner/session correction with 27 native tests; do not rebuild it.
Full continuity: https://github.com/Jetnity/jetnity/issues/751#issuecomment-6693525567 .
Functional remaining work: https://github.com/Jetnity/jetnity/issues/917#issuecomment-6693494599 .

## Ownership and operating contract

Fresh author logical name: **Jetnity AA Application Protocol 2 Integration 1 — Codex Generation 1**.
Planned actual author session: `/root/aa_application_protocol2_writer`.
Branch: `feat/official-truth-aa-application-protocol2-1-20261106`.
One implementation writer. Cursor remains paused; no Cursor dispatch, polling, settings or spend.
Root may write the task and publish the author's supplied files/commits; reviewers are read-only.
Read AGENTS.md, the Technical Lead operating standard, multi-agent standard, current mode, relevant vision/architecture/quality/continuity/logic/review-depth contracts, and current implementation/tests before editing.
Immediate review fixes stay in this same author session. Every changed head invalidates earlier exact-head gates.
No author Ready/merge or automatic follow-up slice. Stop with an honest handoff for root review.

## Exact implementation scope

1. Extend `lib/readiness/official-truth-ch-de-source-budget-128k-1.ts` with one exact AA binding. Preserve the existing Bern binding and all strict checks.
2. Source candidate ID `de-aa-staatenliste-visumpflicht`; proposed local content item `aa-staatenliste-visumpflicht-207820` version 1; representation `aa-staatenliste-visumpflicht-html-de` version 1; identity profile `de-aa-visa-table-html-de-candidate` version 1. These are code-owned local IDs, not externally issued authority identifiers.
3. Exact request and final URL: `https://www.auswaertiges-amt.de/de/service/visa-und-aufenthalt/staatenliste-zur-visumpflicht-207820`; media type `text/html`; maximum 131,072 UTF-8 bytes. No redirect, hostname suffix, path prefix or family-wide allowance.
4. Permission still requires the identical current profile object from the unchanged compiled identity-profile registry, together with the complete current item/representation/version tuple and exact URL/MIME. No caller or injected catalog may enlarge privileged production transport. Since AA is absent from that compiled registry, real AA permission remains false.
5. Make `officialTruthChDeSourceFingerprintV2Allowed` select the request URL from the matching exact tuple instead of always using Bern.
6. Update `lib/readiness/official-truth-ch-de-application-pilot-1/evaluate-server.ts` to verify the supported source fingerprint protocol and full UTF-8 body bound correctly. V2 requires exact source-specific permission and the existing V2 hashing contract. Preserve the protocol in the extractor projection; preserve canonical downstream Evidence/Review/Rule contracts and fail closed on inconsistency.
7. Preserve existing supported V1 semantics, including any canonical legacy omission rules. A V2 body/hash cannot downgrade to V1 or pass with a missing/unknown/contradictory protocol.
8. Extend the existing `scripts/official-truth-ch-de-application-pilot-1/fixtures.ts` and existing application tests for the actual complete path. Test-only module substitution is acceptable only outside the deployed graph. Do not stub a successful Evidence packet, accepted Rule, or positive requirement to claim integration.
9. Candidate import must remain in `.test.ts` only. Its existing import/isolation guard must not be weakened. Pass a frozen test-only profile copy through the existing fixture interface if needed; never mutate the candidate or production registry.
10. A narrow budget test may be added. Existing importer inventories may be extended only with an explicitly test-only path if actually necessary; no generalized allowlist.
11. Write a concise handoff documenting actual implementation, commands/results, limitations, risk classes and exact remaining live gates. Add brief architecture/roadmap/decision notes only where needed to keep the changed data flow truthful; no historical evidence rewrite.

## Owned files

Required production changes are limited to the existing source-budget module and application evaluator.
Allowed test changes: existing application.test.ts, existing fixtures.ts, and a narrow `lib/readiness/official-truth-aa-application-protocol2-1.test.ts` if justified.
Allowed documentation: this immutable task (root amendments only), `docs/OFFICIAL_TRUTH_AA_APPLICATION_PROTOCOL2_1_HANDOFF_2026-11-06.md`, concise scoped notes in ARCHITECTURE.md / ROADMAP.md / DECISIONS.md if material.
If a material production change outside those two modules is necessary, stop and report the concrete missing dependency to root before changing it.

## Explicit boundaries

- No edits, copying or rebuilding of held #1131 native transport/body-completeness changes; that PR's separate Ready denial is not resolved by this work.
- No retry, rewording, rerouting, delegation or manual replacement of the denied #917 database readback. No Supabase queries, migrations, grants, roles, RLS, Auth/session configuration or hosted database writes.
- No Stage1 replay. Stage1 retains APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING. Management health metadata does not satisfy that readback.
- Stage2 remains NOT_ATTEMPTED, with #1139's current-owner/session and post-wait authorization defects still blocking its unchanged installation.
- No production profile/source/representation registration, candidate current=true change, ApplicationContract/extractor registration, pilot availability/enabled flip or provider activation.
- Generic transport remains 65,536 bytes. Bern remains excluded from this application pilot. No Protocol3, seven-country queue or accepted-store-reader work.
- No real government requests, legal certification, paid calls, credentials, user data, new dependencies, app endpoints or UI changes.

## Acceptance and meaningful tests

- Existing V1 success and fail-closed paths continue to pass.
- Synthetic complete AA-shaped HTML around 93 KiB executes the actual evaluator and canonical Evidence/Review/trusted-fact/Rule chain under isolated test admission, producing one visa requirement with no invented other entry result.
- Protocol2 survives each handoff and extractor projection; the positive is derived from the real strict synthetic table decoder.
- Missing/downgraded/unknown protocol where V2 is required, wrong hash, wrong identity/versions/URL/MIME, absent or noncurrent/unregistered profile, redirect and >131,072 UTF-8 bytes reject.
- Caller-cloned matching profile does not replace compiled-profile object identity; injected catalogs cannot widen live transport.
- Generic foreign sources remain limited to 64 KiB; Bern remains rejected by the application evaluator.
- Grant withdrawal, changed trip, missing authority, cancellation/deadline and final catalog drift still revoke a positive result.
- With actual unmodified production registries and gates, AA remains unadmitted and the application remains disabled.
- Run relevant tests and source architecture/isolation guards. Full npm ci/typecheck/lint/hygiene/build and existing test suite are required on the final exact head through CI or a genuine complete checkout. A missing dependency or skipped command must be reported honestly.

## Risk and release disposition

P0: none identified for this bounded dormant code change.
P1 remaining for live function: #1139 effective authority correction and target-state proof; #968 Preview/Production isolation; held #1131 response completeness. This task does not close those issues.
P2 implementation risks: protocol downgrade, widening an unadmitted source, bypass through test injection, inconsistent fingerprints across canonical layers. Tests and independent root review must address these before PASS.
P3: unchanged existing lint/dependency residuals must be compared to baseline, not silently accepted as new.
No new recurring infrastructure or provider cost.

Root independently reviews the whole diff at the actual head, all relevant threads and claims, targeted behavior, CI and Vercel Preview. Only root may then Ready/merge a normal scope-faithful PR. After merge verify actual main CI/production binding and persist the final result in #1144/#917/#751. No final completion claim for the overall entry function.

## Root amendment R2 — protected application blob pin (6 November 2026)

Root review: [CHANGES REQUIRED R2](https://github.com/Jetnity/jetnity/pull/1145#issuecomment-6696270989), reviewed head `33331ddc928ddac87363d8d2338cb6c20bc7aa19`. Full CI 42295269382 ran 8,004 tests: 8,001 passed, one failed and two unchanged browser-layout skips. The failure is the BP1 guard's old application-evaluator blob pin; all 54 application cases and both previously incomplete canonical trip-cancellation cases passed. Later hygiene/build steps were skipped after the failure.

This task additionally authorizes exactly one literal replacement in `lib/readiness/official-truth-bundesportal-bp1-observation-1/observation.test.ts`: the expected blob for `lib/readiness/official-truth-ch-de-application-pilot-1/evaluate-server.ts` changes from `9c4c244f628942d30f4a235f40ec5ad5bfe1724f` to the independently reviewed `aa3b3086394b1c30dbfd1e0ffb9604f43db8bde4`. Preserve all other four pins, the assertion, five-path inventory, quarantine, profile/contract/activation and application-reachability checks. The existing native transport pin remains `5998fdea54d3337fb68cd7111460b59e43a3cef7`.

The same author/session performs this immediate correction and appends the honest R1/R2 handoff. No production code or other test behavior changes. Root owns this task amendment and remote publication. Root inspected held #1131: its framing fixtures, response expectations, new framing test and transport-pin change are outside this amendment and must not be copied. Sharing a test filename does not clear that separate held work.

Every new head requires full fresh CI/Preview and independent root review. No old-head rerun, test skip/deletion, computed self-accepting hash, source/DB operation, Ready, merge or follow-up by the author. All other task boundaries remain in force.
