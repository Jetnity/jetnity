# Official Truth CH→DE Compact Primary Source Feasibility 1 — REPORT

**Status:** PHASE A NOT EXECUTED (live network unavailable in agent sandbox) / SOURCE_NOT_QUALIFIED / RESEARCH_ONLY
TASK blob `f14ff315daa02097ab89f816d04929d742be6c58`, base `main@c3db56a4021904aa21c25d75d218f91ee1127697`, issue #923, parent #917.

**Phase A result: NOT RUN.** In the agent sandbox DNS for `bern.diplo.de` does not resolve (`curl` exit 6), so no GET was issued. No size, redirect or media measurement exists; `completeBodyBytes` is unknown (null). Nothing is inferred from public web text.

Implemented: S4/S5 manifest, quarantine probe, opt-in CLI, 23 offline tests (65,535/65,536/65,537 boundary, UTF-8, media, redirects, SSRF, tracking, port, refusal of all caller material, importer guard) and importer-inventory entries.

Next required step (TL/Owner): run `npx tsx --import ./scripts/server-only-test-register.mjs scripts/official-truth-ch-de-compact-primary-source-1/run.ts --live-official` from a network-enabled environment, record only sanitized refusal reasons in the manifest, and decide Phase B vs. the gated larger-snapshot alternatives for #917 if both return `response_too_large`.
