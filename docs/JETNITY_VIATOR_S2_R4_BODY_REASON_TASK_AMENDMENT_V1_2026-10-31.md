# Viator S2 — R4 body-reason diagnostic — IMMUTABLE TASK AMENDMENT V1
Date: 31 October 2026, Europe/Zurich. Existing PR #1079 only; no new provider slice.

## Authority, original session, frozen baseline
Owner requests completion of existing Viator/DiscoverCars/12Go for functional visual review and authorizes TL merge after independent acceptance. This immediate finite code correction is authorized; it is NOT a new real Sandbox request or Production activation.
Baseline head f644dbd3a74f17194b112f2011b51faba7ea5a3a, tree2b1fbc76fccc5344e418a78579f322cd5c954e1e; accepted main/merge-baseb7ebc399b92303eacda9afdaa1786f245492051f,26ahead/0behind before seed.
Original genuine Cursor session bc-803fd88c-9fdc-47f7-acfc-213976e487f6; **Jetnity Viator Sandbox Affiliate Foundation 1 — Cursor Generation 1**, originalModelName grok-4.7-high-fast. Real run-info and PRE-CODE PLAN before edits; no replacement writer.
Read project instructions, original immutable task/R3 amendment and this amendment fully; preserve them byte-for-byte.

## Live independent evidence
TL source/native CI41198906310/exact Preview/fresh client+SSR Dev isolation PASS on baseline. Then existing approved one-shot was used exactly once:
- ON protected deployment dpl_Br8avGaPwx31xRDiBe4C5hGBsKb7, samehead.
- 2026-10-31 12:39:57.292UTC, request lql9d-1793450397292-6ada5d7c5d23; one GET Sandbox /partner/destinations plus one Dev places read. UI destinations error; no retry, products/search/detail/calendar/livecheck/booking/Production call.
- Safe log: operation destinations, klasse transport_body, reason transport, transportKind malformed_response, upstream status200.
- STOP. Both exact-branch flagsfalse, other36env entries unchanged. New OFF dpl_CmSbFCagWWnY4X9LAjUhhxf6L4fB READY samehead, branchalias verified. OFF guard request bkkzp-1793450567789-66969e168d4a at12:42:47.789UTC: unavailable UI, zero outgoing requests in both Middleware/Function. noindex retained.
Full controlling receipt #1079/6543514153.
This proves failure in bounded body/JSON transport BEFORE catalog schema parsing. It does NOT distinguish size/empty/content-type/JSON/stream-error. Post-header abort/network can be a stream error. No claim key failure, full auth success, or proven size limit.
The one-shot is consumed. **NO additional real provider request in this assignment.**

## Independently identified source weakness
lib/server/providers/core/parse.ts generates five fixed messages; executor.ts passes them into transport.error.message. Viator activities/sandbox.ts discards that safe discriminator when returning failure. Existing logger can only say transport_body.
Shared core remains READ-ONLY. Fix only loss of safe classification in the provider adapter, not transport behavior or the still-unclassified upstream response.

## Finite implementation and ownership
Writable ONLY:
- lib/providers/viator/activities/sandbox.ts
- lib/providers/viator/activities/anbinden.ts
- existing sandbox.test.ts and s2.test.ts within that same subtree
- existing Viator S2 STATUS/HANDOFF/REPORT/SELF_REVIEW continuity docs, minimal truthful updates.
If a necessary type cannot remain in these existing owned files, propose path/scope to TL before writing it. Everything else read-only, including shared transport/domain/parse/executor, endpoints, headers, bounds, retry, cache, UI, product contracts/codes/options, CSS, package/lock/workflow, shared status, tasks, DB/Auth/RLS/env/protection.

1. In destinations-only failure handling, only when transport kind is malformed_response, exact-match the known fixed transport.error.message strings to CLOSED enum values:
   Provider response exceeded the body size limit. -> size_limit
   Provider response body could not be read. -> body_unreadable
   Provider JSON response was empty. -> empty_json
   Provider response was not JSON. -> non_json_media_type
   Provider response was not valid JSON. -> invalid_json
   Anything else -> unknown.
2. Pass ONLY this enum in an internal failure field to the existing server logger. Never pass/log raw error.message, exceptions, response body, headers, key, URL, location/trip IDs or arbitrary objects. Do not substring-match/preserve dynamic text.
3. Add exactly this closed bodyReason field to the explicit log allowlist/record-builder. Independently validate received enum at the logger boundary; unknown/forged values cannot be logged. Null/not-applicable for non-body failures; preserve old event/operation/class/reason/kind/status semantics, public guest response, stop/no-retry behavior and throwing-sink isolation.
4. Do not change body size limits (current effective1MiB/max configurable2MiB), parsing strategy, accepted MIME/schema, timeout, endpoint, cache or number of calls. No speculative functional fix.

## Finite offline verification
Use synthetic injected HTTP streams through actual client/adapter; NO live network, provider, DB or env access.
Cover announced oversize and streamed oversize without reliable length; throwing stream/synthetic abort; empty/whitespace; non-JSON content-type; invalid JSON; unknown/forged message and enum canaries. Include valid JSON but invalid catalog -> catalog_schema and bodyReason not falsely populated. Preserve valid catalog, prior guards and throwing logger tests.
Assert closed enum, exact permitted log fields, unchanged guest error/status, exactly one injected call/no retries/no subsequent call, and no secret/raw-message/body/header/trip canary anywhere in logs or public result. Do not add giant artifacts or unbounded fuzz/repeated full local suites.
Run focused meaningful tests/typecheck/lint as needed, then push final finite correction. Native full App/Auth CI and exact Preview must be re-gated on new head; author reports state truthfully. No stale baseline green gate reused.

## Delivery and stop
Real session/model/name; exact head/tree/main/merge-base/ahead-behind; minimal diff; finite original test logs; current source/CI/Preview truth. Own docs clearly distinguish baseline real failed witness and verified rollback from this offline diagnostic change. No “root cause fixed” or “hosted Sandbox PASS”.
Draft stays Draft. **Cursor NEVER Ready/merge/activate or start follow-up. STOP for independent TL review.** All provider calls remain stopped pending a separate explicit bounded decision; no new request budget manufactured from this task.
