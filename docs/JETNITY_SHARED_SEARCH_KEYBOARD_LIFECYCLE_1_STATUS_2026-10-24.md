# Jetnity — Shared Search Keyboard Lifecycle 1 — STATUS

Date: 24 October 2026
Status: R1 review fix implemented on the owned Draft; independent Technical-Lead re-review pending; not PASS, Ready, or merge
Author: **Jetnity Shared Search Keyboard Lifecycle 1 — Cursor Generation 1**
Issue: #987
Branch: `fix/shared-search-keyboard-lifecycle-1`
PR: #989

## Session

- Session `bc-f17cfe4a-c64f-420f-980c-59c8d82cb19e`
- https://cursor.com/agents/bc-f17cfe4a-c64f-420f-980c-59c8d82cb19e
- Actual model `grok-4.7-high-fast`. Requested Grok 4.7 High Fast. Not Auto.
- UI title observed after rename: **Jetnity Shared Search Keyboard Lifecycle 1 — Cursor Generation 1**
- Same session continued for the Technical-Lead CHANGES REQUIRED R1. No replacement generation, branch, or PR.

## Runtime head

R1 implementation head `a911177fb14896bdc59ff3b31d755453b2e5b4f2`, tree `f44a589e38adedd0aab2f2c3c5f38f9b71140a63`.
Reviewed delivery this fix replaces: `63aa3480d8120d7ad385c0f16fcaea82d88ae75f`.
`origin/main` re-read at this note: `e372f4d830c35a74a235d345c2baaf08ab615e6c`. Merge-base is that same SHA. At the R1 implementation head the branch was 5 ahead / 0 behind. This status file is a later docs-only delta. The PR comment carries the final exact HEAD.

TASK V1 blob remains `2e1a966a23bbc302bb59bd367740f2425060f445`. Mode remains `NORMAL`.

## What landed

Both comboboxes close on Escape, Tab, Shift+Tab, and outside pointer focus. Typed text is kept. Close does not call `onChange`. `aria-activedescendant` is set only for a currently rendered option. Arrow and Enter use that same index, so a closed popup or an out-of-range index does not select. Mouse and touch selection still fire once. `Suchliste.tsx` was not edited.

R1: a genuine place parent replacement now clears the previous active index, including `initialText=""`. Reusing the same seed after that empty reset does not restore the old highlight, and Enter does not select it. A keystroke echo whose `initialText` already equals the displayed text still leaves the highlight alone. The earlier note that every differing parent replacement cleared the highlight was wrong for the empty string, because `""` was treated as no replacement and the last nonempty token was remembered. That token memory is gone.

## Verification already run on the R1 implementation head

- `node scripts/shared-search-keyboard-lifecycle-1/run.mjs`: 14/14 PASS, including `ort/empty-seed/1280`. Chrome 148.0.7778.96. Viewports 1280×800 and 390×844. Evidence `docs/evidence/shared-search-keyboard-lifecycle-1/results.json`.
- Targeted `lib/suche` tests, place-selection synchronization, and airport canonicalization: 31 pass / 0 fail.
- `npm run lint`: 0 errors, 146 warnings.
- `npm run typecheck`: pass.
- `npm run build`: pass.
- `check:operating-mode`, `check:api-schutz`, `check:schema-bezug`, `check:dead`, `check:exports`, `check:deps`: pass. `check:setup`: pass with the existing missing `.env` warning.
- Full `npm test` was not re-run for this bounded fix. The last local full-suite observation, on the previous head, was 7045 tests, 7029 pass, 11 fail, 5 skip. Those 11 failures were pre-existing local PostgreSQL / Official Truth proofs and were not investigated or repaired. They are not acceptance of this head.

Previous-head CI run `40046519920` and the earlier Vercel Ready are not acceptance of this head.

## Next

Independent Technical-Lead re-review of the final head. Cursor does not Ready, merge, or start a follow-up. Planned integration remains A then B. No main sync.
