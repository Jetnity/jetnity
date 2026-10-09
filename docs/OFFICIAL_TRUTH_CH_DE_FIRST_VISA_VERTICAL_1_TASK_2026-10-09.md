# Official Truth CH→DE First Real Visa Vertical 1 — Binding Codex Integrated TASK

Date: 9 October 2026 (Europe/Zurich)
Issue: [#917](https://github.com/Jetnity/jetnity/issues/917)
Repository: `Jetnity/jetnity`
Branch: `feat/official-truth-ch-de-first-visa-vertical-1`
Baseline: `main@07580089539fb521a1676bf466de09acd55978c5`
Operating Mode at TL precheck: `NORMAL`, mode blob `1912bf56751a940acc56fad84e2bf9e6a174e0fa`
Author: **Jetnity Official Truth CH-DE first real visa vertical 1 — Generation 1**
Session: **NEW, independent Codex Desktop; NOT STARTED by seed**
TASK: **IMMUTABLE once created**
Execution authorization: bounded, development-only source+data-to-existing-Trip-Workspace vertical engineering; no hosted/Production acceptance or runtime activation.
Final rule: **Only ChatGPT Technical Lead may mark Ready and merge. Codex MUST leave Draft and STOP.**

## I. Objective — first user-meaningful vertical, not another isolated UK ETA module

Jetnity's existing Trip Workspace, Account Trip loader, server-side `tripOfficialEvaluationsAuswerten`, canonical `requirementsFuerReise`, requirement presentation and multi-document/traveller context already exist. However `requirementsProviderAus()` returns **null**, `readinessZustand` hard-disables Production, and the existing Official Truth Development source/Evidence/Rule store contains no approved first country rule usable by visitors. No Product Owner approval exists to change those limits here.

Deliver a **single, narrow CH ordinary passport → Germany `visa` status** real-official-source engineering path, from exact state primary evidence and qualified full source bytes → canonical candidate/review boundaries → pre-gated `OfficialEvaluation[]` read projection → existing Trip Workspace presentation in isolated integration tests. The positive real/production result may be generated **only after** the genuine source, acceptance, custody, and protected activation gates separately pass. This task builds the safe release-capable engineering seam and exact gate packet; it **cannot** make a visitor-facing visa claim or activate the Provider from its own authority.

We are intentionally leaving behind pure extra UK ETA gap-only modules: this work connects existing systems. Do not duplicate the previously merged account B01, #914 source bridge, #916 legal gap module, E1–E5, schema2 evaluator, or existing data/acceptance contracts.

## II. Candidate official source and legal limit (not approved Official Truth)

**Source S1, primary:** German Federal Foreign Office (**Auswärtiges Amt**), visa duty / exemption country table, 03.06.2026, clean canonical URL
`https://www.auswaertiges-amt.de/de/service/visa-und-aufenthalt/staatenliste-zur-visumpflicht-207820`
Exact observed narrow statement: country row **`Schweiz` has visa obligation `Nein`**. This is a promising public **candidate** primary statement for CH nationality; no validation of a particular live response's protected provenance, legal temporal interval, passport subtype, complete entry checklist or accepted Evidence is implied.

**Source S2, limited corroboration:** Federal Foreign Office FAQ
`https://www.auswaertiges-amt.de/de/service/fragenkatalog-node/01-visumnoetig-606470`
The FAQ includes Switzerland among named exceptions to Germany's general visa requirement. It is the SAME GOVERNMENT PUBLISHER, not falsely an independent authority. This FAQ's long-stay/registration phrasing is not an automatic authorization for employment, unlimited stay, lawful residence or visa-free completeness.

**Critical refusal boundary:** Do NOT infer a `90 days per 180` limit, work rights, general `three-month residual passport validity`, blank pages, arrival forms, transit exemptions or permissions from generic AA footnotes/country-list membership: their precise applicability to Swiss nationality may differ under EU–Swiss free-movement agreements. The exact proposed fact is ONE `visa` requirement under an explicit supported scope only; every other requirement remains **unknown/unavailable/unproven** unless a separate accepted official source proves it. `not_required` must never be inferred merely because no rule/data exists or source did not mention visa.

## III. Mandatory live reconstruction before editing

Read in this order: `JETNITY_START_HERE.md`; `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`; cited current Handoff; `docs/ACTIVE_WORK_STATUS.md`; #751 **current top + latest checkpoint comment**; #748 only MATERIAL after last processed `6036558748`; this immutable TASK and Issue #917; relevant currently open PRs/issues; 3-phase strategy/V1 Binding Critical Build Order; .jetnity/operating-mode.json. Fresh remote `origin/main`, actual branch/head, merge-base/ahead/behind, full diff, GitHub Actions, Preview/Production, Dev/Production Supabase _read-only_ only as needed, real Product Owner gates and Guardian findings. Live evidence wins over 9 Oct task baseline.

Known TL baseline: `main@07580089539fb521a1676bf466de09acd55978c5`; #915/#916 MERGED, CLOSED and post-merge VERIFIED with actual-main push GitHub CI 37984596396 6,189/6,189, 817 suites, native PG16.15, Auth 55/243; Vercel `dpl_B9eV27tx6uFjW4yvPWLjJx1mDsw4` Production READY, exact jetnity.com alias. Unrelated Draft #913 remains CODE UNPUBLISHED / PLATFORM SAFETY BLOCKED, seed `79deb6981e243edee1628bd0e2d47bbb18972fd8`. DO NOT access its blocked local source or route around its publication refusal. Drafts #28/#39/#40/#50/#52 are historical.

Confirm actual truth wiring:
- `app/(public)/reisen/[tripId]/page.tsx` authenticates and RLS-loads account Trip, then `tripOfficialEvaluationsAuswerten`.
- `lib/readiness/trip-official-evaluations-server.ts` passes `requirementsProviderNachZustand(requirementsProviderAus())`.
- `lib/readiness/provider.ts` returns `null`; `lib/readiness/zustand.ts` keeps Production hard-off.
- `OfficialEvaluation[]` already flows via `KontoArbeitsbereich` into `TripWorkspace` and Preparation; no second UI panel required. Guest remains explicitly unavailable until separately designed.
- `lib/readiness/official-truth-server-held-source-registry.ts`, identity/profile registry, sole rule parser, Rule Review, candidate acceptance and store must remain sole authority.

## IV. Owned scope and SINGLE_AGENT choice

One writer performs this **integrated vertical** because official source identity, exact narrow visa effect, canonical context and proof-to-presentation failure semantics are tightly coupled. No parallel writer of shared contracts. Existing #913 is not a parallel worker, and new Source/Workspace work must not overlap it.

Authorized new paths:
- `scripts/official-truth-ch-de-first-visa-vertical-1/**` for bounded actual official-source qualification/research and offline reproducible runner; exact permitted source set S1/S2 only.
- `lib/readiness/official-truth-ch-de-first-visa-vertical-1/**` for **new pure/server-only** candidate→trusted-adapter boundary (split files explicitly if needed).
- `lib/readiness/official-truth-ch-de-first-visa-vertical-1.test.ts` plus tests under owned new module for adversarial and end-to-end canonical engine/Presentation proofs.
- `docs/OFFICIAL_TRUTH_CH_DE_FIRST_VISA_VERTICAL_1_{PLAN,CONTRACTS,REPORT,SELF_REVIEW,STATUS,HANDOFF}_2026-10-09.md` new only.
- `docs/evidence/official-truth-ch-de-first-visa-vertical-1/**` finite research and test evidence, safe manifest.

**Narrow optional test-only addition:** Existing `lib/readiness/trip-official-evaluations-server.test.ts` and/or `lib/readiness/workspace-integration-r1.test.ts` for a small additive explicit CH/DE end-to-end contract assertion using **synthetic labelled test data** and existing rendering path, if required. No deleting/weakening assertions. Existing exact-importer guard tests may receive only the minimum additive exact references with independent validation, never removed/disabled/skipped.

**Not owned without fresh TL scope decision:** `lib/readiness/provider.ts`, `lib/readiness/zustand.ts`, `lib/readiness/engine.ts`, `lib/readiness/rule-claims.ts`, `lib/readiness/official-truth-*-registry.ts`, `lib/readiness/official-truth-store-server.ts`, `app/**`, `components/**`, `types/**`, `supabase/**`, any middleware, secrets, GitHub CI workflows, `package.json`/lockfile, central governance files, task file or shared migration/RLS contracts. If actual first-path implementation truly cannot be production-ready without changing one of these, **STOP and submit an exact bounded technical scope-amendment request**. Do not bypass constraints with a duplicate trusted parser, another Provider engine, illicit reader, or hidden runtime toggle. The PO explicitly prefers completed work, but protected changes demand their real gate.

## V. Binding acceptance criteria CHDE-01…CHDE-27

**CHDE-01 — Live state.** Reconstruct exactly as III, re-fetch before push and after unexpected drift. If HOLD/Owner gate activated, STOP. All changes confined to owned paths; existing source and Trip Workspace canonical contracts reused.

**CHDE-02 — Direct official provenance.** Verify S1 and S2 via canonical tracking-clean HTTPS authority URLs; exact publisher/authority, local retrieval UTC, title/date, legal row and relevant table/FAQ context, document-class meaning and negative controls. Never derive law from a web search snippet, LLM text, SEO site or broker. Distinguish a web researcher page from true server-owned same-request bytes.

**CHDE-03 — Full safeguarded source transport.** Explicit opt-in source read only (default OFFLINE/NOT_RUN), must use existing bounded server-owned retrieve guard: 65,536 UTF-8 bytes inclusive, timeout, HTTPS/public IP/DNS/socket, redirects, media, no cookies/credentials, full-body scan and canonical URL/host. Measure actual S1 and S2 response sizes, redirects, content types and behavior. If either > 65,536 or fails bot/representation/media/identity constraints, **record `SOURCE_NOT_QUALIFIED`**; DO NOT enlarge bound, pre-slice source, scrape rendered text, manipulate headers/IP/UA to evade protections, use commercial mirror or claim source positive. A separately approved small official alternative may be proposed to TL but never silently substituted.

**CHDE-04 — Legal/identity completeness for one fact.** Require exact positive `Schweiz → Nein` row anchored to the official table header `Visumpflicht für Deutschland: Ja/Nein`, complete legally relevant paragraph/footnotes and unambiguous page/publisher identity. Detect duplicate/malformed/ambiguous Switzerland row, changed table boundaries, DOM/HTML/charset ambiguity, conflicting current S1/S2 claims and page moves. Do not globally parse a country matrix into Official Truth.

**CHDE-05 — Narrow regulatory scope.** Only explicit single target `DE`, citizenship full set `['CH']`, selected passport credential properly linked to CH citizenship (issuer separately checked), explicit destination/travel date/route and when necessary purpose. No guessed `ordinary` document subclass, citizenship from passport issuer/residence, `documents[0]`, favourite passport or implicit single-citizen selection. For any unsupported/multi-citizenship, additional credential, transit, indirect journey, unknown date/purpose/entry condition, refuse positive acceptance; keep unrelated cells unavailable.

**CHDE-06 — One fact, no collateral facts.** Candidate `requirementType='visa'`, source-supported `effect='not_required'` ONLY where absolutely supported and fully evidenced. Do not create stay limit, 90/180, minimum passport validity, blank pages, ID eligibility, travel/employment rights, accommodation/onward funds/health/insurance/arrival-form or transit "not required" from this visa row. Do not output a global all-clear.

**CHDE-07 — Evidence quality.** Real primary statement only with proof link/locator/snapshot and controlled age. Research-only finding must not be marked `explicit_primary_statement` **accepted** until the approved trusted evidence chain independently re-proves it. `research_gap` never means `not_required`, `validFrom/validUntil` unknown remain null; `checkedAt` is actual Jetnity retrieval/evaluation UTC, not AA publication date.

**CHDE-08 — Authority separation.** Distinguish (a) human-researched website, (b) a server-owned verified response, (c) Candidate Evidence/Rule Review and (d) accepted persistent Rule and public User Evaluation. Never promote one to the next by casting or copying data. The server-held Catalog/Content Identity and v2 trusted closure are the sole provenance authorities.

**CHDE-09 — Canonical official custody.** Reuse existing `officialTruthServerHeld*`, canonical `regelScopeAusEvidenceScope`, sole `regelFaktKanonischLesen`, Existing Rule Review/packet fingerprint and source-owned retrieval/identity contracts. Never mint synthetic `ev2_*`, fabricated acceptance/custody, duplicate support ID, model proposal authority or fake Source Registry.

**CHDE-10 — No source registration.** Only propose minimal exact S1/S2 source-family/content item/representation/profile/URL allowlist + Privacy source admission packet if justified; the actual protected registry/DB remains unchanged. If identity/time/privacy cannot be fully proved, report **BLOCKED** and never issue accepted evidence.

**CHDE-11 — Bounded source behavior.** Full official body only transient memory, no saved raw response, request identifiers, complete raw-body hashes or machine/home/trace metadata in repository. Publish only safe finite observations (source URL, retrievedAt, bytes, allowed response type, redirect count, exact legal-locator only if safely independently proven, status/reason). No unreviewed source free-text reflected to UI/logs.

**CHDE-12 — Existing Provider/Engine contract.** A future accepted one-cell visa fact must project through the existing `RequirementsProviderZeile` → `requirementsFuerReise` → `OfficialEvaluation[]` → existing Trip Workspace without altering global `requirementsProviderAus() = null` or `readinessZustand` production hard-off. Build pure projection and injected-port integration tests, no second engine or UI matrix.

**CHDE-13 — Proof-bound projection.** Positive projected `not_required` must require genuine server-held accepted/revalidated evidence identity AND exact country/citizenship/credential/travel-date/route scope. A caller-crafted `{status:'accepted'}` or arbitrary Evidence/Rule DTO passed to a function is **not** itself trustworthy. If there is no existing trusted accepted-reader capability to satisfy this proof, this adapter remains dormant and emits **unknown/unavailable** in all real use; document exact missing reader/gate, not a synthetic production positive.

**CHDE-14 — Exact traveller multiple options.** Every traveller and credential option isolated. Multiple citizenships, passports, missing explicit link, issuer mismatch, unknown document class, changed trip date/route or transit may not inherit CH/DE result. No fake `not_required` after mismatch; no credential default.

**CHDE-15 — Gaps retained.** Output for unrelated requirements stays `unknown`/unavailable and highlights that this is only a *visa* candidate/approved cell. Unknown travel document requirements, transit, blank pages/financial means cannot quietly disappear or show “not needed”. Existing UI must not imply trip fully ready.

**CHDE-16 — Workspace existing display.** Use existing authenticated RLS account Trip → `tripOfficialEvaluationsAuswerten` → `KontoArbeitsbereich` → `TripWorkspace` → Preparation/Destination Essentials, no new panel and no UI redesign. Contract tests should exercise the actual helper/engine and existing component presentation with injected safe/synthetic acceptance tests only. Guest's prior unavailable behavior unchanged.

**CHDE-17 — User action and citations.** Verified official URL is shown as **information source only**, not an invented visa application endpoint. Do not generate application link, fee, duty, stay period, visa-on-arrival or travel entry guarantee. No public "visa-free" banner from unpublished Candidate Evidence.

**CHDE-18 — Failure/refusal tests.** Wrong publisher/host/path/content ID/representation, redirect/port/DNS/private address, oversized/truncated/fatal UTF-8, HTML/layout/encoded country ambiguity, duplicate CH rows, changed author, source conflict, missing primary URL, stale, epoch, explicit exception uncertainty, mixed scopes, replay, invalid/edited or absent source, invalid trusted-origin seal → fail closed and no accepted fact/UI result.

**CHDE-19 — Presentation negative cases.** Missing provider (existing), disabled production gate, server failure/timeout/AbortSignal, no matching accepted row, stale accepted-like row, missing traveller/credential, different country, changed date, guest journey, transit and multi-citizenship MUST remain unknown/unavailable. No persisted personal state, no auto retry storm.

**CHDE-20 — Adversarial data.** Plain-data/strict bounds, PII accessors/prototypes/cycles/HTML/JSON duplicate keys/Unicode/URL injection, browser-supplied evidence or credentials, mixed scopes/source identifiers cannot become trusted truth. Reuse existing canonical scanner/parsers where allowed. No quoted raw untrusted text in public GitHub diff.

**CHDE-21 — Source feasibility gate.** Produce an explicit immutable narrow technical/legal "source-ready-vs-blocked" recommendation. If full safeguarded source or complete legal context is unprovable, **STOP at SOURCE_NOT_QUALIFIED**, and DO NOT claim E2E regulatory pass, even if offline harness or native tests passed. Do not compensate by hardcoding the government result or weakening the source guard.

**CHDE-22 — Owner decision packet for real adoption.** Distinct later decisions (a) Development Source/Content Identity and privacy registration, (b) real accepted Evidence/Rule with current AAL2 Owner or separately approved deterministic autonomy, (c) hosted read path/retention, (d) Production registry/runtime activation/website projection, (e) broader country/credential coverage. Each must have exact ready evidence and cost/rollback/safety condition. **No request to approve blanket importer or F8 in this task.**

**CHDE-23 — Comprehensive tests.** Focused plus existing full native Node22/PostgreSQL16 R3/semantic/structural suites, typecheck, lint, build and hygiene. Honest impossible gate outcomes; never skip, xfail, alter baseline thresholds or use mocked Postgres as proof of native tests. Show RED/GREEN for material corrections.

**CHDE-24 — Same-request/DB tests.** If a real source is technically qualified, exercise the already existing same-request/native PG admission-protection code in disposable LOCAL state only; never call hosted Supabase. Explain whether actual snapshot→Research candidate succeeds or is blocked by source qualification/profile/Authority. Do not treat synthetic insert as real accepted rule.

**CHDE-25 — Complete report/handoff.** PLAN, CONTRACTS, REPORT, SELF_REVIEW, STATUS, HANDOFF and finite research/verification manifest with canonical official URLs, retrieval UTC, exact command outcomes, release block, changed files, tests, current branch/head/tree. No raw live HTML, login email, machine path or sensitive data in logs.

**CHDE-26 — Pre-push live revalidation.** Re-read main, mode, #751, #748 new MATERIAL and current PR/agent ownership; compare actual branch/merge base/ahead/behind and collision with #913. New head invalidates any earlier exact-head tests/preview. Commit and push **only** this branch, no force push.

**CHDE-27 — STOP at TL gate.** Author leaves existing Draft PR Draft; do not Ready/merge/cherry-pick/main sync or start a second country or next slice. Final post: exact author head SHA and Git tree, immutable TASK hash, **SOURCE QUALIFIED or SOURCE BLOCKED clearly separated from ENGINEERING TEST PASS**. Technical Lead independently reviews every file/CI/Auth/Preview and decides next move. Product Owner special gates remain.

## VI. Risk and outcome boundaries

- **P1 regulatory / privacy:** incomplete source, legal qualifier or actual trusted identity fails closed; only research candidate allowed. No positive visitor-facing output.
- **P1 trust/custody:** a true `not_required` must not come from an untrusted caller, raw browser snippet or unapproved Registry. No hidden status promotion.
- **P1 data protection:** no passports/MRZ/scan/DOB/health or traveller documents in global Official Truth, logs or evidence.
- **P2 product:** visitor needs a useful first result; do not hide absence with a visually reassuring "all checks clear" state.
- **P2 future-proofing:** this is one Fact Kind (visa) for one credential/destination, not a global Germany matrix or EU/Swiss free-movement interpretation.
- **Separate #913:** never re-upload/sanitize blocked local payload through this branch. #913 requires a separate authorized safety resolution.

**Product-Owner special gates reserved:** official admission/promotion and F8, hosted Development/Production database apply/import, Auth/RLS/AAL/identity, secrets/paid providers, sensitive personal retention, launch/indexing, protected source registration, and new recurring costs (infra cap $100/month).

**Outcome vocabulary at STOP**:
- `SOURCE_QUALIFIED_FOR_TL_REVIEW` or `SOURCE_NOT_QUALIFIED` / `RESEARCH_GAP`
- `ENGINEERING_READY_FOR_INDEPENDENT_TL_REVIEW` or `ENGINEERING_BLOCKED`
- Always `NO_ACCEPTED_OFFICIAL_TRUTH / NO_F8 / NO_HOSTED_IMPORT / NO_PUBLIC_REQUIREMENTS_ACTIVATION` until separately authorized.

**STOP — FIRST CH→DE VISA VERTICAL ENGINEERING DELIVERY FOR INDEPENDENT TL REVIEW.**
