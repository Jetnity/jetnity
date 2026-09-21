# Jetnity – V1 Guest Active Draft Preservation 1 STATUS

Stand: 21. September 2026  
Status: **GP-R1/R2/R3 IMPLEMENTED / AUTHORIZED MAIN MERGED / DRAFT / NOT READY / NOT MERGED**

Issue: #530  
Draft PR: #532  
Branch: `fix/v1-guest-active-draft-preservation-1`  
Binding task: `docs/V1_GUEST_ACTIVE_DRAFT_PRESERVATION_1_TASK_2026-09-21.md`  
Seed: `9292ac5eb587acb5256cff156ac8cf2ecf326766`  
Original baseline main: `e818c13ed009932bc06be1382a89467866699995`  
Authorized integrated main: `65db24b6dda2ab0830b88fa749838ee298e243a0` (merge, not rebase)

Cursor-Agent: **Jetnity V1 guest active draft preservation 1**, Generation 1  
Required and actual model: **Cursor Grok 4.6 High Fast** (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-7b2ee7bd-2aa2-4b83-bbf0-4d88eb19bfad`

Traveller context: not relevant. No citizenship, document or residence collection.

---

## 1. Residual closed

`gastspeicherLaden` no longer migrates valid legacy onto a present invalid/unreadable active key. Both create persistence functions reject that slot. `/planen` and action-time guards treat a **missing active + valid legacy** draft as occupied without calling the loader. Invalid/unavailable stay distinct. 360/200% gate headings reflow inside the viewport.

## 2. Behaviour

| Active v3 key | Loader | Create gate / action-time | /planen |
| --- | --- | --- | --- |
| Absent, no valid legacy | existing | create allowed | form |
| Absent + valid legacy | existing migration if a loader runs | `besteht` / block before model/place/create | one-trip gate, title from occupancy |
| Valid | existing | `GastreiseBestehtFehler` / same-id Ablegen retry | existing one-trip gate |
| Malformed / schema-invalid / empty / primitive / JSON null | `{ aktiv: null }` shape, **zero writes** | `ungueltig` | invalid alert + recheck, no continue |
| Getter/getItem throws | empty shape, **zero writes** | `speicher_unlesbar` | unavailable alert + recheck |
| Active absent, Legacy getItem throws | empty shape, **zero writes** | `speicher_unlesbar` | unavailable alert + recheck |
| No window / not yet observed | empty shape | reject | pending / not a free slot |

Signed-in create never inspects guest localStorage. PlanenCreateGate no longer calls `gastspeicherLaden()` for the title.

## 3. Local gates on the integrated tree

| Gate | Result |
| --- | --- |
| focused gastspeicher + create-entry + preservation | **144/144 pass** |
| `npm test` | **3706/3706 pass** |
| `npm run typecheck` | **PASS** |
| `npm run lint` | **PASS** (0 errors; 139 warnings, unchanged class) |
| `npm run build` | **PASS** |
| `check:dead` / `exports` / `deps` / `api-schutz` / `schema-bezug` | **PASS** |
| mounted handler proof | legacy inject **and** active-absent + Legacy getItem throw: **0** model/place/create, no writes |
| 360/200% capture | viewport PNGs **360×800**; document/section/heading widths ≤ 360; overflowX false |

Exact-head CI / Auth / Vercel IDs belong in the PR receipt after this freeze commit.

## 4. Smallest expansion / residual

- `lib/trips/uebernahme.test.ts` fixture only (TL-authorized). No adoption runtime change.
- `GastCreateLink` (unowned) still calls `gastspeicherLaden()` for guest CTA rewrite. A first paint with missing-v3 + valid legacy may therefore migrate under the **existing** loader contract. The create gate and both mounted handlers do not. Invalid+legacy remains zero-write. Smallest later expansion if TL wants page-level zero-write for valid legacy: switch that nav helper to the read-only occupancy API. Not edited here.

## 5. Next step

**STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW.** No Ready. No merge of this PR. No follow-up slice.
