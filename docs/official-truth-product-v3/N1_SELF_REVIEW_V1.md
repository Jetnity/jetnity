# N1 author self-review V1

9 November 2026. Codex Generation1, `/root/v3_n1_ingress_writer`. **Not Technical-Lead-PASS.** Review target is the local file manifest, not an already published exact head.

## Findings addressed

1. A trailing slash survives `posix.normalize`; the runner root parser now explicitly rejects trailing slashes. The corresponding no-IO test failed before the fix and passed afterward.
2. The frozen S1 contract combines simple statuses in one union member; N1 constructs narrow collision/not-attempted results instead of returning that wider member. Full repository typecheck passes without an N1 contract fork.
3. An unused exported fake-intake helper was made private; export hygiene passes.
4. Child basename validation is repeated at the descriptor-reader entry through the same shared constant, so a direct internal call cannot bypass path restrictions.
5. The inherited Foundation fence refused the new finite consumer. After Root published N1G1 and N1 read it live, the exact N1/R2 consumers and full positive/negative counterexamples were added. All 58 Foundation tests pass; scanner and complete set equality remain unchanged.

## Security and authority review

Root path selection is code-owned and pinned by actual device/inode. The service checks a closed delivery object without getters, detaches/freezes the shared binding through S1's reader and rejects unknown properties. Root lstat/open/fstat and the held directory descriptor establish the selected root. Child lstat/open/fstat are descriptor-relative; `O_NOFOLLOW` prevents following replaced symlinks and `O_NONBLOCK` avoids waiting on a raced FIFO. Opened nonregular descriptors are never read. The accepted byte buffer is finite and zeroed after the detached string is produced; all opened handles are closed before any capture.

The root must be owned by `process.getuid()` and have no group/other write bits. This does not isolate a hostile privileged actor sharing the runner's filesystem authority. Root expressly retained that trust boundary; a privileged device-node race can trigger an open before fstat refusal. No claim of device-open impossibility or kernel-call hard cancellation is made.

The input remains an untrusted proposal. Registry qualification, accepted authority, actual retrieval and private receipts are never fabricated. Research proposals do not grant runner or method identity. Full operation/job/context binding is checked before the one S1 writer. The expected reference uses the exact unchanged UTF8 bytes and all runner fields. Every returned reference is parsed and compared field by field, including method revision, input revision, runner, delivery, byte count and digest. Unknown acknowledgement cannot become positive through an arbitrary `recorded` string. Same-operation confirmation starts only after capture has settled and stops after one attempt.

Missing intake and dormant Production perform no file IO. There is no HTTP handler, scheduler, process execution, live source registration, filesystem manifest store or alternative persistence writer in runtime code. Test-only FIFO creation uses a shell-free `mkfifo` subprocess on an owned temporary fixture. Synthetic source fixtures are imported exclusively by test support; no extractor is invoked during N1 deliveries.

## Residual risk disposition

| Priority | Disposition |
| --- | --- |
| P0 | No known N1 runtime defect found by author; no production activity occurred. Independent TL review remains required. |
| P1 | Durable File→S1 capture/confirm integration is not yet verified here. N1G1 passes locally, but Root's final S1/N1 union and native CI combination remain merge gates, never waived by these local tests. |
| P2 | Linux/procfs dependence; runner snapshot provenance remains unbound; same-UID/privileged device replacement and uninterruptible IO remain documented trust/platform boundaries. No automatic method or production activation. |
| P3 | No known remaining local hygiene finding after fixes. |

Evidence: [N1_STATUS_V1](N1_STATUS_V1.md), [N1_MANIFEST_V1](N1_MANIFEST_V1.json). Existing #917/#1139 and separate owner/privacy gates are unchanged. The author waits for Root's review and handles immediate review fixes in this same session.
