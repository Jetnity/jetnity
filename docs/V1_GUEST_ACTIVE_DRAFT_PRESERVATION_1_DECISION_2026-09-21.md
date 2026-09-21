# V1 Guest Active Draft Preservation 1 — Implementation decision

Date: 21 September 2026  
Agent: **Jetnity V1 guest active draft preservation 1**, Generation 1  
Session: `bc-7b2ee7bd-2aa2-4b83-bbf0-4d88eb19bfad`  
Model: Cursor Grok 4.6 High Fast

## Decision

Treat a present but unreadable/invalid active v3 key as **occupied capacity**, not free space. Ordinary reads and rejected creates must leave raw active / legacy / queue bytes identical. Creation is blocked until a later observation sees confirmed absence or a valid trip.

## Alternatives rejected

1. **Repair / migrate invalid active onto valid legacy** — this is the reproduced defect (three writes/deletes). Forbidden.
2. **New storage key or backup copy** — out of scope; would invent recovery data.
3. **Throw from `gastspeicherLaden`** — would break every read-only guest consumer. Loader keeps `{ aktiv: null, warteschlange }` and create-specific state lives in the gate / create contract.
4. **Let signed-in create inspect guest localStorage** — account create stays independent.

## Consequences

- `aktiveGastreiseVorpruefen()` remains the single read-only observation.
- Loader skips legacy normalization when the active key is occupied-unusable or the storage getter/getItem fails.
- Both persistence functions recheck at write time.
- `/planen` distinguishes pending, invalid and unavailable from the existing valid one-trip gate.
- Generic list/CTA surfaces may still see `aktiv: null` for unreadable bytes; that is an accepted residual, not a silent “no draft” create authorization.
