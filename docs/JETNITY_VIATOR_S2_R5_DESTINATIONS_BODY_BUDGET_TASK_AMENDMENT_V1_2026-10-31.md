# Viator S2 R5 — destinations-only bounded body budget — Task Amendment V1
Date: 31 October 2026. Owner: ChatGPT / Technical Lead.
Status: authorized OFFLINE implementation and review fix in existing Draft PR #1079. No hosted provider request or activation.

## Authority and exact starting point
- Repository Jetnity/jetnity; branch feat/viator-sandbox-affiliate-foundation-1; PR #1079.
- Operating mode NORMAL read before this dispatch. Owner requested completion of the existing three provider works and permits responsible ordinary TL merges; special gates remain.
- Reviewed source parent: 3902827c59f8114cff75ba5cae3ce459febae97b.
- Parent tree: b67b3116d3e452c2579dfae60556ef878651da3e.
- Main/merge-base: b7ebc399b92303eacda9afdaa1786f245492051f, 28 ahead /0 behind at that source parent.
- This document-only TL seed is a direct child of that parent. Fetch and fast-forward onto the exact seed named in the dispatch; preserve this file and every older task byte-for-byte.
- Same original Cursor-Agent: **Jetnity Viator Sandbox Affiliate Foundation 1 — Cursor Generation 1**.
- Same session bc-803fd88c-9fdc-47f7-acfc-213976e487f6; actual originalModelName grok-4.7-high-fast. Do not invent another generation or replace the session.
- Before source edits: publish real run-info evidence and a separate PRE-CODE PLAN with actual checkout/head/tree/main/merge-base/ahead-behind/task blob. Explain any stale checkout before fast-forward; no rebase/force-push.

## Proven failure and finished rollback
The owner approved the concrete R4 one-shot packet, recorded at:
https://github.com/Jetnity/jetnity/issues/968#issuecomment-6545712735
Actual full evidence:
https://github.com/Jetnity/jetnity/pull/1079#issuecomment-6545868589
Consumed/rollback authority:
https://github.com/Jetnity/jetnity/issues/968#issuecomment-6545868799

Exactly one actual synthetic Japan-country search on frozen3902827c:
- protected ON dpl_FDw3R6euEeMLTXAJTbcn2yKt2oLe;
- request6qv7l-1793462706805-d4c0fdf66083,2026-10-31T16:05:06.805Z;
- one DevplacesGET +one Sandbox GET /partner/destinations;
- upstream200, transport_body /malformed_response /bodyReason=size_limit;
- no retry or downstream product/detail/calendar/check/booking request.

Both existing branchPreviewflags restoredfalse at16:05:23.655/16:05:24.747UTC; other36enventries unchanged. Fresh OFF dpl_98f8RDHYJgeWg6zWPoqVLpxFe2eD READY on3902827c, branchaliasverified. Actual OFF requestnpp58-1793462869765-6f358aa11348 at16:07:49.765UTC: unavailable UI and zero outgoing requests in Middleware and Function. No unfinished rollback.

This proves rejection by the effective1,048,576-byte budget, either announced length or streamed bytes. It does NOT establish exact total size, validJSON/catalog, or that2MiB will suffice. No raw provider response/header/key was retained. Do not claim a hosted functional fix.

## Narrow technical decision
The existing shared core already permits an executor maxBodyBytes up to2,097,152 while its default remains1,048,576. The current Viator client omits this option and uses one executor for all five operations.

Set an explicit **2,097,152-byte (2MiB) budget for destinations only**, using the existing core configuration API. Other four operations must retain their current1MiB default, including after destinations is called on the same client.

Prefer a separate destinations executor with shared unchanged transport policy/configuration, selected only for the built destinations operation. Keep the constant private in the Viator server module. No caller/env-controlled override, generic abstraction, sharedcore edit, or larger budget. If this cannot be accomplished within these paths, STOP and report before widening scope.

This is a bounded compatibility correction inside an existing hard maximum, not a measurement-based promise of live success. Primary provider documentation says /destinations returns the complete catalog and lists no pagination parameter; it does not give a byte maximum:
https://docs.viator.com/partner-api/technical/
The weekly catalog refresh/local persistence guidance remains a separate open integration concern, not an invitation to redesign caching in this task.

## Writable paths — exact
1. lib/providers/viator/activities/sandbox.ts
2. lib/providers/viator/activities/sandbox.test.ts
3. lib/providers/viator/activities/s2.test.ts
4. docs/JETNITY_VIATOR_S2_NATIVE_ACTIVITIES_STATUS_2026-10-28.md
5. docs/JETNITY_VIATOR_S2_NATIVE_ACTIVITIES_HANDOFF_2026-10-28.md
6. docs/JETNITY_VIATOR_S2_NATIVE_ACTIVITIES_REPORT_2026-10-28.md
7. docs/JETNITY_VIATOR_S2_NATIVE_ACTIVITIES_SELF_REVIEW_2026-10-28.md

Only necessary changes in those paths. This task file is READ-ONLY to the agent. Minimal own-document reconciliation; do not rewrite broad central continuity files, unrelated author history, other workstreams or task amendments. The TL maintains central checkpoint/headers.

## Preserve exactly
- Shared lib/server/providers/core/** including bounds, parser, body cancellation, HTTP adapter and parse strategy.
- Provider host, endpoint/method, headers/language, secret handling and response parsing/schema rules.
- Timeout and retry policy: maxAttempts1, all retry switchesfalse; redirectsmanual.
- All OFF/Production/runtime authorization and identity/Dev isolation guards.
- Canonical country/region rejection before products/search; no false same-name city match.
- Public guest messages, seven-field closed safe log contract, forged-value whitelist and throwing-sink isolation.
- Existing cache/TTL, UI, CSS, packages/lockfiles, workflows, database, migrations, RLS/Auth and provider configuration.
- No gzip/header experiment, parse:text bypass, raw-body logging, shell/provider curl, or full-response download.
- Both execution flags remain OFF. Never call provider/API endpoints, retrieve keys or mutate Vercel/Supabase/Production for this task.

## Meaningful offline acceptance tests
Use the real client/transport/parser and synthetic injected streams; no external network.
1. Valid synthetic destinations JSON above1MiB is read and catalog-validated successfully. Include an exact2MiB boundary (UTF-8 byte accounting, not string-length assumptions).
2. At2MiB+1, reject both announced oversize and streamed oversize when Content-Length is absent or falsely small. Observe cancellation, one HTTP call, no retry; preserve safe size_limit failure.
3. The other four operations (search/detail/schedule/check) still reject1MiB+1. Exercise the same client after a successful larger destinations call so the larger budget cannot leak to them.
4. Through the actual service/canonical-country seam, a valid larger catalog with a same-name CITY counterexample still rejects a canonical country and never calls products/search. Exactlyone destinations call; no destination-failure log for successful catalog loading.
5. Adjust existing R4 oversized fixtures to the new destinations budget without weakening the other diagnostic, canary, one-call, logger or public-message assertions. Existing OFF/Production and thrown-sink regressions must remain.
6. Keep tests bounded/deterministic. No sleeps, retries, skipped tests, new tooling, timeout increases or mirrored implementation-only assertions.

Run the focused tests, TypeScript, lint and relevant hygiene/build checks. Native exact-head CI and Vercel Preview must be reported by actual head; old3902827c CI41203662843 is historical after any new commit. Two existing conditional UI audit skips are not new passes. Agent self-review is not TL acceptance.

## Delivery and STOP
- Push only this finite correction to the existing branch/Draft PR.
- Publish actual final head/tree/main/merge-base/ahead/behind, changed paths, test counts/outcomes, native CI id/state and exact Preview id/state.
- State the one-shot was consumed; current flags OFF; live2MiB sufficiency unverified.
- State functional release remains BLOCKED; no Ready/merge/Production activation.
- STOP for independent Technical Lead review. No automatic next slice, no extra provider request, no global cap escalation. Any failure or unanticipated required path: CHANGES REQUIRED / same session, new explicit task if scope changes.
- Only ChatGPT / Technical Lead may Ready or merge after complete independent acceptance. Changed head invalidates earlier exact-head gates.
