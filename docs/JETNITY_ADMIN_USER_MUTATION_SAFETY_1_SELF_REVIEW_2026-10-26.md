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

R1.1, R1.2 and R1.3 are addressed in the lifecycle, copy, table and confirmation focus. The narrow directory witness now confirms before the single call. The R1.3 supplement removes the false modal claim: the confirmation is an inline named region, Tab can leave it, and two confirmations can be open together. That proof is keyboard and DOM semantics only. The R1.2 residual on `0a6fccee` is corrected: an ambiguous sentence is no longer left in the present tense after a newer read.

## P3

The confirmation sits in the row. Mounted overflow checks at 320, 390, 768 and 1280 passed, including 32px root font. `profiles.user_id` is UUID-typed. The client safe-character check is a qualification, not an authorization bypass. No server, SQL or Auth change.

## Preserved

Self and equal-rank blocks, assignable roles, ban/unban only, directory debounce, and the page guard/query/column contract. No automatic resend.

## Integration

This note is not a Technical-Lead PASS. The history-preserving merge of `813c0ca774e3bf45ef2a7d7b8404556028389ca2` had no conflicts and did not change the lockfile, TASK V1, server actions, Auth, capabilities, query, navigation, migrations, workflows or global CSS. Owned checks on the integrated tree are in the REPORT. The `css-320` failure observed on `0a6fccee` is still the historical result. A later local directory run on the integrated tree passed that case and is recorded as that run only. The UUID character-class qualification remains P3. CI and Preview are pending.
