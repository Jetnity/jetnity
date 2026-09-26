# Homepage Natural Route Intent 1 — SELF-REVIEW

Date: 2026-09-27  
Status: **AGENT SELF-REVIEW ONLY / NOT TECHNICAL-LEAD PASS**  
Agent: Jetnity homepage natural route intent 1, Generation 1  
Session: `bc-fe25bf01-3d21-4b29-8b9f-81743491d7d7`  
Required and actual model: Cursor Grok 4.6 High Fast (`originalModelName=cursor-grok-4.6-high-fast`)

## 1. Ownership

Runtime stayed inside the assigned slice: `StartzielForm`, new `route-intent` helper/tests, dedicated evidence/script, own docs. `OrtSuche` was not edited. `#543` transport/controller contracts were reused, not rewritten. Guest storage, TripPlanner, DB/Auth/provider/model files were not touched. Global `docs/ACTIVE_WORK_STATUS.md` was left to PR #574.

## 2. Truth rules

- No Place ID is minted from text.
- Whole-input search proof precedes conjunction/comma split.
- 503/malformed search does not segment.
- Empty/dangling segments refuse the whole intent; they do not keep `Lima` from `Lima und`.
- Queue advance happens only after an explicit `OrtSuche` selection.
- Final navigation happens only on `Reise planen` after `startzielIntentAbsendenPruefen`.
- Duplicate phrases remain separate occurrences.

## 3. UX / a11y

Hero colors, citrus submit, and compact chip review are unchanged. Queue status uses one `role=status` live region. Loading uses `aria-busy` plus quiet text, not a second live region. The search stack was lifted (`z-40`) so the mobile list is not trapped under the submit button. Keyboard confirmation uses existing combobox arrows/Enter. Physical-device acceptance is still open.

## 4. Known residual

- A compound country name inside a larger already-split list (for example `Bosnien und Herzegowina, Kroatien`) is not re-proven per segment against the API. Whole-input proof covers the task examples. A later slice could add per-segment whole-place checks if TL wants that extra protection.
- Chromium harness is not a real-device PASS.
- Full-repo `eslint .` still reports many inherited warnings in unrelated files.

## 5. Verdict

Ready for independent Technical-Lead exact-head review of the freeze SHA. **Not Ready. Not merged. No follow-up slice.**
