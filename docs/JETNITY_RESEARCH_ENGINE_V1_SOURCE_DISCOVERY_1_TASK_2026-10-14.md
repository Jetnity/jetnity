# Jetnity Research Engine V1 — Source Discovery 1 / Binding TASK

**Date:** 2026-10-14 (Europe/Zurich)  
**Issue:** [#948](https://github.com/Jetnity/jetnity/issues/948)  
**Logical writer:** **Jetnity Research Engine V1 Source Discovery 1 — Codex Generation 1**  
**Session:** not started / not assigned until actual Codex dispatch; never invent a session ID.  
**Branch:** `feat/research-engine-v1-source-discovery-1`  
**Draft PR:** to be created from this TASK-only seed by Technical Lead.  
**Immutable baseline:** `main@10fdee40c3e4fcc7dffb6515dda5acf1db391aed`, tree `e5c899c3a5465fc5dc02b4738184c9cb8eff6bb3`.  
**Operating mode:** `NORMAL`. **Status at seed:** TASK_ONLY / no material code / not reviewed.  
**Parent product objective:** [#917](https://github.com/Jetnity/jetnity/issues/917) first real Official Truth source → Trip Workspace; this task does NOT qualify that source.

## 1. Product intention and precise delivery
The Product Owner confirmed Jetnity must own its **research orchestration, verification and versioned durable Official-Truth knowledge**, with OpenAI a replaceable optional analysis component rather than an indispensable gate. The near-term product acceptance remains missing/stale regulation → authoritative discovery → verified evidence → accepted truth/visible trip. This **first bounded coding slice** delivers only the missing **source-discovery orchestration** so it can be independently tested without accessing real government sites or operating a real search service.

Implement **one actual offline executable compositional path**, not another architecture-only report and **not a competing Truth/Source Registry**:

`canonical coverage(missing/recheck) → existing officialTruthRechercheEntscheiden() → existing officialTruthRechercheAusfuehrungsplan() / Source Router → bounded deterministic non-personal search intents → injected untrusted synthetic candidate hits → existing officialTruthEntdeckteUrlKandidatenPruefen() → candidate_only / quarantined_gap / blocked_invalid result`.

**Every output remains an unqualified research proposal, never an entry rule.** Explicit `officialResult='unknown'`, source qualification FALSE, no `not_required`, no positive visa status. Preserve existing fact kind and canonical scope. A passed URL is ONLY a possible URI bound to a pre-registered official source, not proof of content semantics, legal validity, rights, a verified body or accepted Evidence.

## 2. Canonical existing modules — reuse, do not rewrite
Inspect the exact current implementation and tests of:
- `lib/readiness/official-truth-coverage.ts`
- `lib/readiness/official-truth-research-request.ts` (`officialTruthRechercheEntscheiden`)
- `lib/readiness/official-truth-research-source-routing.ts`
- `lib/readiness/official-truth-research-execution-plan.ts`
- `lib/readiness/official-truth-discovered-url-candidates.ts` (`officialTruthEntdeckteUrlKandidatenPruefen`)
- `lib/readiness/source-registry.ts`, `source-router.ts`, content-identity, `official-truth-server-held-source-registry.ts`, rule scope/evidence contracts, and existing provider OFF.

Existing validation for country/citizenship/doc/fact/source/URI/host/repr and existing domain blocklists wins. **Never invent a second registry/validator, special-case Vietnam, infer a domain is official from .gov/.gov.vn, treat an untrusted search result as registered, or have a model decide trust.** Existing `officialTruthEntdeckteUrlKandidatenPruefen` accepts at most 16 pairs and does not search; do not weaken this bound.

The public/user journey cannot provide an authoritative registry, source IDs or a ready plan. Offline tests may inject a synthetic registry as a fixture; any eventual live entry MUST resolve it server-side via the already existing server-held boundary. If a safe pure composition of current contracts cannot be implemented within allowlist, STOP with a precise blocker rather than introducing a second authority path.

## 3. Required implementation
- **D1 Missing/recheck initiation:** Consume canonical coverage and fact/scope. `current` yields no search; invalid/ambiguous input yields blocked. No personal user/account/Trip/passport numbers, MRZ, DOB, health, secrets, prompt injection, query fragments or arbitrary free text in query plan. Only canonical fact type and country/document *classes* or curated constant search terms may be carried; no untrusted natural language as authority. Do not infer any nationality from issuer/residency.
- **D2 Query intents:** Deterministic, finite (e.g., ≤6) and reproducible query *descriptors/strings* for candidate source discovery using safe canonical country codes/known minimal labels, required fact kind, neutral official-authority terms; no HTTP and no external client. On known registered sources, scope candidate intents to allowed source IDs/domains. On zero eligible registered sources, visibly classify `no_eligible_official_source` (and optionally `requires_independent_source_registration`), **never generate an executable allowlist from search data**. Query plan is not a visa answer. Bounded input, output and stable order.
- **D3 Candidate intake:** Accept only a short bounded synthetic untrusted search-hit array through the offline seam. Translate only the strict pair `{sourceId,url}` that the canonical discovered-URL validator actually accepts. Reject/quarantine bad or unregistered candidates, sources not eligible for that exact cell, licensed providers, extra properties, private/special schemes, credentials, host mismatch, tracking names, duplicates, conflicts, malformed/non-HTTPS, disguised authority, too many inputs. Do not send any such URL to a fetcher. Do not echo rejected URL/PII into public error evidence. Deterministic dedup/results. If design calls for independently reviewed unknown host candidates, mark as **unverified and not fetchable**, without registering them or including them in validated candidates.
- **D4 Orchestration:** One thin pure coordinator exports structured `ready_candidate_urls` or `gap/unqualified` or `blocked_invalid`, with stable `requestKey/ruleScopeKey/factKind` only if already validated, sanitized reason, and only the exact validated URL-candidate objects as potential source-candidate inventory. Failure of source registry, invalid authority, conflicting/partial identity or network-capable dependency fails closed. Do not accept untrusted callers' `approved`, `official`, `now`, `retrievedAt`, `result`, `rank`, `sourceQualified` flags as trusted. No persisting.
- **D5 Demonstration:** Synthetic example CH citizenship, CH ordinary passport, VN tourism 21d using the *real canonical scope constructor* and synthetic coverage. Exercise both a synthetic pre-registered official descriptor with valid/fake domain/URI and a missing-registry scenario. A successful demo shows **URL candidate only**, not Vietnam visa-free or any passport/ETA rule. Use `.example` or well-described fixture sources only where the canonical current validator permits their use; never work around the validator. No actual Internet access to Vietnam or German sites.
- **D6 API boundaries:** A future retrieval/search-provider interface MAY be described as a follow-up contract, but DO NOT implement a new network-capable search client, OpenAI API call, browser, hosted route, scheduled job, service secret, DB RPC/migration, storage, query logging, autonomous rule promotion or UI rendering in this slice. No new Model provider selection/fee. The eventual user-facing product remains gated until a verified live research-and-storage path exists.

## 4. Strict write ownership
Allowed ONLY:
1. **New** namespaced modules and tests under `lib/readiness/official-truth-source-discovery-v1/` (prefer 1 coordinator, 1 query-intent helper, tests as needed, no duplicate truth engine).
2. Optional **new** `scripts/official-truth-source-discovery-v1-audit.mjs` if a finite offline demo adds genuine integration proof beyond tests.
3. `docs/JETNITY_RESEARCH_ENGINE_V1_SOURCE_DISCOVERY_1_{PLAN,REPORT,SELF_REVIEW,HANDOFF}_2026-10-14.md` as needed for concrete implementation/handoff.
4. Optional **sanitized JSON/text ONLY** under `docs/evidence/jetnity-research-engine-v1-source-discovery-1/` (no raw logs, local paths, screenshots, archives, access tokens, private snippets, printed URL search secrets).
5. This TASK is **immutable**; do not edit it.
No existing runtime, tests, scripts, app routes, packages, lockfile, workflows, env, infra, Supabase, privacy history or global governance files may be changed without **separate TL exact-scope authorization**. An existing test import inventory that prevents the slice requires STOP and a narrow requested amendment, not a stealth edit.

## 5. Acceptance tests (material product behavior, not self-attestation)
- T01 canonical `current` → no research, `missing`/stale → bounded intents, scope unchanged, no invented country eligibility.
- T02 genuine canonical CH→VN context fixture; stable non-personal intents, no legal conclusion; exact country/document/fact mismatch rejects.
- T03 valid synthetic registered official source and strict canonical URI/content identity → candidate-only result, no accepted Evidence/Rule.
- T04 no registered official source or only commercial/licensed source → honest gap, not official authority.
- T05 unknown search domain/source, spoofed `.gov` labels, untrusted rank/LLM flags, poisoned snippets/prompt injection, provider, blocked host, credential/fragment, tracking, non-HTTPS and duplicates → quarantine/blocked, no source promotion.
- T06 malformed, oversized and personal/sensitive fields, too many proposals, invalid circular objects/methods/prototype traps and repeated queries → bounded deterministic refusal; no secret/url echo.
- T07 no network during module import/cold start/unit/demo path; no calls into the server retrieval, candidate acceptance, migrations, providers, env/credentials; no invented database state.
- T08 existing canonical request, route, allowlist, URL candidate, Trust / Source Registry and public provider-off regression tests still pass without edits.
- T09 original final gates: typecheck, lint, tests, build, API/schema/dead/exports/deps, operating-mode guard; GitHub Actions actual Verify & Auth exact delivered head, Vercel Preview when it genuinely applies. Previous local missing-native-PG failures are **not** green; no altered limits, tests or rerun trick. Publish only sanitized counts/digests and URLs to GitHub jobs, no new gzip/plaintext raw private logs.

The requirement to use existing contracts may reveal a strict API limitation. In that case, STOP with exact evidence and minimal amendment request rather than implement false success. A staged demonstration with correct `unknown` is better than silently expanding scope.

## 6. Specific protected boundaries (all remain binding)
- **NO BMDS CONTACT:** Owner explicitly declined mailing BMDS. NO email/form/alternate contact. #944/6173981154, #751/6173981794.
- #944/BP1: offline observer accepted; NO `--observe-bp1-once`, actual physical GET, legal-page workaround, or source admission. #917 remains SOURCE_NOT_QUALIFIED, application/source gate false, contracts empty, provider OFF. No real visa fact.
- **DEV-PREP-1:** existing Owner approval remains valid but first Development migration response SUCCESS, actual required readback PLATFORM-SAFETY-BLOCKED, second migration NOT ATTEMPTED. NO replay, resubmission, reworded SELECT, alternate tool/project/connection/permission, SQL execution, delegation, Production DB. No new schema/RLS/Auth/roles/MFA changes.
- #913 SAFETY-BLOCKED privacy, #911 P2 exposure; no raw-local original/gz logs/archives/screenshots, secret, user data, history rewrite, alternate bypass. #937 Bern App PAUSED, #934 Bern live B HARD-BLOCKED, #626 reserved.
- Search/provider keys, contracts or live calls, new recurring expenses (budget ≤ USD100/mo), real paid services, payments, Production activation, domain/indexing/launch all reserved Product-Owner gates. This TASK is not that permission.
- User research autonomy directive applies: model output never trusts itself; owner controls review/kill switch; `unknown != not_required`; missing/stale/conflict fail closed; future safe freshly verified answer is a distinct user-visible state, not the same as persisted Official Truth.

## 7. Author proof, independent review and STOP
Read live mode/main/#751/new relevant #748 before any code; obey standard. **Single writer** **Jetnity Research Engine V1 Source Discovery 1 — Codex Generation 1**. Isolated checkout based on exact PR branch, never mix with paused PRs. Implementation sequence: plan with file inventory → code/tests → private original gate evidence → sanitized REPORT and SELF_REVIEW → commit/push same Draft branch → verify exact HEAD/tree/parent/unchanged TASK blob, diff and honest gates → publish GitHub PR author handoff and STOP. Never publish raw logs or personal file paths.

**Author must NOT mark Ready, merge, deploy, activate source/provider, start additional writers, or start a follow-up slice.** Technical Lead separately reviews each changed file, exact head/merge-base, source/identity/safety behavior, original CI/Auth/Preview, review threads, and updated #748 before any normal Ready/merge decision; no fake Production availability. If approved, integration remains code-only and cannot by itself deliver live automatic research/Official Truth to travellers.

**STOP — RESEARCH_ENGINE_V1_SOURCE_DISCOVERY_1 AWAITING CODEX AUTHOR DELIVERY.**
