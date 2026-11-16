# REFRESH-RETIREMENT1 handoff — 15 November 2026

**IMPLEMENTED AND LOCALLY VERIFIED FOR ROOT REVIEW.** This agent did not
apply a hosted migration, retire a live attempt, push, merge or touch Production.
Root remains the operator. The I1 runtime correction is a disjoint sibling
change; install recovery and use it only with that corrected normal runtime.

## Exact artifact

| Artifact | SHA-256 |
| --- | --- |
| `provider-migration-body.sql` | `e71c729360c0e36e7d3a00504b8f013d716ef33c76ae35c9e8fbb484d01c67fe` |
| `readback.sql` | `e681b2865bb358f75c350848b2e0e96af5ebc5ef67c3a1a48dfc78449988f1e8` |
| `original-evidence.json` | `be111b7f3b024a7b967e80ceeb9b844ea5a63d67042218f4cc10e23329de7ea0` |

Base is PR #1197 `70a3cb09204e74f6bcd4a5b481e942e526a6102f`. Exactly 17 existing
function bodies and two new private immutable tables form the additive delta.
There is no new function, RPC, caller, login, authority, Admin edit or historical
artifact edit. Full older rows, OIDs, role edges, ACLs, three old retirement
receipts and five accepted versions/projections/publications are preserved.

## Final verification

Node **22.23.5**, actual owned PostgreSQL **17.12**. The complete focused group
passed **11/11**, no failures, cancellations or skipped tests, in **37.669 s**.
The complete local BG1 took **1461.92 ms** and the actual Owner/AAL2 retirement
**1165.96 ms**. Full TypeScript `tsc --noEmit --incremental false` and scoped
ESLint both exited 0. Compiler artifacts are deterministic and checked against
the source package. Production build and complete integrated CI remain Root's
gates after combining the disjoint changes; this agent did not claim either.

The native group proves wrong-target/original/catalog/privilege rollback,
fresh-proof admission, full installed row/metadata/authority preservation,
truthful existing Owner review, AAL2 and full selection CAS, immutable original
retirement, separate confirm/replay, and valid original late S1 capture/reserve
and M04 prepare refusals. The M04 negative vector uses the correct original
local synthetic token and is accepted by the existing canonical wire reader
before it reaches the permanent fence.

`resume` is absent only for the exact retired original without remaining
custody. Wrong purposes, changed claims, other historical unknown attempts,
subject drift and an open original remain refused. Missing, wrong-digest and
changed-selection Owner receipts are tested through the normal SQL endpoint,
with catalog shape restored before the read; all are blocked.

The same retained UI request then completes the actual ordinary sequence:
original read → real claim confirmation → MA1 → full queue CAS → deterministic
**Attempt 2 / revision 38** → real START. Its local producer deliberately
returns unreachable, and the existing worker records the new attempt's normal
backoff at revision 39. No success, result or disposition is fabricated for the
retired original. All previous history and guards validate after this append.
The retired original's resume is again blocked once the subject has advanced.

The complete native output is
`/workspace/scratch/745e9e1150da/refresh-retirement-native-final.log`.
This is local regression evidence, not live or unattended proof.

## Collected corrections during the same focused group

The initial runner omitted the repository's server-only registration. Fixture
setup then exposed the required genuine first queued prefix and the distinction
between SQL NULL and NOT NULL JSONB `null`. Both were fixed in the local fixture
loader without weakening installed guards. A PL/pgSQL CASE comparison required
parentheses. The late-M04 vector required canonical TEXT, the existing exact
wire keys and correct local token; its invalid earlier envelope was corrected.
The local result-ID fixture needed the contract's `jobId` field.

The real follow-up exposed an actual old execution-reader blocker: an original
START with no result was always `blocked`, even after legitimate retirement.
The approved 17th body adds the exact `resume` branch while preserving all other
behavior. Independent review then identified the need to bind the new
`retired_state` row to the actual Owner operation and exact receipt on every
read. That binding and discriminating negative tests are in the final green
group. No error was relabelled as a successful hosted operation.

Independent static review by `/root/customer_coverage_review`: **PASS** on the
final 17-body version, including the direct Owner-receipt filter, unchanged
historical unions, exact resume scope and normal subsequent MA1/CAS path.

## Remaining Root actions

Integrate this local commit with the runtime correction, update Root-owned
native selectors and manifest pins, and follow the seven-step Dev sequence in
`README.md`. Required hosted evidence is: exact additive installation readback,
ordinary subsequent BG1, existing Owner/AAL2 retirement with confirmation,
normal corrected source run, additive Cycle3 review, and the actual unattended
proof. Production remains UNAPPLIED; Production approval and merges remain
outside this package.
