# Jetnity — Shared Search Keyboard Lifecycle 1 — STATUS

Date: 24 October 2026
Status: implemented on the owned Draft; independent Technical-Lead review pending; not PASS, Ready, or merge
Author: **Jetnity Shared Search Keyboard Lifecycle 1 — Cursor Generation 1**
Issue: #987
Branch: `fix/shared-search-keyboard-lifecycle-1`
PR: #989

## Session

- Session `bc-f17cfe4a-c64f-420f-980c-59c8d82cb19e`
- https://cursor.com/agents/bc-f17cfe4a-c64f-420f-980c-59c8d82cb19e
- Actual model `grok-4.7-high-fast`. Requested Grok 4.7 High Fast. Not Auto.
- UI title observed after rename: **Jetnity Shared Search Keyboard Lifecycle 1 — Cursor Generation 1**

## Runtime head

Implementation head `a0a9ff7108e81694f09516f0b403a91f6ca26854`, tree `0982c8faadd7aa271423efc2cc10934081650eac`.
`origin/main` re-read at this note: `e372f4d830c35a74a235d345c2baaf08ab615e6c`. Merge-base is that same SHA. At the implementation head the branch was 3 ahead / 0 behind. This status file is a later docs-only delta. The PR comment carries the final exact HEAD.

TASK V1 blob remains `2e1a966a23bbc302bb59bd367740f2425060f445`. Mode remains `NORMAL`.

## What landed

Both comboboxes close on Escape, Tab, Shift+Tab, and outside pointer focus. Typed text is kept. Close does not call `onChange`. `aria-activedescendant` is set only for a currently rendered option. Arrow and Enter use that same index, so a closed popup or an out-of-range index does not select. Mouse and touch selection still fire once. `Suchliste.tsx` was not edited.

## Verification already run on the implementation head

- `node scripts/shared-search-keyboard-lifecycle-1/run.mjs`: 13/13 PASS. Chrome 148.0.7778.96. Viewports 1280×800 and 390×844. Evidence `docs/evidence/shared-search-keyboard-lifecycle-1/results.json`.
- Targeted `lib/suche` tests, place-selection synchronization, and airport canonicalization: 31 pass / 0 fail.
- `npm run lint`: 0 errors, 146 warnings.
- `npm run typecheck`: pass.
- `npm run build`: pass.
- `check:operating-mode`, `check:api-schutz`, `check:schema-bezug`, `check:dead`, `check:exports`, `check:deps`: pass. `check:setup`: pass with the existing missing `.env` warning.
- `npm test`: 7045 tests, 7029 pass, 11 fail, 5 skip. The 11 failures are pre-existing local PostgreSQL / Official Truth proofs (`initdb` ENOENT or `local_proof_connection_override_forbidden`). They are not in the search files. They were not investigated or repaired.

## Next

Independent Technical-Lead review of the final head. Cursor does not Ready, merge, or start a follow-up. Planned integration remains A then B. No main sync.
