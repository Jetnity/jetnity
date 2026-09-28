# Admin Users Search Navigation 1 — self-review

Stand: 28 September 2026
Role: implementation writer, not the independent reviewer.
Head rule: the branch tip that contains this file is the delivery. It is not a Technical-Lead PASS.

## R2

Reviewed head `99d2ab4a30b3915db35890bd4f5a395ae8cd8c89`, review `5344639303`. The finding is accepted. R1's href match cannot tell a delayed own acknowledgement from native Back when both queries are the same. The actual component then kept `bobby` and replaced it after Back.

Native `popstate` now clears own-search markers and the timer, and the field follows the restored URL. `pushState` / `replaceState` still do not emit `popstate`. The held `bob` replace in the coincidence case is left unacknowledged. R1's newer-draft cases remain in the same harness run.

## R1

Reviewed head `433e9a25426c93f9949c017ef36229c569996d5b`, review `5344508093`. The finding is accepted. Copying `urlQ` on every URL change treated our own delayed search commit as external navigation and deleted a newer draft. The synchronous harness could not catch that.

The refutation now includes a held `replace`: `bobby` survives the older `bob` commit and is replaced once; editing back to `anna` survives and is written once; external navigation still cancels the held search; an older commit that arrives after the newer replace was already issued does not add a third replace or restore `bob` into the field. Pagination, unmount and StrictMode cases remain in the same harness run.

## Attempts to refute the fix

1. Mount with `q=anna&page=3&source=support` under React StrictMode still rewrites page 1.
   Result: zero `router.replace` calls after 700 ms. Refuted on the fixed component.
2. Remount repeats the reset.
   Result: still zero replaces, input `anna`, label `3 / 3`. Refuted.
3. A pending 400 ms timer survives Back/external navigation or unmount and then forces page 1.
   Result: edit-then-external and unmount recorded zero replaces. Refuted in the harness.
4. Page click during a pending draft is overwritten, or the draft and the list disagree.
   Result: one replace, `q=anna&page=2&source=support`, input returned to `anna`. The draft `bob` was discarded. Refuted.
5. Rapid edits commit an intermediate value or more than one replace.
   Result: one replace, `q=ber`, page 1. Refuted.
6. Whitespace or an unchanged filter resets the page.
   Result: zero replaces, page stayed 3. Refuted.
7. Unicode or punctuation breaks the query or drops `source`.
   Result: decoded `q` was `müller & co/ñ?`, `source=support`, page 1, no raw spaces in the href. Refuted.
8. StrictMode or the URL sync loops `replace`.
   Result: deep link had 0 replaces; a real edit had 1. No maximum-update-depth error. Refuted for these cases.
9. The fix calls role or status actions.
   Result: stub call list stayed empty. The handler bodies were not edited.
10. Native Back to a URL equal to a held own-search replace is treated as that acknowledgement and then writes `bobby`.
   Result: `native-back-equals-pending-own-search` restored `bob` / page 1, kept one uncommitted replace, and did not add `bobby` after 700 ms. Forward restored `anna` / page 3 with that same single replace. Refuted on the fixed component.

## What this review does not prove

- A signed-in `/admin/users` session.
- Chrome Back/Forward against the real Next router. The coincidence case uses native `history.back` / `history.forward` on the harness document only.
- The one-frame gap where `useSearchParams` has already changed and the server `q` prop has not. The input follows the URL. Rows still come from the server page, which this slice does not change.
- A first paint where the `q` prop and the URL disagree. The page builds both from the same request, so that pair was not treated as a supported state.
- Physical-device acceptance. Mobile evidence is a 390×844 Chromium harness screenshot. The table still scrolls sideways; that overflow was already present.
- Exact-head CI, Auth configuration, or Vercel on the pushed head.

## Scope check

Allowed runtime files changed: `components/admin/UsersTable.tsx`, `lib/admin/users-search-navigation.ts`.
Tests, harness, evidence and the continuity files named in the task were added or updated.
No server page, server action, auth, migration, dependency, CI or governance file was edited.
The pager class `shrink-0 whitespace-nowrap` is a one-line presentation change in the authorized component. The baseline screenshot showed the page fraction wrapping. It is not a palette or Admin F change.

## Recommendation to Work/TL

Review the exact pushed head independently. Do not treat this self-review, the local 4025 tests, or the seed CI as PASS. Cursor will stay on this session for a head-bound fix and will not start another slice.
