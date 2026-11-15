# CUSTOMER-INFORMATION1 — Dev migration handoff

## Current UNAPPLIED amendment: bounded history memo

The initial prepared revision documented below was never applied. At Root's
explicit instruction the same atomic successor now includes the separately
pinned history-validator correction, rather than creating a second baseline.
The current package replaces **12 existing bodies: six customer validators, one
history validator, five BG1 functions**. `definitions.sql` remains byte-identical
and customer-data-owned. Historical installed Rolling/BG1 SQL stays immutable.

Current exact artifacts:

| Artifact | SHA256 |
| --- | --- |
| `history-definition.sql` | `719c2671f6d0af1881d21cd6e09f4d2dac2afb239d72759bd1d0d4647b85d355` |
| Original `assert_history_v1` body | `b23d018a05fd96cd779993ba0be510a9d9feafdf94b5b598883e724f097f9399` |
| New `assert_history_v1` body | `2459f719ebf1945197a8adce0276200e0075888c5a7f84b0fa89aafce1aab0ec` |
| Current `provider-migration-body.sql` | `acfd471692524a7e8d895df6c64daf0eee6f368486b97eeb70a320d22b2c76bf` |
| Current `readback.sql` | `2438e011c5e7e07c85fc576df139187df800409785d17c0e3abb7adefe55d479` |

Only two admission blocks after successful `job_v1` change. Once the memo fills,
a newly validated, individually cacheable value resets the invocation-local map
before insertion. It retains the existing 256-entry/1MiB bounds. Oversized
values never enter or evict the memo. All historical row, command, canonical
byte, transition, authority, attempt, disposition and quota checks remain. A new
invocation starts with no cached result. Eviction can add revalidation; it cannot
make an unvalidated value valid.

The private immutable baseline adds an exact `history_definition_digest`; its
guard and lost-ACK readback bind that digest and the twelfth body. All original
owner/role/OID/ACL/data invariants remain. The only pre-existing test driver
change is `scripts/db/official-truth-v3-rolling-jobs-quota-1/native.ts`: both real
quota scenarios explicitly install this prepared successor after the unchanged
Rolling predecessor. Every test, five-second API budget, 64/256 boundary and
original confirmation remains. Root owns Production integration and final pins.

### Observed cause and bounded proof

CI [4258](https://github.com/Jetnity/jetnity/actions/runs/43669434828)
passed 24/24 quota tests. CI
[4261](https://github.com/Jetnity/jetnity/actions/runs/43671592881), quota job
`132682615671`, retained the same quota file but failed at the last CLAIM:
`observedAt` 03:34:27.121 UTC to PostgreSQL's final-expired-budget error at
03:34:32.668 UTC. The missing last CLAIM/START/failure then caused the two
dependent 86/446-versus-87/448 counter assertions. These are not three unrelated
failures. Different hosted runners showed a broad SQL speed difference:

| Cycle86 SQL operation | CI4258 ms | CI4261 ms |
| --- | ---: | ---: |
| Enqueue | 1886.688 | 2807.717 |
| Claim | 1890.146 | 2815.693 |
| START | 1898.616 | 2824.146 |
| Failure | 1904.854 | 2837.992 |
| Original confirmation | 1899.095 | 2822.966 |
| Sum of these five separate calls | 9479.399 | 14108.514 |

The old memo kept the first 256 values forever within an invocation. At head
queued259 its precached head covered the 187 retained deduplicated enqueues.
When CLAIM changed the head to leased260, queued259 no longer fit in that frozen
memo and those old rows repeatedly called `job_v1`. Native PostgreSQL17 function
statistics reproduced the precise discontinuity:

| Complete pure `assert_history_v1` | Old job validations | New job validations | Old SQL ms | New SQL ms |
| --- | ---: | ---: | ---: | ---: |
| 64 STARTs / 192 operations / exhausted192 | 192 | 192 | 502.875 | 531.576 |
| 86 STARTs / 446 operations / queued259 | 262 | 260 | 823.305 | 723.536 |
| 86 STARTs / 447 operations / leased260 | 451 | 261 | 1002.752 | 886.994 |

These are one complete validator call each, not API calls or five-call groups.
Timings exclude process/SQL transport and statistics collection. They are local
samples, not a hosted speed guarantee. Separately instrumented leased260 total
time was 959.423→847.691 ms; canonical serialization remained the largest cost
(8786→6886 calls, 612.808→488.924 ms self time).

Actual verification for this amendment:

- Exact 12-body real migration: **12/12 PASS**, 19.22 seconds; genuine new local
  BG1 audit 565.24 ms. Original data/metadata, old-proof refusal, rollback,
  readback, sender drain and all customer-shape cases remain covered.
- Short full-history native differential: **6/6 PASS**, 29.50 seconds. Both old
  and new complete validators reject a changed invalid job after saturation
  with the actual `m04 invalid job` error. The extra negative row is inserted
  before CLAIM with 255 window operations and no credit, so quota cannot mask
  that check. Temporary diagnostic definitions and rows always roll back.
- An identical second invocation performs all 261 validations again. The exact
  admission block separately proves 256-entry reset, 1MiB byte reset, an
  oversized miss preserving useful entries, and later misses after eviction.
- The first diagnostic attempt timed out in new fixture transport: nested JSON
  escaping made the old local SQL splitter scan a giant literal quadratically.
  The fixture now uses the existing literal-per-column INSERT pattern. The
  unchanged 180-second diagnostic budget passes; no transport helper or runtime
  timeout was enlarged. The independent reviewer also caught and closed the
  initial negative-fixture quota overlay before the passing run.
- Both deterministic compiler checks and `git diff --check` PASS. Focused
  ESLint PASS with no warnings; full `tsc --noEmit --incremental false` PASS.
  Integrated exact-head gates remain Root-owned.

**Capacity limit:** the complete lifetime scan is still linear in retained
history. At 40-minute cadence, 36 ordinary cycles add at least 108 queue rows per
day; 15 days add about 540 STARTs and 1620 queue operations, before retries. This
small memo correction does not prove that growth fits the five-second API
deadline. The complete new 87/448 API/quota gate still must pass in CI, and Root
is reviewing a separate measured scaling decision. No unlimited continuous-run
or 30-November capacity claim is made here. Dev and Production remain UNAPPLIED.

## Earlier prepared revision (superseded before application)

## Exact ownership and state

- Agent: `/root/runtime_review`, generation 1; task/session identity is the parent
  collaboration tree. External executor session ID is not exposed.
- Declared model: GPT-6 Astra Pro; exact executor variant is unknown.
- Observed `origin/main`: `63544e820e912bd275556588c956a09b99b1cf90`.
- Worktree base: `209b6a1c13e92cab3218a89ebefa96bdc47041fe`.
- Branch: `work/official-truth-customer-migration-20261115`.
- Implementation head: `e21183f97191e3aa003db9c4883eebfc97e970e9`.
- Write scope: new `scripts/db/official-truth-v3-customer-information-1/`, new
  `lib/readiness/official-truth-customer-information-migration.test.ts`, this
  new handoff. No pre-existing source, admin, UI or SQL installer was changed.
- The six-definition `definitions.sql` belongs to the separate customer-data
  commit and is deliberately excluded from this migration commit. Integrate
  customer-data first, then this commit and the handoff-only follow-up.
- Verdict: implementation/native proof PASS, **Dev migration UNAPPLIED**.

## Implemented boundary

The immutable Rolling-Quota successor pattern now admits exactly six additive
customer-data function bodies and five necessary BG1 catalog/admission function
bodies. One new forced-RLS, immutable private baseline binds the entire existing
rolling row/catalog and the exact new definitions/catalogs. All previous
baselines, actual function OIDs/options/ACLs, bootstrap grants and old private
table contents remain exact.

The trusted installer temporarily gains SET-only edges for the three existing
intake/jobs/result owners, then revokes only those new postgres-grantor edges.
No runtime grant, owner schema grant, business table definition or data row is
added/changed. Existing full history/certificate/retirement validators run before
and after the delta; no checks are replaced by a fresh snapshot alone.

The package requires the existing sender disabled and drained, with no active
cycle, unprocessed import or preview request, leased claim, open attempt or
reachable runtime session. Historical blocked Cycle2/3 metadata is permitted and
preserved. The migration never ticks, audits, sends HTTP, modifies a proof/due
slot, changes a quota or activates the sender. It closes business admission
until the next genuine complete BG1 generation after `proof_not_before`.

## Exact artifacts

| Artifact | SHA256 |
| --- | --- |
| Data-owned `definitions.sql` | `6c5d64c50389caf424d99b204e7f0f08ba64c0f669e7b9e3f8cccead2deb992f` |
| `provider-migration-body.sql` | `b30d931b35815934deeb7f315be8c8da4528f46f6f58d359fcdc93f3ec96a66d` |
| `readback.sql` | `e130746c6a72101dcdbac18e3bdead952b780289a62f2e23fecda913e753f70f` |
| Fictional `shape-fixtures.json` | `eb3ba8bf45a4afb74fec2a7c98d9fb5050b7f81ff27d1f6f094575053f71c4f9` |

`pins.json` additionally binds every predecessor file and every old/new business
body. The compiler fails if any pin, argument, option, owner or exact replacement
inventory changes. Its generated readback verifies the complete installed guard
catalog plus all eleven function bodies; an ACK loss is reconciled by reading
the baseline, never by blindly rerunning the installer.

## Evidence actually checked

Node 22.23.5 and the existing PostgreSQL 17 toolchain, owned local databases only:

- Complete native pack: **12 tests PASS, 0 fail, 0 skipped**, 20.20 seconds.
- Real unmodified HMA/S1/HMT/HRS/HM04/BG1/status/recovery/gap/rolling installers.
- Four coherent synthetic historical failure cycles: 4 STARTs, 12 operations;
  real sender schema with explicit local copies of blocked Cycle2/3 metadata.
- Rollback on wrong target, predecessor catalog drift, an un-restored owner edge,
  an extra runtime EXECUTE privilege, enabled sender, active cycle and open
  import/preview dispatches. Each expected original refusal is asserted in
  addition to any subsequent transaction-aborted messages.
- Exact old table/role/membership digests and original eleven function metadata
  identities; unchanged legacy context/subject identities.
- Distinct customs items produce different context/job/subject identities and
  identical results across jobs and result validators; invalid topic/items fail.
- All 17 fictional prepared variants, covering all 13 detail forms, pass real S1
  and HRS proposal/outcome/audit validation and match canonical context identity.
  A vaccination proposal relabelled as a minor topic fails both validators.
- Positive old-proof rehearsal rolls back wholly. The committed candidate stays
  unavailable, lost-ACK readback is exact, duplicate install is refused, the new
  baseline cannot be updated/deleted/truncated or read by application roles.
- A subsequent genuine local full BG1 audit opens admission; measured 765.72 ms,
  with unchanged quotas and complete historical totals. No clock/due-slot edit.
- Focused ESLint: PASS, no warnings. Full `tsc --noEmit --incremental false`:
  PASS. `git diff --cached --check`: PASS. Final compiler `--check`: PASS.
- After the native pack, only trailing blank lines were removed; the provider
  file/readback digest was regenerated. SQL statements/function bodies are
  identical. The integrated exact-head CI remains the release gate.

The seventeen vectors were produced from the actual customer-data fixture helper
in its worktree. The committed `generate-fixtures.mjs --check` must also run after
that data slice is integrated, because this isolated predecessor worktree does
not contain the new helper. These are fictional test cases, never source facts.

Read-only Dev inspection at 2026-11-15 03:12 UTC confirmed the exact old six bodies,
the current Rolling-Quota guard functions and original three ADMIN-only edges.
BG1 then had generation 261, proof 03:10 UTC and validity 03:15:30 UTC, with incidents
resumed. This is historical inspection evidence, not a claim of current state.
No remote database write or external comment was performed by this agent.

## Existing publication limit and open gates

The retained HRS `binding_valid_v1(jsonb)`/selected binding is still the reviewed
CH→DE visa/`requirement_effect` path. This migration adds safe canonical shapes
and identities; it does not grant publication for the new topics or other
countries. Normal official method/qualification/binding work remains necessary.
Unknown visitor fields must remain “derzeit nicht verfügbar”. The 206 researched
destinations remain RESEARCH_ONLY.

Not checked by this agent: integrated CI/build, hosted deployment, Dev apply,
normal scheduled source run/BG1/publication/visitor proof, Production or merge.
No new paid service or running cost was introduced.

## Next owner and STOP

Root/TL integrates customer-data then this package, independently reviews and
adds `lib/readiness/official-truth-customer-information-migration.test.ts` to
`HOSTED_PG17_FILES` in the **main** partition. It runs the canonical fixture
reproduction, complete exact-head CI/build, then follows the package README's
normal Dev disable/drain/install/readback/fresh scheduled BG1/restore sequence.
The separate Cycle3 review and real visitor/source evidence remain Root-owned.

**STOP:** this agent does not apply the Dev package, publish a branch, merge,
touch Production or change another product/admin scope.
