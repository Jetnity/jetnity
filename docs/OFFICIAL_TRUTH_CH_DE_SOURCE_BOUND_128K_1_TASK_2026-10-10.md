# Jetnity Official Truth CH→DE Source-Bound 128KiB Retrieval 1 — Binding Codex TASK

Date: 10 October 2026, Europe/Zurich
Repository: `Jetnity/jetnity`
Issue: [#919](https://github.com/Jetnity/jetnity/issues/919)
Branch: `feat/official-truth-ch-de-128k-representation-1`
Initial baseline: `main@0c19d79021d1869175f4a2c29013d7af95b27149`
Operating Mode at TL precheck: NORMAL, blob `1912bf56751a940acc56fad84e2bf9e6a174e0fa`
Logical writer: **Jetnity CH-DE Source-Bound 128KiB Retrieval 1 — Generation 1**
Session: **NEW independent Codex Desktop worktree/session; NOT STARTED by task seed**
TASK is immutable once created.
Status at seed: **CODE-ONLY SECURITY IMPLEMENTATION AUTHORIZED / NO HOSTED SOURCE, ACCEPTED RULE, F8 OR PUBLIC ACTIVATION**.

## 1. Objective: solve the measured transport blocker without weakening regulatory source trust

Jetnity's protected `lib/readiness/official-truth-server-owned-retrieval.ts` limits complete source responses to `BODY_MAX=65_536` bytes in BOTH GET Content-Length and streamed-body checks. Germany source research of PR #918 was correctly refused on two official Auswärtiges Amt pages. After Product-Owner-approved ephemeral single measurements ([PR #918 comment 6089916399](https://github.com/Jetnity/jetnity/pull/918#issuecomment-6089916399)), measured COMPLETE, uncompressed text/html HTTP 200 bodies, 0 redirects, are:
- S1 Germany AA Staatenliste `92,963 B`, `https://www.auswaertiges-amt.de/de/service/visa-und-aufenthalt/staatenliste-zur-visumpflicht-207820`
- S2 Germany AA Visa FAQ `78,922 B`, `https://www.auswaertiges-amt.de/de/service/fragenkatalog-node/01-visumnoetig-606470`
- **S3 German Embassy Bern — prioritized source** `71,122 B`, `https://bern.diplo.de/ch-de/service/visumundeinreise/2611474-2611474`

The HEAD Content-Length reported lower counts than the actual GET and is NEVER sufficient to decide complete-body fit. These are one-time measurements, not a promise future sizes remain the same. All three would fit 128 KiB `131_072` on the measured date; this does not prove law, provenance, privacy or currency.

**Deliver:** a production-quality but **dormant/closed** source-/representation-specific maximum **128 KiB**, using the existing server-owned HTTPS retrieval implementation and established Content Identity/Registry, with **all other and as-yet-unapproved sources retaining exactly 64 KiB or BLOCKED**, plus a narrow developer-only proof/candidate for S3 where actual whole-response privacy/identity/legal semantics can be established. No visitor visa result is possible from this task alone. Do NOT rewrite the safe negative #918 work or create another truth engine.

This is a bound-policy ENGINEERING slice. If the S3 page cannot be verified completely without a separate reserved approval, stop at `SOURCE_NOT_QUALIFIED`, describe the exact predicates and finish code/test/report without weakening the policy to claim real positive evidence.

## 2. Mandatory live precheck and constraints

Read `JETNITY_START_HERE.md`; `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`; the current referenced Handoff; `docs/ACTIVE_WORK_STATUS.md`; top and latest checkpoint of Issue #751; new unread material in #748 since TL receipt 6036558748; Issue #919 and this TASK; parent #917 and merged #918; V1 Binding Critical Build Order, Entry Requirements/Official Truth autonomy directive, `docs/JETNITY_MULTI_AGENT_SLICE_PLANNING_STANDARD.md`; active branch/worktree/PRs and mode. Verify live `origin/main`, exact author head, merge-base/ahead/behind, actual diff, GitHub Actions [37996930522](https://github.com/Jetnity/jetnity/actions/runs/37996930522) final result, Vercel Production `dpl_fv61BRqEhHnYaKp6sJjoHaU8oXCN` and aliases. Check deployed source default BODY_MAX and existing source identity registration, canonical source-owned transport and source code tests. Live evidence always wins over this initial baseline.

TL independently certified #918 final integrated `main@0c19d79021d1869175f4a2c29013d7af95b27149`, full 6,258/6,258 / 817 suites/0 failures/skips with genuine PostgreSQL16.15, real Auth55/243 and Production READY/jetnity.com exact SHA. Issue #917 remains OPEN/BLOCKED for real positive visa result. Draft #913 remains separately **BLOCKED BY AUTOMATIC PLATFORM SAFETY**, source code not on GitHub; **NEVER access, reconstruct, republish, retry its refused payload via any alternative mechanism, force push or history rewrite**. Historical Drafts #28/#39/#40/#50/#52 are not active writers. If main/mode/Guardian changes, stop for TL triage, do not guess.

## 3. File ownership / one-writer constraint

**Decision: SINGLE_AGENT.** The transport size rule, source-qualified profile pin and its tests are one shared security boundary and cannot be safely split among writers; parallel implementation could create incompatible authority paths. The blocked #913 author is not a collaborator.

Owned:
- Existing `lib/readiness/official-truth-server-owned-retrieval.ts` — **narrow modifications ONLY** for internally selected representation-bound budget, GET Content-Length and stream limits, encoding/media safety, preserving all other guards.
- Existing `lib/readiness/official-truth-server-owned-retrieval.test.ts` — additive negative/positive boundary tests, no removal/skip.
- New `lib/readiness/official-truth-ch-de-source-budget-128k-1.ts` and `lib/readiness/official-truth-ch-de-source-budget-128k-1.test.ts` — fixed code-owned, versioned, immutable S3 budget policy and its direct adversarial tests. If naming conflicts with canonical architecture, propose correction within task-owned paths.
- New `scripts/official-truth-ch-de-source-budget-128k-1/**` — closed developer-only test/diagnostic and synthetic fixtures; optional one explicit opt-in permitted government source read only if protected network + all gates apply.
- New `docs/OFFICIAL_TRUTH_CH_DE_SOURCE_BOUND_128K_1_{PLAN,CONTRACTS,REPORT,SELF_REVIEW,STATUS,HANDOFF}_2026-10-10.md` and `docs/evidence/official-truth-ch-de-source-budget-128k-1/**` — bounded deliverables and finite synthetic/non-personal proof.
- **Optional minimal ADDITIVE exact importer test inventory** in `lib/readiness/official-truth-content-identity.test.ts`, `lib/readiness/official-truth-integrated-pilot-official-source.test.ts` or `lib/readiness/official-truth-autonomous-producer-custody-foundation.test.ts` only where pre-existing exact-import guard would refuse permitted new imports. Preserve every pre-existing assertion and test count; explain each line. If a guard needs loosening, STOP for TL scope amendment.

**OUTSIDE OWNERSHIP:** all `app/**`, `components/**`, `types/**`, `supabase/**`, Provider factory/state/engine, `lib/readiness/official-truth-content-identity.ts` (global registry), `lib/readiness/source-registry.ts`, `lib/readiness/official-truth-source-catalog-server.ts`, Rule Review/accepted Evidence/Claim/Store, Auth/RLS/AAL/retention, package/lockfile, GitHub workflows/branch governance, global status/start docs, previous #918 immutable task/code/evidence, #913 any content. If truly required, STOP, provide exact small amendment with affected file and reason; do not improvise authority.

## 4. Binding acceptance criteria (SB01–SB31)

**SB01 — Exact baseline.** Live-read all required docs, index/checkpoints, mode, latest Guardian, main/CI/Production/PRs and existing code/test; document discrepancies. Only authorized own branch, never work against `main`.

**SB02 — No global size increase.** Keep default `BODY_MAX=65_536` EXACT for GOV.UK, unknown, historic, missing/unqualified, wrong host, all non-pinned sources and all ordinary entries. Do NOT globally change constant to 128KiB. Existing 65,536 success and 65,537 refusal must remain demonstrably identical for default.

**SB03 — Code-owned 131,072 exception ONLY.** An extended budget `131_072` must be selected solely from a CLOSED, compiled, immutable, exact pinned current S3 representation tuple (source ID; content-item ID+version; representation ID+version; current code-owned identity profile ID+version; exact canonical request/final HTTPS URL; MIME text/html). Never from caller `maxBytes`, request body, environment toggle, generic hostname/domain, query, regex/wildcard, anything `*aa*`, query flags, untrusted catalog extra fields, a user-controlled pseudo-profile or generic test/mock authority.

**SB04 — Two independent gates.** (a) transport budget entitlement for an exact code-owned vetted tuple, separate from (b) full content identity + privacy + legal-source qualification/Official Truth acceptance. A 128KiB transport success cannot establish (b). If protected production profile not actually approved/registered, S3 remains SOURCE_NOT_QUALIFIED/blocked. No new source/profile registration, activation or grant created by building an exception candidate.

**SB05 — No fake source authorization from synthetic catalog.** Test dependency-injected registry/profile may model a valid exact tuple for negative/byte-limit regression, but cannot cause production trusted authority or admit S3; require stable code-owned selection and independent proof. Prove matched test tuple still fails legal/identity if verifier quarantined.

**SB06 — Pre-network destination check.** Validate source class, publisher/authority identity, URL, content item and representation versions, exact approved media and profile eligibility BEFORE starting a privileged stream. Wrong/missing/inconsistent/stale content IDs/profiles or counterfeit active versions must fall back to 64KiB or block, NEVER silently unlock 128KiB.

**SB07 — GET length and stream use SAME selected cap.** Per request/hop, Content-Length > cap immediately refuses, while streamed chunk sum > cap aborts, even when Content-Length missing, 0, falsely short, malformed or contradictory. Read no more than bounded data into accumulation; never publish partial body or claim fully measured length on refusal. Do not use HEAD to decide trust.

**SB08 — Inclusive cutoffs.** Test default exactly 65,535 / 65,536 PASS and 65,537 BLOCK; S3 synthetic pinned exactly 131,071 / 131,072 PASS transport and 131,073 BLOCK; S3 mismatched/historic/unapproved stays default; also when actual chunk crosses threshold only at final piece or despite short declared length.

**SB09 — Bounded memory.** Keep streamed accumulation and final clone under documented bound; process oversized first chunk without storing full, cancel promptly. Report worst-case per-request memory and concurrency/CPU risks; no unbounded arrays/strings, backpressure or retry loops.

**SB10 — Encoding safety.** Client requests Accept-Encoding identity, reject non-identity/unknown or conflicting Content-Encoding rather than silently accepting gzip/br/deflate or automatic decompression. Do not implement a decompressor in this slice; no compressed-bomb loophole. Explicitly test absent or identity (if allowed) and gzip/br/duplicated/unexpected headers.

**SB11 — UTF8 + MIME.** Require fatal UTF-8, reject empty/BOM-invalid/malformed HTML and mismatched media/charset in privilege path. Preserve strict existing response schema/identity; do not assume text/html alone proves publisher/qualified source. Guard size is on full actual UTF-8 response, never extracted snippet.

**SB12 — Network protections untouched.** Keep HTTPS/443, DNS/public IPv4+IPv6 and exactly approved pinned socket, hostname/TLS certificate, no private/reserved/localhost addresses, no cookies/auth, 10s timeout, bounded hop count/loops/redirects and per-hop URL match. Redirect changing representation must not inherit privileged cap. No new alternative network transport/HTTP library or proxy.

**SB13 — Redirect budget recompute.** Each redirected URL must independently pass existing registry/representation allowlist and selected cap, else default 64KiB or refuse before reading. No privilege transfer through relative redirect, URL encoding, hostname alias or redirect from S3 to S1/S2.

**SB14 — Existing external parsing contracts.** Keep response-body → Content Identity profile verifier → server-owned custody order, no post-fetch reclassification, no acceptance from response-header text, domain name, JSON/HTML mere match, model output or fabricated sealed object. Do not add a second evidence/rule parser.

**SB15 — Exact S3 research feasibility.** From government primary sources, independently inspect official Embassy Bern URL as narrowly as security/legal scope permits: page title, authority/publisher, current canonical URI and precise Swiss-national visa claim. Record UTC retrieval and legal-source questions. No assertion that S3 is approved source/ordinary-passport/particular stay/transit/CTA, and no 90/180 or work-right inference from absence.

**SB16 — Source privacy and HTML scope.** Source identity profile must fail-closed on opaque/unknown metadata, unexpected publisher changes, broken HTML structure, duplicate contradictory nationality claims, legally operative cross-references, changing headline/footnote scope and unverified amendment/effect dates. If impossible to establish a complete code-owned profile under this scope, label SOURCE_NOT_QUALIFIED with explicit missing predicates; NEVER drop metadata or parse only a subsection as whole-source identity.

**SB17 — Developer-only actual-read optional, gated.** Default offline; optional explicit bounded single source read via already secured server-owned client/isolated official-research seam ONLY, no retries, no cookies/secret/env credentials; whole response is volatile, never printed/logged/saved/hashed into repo. Safe summary only URL, retrievalAt UTC, complete total byte count when complete, expected media, reason, true source identity status. No paid provider/live visitor request.

**SB18 — No accepted rule on size success.** An HTML body under 128KiB remains untrusted until authoritative government source identity, privacy, legal effect, exact scope, exceptions and current accepted Evidence/Rule all pass separately. No `visa=not_required`, travel-ready or visa-free UI result in this task.

**SB19 — Existing Traveller/Trip behavior.** Verify `requirementsProviderAus() === null`; production readiness hard-off; account Trip Workspace still uses `OfficialEvaluation[]` and yields unknown/unavailable in absence of actual accepted Rule. No UI props or guest/Account routes changed.

**SB20 — Backwards compatibility.** Current GOV.UK Content API and all previous #914/#916/#918 synthetic/regression tests remain unchanged; default source result and bounded refusal reasons preserved. If a changed general encoding validation newly refuses unsafe responses, justify as strengthening with explicit coverage, no silently modified accepted semantics.

**SB21 — Catalog/profile poison tests.** Inject counterfeit pinned item/version/profile with mutated URLs, other authority from same domain, duplicate current representation, alternate language, short/long path lookalikes, localhost/SSRF, raw caller `maxBytes`, wrong content-type/encoding, unexpected high budget. No broadened resource access or admission.

**SB22 — Negative HTTP tests.** 403/bot challenge, 4xx/5xx, timeout, truncated transfer, stream rejection, abort, intentionally misdeclared content-length, malformed status, early close, redirect loop and unqualified media do not produce positive Source/Evidence/Rule; no attempt to retry via another source/host.

**SB23 — Source-size drift policy.** If official S3 page later grows above 131,072 bytes, safely refuse and report bound_exceeded. No automatic ceiling raise, no fallback to arbitrary 256KiB/1MiB, proxy, alternate UA or markup extraction. Require independent versioned re-evaluation.

**SB24 — Preservation of existing protected approval gates.** No Supabase Dev/Prod writes, migration/RLS/Auth change, global source registration, new provider/secret, actual accepted Evidence/Rule, F8 or source-family activation. No sensitive pass/MRZ/health, retention/privacy legal decision or website/public launch. All such decisions remain expressly PO-protected. Infra budget <= $100/month, no new paid service.

**SB25 — Adversarial fixture provenance.** Test bodies fully synthetic, unmistakably labelled. No live raw German HTML, government-content hash, opaque publishing identifier, IP, machine path or personal data in tests, docs, logs, PR/issue prose; sanitization reviewed for all new output.

**SB26 — Real independent test suite.** Focused source-policy/transport/identity/negative tests, existing GOV.UK/CHDE/custody/requirements regression, full `npm test` including REAL LOCAL PostgreSQL 16 native semantic/R3/structural/codec, `npm run typecheck`, `npm run lint`, `npm run build`, setup/operating-mode/api/schema/dead/exports/deps hygiene, `git diff --check`. No skipping/xfailing or weakening assertions; report blocked/unavailable checks honestly.

**SB27 — Semantic red/green.** Document a credible RED (current 65,536 refusal) and GREEN (only synthetic qualified exact-tuple 128KiB transport, no Legal/Source admission) under unchanged authoritative catalog/identity contract, plus poisoned/near-limit failures. Do not turn baseline unapproved HTML into legal-positive test.

**SB28 — Finite full docs package.** Publish PLAN, CONTRACTS, REPORT, SELF_REVIEW, STATUS, HANDOFF and sanitized synthetic evidence/manifest. Independently explain exact profile/bytes contract, unchanged defaults, prefetch gates, source privacy questions, every test run/failure, future cost/performance and why no legal source is yet qualified. Handoff includes exact current SHA/tree and next reserved decisions, not fabricated self-approval.

**SB29 — Verify test-inventory guard amendments.** If a source-exact importer guard requires an extra line, add only exact path/symbol and adversarial lookalike refusal checks; do not add namespace/wildcard, remove policy assertion, increase global importer permissions or change the guard's scope. If impossible, STOP and ask TL exact amendment.

**SB30 — Live concurrency review before push.** Re-read current main, mode, #751 and #748 new MATERIAL, open PR/Issue/Guardian; verify #913 remains blocked and no overlapping new writer. Git diff only allowed file list, merge-base/ahead/behind. Do not silently update main, reset, force push or copy blocked payload. Each changed author head invalidates prior head-specific gates.

**SB31 — Deliver and STOP.** Commit/push only own branch. Provide final HEAD/TREE, TASK unchanged blob, diff/CI-independent author tests and SOURCE_NOT_QUALIFIED vs TRANSPORT_ENGINEERING_PASS separately. Keep Draft; **DO NOT mark Ready, DO NOT merge, DO NOT trigger hosted deployment manually, DO NOT activate sources or start another slice**. The TL independently reviews actual diff, Exact-Head CI/Auth/Preview and decides only normal scope-compliant Ready/Merge; Product Owner retains reserved special gates.

## 5. Clear failure/result vocabulary

- `TRANSPORT_CODE_ONLY_READY_FOR_TL_REVIEW` means a fail-closed code/test implementation and an exact 128KiB transport policy have passed author-local checks. It is NOT an official source qualification, not a user-facing release approval.
- `SOURCE_NOT_QUALIFIED` means S3 source identity/privacy/legal proof incomplete; a correctly bounded byte transfer may have succeeded but **no regulatory claim follows**.
- `SOURCE_QUALIFICATION_REVIEW_NEEDED` requires explicit independent authority/policy proof and later PO approval; no implicit promotion.
- `NO_ACCEPTED_OFFICIAL_TRUTH / NO_F8 / NO_HOSTED_IMPORT / NO_PUBLIC_REQUIREMENTS_ACTIVATION` must remain true.

Developer CodeX Gen1 may independently implement, test, correct, document, commit and push within task; do not ask for routine approvals. If a **reserved gate** or genuinely new shared contract is necessary, stop with a minimal amendment request instead of implementing around it. In particular DO NOT invent a production-approved S3 profile simply because its HTML fits 128KiB.

## 6. End

**STOP FOR INDEPENDENT TECHNICAL LEAD EXACT-HEAD REVIEW. NO AUTO FOLLOW-UP.**
