# R107-D — Admin User Directory Completion 1 — SELF-REVIEW

Date: 2026-10-25. Author: Jetnity Admin User Directory Completion 1 — Cursor Generation 1. This review is not a Technical-Lead PASS.

## R1 findings

- D-R1.1 is fixed in `retry` by validated query identity. I did not loosen `usersListHrefMatches`. A unit test still expects `/admin/users` and `/admin/users?page=1` to differ as raw addresses, and `page=%201%20` to differ from `page=1`. The new helper rejects repeated, non-scalar, malformed, and above-max pages.
- D-R1.2 is fixed by retaining own acknowledgements and dispatching the clear even when its href matches the still-current URL. The mounted case commits the delayed `anna` replace before the clear replace. I did not drop that queued request.
- D-R1.3 replaces the `element.focus()` loop. The new case records Tab order, asserts disabled controls are absent from that order, and activates Nächste Seite and Erneut versuchen with Enter.

## What I am not calling success

- The router stub still supplies the next read. A refresh call is not a received response. A new `readAttempt` is not proof that this refresh caused it.
- Tab coverage is the directory toolbar, pager, and retry. It does not claim a full page of row menus.
- `npm test` still exits 1 because 11 local PostgreSQL proofs cannot start. 7177 other tests passed.
- Unknown database role and status still display as the default role and `active`. That exclusion stays.
- The historical #608 script is still outside this allowlist.

## Not done

No Ready, no merge, no tracking closure, no write to `main`, no hosted read, no personal browser.
