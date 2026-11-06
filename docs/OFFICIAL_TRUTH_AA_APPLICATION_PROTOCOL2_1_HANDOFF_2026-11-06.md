# AA Application Protocol 2 Integration 1 — author handoff

Date: 6 November 2026. Status: **IMPLEMENTED LOCALLY / DRAFT / INDEPENDENT REVIEW AND FULL CI PENDING**.
Issue #1144; Draft PR #1145; parent function #917.
Binding task: [versioned scope](OFFICIAL_TRUTH_AA_APPLICATION_PROTOCOL2_1_TASK_2026-11-06.md).

## Identity and ownership

- Author: **Jetnity AA Application Protocol 2 Integration 1 — Codex Generation 1**.
- Actual session: `/root/aa_application_protocol2_writer`; inherited root model, no separately observed external agent UI.
- Branch: `feat/official-truth-aa-application-protocol2-1-20261106`.
- Base main: `364fb378b965b953e0a50cab6fbc6b5f8a5f4fe9`; task seed: `7f8af9d542b1167ae59a891100809eb1578ec0f4`.
- This file describes the author candidate. Root must bind the published implementation head, independent verdict, CI and deployments in the PR receipt. Seed CI is not implementation CI.
- One writer. No Ready, merge, remote mutation, Cursor dispatch or follow-up slice by the author.

## Implemented

The existing budget module now selects between its unchanged Bern tuple and one exact AA tuple. All item, representation, version, current, exact URL, MIME and compiled-profile object-identity checks remain. V2 permission uses the selected tuple's request URL. The actual production registry still contains no AA profile, so the new AA tuple cannot grant a live 128-KiB allowance.

The existing application evaluator derives the canonical protocol from the complete UTF-8 body, rejects a contradictory/missing marker, requires exact permission and zero redirects for V2, verifies the existing bound V2 hash, and preserves the marker in extractor input. Legacy V1 omits the marker. The canonical downstream Evidence/Review/Rule/extractor implementations are unchanged.

The existing synthetic fixture compiles those actual modules with one shared, isolated profile/budget instance. It uses a test-only current copy supplied by the test file; the dormant candidate and production registry are never mutated. Extract and consume use the same private execution-witness instance. No successful packet, accepted Rule or requirement is fabricated by a stub. The outer retrieval, catalog, authority and trip ports are synthetic, so the test does not establish real HTTP custody or real legal applicability.

## Owned changed files

- `lib/readiness/official-truth-ch-de-source-budget-128k-1.ts`
- `lib/readiness/official-truth-ch-de-application-pilot-1/evaluate-server.ts`
- `lib/readiness/official-truth-ch-de-application-pilot-1/application.test.ts`
- `scripts/official-truth-ch-de-application-pilot-1/fixtures.ts`
- This handoff and concise scoped architecture, roadmap and decision notes.

## Validation actually performed

Local runtime: Node **24.22.1**, TypeScript **5.9.3**, tsx **4.20.5**, parse5 **8.0.0**. Test dependencies and their transitive versions were selected from the unchanged repository lockfile in a separate scratch tools directory. This was not a full repository npm-ci/build validation; release CI uses Node22.

Command from repository root:

```sh
node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/readiness/official-truth-ch-de-application-pilot-1/application.test.ts
```

**54 tests passed, zero failed/skipped.** This includes the existing V1 path; explicit undefined/1/2 V1-marker rejection; complete synthetic 93,365-byte and inclusive 131,072-byte V2 success through canonical acceptance; protocol/hash/identity/URL/MIME/redirect/UTF-8 overflow negatives; grant/authority/catalog/trip withdrawal after successful extraction; cancellation; cloned/missing/noncurrent profile rejection; and the actual unchanged injected-catalog transport's 64-KiB rejection.

Existing fingerprint tests: **5/5 passed**. An additional existing cancellation-suite attempt in the partial local source tree executed **12 cancellation cases successfully**, but two trip-readback cases could not load missing unmodified trip support modules. An earlier attempt lacked the unmodified database/trip files as well. These are incomplete local runs, not a full cancellation PASS. Full checkout CI must execute all cases.

Full repository npm ci, typecheck, lint, hygiene, architecture/isolation guards, complete suite and production build have **not** been claimed locally. They remain exact-head CI gates, together with independent review and Vercel Preview. Repository-wide guards were not weakened or made to pass by inventing missing app directories.

## Security, data and cost boundaries

No database, Supabase, Auth/session, RLS, role, migration, secret, real government request, source admission, ApplicationContract/extractor registration, provider activation, UI or dependency change. AA remains unregistered/current=false; generic transport remains64 KiB; Bern remains rejected by the application pilot. Pilot availability/enabled and the real contract/extractor registries are unchanged. No new recurring cost.

The held #1131 native response-framing/completeness code was not copied, changed or rebuilt. This work does not satisfy its separate gate. The denied #917 database readback was not retried or replaced. Stage1 retains APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING; Stage2 remains NOT_ATTEMPTED. #1142's already completed offline authority correction was not rebuilt.

## Findings, risks and next actor

- P0: none identified in this bounded author review; not a Technical-Lead PASS.
- P1 for live function remains: effective hosted owner/session correction and target-state proof (#1139), Preview/Production database isolation (#968), and protected response-completeness prerequisite (#1131).
- P2 implementation risks addressed by focused tests: protocol downgrade, source-budget widening, test-profile authority leakage, inconsistent canonical hashes and stale positive after final rechecks. Independent review must challenge these findings.
- P3: existing whole-repository lint/dependency residuals are not reclassified by this partial local run; exact-head CI compares them with baseline.

**Next actor: root Technical Lead.** Publish the supplied candidate, inspect the full exact-head diff and open threads, execute full CI/Preview and independent review. Author stops and stays available in the same session for immediate review fixes. Only root may Ready/merge and verify actual main/Production afterward. This handoff is not completion of the database or the overall entry function.
