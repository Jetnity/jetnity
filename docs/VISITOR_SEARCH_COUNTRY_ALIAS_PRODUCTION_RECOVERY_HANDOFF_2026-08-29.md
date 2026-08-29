# Jetnity – Visitor Search Country Alias Production Recovery – Handoff

Stand: 29. August 2026  
Logical Cursor-Agent: **`Visitor search correctness 1`**  
Cursor-Run: `bc-020d3296-0cd7-4e36-8373-47578af701ce`  
Draft-PR: #173  
TL-Fund: `5057811180`

## Für den nächsten Agenten / Reviewer

Implementiert, bleibt Draft. Nächster Schritt: unabhängiger Technical-Lead Exact-Head-Re-Review.

Nicht starten: #110, AP-6/AP-7, Provider, Import, UI-Redesign.

## Root Cause

Unconditional country-universe transfer on every `ziel` search.

## Fix

`ortLandAliasExaktfilter`: exact name / exact comma token only. Limit 500 is a cap. City queries transfer 0 country-universe rows. 2-character exact aliases still survive >12 substring noise.

## Stop

Kein Ready. Kein Merge. Self-Review ist kein PASS.
