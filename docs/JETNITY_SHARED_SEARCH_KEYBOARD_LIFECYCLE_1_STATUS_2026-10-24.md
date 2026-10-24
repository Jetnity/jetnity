# Jetnity — Shared Search Keyboard Lifecycle 1 — STATUS

Date: 24 October 2026
Status: R2 review fix implemented on the owned Draft; independent Technical-Lead re-review pending; not PASS, Ready, or merge
Author: **Jetnity Shared Search Keyboard Lifecycle 1 — Cursor Generation 1**
Issue: #987
Branch: `fix/shared-search-keyboard-lifecycle-1`
PR: #989

## Session

- Session `bc-f17cfe4a-c64f-420f-980c-59c8d82cb19e`
- https://cursor.com/agents/bc-f17cfe4a-c64f-420f-980c-59c8d82cb19e
- Actual model `grok-4.7-high-fast`. Requested Grok 4.7 High Fast. Not Auto.
- UI title observed after rename: **Jetnity Shared Search Keyboard Lifecycle 1 — Cursor Generation 1**
- Same session continued for CHANGES REQUIRED R2. No replacement generation, branch, or PR.

## Runtime head

R2 implementation head `ddfee63444b739119233376a2f823e7f027f4026`, tree `58348a00562871761fcc2210ca01949eb05eaaca`.
Reviewed R1 head this fix replaces: `7611f2ed6575a6a80de75e6f8053e305daf5ddb9`.
`origin/main` re-read at this note: `1b0a9987c1ffcceb2e499d23249cb7a42820be55`, tree `433b728b88cb3e9629b54b4b3c045d5e058d9e0b`. Merge-base remains `e372f4d830c35a74a235d345c2baaf08ab615e6c`. At the R2 implementation head the branch was 7 ahead / 5 behind. This status file is a later docs-only delta. The PR comment carries the final exact HEAD. Main was not synchronized.

TASK V1 blob remains `2e1a966a23bbc302bb59bd367740f2425060f445`. Mode remains `NORMAL`.

## What landed

Both comboboxes close on Escape, Tab, Shift+Tab, and outside pointer focus. Typed text is kept. Close does not call `onChange`. `aria-activedescendant` is set only for a currently rendered option. Mouse and touch selection still fire once. `Suchliste.tsx` was not edited.

R2: place navigation resets only when the parent adopts a new seed or a new confirmed name, and only when that adopted text differs from the field. An unchanged `initialText` no longer clears ArrowDown or Enter after the user types something else. The empty seed followed by the same seed still clears the old highlight. A keystroke echo that already matches the field does not.

The R1 note said an unchanged seed cannot suppress navigation. That was false. R1 treated any difference between the old seed and the typed text as a new adoption, so each ArrowDown highlight was cleared again.

## Verification already run on the R2 implementation head

- `node scripts/shared-search-keyboard-lifecycle-1/run.mjs`: 15/15 PASS, including `ort/empty-seed/1280` and `ort/fixed-seed/1280`. Chrome 148.0.7778.96. Viewports 1280×800 and 390×844. Evidence `docs/evidence/shared-search-keyboard-lifecycle-1/results.json`.
- Targeted `lib/suche` tests, place-selection synchronization, and airport canonicalization: 31 pass / 0 fail.
- `npm run lint`: 0 errors, 146 warnings.
- `npm run typecheck`: pass.
- `npm run build`: pass.
- `check:operating-mode`, `check:api-schutz`, `check:schema-bezug`, `check:dead`, `check:exports`, `check:deps`: pass. `check:setup`: pass with the existing missing `.env` warning.
- Full `npm test` was not re-run for this bounded fix. The last local full-suite observation, on `63aa3480`, was 7045 tests, 7029 pass, 11 fail, 5 skip. Those 11 failures were pre-existing local PostgreSQL / Official Truth proofs and were not investigated or repaired. They are not acceptance of this head.

Previous-head CI and Preview, including R1 run `40047409083`, are not acceptance of this head.

## Next

Independent Technical-Lead re-review of the final head. Cursor does not Ready, merge, or start a follow-up. Planned integration remains A then B under a later pinned instruction. No main sync.
