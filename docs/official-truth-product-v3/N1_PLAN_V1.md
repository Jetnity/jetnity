# N1 implementation plan V1 — Root review before code

9 November 2026. **Jetnity Official Truth V3 Research Ingress1 — Codex Generation1**, session `/root/v3_n1_ingress_writer`. Taskseed `ec371ebd6914407aeb8f72f405d57ed70967a01f`, Draft #1170. This document records the plan sent before implementation; Root subsequently approved it, including runner UID ownership and refusal of group/world-writable roots. Execution evidence is in [N1_STATUS_V1](N1_STATUS_V1.md).

The original S1 contract freeze at `15401cac83b475180ca2a93272551366e2e066fa`, SHA256 `bc16c566f725d56564113027648ea02f1d47bf920a6bf0c208b62d2d7ae60fde`, is superseded by Root-authorized R2 at `78ae1691cb9e8e75a3c353d2be0f83a2e2f82b81`: only `immutable<V3IntakeBinding>({...})` changed. The exact shared file SHA256 is now `49c4c4f5c2fd0b163be4f387af47032ed8c030fd75e7bfecd875af775bf6f69b`; N1 copied only that file unchanged, with no API change.

## Exact boundary

One server factory receives explicitly code-owned configuration: selected root directory path plus its expected device/inode identity, canonical registry, the frozen S1 intake port and a bounded invocation budget. The runner obtains the root pin from its selected snapshot; this is local selection identity, not source/Git/job authority. Missing intake yields an unbound entry without any filesystem operation. The dormant Production entry always returns unavailable.

Each call receives one closed `{fileName, binding}` delivery. `fileName` is one lowercase bounded JSON basename, not a path. `binding` uses the unmodified S1 reader. S1's exact operation/job/context/method/runner/delivery/inputRevision are retained. No manifest sidecar, vendor adapter, subprocess, git invocation or hook exists.

## Actual file safety and ownership

The supported descriptor-relative implementation is Linux with `/proc/self/fd`; other platforms fail unavailable, with no path-based fallback. Validate an absolute normalized bounded root and expected device/inode. `lstat` rejects a symlink root; `open` uses `O_DIRECTORY|O_NOFOLLOW`, then `fstat` must match the explicit runner pin. Child lookups use only `/proc/self/fd/<opened-directory-fd>/<validated-basename>`. The opened root remains held until the call is drained, so ancestor rename/symlink races cannot redirect child IO.

The selected root must be owned by the runner UID returned by `process.getuid()`, with neither group nor world write permission. Privileged device-node replacement within that runner-owned root remains a trust boundary: the implementation does not claim that a device open is impossible. An opened nonregular descriptor is rejected by `fstat` before any read. Root explicitly retained this scope after review of that limitation; no `O_PATH` platform extension was added.

Before opening a child, descriptor-relative `lstat` requires one regular single-link file. Open with `O_RDONLY|O_NOFOLLOW|O_NONBLOCK`, so a raced FIFO cannot block waiting for a writer. The resulting file descriptor must still match the inspected device/inode, be regular with link count1 and satisfy the byte limit. Read at most65537bytes in bounded chunks, with checks between awaits. Post-read descriptor and anchored-path observations must match device/inode, size, modification/change nanoseconds and link count; replacements, growth, unlink and in-place changes refuse capture. A later change after the final observation does not alter already-owned immutable bytes; no continuing file-currentness is claimed.

Strict fatal UTF8 decoding preserves bytes. BOM and replacement normalization are refused. The existing I1 upload reader validates the full proposal and computes its digest; its identity must match the independently supplied S1 binding before capture. S1-R1 owns duplicate-key rejection before the durable write. N1 never calls a second writer and never produces a private source/custody receipt.

All root/file handles close in finally before the service returns. The per-call monotonic budget aborts the signal and prevents new IO/capture/confirm or a positive result after expiry. Already-started IO is awaited and owned through cleanup, never abandoned through Promise.race. The intake contract must settle its owned database work on abort. This is bounded logical work with terminal drain, not a promise that Node can cancel a kernel-stalled regular-file read or an arbitrary noncooperating injected port.

## Persistence acknowledgement and replay

Capture passes the unchanged text and exact frozen binding. The only accepted recorded response is a closed S1 reference whose full binding, digest and byte count match the locally inspected proposal. Unexpected fields/shape/mismatched reference never become recorded. If a capture acknowledgement is lost but the port has settled and the invocation remains live, issue at most one Confirm using that same exact reference. No new operation/delivery or capture retry. If aborted or still uncertain, return a fixed unconfirmed outcome retaining only the minimised reference so a fresh process can explicitly confirm later. Confirm does not reread a changed input file or create a filesystem ledger.

## Files, tests and scope

Own files: `ingress/types.ts`, `ingress/file-server.ts`, `ingress/service-server.ts`, small `ingress/*.test.ts` and test-only fixture support if necessary; `N1_*` plan/status/manifest/handoff. No shared contract, central guard, CI, dependency, product route or registry edits. Existing synthetic fixture construction is reused only in tests, never in a runtime fallback.

Tests use actual temporary files and actual file descriptors: whitespace/UTF8 preservation; malformed/PII/unknown JSON; invalid encoding and size; bad basename; root pin mismatch; symlink/hardlink/regular-to-FIFO race; descriptor-root rename; file replacement and in-place change around real reads; abort and timeout; complete handle closure; missing/unbound intake with zero IO; concurrent identical deliveries; new service/re-entry; lost reply and exact same-op confirmation; malicious/mismatched acknowledgement; confirmation after original file removal. Deterministic race probes observe/wrap actual test FileHandle operations, without adding a production test hook or replacing bytes with fake filesystem results.

Node22 targeted tests, TypeScript, lint and hygiene are required. Actual File→S1 PostgreSQL combination remains Root's later native CI integration; fake intake in N1 tests is explicitly not DB evidence. No local PostgreSQL retry, hosted/credential/source/provider calls, method/Production activation or external message. #917 refusal and all special gates remain.

Root acknowledged this plan before code. Implement only N1_TASK_V1 and STOP at independent review handoff. **Do not mark Ready; do not merge; do not start a follow-up slice.**
