# R106 O — Admin Operations Evidence Lifecycle Completion 1 — SELF REVIEW

Date: 2026-10-25. Author review only. This is not an independent Technical-Lead PASS.

Session `bc-5996ba4c-88a4-4a2d-b1ce-d7f1a0e4d79d`. Model `grok-4.7-high-fast`. Proof commit `bce903ef8c52e8aec71c14861cee6c2d77b79d22`.

## Findings

### P0

None found in the owned paths.

### P1

None found in the owned paths. Denial stays latched until an owned permitted GET. Aging does not restore fresh. The explicit control can start one GET while initial validation is pending, and that GET outranks the late prop result.

### P2

No new owned layout defect. Opened long evidence at 320/360/390 and at 320 with root font 32px measured `scrollWidth` within 1px of `clientWidth` on both boards. Overflow was not left as an accepted residual.

These limits are accepted and unchanged:

- Later uncorrelated props do not replace an accepted report, reset age, or clear denial.
- The collector's existing 30-second cache can already replace a child age before this client sees the report.

### P3

- `globalThis.__JETNITY_OPS_PROPS_SPERRE__` is a harness seam so a test can hold prop validation. Production never sets it. It is not a second network call.
- The mounted TTL boundary samples through `visibilitychange` because Playwright's clock does not fire a 1s `setInterval` from `runFor(1)`. The product timer remains a 1s interval plus `visibilitychange` and `pageshow`.
- Audit fixtures dated 2026-08-24 latch fresh nodes stale on a live October 2026 clock. Product collectors stamp `checkedAt` at request time. The pure tests use controlled clocks.
- Before any report is accepted and before a denial, a later different prop signature may still become the first accepted report. After acceptance or denial, props do not write.
- Frozen audit scripts `scripts/admin-system-health-ui-audit.mjs` and `scripts/admin-provider-ops-ui-audit.mjs` were not run. They remain outside this lane. They already look for a Details button these boards do not render. They may also observe the intentional `prueft` shell if they assert cards before the client effect. That is not verified here.

## Not claimed

Hosted Account, full Next router, Supabase, RLS, Production, Preview, and the full App/Auth CI were not observed for this head. Eleven dependency advisories stay untriaged and outside this lane. The 11 local `initdb` ENOENT failures are environment gaps, not a waiver of CI.
