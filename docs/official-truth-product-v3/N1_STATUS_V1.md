# N1 status V1 — local implementation, independent review pending

9 November 2026. Author: **Jetnity Official Truth V3 Research Ingress1 — Codex Generation1**, session `/root/v3_n1_ingress_writer`. This is author evidence, not TL-PASS, Ready, deployment or a merge decision.

## Version and boundary

- Task: [N1_TASK_V1](N1_TASK_V1.md); approved pre-code design: [N1_PLAN_V1](N1_PLAN_V1.md).
- Local taskseed/head remains `ec371ebd6914407aeb8f72f405d57ed70967a01f`; changed files are a local candidate for Root publication on Draft #1170.
- Branch: `feat/official-truth-v3-research-ingress-1-20261109`.
- Shared S1 contract R2: remote head `78ae1691cb9e8e75a3c353d2be0f83a2e2f82b81`, exact SHA256 `49c4c4f5c2fd0b163be4f387af47032ed8c030fd75e7bfecd875af775bf6f69b`. Only Root-authorized type inference correction was copied; API and wire schema remain frozen.
- Runtime/test file hashes: [N1_MANIFEST_V1](N1_MANIFEST_V1.json). Root must regenerate exact-head gates after publishing or integrating any changed bytes.

## Implemented behaviour

`createV3ResearchFileIngress` accepts code-owned root selection, explicit device/inode pin, canonical registry and the one S1 intake port. Each runner delivery supplies one strict JSON basename and a separately validated binding. The researcher JSON cannot choose or expand root selection, method, authority, job, runner or delivery identity.

Linux `/proc/self/fd` anchors child lookups to the opened, pinned directory. The directory must be runner-owned and not writable by group/others. Symlink roots, inode replacements, symlink/hardlink/nonregular children, unsafe names and changed files are refused. `O_NOFOLLOW|O_NONBLOCK`, descriptor/path identity and before/after nanosecond metadata checks protect the read. The implementation keeps and closes all handles before capture; real FIFO race tests complete without a writer. Exact UTF8 text is bounded to 65536 accepted bytes, with a maximum 65537-byte growth probe. Invalid UTF8 and BOM are rejected without normalization.

The existing I1 reader validates content. N1 checks proposal operation/job/context against the runner binding and calls only S1 capture with unchanged text. S1 owns duplicate-member rejection and persistence; N1 does not introduce another store or parser. A response is credited only if the entire closed S1 reference matches the expected binding, digest and byte count. A lost or malformed capture acknowledgement receives at most one same-reference confirm, after the awaited capture settles. No new operation, retry, sidecar or filesystem ledger is created. Explicit confirmation can be performed by a fresh reader instance after the source file is gone.

An aborted or expired invocation starts no later side effect and cannot return a late positive result. Work already started is awaited and cleaned up. Unknown capture after abort remains `unconfirmed` with the exact reference; it is never reported as definitely safe to retry. The default logical invocation budget is 5000 ms, configurable only by the runner within 1–30000 ms. This is not an approved production timing SLO or hard cancellation guarantee for kernel IO/arbitrary noncooperating ports.

The dormant Production entry and missing-intake factory return `unavailable/unbound` with zero file/intake IO. `recorded` means untrusted proposal custody only. No method, source, research job, accepted rule, public projection or private custody receipt is issued.

## Executed evidence

Runtime: Node **22.23.4** at `/workspace/scratch/e03d2839d4e5/v3-toolchain/node_modules/node/bin/node`. Dependencies are the existing repository toolchain; no dependency or CI change.

| Check | Actual result |
| --- | --- |
| N1 real temporary-filesystem and transport tests | 46/46 passed |
| Frozen S1 intake-contract tests | 6/6 passed |
| Existing I1 import service tests | 32/32 passed |
| Full Foundation suite, including N1G1 exact positive/negative guard | 58/58 passed |
| Final post-N1G1 combined run | **142/142 passed; 0 failed, 0 skipped** |
| Full repository `tsc --noEmit --incremental false --pretty false` | exit 0 |
| Scoped ESLint for `ingress` and amended Foundation test | exit 0 |
| Reachability | 0 orphaned modules |
| Export use | 0 unexplained unused exports |
| Package use | 0 unused checked dependencies |
| API protection | 12 admin routes checked, all protected |
| Source-only DB reference scan | exit 0; no database connection |
| `git diff --check` | exit 0 |
| Actual foundation zero-I/O fence | passed after versioned N1G1 exact consumer additions; scanner unchanged |

The final test completion output and exact command are preserved in [N1_TEST_EVIDENCE_V1](N1_TEST_EVIDENCE_V1.txt). The Node/TypeScript/ESLint commands exited 0 after N1G1.

The real filesystem matrix covers regular bytes/whitespace, exact limit, invalid JSON/PII/unknown fields/UTF8/BOM/oversize; traversal and unsafe basenames; symlink, hardlink, directory and FIFO; regular-file→FIFO/symlink races; root pin mismatch/root replacement/anchored-root rename; replacement, in-place modification, growth, unlink and added hardlink while reading; bounded growth read; abort during actual read; all handle cleanup and cleanup-ack loss. Transport cases cover independent runner binding, two concurrent file deliveries, same-operation collision, lost ACK, strict equality for every reference field, malformed/getter replies, no positive after abort/timeout, and fresh-reader confirmation without a file ledger.

An initial test run found a trailing root slash accepted by `posix.normalize`; explicit rejection was added. Initial typecheck found only N1's narrowing of the frozen S1 status union; N1 now constructs the narrow result without changing S1. Hygiene found one unnecessary test-helper export; it was removed. The results above are after those fixes.

## Evidence limits and remaining gates

The tests use real local files and a plainly synthetic intake port. They are **not durable database, restart durability, source retrieval, method approval or production evidence**. Re-entry is a fresh N1 factory using a reconstructed reference; actual store restart/concurrency and File→S1→I1 integration belong to Root's later native CI combination. Local PostgreSQL socket creation was previously refused by the environment; N1 made no retry, transport change or workaround.

Linux with mounted `/proc` is the only supported platform. The selected inode identifies the runner's local directory; a `git:<sha>` binding is not proof that those files came from that commit. Snapshot provenance and actual runner selection remain required before any operating connection. Bytes become owned after the bounded read, not continuously current file contents. A privileged actor able to replace a device node inside the runner-owned root is outside the intended filesystem threat boundary; a device open cannot be ruled out, but any nonregular descriptor is refused before reading. Root retained this plan explicitly.

The actual inherited Foundation fence initially refused the new N1 consumer. Root then published [N1G1](https://github.com/Jetnity/jetnity/pull/1170#issuecomment-6738189101), which N1 independently read before changing the one authorized guard file. Exact N1 service `ownRecord` and inherited R2 intake-contract `immutable`/`ownRecord` entries plus full positive/negative tests are now included. No prior entry, scanner or exact-set comparison was weakened. [N1_GUARD_AMENDMENT_V1](N1_GUARD_AMENDMENT_V1.md) records the scope. Root owns the later final S1/N1 union and exact-head integration gates.

#917 remains `APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING`, ledger `UNKNOWN`, Stage2 `NOT_ATTEMPTED`. D0/#1139 remain `NOT_RELEASE_READY`, effective fix not accepted, 17 gaps. #1131 Ready-STOP, #1135 held Draft, #968 target and #911/#913 privacy gates remain independent. No denied readback, hosted call, credential use, migration, provider/source call, notification, activation or owner gate was attempted.

**STOP: independent TL review and integration required. Do not mark Ready; do not merge; do not start a follow-up slice.**
