# Viator S2 — review correction R3 — IMMUTABLE TASK AMENDMENT V1
Date: 31 October 2026, Europe/Zurich. Tracking #1079 / #1078 / #1023.

## Authority and exact reviewed baseline
The Product Owner explicitly requested completion of the three existing provider integrations and permits Technical Lead merge after independent acceptance. This is a bounded correction of existing Viator S2, not a new provider or automatic next slice. S1/S2 Task V1 remain immutable.
Reviewed candidate: `814920d022b084e42c490bf2a05dfd00c22c14b8`, tree `3acf8e0aada4a8afe5b66f16d3d20b5f0a5f2748`.
Current accepted main: `b7ebc399b92303eacda9afdaa1786f245492051f`; merge-base `8fc72a18390af1650d6902fb2a20a64e4f7f8ccc`; 22 ahead / 63 behind before this task seed.
Historical exact-head CI 40903974616 and Preview dpl_5RACYihey7athYb4WFRt7a4wzNfC succeeded. They are not acceptance of the corrected/new-main head.
ONE writer: **Jetnity Viator Sandbox Affiliate Foundation 1 — Cursor Generation 1**, original session `bc-803fd88c-9fdc-47f7-acfc-213976e487f6`, originalModelName `grok-4.7-high-fast`. Reuse that session; verify actual run-info/model/name and post PRE-CODE PLAN. If it cannot be reused, STOP before code and do not silently spawn another generation.

## Independent Technical Lead findings — CHANGES REQUIRED
### P2 R3-1: valid provider product identifiers are rejected
Five product-code validators currently accept only `/^[A-Za-z0-9]{2,30}$/`: content.ts, request.ts, affiliate.ts, live-check.ts, schedule.ts under lib/providers/viator/activities.
Official Viator technical API examples include `2855KENNEDY_TKTS` and `2050_PA`, including /products/bulk, not merely an unrelated supplier field.
Source read 31 October 2026: https://docs.viator.com/partner-api/technical/ .
Consequently a valid product can disappear from search or fail detail, calendar, check, or affiliate normalization.
Apply one consistent bounded identifier contract to all actual entry/response paths. Support the verified underscore identifiers; do not generalize to arbitrary paths, encoded delimiters, controls or unbounded opaque text. Preserve the original validated API productUrl unchanged and fixed server host/path ownership. Do not manufacture outbound URLs.
### P2 R3-2: unknown option metadata becomes false option absence
content.ts readOptionCodes currently drops both code and title when a returned option has no usable title. A nonempty all-untitled/malformed productOptions array becomes two empty arrays. ViatorPruefung.tsx then shows “Dieses Angebot hat keine Zusatzoption”; anbinden.ts derives standardProduct=true from the empty normalized code list. A single schedule option does not protect this path.
Preserve explicit truth about present/unknown/invalid option metadata through content normalization, server adapter and UI. Missing/invalid labels must never prove that the product has no additional option. Refuse a live check that cannot resolve a required/known option safely; the visitor may retain a separately validated provider referral. Do not invent a title, option, successful quote or standardProduct assertion from client input. Preserve the genuinely option-free case supported by the provider contract.

These are independent source findings. Neither proves the cause of the earlier hosted destinations failure.

## Scope and main integration
Read AGENTS.md, operating mode, START_HERE, TL standard, current continuity, original S2 task, current main design/quality and affected contracts before editing.
Normally merge current accepted origin/main into this existing branch; no rebase, force push or unrelated edits. Report conflicts and ownership before resolving shared product files.
Writable: original S2-owned lib/providers/viator/activities/** and focused tests; components/trips/ViatorPruefung.tsx and narrowly necessary Viator-specific siblings; own scripts/viator-s2-native-integration/** only if regression evidence needs them; existing S2 PLAN/STATUS/REPORT/HANDOFF/SELF_REVIEW docs. A new shared product-code helper must remain inside the Viator subtree.
All original cross-provider/shared ownership exclusions remain. No shared transport, provider-ops guard, TripWorkspace/route/White-Mint CSS, package/lock/workflows, database/Auth/RLS or global status edits. Preserve the task amendments unchanged.

## Finite acceptance and regression matrix
- Official underscore code survives product content normalization, request construction, schedule parsing, check validation and affiliate redirect normalization; existing alphanumeric IDs still work.
- Invalid path/query/fragment/control/encoded delimiter and excessive length remain rejected before transport; no key/raw provider response/private trip data in output.
- All-untitled options, malformed options and mixed valid/invalid labels retain truthful option state. No false “no additional option” message; no transport call when required metadata cannot be safely resolved.
- A usable labelled option still checks with its exact verified code; truly option-free product follows its documented standard path; multi-option schedule ambiguity stays blocked.
- Exercise actual normalizer -> server adapter -> rendered component/guard seams, including client-forged standardProduct and stale selected option. Do not add tests that merely repeat the new predicate.
- Run focused tests, typecheck, lint/build as required by existing quality gates, and native exact-head App/Auth CI. Relevant actual component browser regression uses current app stylesheet stack and local harmless fixtures only. Report root-font enlargement separately from actual browser zoom.
- Preserve prior successful logging-isolation and environment-denial tests, V1/manual/GYG behavior, noindex, <=3600s content cache and uncached live checks.

## Current live gates and precise boundaries
The original full-access affiliate account permission already exists; no additional generic certification/design inquiry or repeat CLI login.
The 29 October Work run made one explicit search, failed on its first destinations request, then switched both branch flags OFF and rebuilt. The failure remains unclassified.
The independently approved next witness in #1079 comment6502110334 is **one deliberate synthetic guest search**, not a guarantee of exactly one upstream HTTP request. Comment6502554602 records that it has not yet occurred. TL alone may conduct it after fresh effective Preview/Dev isolation and legitimate protected access are demonstrated; this coding task does NOT delegate live calls.
Current metadata-only Vercel readback confirms VIATOR_SANDBOX_CALLS=false and JETNITY_ACTIVITY_AKTIV=false, exact branch scope; sensitive key not read. These are existing false values, not absent flags. Existing scoped Dev pair authorization is documented in #968/#1079 and must not be described as missing.
Do not activate flags, read/write secrets, rebuild/promote with changed environment, invoke real provider APIs, change destination cache/transport limits from a guessed root cause, add data/storage infrastructure, touch DNS, bypass protection or change Production guards.
Production remains hard OFF until the separate functional/runtime gate is reviewed. Do not claim that this merge or a flag alone would make live offers visible on jetnity.com. Preserve the monthly USD100 cap.

## Delivery and STOP
Correct stale task-owned current-status prose while retaining dated historical evidence. Clearly separate this source correction from the unused approved diagnostic witness and unresolved production delivery.
Return true session/model/name, exact head/tree/current main/merge-base/ahead-behind, changed files and finite test evidence. Re-fetch origin/main before handoff. Record current CI/Preview URLs and actual state; pending is not PASS.
Keep PR Draft. **Do not mark Ready. Do not merge. Do not start a follow-up slice. STOP for independent Technical Lead review.**
