# Jetnity — Shared Search Keyboard Lifecycle 1 — STATUS

Date: 24 October 2026
Status: I1 integrated on the owned Draft; independent Technical-Lead review of the final head pending; not PASS, Ready, or merge
Author: **Jetnity Shared Search Keyboard Lifecycle 1 — Cursor Generation 1**
Issue: #987
Branch: `fix/shared-search-keyboard-lifecycle-1`
PR: #989

## Session

- Session `bc-f17cfe4a-c64f-420f-980c-59c8d82cb19e`
- https://cursor.com/agents/bc-f17cfe4a-c64f-420f-980c-59c8d82cb19e
- Actual model `grok-4.7-high-fast`. Requested Grok 4.7 High Fast. Not Auto.
- Same session continued for integration I1. No replacement generation, branch, or PR.

## Integration pin

Ordinary merge commit `b15b2c5386a8b2fa8dc9a96ae789194c921d3de3`, tree `fa34cdfab2d99d2b9a0bb44ef6aca8103af8a1ef`.
Parents: B head `bf3d8586dd1d04bd0ae0aca0e6a151eb94611689` and accepted main `1b0a9987c1ffcceb2e499d23249cb7a42820be55`.
Accepted main tree `433b728b88cb3e9629b54b4b3c045d5e058d9e0b`.
No rebase, cherry-pick, or force-push. Main was not updated.

The harness evidence commit after that merge is `a403741d9a8afb099fd7f77c10ee91538d1e8d18`, tree `06115c00168a4b7bf05c9b67d4200840fa998b95`. It changes only the local origin in `docs/evidence/shared-search-keyboard-lifecycle-1/results.json`. This status file is a later docs-only delta. The PR comment carries the final exact HEAD.

At the evidence head the branch was 12 ahead / 0 behind pinned main `1b0a9987c1ffcceb2e499d23249cb7a42820be55`. Merge-base is that main.

TASK V1 blob remains `2e1a966a23bbc302bb59bd367740f2425060f445`. PLAN blob remains `eaf94d90855d4acbf67cdae75e5d683841bee32a`. Mode remains `NORMAL`.

## What the integrated tree contains

B production source is the reviewed R3 source. OrtSuche blob `ddba2d97116da362ad048cdb57d08e3c0afd33b0`. FlughafenSuche blob `2f7b01464794cfd2f5bee9cc9aaf4f0138f2d06a`. `lib/suche/tastatur.ts` blob `3c4953419af69132fe094ee26100fc87cd13bf69`. Its test blob `3d4c3f6b104bece4d30542e2993e052bdcc40538`. Suchliste blob `d69781e62dae73acde6590bde03f3533c8388b77`.

All 14 A paths match main `1b0a9987` byte for byte, including MobilitaetBereich blob `105c8a2a9a4d0b5b285395cfbf2951e411a6dc23`, A TASK `3e5d971be2234c0bd8adf487bd5ac673021bc07e`, and A PLAN `6c4bc177faa1ec12987ad40ca8a0294cebc07de7`. The A harness was not run.

The place and airport comboboxes close on Escape and real focus exit. The active descendant names only a rendered option. Empty-then-same seed, typing under a fixed seed, and removing a same-text canonical value do not restore an old highlight.

## Verification on the integrated source

- `node scripts/shared-search-keyboard-lifecycle-1/run.mjs`: 16/16 PASS. Chrome 148.0.7778.96. Viewports 1280×800 and 390×844. No unexpected requests. No page errors.
- Targeted search, place-selection, and airport-canonicalization tests: 31 pass / 0 fail.
- `npm run lint`: 0 errors, 146 warnings.
- `npm run typecheck`: pass. `npm run build`: pass.
- `check:operating-mode`, `check:api-schutz`, `check:schema-bezug`, `check:dead`, `check:exports`, `check:deps`: pass. `check:setup`: pass with the existing missing `.env` warning.
- Full local `npm test` was not re-run. The last local full-suite observation, on `63aa3480`, was 7029 pass / 11 fail / 5 skip from pre-existing PostgreSQL / Official Truth proofs. Those failures were not investigated. They are not acceptance. The full suite on this head belongs to CI.

Previous-head CI and Preview are not acceptance of this integrated head.

## Next

Independent Technical-Lead review of the final published head. Cursor does not Ready, merge, or start a follow-up.
