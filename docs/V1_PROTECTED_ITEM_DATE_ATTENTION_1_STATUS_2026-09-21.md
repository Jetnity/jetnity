# V1 Protected Item Date Attention 1 — Status

Stand: 21. September 2026  
Status: **IMPLEMENTED / FROZEN FOR INDEPENDENT TL REVIEW / DRAFT / NOT READY / NOT MERGED / AUTHOR SELF-REVIEW ONLY**

## Arbeitsblock / Ziel

Accepted #509 TA-R2: after a trip date shift preserves a commercial `startsOn`, show a useful deterministic mismatch on the existing Jetzt-wichtig surface. Do not rewrite the date.

## Branch / PR / heads

| Item | Value |
| --- | --- |
| Branch | `fix/v1-protected-item-date-attention-1` |
| Issue | #519 |
| Draft PR | #520 |
| Assigned baseline | `main@1103407ba2a9e5fa76f4a8e588ab210934b955e3` |
| Task seed | `408b5ee99c3f74485950e9b86fcfdcd3b95ffd49` |
| Product tree used for screenshots | **`948ad2fcffd7cc170feebd19fe0a94baed54fc72` (clean)** |
| Re-read `origin/main` before handoff | `1103407ba2a9e5fa76f4a8e588ab210934b955e3` — **no drift**; this branch is ahead only with this slice |
| Agent | **Jetnity V1 protected item date attention 1**, Generation 1 |
| Model | Cursor Grok 4.6 High Fast (`originalModelName=cursor-grok-4.6-high-fast`) — no Auto |
| Session | `bc-47c25f91-3af3-43ff-ab82-5c5c2fee04ae` |

Exact freeze SHA belongs in the freeze PR comment. Screenshot provenance is the clean product tree above; later docs/evidence files do not change `lib/trips/attention.ts`.

## Behaviour

- Signal `item.date_mismatch`, `ebene: item`, `lage: stale`, `schwere: bald`, `aktion: null`, id `item.date_mismatch:<itemId>`.
- Emitted only when `istKommerziell` is true, the item sits on an existing owning day, and both `startsOn` and `dayDate` are valid calendar dates that differ.
- Canonical protection unchanged: provider, booking link, external ref, any price including `0`, or `bookingStatus === 'booked'`.
- Missing, invalid, or unassigned dates are not this mismatch. Non-commercial moved dates and same-date protected items stay silent.
- Active mismatch sets `leerstand: null` (no all-clear). Rank 22 keeps it after named same-severity signals and never above `blockierend` safety-critical.
- German copy names the item and both human dates. No field names, internal ids, expiry or provider-cancellation claim.
- Pure projection: input graph is not mutated.

## Scope held

Written only:

- `lib/trips/attention.ts`
- `lib/trips/attention.test.ts`
- `lib/trips/protected-item-date-attention.test.ts`
- own `docs/V1_PROTECTED_ITEM_DATE_ATTENTION_1_{TASK,STATUS,HANDOFF,SELF_REVIEW}_2026-09-21.md`
- own `docs/evidence/v1-protected-item-date-attention-1/`

Not written: apply engine, `istKommerziell`, schema/types, workspace components, navigation contract, Admin, storage, package/lockfile, workflows, `ACTIVE_WORK_STATUS.md`.

Traveller context is not relevant. No citizenship/document/credential collection.

## Author-run gates (not TL PASS)

| Check | Result |
| --- | --- |
| shift/apply/protection/attention focused | **PASS** (including +7 and startDate shift-to-attention) |
| `lib/trips/detail.test.ts` + datum-anzeige | **48/48 PASS** |
| `npm run typecheck` | **PASS** |
| `npm run lint` | **PASS** (0 errors; 138 pre-existing warnings) |
| `npm test` | **3621/3621 PASS** on `948ad2fc` |
| `npm run build` | **PASS** |
| `check:dead` / `exports` / `deps` / `api-schutz` / `schema-bezug` | **PASS** |
| synthetic render 390 / 1024 | **PASS** on clean `948ad2fc`; actual `TripWorkspaceJetztWichtig` + compiled `styles/globals.css` (104346 bytes) |

No live provider, model, account or DB probe. Exact-head CI / Auth / Preview IDs belong in the freeze PR comment.

## Sicherheit / Kosten

No secrets, paid calls, DB/Auth/RLS mutation, provider activation or new running cost.

## Next step

**ChatGPT / Technical Lead** independent exact-head review of the freeze SHA. Cursor does not Ready, merge, or start a follow-up.
