# V1 Workspace Usability 1 — Adversarial self-review

Stand: 21. September 2026  
Status: **AGENT SELF-REVIEW — NOT A TECHNICAL-LEAD PASS**

A feature author's own review cannot replace an independent Technical-Lead code + visual/interaction PASS.

---

## 1. Where this slice is most likely to be wrong

### 1.1 First-viewport acceptance is fixture-bound

At 390×844 the long-title fixture now shows Übersicht + the first Jetzt-wichtig control. Flüge coverage remains far below because Jetzt wichtig and Destination Essentials sit in between and this writer must not edit those files. A reviewer may want a coverage row in the first viewport; that needs a later Uebersicht density slice.

### 1.2 VUX-4 first painted frame

The repair uses `overflow-anchor: none` plus an open-transition scroll of the non-sticky detail surface. A `setTimeout(0)` follows child mount. The first compositor frame can theoretically still be the leftover position; instrumented screens after 80–200 ms show heading + back in view. This is not a claim about every GPU frame.

### 1.3 Return focus after scripted click

`merkeAusloeser` reads `document.activeElement`. A synthetic `.click()` without prior focus lands on `BODY`. Keyboard/focus-then-click restores the coverage control. A real tap focuses the control.

### 1.4 Duplicate Zurück zur Reise

Sticky nav and `TripWorkspaceDetail` both render the same control. Detail is outside this writer's allowlist. The duplicate is pre-existing.

### 1.5 Date grammar is ICU-bound

Tests pin `de-CH` UTC output currently produced by this Node. A different ICU revision could change `Okt.` vs `Okt`.

### 1.6 Vision-helper letter doubling is not a product defect

Screenshot descriptions may show `Deereine`. DOM text is unchanged German.

---

## 2. Scope held

- No homepage/hero, VUX-3 vocabulary, VUX-5 essentials, guest storage/adoption files, Admin analyst, DB/Auth/provider/model, design tokens, package/lockfile or global continuity edits.
- #514 and #515 files were not written.

---

## 3. Verdict

Author self-review: implementation matches the binding task and the instrumented before/after evidence. **Not TL PASS.**
