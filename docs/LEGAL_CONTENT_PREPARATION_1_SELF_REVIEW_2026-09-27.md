# Legal content preparation 1 — Self-review

Date: 27 September 2026
Logical agent: **Jetnity legal content preparation 1**
Generation: **1**
Session: `bc-efbd2a0c-d64b-4e37-b054-b7c583cabdac`
This self-review is not Technical-Lead PASS.

## Scope check

Writable set required by the task:

1. `docs/LEGAL_CONTENT_PREPARATION_1_REPORT_2026-09-27.md`
2. `docs/LEGAL_CONTENT_PREPARATION_1_DRAFTS_2026-09-27.md`
3. `docs/LEGAL_CONTENT_PREPARATION_1_STATUS_2026-09-27.md`
4. `docs/LEGAL_CONTENT_PREPARATION_1_HANDOFF_2026-09-27.md`
5. `docs/LEGAL_CONTENT_PREPARATION_1_SELF_REVIEW_2026-09-27.md`

The TASK file and `docs/ACTIVE_WORK_STATUS.md` were not edited. No `app/`, `lib/`, `components/`, `supabase/`, package, or CI file was edited.

The delivery commit’s file list is confirmed in the #578 comment after `git diff` against the seed. The correction commit is the same five files only. Its file list is confirmed in the correction comment.

## Model

run-info returned `grok-4.7`. The continuation instruction says that selection plus this run-info value is enough, and that the missing High Fast suffix is not a stop. Work continued only after that instruction. No other model was substituted by this writer. The agent display name was not renamed from this session; renaming was not available as a verified action.

## Claim checks

| Claim | Result |
| --- | --- |
| Visitor drafts say they are not approved and do not claim DSG/DSGVO conformity | Pass. Drafts §§A–B open with that label. No conformity sentence was added. |
| No invented retention, transfer tool, or VAT status | Pass. Decision list leaves them open. UID has no MWST suffix. |
| Quota cookie is not described as set on every page view | Pass. Report §2.4 and supplement tie it to the active model-quota path. |
| OpenAI, Duffel, and hotel search are not described as live Production processors | Pass. They are fail-closed code paths plus unknown current flags. |
| Passport numbers are not described as stored | Pass. Traveller tables and rejected input keys are cited. |
| Gate A domain facts are attributed to comment 5850986944, not re-tested here | Pass. Class `live-recorded`. |
| Generated policy wording is attributed to comment 5851278348, not to screenshots this writer opened | Pass. Drafts §C.1. |
| PrivacyBee public pages are dated | Pass. Fetched 27 September 2026. URLs are in Drafts §C.2. |
| Preview is not proposed as a second legal domain | Pass. Report §4.3 and §4.7. |
| `/terms` stays unresolved | Pass. Report §5 and decision 10. |
| Empty vendor widget is specified as an error | Pass. Report §4.4. |
| Line citations exist in the tree | Re-checked after the correction. Result in the #578 comment. A line in range does not prove the sentence’s interpretation. |
| R1 model transfer is in the matrix and in visitor variant B2 | Pass against the cited modules. B2 is outside the default article because Production activation is last recorded off. |
| R2 editorial notes are outside the visitor article | Pass. Section B names Supabase and Vercel. OAuth, checkbox, and banner-template notes are editorial. |
| R3 closures are not rewritten as unknown | Pass. Decision 8 points at the recorded closures. No fresh catalog read is claimed. |
| R4 scan miss is not a removal instruction | Pass. §C.2 keeps Vercel, does not invent analytics, and cites Diensterkennung for manual entries. |
| R5 banner is not a launch prerequisite | Pass. Report §5.4. Publication still requires the legal-basis, retention, transfer, and vendor-contract approvals in §5.3. Adjacency is an inference, not an ALB 4.4 prohibition, and not a blocker for a widget-off spec. |

## Weak points a reviewer should press

1. `account_visits` is last recorded as applied. The migration header is older. This correction follows the later record and does not call it a fresh catalog read. A reviewer who wants a newer observation than 27 September 2026 still needs a separate catalog read. This slice did not do one.
2. The last recorded Production model state can be stale. Section B therefore does not say the public site currently sends text to OpenAI or sets `jetnity_gast`. Section B2 is the visitor text for the case where a fresh read shows the path is on.
3. The public license page title “PrivacyBee Deutschland” is unresolved against PrivacyBee AG. It is recorded, not repaired.
4. Whether the vendor objects to Jetnity text beside a live widget is still an open clarification. It is an inference from ALB 4.4, not an established prohibition. It does not block a static, widget-off Preview specification. A live widget still stays off while sections 8.1–8.3 are false.
5. Register still linking to `/terms` is called out so a later `/privacy` slice does not look like all legal routes exist.
6. This writer did not re-fetch jetnity.com during the dossier or this correction. If the live noindex state changed after comment 5850986944, this report would not show it. The correction comment includes a fresh `origin/main` read only, not a new Production browse.

## Not claimed

No Ready, no merge, no PASS, no legal approval, no runtime evidence, no cost change.
