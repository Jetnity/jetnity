# V1 Destination Essentials Density 1 — Adversarial self-review

Stand: 21. September 2026  
Status: **AGENT SELF-REVIEW — NOT A TECHNICAL-LEAD PASS**

---

## 1. What was checked

- Compact path fires only when every destination’s three domains are `keine_evidence`, `unvollstaendig === false`, and details/links are empty.
- `hatHinweise` true with genuinely empty domains still collapses. `hatHinweise` false with leftover details, links or incompleteness does **not** collapse.
- Unknown / unavailable / stale / option-dependent / one material domain / mixed stages stay on the existing full cards.
- Zero destinations still shows the historical `leerText` only.
- Stage ids remain in the DOM when names/countries repeat.
- Absence copy reuses `Noch keine verlässlichen Hinweise verfügbar` and names the three domains. It does not say sicher / vollständig / alles erledigt / keine Hinweise erforderlich.
- Existing `details`/`summary` + `min-h-11` contract remains in the full path; source scan in `destination-essentials.test.ts` still passes.
- No evaluator, shared type, attention, `/planen`, DB, Auth, provider or package change.

---

## 2. Remaining risks / honest limits

- Before screenshots reconstruct the previous JSX on `6f8cd923`. They are not a live capture of seed `866fbce0` before the edit.
- Evidence is synthetic compiled-CSS, not an authenticated Preview trip and not official-travel-advice validation.
- No Safari / hardware / whole-workspace E2E. #516 compact-workspace behavior was not recaptured; this component is only mounted on Übersicht and was not re-opened through gap navigation.
- Adding “für Einreise, Sicherheit und Reisezeit” is new connecting copy. A reviewer who wants the bare `leerText` alone can ask for that without changing the collapse rule.
- Compact `<ol>` is a semantic change from the previous `<ul>`. Order was already canonical; this makes it explicit.
- Live main matched the assigned baseline after fetch. Snapshot-stale local `origin/main@19a91a25` was not treated as current and was not merged.
- Exact-head CI / Auth / Preview receipts are recorded in the freeze PR comment, not claimed from this file.

---

## 3. Scope held

No attention.ts, no `/planen` composition, no sibling merge, no Ready, no PR merge, no follow-up slice. Shared-path conflict: none.

---

## 4. Verdict

Author self-review: the bounded empty-only presentation change matches the versioned task and the captured before/after. **Not TL PASS.**
