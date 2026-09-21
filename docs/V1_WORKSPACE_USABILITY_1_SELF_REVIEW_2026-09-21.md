# V1 Workspace Usability 1 — Adversarial self-review

Stand: 21. September 2026  
Status: **AGENT SELF-REVIEW AFTER VUX-R1/R2 FIXES — NOT A TECHNICAL-LEAD PASS**

A feature author's own review cannot replace an independent Technical-Lead code + visual/interaction PASS.

---

## 1. Finding resolution

### VUX-R1

The new helper no longer uses `Date.parse` alone. Impossible days fail the UTC year/month/day round-trip and return null. Independently re-checked in this session: `2026-02-29`, `2026-02-30`, `2026-04-31` empty; `2024-02-29` shown; mixed valid/invalid keeps only the valid endpoint; inputs not rewritten. Unrelated `datumKurz` / `zeitraumKurz` still accept Date.parse overflow — that is intentional and out of this finding.

### VUX-R2

The callback-ref scroll is gone. Instrumented after the fix: after a real manual scroll to 1038, a parent booking-status update and explicit `Flug suchen` left `scrollY` at 1038 (jump 0) and did not reset to the open-snap 433. Rapid Escape before deferred work showed overview content again. First compositor frame of open is still not proven for every GPU.

---

## 2. Where this slice is still most likely to be wrong

### 2.1 First-viewport acceptance remains fixture-bound

Unchanged from the first freeze. Coverage rows stay below Jetzt wichtig / Essentials.

### 2.2 Deferred open snap vs React Strict Mode

Open-transition rAF/timeout is cancelled on effect cleanup. React Strict Mode remounts can cancel the deferred snap while `vorherOffenRef` already records open. The synchronous open scroll and `overflow-anchor: none` remain. Instrumented open still lands heading + back in view after 120–200 ms.

### 2.3 Rapid-close screenshot is mid-overview

After immediate Escape, the capture shows Destination Essentials, not the header. The Übersicht heading was Playwright-visible; `scrollY` was 565, not a footer landing. This is useful return context, not a claim that scroll restoration matches the exact pre-open Y.

### 2.4 Duplicate Zurück zur Reise, ICU month abbreviations, vision-helper letter doubling

Pre-existing / display-only. Not this review fix.

---

## 3. Scope held

- No homepage/hero, VUX-3, VUX-5, guest storage/adoption files, Admin analyst, DB/Auth/provider/model, design tokens, package/lockfile or global continuity edits.
- #514 and #515 files were not written. #517 landed on main; this writer did not integrate it.

---

## 4. Verdict

Author self-review: VUX-R1 and VUX-R2 match the CHANGES REQUIRED text and the new harness evidence. **Not TL PASS.**
