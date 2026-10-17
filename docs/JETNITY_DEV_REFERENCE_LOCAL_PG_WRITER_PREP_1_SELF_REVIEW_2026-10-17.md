# JETNITY — Local Development Reference Import Transport Preparation 1 — AUTHOR SELF-REVIEW

**Date:** 17 October 2026
**Author:** `Jetnity Local Development Reference Import Transport Prep 1 — Cursor Generation 1`
**Status:** Author self-review only. **This is not an independent Technical-Lead PASS** and is not a merge reason.

## Acceptance criteria (task §3)

| # | Criterion | Self-assessment |
|---|---|---|
| 1 | Read-only inspection; reuse lib contracts; no parallel loader | Met. Lib parsers reused unchanged; private SQL reproduced behind a drift test against the original script source. Original entrypoints untouched. |
| 2 | Offline prepare vs future write separated; defaults unchanged; `--schreiben --entwicklung` not rerouted | Met. Separate CLI, default `plan`, write mode disarmed by constant; originals byte-identical. |
| 3 | Fake psql tests for every listed failure class + synthetic source checks | Met (report §6.2). Real psql/libpq behaviour (TLS handshake, `/dev/tty` prompt) is **not** proven by a fake. |
| 4 | Proposed preflight/stage order/verification/partial-stop/duplicate-writer/statement caps/semantic differences | Implemented in code and documented (report §4–§5). Branch identity and backup readiness remain Owner attestation; they cannot be proven over SQL. |
| 5 | Synthetic tests + safe existing gates; NOT VERIFIED where impossible | Met. Full `npm test` is **not** a full PASS (10 existing local-PostgreSQL proofs fail on a missing Linux `initdb` path); stated, not hidden. |
| 6 | Report content | Met (report). |

## R66 correction self-check (not a PASS)

| TL finding | Status after correction | Residual |
|---|---|---|
| R66-F1 | Separate stages removed; empty-table preflight; exact read-back IATA-set binding before Places; 3,001-partial test and 4 read-back variants show 0 Places batches and no `ORTE` prompt. | A stop mid-run still leaves partial data that only a new reviewed decision can resolve (by design, no self-resume). |
| R66-F2 | Libpq-Cellar realpath + owner + writability + version gate; branded type; fake only via explicit harness cast; negative tests prove untrusted paths are never executed. | Trust anchor is the Owner's account (report §4.3a); no binary hash pin. |
| R66-F3 | Basenames + SHA-256; `meldung` public-safe; exact key set enforced by a test with private/secret markers. | The private terminal still shows stderr on failure; procedure says not to paste it. |
| R66-F4 | Read-only anon catalog check + anon smoke read before the first confirmation; 7 denial variants → 0 batches. Final anon check kept. | Empty-table smoke read cannot prove a row-filtering policy; the final check still covers that, after the writes. |
| R66-F5 | Documented: required command + expected summary (report §6.0). | Still outside `npm test`/CI. |

## Findings on my own code (for R66 to weigh)

- **F1 (P2) — new tests are outside `npm test`/CI.** They must be run explicitly until the TL decides on the test glob (= R66-F5).
- **F2 (P3) — `sqlZulassen` is a regex guard, not a SQL parser.** It is defence in depth on top of generated literals (`'` doubled, `standard_conforming_strings=on` verified at preflight). It cannot prove the absence of every dangerous construct.
- **F3 (P3) — Ctrl+C mid-run.** There is no SIGINT handler; the journal then keeps `status: gestartet` with the last committed batch instead of `abgebrochen`. It still blocks reruns, and an interrupted batch rolls back server-side when the connection drops.
- **F4 (P3) — journal writes are not fsync'd.** A machine crash could lose the last batch counter update. The database remains the source of truth for what was committed.
- **F5 (P3) — error excerpts may contain row data.** psql stderr on a constraint error can quote public reference values; up to 3 lines × 300 chars go to the Owner's private console only. Since R66-F3 they no longer reach the journal.
- **F6 (P3) — test temp directories are not removed.** They contain only synthetic data and a fake certificate.
- **F7 (info) — `psql --quiet` is assumed to suppress command tags.** Known tags are tolerated anyway, and anything else fails closed as unexpected output.
- **F8 (resolved by R66-F2) — psql version check.** Now required: major ≥ 16 and equal to the Cellar version.
- **Corrected during self-review:** removed generic `PAGER` from the rejected environment names (false-positive risk, no security value because the child environment is rebuilt).

## Explicit non-claims

No hosted connection, query, import or data change happened. No credentials were read. "116 pass" proves the guards and protocol against a fake psql only; real psql was run only as `--version`. Owner source dry-runs (R63/R64) remain the only evidence about real source counts.
