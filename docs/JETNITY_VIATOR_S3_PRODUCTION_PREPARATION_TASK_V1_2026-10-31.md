# Viator S3 — native referral and Production source preparation

**IMMUTABLE TASK V1**, 31 October 2026, Europe/Zurich. Adopted by Technical Lead for the existing requested provider completion. **Source-only preparation; no real runtime authorization.**

## 1. Authority, baseline and one writer

The Owner wants the three requested provider functions finished and will inspect jetnity.com after a responsible TL merge. This task makes the remaining Viator source work concrete; do not request the general integration decision again. This version is TL-adopted and published before dispatch. Existing immutable S1/S2/R3–R5 tasks remain historical evidence, not editable instructions.

Repository Jetnity/jetnity; existing Draft PR #1079; existing branch `feat/viator-sandbox-affiliate-foundation-1`; parent #1078 / #1023. Prepared against head `4d9da4816bd09815d6a401858d77bdf8503c6af3`, tree `adc7b0631dd7b1fdc84e8312cd3563a1a1a0d3c6`, main/merge-base `b7ebc399b92303eacda9afdaa1786f245492051f`, 30 ahead / 0 behind. Refresh these facts before code; changed source invalidates prior exact-head gates.

**Two-step continuation:** first attest the original session/model, exact newly published task blob/head and PRE-CODE PLAN; STOP without product edits. Root then explicitly authorizes the bounded implementation. Planning acceptance is not TL source PASS.

**Multi-agent decision: SINGLE_AGENT for this Viator slice.** CMP #1096 and the separately prepared widget-host slice have disjoint ownership. No worktree shared with those authors, no edits to their files. Read-only review may run in parallel; Root alone integrates and merges.

Reuse only **Jetnity Viator Sandbox Affiliate Foundation 1 — Cursor Generation 1**, session `bc-803fd88c-9fdc-47f7-acfc-213976e487f6`, actual model `grok-4.7-high-fast`. Re-read run-info/name/model; post PRE-CODE PLAN with exact head/tree/base and files. No replacement writer, new branch or duplicate PR. If that session cannot resume, report the concrete failure.

Read START_HERE, the Technical Lead/Cursor operating standard, current handoff/checkpoint, operating mode, AGENTS and relevant architecture/design/quality/continuity instructions before code. Preserve unrelated changes. Same-session CHANGES REQUIRED corrections require a new independent exact-head review. Cursor never marks Ready or merges.

## 2. Existing decisions and limits

- [#1023 V5](https://github.com/Jetnity/jetnity/issues/1023): genuine pictures/product offers, honest location and price semantics, specific-product referral; onsite checks are not a mandatory step merely to follow a permitted referral. Country inspiration is a separately labelled product scope, not a guessed city.
- [Account reply6468170303](https://github.com/Jetnity/jetnity/issues/1023#issuecomment-6468170303): P00328015 Full Access Affiliate needs no additional certification/design/endpoint-plan approval. Sandbox and Production account access were reported enabled. Do not repeat that inquiry. Non-transactional endpoints only; original URL unchanged; product cache <=3600 seconds; no invented checkout date/pax/CHF transfer.
- #1023 V2 already records a TL-read public partner agreement and Work-reported account agreement identity. Specific content/image/full-information applicability remains unverified; neither a boolean nor API access establishes those rights. Reuse the recorded evidence before requesting anything further.
- [General Sandbox authority6495345628](https://github.com/Jetnity/jetnity/pull/1079#issuecomment-6495345628) and [bounded setup approval6497338357](https://github.com/Jetnity/jetnity/issues/968#issuecomment-6497338357) exist. The later [R5 one-shot6546803145](https://github.com/Jetnity/jetnity/issues/968#issuecomment-6546803145) is consumed. This source task authorizes **zero real provider calls** and no environment writes; it creates no residual call allowance or mandatory magic approval phrase.
- Current Sandbox Preview flags remain false. Public Production remains OFF. The task expands the source-only Production preparation boundary of S2; it does not authorize deploying credentials, activating either environment, signing terms, paid operations or public release.

## 3. Actual remaining source gaps and proven reuse

`lib/activities/zustand.ts` currently delegates to shared `providerOpsZustand`, which hard-blocks Production. `viatorSandboxZugang` independently admits only exact Preview/Development. `request.ts` builds every URL from the fixed Sandbox origin and ignores an origin override. A merge alone cannot enable Viator on jetnity.com.

Search, selected-product detail/calendar and explicit date/option/age-band availability checks already exist. Preserve those working seams instead of rebuilding them. `activityOptionAusViatorProdukt` currently sets locationName/punkt to null; search cards discard the affiliate link; only the detail response exposes it. Images already load automatically from the allowlisted CDN; the two hard-false rights metadata fields are not display guards.

Global protection inventory on this exact source:

| Existing source | Proven capability | Not established |
| --- | --- | --- |
| `lib/server/providers/core` executor `rateLimit.preflight` | Receives providerId/operationId/attempt before each HTTP attempt; throws/malformed/denied results fail closed | No persistent/global reservation implementation supplied by the executor |
| `lib/provider-ops/persistent-cost-guard.ts` | Strict server-only adapter, HMAC caller pseudonymization, injected `ProviderOpsPersistentCostGuardPort.reservieren` | No non-test caller or concrete persistence-port implementation found in app/lib/scripts |
| `lib/activities/rate-limit.ts` | Existing local window/day guard, reused by Viator routes | Process-local, not a global money/quota cap |
| `20260901020000_provider_cost_guard_s6a.sql` | Repository reservation contract, serialized global check, default-off gate, no seeded active policy, NOLOGIN writer capability | No runtime/login principal or application connection; service_role has no EXECUTE grant |

The dated S6-A closure reports Production unapplied on 1 September; that is **historical**, not a fresh DB assertion. No reusable live global adapter is proved. Do not fabricate one, use service_role as a shortcut, apply the migration, allocate a role/HMAC secret, buy Redis or create a new generic guard framework. The reusable pieces are the existing executor hook and strict injected adapter only.

## 4. Finite implementation outcome

### A. Separate Viator Production binding; default source OFF

Prepare a separately typed server-only Production binding for the existing Viator client. It must distinguish Production from the Sandbox binding, require a separate Production credential reference and required per-attempt guard, and select only the fixed official Production origin. Keep the current Sandbox guard/key/host behavior intact; never silently reuse a Sandbox key in Production or infer an environment from a missing/unknown value.

Use one provider-specific request/parser/executor implementation where practical; preserve the existing Sandbox entrypoints as compatible wrappers. No arbitrary origin/URL option, second fetch/retry stack or generic multi-provider architecture. Keep one HTTP attempt, existing 12-second transport timeout, 2,097,152-byte destinations cap and 1,048,576-byte caps for the other four operations.

The actual runtime Production resolver remains behind an explicit **false source gate** and returns unavailable without constructing network transport. No environment variable can override that source gate in this delivery. Only internal injected tests may exercise a synthetic enabled binding; no URL/query/localStorage/public-env fixture switch. A later TL-reviewed release change and actual verified binding are needed to activate.

Adapt only the Activities/Viator-specific state/factory seams needed for this future binding. Do not change the shared provider-ops Production OFF behavior or enable another domain. Apply the same Viator activity activation decision to search, destinations, detail, schedule and check, including direct route invocation and a reused client after disable. No cache hit or warm client may bypass shutdown.

### B. Require existing pre-attempt protection; do not invent its runtime

Connect the required Production guard through the shared executor's existing preflight hook for every real HTTP attempt, including a cold destinations lookup and the detail/calendar rereads inside an availability check. The same guard must cover both body-budget executors. Guard denial, exception, missing binding or malformed result means zero provider HTTP for that attempt and an honest unavailable/rate-limited outcome.

Reuse `ProviderOpsCostGuard` / `ProviderOpsPersistentCostGuardPort` types where they fit, with a narrow Viator adapter for the executor outcome. Caller identity comes only from the reviewed server context, never an arbitrary client field; it must not be forwarded to Viator or published. Keep the current local limiter as additional request protection. No claimed global guarantee from a Map, process singleton or injected test double.

The real Production binding must stay absent/closed because the source inventory has no deployed reservation adapter. Deliver its exact required interface/configuration and the missing operational dependency in the handoff. Do not conceal the gap behind an allow-all function, pretend that the SQL file is applied, or select a privileged database client. Finish the independent source work despite that explicit runtime limitation.

### C. Truthful native cards and permitted referral

Use validated product destination references and the already returned destination catalog for a truthful destination label where unambiguous. Keep requested trip destination, product destination and pickup/departure location distinct. No false meeting point, coordinates or day-feasibility claim. Unknown/conflicting references remain unknown; do not add locations/bulk just to fill a label.

Allow a specific-product referral from a trusted server-normalized search result without forcing detail/calendar/current-price calls solely to reveal its URL. Preserve the returned productUrl byte-for-byte after host/HTTPS/credential validation; bind it to the returned product record. Do not construct/repair affiliate parameters or invent product identity from URL patterns. Mark the referral appropriately as sponsored and do not claim commission verification. Keep any new link field out of guest/account commercial adoption; fixtures/browser-injected metadata must not mint trusted referrals.

Record which documented attribution evidence for P00328015 is available and which actual returned-link check is still pending. A safe host alone is not proof of partner attribution; do not label it as such. If an account-specific format cannot be established from existing evidence/current official documentation, preserve unknown/referral-unavailable semantics instead of guessing or sending an inquiry.

Preserve honest from-price/currency/duration/rating/source labels, explicit search, stale-result invalidation, and selected-product details/checks as optional deeper actions. Booking/payment remain external. Keep existing noindex/no-store protection and no raw provider response/client secret exposure. Images/content rights remain unverified until documentary review; do not change false metadata into a rights claim or introduce a generic consent system. Runtime Production OFF prevents this draft from publishing provider content.

Country inspiration remains explicitly outside this finite city/stage preparation. Preserve the canonical-country rejection; never make a country pass by selecting its capital/same-name city. Keep the broader #1023 country requirement visibly OPEN rather than silently claiming the parent complete. No GYG, DiscoverCars or 12Go change.

## 5. Ownership

Permitted: `lib/providers/viator/activities/**`; narrowly necessary `lib/activities/{provider,domain,factory,zustand,client-sicht,anfrage,schema,suche,client-anfrage,suchlebenszyklus,rate-limit}.ts` and focused tests; the existing activities search and Viator detail/schedule/check routes; `AktivitaetenBereich.tsx`, `AktivitaetKarte.tsx`, `ViatorPruefung.tsx` and focused tests; own S3 PLAN/STATUS/HANDOFF/SELF_REVIEW/REPORT and test harness under `scripts/viator-s3-production-preparation/**`.

Read-only: shared provider-ops and server transport, Supabase/DB/Auth/RLS/migrations, commercial proof/adoption writers, TripWorkspace/global navigation, other providers, packages/workflows, environment configuration and shared status/architecture documents. Proposed shared-doc changes belong in own S3 notes for TL integration. If a genuinely required source edit exceeds this allowlist, provide the exact small patch proposal; continue independent allowed work.

## 6. Required meaningful verification — offline only

1. Actual process-path Production OFF with apparently configured flags/keys still yields zero transport for all five operations; missing/unknown environments, disabled activity, missing guard/key and cross-environment bindings fail closed. Other provider domains stay Production OFF.
2. Injected enabled Production binding selects only `https://api.viator.com`; Sandbox selects only `https://api.sandbox.viator.com`. User-supplied origins cannot redirect either. No real credential or network request; test runner blocks global fetch except injected local fixtures.
3. Required global preflight occurs before every attempted operation, on both executors; denial/throw/malformed response prevents HTTP; no retry/fallback. Exercise cold search (destinations + search), selected detail/calendar, and check's bounded detail + schedule + check chain.
4. Endpoint contracts: search start1/count5/supported display currency/de-DE; destinations en-US; selected product-code validation including underscores; schedule is a hint; check requires server-validated product/option/date/age-band/start-time/currency. Preserve existing invalid-option, ambiguity, currency and stale-response checks.
5. Preserve R5 byte boundaries/cancellation and the unchanged four-operation default cap. Reuse existing tests; add only cases required by the new binding/guard paths. Timeout/429/401/403/malformed failures remain safe, with no raw key/body/log leakage.
6. City destination label vs product destination/unknown pickup; exact original product URL; unsafe URLs rejected; no manufactured affiliate parameters or fixture/browser-derived trusted link; adoption does not retain new commercial-link authority.
7. Actual existing components with local harmless fixture images: search → cards → optional detail/check, direct referral causes no eager detail/calendar fetch, trip/day changes clear stale cards/details/quotes. Relevant 320/390/768/1440 and keyboard/text-reflow checks; label browser-zoom/real-device limits honestly.
8. Typecheck, lint, targeted tests, build and normal native App/Auth CI on the delivered head. Do not claim hosted/provider success from fixtures or skip required checks silently. No extra broad test runs without a concrete remaining risk.

Before any handoff, refresh main/merge-base/ahead-behind and the actual branch head. A changed head invalidates all prior exact-head review, native CI and Preview conclusions; do not cite R5 gates as covering S3. Remain Draft and stop while Root independently checks source, tests, native App/Auth CI, matching Preview and review threads.

## 7. Delivery and remaining real-world gates

Deliver actual head/tree/base/ahead-behind, exact changed paths, PLAN and independent-readable test evidence, configuration names (no values), and a short blocked-runtime inventory. Report **source preparation complete / runtime activation blocked** if the finite source requirements pass; never call the provider integration Production-ready merely because it builds.

Separate external/operational facts still needed: accepted content/image/full-information terms as applicable; actual Production credential binding; a verified global reservation runtime with approved policy/principal/budget where required; successful positive-city and selected-product functional evidence; TL-controlled rollout/rollback. Account Full Access/no-extra-certification is already established. Owner visual inspection after merge does not substitute for unimplemented source or absent runtime bindings.

No provider call, secret read/write, environment/deployment change, database read/write, migration, permission alteration, paid service or external message in this author task. No live test is unlocked by the consumed R5 approval. The TL interprets current Owner instructions and authorizes any later concrete operation without inventing a repeated general-approval requirement.

STOP for independent TL review. **Do not mark Ready, merge, activate, start another slice or claim #1023 complete.**
