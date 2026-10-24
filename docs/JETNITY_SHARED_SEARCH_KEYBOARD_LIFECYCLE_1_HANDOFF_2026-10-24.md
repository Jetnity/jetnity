# Jetnity — Shared Search Keyboard Lifecycle 1 — HANDOFF

Date: 24 October 2026
Author: **Jetnity Shared Search Keyboard Lifecycle 1 — Cursor Generation 1**
Session: `bc-f17cfe4a-c64f-420f-980c-59c8d82cb19e`
Link: https://cursor.com/agents/bc-f17cfe4a-c64f-420f-980c-59c8d82cb19e
Model: `grok-4.7-high-fast` (`originalModelName`). Not Auto.
Integration: same session, I1. No new generation.

## Pins

- Integration merge: `b15b2c5386a8b2fa8dc9a96ae789194c921d3de3`
- Integration tree: `fa34cdfab2d99d2b9a0bb44ef6aca8103af8a1ef`
- Merge parents: `bf3d8586dd1d04bd0ae0aca0e6a151eb94611689` then `1b0a9987c1ffcceb2e499d23249cb7a42820be55`
- Evidence head after the merge: `a403741d9a8afb099fd7f77c10ee91538d1e8d18`
- Evidence tree: `06115c00168a4b7bf05c9b67d4200840fa998b95`
- Accepted main: `1b0a9987c1ffcceb2e499d23249cb7a42820be55`
- Accepted main tree: `433b728b88cb3e9629b54b4b3c045d5e058d9e0b`
- Merge-base with that main, after the merge: `1b0a9987c1ffcceb2e499d23249cb7a42820be55`
- Ahead/behind at the evidence head: 12 / 0
- This file is the docs-only delta after the evidence head. Final exact HEAD is the PR comment.
- B TASK blob: `2e1a966a23bbc302bb59bd367740f2425060f445`
- B PLAN blob: `eaf94d90855d4acbf67cdae75e5d683841bee32a`
- Mode: `NORMAL`
- No rebase, cherry-pick, force-push, or update of main.

## Changed files against pinned main

- `components/airports/FlughafenSuche.tsx`
- `components/places/OrtSuche.tsx`
- `docs/JETNITY_SHARED_SEARCH_KEYBOARD_LIFECYCLE_1_HANDOFF_2026-10-24.md`
- `docs/JETNITY_SHARED_SEARCH_KEYBOARD_LIFECYCLE_1_PLAN_2026-10-24.md`
- `docs/JETNITY_SHARED_SEARCH_KEYBOARD_LIFECYCLE_1_REPORT_2026-10-24.md`
- `docs/JETNITY_SHARED_SEARCH_KEYBOARD_LIFECYCLE_1_SELF_REVIEW_2026-10-24.md`
- `docs/JETNITY_SHARED_SEARCH_KEYBOARD_LIFECYCLE_1_STATUS_2026-10-24.md`
- `docs/JETNITY_SHARED_SEARCH_KEYBOARD_LIFECYCLE_1_TASK_V1_2026-10-24.md`
- `docs/evidence/shared-search-keyboard-lifecycle-1/results.json`
- `lib/suche/tastatur.test.ts`
- `lib/suche/tastatur.ts`
- `scripts/shared-search-keyboard-lifecycle-1/harness.tsx`
- `scripts/shared-search-keyboard-lifecycle-1/run.mjs`

The 14 A paths are absent from that diff because they match main.

## Preservation proof

| Item | Blob | Equals |
| --- | --- | --- |
| MobilitaetBereich | `105c8a2a9a4d0b5b285395cfbf2951e411a6dc23` | main `1b0a9987` |
| A TASK | `3e5d971be2234c0bd8adf487bd5ac673021bc07e` | main `1b0a9987` |
| A PLAN | `6c4bc177faa1ec12987ad40ca8a0294cebc07de7` | main `1b0a9987` |
| OrtSuche | `ddba2d97116da362ad048cdb57d08e3c0afd33b0` | bf |
| FlughafenSuche | `2f7b01464794cfd2f5bee9cc9aaf4f0138f2d06a` | bf |
| `lib/suche/tastatur.ts` | `3c4953419af69132fe094ee26100fc87cd13bf69` | bf |
| `lib/suche/tastatur.test.ts` | `3d4c3f6b104bece4d30542e2993e052bdcc40538` | bf |
| Suchliste, read-only | `d69781e62dae73acde6590bde03f3533c8388b77` | bf and main |
| B TASK | `2e1a966a23bbc302bb59bd367740f2425060f445` | bf |
| B PLAN | `eaf94d90855d4acbf67cdae75e5d683841bee32a` | bf |

OrtSuche SHA-256 on that blob: `2422356cd58013832874d25fe9eae104e0a30f1be3f47853f1537a36d86033fb`.
FlughafenSuche SHA-256: `a2f3a489e702886fdd0e111bb688421f62325e7ed09d689634e0b26ffa0de355`.
`tastatur.ts` SHA-256: `eec38ae729ce9b8e50bb55e681062dee5f100e6b5390ef23c0d0b8152b7c8394`.
Suchliste SHA-256: `a442e99d5a599de5f1d2f40dfa83cda3863a97e4af340ca1dc79941e4ee6f352`.

All 14 A path blobs were compared to `1b0a9987` and matched. The A harness was not executed.

## Commands and results

- `node scripts/shared-search-keyboard-lifecycle-1/run.mjs`: PASS, 16/16, including `ort/empty-seed/1280`, `ort/fixed-seed/1280`, and `ort/value-clear/1280`. Chrome `148.0.7778.96`. Keyboard and pointer at 1280×800. Touch and keyboard at 390×844. No unexpected requests. No page errors. Regenerated evidence origin `http://127.0.0.1:35229`. Source hashes in that file match the bf production blobs.
- Targeted tests: `node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/suche/*.test.ts lib/airports/auswahl.test.ts lib/places/homepage-natural-route-intent-1.test.ts lib/places/homepage-route-entry-1.test.ts`: 31 pass / 0 fail.
- `npm run lint`: 0 errors, 146 warnings.
- `npm run typecheck`: pass.
- `npm run build`: pass, Next.js 16.4.1.
- Hygiene: operating-mode, API protection, schema reference, dead code, exports, and deps pass. Schema reference still lists pre-existing LOCAL/UNAPPLIED RPCs. Setup passes with the existing missing `.env` warning.
- Full local `npm test` was not re-run. Last observation, on `63aa3480`, was 7045 tests, 7029 pass, 11 fail, 5 skip, from local PostgreSQL / Official Truth proofs. Not repaired and not acceptance. CI on the final head is the full-suite gate.
- No CI or Preview result from `bf3d8586` or earlier is acceptance of the integrated head. The PR comment records the new run after the docs push.

## P0–P3

- P0: none.
- P1: none in this slice.
- P2: an in-range active index can remain when a later response still contains that index and the popup stays open. Empty-seed, fixed-seed, and value-clear passed on the integrated source.
- P3: duplicated pointer/blur handling in the two comboboxes.

## First unfinished step

Independent Technical-Lead exact-head review of the final published head. Do not Ready. Do not merge. Do not start a follow-up.
