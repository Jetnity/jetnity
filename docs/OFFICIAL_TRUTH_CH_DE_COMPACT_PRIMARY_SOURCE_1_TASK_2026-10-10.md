# Jetnity Official Truth — CH→DE Compact Primary Source Feasibility 1

**Date:** 10 October 2026  
**Status:** BINDING TASK / CODE-ONLY / RESEARCH-ONLY SOURCE / NO REGULATORY ACCEPTANCE  
**Parent:** [Issue #917](https://github.com/Jetnity/jetnity/issues/917) (first real CH ordinary passport→DE visa cell, still OPEN)  
**Issue:** [#923](https://github.com/Jetnity/jetnity/issues/923)  
**Baseline:** `main@c3db56a4021904aa21c25d75d218f91ee1127697`, mode `NORMAL`, live precheck required before editing.  
**Branch:** `feat/official-truth-ch-de-compact-primary-source-1`  
**Logical implementation agent:** **Jetnity CH-DE Compact Primary Source Feasibility 1 — GitHub Copilot Generation 1**; distinct from completed #920 author and stopped #922 author.  
**Governance:** Technical Lead ChatGPT alone independently reviews exact head / controls Ready/Merge; coding agent never Ready/merge/starts a follow-up.

## Objective: cheapest safe route to one real official case

The already merged #920 extended **transport only**, with a dormant exact candidate 131,072-BYTE cap and default 65,536 BYTES. Canonical Evidence still rejects `snapshot.length >65_536` UTF-16 code units. #922's independently reviewed no-migration larger-snapshot approach stopped with `NO_MIGRATION_NOT_PROVABLE`; it remains Draft/BLOCKED and is not to be resumed by this task.

Rather than widen the store before proving that it is needed, check exactly **two new whole original German Federal Foreign Office / German Embassy Bern primary HTML pages** as alternative sources.

**S4:** `https://bern.diplo.de/ch-de/service/visa/2643834-2643834` — "Entry to Germany", addresses Swiss nationals and visa entry.  
**S5:** `https://bern.diplo.de/ch-de/service/visa/schengen-visa-2643132` — "Schengen visa application", heading "Who needs a visa?".  
No tracking parameters, fragment/query variants, alternate domains, mirrors, content excerpts or guessed API endpoints.

Public-web observations of these pages are *research context only*. Their actual full HTTP GET sizes, WHOLE-body identity/privacy and legal effect are NOT proven. S1/S2 Auswärtiges Amt had already failed 65,536-byte guard; S3 separate Bern candidate measured 71,122 bytes in a bounded, research-only measurement and was never qualified. Do not restart #918/#920 or claim those pages are accepted.

## Binding acceptance criteria (CS01–CS28)

### A. Security precheck and phase A: limited real research only
- **CS01** Re-read current `main`, machine mode, [#751](https://github.com/Jetnity/jetnity/issues/751), [#748](https://github.com/Jetnity/jetnity/issues/748) unread MATERIAL, [#917](https://github.com/Jetnity/jetnity/issues/917), merged #920, blocked Drafts #922/#913, active PRs/writers, task HEAD/blob, ahead/behind and branch ownership. If different, stop for TL arbitration.
- **CS02** Reuse the actual existing `retrieveOfficialTruthIsolatedPilotSource` (in `lib/readiness/official-truth-server-owned-retrieval.ts`) and `quellenRegistryErstellen` / `createContentIdentityGraph` with **one fixed, unapproved, test/research-only quarantined descriptor per source**. `profile.verify` must ALWAYS return `identity_mismatch`; no source-qualified success-shaped envelope, accepted evidence or approved profile. Do not change the protected retrieval implementation, global limits, authoritative profile registry or compile in a real Bern profile.
- **CS03** Research-only live network opt-in via developer CLI with default OFFLINE/NOT_RUN and ONLY explicit `--live-official` for exactly two sequential fixed URLs **at most one full GET each** (no retry/HEAD trust/hidden second fetch), no arbitrary URL/header/env enabling/force size; if live network blocked, report unavailable honestly and no fabricated measurements.
- **CS04** Preserve all existing source read bounds: HTTPS/443, DNS/public-IP/pinned socket/TLS, SSRF, redirect/loop limits with exact URL revalidation, 10s timeout/abort, no credentials or cookies, `Accept-Encoding: identity`, permitted single `text/html`/UTF-8 media, fatal UTF8/BOM rejection, GET Content-Length and actual streamed BYTES both <=65,536, no source truncation/HTML extraction/gzip-to-fit. Never use a second HTTP client to bypass.
- **CS05** For each source record sanitized fixed URL/key, full UTC `startedAt/completedAt`, exact `blocked.reason` or explicit unexpected success failure; `completeBodyBytes` only if whole original body safely reached the quarantined verifier within 65,536 bytes, otherwise `null`. Never invent lengths/redirect/media from a refusal or treat short HEAD/Content-Length as actual body size. No source hash/raw HTML or binary in docs.
- **CS06** If both candidates do not complete under existing guards, STOP with `SOURCE_NOT_QUALIFIED` and finite evidence distinguishing `response_too_large` vs transport/identity/privacy/legality error. Include exact decision alternatives for first case (#917), not a silent large-cap workaround. Do not publish a positive legal fact or open a third source in the CLI.
- **CS07** If at least one whole GET completes, preserve *only* ephemeral in-memory source material for further guarded analysis; no persistent raw page, no logs of page snippets/hashes/IP/account/session metadata. Do not announce that a short source is already approved. Proceed conditionally to B.

### B. Conditional feasibility of ONE CH ordinary passport→DE visa cell
- **CS08** Use the complete response only within the existing isolated source/parser seam. A genuine whole-body *identity profile* would require a separately approved code-owned registration; the injected quarantine descriptor is NOT that. Return only finite `CANDIDATE_RESEARCH`/blocked factors; do not export `server_owned_official_retrieval`.
- **CS09** Test deterministic full-page conditions against synthetic fixtures only (not copyrighted live HTML): exactly one relevant Swiss-nationals visa statement with uniquely scoped title/headings; duplicate/conflicting assertions, locale/media shifts, publisher identity ambiguity, changed markup and unexpectedly added opaque publishing metadata fail closed.
- **CS10** Explicitly distinguish **Swiss citizenship** from CH residence, a passport's issuing state, EEA/EU citizenship and non-Swiss residents. Never infer citizenship from residence, issuer, first document or account language.
- **CS11** Only potential research cell `citizenshipCountryCode=CH`, `documentType=ordinary_passport` (not proved by generic `passport` alone), `destination=DE`, `requirementType=visa`. Whether actual page text legally covers an ordinary passport, relevant purpose/route/date/exception MUST be established separately or remain `research_gap`.
- **CS12** Do NOT apply generic 90/180 days, work/residence/travel-document expiration, passport pages, arrival/transit, airside or health conclusions from these pages to all Swiss travellers. Absence of an exception is never evidence that it does not exist. `validFrom/validUntil=null` until actually established from authoritative operative source (publication timestamp not effective date).
- **CS13** Check official publisher/competent authority, exact final canonical URL, whole-page privacy and metadata/ad trackers, legal references and relevant exceptions using non-asserting finite flags. If ANY needed predicate unresolved, final source status remains `SOURCE_NOT_QUALIFIED` and no Rule/accepted Evidence.
- **CS14** Respect existing `sourceContentHash` / canonical `evidenceQuellenFingerprint` and accepted Evidence/store/same-request gates. No alternate direct SHA or spoofed verified identity. Any source >65,536 UTF-16 chars despite <=65,536 transport bytes must be refused by old Evidence contract.
- **CS15** If conditional synthetic parser is justified, introduce ONLY a **dormant developer-only** narrowly bound parser/proof candidate, with original protected `requirementsProviderAus() = null` and no runtime/UI/store wiring. Prove quarantine still refuses actual positive source status. No new engine or normalized “short summary” serving as substitute whole-source hash.
- **CS16** Document a precise next-stage Source Identity/Privacy/Legal/Validity/Product-Owner decision packet if source candidate is promising; Owner and independent reviewer alone can later approve genuine source registration; such approval is NOT this task.

### C. Engineering, tests and handoff
- **CS17** Owned paths: *new* `scripts/official-truth-ch-de-compact-primary-source-1/**`, optional focused tests `lib/readiness/official-truth-ch-de-compact-primary-source-1.test.ts`, TASK-prefixed `docs/OFFICIAL_TRUTH_CH_DE_COMPACT_PRIMARY_SOURCE_1_{PLAN,CONTRACTS,REPORT,SELF_REVIEW,STATUS,HANDOFF}_2026-10-10.md` and sanitized bounded `docs/evidence/official-truth-ch-de-compact-primary-source-1/manifest.json`. When needed, narrowly amend exact finite test/import-inventory guard lists with an explicit negative lookalike fixture. **Do not edit** `lib/readiness/evidence.ts`, `official-truth-server-owned-retrieval.ts`, source registry, compiled approved profiles, `types/trips.ts`, shared claim/accepted-store/RPC/DB schema, unrelated global docs or scripts unless TL pre-approves an exact scope amendment. Reuse old S1/S2 fixtures/scripts read-only.
- **CS18** Focused positive/negative *synthetic* tests: guard 65,535 / 65,536 / 65,537 byte boundary; changed signature/wrong URL/redirect/duplicate statements, unqualified metadata, missing/excessive fields, mock authority, UTF-8 errors, source size drift and refusal. No synthetic fixture may represent genuine accepted government Truth.
- **CS19** No body-content-derived browser result, trip mutation, accepted OfficialEvidence, source-registry/identity-profile registration, F8 autonomy, visitor-facing claim or production Readiness Provider activation. Current “unknown/research_gap” behavior must remain unchanged and tested.
- **CS20** Run `npm ci` as needed, focused tests, `npm run typecheck`, `npm run lint`, full `npm test` with actual native PostgreSQL 16 semantic/R2/R3/structural when available, `npm run build`, `npm run check:operating-mode`, `npm run check:api-schutz`, `npm run check:schema-bezug`, `npm run check:dead`, `npm run check:exports`, `npm run check:deps` and `git diff --check`. Zero skipped/xfail/new weakened checks. Record exact failures and fixes; blocked environment cannot be called PASS.
- **CS21** Sanitized finite evidence manifest: source key/URL, UTC read times, refusal reason, bytes only if complete, exact code/test versions/counts, flags identityQualified:false/privacyQualified:false/legalQualified:false, `acceptedOfficialTruth:false`, `productionActivated:false`. Never publish actual source HTML/snippet/digest, cookies/tokens, IP, host/session/local path, email, personal pass/DOB/MRZ or private runtime log.
- **CS22** Written six-doc handoff including source/size decision, negative gates, compatibility, any legal/reference ambiguity, tests, risks, cost=0, current main and exact HEAD/tree and immutable TASK blob. No claim of a separate live authenticated consumer save or GDPR approval.
- **CS23** Recheck task immutable blob, live main/mode/Guardian/latest PR head, permitted scope, 0-behind/drift and branch collisions before every delivery commit/push. No force push/history rewrite. One assigned coding writer only.
- **CS24** Agent can implement, run local tests, commit/push on this Draft branch. It may not mark Ready, merge, start a follow-up slice or publish an authoritative official visa conclusion. Report `action_required`/CI unavailable honestly. Independent TL controls Final PASS/Ready/merge only after exact-head content, tests, Auth/CI/Preview, privacy and source scope review.
- **CS25** No Supabase Development or Production writes/migrations, no RLS/Auth/AAL/Role changes, no real source registration/retention decision, no secrets/provider contracts/paid calls, no payment/marketing launch, no public indexing or new material recurring costs. Existing maximum USD 100 per month remains; this task adds no costs.
- **CS26** The author must STOP at any need to alter a protected shared contract, authorization/storage/RPC or act on issue #913's platform-safety blocked local material; escalate precisely to TL, do not bypass.
- **CS27** PR #922 (long-body custody) remains separate `BLOCKED / NO_MIGRATION_NOT_PROVABLE`, do not cherry-pick its unapproved material or mutate it. This task can make progress independently only through short whole-source proof.
- **CS28** **STOP** after finite author delivery for independent TL review; no automatic continuation or extra state claim from a green UI/CI.

## Multi-Agent Suitability — SINGLE_AGENT

Official full-source quarantine and targeted negative source-identity proof share a security-sensitive descriptor/verifier/consumer seam. A second coder risks divergent source authority and accidental acceptance. One GitHub Copilot Generation 1 writer on one new Draft branch is optimal. Optional read-only Guardian/Grok evidence is independent but never TL PASS. No overlapping edits with blocked #922 or #913.

## Gate and truthful status

`RESEARCH_ONLY / SOURCE_NOT_QUALIFIED / NO_ACCEPTED_EVIDENCE / NO_ACCEPTED_RULE / NO_F8 / NO_HOSTED_IMPORT / NO_PUBLIC_REQUIREMENTS_ACTIVATION`.

A credible official-looking statement, a successful web search or a developer-only synthetic positive parsing test **cannot** promote a source to Official Truth. Owner gates for real evidence/source/retention, real hosted operations, Production runtime and public launch remain reserved. **Live evidence wins.**
