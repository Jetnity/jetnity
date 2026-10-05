# Assistant Truth Context 1 – Adversarial Self-Review

Stand: 2. September 2026  
Branch: `feat/phase-1-assistant-truth-context-1`  
Issue: #425  
Draft PR: #426  
Runtime implementation head reviewed by the agent: `981d47ba250a76af576fac24d2e5888ac4caf34f`  
Rejected exact head: `42cd37fae1465c13cbec9ed2f8cd16d5c425436f`  
Technical-Lead CHANGES REQUIRED: `5093789177`  
Agent self-review is **not** Technical-Lead PASS.

This is the same logical agent/session after Technical-Lead review `5093789177`. Only those two findings were fixed.

Cursor-Agent: **`Jetnity assistant truth context 1`**  
Generation: **1**  
Session: `bc-3031160f-45b4-4186-8c4b-5f246682aa71`

## Scope fidelity

In scope:

- pure deterministic context projection
- reuse of existing Official / Traveller / Safety / Seasonal helpers
- privacy-minimized allowlisted output
- deterministic regression tests
- additive continuity / ADR-0211

Out of scope and not introduced:

- OpenAI / Modellcall / neue `Modellfunktion`
- DB / Supabase / RLS / Auth mutation
- Production activation / kill-switch change
- provider / secret / paid / live call
- trip mutation / apply
- assistant chat UI
- World Map or Destination Essentials expansion
- follow-up slice

## Truth attacks

| Attack | Result |
| --- | --- |
| Treat array order as primary/preferred citizenship or passport | Rejected. Reversed party/citizenship/document/evaluation arrays produce the same peer projection. No `primary` / `preferred` / `default` fields. |
| Infer citizenship from residence | Rejected. Residence `DE`/`FR` stays residence; citizenships stay explicit or empty. |
| Infer citizenship from issuer country | Rejected. US-issued document linked to `cit:ch` stays citizenship `CH`. Unlinked issuer `IT` stays `citizenshipCountryCode: null`. |
| Collapse destination and transit official for the same country | Rejected. Separate `scope` records. Transit uses `requirementType === 'transit'` or `transitCountryCode != null`. |
| Bind transit Official to a destination stage by country equality | Rejected after review `5093789177`. Transit `boundStageIds` stays `[]` without an explicit Transit↔Stage relation. |
| Bind destination official to a nameless/coordinate-only stage | Rejected. Reuses `destinationIstOfficialZiel`; missing country stays unbound. |
| Merge two Italy stages | Rejected. Distinct `stageId`s remain. |
| Collapse `recheck_needed` into `stale` or `current` | Rejected. Freshness is projected verbatim. Tests keep all six required states distinguishable. |
| Promote `unknown` / `unavailable` / `stale` to `not_required` | Rejected. `result`, `status` and `freshness` stay independent dimensions. |
| Treat user readiness or generated text as official | Rejected. User checklist is not an input. `generatedSuggestion` is always `[]` even if the caller smuggles suggestions. |
| Bind safety/seasonal by airport label or rejected-acute class | Rejected. Reuses Destination Essentials stage-ref helpers. |
| Invent missing route/country/credential evidence | Rejected. Missing stays missing; invalid country tokens fail closed via `landescodeLesen`. |

## Privacy / commercial attacks

| Attack | Result |
| --- | --- |
| Project passport number / MRZ / scan / biometrics / health record | Rejected. Extra input fields are ignored; serialized JSON contains none of the leak values. |
| Project email / account UUID / session token | Rejected. |
| Project booking URL / price / currency / provider raw / secret | Rejected. Official `sourceUrl`, `action.href` and evidence `provider` are omitted. |
| Project Official `contextFingerprint` / `off-v2|t=...|cit=...` operational evidence | Rejected after review `5093789177`. Fingerprint may sort internally; it is not a public field and the serialized JSON contains neither the fingerprint nor its leak marker. |
| Leak commercial trip items via `ohneTag` | Rejected. Items are not read. |
| Name an output field `provider` / `bookingUrl` / `priceAmount` | Rejected. Empty non-official classes live in `unfilledTruthClasses`, not a `provider` array. |

## Architecture attacks

| Attack | Result |
| --- | --- |
| Add a third `Modellfunktion` | Rejected. `lib/modell/` untouched. |
| Call OpenAI / change kill-switch | Rejected. |
| Add a Supabase migration or RLS change | Rejected. Diff has no `supabase/`. |
| Duplicate Official/Safety/Seasonal semantics | Rejected. Existing helpers are imported. Presentation aggregation from Destination Essentials is not copied. |
| Wire a runtime assistant UI | Rejected. No component or route. |

## Residual observations, not blockers

1. The module is test-reachable only. That is required by this slice and will fail `check:dead` only if the test import is removed.
2. Official `authority` is retained. If a future caller puts a vendor name into `authority`, that would leak through; the current official contract treats `authority` as source authority, not provider raw.
3. A later model-call slice must not treat this projection as permission to add `Modellfunktion = 'reisebegleiter'` without a separate gate-precheck.
4. Preview HTML is expected to remain Vercel-SSO protected. Exact-head Preview must be read authenticated.

## Recommendation

Technical Lead should exact-head review Draft PR #426 on the final tip after this handoff commit.  
**Do not Ready. Do not merge from this agent.**  
**STOP FOR FRESH TECHNICAL-LEAD REVIEW.**
