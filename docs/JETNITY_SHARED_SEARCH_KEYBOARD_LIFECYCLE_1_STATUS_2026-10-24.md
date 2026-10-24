# Jetnity — Shared Search Keyboard Lifecycle 1 — STATUS

Date: 24 October 2026
Status: R3 review fix implemented on the owned Draft; independent Technical-Lead re-review pending; not PASS, Ready, or merge
Author: **Jetnity Shared Search Keyboard Lifecycle 1 — Cursor Generation 1**
Issue: #987
Branch: `fix/shared-search-keyboard-lifecycle-1`
PR: #989

## Session

- Session `bc-f17cfe4a-c64f-420f-980c-59c8d82cb19e`
- https://cursor.com/agents/bc-f17cfe4a-c64f-420f-980c-59c8d82cb19e
- Actual model `grok-4.7-high-fast`. Requested Grok 4.7 High Fast. Not Auto.
- UI title observed after rename: **Jetnity Shared Search Keyboard Lifecycle 1 — Cursor Generation 1**
- Same session continued for CHANGES REQUIRED R3. No replacement generation, branch, or PR.

## Runtime head

R3 implementation head `349852387950529296058997b168fcbfea1b15ed`, tree `3ab7c638dabe090e844201769b903d3ac3dafd4b`.
Reviewed R2 head this fix replaces: `dc9669f37e025980e3316c5aadf94f59c0ecb372`.
`origin/main` re-read at this note: `1b0a9987c1ffcceb2e499d23249cb7a42820be55`, tree `433b728b88cb3e9629b54b4b3c045d5e058d9e0b`. Merge-base remains `e372f4d830c35a74a235d345c2baaf08ab615e6c`. At the R3 implementation head the branch was 9 ahead / 5 behind. This status file is a later docs-only delta. The PR comment carries the final exact HEAD. Main was not synchronized.

TASK V1 blob remains `2e1a966a23bbc302bb59bd367740f2425060f445`. Mode remains `NORMAL`.

## What landed

Both comboboxes close on Escape, Tab, Shift+Tab, and outside pointer focus. Typed text is kept. Close does not call `onChange`. `aria-activedescendant` is set only for a currently rendered option. Mouse and touch selection still fire once. `Suchliste.tsx` was not edited.

R3: adopting or removing a canonical place value clears the active index even when the visible label does not change. Clearing that value no longer restores the highlight from the popup that closed. Text and seed synchronization stay as they were. An unchanged seed still allows ArrowDown and Enter. An empty seed followed by the same seed still starts with no highlight.

R2 only cleared when the adopted text differed from the field. A parent value whose name already matched the field, and the later removal of that value while `initialText` stayed undefined, both left the old index in memory. The list hid it, then the next results showed it again. That gap was already in the controlled-parent contract. R2 did not introduce it, and R2 did not close it.

## Verification already run on the R3 implementation head

- `node scripts/shared-search-keyboard-lifecycle-1/run.mjs`: 16/16 PASS, including `ort/empty-seed/1280`, `ort/fixed-seed/1280`, and `ort/value-clear/1280`. Chrome 148.0.7778.96. Viewports 1280×800 and 390×844. Evidence `docs/evidence/shared-search-keyboard-lifecycle-1/results.json`.
- Targeted `lib/suche` tests, place-selection synchronization, and airport canonicalization: 31 pass / 0 fail.
- `npm run lint`: 0 errors, 146 warnings.
- `npm run typecheck`: pass.
- `npm run build`: pass.
- `check:operating-mode`, `check:api-schutz`, `check:schema-bezug`, `check:dead`, `check:exports`, `check:deps`: pass. `check:setup`: pass with the existing missing `.env` warning.
- Full `npm test` was not re-run for this bounded fix. The last local full-suite observation, on `63aa3480`, was 7045 tests, 7029 pass, 11 fail, 5 skip. Those 11 failures were pre-existing local PostgreSQL / Official Truth proofs and were not investigated or repaired. They are not acceptance of this head.

Previous-head CI and Preview, including R2 run `40048605300`, are not acceptance of this head.

## Next

Independent Technical-Lead re-review of the final head. Cursor does not Ready, merge, or start a follow-up. Planned integration remains A then B under a later pinned instruction. No main sync.
