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


---

## A8-A / A8-B / A1 / A2 — verbatim Root review-fix authority

The four following receipts are preserved verbatim. A8-A selected read-only diagnosis; only A8-B and its two finite supplements select this source correction. All earlier task text remains historical authority subject only to the explicit later exceptions below.

### Root receipt 6824718530

Source: https://github.com/Jetnity/jetnity/pull/1192#issuecomment-6824718530

<!-- BEGIN VERBATIM ROOT RECEIPT 6824718530 -->
## TL CHANGES REQUIRED — AA1 A8-A / actual A7 CI diagnosis (2026-11-12)

Author/session remains **Jetnity Official Truth CH-DE AA Revision Probe 1 — Codex Generation1**, `/root/aa_revision_probe_writer_g1`. Same reachable original session; no successor. Root alone owns Ready/merge.

### Exact observed failure
Published Draft head `6ffbb8f1cf415e7e608634e236a47cf9872efebd`, tree `24c2709bb150d20f069ac6bfc40840048f5b83fa`; current main `ee6801e99e86144e60dbe86d72576f9ad7c3e9bb`.
Actual run [#4131](https://github.com/Jetnity/jetnity/actions/runs/43222610412), attempt 1, Core job `131197662032`: complete log 4,241,384 UTF8 bytes, SHA256 `e3c59acd68a4e23802d5331bbe4996136265a98e6b2083b0b3a5b99eb4697afa`. 8,738 tests / 8,734 passed / 2 failed / 0 cancelled / 2 existing skipped / 972 suites. Typecheck and lint passed; later build/check steps skipped after tests failed.

R3 `selected_escaping_and_500`: startup 3 ms, BEGIN 1 ms, query 5,021 ms, COMMIT 20,038 ms -> SQLSTATE `57P01`, `commitAcknowledged:false`; total phase 25,097 ms; independent readback `receipt_absent`. Stack `r3-proof.ts:72`, `pg-wire.ts:316`. Native test failed after 60,158.547297 ms.
R2 A6 diagnostic: `scenario:commit`, `reason:commit_outcome_unknown`, `commitProtectionFailure:null`; startup 6 ms, BEGIN 1 ms, query 6,406 ms, COMMIT 20,045 ms -> `57P01`, acknowledgement false. Independent assertion `r2-proof.ts:125 assert.ok(independent.ok)` failed; whole test 316,643.570797 ms. A6 diagnostic has therefore run, but it does not establish the terminating actor/cause.

Separate Lifecycle job `131197662496`: full 165,169 bytes, SHA256 `edd3657eea245745fbf058ffc10ec4119809347b628951f81564e4c7b0093b6e`; unchanged `execFileSync('/usr/bin/google-chrome',['--version'], {timeout:5000})` failed ETIMEDOUT before bundle/cluster/fixture. 4 tests / 3 pass / 1 fail. No OS/runner-load cause inferred. Auth/UI/Atomic/Persisted/Store passed. Aggregate failed. No retry selected.

### A8-A selected scope — diagnosis only
Read the exact A7 source and complete logs. Reconstruct the real same-connection COMMIT protection, idle-transaction/deadline lifecycle, protocol and external terminator path from startup through actual query result, CPU-side verification, COMMIT write/ACK, cleanup and independent readback. Compare the same unchanged tests that pass on accepted main and PG1 #4130 with this A7 changed implementation; identify concrete behavioral differences rather than assigning runner load by assumption.

Return a finite causal graph with exact file/blob/line excerpts, all observed timestamps, proven facts vs hypotheses, and the smallest proposed correction or missing diagnostic needed. Specifically account for 57P01 at the repeated 20-second point, protection failure null, and fresh receipt absence. Audit the separate Chrome preflight failure without silently modifying or widening its timeout.

This is read-only source/log analysis: no authored Git objects yet, no repository/Node/project/parser/compiler/test/native/SQL/APT/build execution, no CI rerun, no ref/PR mutation, no hosted operation or official source GET. Pure text/hash comparisons are permitted. Do not change or weaken timeouts, commit truth, SQL semantics, assertion/mandatory groups, cleanup, policy inventory or the Run0 state. Do not propose broad skip/retry-to-green. Stop after reporting for Root's separate versioned implementation selection.

All prior actual failed receipts remain immutable history. Run0 remains UNARMED; the earlier consumed positive invocation is not reusable. #917 denied action and #1131 remain untouched. No Ready, merge, Dev install, source-currentness or public activation claim.
<!-- END VERBATIM ROOT RECEIPT 6824718530 -->

### Root receipt 6825483434

Source: https://github.com/Jetnity/jetnity/pull/1192#issuecomment-6825483434

<!-- BEGIN VERBATIM ROOT RECEIPT 6825483434 -->
## TL CHANGES REQUIRED — AA1 A8-B / isolate probe dependencies and restore storage result contract

2026-11-12. Same original author/session: **Jetnity Official Truth CH-DE AA Revision Probe1 — Codex Generation1**, `/root/aa_revision_probe_writer_g1`. This is the immediate review fix after A8-A (#1192 comment 6824718530), not a new product slice. Root alone decides publication, CI selection, Ready and merge.

### Evidence and finite diagnosis accepted by Root

A7 remains Draft head `6ffbb8f1cf415e7e608634e236a47cf9872efebd`, tree `24c2709bb150d20f069ac6bfc40840048f5b83fa`. Current accepted main is `fa8bd1d02ea67cf69ba3df9fea5a3d39a35a7474`; PG1 actual-main run #4132 passed. A7 run #4131 is still FAILED, no retry selected. Its full Core log pin remains 4,241,384 bytes / SHA256 `e3c59acd68a4e23802d5331bbe4996136265a98e6b2083b0b3a5b99eb4697afa`; Lifecycle 165,169 / `edd3657eea245745fbf058ffc10ec4119809347b628951f81564e4c7b0093b6e`.

Root independently read current Reader imports, shared physical implementation, full AA policy, actual wire guard, storage and R2 changed region and both exact-result assertions. Removing exactly 53 UTF8 bytes `operationDiagnostics:connection.operationDiagnostics,` from storage blob `3079ee3149dc4ac0f505e1d683cb1099baa2b5ca` restores original blob `109e8ac57029a03afa55219c8132e8bf004b2dee` byte for byte (18,102 bytes; SHA256 `a7a8bd6e65701e6482c8f7028ed1936df3cf02044adfb85e981f010b4d19f82f`). The A6 enumerable property conflicts with unchanged R3 and integrated exact deepEqual expectations; those assertions were not reached in the earlier failing A7 path. It must not be normalized by widening those expectations.

The shared Reader imports AA S1, and S1 imports parse5. Engine captures its complete source dependency graph even when Run0 is closed. The observed artifact counts increased from 63/72 on main/PG1 to 68/77 on A7 (code capsules 30 -> 35); no full per-capsule byte map was logged. Original wire/cluster/deferred SQL/Engine/capture source is unchanged. Extra graph work is established; its precise timing contribution to the 20-second failure is not established.

The actual fixed wire guard sleeps 20 seconds and then may terminate the same backend/transaction. Its success callback discards the returned termination value; protectionFailure:null does not prove the guard did not fire normally. A7 R3 query 5,021 ms/COMMIT 20,038 ms and R2 query 6,406 ms/COMMIT 20,045 ms ended 57P01 without ACK. R3 fresh readback was absent. R2 did not perform a fresh readback after the failed successor; its prior absence must not be relabeled as that successor's result. Chrome's separate 5-second preflight timeout remains an independent observed failure, with no assumed load cause.

### Selected A8-B correction and explicit architecture exception

Author source-only on sole parent A7 `6ffbb8f1cf415e7e608634e236a47cf9872efebd`. No rebase/ref update yet; integration with then-current accepted main and new HMA workflow pins is a separate explicit Root step.

1. Restore storage.ts exactly to blob `109e8ac57029a03afa55219c8132e8bf004b2dee`. Retain R2 failure diagnostics by observing the actual independent writer LocalPgConnection within the proof, following the already present R3/integrated test-local capture pattern. Restore the temporary hook in finally. Do not modify success/unknown/failure result shapes, existing assertions, queries, wire protocol, cleanup or budgets.
2. Move AA-only imports and the complete AA appendix out of the shared Reader into new server-only `lib/readiness/official-truth-aa-revision-probe-1-server.ts`. Its sole runtime importer is the existing AA test, by exact named static import. S1/parse5, policy/FS/CI claim and probe fingerprint logic remain only on that probe side.
3. Extract the existing shared physical implementation into new server-only `lib/readiness/official-truth-retrieval-physical-internal.ts`. This is an explicit narrow exception to the earlier V1 prohibition on primitive module boundaries: the Reader and the new AA probe may statically import an exact finite list of shared physical functions/types. No other production or test consumer, app/public barrel, dynamic/namespace import, setter, callback port, authority handoff, or new Reader public raw-transport export is permitted.
4. Move existing implementation bodies byte-exact, except necessary export keywords/import wiring. Include the actual dependency closure: DNS/HTTPS/response streaming; address/public-IP and DNS-lookup checks; media-type/content-length/bounded-body reader; clock/UTF8 helpers and their existing constants/types. Keep existing Reader exported API names/types and their behavior through exact named reexports as needed. Preserve the existing HTTP framing proof. No duplicated parser/network implementation and no changes to request/redirect/DNS/TLS/body/time/error semantics.
5. The Reader must no longer import or reexport the AA entry, policy or S1. The new physical module must not import the Reader, AA, S1, parser, catalog, Engine or application authority. Type-only existing shared URL-error typing is allowed if necessary; retain no runtime cycle.
6. Update the AA test's fixture entry/imports and its existing complete import-boundary inventory to enforce these exact boundaries, including forbidden aliases, namespace/dynamic/reexports and unapproved consumer paths. Preserve every existing synthetic case and assertion intent, all existing byte-pinned legacy private-port exceptions, BP1 observation bytes, and one awaited preflight-before-real-entry ordering.
7. Source inventory remains closed and expands the existing 13 exact paths with the two new implementation paths (15 total); bind their actual bytes/hashes and update Reader/test pins. Preserve all other source inventory entries and old historical evidence. Policy runNumber remains 0, baseSha remains its original accepted A7 base until separately reviewed integration, fixed AA URL/V2 pin/body limit/10-second/no redirect/no retry/no credentials and single-invocation claim remain unchanged.

### Exact authored allowlist (10 paths)

- lib/readiness/official-truth-server-owned-retrieval.ts
- lib/readiness/official-truth-retrieval-physical-internal.ts (new)
- lib/readiness/official-truth-aa-revision-probe-1-server.ts (new)
- lib/readiness/official-truth-aa-revision-probe-1-policy.ts
- lib/readiness/official-truth-aa-revision-probe-1.test.ts
- scripts/db/official-truth-integrated-pilot-1/storage.ts (exact original restoration)
- scripts/db/official-truth-integrated-pilot-1/r2-proof.ts
- docs/official-truth-product-v3/AA_REVISION_PROBE_TASK_V1.md
- docs/official-truth-product-v3/AA_REVISION_PROBE_HANDOFF_V1.md
- docs/official-truth-product-v3/AA_REVISION_PROBE_MANIFEST_V1.json (new)

All other A7 leaves byte-exact, including pg-wire.ts, cluster.ts, Engine, capture, SQL, S1/parse5, Chrome preflight, historical native test assertions, CI/package/lock and existing BP1 patch. No timeout or selector change; no capture exclusions or arbitrary graph-count target. A new source boundary is not evidence that the timing failure is cured; only fresh full exact-head gates can establish candidate behavior.

### Delivery and limits

Deliver unpublished immutable blobs/tree/commit, complete full-tree delta proof, exact byte pins, a finite move manifest with each original byte span and target span plus inverse reconstruction proving original physical bodies, explicit import/export inventory, storage restoration equality, and full appended task/handoff history. Clearly mark source-only/NOT_RUN. Do not claim native, official-source currentness or pilot-window approval from this work.

No local/project/parser/compiler/test/native/SQL/APT/build execution, GitHub rerun/ref/PR mutation, hosted action, source GET, publication, Ready or merge. Pure inert source/text/hash/tree work only. The previously consumed positive invocation cannot be reused. #917 and #1131 remain untouched; Root owns all later execution selection and re-gating.
<!-- END VERBATIM ROOT RECEIPT 6825483434 -->

### Root receipt 6825534691

Source: https://github.com/Jetnity/jetnity/pull/1192#issuecomment-6825534691

<!-- BEGIN VERBATIM ROOT RECEIPT 6825534691 -->
## AA1 A8-B A1 — exact BP1 preservation amendment

Root supplement to selected A8-B (#1192 comment 6825483434), 2026-11-12. Same reachable original Generation1 session and source-only boundaries remain unchanged.

Root independently read the complete affected preservation block in BP1 observation test blob `7b027b49af72a3f16b230acfeff7434f9a71b64e`. Its old predicate requires exactly Reader `2b14953968da35ca47b272fd67a1a912613b8e6d`, 65,490 bytes, and removes only the two A3 additions. The selected shared-physical/probe separation necessarily changes that file layout. Keeping this old current-layout predicate would deterministically reject the intended source-preserving refactor.

One additional authored path is therefore selected:
`lib/readiness/official-truth-bundesportal-bp1-observation-1/observation.test.ts`.
The complete A8-B allowlist is now 11 paths. This supersedes only the task sentence requiring this BP1 file byte-exact; all unrelated BP1 observations, checks and protected pins remain byte-exact.

Replace only the AA Reader preservation metadata/predicate and its corresponding mutation proof/call wiring. The original authoritative Reader remains blob `5998fdea54d3337fb68cd7111460b59e43a3cef7`, 46,071 bytes, SHA256 `b83340d46dbf8dbc3d1ba389d6b38964bf48fa05132655854ee0e49cc66db994`. Do not change that original pin, substitute an author-generated baseline, normalize ASTs, ignore source bytes, accept arbitrary alternate layouts, or weaken the other four protected file pins.

The new finite predicate must independently bind the actual selected complete Reader, new physical module and new AA probe bytes/hashes. Use exact reviewed byte spans/inverse moves to reconstruct every byte of the original Reader from the actual new sources, accounting explicitly for only the selected import/export/header wiring. No duplicated implementation body may substitute for the code actually consumed. The old A3 current-file/addition pins remain documented as immutable history, not accepted as the new current layout.

Retain and adapt the existing mutation proof: changed original body, changed moved physical body, changed probe/addition, missing/duplicated/misplaced spans, changed import/export wiring, extra trailing bytes and wrong complete file all refuse. Full source pins must reject unexpected bytes outside reconstructed spans as well. Boolean-only failure output; no raw bodies. Preserve original-byte comparison and the existing app/cold-import/unarmed/no-network/caller boundary semantics.

The existing 15-path AA source inventory remains as selected; this amendment does not authorize a network run, source revision, policy arm, fixture/parser execution, native/SQL/build action, ref or CI mutation. Deliver the complete BP1 inverse and old-vs-new scoped diff alongside the A8-B move manifest for independent Root review.
<!-- END VERBATIM ROOT RECEIPT 6825534691 -->

### Root receipt 6825553869

Source: https://github.com/Jetnity/jetnity/pull/1192#issuecomment-6825553869

<!-- BEGIN VERBATIM ROOT RECEIPT 6825553869 -->
## AA1 A8-B A2 — preserve the existing Reader source-safety assertions across the selected module move

Root supplement to A8-B (6825483434) and A1 (6825534691), 2026-11-12. Same original Generation1 session, sole A7 parent and all source-only/Run0 constraints remain.

Root independently read `lib/readiness/official-truth-server-owned-retrieval.test.ts`, exact blob `30e441d1f4187eb9bc07bbcb0fdc48d9e2976cb9`, including test “29 und 30 kein App-Import und keine Annahme, kein Speicher, kein Extraktor, kein F8”. It currently expects https.request, bound lookup and fixed headers inside the single Reader file. Those exact implementation bodies are being moved into the explicitly selected shared physical module.

Add exactly that test path to the authored allowlist (12 paths total). Only the source-inspection block of that existing test and necessary local path binding may change. Inspect the actual Reader and actual new physical source separately: keep business/catalog/caller/authority/app boundaries on Reader; require server-only, real https.request, exact bound lookup and fixed headers in the physical module; apply forbidden fetch/storage/provider/app/acceptance checks to both modules wherever relevant. Preserve the existing public entry arity and complete app/provider import scan; extend it to reject direct physical imports as well. No comments masquerading as implementation, unconditional pass, omitted assertion, dynamic test removal or weakened string match.

Every other original Reader test byte and all dynamic test scenarios remain unchanged. The existing protected original Reader pin in BP1 remains unchanged. New complete source/test pins and the exact inverse of this narrow assertion move belong in the manifest and Root review. The 15-path probe runtime inventory stays as selected; this independent mandatory test is bound externally through exact tree/manifest/CI.

Perform a finite read-only check for any further concrete source-layout gates before delivering objects; report exact paths and predicates if necessary. This is not permission to widen scope autonomously. No new source fetch, execution, timeouts, policy arming, ref, CI, Ready or merge.
<!-- END VERBATIM ROOT RECEIPT 6825553869 -->


---

## A9 / A9-A1 — actual-main source integration and exact correction

The complete A8-B Task prefix above remains unchanged. The following Root source acceptance, new integration task and explicit transcription correction are preserved verbatim. A8-B SOURCE PASS does not grant A9 publication, execution or runtime PASS.

### Root receipt 6826532002

Source: https://github.com/Jetnity/jetnity/pull/1192#issuecomment-6826532002

<!-- BEGIN VERBATIM ROOT RECEIPT 6826532002 -->
## AA V1/A8-B — INDEPENDENT ROOT SOURCE PASS — 2026-11-12

Exact unpublished commit `d041feb553519aab574ce2c50aa8e5cdd9e694c1`, tree `1fb28e84e7d8a41b6e1bf07284ecda6ddf8eb617`, sole parent `6ffbb8f1cf415e7e608634e236a47cf9872efebd`. Root independently accepts the source-only implementation of tasks 6825483434 / 6825534691 / 6825553869. Same original author/session: Jetnity Official Truth CH-DE AA Revision Probe1 — Codex Generation1.

### Independently verified
- Actual complete trees: exactly12 changed paths (9 modified / 3 new), 9,474 other parent leaves unchanged; no deletion. All12 actual blobs fetched and SHA256/byte lengths checked, not just author excerpts.
- All29 ordered inverse spans reproduce the full original Reader: blob5998fdea54d3337fb68cd7111460b59e43a3cef7 /46,071 bytes /SHA256 b83340d46dbf8dbc3d1ba389d6b38964bf48fa05132655854ee0e49cc66db994. All Reader/Physical target bytes partition into exact retained spans and reviewed import/header/export-keyword wiring. No hidden unmapped bytes.
- Actual retained probe imports/appendix reconstruct the complete old A7 Reader; the only body addition is the two required owned inventory paths. All four amended proof/test files independently reconstruct their full predecessors from complete changed/retained partitions.
- Storage is exactly restored to109e8ac57029a03afa55219c8132e8bf004b2dee. R2 captures the actual ot_provenance_writer connection through the original connect method only for diagnostics, restores the method in finally and changes no storage result, SQL, readback or wire behavior.
- Reader no longer imports Probe/Policy/S1; the original Bern bodies and public Reader API are preserved. Physical contains actual DNS/HTTPS/body handling, only finite dependencies and explicit named consumers in Reader/Probe. Probe remains no-argument and synthetic test is its sole consumer.
- Root read all new import-boundary/negative cases. Existing one-level fixture loader actually loads Physical under original native-port fakes, then injects that object privately into the actual Probe fixture; no production port or actual test ESM Physical import is added.
- BP1 requires complete current Reader/Physical/Probe byte length, Gitblob and SHA256 before inverse proof. All existing protected behavior remains; 22 whole-source and7 span mutants are authored. The finite AST guard is not claimed to resolve arbitrary computed imports.
- All15 actual inventory blobs match the declared pins. The11 original non-Reader/test entries remain exact. Complete original Task46,809bytes remains a prefix; complete original Handoff80,917bytes remains verbatim.
- Additional read-only source audit by /root/ch_de_ci_reconstruction found no concrete P1/P2/P3 within actual imports/native fixture/guard/BP1 boundaries. Root performed its own tree/inverse/semantic review; author/auditor statements are not runtime PASS.

### Boundary
**SOURCE PASS only.** Run0 remains UNARMED; source inventory still names old CI/package/base, so this commit is not selected for publication. Explicit actual-main integration is required next. No claim that removing Reader→S1→parse5 cures the observed20s COMMIT failure or separate Chrome timeout. No tests/parser/compiler/native/SQL/CI/source GET executed in this review, no official current revision/pilot extension/public activation. No #917/#1131 action.

Pins: Reader933591ff… /29,611 /ef2fd19af4bf897bcab1a2898f447a9b2a47b759f5a4dfe4b286badae5082bd2; Physicalbd995580… /17,726 /aa37e8a42581f4ee67cfd52e677cb7d09a804ac77043e2d20b85dc24cd467e3f; Probe8db7b786… /20,051 /69a3520a9c8a31dc37bb45ce190668c41927f6f287f6fd1dc11d5d7acdc9b617. Full source pins remain in reviewed manifest3c6f8e874aa86b433648cf9e53d44d24c741a696 /53,306 /e244a77d9ff56c279c916498ddd2b17abc89dc02b5272e6d21f84e278ab223fc.
<!-- END VERBATIM ROOT RECEIPT 6826532002 -->

### Root receipt 6826548986

Source: https://github.com/Jetnity/jetnity/pull/1192#issuecomment-6826548986

<!-- BEGIN VERBATIM ROOT RECEIPT 6826548986 -->
## AA V1/A9 — ROOT-SELECTED ACTUAL-MAIN INTEGRATION / SOURCE ONLY

Implementer: same reachable **Jetnity Official Truth CH-DE AA Revision Probe1 — Codex Generation1**, /root/aa_revision_probe_writer_g1. No new session. Root selects this finite integration now; no automatic follow-on or live probe.

### Exact inputs
- Independently SOURCE-PASS A8-B: d041feb553519aab574ce2c50aa8e5cdd9e694c1, tree1fb28e84e7d8a41b6e1bf07284ecda6ddf8eb617, Root receipt6826532002.
- Actual new main b5f33f66faab89454a874e641dbd0dfa66b09d2d, tree77666e58d26538fb704389366b77e3a4a1903ac2, parents[fa8bd1d02ea67cf69ba3df9fea5a3d39a35a7474,fd1e27fd4893a837d6bd3fe1180a94589ffa1fae]. #1195 independently gated in6826483778 and merged14:33:46UTC. Actual push CI#4135/43238479829 is RUNNING, not postmerge-PASS yet.
- Final immutable commit must have ordered parents[d041feb553519aab574ce2c50aa8e5cdd9e694c1,b5f33f66faab89454a874e641dbd0dfa66b09d2d]. Preserve actual-main tree plus the accepted AA delta, with only the finite amendments below.

### Authorized source integration
1. Carry ALL current-main PG1/Auth/HMA1 files and protected-source amendments exactly. In particular:
   - .github/workflows/ci.yml blob a422a67d3a0407f4c1301d3bcff75f736d7ea9b4;23,906bytes;371e8467441727d1fc72f1f524f4b0f7bafd2338eb3b706f0c9f32f8a662b7ba.
   - package.json blob2a8d677d575b5762a5dd7091d161ea0da6edcea9;6,460bytes;46c317656c81030397681d1d0c67e54a5c7d65b0aa66d15d2051c76503584da0.
   - selector scripts/official-truth-v3-test-selection.mjs blob51a2a59e03104f83f3d392f0ffb79639274c1ae9;5,970bytes;647e5b113666f0e77253ce8a823942e480b853d0c95ac545e67d4074ea5b7e61.
   - selector test scripts/official-truth-v3-test-selection.test.mjs blobbbc10fc9621e31c5af74421891608d3cdf2ac528d4d;7,360bytes;edbbcb838a8d8642d21afe7b1608f137ff60d53e1214c4a9cc8f012d16ff6730.
   - latest atomic CI-contract c3797969869961bda770b8836267ba3d817dbdd8 and all other HMA main leaves EXACT. Do not restore an old broad test command or change six-family CI.

2. Policy stays runNumber0 UNARMED. Set only baseSha to b5f33… and update exact current CI/package/owned AA test/Probe pins. Expand the finite inventory from15 to17 by adding the two actual selector files above. Retain all other original entries and all URL/official pin/limit/binding/branch/event/attempt semantics.

3. In Probe, only add the same two selector paths to the exact REQUIRED inventory list. In AA test, only change the expected inventory count15→17. No behavior/fixture/guard/preflight reorder or old case removal. Update actual whole Probe/AA-test pins accordingly in Policy, BP1 protected-source predicate and Manifest. BP1 must still require complete exact Reader/Physical/Probe pins and complete original Reader inverse; its only permitted source amendment is updating the fixed complete Probe bytes/blob/SHA256 for this inventory-only addition. Keep all22+7 mutants, all guards and original4 protected files intact. If any other concrete incompatibility is found, report it; do not broaden this task silently.

4. Preserve accepted A8 Reader933591ff…, Physicalbd995580…, R2 9aec7a10…, restored Storage109e8ac…, Reader-test1db87d5… EXACT. Any update needed solely for current scope is limited to:
   lib/readiness/official-truth-aa-revision-probe-1-policy.ts
   lib/readiness/official-truth-aa-revision-probe-1-server.ts
   lib/readiness/official-truth-aa-revision-probe-1.test.ts
   lib/readiness/official-truth-bundesportal-bp1-observation-1/observation.test.ts
   docs/official-truth-product-v3/AA_REVISION_PROBE_TASK_V1.md
   docs/official-truth-product-v3/AA_REVISION_PROBE_HANDOFF_V1.md
   docs/official-truth-product-v3/AA_REVISION_PROBE_MANIFEST_V1.json

5. Preserve complete prior Task/Handoff/history and include this full task. Update actual lineage, source pins and inverse metadata without relabeling historical failed runs. Provide full exact tree comparison against both selected parents and all current-main unaffected leaves; identify authored changes separately from inherited main integration. Independently back-read all new Git objects. Supply byte inverses for the finite source changes.

### Execution/authority boundary
Source-only Git object authoring and inert text/hash/tree work ONLY. No project/parser/compiler/AST/native/SQL/APT/test/build execution, no CI dispatch/rerun, no official GET, no ref/PR publication, no Ready/merge, no hosted read/mutation. #917/#1131 remain untouched. This source task does not reuse any consumed positive invocation or arm a new one.

STOP after immutable delivery. Root will independently review; publication can be selected only after actual-main #4135/Production acceptance. Full new exact-head CI/Preview gates remain required. Actual fresh one-shot source verification and pilot-window extension are later explicit Root steps, not claimed by this integration.
<!-- END VERBATIM ROOT RECEIPT 6826548986 -->

### Root receipt 6826586679

Source: https://github.com/Jetnity/jetnity/pull/1192#issuecomment-6826586679

<!-- BEGIN VERBATIM ROOT RECEIPT 6826586679 -->
## AA V1/A9-A1 — correction of one transcription error in Root task

The author correctly refused to silently accept the malformed 43-character selector-test blob in A9 comment6826548986. Root independently re-read the selected actual-main tree77666e58d26538fb704389366b77e3a4a1903ac2 and the complete blob.

Correct exact pin for `scripts/official-truth-v3-test-selection.test.mjs`: **bbc10fc9621e31c5af74421891608d3cdf27238d**, **7360 UTF-8 bytes**, SHA256 **edbbcb838a8d8642d21afe7b1608f137ff60d53e1214c4a9cc8f012d16ff6730**. The erroneous string `bbc10fc9621e31c5af74421891608d3cdf2ac528d4d` in the original task is void. Byte length and SHA256 in that task were already correct.

Use this actual main leaf unchanged. No source scope, execution authority, policy, selected parents or other pin changes. Preserve this correction together with the complete original task; continue the same session's finite SOURCE-ONLY integration.
<!-- END VERBATIM ROOT RECEIPT 6826586679 -->


---

## A10 / A10-A1 — exact A9 typecheck review-fix authority

The complete previous A9 Task prefix remains unchanged. The two following complete Root receipts bind the exact typecheck correction and correct one mistaken allowlist path. A9's actual Core typecheck failed; prior source acceptance does not become runtime PASS.

### Root receipt 6827114603

Source: https://github.com/Jetnity/jetnity/pull/1192#issuecomment-6827114603

<!-- BEGIN VERBATIM ROOT RECEIPT 6827114603 -->
## CHANGES REQUIRED — AA A10 / exact A9 CI typecheck correction
Root independently read full repository-verification log for actual PR CI #4136 / run43241573740 attempt1, job131263094386. Checkout d49c727c6 merged exact head **cfdebe87bae2cb52b523acf68079f550a617597c** into main **b5f33f66faab89454a874e641dbd0dfa66b09d2d**. Full log:111314 bytes, SHA25616de4e2b337fa62cd215abdd186bd71cca69959a09652d992dbb920f002b7a62.
Typecheck failed; later Core lint/tests/build did not run. No claim about A7 timeout healing. No rerun or skipped gate is authorized.

### Same session / sole parent / finite correction
Same original **Jetnity Official Truth CH-DE AA Revision Probe1 — Codex Generation1**. Sole parent is the current published A9 head above; no main merge is needed. Exactly these seven existing paths may change:
- lib/readiness/official-truth-server-owned-retrieval.ts
- lib/readiness/official-truth-aa-revision-probe-1.test.ts
- lib/readiness/official-truth-aa-revision-probe-1-policy.ts
- lib/readiness/official-truth-ch-de-source-budget-128k-1.test.ts
- the existing AA Revision Probe1 Task, Handoff and Manifest paths

A10-01: restore the **original type-only API** OfficialTruthServerOwnedRetrievalLookup via the Reader's existing export type block from the physical module. Physical already declares the exact type; no physical/runtime body change and no new runtime export/import consumer. This resolves TS2724 in AA/BERN/same-request/Reader tests and their consequential TS7006 callback errors. Update the existing AA exact Reader type-reexport AST allowlist for this one original type; all runtime restrictions and other consumers remain unchanged.

A10-02: at the existing AA mutation loop for [readerPath,probePath] (line801), retain those two exact string literals as a readonly literal tuple (for example as const), fixing TS2345 at sourceBytes.get(ownedPath). No any/cast bypass, widening of repository inventory, test removal or assertion weakening.

### Dependent pins / preserved evidence
Update only directly dependent full Reader/test pins in Policy and BP1, and the Reader full-byte inverse offsets made necessary by the inserted type-only line. Keep the exact original Reader reconstruction5998fdea54d3337fb68cd7111460b59e43a3cef7 /46071bytes/SHA256b83340d46dbf8dbc3d1ba389d6b38964bf48fa05132655854ee0e49cc66db994. Full current Reader/Physical/Probe pin checks, all22whole-source+7span mutants and original29span full inverse remain mandatory. Probe, Physical, R2, Storage, ReaderTest, CI/package/selectors and every other tree leaf unchanged. If the seven-path list cannot express an actual necessary fix, stop and report the precise additional dependency.

Preserve complete A9 Task/Handoff/history verbatim; append this full task and failed-run evidence. Manifest exact pins, full old→new Reader/test/BP1/Policy inverse and all unchanged complement. Policy remains Run0 UNARMED, exact base b5f33f66faab89454a874e641dbd0dfa66b09d2d,17 inventory entries; no official source GET or window update.

### Delivery / gate
Immutable objects and inert text/hash/tree comparisons only; no project/parser/compiler/test/native/SQL/build/APT/CI/ref/PR/Ready/merge/hosted/sourceGET action. Deliver exact soleparent/tree/full raw pins and inverses, then STOP for Root review. Root alone publishes selected source and requires complete new-head CI/Vercel/thread re-gating. #917 and #1131 untouched.
<!-- END VERBATIM ROOT RECEIPT 6827114603 -->

### Root receipt 6827159555

Source: https://github.com/Jetnity/jetnity/pull/1192#issuecomment-6827159555

<!-- BEGIN VERBATIM ROOT RECEIPT 6827159555 -->
## AA A10 / A1 — exact seven-path allowlist correction
This is Root's correction to6827114603, not a new implementation scope. Replace the mistakenly named lib/readiness/official-truth-ch-de-source-budget-128k-1.test.ts entry with **lib/readiness/official-truth-bundesportal-bp1-observation-1/observation.test.ts**. The actual required29span inverse/full Reader pins/22+7mutants are in that BP1 observation test. The source-budget test remains unchanged. Exactly seven selected paths total; every other A10 instruction, soleparent, body-preservation obligation and STOP remains in force. Root acknowledges the naming error; the original author correctly refused an unlisted edit.
<!-- END VERBATIM ROOT RECEIPT 6827159555 -->

## A11 — finite BERN metadata-reference amendment

### Root receipt 6827925972

Source: https://github.com/Jetnity/jetnity/pull/1192#issuecomment-6827925972

<!-- BEGIN VERBATIM ROOT RECEIPT 6827925972 -->
## CHANGES REQUIRED — AA A11 / finite BERN metadata-reference amendment
Same original AA Generation1 session /root/aa_revision_probe_writer_g1. Exact sole parent **d8ecb572c848cf8d9535ad5a44d9014f886fd202**, tree **eef18231ba435a571633607d00831275c5a8b5f7**. Root selects the following bounded review correction; no PO question is needed.

### Actual failure, independently read
Actual PR CI **#4137 / run43245997688 / attempt1**, Core job131278670273. Full log **1615295 bytes / SHA256c3cc6b90faba6ddf3dcda40499b9146db5bb1ba886b31857b8284ed01bb27fc8**. Typecheck and Lint passed. The BERN research-only guard failed because it counted the AA test's literal export-metadata string as a third consumer:
- lib/readiness/official-truth-aa-revision-probe-1.test.ts, added to the actual string-match list;
- the unchanged legitimate BERN cli.test.ts and run.ts remain the only expected consumers.

Root read the actual guard (8e0945ee478435285a3068be94917a171570cfab) and actual AA test. The latter has exactly one reference to the BERN live-entry name, inside the Reader declarationExports string allowlist. It neither imports nor invokes that BERN entry. The guard uses whole-source text.includes and therefore conflates this precise metadata literal with a runtime reference.

At15:19:50UTC the runner also explicitly reports shutdown; AA test receivesSIGKILL and two other filesSIGTERM, followed by operation canceled. **Cause of shutdown is UNKNOWN; do not claim OOM, timeout healing, completed suite or a source cause.** No tests summary or complete Core PASS exists. Do not rerun the failed head or change CI/resource limits blindly.

### Four existing selected files only
1. lib/readiness/official-truth-bern-g3-rq-fetch-1/research-only.test.ts
2. docs/official-truth-product-v3/AA_REVISION_PROBE_TASK_V1.md
3. docs/official-truth-product-v3/AA_REVISION_PROBE_HANDOFF_V1.md
4. docs/official-truth-product-v3/AA_REVISION_PROBE_MANIFEST_V1.json

No AA Reader/Physical/Probe/Policy/test/BP1, runtime, BERN runner/CLI, selector, CI/package or other file changes.

### Exact allowed metadata exception; preserve runtime boundary
Implement a narrow **pinned metadata-only exception** in the existing BERN test guard, with complete actual AA test validation BEFORE applying it:
- Fixed AA test path, exact current blob9e278742a53d64da9bb9063a91649a08e3f84649, **56236 bytes**, SHA256 **4a4d12f93b03d376b744fbc894e3edd2698e5cda2b4b573bcc688d34797e99ee**.
- Require its full actual bytes/hash, and exactly one occurrence of the BERN live-entry token in the precise existing quoted `value:` Reader export-allowlist metadata context. Bind actual source region/expected literal as needed, without source normalization.
- That exact file is metadata evidence, not an additional runtime consumer. The actual permitted consumer list MUST remain exactly the two existing paths; no wildcard/path-family exemption, global string-reference relaxation, new BERN caller or silent skip.
- Do not evade the existing guard by splitting/encoding/obfuscating the BERN token in the AA source. AA source stays byte-exact.
- Keep all original BERN transport/deadline/redirect/no-retry cases and all original source roots/walk behavior. Root selected only this exact metadata distinction.
- Add finite in-memory negative checks sufficient to show modified full AA bytes, missing/duplicated/moved token and an appended actual call/import cannot acquire the exception. No live imports or execution of BERN/AA entrypoints in these checks. Prefer one private helper in the same test file; no test-only production export.

A code-only SHA does not prove semantics on its own: Root has independently inspected the pinned actual AA source and will re-review this exact exception, while the original source-import guards remain in the complete CI suite. Future AA file changes must intentionally update/review the pin or fail this guard.

### Evidence / delivery
Preserve the complete previous Task/Handoff/Manifest history. Append this complete task and honest failed/interrupted-run facts; update current source inventory and finite whole-file inverse for this one BERN guard change. Record the exception as this explicit versioned Root amendment, not an old guard PASS or a broad permission. Current Policy remains Run0 UNARMED/baseb5f33/17entries and all its bytes exact. New source has no official GET or pilot-window effect.

Immutable Git objects and inert text/hash/tree comparisons only. No project/parser/compiler/test/native/SQL/build/APT/CI/ref/PR/Ready/merge/hosted/sourceGET operation. Return full raw pins/soleparent/tree and every unchanged leaf, then STOP. Root alone independently reviews, publishes the new head and requires every fresh exact-head gate. #917/#1131 remain untouched.
<!-- END VERBATIM ROOT RECEIPT 6827925972 -->
