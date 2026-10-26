# Admin User Mutation Safety 1 — SELF REVIEW

**26 October 2026 · R1 · not a Technical-Lead PASS**

Reviewed head was `425ff6270d12de981b3b4c5b92af36f06a8ec6f1`. This note covers the R1 delta.

## P0

None found in the owned UI.

## P1

None found. Server actions, capability checks and the directory read path were not widened.

## P2

1. `setUserStatus` still lets an owner update status when the stored role does not parse. The UI refuses that row. The action file stays frozen.
2. Repository `npm test` cannot run the native PostgreSQL 16 proofs here when `initdb` is missing. That is an environment limit, not a mutation regression. The REPORT records the actual count from this delivery.
3. Full `npm run lint` was not re-run as a repository-wide gate. Owned files lint clean. The previous full lint failure was the existing warning backlog.

R1.1, R1.2 and R1.3 are addressed in the lifecycle, copy, table and confirmation focus. The narrow directory witness now confirms before the single call.

## P3

The confirmation sits in the row flow rather than a viewport-fixed modal. Mounted overflow checks at 320, 390, 768 and 1280 passed, including 32px root font.

## Preserved

Self and equal-rank blocks, assignable roles, ban/unban only, directory debounce, and the page guard/query/column contract. No automatic resend.
