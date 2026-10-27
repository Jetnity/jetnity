# V2-S1 Nights and Hotel Truth 1 — HANDOFF

For the independent Technical Lead. Writer stopped after the R1 correction.

## Identity

- Logical name: Jetnity V2 Nights and Hotel Truth 1 — Cursor Generation 1
- Session: `bc-eafe2d65-2a92-47d4-b18e-d73539d11eca`
- URL: https://cursor.com/agents/bc-eafe2d65-2a92-47d4-b18e-d73539d11eca
- `run-info.originalModelName`: `grok-4.7-high-fast`
- `run-info.name`: Jetnity V2 Nights and Hotel Truth 1 — Cursor Generation 1
- Draft PR: https://github.com/Jetnity/jetnity/pull/1052
- Branch: `fix/v2-s1-overnight-hotel-truth-1`
- R1 reviewed head: `7f3f0520d99e44755aa9aa3af8e681bb0cab6a99`
- Product head after R1: `b91256e32f01512a506dc54f0d9a250495f2eea5`
- Product tree: `109824ea7befe180c50fdf140551194cacd9628b`
- `origin/main` observed during the correction: `d698ee9e3e365b09295effc1db5a4f9db165eec8` (this branch was 8 behind and was not synced)
- This handoff commit is docs-only. Review the PR head after it.

## What changed for R1

- `lib/trips/naechte-abdeckung.ts` clips complete stages to the trip calendar. `kalenderNaechte` is N−1 when the calendar is valid. `ausserhalb` holds stage pieces outside that calendar. `naechteGesamt` is the calendar only when classification is known.
- Several stages with a missing interval return `bekannt: false`, no gap list, and no transition label. The known calendar length remains on `kalenderNaechte`.
- Lodging audit and `UnterkunftBestand` use that split. Hotel search for a multi-stage missing period is unchanged.
- `lib/reiseaenderung/direct/auswirkungen.ts` received a comment correction only. Its night text already reads `naechteGesamt`.

## Exact next step

Independent R2 of the PR head. Re-run native CI and read the new Vercel Preview. Do not treat the author’s markup tests or an older Preview as acceptance. Root may sync main without a force push after this correction is accepted. The writer does not set Ready and does not merge.
