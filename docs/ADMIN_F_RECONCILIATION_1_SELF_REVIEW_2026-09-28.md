# Admin F Reconciliation 1 — Self-review

Date: 2026-09-28
Cursor-Agent: **Jetnity admin F reconciliation 1**, Generation 1
This file is the author’s self-review. It is not an independent Technical-Lead PASS.

## Attempts to refute the verdict

| Attack | Result |
| --- | --- |
| The palette was rebuilt or drifted after #545 | Refuted for the named files. `git diff --exit-code` against `43720a65` exited 0. See `docs/evidence/admin-f-reconciliation-1/source-diff.txt`. |
| `sucheFolgt` still disables search | Refuted in current `lib/admin/ehrliche-zustaende.ts`. The key is gone. Top bar search is a real trigger. The dashed control is Copilot Pro. |
| Filtering was described as authorization | Guarded in the report. `filterAdminNav` and `adminNavIstNurUx` say UX only. Server `requireAdminPage` remains the gate. Tests still assert that hiding Nutzer does not imply a server block. |
| Fresh tests were skipped and called green | Unit log says 24 pass, 0 fail, 0 skipped. Harness log says 12 pass. Both files are in the new evidence directory. |
| Historical evidence was overwritten | The harness copy wrote JSON only under `docs/evidence/admin-f-reconciliation-1/` and screenshots under `/opt/cursor/artifacts/`. `git status` did not show edits under `docs/evidence/admin-navigation-search-1/`. The copy was deleted before commit. |
| Signed-in or device proof was implied | Report and notes refuse that claim. R3 is a stub prop, not production prefetch. |
| Seed CI on `ef866098` was reused as the delivery gate | Refused. Delivery CI belongs to the commit that contains these files. |
| The remaining-build map was silently rewritten | §0 supersession plus markers. The old F sentences remain readable. AP-8, AP-9, AP-11, AP-12, Admin E and Billing-P1 rows were not reclassified. |
| A next slice was started | No. Assessment only. |
| Allowlist was exceeded | Intended writes are the four reconciliation docs, `docs/evidence/admin-f-reconciliation-1/**`, the dated F notes in the remaining-build map and D–K audit, and the targeted pointers in the five navigation files. |

## Model and collision limits

`originalModelName=grok-4.7` is tool evidence. “High Fast” and “visibly selected” are dispatch statements, not a second field from `run-info`. I do not claim the API returned High Fast.

I re-listed open pull requests with `gh pr list`. I did not browse the Cursor session list myself. No-overlapping-writer remains the Technical Lead’s bounded observation plus that GitHub list, not absolute knowledge of every writer.

## Non-blocking observation

The visible shortcut label is always `Strg+K`, while `isAdminNavSearchShortcut` also accepts Meta+K. Behaviour matches the accepted #545 tests. I did not change it.

## Not proven

Full `npm ci`, repository-wide tests, production build, signed-in Admin, physical device, and exact-head CI/Auth/Vercel of the delivery commit at the time this self-review was written. Those GitHub checks must be read on the delivery SHA after push. A green result on `ef866098` does not count.

## Stop

No Ready. No merge. No follow-up dispatch.
