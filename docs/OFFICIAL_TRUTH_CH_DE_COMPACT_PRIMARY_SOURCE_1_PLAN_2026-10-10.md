# Official Truth CH→DE Compact Primary Source Feasibility 1 — PLAN

**Status:** PHASE A NOT EXECUTED (live network unavailable in agent sandbox) / SOURCE_NOT_QUALIFIED / RESEARCH_ONLY
TASK blob `f14ff315daa02097ab89f816d04929d742be6c58`, base `main@c3db56a4021904aa21c25d75d218f91ee1127697`, issue #923, parent #917.

1. Phase A: reuse `retrieveOfficialTruthIsolatedPilotSource` with one quarantined descriptor each for S4/S5 (`bern.diplo.de`); verifier always returns `identity_mismatch`.
2. CLI `scripts/official-truth-ch-de-compact-primary-source-1/run.ts`: no args = OFFLINE/NOT_RUN; only `--live-official` runs, S4 then S5, one GET each.
3. Phase B (synthetic dormant package) only if a complete body fits 65,536 bytes: NOT triggered; no live body was ever read.
Touched shared files: only two reviewed-importer inventory test lists, each with a lookalike negative.
