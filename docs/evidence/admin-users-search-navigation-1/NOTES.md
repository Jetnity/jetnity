# Admin Users Search Navigation 1 — evidence notes

Captured: 28 September 2026

This folder is the actual-component harness for `components/admin/UsersTable.tsx`. It is not a signed-in Next.js session, not a physical device, and not Production acceptance.

## What is real

- The bundled component is the repository `UsersTable`.
- Rows are synthetic (`example.test` only). No account is read or mutated.
- Role and status server actions are boundary stubs and were not called.
- Next `useRouter` / `useSearchParams` and `next/link` are boundary stubs.

## What the runs show

- `before.json` / `before-desktop.png`: unfixed component, no typing and no click. Initial URL `q=anna&page=3&source=support` became `router.replace('/admin/users?q=anna&page=1&source=support')` after the 400 ms timer. Page label moved from `3 / 3` to `1 / 3`.
- `after.json` / `after-desktop.png` / `after-mobile.png`: fixed component. Deep link, remount, edit, clear, whitespace, Unicode, pagination, history sync, external navigation during a pending edit, page click during a pending edit, rapid edits and unmount all matched the task. Console and page errors were empty. Action calls stayed empty.

## Pending text and page click

A page click keeps the committed URL filter, discards the uncommitted input, and cancels the debounce. The field then matches the filter that produced the list. It does not apply the draft on the requested page.

## R1 delayed own-search acknowledgement

Work/TL review `5344508093` on head `433e9a25426c93f9949c017ef36229c569996d5b`: a synchronous `replace` hid a regression. The harness can now hold `router.replace` and commit it later.

- `delayed-own-ack-keeps-newer-draft`: anna/page 3, type bob, let replace queue, type bobby, then commit bob. The field stays `bobby`, and one later replace carries `bobby`.
- `delayed-own-ack-keeps-edit-back-to-previous`: after the held bob replace, edit back to `anna`, then commit bob. The field stays `anna`, and one later replace restores `q=anna`.
- `delayed-external-wins-over-held-search`: external navigation drops the held commit and the newer draft.
- `delayed-older-ack-after-newer-replace-once`: bobby's replace is already queued; committing the older bob URL does not wipe bobby or schedule a third replace.

Own-search URL acknowledgement does not copy `urlQ` into the field. External navigation and pagination still do. A draft whose replace was already issued is not issued again.

## R2 native Back can equal a pending own-search URL

Work/TL review `5344639303` on head `99d2ab4a30b3915db35890bd4f5a395ae8cd8c89`. Href equality alone classified native Back as our own acknowledgement when the Back target query equalled a held `replace`.

`native-back-equals-pending-own-search`: start `q=bob&page=1&source=support&reviewHold=1`, `history.pushState` to `q=anna&page=3` on the same document (no `popstate`), type `bob` and hold that `replace`, type `bobby`, then native `history.back` before the next debounce. The held `bob` replace is not committed. Back restores `bob` / page 1, clears the draft and timer, and does not issue `bobby`. Native `history.forward` then restores `anna` / page 3, still with one held replace and no `bobby` replace.

`pushState` / `replaceState` do not emit `popstate`. The stub's delayed commit, external update, and in-memory back/forward still notify without `popstate`. Native Back/Forward do emit it, and that traversal invalidates own-search markers and the timer.

## Probe flag

`node scripts/admin-users-search-navigation-1-verify.mjs --baseline` is the pre-fix probe. On the fixed head it exits non-zero because the unsolicited reset is gone. The gate is the script without `--baseline`.

## Pager label

The baseline desktop screenshot showed `1 / 3` wrapping inside the flex row. The same file now uses `shrink-0 whitespace-nowrap` on that label. The after screenshots show `3 / 3` on one line. The mobile table still scrolls horizontally; that overflow behavior was already there.
