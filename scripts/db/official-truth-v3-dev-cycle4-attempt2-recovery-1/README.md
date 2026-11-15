# CYCLE4-ATTEMPT2-RECOVERY1

Exact additive recovery for Dev `yfvbxvijcorffwxbxahl`. The original Cycle4
Attempt2 stopped during the I1 history reproof while the regular BG1 audit held
the shared guard lock. The captured original has revision42, 12 STARTs and
46 queue operations. Its two HRS originals and one qualification exist, while
its S1 completion and M04 result/disposition do not. Six earlier publications
and all five previous retirement/Owner receipts remain intact.

The target START is
`execution-attempt:v3:2fe5321b98827f44835f830b9c923735fab5e2a07cb1354952b516c2b035be99`;
the intake is `op3_e062b171cbf4958094a86366d013a73d`. The immutable input is
`original-evidence.json`, SHA256
`7debd26332c22a3b675280fb5401fd3116f80c0ba9b633c76a4883ab4a48d113`.

## Operator order

1. After complete CI and READY, keep the existing sender/Cron5 disabled and
   drained. Apply `provider-migration-body.sql` once in the provider transaction
   and read `readback.sql`. Installation creates no retirement or result.
2. Wait for the actual next complete regular BG1 proof after the new immutable
   boundary. Use the existing Owner/AAL2 review, retire this exact expired
   original, and separately confirm its genuine receipt. Only `open_attempt`
   closes; original START, S1, queue, HRS and old receipt rows remain immutable.
3. Continue the **same root request** through the normal import UI:
   `op3_2b7811ed9b5f488cbffcd09a0ec0409b` /
   `lease3_491cf756e95d47e0892613c0e81c556b`. The normal retained-claim selector
   confirms the actual Attempt2 claim and uses its deterministic next claim
   for Attempt3 on the same job. Do not create another enqueue or request ID.
4. After actual successful Attempt3 publication and visitor verification,
   use the separate `review-cycle4.sql` and its explicit reviewed commit,
   READY deployment, CI run and actual UI version declarations. The new review
   binds both genuine Cycle4 retirements and the successful original Attempt3
   publication. Confirm with `readback-cycle4.sql`. This adds
   `terminal_cycle4_attempt2_review_v1`; the earlier unapplied Attempt2-publication
   review is not used. Existing Cycle2/Cycle3 reviews and blocked Cycle4 remain.
5. Re-enable only the existing sender/Cron5 flags using their normal locked
   operator transaction. Neither installer nor review invokes a tick, source
   request, audit or sender activation.

If an acknowledgement is lost, inspect the corresponding immutable baseline
or review table and read back the committed facts. Never replay to decide
whether installation committed. Production is outside this package's scope.

## Preservation and local proof

The new compiler imports the existing replacement inventory and reuses all six
original installer SQL templates, each pinned by `template-hashes.json`. It
adds only the exact Attempt2 case, its private immutable baseline/receipt table
and permanent fences. All 17 replaced functions retain OIDs, owners, ACLs,
signatures and options. Full prior-row digests and original catalog checks
protect the applied Case1 provider (`e12dc341…`), REFRESH1 and older history.
No previously applied file is rewritten, and no deadline or quota is enlarged.

The new native group reuses the complete Case1 fixture, executes its unchanged
provider plus real local Owner/AAL2 retirement/confirmation, and appends only
the supplied Attempt2 delta. The cumulative delta is matched against existing
rows by exact keys and complete contents; live actors and tokens are never
imported. Local credentials are explicitly synthetic.

`await-next-bg1.ts` waits for genuine next due slots in the socket-free local
database; it never changes the clock or proof rows. Two sequential additive
installations can require two real five-minute waits. Only the new test's
15-minute harness timeout accommodates those waits; product budgets remain
unchanged. The subsequent normal Attempt3/HRS7/visitor flow uses actual
implementations and pinned public bytes only at the physical HTTPS boundary.
That is a local correctness proof, not a live source or unattended Dev proof.
