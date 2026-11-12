# CH-DE-AA-REVISION-PROBE-1 — TASK V1

## Selection and execution state

Root explicitly selects this necessary CH→DE source-revision task under the owner's existing authorization. This is a new bounded task, not an automatic unrelated slice and not continuation of a blocked action. Initial state **SOURCE_ONLY / UNARMED / runNumber:0**. Implementation may be prepared as immutable Git objects while finite M04 documentation closure PR#1190 runs. No branch publication, project execution or actual source request by the writer.

Source base: accepted code main **32cd11f79eecb766d4a28d6db928d25bf1748bea**. Before arming, Root must finish PR#1190's own actual-main/Production acceptance, select the resulting current main, verify the relevant source equality and explicitly bind one fresh CI run. Final reviewed head may differ from this preparation base; no gate is transferred across a changed head.

Selected author: **Jetnity Official Truth CH-DE AA Revision Probe 1 — Codex Generation1**. Intended actual session **/root/aa_revision_probe_writer_g1**; actual tool/session evidence must be recorded truthfully in the handoff. This is a new task/session, not a resumed historical Cursor or D1 session. Root controls review, publication, arming, Ready and merge. Agent self-review is not TL-PASS.

## Purpose

Exactly one full native HTTPS observation of the fixed German AA page, comparing the complete response with the existing reviewed V2 body pin. Return only bounded research metadata. This is neither an Accepted Evidence/Rule/Method/Import result nor production custody. No public entry answer, source registry activation or product-window extension is part of this task.

Fixed URL:
https://www.auswaertiges-amt.de/de/service/visa-und-aufenthalt/staatenliste-zur-visumpflicht-207820

Existing expected complete normalized V2 pin:
fc34bb51f8493a8776b6a300c8aed493a4a4fe08fba269148292ed7d9a334979

Existing source is reviewed change-control data, not current admission. MATCH means existing V2 equivalence, including exactly CRLF/CR to LF normalization; it does not mean raw byte identity. MISMATCH can reflect boilerplate and is not a legal-change conclusion. No new observed hash is published or adopted.

## Exact five-file allowlist

1. lib/readiness/official-truth-server-owned-retrieval.ts — only additive research entry/private helpers and strictly required static imports. Every pre-existing function and primitive, current live paths, Bern path and permissions must remain byte-identical after removal of the narrowly delineated additions. No generic refactor.
2. lib/readiness/official-truth-aa-revision-probe-1-policy.ts — new closed, frozen task/CI/source-inventory/binding constants; initially runNumber0, unarmed. No setter or caller/environment override for URL, pin, budgets or authority.
3. lib/readiness/official-truth-aa-revision-probe-1.test.ts — new discovered core test, synthetic preflight and exactly one gated real entry invocation; closed import-consumer inventory.
4. docs/official-truth-product-v3/AA_REVISION_PROBE_TASK_V1.md — this Root task, verbatim, with its persisted issue URL. Final explicit Root arming amendment may be appended as a separately dated state, never invented.
5. docs/official-truth-product-v3/AA_REVISION_PROBE_HANDOFF_V1.md — exact actual author/session, task, changed blobs/pins, honest source-only self-review and remaining gates. No fabricated CI, GET or MATCH.

Everything else stays byte-identical. In particular no workflow/package/lock/hygiene/inventory exception, C1 context/window, old mapping/ReviewedSource, profile/registry/extractor, SQL/Auth/MA1/DB/secret/source-catalog/public-route/scheduler change. No #1131/#985/#937/#1135 patch use or held-branch action.

Proposed eventual branch: feat/official-truth-aa-revision-probe-1-20261112. Only Root may create/update it or its Draft PR.

## Required closed API and native transport

Add a no-argument server-only entry:
probeOfficialTruthAaReviewedRevisionV1(): Promise<OfficialTruthAaRevisionProbeV1Result>

The result is a closed research metadata union, not any existing trusted retrieval/evidence type. No exported primitive, raw response/body or injectable production transport. Private helpers or offline test seams may only support synthetic tests and must be separately unmistakable; they cannot generate a genuine CI observation or trusted result. Prefer fixture-module replacement inside the test over enlarging the production API.

Reuse existing private serverDns, serverHttp, officialTruthServerOwnedRetrievalLookup, hopLesen and textAus without changing their implementations. Existing native serverHttp already exposes framingComplete; no #1131 change is needed. The new private wrapper must require exact HTTP200 before positive processing because hopLesen normally accepts other2xx.

One fixed HTTPS GET only; no HEAD preflight, retry, redirect follow, alternate URL, proxy, cookies or caller headers. Preserve fixed identity encoding/no-cache headers, public-address DNS validation, same checked lookup, verified TLS/default443 and existing stream handling. Reject every redirect/status other than200. Require text/html with the existing strict UTF-8 MIME rules, identity content encoding, complete valid UTF-8 and protocol2 from officialTruthSourceFingerprintProtocol(text,actualBytes).

Maximum131072full response bytes and10000ms total physical-read budget, including DNS/request/body. No relaxed budget. Use cancellation/finally cleanup and terminal abort/deadline checks; a late success or delayed timer must not become positive. After the complete native async body traversal require the existing framingComplete() to be exactlytrue. Any truncation, stream/UTF8/MIME/encoding/size/error/timeout/uncertain completion is nonpositive. Do not change general Content-Length behavior.

Compare with the unchanged officialTruthSourceFingerprintV2 using the complete exact nine-field binding copied as immutable research data from the current reviewed source. The test must independently compare those constants against the actual reviewed module; do not add a production import of that dormant candidate. Existing V2 helper/protocol/body reader/digest behavior remains unchanged.

Only after full MATCH run the unchanged chDeAaS1VisaRowResearchFromHtml on the same ephemeral full text; record only a finite recognized/refused research status/reason. This does not grant legal applicability, accepted Evidence, actual source custody or document/purpose/date authority. No raw source leaves the physical function. A MATCH with an unrecognized/refused S1 result is not adequate evidence for a later positive window decision.

## Execution selection before any DNS/HTTP

All conditions must pass before any physical effect:

- GITHUB_ACTIONS true; GITHUB_EVENT_NAME pull_request; GITHUB_JOB verify; GITHUB_RUN_ATTEMPT exactly1.
- Repository Jetnity/jetnity, repository ID1020187087; payload root, head and base repositories must all be that same repository/ID. Same-repo PR only.
- Exact designated new head branch; base branchmain and exact final Root-selected base SHA.
- Workflow CI at .github/workflows/ci.yml. GITHUB_WORKFLOW_REF/GITHUB_REF must match the fixed repository/path and the actual numeric PR number in the trusted event payload. Do not guess a PR number or confuse the PR head with synthetic merge SHA. Event head SHA and environment synthetic checkout/ref must be kept semantically distinct.
- One specific positive GITHUB_RUN_NUMBER selected by Root immediately before publication;0 is always unarmed. Strict bounded numeric parsing, no prefix parse or coercion.
- Exact finite source inventory by actual bytes, including final Reader/test and unchanged body/fingerprint/digest/S1/reviewed metadata as needed. No policy-selfhash loop: policy's own blob and complete tree are externally bound by Root exact-head review. No dynamic filesystem search, broad glob or unbounded event-file read. Refuse ambiguity/symlink/nonregular/overlimit source or event input.
- Atomically consume one fixed task/run-specific claim in the trusted runner temp directory before the physical call. Exclusive creation, no reset/retry/overwrite; an existing or uncertain claim refuses. A process-local boolean alone is insufficient.
- The same closed trusted CI flow must finish all relevant synthetic preflight assertions before invoking the physical entry. A failed synthetic assertion cannot fall through to the GET.

Wrong/missing context, another run/attempt/job/event, main push, duplicate invocation or an intervening workflow-number race must produce zero DNS/GET. Do not automatically rearm or retry. If the single attempt is lost, report honestly and stop that attempt. This binding concerns the reviewed trusted GitHub CI environment; it is not claimed as cryptographic authority against an administrator rewriting code/environment.

No alternative runner/workflow, no local execution, manual GET or copied interpreter. Existing CI is the sole authorized execution surface. Auth logs remain unread.

## Allowed result and forbidden output

Every result must have a finite allowlisted schema and bounded enum fields. Permit: task/version, actual selected CI run/attempt/head/PR metadata where verified, UTC observation timestamp, fixed URL, fixed/allowlisted MIME, safe completeness/transport status, full byte count only after completed response, V2 protocol, MATCH/MISMATCH/UNKNOWN, finite S1 recognized/refused state and explicit research-only/no-production-authority boundaries.

No rawHTML/text/snippets, header/cookie/location/IP/certificate values, environment values, free exception/stack/error strings, actual new mismatching hash, byte arrays, request/response object, stored source, artifact upload or new trusted receipt. Catch unexpected exceptions into a fixed finite reason without logging their messages. A synthetic result is never relabeled as actual official observation.

One bounded metadata line from the selected real invocation is sufficient. Ordinary nonselected CI runs must remain safe/no-effect and must not assert a live-source PASS. Do not fail a controlled MISMATCH merely to invite an unchanged workflow retry; record the actual negative outcome and its limits.

## Required meaningful synthetic coverage

Prove every selection dimension, Run0, attempt2, mainpush, otherrepo/fork/branch/base/workflow, malformed event/inventory, wrong input types and duplicate physical invocation refuse before DNS. Verify final source pins and the complete original ReviewedSource binding.

Prove fixed request identity, exact200, all redirect classes, other2xx/errors, wrongencoding/MIME/charset, empty/BOM/invalidUTF8, partial/truncated/throwing stream, overlimit, abort/timeout/latecomplete/framingunknown are nonpositive and clean up. No actual network in these cases.

Prove complete synthetic V2 MATCH and MISMATCH, changed fullbody including footnote, changed binding, protocol1refusal and exact CRLF/CR equivalence only. Prove current S1 recognition/refusal retains its research-only semantics. Ensure every result shape contains only allowed metadata, including adversarial body/header/cookie/error-text sentinels. No assertion failure can print a real body.

Prove only the new test consumes the no-argument entry, without aliases/namespace/default forwarding, runtime/dynamic/transitive App/API/cron/provider imports or hidden escape paths. Keep all current import isolation checks unchanged: reviewed-source import only in the test, Reader remains the existing content-identity importer, no C1/protected-source amendment. Existing reachability/export checks already count tests; no hygiene exception.

## Delivery and review

First deliver only an unarmed immutable source candidate (no branch/PR), exact five-file diff, full file/blob/SHA256 inventory, source-preservation proof and honest self-review. Root and independent reviewers then inspect all code and boundaries. No local/parser/build/test/install/native/SQL/network execution by the writer.

Root later issues an explicit arming amendment after M04#1190 actual-main acceptance. Same reachable author/session applies the exact base/run/source-inventory constants to a new immutable candidate. Every changed head receives full independent review and new exact gates. Only Root publishes; the one newly selected existing CI run may then execute the one research request. Root reads the actual complete metadata original and all required CI/Preview/production evidence. No automatic retry or new run.

MATCH + recognizedS1 may support a separately selected, reviewed product-window revision under the already granted owner authorization. MISMATCH/UNKNOWN/refusal does not authorize repinning, accepting a legal fact, extending a window or public launch. #1139/#1142actualtarget/authority gate, D1 runtime binding, real history/countercheck/custody and public cache/pending/update remain separate.

## Immutable starting identities

- Reader5998fdea54d3337fb68cd7111460b59e43a3cef7
- BoundedBody783d802fff48a2969b86945515b159a513df76e9
- FingerprintV2 72d324d019625c5028be8f47763fdd0f6ffe38e5
- S1 decoder888435e2867ff373b85b0299833c3f1fe34c0af3
- ReviewedSource e00f71f993fe558d657ca409436ee62410869b25
- ExistingCI22f6e50aaff600749814bf7e77e24c728b1cd5d5

The owner's goal remains first genuine public CH→DE by15November2026, with all ordinary PO steps already approved. This scoped research task does not claim the goal is already reachable past unresolved real platform/security boundaries.


## Persisted Root task

https://github.com/Jetnity/jetnity/issues/917#issuecomment-6813230211

## CH-DE-AA-REVISION-PROBE-1 — TASK V1 / amendment A1 (source isolation precision)

Root Technical Lead decision, 2026-11-12. This is a narrowly versioned source-only clarification of TASK V1 in comment6813230211 after independently reading the complete existing consumers. It changes no platform permission, held STOP, allowed file list, live-path primitive, execution gate, source pin, output limit or run0/unarmed state. It is not arming and grants no GET.

### Observed source truth

The existing native-loader imports the Reader namespace, spreads it into private sourcePort and returns that object to internally compiled Reader imports. Consequently an additive Reader export is passively copied there; the absolute earlier phrase “without namespace/forwarding” cannot truthfully be proved for that unchanged legacy harness. Its sourcePort and load function are private and not returned. The actually selected producer imports only the old loadOfficialTruthServerOwnedRetrievalWithCatalogTransport and does not select/call/re-export the new probe. The old R2 test uses only immediate named destructuring of decideOfficialTruthServerOwnedRetrieval, without rest or retained namespace.

Root independently read these actual sources; independent reviewer /root/ch_de_ci_reconstruction confirmed the same concrete P2 contract/evidence mismatch. Source-only recommendation accepted; this is not Candidate-PASS or an agent self-review substituting for TL-PASS.

### Precise binding replacement

Only the new AA test may intentionally import, select, reference or invoke the no-argument probe entry. The one existing private Native-Harness namespace/sourcePort spread may remain exactly byte-identical, with the passive transport explicitly disclosed. It grants no invocation or injectable transport. The closed entry must still refuse any unselected job/run/attempt/context before DNS; accepted_store_native is not the selected verify job.

The new consumer guard must fully pin the legacy native-loader's actual bytes, inspect its private return boundary and inspect actual Reader consumers rather than skipping that file. It must verify the actual producer remains a named consumer only of the old loader. The R2 case is accepted solely as its real direct named-await-destructuring form. New namespace/rest/default/alias/forwarding paths, any new probe selection or invocation outside the new test, changed legacy harness forms and App/API/cron/provider reachability all refuse. Existing isolation/hygiene/inventory tests stay completely unchanged; no generic ignore or allowlist entry.

Independently calculated current pins (full UTF-8 bytes):
```json
[
  {
    "path": "scripts/db/official-truth-accepted-store-trip-integration-1/native-loader.ts",
    "blob": "7f79dba1cbdc4a6807f094a4873ba3ad635b7b46",
    "bytes": 6501,
    "sha256": "49ab7d7c68afcc30d80251db85e47041e2962f0c83cecf7f63964ce64aa4b298"
  },
  {
    "path": "lib/readiness/official-truth-accepted-store-trip-integration-1/producer-server.ts",
    "blob": "b77667a2b345ff272a5379aaa9a08d409e25d208",
    "bytes": 9176,
    "sha256": "74a83b4b62711da43f4f6efdf94e4dd162bfcad5c06af253af3300dd59a27572"
  },
  {
    "path": "lib/readiness/official-truth-content-identity-r2.test.ts",
    "blob": "01c032582fb37fd0881c828610a83db483c6d688",
    "bytes": 41838,
    "sha256": "be7a0b62e55c557faf05963befd5b717b7ea245bc71d2a85eb4fd0d3f5225c16"
  }
]
```

These unchanged consumers may be added to the new task's exact finite proof inventory. No dynamic discovery in the production selection path; its source/event reads remain bounded/regular/no-follow. The independent new test may perform the already planned closed consumer analysis, including root/Widgets and import forms; it must not change pre-existing guards or claim passive forwarding is absent.

Exactly the original five allowed paths remain. Preserve the original TASK V1 text verbatim in AA_REVISION_PROBE_TASK_V1.md, followed by this amendment verbatim and its persisted URL. The same actual writer/session Generation1 /root/aa_revision_probe_writer_g1 implements it in the unarmed candidate and records the limitation honestly. No branch/PR/CI/live request now; Root source review and complete regating are still required.

M04#1190 has meanwhile merged to4313049c2a8c276f2a63101dda8df996327230e0; its own pushCI43150141948/#4117/attempt1 and Production/bothaliases acceptance are still PENDING. The new probe remains runNumber0 until Root separately selects and binds one fresh reviewed run after those gates.


## Persisted Root amendment A1

https://github.com/Jetnity/jetnity/issues/917#issuecomment-6813757462

The task and A1 above are reproduced verbatim. This source-only candidate has no arming amendment.


## CH-DE-AA-REVISION-PROBE-1 — TASK V1 / amendment A2 (one selected CI attempt)

Root / Technical Lead, 12 November 2026. This amendment follows independently accepted actual main and continues the already authorized CH→DE source-revision task. It changes only the selected base/run and honest delivery documentation. All TASK V1/A1 security, transport, scope, source-inventory, output and no-retry boundaries remain.

### Completed prerequisite and live selection

R41 PR #1191 is merged and its **own actual-main/Production acceptance is complete**: [Root receipt6815551751](https://github.com/Jetnity/jetnity/pull/1191#issuecomment-6815551751), posted and reread exact. Current main **dfd692440762b50183fdebbfd6bf8dabde4662d0**, tree **cbc79e627161d4ace132b84cf057c18adc86586c**. Own push CI43159688543 / #4119 / attempt1 completed SUCCESS, all eight jobs; Production dpl_JAYJkYUHWZMDKPdFEUfUSvFa97DT and both public aliases are bound to this exact main. The earlier #1190 own-main failure is repaired by R41, not relabeled as a pass.

Root freshly read the workflow-run inventory at **05:30:17 UTC**. The latest CI workflow335237996 / .github/workflows/ci.yml is runNumber4119, with no later CI run in the returned newest inventory. Root explicitly selects **runNumber4120, attempt1, pull_request, job verify** for this one observation, on the existing CI workflow only.

### Exact source instruction

Same reachable original author: **Jetnity Official Truth CH-DE AA Revision Probe 1 — Codex Generation1**, actual session **/root/aa_revision_probe_writer_g1**. Start from the previously source-reviewed unarmed candidate59c794fbcbf7a16bb0d4e8d1e89e3d29b7bd88b9 and the newly accepted main above.

Prepare a new immutable candidate with sole parent dfd692440762b50183fdebbfd6bf8dabde4662d0 and exactly the same five task paths:

1. Reader remains byte-identical to blob2b14953968da35ca47b272fd67a1a912613b8e6d.
2. Test remains byte-identical to blob49b78c83b1cb5adf4f3fc0c46d8ff6a840e9be30.
3. Policy: change only runNumber0 to **4120** and baseSha4313049c2a8c276f2a63101dda8df996327230e0 to **dfd692440762b50183fdebbfd6bf8dabde4662d0**. All thirteen inventory entries, fixed source/binding/URL, budgets and expected V2 pin remain exact.
4. Task: preserve the full existing TASK V1/A1 text as dated evidence and append this amendment verbatim with its persisted issue URL. Its earlier unarmed statement is historical and is superseded only by this explicit A2 selection.
5. Handoff: truthfully record the new base/run, unchanged Reader/test/inventory, exact source-only review limits and this same actual session. An armed constant is not an executed GET or runtime PASS. Preserve prior evidence/limitations and identify superseded states clearly.

Independently read the current base and all changed immutable objects, verify the full tree and thirteen-source byte inventory, and deliver exact blobs/bytes/SHA256, commit/tree and self-review. **No branch, PR, Ready, merge or execution by the author.** No local project/parser/test/build/install/native/SQL/network run.

### Root publication and one-shot effect boundary

Root and an independent reviewer must review the exact new candidate before publication. Root will recheck current main and workflow inventory immediately before creating the designated branch **feat/official-truth-aa-revision-probe-1-20261112** and its Draft PR. The actual PR number must come from GitHub and be verified through the already authored event gates; it is not guessed here.

Only the actual selected CI4120 / attempt1 / pull_request / verify context, exact base and source inventory, successful synthetic preflight and exclusive persistent claim may reach the single fixed AA HTTPS GET. All other events/runs/attempts, including subsequent main push, must remain zero-DNS/zero-GET. If the selected number is consumed by an intervening run or a required condition fails, do not silently alter constants, reset a claim, rerun, rearm or use another transport. Report the exact non-execution or negative outcome. A platform/security denial remains a stop, never a retry.

One fixed exact-200 full response, at most131072bytes and10000ms, no HEAD/redirect/retry/alternate URL/caller credentials. No raw body, source snippets, newly observed hash, secret or unbounded error output. MATCH means only the existing V2 normalized revision equivalence; S1 recognized/refused retains research-only semantics. No automatic legal acceptance, registry/DB activation, new pilot window, D1 operational state or public CH→DE result is granted by this amendment.

The source revision and later window work remain within the user's already approved CH→DE-by-15-November path. #1131 is NOT_REQUIRED and untouched; #917's original denied readback is unrelated and remains unrepeated. No unrelated travel/hotel/flight scope.


## Persisted Root amendment A2

https://github.com/Jetnity/jetnity/issues/1162#issuecomment-6815566959


## Technical Lead — CHANGES REQUIRED / AA A3 Review-Fix

**Exact reviewed candidate:** adfa7e43cc723b6f852b0182b7c5ca7c211a99a6, tree408f7c8502ec6a5d23d9ce57e3972da635fd56b1, sole parent/current main dfd692440762b50183fdebbfd6bf8dabde4662d0. Root independently reproduced the source finding after the separate reviewer /root/ch_de_ci_reconstruction reported it. No branch/PR/CI/DNS/GET has been published or executed for this candidate.

### A3-BP-PIN-01 — existing protection test would fail

lib/readiness/official-truth-bundesportal-bp1-observation-1/observation.test.ts, unchanged blob39c668f0f95424c25f22e7db8448072f44052e87, lines254–266 hashes the entire Reader with Git blob framing and demands5998fdea54d3337fb68cd7111460b59e43a3cef7. Candidate Reader is2b14953968da35ca47b272fd67a1a912613b8e6d. The unchanged package test:core includes lib/**/*.test.ts, and existing CI verify invokes it. This is a deterministic incompatibility; the AA one-shot might already run before the independent protection test fails. Do not consume selected CI4120 with this known defect.

The previous five-path/source-preservation checks and thirteen inventory pins remain valid as source observations, but they are not a candidate PASS. No existing failure is reclassified.

### TASK V1 amendment A3 — exact, bounded correction

Same logical author **Jetnity Official Truth CH-DE AA Revision Probe 1 — Codex Generation1**, actual original session **/root/aa_revision_probe_writer_g1**. Continue A2 as an immediate review fix. All prior TASK V1/A1/A2 transport, security, no-retry and publication restrictions remain. Root explicitly expands the allowed tree delta from five to six paths solely by adding the existing BP1 observation.test.ts above.

1. Reader stays EXACT blob2b14953968da35ca47b272fd67a1a912613b8e6d (65490bytes); AA test stays EXACT49b78c83b1cb5adf4f3fc0c46d8ff6a840e9be30; A2 policy stays EXACTbf46b14a4ff2c0ea3adfac000b9811629f3e1dbf. All thirteen inventory entries, runNumber4120/attempt1, base dfd692, fixed URL/budgets/V2 pin and all execution gates remain unchanged.
2. Change only the BP1 Reader preservation check and directly necessary local test support. Retain the original full-Reader5998fdea pin as the authoritative original-byte proof. Exactly identify the two authorized additions (690-byte import span and18729-byte appendix); require their precise bytes/bounds and independent hashes plus the exact full current Reader hash. Remove only those exact bounded additions to reconstruct and verify the complete46071-byte original Reader. No blind repin, broad regex stripping, deletion/skip of the guard, permissive allowlist or weakened existing protected-file/application/quarantine/CLI checks.
3. Include meaningful in-memory negative witnesses for altered original bytes, either addition, missing/duplicated/misplaced addition or extra trailing bytes. These must use the same preservation predicate; no network, new public exports, product consumer or transport changes. Existing other four protected-file hashes and assertions stay exact.
4. Preserve complete old Task/A1/A2 text and append this A3 verbatim with this persisted issue URL. Handoff gets a truthful current CHANGES REQUIRED→candidate-fixed source-only status, exact new pins, original-session identity, history and limitations. No executed GET/CI/MATCH/window/runtime/TL-PASS claim.
5. Prepare a new immutable candidate with sole parent dfd692440762b50183fdebbfd6bf8dabde4662d0. Exactly six paths against main; every other tree leaf must remain exact. Deliver commit/tree, all six blob/byte/SHA256 identities, exact original/addition reconstruction proof, negative-case source rationale and self-review. Root and independent reviewer must re-read the complete new candidate and full tree.

### Execution and release boundary

**Do not create/update a branch, open a PR, mark Ready, merge, execute project/parser/compiler/tests/build/SQL/network or start a follow-up slice.** Immutable Git-object preparation and pure in-memory source/metadata comparison only. Do not query or call AA yourself.

Root alone may publish after independent complete source regating and a fresh main/workflow-number check.4120 remains the selected one-shot; if another run consumes it, report the lost selection without changing constants, rearming or rerunning. All subsequent unselected contexts including main push remain zero-DNS/GET. A security/platform denial remains a stop; none is retried or routed around. #917/#1131 boundaries remain exact and unrelated. No hosted install or public activation is authorized by this source correction.

The independently accepted R41 actual-main/Production decision6815551751 remains complete; this is the first unfinished AA source-publication step under the already authorized CH→DE-by15November path.

## Persisted Root amendment A3

https://github.com/Jetnity/jetnity/issues/1162#issuecomment-6815846159


## Technical Lead — CHANGES REQUIRED / AA A4 immediate review fix

**Exact PR #1192 head38fd761205d33fd32ff14bc680fa4699e32f15f4**, tree594de1058f4abbe9feb8d525f1f2ce9558ac0138; base/current main dfd692440762b50183fdebbfd6bf8dabde4662d0. Earlier SOURCE_PASS is source-only history, not runtime/Ready/merge PASS.

### Actual CI finding AA-A4-LINT-01

Selected CI **43165807743 / #4120 / attempt1 / pull_request** is bound to this exact head/branch. Verify job **131007285525** completed FAILURE. Typecheck passed; Lint failed; Tests, all later hygiene steps and Production build were SKIPPED.

Full original verify log was read by Root:197714UTF8bytes, SHA256145ef09582cfa31dfd9e197b7e287ad87ec04cd25b6a0b7d6832db2f1261e648. Actual error at2026-11-12T06:08:28.8870261Z:
lib/readiness/official-truth-aa-revision-probe-1.test.ts:260:3 — @next/next/no-assign-module-variable, Do not assign to the variable module.
Summary:1error,195existing warnings; exit1 at06:08:29.2122215Z.

Root checked the complete actual job step states and source: the local fixture declares const module=loadFixtureModule(...). The real one-shot entry is inside the skipped Tests step; it was not executed by the selected verify job. No AA_REVISION_PROBE_V1 record occurs in that log. There is no source observation/MATCH. Other workflow jobs remain separately pending where applicable.

**4120 is now a consumed failed selection, not a run that may be retried or silently renumbered.** No rerun/alternate source call/transport is selected.

### TASK V1 amendment A4 — same original session, unarmed verification first

Author **Jetnity Official Truth CH-DE AA Revision Probe 1 — Codex Generation1**, actual original session **/root/aa_revision_probe_writer_g1**. Immediate fix of the same PR; no successor.

1. Rename only the offending local fixture variable to a normal specific identifier and its references. Preserve all preflight/security/negative/transport behavior; no lint suppression, rule disable, skip, relaxed assertion or workflow change.
2. Explicitly set policy.runNumber to **0 (UNARMED)**. This amendment selects a safe complete synthetic/CI verification round with no external AA request. It does not select a new positive run. Refresh only the AA-test inventory bytes/SHA256 required by the rename; all12other inventory entries stay exact.
3. Reader2b14953968da35ca47b272fd67a1a912613b8e6d and BP1-test7b027b49af72a3f16b230acfeff7434f9a71b64e stay byte-exact. Complete original preservation, fixed URL/budget/V2/one-shot/security boundaries and passive legacy Native import exception remain exact.
4. Preserve complete prior Task and append this A4 verbatim with URL. Handoff records failed4120/job/sourcefinding, skippedTests/no observation, current UNARMED state, same-session fix and remaining runtime/Preview/main/threads gates. Retain complete historical handoff verbatim, clearly superseded for current selection/status.
5. Prepare a new immutable fast-forward candidate with soleparent **38fd761205d33fd32ff14bc680fa4699e32f15f4**. Exactly the same6paths against main; relative toA3 only AA-test, policy, Task and Handoff may change. Every other baseleaf, Reader and BP1 stays exact. Deliver full six-file manifest, full source/diff, byte identities and truthful source-only review.

No ref/PR push, Ready/merge, local project/parser/compiler/test/build/SQL/network execution or source request by the author. Root alone performs independent source regating and expected-old-head ref update. The ordinary new unarmed PR CI is a new-head verification, not a rerun of4120. No positive rearm is part of A4.

After actual full unarmed CI and synthetic preflight pass, Root may consider a separately persisted, explicitly reviewed future one-shot selection under the already authorized CH→DE path. That requires a fresh main/workflow inventory and complete exact-head review; it is not automatic, not permission to repeat a refused platform action, and not an agent-authorized follow-on.

PR remains Draft/CHANGES REQUIRED. Current Previewdpl_FYqy1Eoc9eJyD2qffpyaZxg4GY7o is READY for old38fdhead only and cannot cover the forthcoming head. #917/#1131 STOPs and all other product/authority/install/public gates remain unchanged.

## Persisted Root amendment A4

https://github.com/Jetnity/jetnity/pull/1192#issuecomment-6816241910


## Technical Lead — CHANGES REQUIRED / AA A5 immediate review fix

**12 November 2026.** Exact PR #1192 head `b16bf9933e234e8ab1ee89c9d76f3c66e7a2ba68`, tree `d3fbe3d45952b221174a3f18d7f0521c5c45c08f`; current main remains `dfd692440762b50183fdebbfd6bf8dabde4662d0`.

### Actual A4 execution and finding AA-A5-SCHEMA-01

[CI 43168250658 / #4121 / attempt 1](https://github.com/Jetnity/jetnity/actions/runs/43168250658) is completed FAILURE. Verify job 131015096539 passed Typecheck, Lint, Tests and Admin API protection, then failed `check:schema-bezug`. The three following hygiene checks and Production build were skipped. All five companion lanes and Auth metadata check succeeded; the required aggregator failed. Exact-head Preview `dpl_ADR4uaV21xL57PYV64pjzpLgYfCX` is READY, which does not replace CI.

Root read the original verify log and the exact two source sites plus the complete unchanged schema-usage checker. Original log: **4,277,093 UTF-8 bytes**, SHA256 `158836d3d2dc86a31dbb716629455f50770597c4c2280570e48b144b4712a5f5`. Actual diagnostics at 06:39:18 UTC:

- Table `x`: AA test line 136, actually `Buffer.from('x')` in the synthetic file-growth fault.
- Table `changed`: AA test line 726, actually `Buffer.from('changed')` in the synthetic source-inventory mutation.

The unchanged checker `scripts/db/verwendung.mjs`, blob `192a2f9002515cccc2d67db4782bfedbff6748b1`, recognizes literal `.from(...)` without receiver typing. These two sites are Buffer construction, not database access or missing migrations.

Core: 8,730 tests, 8,728 pass, zero failures, two existing skips. The AA synthetic preflight entry actually passed. **Policy remained Run 0 / UNARMED; no real AA observation or MATCH.** This unarmed failed CI may not be treated as full gate PASS or silently retried. Historical failed selection #4120 remains consumed.

### TASK V1 amendment A5 — same original author and session

Author **Jetnity Official Truth CH-DE AA Revision Probe 1 — Codex Generation1**, actual original session **/root/aa_revision_probe_writer_g1**.

1. Replace only the two offending Buffer literal constructions with byte-identical numeric byte constructions: `Buffer.from([120])` and `Buffer.from([99, 104, 97, 110, 103, 101, 100])`. Preserve both original negative cases, their assertions and all other test behavior. No checker/schema/generated-type change, suppression, skip, test deletion or workflow change.
2. Keep policy `runNumber: 0`, base SHA, selection and every security/budget boundary exact. Refresh only the AA test inventory byte count and SHA256 required by those two substitutions. The other twelve inventory entries stay exact.
3. Reader blob `2b14953968da35ca47b272fd67a1a912613b8e6d` and BP1 test blob `7b027b49af72a3f16b230acfeff7434f9a71b64e` remain byte-exact.
4. Preserve the complete prior Task and append this amendment verbatim with its comment URL. Preserve the prior Handoff verbatim as history and add the new current status: actual failed #4121, successful tests but skipped remaining gates, no AA request, same-session fix, current unarmed state and remaining full CI/Preview/threads/main gates.
5. Deliver an immutable fast-forward successor with sole parent `b16bf9933e234e8ab1ee89c9d76f3c66e7a2ba68`. Exactly the existing six paths against main; only AA test, policy, Task and Handoff may change against the parent. Supply the complete six-file manifest, hashes and exact inverse proof that the two substitutions recover the prior test.

Author must not execute project/parser/compiler/tests/build/SQL/network work, publish a ref or PR, set Ready, merge, rerun CI, arm a positive run or request the external AA source. Root independently reviews and alone publishes the expected-old-head update. A later positive one-shot selection requires its own explicit Root decision and fresh inventory after actual complete unarmed gates.

#917 and #1131 boundaries remain unchanged. Public CH→DE remains NOT LIVE. **Stop after delivery; no automatic follow-on.**

## Persisted Root amendment A5

https://github.com/Jetnity/jetnity/pull/1192#issuecomment-6821817364


## Technical Lead — AA A6 / preserve actual native-failure diagnostics

**12 November 2026. CHANGES REQUIRED; diagnostic source amendment only.** Same original author/session **Jetnity Official Truth CH-DE AA Revision Probe 1 — Codex Generation1**, `/root/aa_revision_probe_writer_g1`. Sole parent remains current Draft #1192 head **bb3b22d7ce6f60b2226e7d069287f99960de093f**. No new base/dependency integration is implicit.

### Independently established failure

[Root A5 failure receipt](https://github.com/Jetnity/jetnity/pull/1192#issuecomment-6822445249) binds run **43206762401 / #4123 / attempt 1**, verify **131143772437**, full log **4,237,330 bytes / SHA256 449fed066f4769e75545dfbe8eb20b1185c127cbdd26a1164c1be83cf866204d**. An independent read-only reviewer `/root/ch_de_ci_reconstruction` reproduced that identity and the prior A4 original log identity.

Actual A5 checkout was synthetic merge **f23134d47b6525f658a9f58a5b1f4bfb32bfa6f9**, parents [dfd692440762b50183fdebbfd6bf8dabde4662d0, bb3b22d7ce6f60b2226e7d069287f99960de093f], tree exactly **e0da1e50dc5723f385a4e9b667932658bf261270**. Core: 8,730 tests / 8,726 pass / 2 fail / 2 existing skip. AA synthetic preflight passed; no actual AA observation record. **Run 0 / UNARMED.**

R3 selected_escaping_and_500: Publish 5,282 ms succeeded; COMMIT 20,039 ms failed with57P01, no acknowledged commit, independent receipt_absent. The fixed unchanged20s backend guard explains the cutoff path, not why the workload reached it. A4 had Publish2,369ms / COMMIT10,392ms / verified_exact. No evidence establishes a runner defect.

R2 `runR2BackendProof` at `assert.ok(independent.ok)` returned false. Root independently read full relevant R2 and storage source. `persistVerifiedIntegratedBundleLocally` can return false there either from strict preflight or from begun but unacknowledged COMMIT. A failure after acknowledged COMMIT throws instead. The actual scenario, return reason, protection failure and writer-operation diagnostics were not retained by the failing assertion.

The controlled runtime captures complete loaded source files; AA's larger reader can therefore change native bundle input even when its positive entry is not called. Main→AA content differs; A4→A5 retains the exact same Reader. Neither zero influence nor proven timeout causation is established. Do not label these failures flakes or repaired.

### Selected minimal diagnostic change

Modify only these two additional existing source paths, plus the existing AA Task/Handoff:

1. `scripts/db/official-truth-integrated-pilot-1/storage.ts`: in the **existing unacknowledged-COMMIT false-result branch only**, include an additive finite snapshot of this same connection's existing `operationDiagnostics` as `operationDiagnostics`. That getter already returns at most32 fixed records with phase/elapsed/outcome/finite code/optional ACK-dispatch-protection flags and expressly no SQL, parameters, identities, paths or raw database text. Preserve the existing ok:false, reason:'commit_outcome_unknown', optional commitProtectionFailure, all success/preflight results, error propagation, timing, guards, SQL, connection/query counts and finally cleanup. No new observer/callback/request/query or connection monkeypatch.
2. `scripts/db/official-truth-integrated-pilot-1/r2-proof.ts`: immediately after the existing independent persistence attempt and before the unchanged success assertions, emit **one failure-only stderr JSON record** with schema `jetnity.native.r2-independent-failure.v1`, current literal scenario, reason category **commit_outcome_unknown** or **bundle_verification_rejected**, existing finite protection-failure flag or null, and the already-retained operations or an empty array. At most32 existing records; no dynamic SQL, bundle bytes, identities, arbitrary error message/stack or other data. No success fabrication, new publication/readback/retry, catch/ignore or altered assertion. The original failed outcome must still fail.
3. Preserve all current six AA-scope implementation/policy/test bytes exactly except Task/Handoff history. **Policy remains byte exact Run0**, all13inventory pins unchanged. Do not alter the reader, positive selection, fixed source URL/limits, R3, SQL functions/triggers, shared Wire guard, budgets, workflows, fixtures or proof input.
4. Append this full A6 with URL verbatim to Task and preserve complete prior Handoff as dated history. Record the actual unresolved A5 failure and this diagnostic-only intent, exact new storage/R2 pins and original inverse. This is not a functional fix or runtime acceptance. Whole final scope against main becomes **eight paths** (the existing six AA paths plus storage.ts/r2-proof.ts); first-parent changes exactly these two source paths and Task/Handoff.
5. Deliver immutable sole-parent commit/tree, complete tree comparison, exact four changed-source/document pins and full bounded diff. Source-only authoring; no project/parser/compiler/test/native/SQL/CI/build/source-GET execution, branch/PR publication, Ready, merge, rearm or follow-on. Stop after delivery.

Root will separately decide when to publish after independent source review and integration of the accepted Auth correction; no automatic retry of A5 is authorized by this task. Full fresh final-head gates remain required. Original #917/#1131 platform boundaries, actual Owner/AAL2 and source/custody/window gates are unchanged.

## Persisted Root amendment A6

https://github.com/Jetnity/jetnity/pull/1192#issuecomment-6822711007


## Technical Lead — AA Revision Probe1 A7 / exact Auth-main diagnostic integration

**12 November 2026. Explicit source preparation selected by Root.** Same author **Jetnity Official Truth CH-DE AA Revision Probe1 — Codex Generation1**, original reachable /root/aa_revision_probe_writer_g1. This continues #1192 under preserved V1/A1–A6 history.

### Actual basis and remaining failures

Auth #1194 was independently TL-PASS and merged at12:12:26Z. Actual main **ee6801e99e86144e60dbe86d72576f9ad7c3e9bb**, tree **c2fad9aff45aa07addb541fea8e6a38fb9f2a19e**, is now the exact READY Production deployment/jetnity.com alias. Separate main CI #4129/43215792152 is still running; full post-merge acceptance is not asserted. [Auth TL evidence](https://github.com/Jetnity/jetnity/pull/1194#issuecomment-6823268643).

Root independently SOURCE_PASSed A6 at https://github.com/Jetnity/jetnity/pull/1192#issuecomment-6823074837 . Immutable A6 **7aa2f2fda1ad06fe2c85584f86f049c575d919da**, tree **a4f5a83a0d92b7e6daf8c6479c6e3d1155b63171**, sole parent published A5 **bb3b22d7ce6f60b2226e7d069287f99960de093f**.

Actual A5 #4123 remains failed: R3 selected_escaping_and_500 COMMIT20,039ms/57P01/noACK; R2 independent result false. A6 exposes only bounded failure diagnostics and preserves every query, assertion and deadline. No cause, successful retry, runtime fix or AA influence classification is invented. All prior failure/actual-log evidence must remain in full history.

### Selected immutable successor

Create one integration commit with ordered parents:
1. **7aa2f2fda1ad06fe2c85584f86f049c575d919da**
2. **ee6801e99e86144e60dbe86d72576f9ad7c3e9bb**

Integrate the five exact Auth-main paths without alterations. Keep all current A6 source blobs exact except the one selected policy-base identity change below; in particular preserve Reader, AA tests, BP1 tests, storage.ts and r2-proof.ts exactly.

Permitted A7-authored changes only:
- `lib/readiness/official-truth-aa-revision-probe-1-policy.ts`: replace the exact baseSha dfd692440762b50183fdebbfd6bf8dabde4662d0 with **ee6801e99e86144e60dbe86d72576f9ad7c3e9bb**, after verifying all13 unchanged pinned inventory entries against actual source bytes. **Run stays0 / UNARMED.** No other policy semantics, source URL/fingerprint/limits/one-GET behavior or inventories change. If any inventory differs, report exact evidence; do not silently rebind another source.
- Existing AA Task and Handoff: preserve all earlier bytes/history, append this A7 and URL verbatim, put exact new parent/base/provenance and still-unresolved runtime gates at the front of Handoff, update affected current policy/source pins explicitly. No previous run/source/window result is transferred.

The workflow is exactly the current Auth-main workflow; no HMA1 PG17 CI insertion or other package integration is selected here. Any subsequent accepted-main/workflow change will require a new explicit integration/policy inventory decision.

Full resulting scope versus actual main remains the eight A6 paths: four existing-source modifications and four additions. All other current-main leaves are exact; expected final9,483leaves. No deleted paths. First-parent differences are the five Auth-main paths plus these three A7-authored paths; preserve all others. Produce complete actual tree/path/byte/blob/SHA256 evidence, not only GitHub's truncated file list.

### Execution HOLD and delivery

This is source preparation parallel to the pending Auth-main post-merge run. **HOLD executable publication until Root accepts actual main post-merge evidence and independently reviews this successor.** Root may then select fresh existing CI for this new exact integrated head, including the unchanged actual R2/R3 assertions and A6 bounded diagnostic. No blind rerun, positive probe activation, invented run number or reuse of the consumed historical #4120 authorization.

No local/project/parser/compiler/native/SQL/test/build/CI/source-GET/hosted execution, ref/PR update, Ready, merge or unrelated follow-on. Only immutable Git source objects and pure in-memory metadata composition/readback. Exact source/revision observation, custody and extended pilot window remain unfinished. #917/#1131 STOPs unchanged.

Deliver the immutable commit/tree/ordered parents, complete scope/pin comparisons and preserved Task/Handoff. Stop. Root independently evaluates every changed head; author self-review is not a TL PASS.

## Persisted Root amendment A7

https://github.com/Jetnity/jetnity/pull/1192#issuecomment-6823551510
