# Admin Users Search Navigation 1 — self-review

Stand: 28 September 2026
Role: implementation writer, not the independent reviewer.
Head rule: the branch tip that contains this file is the delivery. It is not a Technical-Lead PASS.

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

## What this review does not prove

- A signed-in `/admin/users` session.
- Chrome Back/Forward against the real Next router.
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

Review the exact pushed head independently. Do not treat this self-review, the local 4024 tests, or the seed CI as PASS. Cursor will stay on this session for a head-bound fix and will not start another slice.
