# Jetnity Research Engine V1.1 — Search Bridge 1 / Binding immutable TASK

**Date:** 2026-10-15, Europe/Zurich  
**Issue:** [#952](https://github.com/Jetnity/jetnity/issues/952)  
**Author:** **Jetnity Research Engine V1 Search Bridge 1 — Codex Generation 1** (new logical writer; session not yet dispatched or known).  
**Branch:** `feat/research-engine-v1-search-bridge-1`  
**Draft PR:** TL seeds from this TASK; actual PR number is in the live GitHub issue/PR (not inferred).  
**Base:** `main@9847b2c9e1bf9840c5557a71663a0f56c8b9d50c`, tree `d66a33a0f50539e9d0b40dba9ae9e88c2b919a2b`.  
**Mode:** `NORMAL`. **Starting status:** TASK_ONLY / NO MATERIAL CODE / AUTHOR NOT STARTED.  
**This TASK blob is IMMUTABLE** after creation; the agent must neither amend nor copy/recreate it.

## 1. Product-facing reason and intended incremental result

The Product Owner requires **Jetnity's own autonomous Research Engine**, with verified first-party Official Truth storage and optional replaceable OpenAI/Hugging Face analysis; no model-alone authority. The immediately prior [#948/#949](https://github.com/Jetnity/jetnity/pull/949) V1 offline source-discovery coordinator is **MERGED, source reviewed, new main CI6859/6859 SUCCESS and current Production deployed**. It already derives canonical missing/stale requests, bounded non-personal site-scoped query intents, receives injected fake `{sourceId,url}` pairs, validates complete content-identity graphs and canonical allowed source URLs. **It does NOT perform a Web search.**

The next user-relevant missing step is the safe handoff from this already-existing query plan into a **provider-neutral result intake**. **Deliver one working end-to-end mocked search-return bridge** that reuses V1 and remains OFF in all actual runtime entry points; NOT another new source-registry, travel rule, website button, AI model, Visa database or provider activation.

**Required path** (strict, deterministic, no external network):

`canonical gap + code-owned official registry fixture → existing discoverOfficialTruthSourcesOffline(candidates:[]) → ≤6 prevalidated nonpersonal query intents → injected fake SearchHitPort responses (untrusted URLs) → bounded normalization without authority from snippets/ranks/sourceId → existing discoverOfficialTruthSourcesOffline(candidates:[{sourceId,url}]) revalidates exact same canonical envelope → candidate_only URL proposals / honest gap or blocked.`

The resulting status MUST include `officialResult: 'unknown'`, `sourceQualified: false` until a completely separate later trusted governmental document retrieval/review. A found URL is neither Government publisher proof nor legal right to reuse, nor visa rule. Never treat two agreeing search engines/models as independent official support.

## 2. Canonical modules to reuse READ-ONLY (no duplicate implementation)

Read live, with existing tests:
- `lib/readiness/official-truth-source-discovery-v1/coordinator.ts` (`discoverOfficialTruthSourcesOffline`)
- `lib/readiness/official-truth-source-discovery-v1/query-intents.ts` (`discoveryQueryIntents`)
- `lib/readiness/official-truth-coverage.ts`, `official-truth-research-request.ts`, `official-truth-research-execution-plan.ts`, `official-truth-research-source-routing.ts`
- `lib/readiness/official-truth-discovered-url-candidates.ts`
- `lib/readiness/official-truth-content-identity.ts`, `source-registry.ts`, `source-router.ts`
- `lib/readiness/official-truth-source-catalog-server.ts`, `official-truth-server-held-source-registry.ts`, `official-truth-server-owned-retrieval.ts`, `official-truth-ch-de-application-pilot-1/evaluate-server.ts` as existing **server-held authority boundary**; do not create a second authority path, invoke catalog/RPC, or import/call any private live helper in this offline slice.
- `lib/readiness/trip-official-evaluations-server.ts`, `lib/readiness/provider.ts` still Production provider `null`; do not modify or pretend user-visible research is live.

If existing V1 APIs cannot be composed safely without changing one canonical implementation file, **STOP** with a narrow amendment request and exact reproducer. Do not weaken identity import guard, allowlist, trackers, source-class checks or package version safety to get green.

## 3. Deliverables

**D1. Pure deterministic port and output:** Under new namespace `lib/readiness/official-truth-source-discovery-v1/search-bridge-1/`, implement a small provider-neutral interface for one injection-only async search transport taking one canonical, already produced `DiscoveryQueryIntent` at a time and returning a bounded untrusted result array. The fake transport MUST be provided only by tests; default runtime **NO configured transport and NO network**. No global mutable provider configuration, env API key access or automatic import-time side effects. The implementation must not call `fetch`, `http`, DNS, search SDK, model, browser, DB, RLS, provider control plane or external service. Test error paths, abort and pending promises.

**D2. Budget/identity/data safety:** At most the V1 six query intents; at most 16 proposed canonical result pairs per whole operation; no silent truncation of over-budget hits, redirects, HTTP, arbitrary host fetch, snippet processing, result score trusting, model/user `sourceId` or speculative government domain classification. The matching official `sourceId` MUST come exclusively from the previously validated V1 query intent. A URL that disagrees with the registered exact source, DNS/host, content-identity representation or travel-cell must be rejected by the existing V1 checker, not by a looser substitute. Multi-query duplicate/conflict handling must be deterministic. Fail safe without echoing rejected snippets/URLs or personally identifiable query content. Stable sorting/order and bounded return values, even on provider errors/429/timeout. Use a caller-provided AbortSignal and finite mocked deterministic deadlines; do not leave timers/resources dangling. Reject unsafe injected functions, accessors/proxies in provider results/metadata and unexpected shapes where possible.

**D3. Honest classification:** no query when V1 says `current` or invalid/blocked; if no registered `official_authority`, return an honest `no_eligible_official_source` and note the source needs **independent authority registration**. Unknown hosts found in mocked search data may be represented only as **quarantined non-executable leads** if necessary, never inserted into registry or passed as qualified source. `sourceQualified=false`, `officialResult='unknown'`, no `visa_not_required` or positive official conclusion under every case. If no source is registered for Vietnam, the synthetic CH→VN scenario must be an honest gap rather than an invented Vietnamese official source.

**D4. One complete realistic synthetic acceptance:** Test CH citizenship, a genuinely linked CH ordinary passport (scenario-only for subtype), VN travel, tourism and 21 days (scenario notes NOT enforceable as legal scope in current canonical model). With **pre-registered synthetic authority fixture** demonstrate fixed search intents → fake URL results → canonical V1 validation → unqualified candidate_only, and separate unknown-host/empty-registry case yields gap/quarantine, not accepted rule. No real Vietnam visa outcome, no real government HTTP call or reuse/right assertion.

**D5. Nonactive feature contract and next activation packet:** One concise report shall give the exact **future** server-only activation boundary: first-party source registry loaded under existing server-held catalog, selected and approved specific search provider, reviewed terms/privacy/retention, non-personal query payloads only, explicit monthly dollar cap and kill switch, allowed official-source GET and evidence/Rule Review separate, no search snippet/content retention as first-party visa rules. Highlight that the current installed Production `requirementsProviderAus()` still returns null. Cover how unknown authority host would require independent primary-source vetting and source registry registration, with NO fake shortcuts. Do not expose a live endpoint, configure a provider or ask this task to invoke Supabase.

**D6. Technology options are only READ-ONLY research:** Brave/Tavily/OpenAI web search are *candidates*, not contracted providers or adopted terms. As of 15 October 2026 Brave publicly lists $5/1k searches plus $5 monthly credits, but [Brave Search API Terms](https://api-dashboard.search.brave.com/documentation/resources/terms-of-service) prohibit a permanent Search Results database; its privacy notice states registration needs payment information, search queries can be kept for up to 90 days. [Tavily pricing](https://www.tavily.com/pricing) states 1,000 introductory API credits/month, rights/retention/cost still need final check. [OpenAI web_search](https://developers.openai.com/api/docs/guides/tools-web-search) in Responses API is optional and independently billed per [pricing](https://developers.openai.com/api/docs/pricing), not automatic from ChatGPT. Google Custom Search JSON API not newly available per [Google docs](https://developers.google.com/custom-search/v1/overview). Never send email, sign up, enter payment details, obtain API token or make any real query. If external public docs cannot be accessed under ordinary approved permissions, mark UNKNOWN rather than find an alternate or use secrets.

## 4. Strict file ownership

Permitted WRITES **ONLY**:
- **NEW** modules and tests in `lib/readiness/official-truth-source-discovery-v1/search-bridge-1/**` (one port/coordinator/test family; no duplicate authority registry).
- Optional **NEW** `scripts/official-truth-search-bridge-1-audit.mjs` only for additional offline validation of build/runtime nonactivation, if tests insufficient.
- `docs/JETNITY_RESEARCH_ENGINE_V1_SEARCH_BRIDGE_1_{PLAN,REPORT,SELF_REVIEW,HANDOFF}_2026-10-15.md` for bounded reports.
- Optional **NEW sanitized JSON** `docs/evidence/jetnity-research-engine-v1-search-bridge-1/**` with no raw logs, usernames/home paths/private archive, query PII, secrets or URLs from real private records.
- This Task is created by Technical Lead and **immutable**.
- **Forbidden**: modifications to any existing `lib/readiness` modules/tests or global importer-guard, app pages, API, public UI, `package.json`/lockfile, Next/Sharp/security configs, Source Catalog server, Supabase, SQL, providers, workflows, CI/evidence archiving, GitHub rulesets, Production, secrets or account/traveller/private trip code. If unavoidable, STOP/request scoped TL approval first.

## 5. Adversarial acceptance/gates

T01 V1 `current`/invalid/no-authority states NEVER trigger fake transport; return canonical honest state.
T02 synthetic pre-registered full authority graph + canonical CH→VN scope → V1 bounded intents, deterministic mocked search response, V1 candidate URL status only and **unknown** official conclusion.
T03 registered source mismatch, unauthorized government-looking domain, spoofed .gov, non-HTTPS, credentials/fragment, trackers, duplicate and shadow host → fail closed via existing V1 registry/URL validation; no automatic admission.
T04 malicious responses: accessors/proxies/cyclic JSON-like inputs, snippets prompting execution, personal identifiers/passport numbers, extra fields, pathological lengths, >16 hits, query budget exceeded; must not echo/leak or call network.
T05 injected fake transport unavailability/throw/timeout/abort, concurrent calls with race ordering → bounded deterministic and safe no stale candidates, no detached tasks, no recovery call to another service.
T06 negative zero-registry/only licensed-provider/unknown authority lead → no search-result-as-official and no positive visa rule. No hidden second validation path.
T07 import/runtime tree and tests show **NO** network or DB/secret/Provider call; `requirementsProviderAus()` remains null in Production, no live route exposed.
T08 existing V1 source-discovery/complete content-identity import-guard/allowlist and accepted-Rule boundaries must pass unchanged. All original project CI gates, Auth 55/243, Next16.4.1 Build, Vercel Preview on exact HEAD; do not rerun archived personal logs or treat local PG unavailable as a passing test.

This is deliberately ONE tightly coupled SINGLE_AGENT slice; no parallel writers or overlapping source authority contracts.

## 6. Protected stops and role separation

- [#917](https://github.com/Jetnity/jetnity/issues/917) official sources remain SOURCE_NOT_QUALIFIED; **NO live government GET**, no source registration, no Evidence promotion, no visa answer and no installed provider.
- [#944](https://github.com/Jetnity/jetnity/issues/944) BP1 source request NOT APPROVED. Owner expressly declined BMDS/contact. NO email/form/alternate outreach. No bypass of blocked legal page.
- DEV-PREP-1 first Development migration reported SUCCESS but mandatory readback PLATFORM-SAFETY BLOCKED, second migration NOT ATTEMPTED. No replay, new SELECT, alternate connection/tool, permission changes, Production DB or SQL.
- [#913](https://github.com/Jetnity/jetnity/pull/913) privacy remediation SAFETY-BLOCKED; no raw gz archives/logs, no local private paths, no history rewrite. [#937](https://github.com/Jetnity/jetnity/pull/937) Bern App PAUSED, [#934](https://github.com/Jetnity/jetnity/issues/934) HARD-BLOCKED, #626 reserved.
- P1 Next/Sharp [#950](https://github.com/Jetnity/jetnity/issues/950) patched and live; keep Next/eslint16.4.1 / Sharp0.35.5 with **no package edits**. Other 18 dependency advisories remain tracked. No auth/MFA/RLS sensitive changes, new secrets, payments, provider commitments, paid API calls, costs >USD100/month, public launch/indexing or broad Codex Full Access. Production noindex/nofollow unchanged. The temporary **Codex Full Access** from prior P1 was task-only and must be restored by Owner to `Für mich genehmigen`; do not rely on it for this writer. Any inability to clone/npm via normal bounded access must STOP and be reported, not solved by stealth privilege escalation.
- The **first actual external Web search** is a future **separate Product-Owner gate** requiring specific service, terms, data privacy/retention and cost/quota limits, exact host/query budget, revoke/kill switch, and no search results permanently stored or transformed to Official Truth. No broad preapproval arises from user's project direction.

## 7. Workflow/Author Handoff/STOP
Author **Jetnity Research Engine V1 Search Bridge 1 — Codex Generation 1** on fresh isolated branch `feat/research-engine-v1-search-bridge-1`; commit/push only that branch to existing Draft. The new agent may **not** mark Ready, merge, deploy, start a follow-up, register providers, create billing accounts or run any real source/search request. Read `JETNITY_START_HERE.md`, `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`, `docs/ACTIVE_WORK_STATUS.md`, `.jetnity/operating-mode.json`, newest #751 and relevant #748 FIRST; check exact latest main/Task/blob and read original contracts. Plan → implement within allowlist → focused synthetic tests → original unchanged project tests/gates → private sanitized evidence → self-review → commit/push Draft → exact SHA/tree/parent/blob and actual CI/Auth/Preview → written PR author handoff and STOP. If missing an authority contract, do not invent one or weaken a trust boundary; STOP/request exact TL amendment.

**TL independently verifies exact HEAD and original CI/Auth/Preview before Ready/Merge. This does not launch or enable a search service.**

**STOP — SEARCH_BRIDGE_1 AWAITING CODEX AUTHOR.**
