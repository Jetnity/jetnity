# Jetnity – V1 Guest Active Draft Preservation 1 STATUS

Stand: 21. September 2026  
Status: **IMPLEMENTED / FROZEN SOURCE+DOCS PENDING THIS COMMIT / DRAFT / NOT READY / NOT MERGED**

Issue: #530  
Draft PR: #532  
Branch: `fix/v1-guest-active-draft-preservation-1`  
Binding task: `docs/V1_GUEST_ACTIVE_DRAFT_PRESERVATION_1_TASK_2026-09-21.md`  
Seed: `9292ac5eb587acb5256cff156ac8cf2ecf326766`  
Baseline main: `e818c13ed009932bc06be1382a89467866699995`

Cursor-Agent: **Jetnity V1 guest active draft preservation 1**, Generation 1  
Required and actual model: **Cursor Grok 4.6 High Fast** (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-7b2ee7bd-2aa2-4b83-bbf0-4d88eb19bfad`

Traveller context: not relevant. No citizenship, document or residence collection.

---

## 1. Residual closed

`gastspeicherLaden` no longer migrates valid legacy onto a present invalid/unreadable active key. Both create persistence functions reject that slot. `/planen` blocks honestly. The correction fixtures simulate external repair instead of create-over-invalid.

## 2. Behaviour

| Active v3 key | Loader | Create APIs | /planen |
| --- | --- | --- | --- |
| Absent | existing legacy migration | create allowed | form |
| Valid | existing | `GastreiseBestehtFehler` / same-id Ablegen retry | existing one-trip gate |
| Malformed / schema-invalid / empty / primitive / JSON null | `{ aktiv: null }` shape, **zero writes** | `GastreiseUnbrauchbarFehler` | invalid alert + recheck, no continue |
| Getter/getItem throws | empty shape, **zero writes** | `GastspeicherUnlesbarFehler` | unavailable alert + recheck |
| No window / not yet observed | empty shape | reject | pending / not a free slot |

Signed-in create never inspects guest localStorage.

## 3. Gates (implementation head `58cf2e3f` plus later test/docs commits)

| Gate | Result |
| --- | --- |
| focused gastspeicher + create-entry + preservation + uebernahme | **188/188 pass** |
| `npm test` | **3683/3683 pass** |
| `npm run typecheck` | **PASS** |
| `npm run lint` | **PASS** (0 errors; 139 warnings after unused-import cleanup) |
| `npm run build` | **PASS** |
| `check:dead` / `exports` / `deps` / `api-schutz` / `schema-bezug` | **PASS** |
| synthetic `/planen` Chromium | invalid / unavailable / retry / valid gate; rawEqual true; mutations 0/0 |

Exact-head CI / Auth / Vercel IDs belong in the PR receipt after freeze.

## 4. Smallest expansion

`lib/trips/uebernahme.test.ts` fixture only. Reported here; no adoption runtime change.

## 5. Next step

**STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW.** No Ready. No merge. No follow-up slice.
