# Jetnity — Shared Search Keyboard Lifecycle 1 — REPORT

Date: 24 October 2026
Author: **Jetnity Shared Search Keyboard Lifecycle 1 — Cursor Generation 1**
Session: https://cursor.com/agents/bc-f17cfe4a-c64f-420f-980c-59c8d82cb19e
Model: `grok-4.7-high-fast`
R3 runtime head: `349852387950529296058997b168fcbfea1b15ed`

**Status** — R3 fix implemented, Draft, re-review pending.

**Umgesetzt** — Place and airport comboboxes close on Escape and on a real focus exit. The active descendant is omitted unless it names a rendered option. R3 clears the place highlight when a canonical value is adopted or removed, including when its name already matches the field. Removing that value does not bring the old row back. Empty-then-same seed and typing under an unchanged seed stay as corrected in R1 and R2. R2 missed this case because it only cleared when the adopted text differed from the field. Explicit Place-ID and confirmed-IATA selection are unchanged. `Suchliste` stays read-only.

**Tests** — Local synthetic harness 16/16 pass on the real components, including `ort/empty-seed/1280`, `ort/fixed-seed/1280`, and `ort/value-clear/1280`. Targeted search, place-sync, and airport-canonicalization tests 31 pass. Full `npm test` was not re-run on this head. The previous local observation remains 7029 pass / 11 fail / 5 skip from unrelated PostgreSQL / Official Truth environment stops.

**Build** — `npm run typecheck` pass. `npm run build` pass.

**Security** — No auth, RLS, secret, provider, or endpoint change. No new data is collected.

**Datenbank** — none.

**Dokumentation** — STATUS, SELF_REVIEW, HANDOFF, REPORT, and `docs/evidence/shared-search-keyboard-lifecycle-1/results.json` refreshed for R3. PLAN stays the pre-code plan. TASK V1 unchanged. Central status files not edited.

**Kosten** — none.

**Offene Risiken** — An in-range highlight can remain when a replacement response still contains that index and the popup stays open. That is not this closed value removal, and this fix does not add response-identity behavior. P3: the focus-exit helper is duplicated in the two components. Previous-head CI and Preview are not acceptance. Local full `npm test` was not repeated. Main `1b0a9987` was re-read and not merged.

**Nächster Schritt** — Technical Lead re-reviews the exact final head. Cursor does not Ready, merge, or open another slice.
