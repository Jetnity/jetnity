# Trip Workspace Manual Flight Route Completion 1 — Report

Date: 5 October 2026
Issue: #836 · Draft PR: #837
Writer: Jetnity Trip Workspace manual flight route completion 1, Generation 1
Status: **IMPLEMENTED / DRAFT / INDEPENDENT EXACT-HEAD REVIEW REQUIRED**

## Identity and scope

- Execution: Codex Desktop, one writer; no Cursor or replacement/sub-agent writer.
- Model evidence: this Codex session's `turn_context` records `model: gpt-6-astra`, `effort: xhigh`. Session: `01a10975-730b-79d2-8bc0-fb664cf20085`; local rollout basename: `rollout-2026-10-05T02-27-34-01a10975-730b-79d2-8bc0-fb664cf20085.jsonl`. Only these sanitized fields were extracted.
- Branch: `fix/trip-workspace-manual-flight-route-1`.
- Main / merge-base: `58d2781d4b48cfdc8f9131f374f90d9b96a10787`.
- Immutable task seed: `e5ae8e54040c69d38c37e57d740e973982355446`.
- Implementation and test commit: `9fea3e8284d6d291b809ebc5a9deafaafad25d40`.
- The subsequent delivery commit adds only REPORT, HANDOFF and SELF_REVIEW. The PR body and delivery readback identify that final head; no self-referential commit hash is claimed inside these documents.
- Task blob, both seed and current file: `5cd20b05aff41754d62d43c70a269eb4b7cd8c4f`.

B03b only: a manual flight can receive or correct one leg with one to four contiguous air segments. No migration, new API route, provider call, provider/search-flight rewrite, Official Truth change, U02/U03/B01 or follow-up slice.

## Resulting behavior

`FlugBestand` offers **Flugroute ergänzen** when there are no usable airport codes and **Flugroute ändern** for a stored route. Existing IATA/date/time values prefill the editor; missing values are never inferred from title, note, trip or stage. Users explicitly add/remove segments and save/cancel. Booking remains a separate control and saved display still uses `FlugRoute`.

The shared predicate permits only `kind === 'flight'` with null/absent provider, external reference and booking URL. Booking status/source alone does not prohibit editing. Existing multi-leg or greater-than-four-segment routes cannot be silently truncated through this editor.

The strict schema accepts only the six segment fields, normalizes bounded IATA strings by trim/uppercase, requires real dates and optional exact `HH:MM`, and rejects equal endpoints, discontinuities, backwards comparable dates/times and unknown keys. First-departure/last-arrival comparison also preserves the existing item date/time DB constraint when intermediate optional times are absent. No timezone inference was introduced.

## Account and guest trust boundaries

The account action validates before authentication, calls existing `konto()`, reads the exact trip/item under existing RLS and checks manual eligibility. It batches every distinct IATA through the unchanged `flughafenReferenzLesen` path. Every code must resolve before a write. Existing canonicalization constructs the itinerary using only server airport country/city references, without surface evidence.

The UPDATE contains only `metadata`, `starts_on`, `starts_at`, `ends_on`, `ends_at`. It retains unrelated metadata and repeats trip/item/kind/null-provider/null-reference/null-booking-URL guards. A metadata equality guard additionally prevents overwriting concurrent unrelated metadata changes. An absent returned row is failure. DB and transport details are sanitized; revalidation occurs only after a returned successful row. Existing RLS and the DB canonicalization trigger remain unchanged.

Guest validates the same segment contract and requires exactly one target across days and `ohneTag`. Only that target's itinerary and four schedule fields change. Airport codes remain visible while countryCode/city/country are null, with no surface field. Persistence uses the existing graph schema and `gastreiseSpeichern`; its existing revision/timestamp behavior is retained. Siblings and all other target fields remain unchanged.

Existing route facts consume the saved itinerary. Account reference fixtures produce CH origin, QA transit and TH destination; guest produces no country facts. Cyclic/ambiguous routes remain fail-closed under the unchanged chronology engine.

## Validation

Node `22.23.3`; repository dependencies installed from the unchanged lockfile. No real credentials were used for build/browser runs.

| Check | Result |
| --- | --- |
| `git diff --check` | PASS |
| `npm run check:operating-mode` | PASS, NORMAL |
| New manual-flight test file | 36 tests PASS |
| Focused `lib/route/*.test.ts` + `lib/trips/*.test.ts` | 937 tests / 168 suites PASS, including guest and workspace contracts |
| `npm test` | **NOT GREEN locally: 5,246 pass, 4 fail, 5,250 total; 0 skipped** |
| `npm run typecheck` | PASS |
| `npm run lint` | Exit 0; 0 errors, 149 existing warnings; no new warnings in added code |
| `npm run check:api-schutz` | PASS |
| `npm run check:schema-bezug` | PASS |
| `npm run check:dead` | PASS; 0 orphan modules |
| `npm run check:exports` | PASS; 0 uncalled exports |
| `npm run check:deps` | PASS |
| `npm run build` | PASS, including TypeScript and production compilation |

Full-suite failures are the existing disposable PostgreSQL proofs in these unchanged files:

- `lib/readiness/official-truth-catalog-hardening-schema.test.ts`
- `lib/readiness/official-truth-content-identity-schema-v2.test.ts`
- `lib/readiness/official-truth-source-catalog-server.test.ts`
- `lib/readiness/official-truth-store-server.test.ts`

Each fails with `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT` on this macOS host. Their diff against exact baseline is empty. These tests were neither skipped nor weakened; no system PostgreSQL installation or out-of-scope test rewrite was made. Full-suite success therefore still requires the repository's Linux/PostgreSQL validation environment. This report does not turn the local failure into a PASS or claim current-head CI success.

The first typecheck exposed an invalid typed test fixture for a nonstandard booking source; it was corrected. The final typecheck passes. The initial sandboxed build could not create tsx's local IPC socket; the normal approved local build outside that sandbox passed. Build used only a loopback Supabase URL and a dummy public key. The setup warning about absent `.env.local` and existing Browserslist-age warning do not represent configured hosted access.

## Browser proof

The real local Next app, real `GastArbeitsbereich` and localStorage persistence were exercised in an isolated Chrome session launched with agent-browser. Playwright attached to that session for deterministic assertions. No test route or harness was added to runtime. The local fixture contains a day flight, an undated flight and a protected provider flight.

Verified: manual-only affordances; keyboard opening/input focus; invalid submission without write; two-segment entry without autosave; keyboard add to four and remove; explicit save/close; normalized persisted IATA and null country facts; unchanged siblings and other target fields; prefill; Escape/cancel without write; storage-failure input retention; reload/display persistence; independent undated-item save; home navigation; no browser exception or framework error overlay. Booking controls remain outside the route form.

The browser pass found lost focus when removing the fourth segment while Add was still disabled. Focus now returns after the React commit; the repeated browser pass verifies it. Document/body widths matched the viewport at 280, 320, 390, 768 and 1280 pixels. The 390-pixel full-page screenshot was visually inspected. Final empty-itinerary label handling and whitespace cleanup were additionally covered by the subsequent focused tests/typecheck/lint/build.

This is not a hosted account/RLS/browser acceptance proof. Account tests execute the actual action and airport reader with mocked auth/transport, and exercise guards, unknown airports, sanitized errors, absent update rows and concurrent conversion/metadata changes. Existing DB policy/trigger behavior was inspected, not applied or reconfigured.

## Delivery gate

The local HTTPS Git push lacked stored credentials. The connected GitHub Git-data API publishes the same content: implementation tree `704450fc488f0f56868e9a771f789f7709575fec` exactly matches the tested local tree. Commit identities differ because the connector supplies its own commit metadata; the implementation SHA above is the published identity. The branch is advanced with a non-forced fast-forward only.

Startup and pre-delivery rereads confirm exact main, NORMAL mode, #751's two file-disjoint writers, #837 Draft on the assigned branch, and #839 restricted to its own audit task file. #748's newest observed comment is `5985858310`; no newer evidence appeared during the delivery reread. The processed-marker follow-ups concern the separate completed Official Truth hardening and do not change this scope. PR #837 had zero review threads at the pre-delivery read.

No hosted DB/Production mutation, migration apply, provider request, secret change, Ready action or merge was performed. Local development/browser processes were stopped. Next-generated changes to `AGENTS.md` and `next-env.d.ts` were removed; both remain unchanged in the delivery.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.** This implementation report is not independent acceptance and is not merge authority.
