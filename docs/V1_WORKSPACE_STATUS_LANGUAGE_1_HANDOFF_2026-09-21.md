# V1 Workspace Status Language 1 — Handoff

Stand: 21. September 2026  
Status: **STOP FOR INDEPENDENT TECHNICAL-LEAD CODE AND VISUAL/INTERACTION REVIEW / KEIN READY / KEIN MERGE / KEIN FOLGE-SLICE**

Binding task: `docs/V1_WORKSPACE_STATUS_LANGUAGE_1_TASK_2026-09-21.md`  
Detailed status: `docs/V1_WORKSPACE_STATUS_LANGUAGE_1_STATUS_2026-09-21.md`  
Self-review: `docs/V1_WORKSPACE_STATUS_LANGUAGE_1_SELF_REVIEW_2026-09-21.md`  
Matrix: `docs/evidence/v1-workspace-status-language-1/wording-matrix.md`

---

## 1. Where the work lives

| | |
| --- | --- |
| Issue | #525 |
| Draft PR | #526 |
| Branch | `fix/v1-workspace-status-language-1` |
| Assigned dispatch base | `main@4278cd047b907b218fe64c122c4eed7dd61e0a7e` |
| Dispatch seed | `f6372928b994c6ac00dac8fc82deee0a856a2376` |
| Product tree for screenshots | `7a143fecdf0647bfa059653f96cc8c1eca5d6656` (clean) |
| Re-read `origin/main` | `4278cd047b907b218fe64c122c4eed7dd61e0a7e` — matches baseline; behind 0 |
| Agent | Jetnity V1 workspace status language 1, Generation 1 |
| Session | `bc-d6388e7d-7896-4902-a4d0-efd5dcbe4cce` |
| Required model | Cursor Grok 4.6 High Fast (`originalModelName=cursor-grok-4.6-high-fast`) |

Exact freeze SHA is in the STOP PR comment on this head.

## 2. What a reviewer should verify first

1. Diff vs baseline is only the named copy sources, matching tests, this prefix’s docs/evidence and the own audit script. No planner/Feld, types, Auth, DB, package or global-continuity edit.
2. `bereichStatus` / `attentionAbleiten` / `gapDetailAbleiten` still emit the same lagen, counts, ids, actions and `sucheAnbietbar`. Only strings changed.
3. Unknown is not mapped to “noch nicht gewählt” or `known_gap`. “Anbieter folgt” is absent.
4. Gap eyebrow is not a blanket “Lücke”. Optional activities and covered-by-flight stay non-required.
5. `#520 item.date_mismatch` title/signal/aktion remain. Official/safety/seasonal titles were not globally replaced.
6. Canonical summaries still come from `flug-abdeckung` / `naechte-abdeckung` / `kanten`. No localized-string parser.
7. Screenshots are synthetic guest + intercepted unavailable, compiled product CSS, bound to a clean product SHA. Not Preview, not real-device, not Safari.
8. This self-review is not Technical-Lead PASS.

## 3. What this slice does not mean

- Bestand panels in `FlugBestand` / `UnterkunftBestand` / `MobilitaetBereich` still contain older “bestimmbar” sentences. They are out of this exclusive ownership.
- Parallel #528 owns manual planner / Feld layout. Do not merge/rebase siblings here.
- Covered-by-flight is still not invented from a same-date flight title. The new Hinweis copy is only used when that existing field is true.
- Source/unit/synthetic-browser proof is not authenticated E2E.

## 4. Next Cursor/Guardian action

**STOP FOR TECHNICAL-LEAD REVIEW.** No Ready. No merge. No follow-up slice.  
Guardian was not required at dispatch. Reassess only if TL finds a material Truth/Auth risk.
