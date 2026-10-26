# Admin User Mutation Safety 1 — SELF REVIEW

**26 October 2026 · not a Technical-Lead PASS**

## P0

None found in the owned UI.

## P1

None found. Server actions, capability checks and the directory read path were not widened.

## P2

1. `setUserStatus` still lets an owner update status when the stored role does not parse. The UI now refuses that row. The action file is frozen, so a crafted caller can still reach the server. A later slice would have to change the action if the server should refuse too.
2. Closed R107 witness `editable-lower-rank-records-one-call` expects the menu item itself to call `setUserRole`. This task forbids that. The script is outside ownership and was not edited. Query and navigation witnesses around it passed.
3. Repository `npm test` cannot run the native PostgreSQL 16 proofs here (`initdb` missing). That is an environment limit, not a mutation regression.
4. Full `npm run lint` remains red on the existing warning backlog. Owned files have no ESLint error after the harness ref fix.

## P3

The confirmation sits in the row flow rather than a viewport-fixed modal, so long names wrap inside the directory card. Mounted overflow checks at 320, 390, 768 and 1280 passed, including 32px root font.

## Preserved

Self and equal-rank blocks, assignable roles, ban/unban only, directory debounce, and the page guard/query/column contract.
