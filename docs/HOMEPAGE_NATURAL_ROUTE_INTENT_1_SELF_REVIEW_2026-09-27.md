# Homepage Natural Route Intent 1 — SELF-REVIEW

Date: 2026-09-27  
Status: **AGENT SELF-REVIEW ONLY / NOT TECHNICAL-LEAD PASS**  
Agent: Jetnity homepage natural route intent 1, Generation 1  
Session: `bc-fe25bf01-3d21-4b29-8b9f-81743491d7d7`  
Required and actual model: Cursor Grok 4.6 High Fast (`originalModelName=cursor-grok-4.6-high-fast`)

## 1. Ownership

Runtime stayed inside the assigned slice: `StartzielForm`, `route-intent` helper/tests, dedicated evidence/script, own docs. `OrtSuche` was not edited. `#543` transport/controller contracts were reused, not rewritten. Guest storage, TripPlanner, DB/Auth/provider/model files were not touched. Global `docs/ACTIVE_WORK_STATUS.md` was left to PR #574 and arrived on this branch only by merging `main@35ea0655`.

## 2. Truth rules

- No Place ID is minted from text.
- Whole-input search proof precedes any split.
- After that refusal, each strong-separator block is proven again before a conjunction split.
- 503/malformed search — whole input or per block — does not guess-split that span.
- `Bosnien und Herzegowina und Kroatien` becomes two proven phrases or an honest clarification. It never becomes three destinations.
- Empty/dangling segments refuse the whole intent; they do not keep `Lima` from `Lima und`.
- Queue advance happens only after an explicit `OrtSuche` selection.
- Final navigation happens only on `Reise planen` after `startzielIntentAbsendenPruefen`.
- Duplicate phrases remain separate occurrences.

## 3. UX / a11y

Hero colors, citrus submit, and compact chip review are unchanged. Queue status uses one `role=status` live region. Loading uses `aria-busy` plus quiet text, not a second live region. Keyboard confirmation uses existing combobox arrows/Enter. Physical-device acceptance is still open.

## 4. Known residual

- Conjunction-only strings with three or more parts and no unique proven compound cover refuse and ask for commas. That is intentional, not a silent 3-way split.
- A compound name the local `public.places` search cannot prove is kept intact (fail-closed) rather than guessed.
- Chromium harness is not a real-device PASS.
- Full-repo `eslint .` still reports many inherited warnings in unrelated files.
- Exact-head GitHub CI/Auth/Preview on this persist SHA were not yet terminal when this file was written.

## 5. Verdict

Ready for independent Technical-Lead exact-head re-review of the freeze SHA. **Not Ready. Not merged. No follow-up slice.**
