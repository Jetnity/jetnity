# CYCLE4-RECOVERY1 — exact additive Dev recovery

Target: `yfvbxvijcorffwxbxahl` only. This package admits the existing Owner/AAL2
retirement path for the original unknown Cycle4 START of 15 November 2026. It
does not retire during installation, create a completion, change an outcome,
reset history, run a source import, enable the sender, or invoke BG1.

The immutable source is `original-evidence.json`: the original request is
`op3_2b7811ed9b5f488cbffcd09a0ec0409b` /
`lease3_491cf756e95d47e0892613c0e81c556b`, job
`job3_c70d23ff344cdf2998818ecf5243d15e`. Its Attempt1 has an expired START,
expired S1 reservation, no S1 completion and no M04 result/disposition. The
normal scheduler consumed all eight resumes and kept Cycle4 blocked with
`retry_budget_exhausted`. Nine original dispatches remain immutable.

## Ordered operator actions

1. After full CI/READY, keep the existing sender and Cron5 disabled and drained.
   Apply `provider-migration-body.sql` once through the provider transaction.
   It requires the exact original subject (revision41, 11 STARTs, 45 operations),
   six prior publications, four actual prior retirements, both old scheduler
   reviews, current predecessor functions, restored permissions and quiescence.
2. Read `readback.sql`, then wait for the normal BG1 cron to establish a genuine
   complete proof after the new immutable boundary. A pre-install proof cannot
   admit the new recovery.
3. Use the existing Guard Owner/AAL2 review, retire the exact original, and use
   its separate confirmation. Only `open_attempt` closes. All original START,
   queue, S1, HRS and receipt rows remain; the original token and intake stay
   permanently fenced. Four old retirement/Owner rows and all prior HRS rows
   are bound by complete-row digests without increasing any snapshot limit.
4. Continue the same saved request through the normal import UI. If necessary,
   explicitly enter the two original identifiers above in its existing
   recovery form, then click Continue. No new enqueue is required. The ordinary
   retained-claim CAS must acquire Attempt2 on the same job. Confirm the real
   new HRS publication and visitor view.
5. Only then apply the separate `review-cycle4.sql` with its explicit reviewed
   commit, READY deployment, CI run and actual UI version declaration. Its
   database checks bind the genuine Owner receipt, completed same-job Attempt2
   and source publication. `readback-cycle4.sql` confirms the additive review.
   It preserves Cycle4 blocked and old Cycle2/Cycle3 reviews; it permits the
   existing sender to progress past that reviewed original. Re-enable only the
   existing sender/Cron5 flags afterwards, under the normal sender lock and
   strict before/after comparison. Do not replay activation or invoke a tick.

If an acknowledgement is lost, check for the corresponding immutable baseline
or review table and perform its readback. Never replay an installation to decide
whether it committed.

## Local evidence and test scope

The old REFRESH1 provider and applied Cycle2/Cycle3 migrations remain byte
identical. The recovery changes only 17 existing function bodies, preserving
OIDs, owners, ACLs, signatures and options, and adds two private immutable tables.
Old predicates and receipts remain in their original paths. Only this exact
retired original and `purpose=resume` can report absence of resumable result
custody; every subsequent operation still uses the normal MA1 and queue gates.

`local-history-delta.json.gz` contains redacted captured business rows appended
to the prior immutable fixture. `_sql_nulls` distinguishes SQL NULL from JSON
null. Synthetic local credentials are introduced only by `history-fixture.ts`.
The old Refresh retirement and old sender reviews are executed locally through
their actual original migrations/RPCs, rather than importing incompatible live
credentials or local OIDs. These are explicitly local operator fixtures.

The new native group uses owned socket-free PG17. For its real normal selected
source/publication flow, only physical HTTPS supplies existing pinned public
AA/Bern bytes; source parsing, MA1, S1, M04, HRS and visitor readers are actual
implementations. It is not a live-source observation or unattended Dev proof.
