# Admin Account Counts macOS Private HOME Canonicalization 1 — HANDOFF

Read this file instead of chat memory.

## Authority

1. Latest explicit Product-Owner / Technical-Lead instruction
2. Binding task `docs/ADMIN_ACCOUNT_COUNTS_MACOS_PRIVATE_HOME_CANONICALIZATION_1_TASK_2026-09-26.md`
3. Base/main `c599077e9cb4eeb114e1bd2a89afc81cbb492c45`
4. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
5. This STATUS / SELF_REVIEW

Machine mode is `NORMAL`. Special Product-Owner gates remain. Cursor never Ready/merges.

## Same-session vs new session

- Immediate TL review of this exact PR/head = **same** logical agent, Generation 1, session `bc-8b4a0114-fce4-4a28-bd40-a367a1f78ae2`, model `cursor-grok-4.6-high-fast`
- A new logical slice, Auto, or model substitution = **forbidden** from this handoff
- Do not resume completed #550/#552/#551/#553/#554/#555/#556/#557/#558/#559/#560/#561/#562/#563/#564/#565/#566/#567/#568 sessions
- Do not start another agent or a real-Mac follow-up from this writer

## How to continue

1. Do not change Docker shim/CLI identity/version/hash/parser, Docker endpoint selection, pre-launch network option, fixtures/browser/product/Auth/SQL/migrations/config, root deps or CI.
2. Keep original HOME and source `_cacache` on the strict visible===real contract. Do not weaken those checks to the run-owned alias helper.
3. Keep the run-owned private-HOME helper distinct. Accept visible/canonical ancestor alias only above the owned root. Refuse the private HOME itself being a symlink. Refuse every symlink/escape inside the private HOME.
4. Keep npm strictly offline. Do not solve a later cache miss by enabling network, `--prefer-online`, curl/wget or registry prefetch.
5. Seed only `<original HOME>/.npm/_cacache` into the run-owned `NPM_CONFIG_CACHE/_cacache`. Never copy/read `.npmrc`, auth, logs or arbitrary npm config.
6. `node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs` — this writer observed **78/78 PASS**.
7. Do not run the real full acceptance run or real Docker from this slice.
8. A later authorized real-Mac rerun must prove the seed now accepts the tmpdir `/var` → `/private/var` alias and still keeps the isolation/offline contract.
9. Historical receipts stay dated. Exclusive creation refuses overwrite. This writer did not mutate the cited Mac failure receipt.

## Code vs actual execution

| Capability | Code after this slice | Executed here |
| --- | --- | --- |
| Isolated env / PATH reuse / cleanup | unchanged | helper/contract tests only |
| Local `_cacache` seed into private HOME | unchanged source trust; dest uses run-owned helper | controlled copy / refuse / cap + alias tests |
| Run-owned visible/canonical HOME equivalence | `assertRunOwnedPrivateHome` + suffix containment | alias fixture + refuse cases |
| Lockfile registry integrity | unchanged | prior fixture + real lockfile tests |
| Locked `npm ci` stays offline / no-scripts | unchanged | prior fake-npm receipt + ENOTCACHED |
| Docker publish shim / CLI pins | unchanged | existing helper coverage only |
| Real Docker Desktop / official binary on the user's Mac | prior path + cache seed + alias accept | **NOT RUN** |
| Owned stack / GoTrue / Next / Playwright | prior wiring | **NOT RUN** |
| Code-complete claim | **false** | n/a |

## Secrets

Parent Docker/provider/hosted credentials are not copied. `.npmrc` / auth / logs are not read or copied. Per-run secrets stay out of Git. No new receipt was written because no `run.mjs` start was authorized.

## Next actor

Technical Lead: independent exact-head review of Draft PR #569. Do not treat helper PASS as real-Mac acceptance. The authorized later Mac rerun remains required after integration.
