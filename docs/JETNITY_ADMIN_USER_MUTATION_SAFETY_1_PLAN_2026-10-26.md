# Admin User Mutation Safety 1 — PLAN

**26 October 2026 · Jetnity Admin User Mutation Safety 1 — Cursor Generation 1**

Source: immutable TASK V1, blob `d9fb19170be99c0decb06125f8556aeb3a0470e3`. Seed `9bb94a9f4a092f139e6ace3eb507a8158b9847f8`. Main `6ae344f4453b16514f9048083bb8b07396135fa2`. Mode NORMAL. Actions, auth, directory query and navigation modules stay frozen.

## Confirmed defects

`UsersTable` kept one `pendingId` for every row, cleared it in `finally`, did not disable the menu, and treated a resolved void action as success via toast. `page.tsx` mapped an unknown role through `DEFAULT_ROLE` and an unknown status to `active`.

## Shape

- `lib/admin/user-row-truth.ts` — stored role/status/id become known or unknown. No default user role and no default active status. Eligibility keeps self, owner and lower-rank rules. Unknown role, unknown status and a non-dispatchable id are not actionable.
- `lib/admin/user-mutation-lifecycle.ts` — one operation per target id. Confirming, pending and fulfilled block a second role or status write for that target. Another target is independent. Fulfilment is not confirmation. A later `readAttempt` judges absent, unchanged, contradictory or matching. Dismiss and cancel do not write. Hidden confirmations are dropped without send. No localStorage.
- `components/admin/users/UserMutationConfirmation.tsx` — accessible dialog naming account, email, id, current role/status and the requested change. Cancel is focused. Escape cancels. Focus returns to the row trigger.
- `components/admin/users/user-mutation-confirmation.css.ts` — owner-local CSS string injected by the table. No global stylesheet. Chosen instead of a CSS import so the existing directory bundle, which has no CSS loader, still builds.
- `components/admin/users/user-mutation-copy.ts` — German labels and outcome sentences. A returned callback says the save is not yet confirmed.
- `page.tsx` — only the displayed mapping calls the truth helpers. Guards, query bounds, columns and ownership stay.
- `users-directory-read.test.ts` — the old function-shape assertions are replaced by the same self/rank/owner/unknown eligibility behaviour.

Server actions remain the only writer. The menu still offers only assignable roles and the existing ban/unban toggle.

## Not chosen

A second directory model, a global pending lock, toast success, persisting operation ids, or editing frozen actions so the owner could no longer status-change an unknown role on the server. That last gap stays a UI refusal plus a recorded residual.
