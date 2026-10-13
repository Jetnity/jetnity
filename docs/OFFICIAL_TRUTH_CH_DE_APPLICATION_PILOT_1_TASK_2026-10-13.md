# Official Truth CH-DE Application Pilot 1

Date: 13 October 2026. Binding TL CODE-ONLY implementation task for Issue #938, product parent #917.

Logical writer: **Jetnity Official Truth CH-DE Application Pilot 1 — Codex Generation 1**. One fresh coding session, one branch/PR. This is NOT continuation of the desktop-custody task. Creating this document does not start a session.

Baseline main: `0b7c5034389f74d32075027109ef506b9e463cd8`; tree `4f02945668eeae79c486ccc39a4b5eb44904cfa9`; mode NORMAL. Branch `feat/official-truth-ch-de-application-pilot-1`. Re-read main/mode/#751 at start and before delivery. Read the TL operating standard and current #917/#938 evidence. Do not merge #937 into this branch.

## 1. Decision and measurable product outcome

Build the missing APPLICATION path together, rather than another standalone proof module:

**Owned saved trip -> explicit selected traveller/credential + ordinary CH passport + tourism + complete direct CH-to-DE itinerary/dates -> authenticated, bounded server evaluation of currently verified official material -> existing Requirements engine -> existing OfficialEvaluation[] -> existing Trip Workspace.**

The target is ONE visa proposition, not a complete entry clearance. All other requirements, unsupported travellers, routes, purposes and countries stay unknown. No 90/180-day rule for Swiss citizens, passport-rest-validity rule, visa waiver or entry guarantee may be inferred from a generic country list or a successful test.

The implementation candidate uses the existing application backend, not a GitHub App key, local Mac signer, backup exception or desktop access. First prepare a **supervised, current-request-only** pilot. Reuse the 11 October owner-delegated ephemeral/no-historical-trust direction (`docs/OFFICIAL_TRUTH_SOURCE_ORIGINAL_RETENTION_TL_OWNER_DELEGATED_DIRECTION_2026-10-11.md`, blob `db9b62a0d2637e40eefe25ee49c0e7a08be3b420`). This does NOT authorize a new live trust contract merely by naming it ephemeral. Complete-source identity, source-specific rights/privacy, exact legal scope, protected admission and independent review remain mandatory. No durable government-original storage or historical re-proof is introduced.

Deliver production-quality code with the outer real-use gate CLOSED, a local integrated application rehearsal, and ONE precise release packet. A stub that always returns null is not the requested implementation; conversely no synthetic positive may be exposed through deployed code. Distinguish implemented conditional behavior from a genuinely executed pilot.

## 2. Preserve existing boundaries

- #936/#937 is PAUSED at `43cd55f9636f0f7fa55302a6c8670a41e9db583e`; accepted token fixes and dormant synthetic signer remain preserved. No edits, cherry-picks, new Mac diagnostics, credentials, filesystem or backup operations.
- #934's exact Bern one-shot, its authority, tag and hard stop remain untouched. The old grant is NOT transferable to this application path. No physical Bern request, alternate URL/proxy fetch for that request, ref reservation or authority receipt. An eventual alternate execution contract must be explicitly reviewed and included in the Owner decision packet before real use.
- #913, #741 autonomy restrictions, #865 unsigned retention, G7 advisories and P2 native-PG timing limits remain. No caller/model/test result can become Official Truth. No bypass of denied access or unavailable tools.
- Source profiles/catalog/accepted rows are NOT presumed admitted. main currently has only the GOV.UK compiled identity profile; that cannot prove a German source. #917 remains SOURCE_NOT_QUALIFIED until actual independent qualification.

## 3. G1 code-only shared-contract arbitration: canonical context

The TL authorizes the following minimal additive implementation, NOT a change in real legal applicability:

Persist a versioned regulatory-context declaration belonging to the EXISTING owned Trip, bound to its current revision, traveller reference and explicitly selected credential option/document/citizenship references. Include ordinary-passport class (explicitly selected, never inferred from generic passport), tourism purpose, explicit origin country CH, confirmed complete direct route to DE, and the existing start/end dates. Unknown/default values must remain unknown. The interface must distinguish these user declarations from official evidence.

Prefer a strictly validated namespaced object in the existing trip metadata plus its existing revision-controlled mutation if compatible with the actual contracts. Otherwise prepare the smallest additive UNAPPLIED migration/adapter. Do not silently add columns that hosted schemas lack or write arbitrary JSON around a validating RPC. Update canonical parsing, load/save, serialization, account copy/import and context-fingerprint invalidation together. Old saved trips must still load without these optional fields.

Use existing account registry/credential selection; no second traveller store. Editing/removing citizenship, document, selection, purpose, date or route invalidates a previous result immediately. Cross-trip/account references, duplicates, stale revisions and guessed selections reject server-side. Do not treat a list of zero transit countries as proof of a complete direct route. Do not derive country codes from free text/IP/residence. Do not collect legal names, passport numbers, MRZ, scans, DOB, health or new third-party identity data.

For v1 support one explicitly selected traveller/credential, tourism, direct CH-to-DE only; other passengers/cells remain unknown. Invalid or incomplete inputs must not invoke a source request.

## 4. Real application wiring, not a parallel demo

Implement the form and result flow inside existing `components/trips/KontoArbeitsbereich` and its existing requirements/preparation components, reached via `app/(public)/reisen/[tripId]/page.tsx`. Preserve guest behavior, Auth/RLS account loading, indistinguishable missing/foreign trip responses, existing responsive design and noindex.

Use `lib/readiness/trip-official-evaluations-server.ts`, `requirementsFuerReise`, `RequirementsProvider` and canonical `OfficialEvaluation[]` semantics. Do not add another rule evaluator or an alternate unverified result array in the browser. The global `requirementsProviderAus()` and `requirementsProviderNachZustand` remain OFF for normal visitors in this task. Any pilot selection must be server-held, scoped and separately gated; a query parameter, localStorage flag, header or public environment variable cannot unlock it.

Add one POST action/route for an explicit check, using existing trusted user/role/capability and current AAL2 checks for the initially Owner-only pilot, and a fresh Auth/RLS/revision reload. Never grant roles, change MFA, trust client owner flags or impersonate a different identity. Bound request size, CSRF/origin, concurrency and duration using existing controls. No on-render automatic fetch, cron or autonomous crawler. Use the existing backend configuration, without reading/exporting/generating secrets.

UI states must be integrated and meaningful: context missing, pilot disabled/source not admitted, checking, source-backed visa result, context changed/expired, and unavailable. Source and checkedAt come only from server verification; actionUrl is not guessed from sourceUrl. Keep legal validity separate from operational expiry. A saved user checklist tick is never a visa fact. Failure clears old positives; no stale-while-revalidate truth fallback. Mobile keyboard, labels, focus and error announcement must be verified.

## 5. Current-only source-to-rule boundary

Reuse `loadOfficialTruthServerOwnedRetrieval` and existing code-owned source identity/fingerprint, Evidence, Rule review/verification and projection contracts. No second HTTP stack, injected live transport, pasted HTML, browser scrape, manual accepted DTO, client-supplied registry/hash/clock/approval or model-as-source. Preserve DNS/public-IP socket pinning, TLS, UTF-8/full-body framing and the standard 65,536-byte budget. Do not extend the Bern-specific 131,072 allowance to another source. Any indispensable shared retrieval/security change must be proposed as an exact diff to TL before editing it.

Consume complete verified bytes in the actual request and bind every supporting source/representation/profile version and legal proposition through the existing deterministic verifier. A source identity match is not semantic/legal approval. The source/mapping acceptance must originate from an independently reviewed server-held protected admission, never a caller boolean or a hash-only historical record. If an indispensable current-only acceptance primitive is absent, implement the smallest additive task-owned adapter around the canonical contracts and document its exact authority boundary; do NOT substitute a new general engine.

No cross-request positive cache, raw-original persistence, real accepted-store write, historical claim, or raw material in logs/traces/analytics/browser payloads. The returned application envelope binds trip revision/context and bounded presentation expiry; expiry is NOT legal validUntil. Recheck current admission/kill state before returning. A client result expires or is invalidated on context change; do not claim immediate revocation of an offline screen.

Public-source research is RESEARCH_ONLY. Potential new candidates may be recorded with exact URLs and limitations, but no new source is selected/current/admitted by this task. In particular `https://www.gesetze-im-internet.de/aufenthv/__28.html` contains a treaty-qualified residence-title exemption, NOT a standalone unconditional visa decision; the portal's free-reuse note also says its consolidated text is not the promulgated official version. Any proposed legal composition must cover the actual conditions and be independently qualified. Web-search snippets are not complete runtime provenance. Do not hide unresolved legal/source gaps behind a positive fixture.

If a physical source check, source registration, admission or execution-policy replacement is necessary, put its exact operation, upstream URL, budget, data classes and effect in the release packet. Do NOT execute it. Use unmistakably synthetic local fixtures to complete the conditional application code while such real-use prerequisites remain pending.

## 6. Database and release boundaries

TL read-only precheck: Production `qscbgcdmivbbnzrcyegn` has 59 migrations through `20260927230000`; Development `yfvbxvijcorffwxbxahl` has 78 through `20261005000230`. The actual Development catalogue has trip metadata/revision and generic document type/link/expiry, not the new declared context. These observations are not permission to apply the repository's later migrations.

At most the indispensable additive UNAPPLIED SQL artifact(s) for canonical context/admission/bounded run authorization may be prepared and exercised in disposable native PG. Reuse existing ownership/RLS/capabilities; no broad service-role table grants, hosted SELECT shortcut into private originals, global migration sweep or alteration of past migration history. No hosted DDL/DML, real source admission, actual key/contract/provider/cost or Production change. If robust per-run limits need an atomic backend reservation, define it in the same minimal proposal; never pretend a serverless process-local counter is global one-shot enforcement. Do not reuse the Bern tag/authority.

Provide one staged release packet with exact outstanding facts rather than another list of generic audits:

A. Which independently reviewed source/mapping and application contract support precisely which result? Which real-use gate is still missing?
B. Exact Development reconciliation/apply/source-admission/Owner-only pilot operations, finite budgets and expected readbacks. No legacy migration bulk apply.
C. Protected first genuine evaluation and visible Workspace witness; this cannot be replaced by synthetic tests. Source/legal/Owner acceptance remains separate from code acceptance.
D. Exact Production promotion scope and rollback/disable, only after the genuine controlled pilot passes and the applicable Owner approval exists. Normal visitors remain disabled now; no public launch/indexing.

There is no generic "turn it all on" instruction. Do not ask the Owner to repeat existing code/setup permission; bring one consolidated precise decision packet to TL. Fundamental rule/rights/identity changes remain reserved.

## 7. Tests and delivery criteria

Use focused tests during implementation. At the final material code head, run the prescribed full suite/native PG, typecheck/lint/schema/API/hygiene/build and fresh CI/Auth/Preview. Do not create gratuitous documentation commits that restart the full suite. Preserve failures and existing 240-second native-PG limit; do not retry indefinitely or remove assertions for green.

Required integrated local application proof: synthetic owned account/Trip is loaded through the real route -> select linked ordinary CH credential and save declarations -> reload -> trigger check -> validate complete synthetic source and protected synthetic acceptance through real conditional server code -> canonical visa row rendered with source/time and other cells unknown. Also prove source not admitted, altered/partial/oversize material, false authority, wrong account/AAL, stale revision, missing/withdrawn admission, incompatible route and timeouts produce no positive. The synthetic test seam must be unreachable in deployed Preview/Production. No public fake data or demo page.

Record browser proof at smartphone and desktop sizes, or the exact missing browser capability without claiming success. No new paid service or unreviewed package installation. Scope code and tests together. An unavailable external gate must not block finishing independent in-scope integration, but cannot be relabeled passed.

Deliver actual code plus one consolidated REPORT/HANDOFF and release packet in `docs/OFFICIAL_TRUTH_CH_DE_APPLICATION_PILOT_1_*`; include exact HEAD/tree/parent/diff, changed-file list, session evidence, CI attempts/original logs/Preview and acceptance matrix. Report separately: CODE_IMPLEMENTED, LOCAL_APPLICATION_PROOF, REAL_SOURCE_QUALIFIED, REAL_OWNER_PILOT, PRODUCTION_VISIBLE. Do not claim the last three from the first two.

## 8. Owned/shared paths and STOP

Owned: new `lib/readiness/official-truth-ch-de-application-pilot-1/`, task docs/tests and minimal pilot server action. Narrow shared edits explicitly allowed for sections 3–4: canonical trip types/parsing/mutation/load/context invalidation, existing account Workspace requirements UI, `trip-official-evaluations-server.ts`, and supporting tests. Preserve unrelated page/business behavior. If new shared storage/security contract is required beyond section 6, request one exact TL arbitration, not another broad permission.

Forbidden: changes to #937 custody/App paths, old Bern authorization/network hard stops, global governance/operating mode, Auth/MFA/roles, historical migrations, package/lock/workflows, noindex/launch, providers/payments or unrelated product modules. Needed protected retrieval/security diff must be pre-reviewed as above.

Commits/pushes on this branch only; no force push. Agent MUST NOT mark Ready, merge, start another agent or a follow-up slice. Stop after the coherent implementation/handoff for independent TL review. All genuine network/admission/hosted/Production actions remain gated. No claim of background work or automatic session start from issue publication.
