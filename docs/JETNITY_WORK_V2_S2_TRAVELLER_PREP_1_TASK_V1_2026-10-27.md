# V2-S2 Traveller and Preparation Clarity 1 — IMMUTABLE TASK V1
Date 27 October 2026 (Europe/Zurich). Tracking #1049; parent #1046.
Exact main d31a16afdac5e97d4b02f4cb5824f5adc290577c, tree df19ecca084c0ee9d4fc0b22314f2254f86e743a, mode NORMAL, branch fix/v2-s2-traveller-prep-1.
One logical writer **Jetnity V2 Traveller and Preparation Clarity 1 — Cursor Generation 1**. REQUIRED genuine grok-4.7-high-fast, verify cursor-cloud run-info.originalModelName, session/name/link before implementation, NO Auto or fallback.

## Owner authorized Work V2 synthetic findings (F04 P2, F10/F11 P3)
- F04 two-person trip with only first person partially filled: header changes to "1 Reisende Person" while preparation/flights still count2. lib/trips/uebersicht.ts:uebersichtPersonen erroneously prefers party.length over Trip.travellers. The stored headcount is the total, the party list may be partial profiles. Header must show **2 Reisende**; provide separately factual completeness if reliable, never assume/copy sensitive documents.
- F11 components/trips/Reisevorbereitung.tsx incorrectly shows MEHRERE_REISENDE_HINWEIS for 1-person trip. Condition only on actual headcount>1; for ambiguous inconsistent party snapshots remain honest.
- F10 components/trips/EigeneReisevorbereitung.tsx only reveals existing "Offen / Erledigt / Nicht relevant" under "Titel bearbeiten". Show clearly named "Status ändern" or direct accessible state toggle, preserve existing save / optimistic feedback / async guards and focus.

## Exclusive path ownership
lib/trips/uebersicht.ts + nearest unit tests; components/trips/TripWorkspaceKopf.tsx only if needed for text; components/trips/Reisevorbereitung.tsx and EigeneReisevorbereitung.tsx plus close tests and bounded mounted/browser harness; task docs PLAN/STATUS/HANDOFF/SELF_REVIEW. Do NOT mutate lib/readiness/party.ts, identity/auth registry, account SQL, Trip.travellers/party persisted data, Guest storage/CTA/nav (#1050), night/hotel/audit (#1048), timeline/day write (#1047), native Activity/GetYourGuide (#1043), CI, providers, secrets.

Acceptance synthetic headcounts [2, 0/1/2 profiles], [1 person with 1 profile], mismatched data fail honest; neither nested personal data nor citizenship used to derive total. Status keyboard accessible at320/390 and CSS root32px, old status unchanged until explicit save, failure/pending/retry/concurrent isolation; no auto marking. Guest/Account read parity; no social personal records or browser/CUA.
Do not turn on Official Truth; no #917 SQL; no payments, public launch; USD100 cap.
Author must publish exact MODEL/SESSION in PLAN before edits, then code/focused/full tests/Preview/R1 handoff in Draft PR and STOP. DO NOT mark Ready, merge, or auto-followup.