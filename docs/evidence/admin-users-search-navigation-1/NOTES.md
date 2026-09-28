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

## Probe flag

`node scripts/admin-users-search-navigation-1-verify.mjs --baseline` is the pre-fix probe. On the fixed head it exits non-zero because the unsolicited reset is gone. The gate is the script without `--baseline`.

## Pager label

The baseline desktop screenshot showed `1 / 3` wrapping inside the flex row. The same file now uses `shrink-0 whitespace-nowrap` on that label. The after screenshots show `3 / 3` on one line. The mobile table still scrolls horizontally; that overflow behavior was already there.
