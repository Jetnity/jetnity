# Jetnity — Shared Search Keyboard Lifecycle 1 — HANDOFF

Date: 24 October 2026
Author: **Jetnity Shared Search Keyboard Lifecycle 1 — Cursor Generation 1**
Session: `bc-f17cfe4a-c64f-420f-980c-59c8d82cb19e`
Link: https://cursor.com/agents/bc-f17cfe4a-c64f-420f-980c-59c8d82cb19e
Model: `grok-4.7-high-fast` (`originalModelName`). Not Auto. UI title rename was supported and returned the logical name above.
Review fix: same session, CHANGES REQUIRED R2. No new generation.

## Pins

- R2 runtime / implementation head: `ddfee63444b739119233376a2f823e7f027f4026`
- R2 runtime tree: `58348a00562871761fcc2210ca01949eb05eaaca`
- Reviewed head this fix replaces: `7611f2ed6575a6a80de75e6f8053e305daf5ddb9`, tree `5b54ee273066b29a9768deb078a76066b189d166`
- Live `origin/main` re-read for this handoff: `1b0a9987c1ffcceb2e499d23249cb7a42820be55`
- Live main tree: `433b728b88cb3e9629b54b4b3c045d5e058d9e0b`
- Merge-base: `e372f4d830c35a74a235d345c2baaf08ab615e6c`
- Ahead/behind at the R2 runtime head: 7 / 5
- This file is the docs-only delta after that runtime head. Final exact HEAD is the PR comment, not a SHA written into this file.
- TASK blob: `2e1a966a23bbc302bb59bd367740f2425060f445` unchanged
- Mode: `NORMAL`
- Main was not synchronized. Lane A and held #985/#982 were not edited.

## Changed files

- `docs/JETNITY_SHARED_SEARCH_KEYBOARD_LIFECYCLE_1_TASK_V1_2026-10-24.md` (seed only, unchanged)
- `docs/JETNITY_SHARED_SEARCH_KEYBOARD_LIFECYCLE_1_PLAN_2026-10-24.md` (plan-before-code, not rewritten)
- `components/places/OrtSuche.tsx` (R2 unchanged-seed correction)
- `components/airports/FlughafenSuche.tsx` (lifecycle, unchanged in R2)
- `lib/suche/tastatur.ts`
- `lib/suche/tastatur.test.ts`
- `scripts/shared-search-keyboard-lifecycle-1/harness.tsx` (fixed seed, no typed-text echo)
- `scripts/shared-search-keyboard-lifecycle-1/run.mjs` (R2 `fixed-seed` case; `empty-seed` kept)
- `docs/evidence/shared-search-keyboard-lifecycle-1/results.json`
- this STATUS, SELF_REVIEW, HANDOFF, and REPORT

`Suchliste.tsx` unchanged. No central `ACTIVE_WORK_STATUS`, `JETNITY_START_HERE`, or handoff edit.

## Tested source hashes

From the harness on the R2 runtime head, rechecked with `sha256sum` and `git hash-object` before the docs commit:

| File | SHA-256 | git blob |
| --- | --- | --- |
| `components/places/OrtSuche.tsx` | `a2dd2b12177b3452ca3502dd653582d5c7e13466b21b786727fe1a9bca37bb21` | `62ef14d272e7516075033ef74beeb9c78fbc8c75` |
| `components/airports/FlughafenSuche.tsx` | `a2f3a489e702886fdd0e111bb688421f62325e7ed09d689634e0b26ffa0de355` | `2f7b01464794cfd2f5bee9cc9aaf4f0138f2d06a` |
| `lib/suche/tastatur.ts` | `eec38ae729ce9b8e50bb55e681062dee5f100e6b5390ef23c0d0b8152b7c8394` | `3c4953419af69132fe094ee26100fc87cd13bf69` |
| `components/suche/Suchliste.tsx` (read-only) | `a442e99d5a599de5f1d2f40dfa83cda3863a97e4af340ca1dc79941e4ee6f352` | `d69781e62dae73acde6590bde03f3533c8388b77` |

## Commands and results

- `node scripts/shared-search-keyboard-lifecycle-1/run.mjs`: PASS, 15/15, including `ort/empty-seed/1280` and `ort/fixed-seed/1280`. Browser Chrome `148.0.7778.96` via Playwright. Keyboard and pointer at 1280×800. Touch and keyboard at 390×844. No unexpected requests. No page errors. The fixed-seed case keeps the seed at `Original`, highlights Edited Alpha, and selects `geonames:2000001` once.
- Targeted tests: `node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/suche/*.test.ts lib/airports/auswahl.test.ts lib/places/homepage-natural-route-intent-1.test.ts lib/places/homepage-route-entry-1.test.ts`: 31 pass / 0 fail.
- `npm run lint`: 0 errors, 146 warnings. The touched place file keeps its one pre-existing `set-state-in-effect` warning.
- `npm run typecheck`: pass.
- `npm run build`: pass, Next.js 16.4.1.
- Hygiene: operating-mode, API protection, schema reference, dead code, exports, and deps pass. Schema reference still lists pre-existing LOCAL/UNAPPLIED RPCs. Setup passes with the existing missing `.env` warning.
- Full `npm test` was not re-run on this head. Last observation, on `63aa3480`, was 7045 tests, 7029 pass, 11 fail, 5 skip. Failures were local PostgreSQL 16 `initdb` ENOENT or `local_proof_connection_override_forbidden`. Not repaired and not acceptance of this head.
- CI and Preview on `7611f2ed`, including run `40047409083`, are superseded by this head. No green CI or Preview is claimed for the R2 head in this file. The PR comment records whatever is actually pending or finished after the docs push.

## P0–P3

- P0: none.
- P1: none in this slice.
- P2: an in-range active index can remain when a later response still contains that index. That observation does not by itself prove a hidden stale selection. The empty-seed resurrection and the unchanged-seed ArrowDown regression are corrected on this runtime head.
- P3: duplicated pointer/blur handling in the two comboboxes.

## First unfinished step

Independent Technical-Lead exact-head re-review of PR #989. Do not Ready. Do not merge. Do not sync main. Do not start a follow-up. Planned integration remains A then B under a later Technical-Lead instruction.
