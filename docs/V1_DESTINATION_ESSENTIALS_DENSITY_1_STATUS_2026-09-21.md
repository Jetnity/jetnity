# V1 Destination Essentials Density 1 — Status

Stand: 21. September 2026  
Status: **FROZEN FOR INDEPENDENT TL REVIEW / DRAFT / NOT READY / NOT MERGED / AUTHOR SELF-REVIEW ONLY**

## Arbeitsblock / Ziel

Accepted #506 VUX-5: collapse repeated absent-evidence sentences ONLY when every destination and every domain is genuinely `keine_evidence` with no details, links or incompleteness contradiction. One honest disclosure plus a compact ordered destination/date list. Mixed/material/unknown/stale/unavailable/contradictory input keeps the existing full rendering.

## Branch / PR / heads

| Item | Value |
| --- | --- |
| Branch | `fix/v1-destination-essentials-density-1` |
| Issue | #521 |
| Draft PR | #522 |
| Assigned baseline | `main@1103407ba2a9e5fa76f4a8e588ab210934b955e3` |
| Task seed | `866fbce054cd8a5369c4b06a2421109d6302dbf3` |
| Implementation head used for evidence | `6f8cd923be97eb93c5b7d2cf5f92f8c6a7f20c44` (clean) |
| Live origin/main at freeze fetch | `1103407ba2a9e5fa76f4a8e588ab210934b955e3` — **matches assigned baseline; 0 behind / 2 ahead before this freeze commit** |
| Snapshot-stale local `origin/main` at session start | `19a91a2594127eb2b6104b68da69786194e13865` — discarded after live fetch; not integrated |
| Agent | **Jetnity V1 destination essentials density 1**, Generation 1 |
| Model | Cursor Grok 4.6 High Fast (`cursor-grok-4.6-high-fast`) — no Auto / no substitution |
| Session | `bc-f4bf1e77-e22d-45b8-a15e-deed1bbbc1d8` |
| UI session rename | **unknown** — no evidence this environment can rename the Cursor UI session |

Exact freeze SHA belongs in the freeze PR comment. A later evidence/docs commit on top of `6f8cd923` does not re-run the visual harness.

## Implemented

- Compact empty fast path in `components/trips/TripWorkspaceDestinationEssentials.tsx`
- Emptiness from canonical `lage === keine_evidence` plus `unvollstaendig === false` and empty details/links. `hatHinweise` is not the decision.
- One reuse of `DESTINATION_ESSENTIALS_LEERTEXT` naming Einreise, Sicherheit and Reisezeit once
- Compact ordered `<ol>` of existing destination/date labels; stage ids stay distinct
- Full per-stage/per-domain path unchanged for mixed/material/uncertain/contradictory input
- Focused render tests: `lib/trips/destination-essentials-density-1.test.ts`
- Existing `lib/trips/destination-essentials.test.ts` derivation suite unchanged and green
- Synthetic compiled-CSS harness + screenshots under `docs/evidence/v1-destination-essentials-density-1/`

## Local gates (author-run, not TL PASS)

| Check | Result |
| --- | --- |
| focused density + derivation tests | PASS |
| `npm run typecheck` | PASS |
| `npm run lint` | 0 errors / 138 pre-existing warnings |
| `npm test` | PASS **3623 / 3623** |
| `check:dead` / `check:exports` / `check:deps` / `check:api-schutz` / `check:schema-bezug` | PASS |
| `npm run build` | PASS (Next.js 16.3.3) |
| harness | PASS; height 390 **-498.5px**, 1024 **-522.5px**; overflow false; mixed keyboard details open |

## Sicherheit / Kosten

No DB/Auth/RLS, secret, provider, model, paid-call, real-account or Production-setting change. No new dependency. No sibling edit of #520 attention or #524 `/planen` composition.

## Traveller context

Not relevant for collection. Compact path does not infer citizenship/document defaults. Option-/traveller-dependent official results stay on the full path.

## Next step

**ChatGPT / Technical Lead** independent exact-head code and visual/interaction review of the freeze SHA. Cursor does not Ready, merge, or start a follow-up slice.
