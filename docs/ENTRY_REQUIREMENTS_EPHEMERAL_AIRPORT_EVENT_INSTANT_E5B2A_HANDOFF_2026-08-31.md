# Entry Requirements E5-B2A – Ephemeral Airport Event Instant – Handoff

Stand: 31. August 2026  
Status: **STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW / KEIN READY / KEIN MERGE / KEIN E5-B2B**  
Cursor-Agent: **`Jetnity entry requirements airport event instant 1`**, Generation 1  
Session: `bc-2f16caec-271e-4911-ac36-5abc36ab0806`  
Issue: [#334](https://github.com/Jetnity/jetnity/issues/334)  
Branch: `feat/entry-requirements-airport-event-instant-e5b2a-2026-08-31`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/335

> Ein Git-Commit kann seinen eigenen finalen SHA nicht im Tree tragen. Exact Head + Ahead/Behind stehen live im PR, nicht self-embedded.

## Zuerst lesen

1. `docs/ENTRY_REQUIREMENTS_EPHEMERAL_AIRPORT_EVENT_INSTANT_E5B2A_TASK_2026-08-31.md`
2. `docs/ENTRY_REQUIREMENTS_EPHEMERAL_AIRPORT_EVENT_INSTANT_E5B2A_STATUS_2026-08-31.md`
3. `docs/ENTRY_REQUIREMENTS_EPHEMERAL_AIRPORT_EVENT_INSTANT_E5B2A_SELF_REVIEW_2026-08-31.md`
4. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B1R_CLOSED_2026-08-31.md`
5. Issue #334 und Parent #294

`docs/ACTIVE_WORK_STATUS.md` und `JETNITY_START_HERE.md` sind Technical-Lead-owned und wurden vom Agenten nicht geändert.

## Was ein neuer Chat wissen muss

E5-B2A aktiviert **keinen** Provider, persistiert **keine** Zeit und bindet **nicht** an E5-A.

Harte Wahrheiten:

1. `FlugSegment`, `FlugOption`, `BewerteteFlugOption` und der Browser-Contract bleiben timezone- und instant-frei.
2. Instant-Evidence lebt nur als Companion-Arrays `airportEventInstantEvidence` / `airportEventInstantIssues` am serverseitigen `FlugProviderTreffer`.
3. Einzige erlaubte Zone ist die bereits gemintete E5-B1R-`FlugAirportTimezoneEvidence`.
4. Vor der Rechnung wird Evidence erneut gegen `optionId` + `legIndex` + `segmentIndex` + Endpoint + IATA geprüft.
5. Departure liest ausschließlich `origin` + `departureDate`/`departureTime`. Arrival liest ausschließlich `destination` + `arrivalDate`/`arrivalTime`.
6. DST-Lücke → `nonexistent_local_time`. DST-Overlap → `ambiguous_local_time`. Kein earlier/later/compatible.
7. Nur genau ein beobachteter UTC-Instant darf als `...Z` erscheinen. Kein `Z` an lokale Strings, kein `Date.parse`.
8. Ungültige/unauflösbare Evidence verwirft kein sonst gültiges Offer.
9. Das Angebots-Cap filtert Timezone-Evidence zuerst; Instant-Evidence entsteht nur für behaltene Optionen.
10. `fluegeSuchen()` reicht keine der beiden Evidence-Arten an Ranking oder `sucheFuerClient()`.
11. Herkunft gilt durch den Codepfad, nicht durch ein Payload-Label `trusted` / `providerProven` / `source`.
12. **Persisted does not mean provider-proven.** Keine Trip-/Route-Metadata, kein Supabase.
13. Keine neue npm-Dependency. `package.json` ist unverändert.
14. `requirementsProviderAus()` bleibt `null`.

## Duplicate-/Integration-Entscheidung

| Baustein | Entscheidung |
| --- | --- |
| `lib/flights/provider.ts` | aktive Runtime-Naht; Contract hier erweitert |
| `lib/flights/airport-event-instant.ts` | neue, integrierte Resolution; vom Duffel-Adapter aufgerufen |
| `lib/flights/airport-timezone.ts` | unverändert wiederverwendet; kein zweiter Identifier-Validator |
| `lib/flights/zeit.ts` | Ortszeit ohne Zone; nicht als Instant-Parser missbraucht |
| `lib/flights/domain.ts` / `schema.ts` / `client-sicht.ts` | bewusst unverändert (Schema nur Test-Evidence) |
| `lib/readiness/temporal-projection.ts` | E5-A bleibt unverbunden |
| `lib/providers/flights/*` | offline/fixture foundation; keine zweite Runtime-Welt |

## Dateien

Runtime:

- `lib/flights/provider.ts`
- `lib/flights/airport-event-instant.ts`
- `lib/flights/duffel/adapter.ts`
- `lib/flights/suche.ts` (Discard-Kommentar; keine Evidence-Weitergabe)

Tests:

- `lib/flights/airport-event-instant.test.ts`
- `lib/flights/duffel/adapter.test.ts`
- `lib/flights/suche.test.ts`
- `lib/flights/schema.test.ts`

Delivery-Docs:

- dieser Handoff
- Status
- Self-Review

Nicht angefasst: `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md`, `lib/route/*`, `lib/trips/*`, `lib/readiness/temporal-projection.ts`, `supabase/*`, `scripts/db/*`, `lib/providers/*`, `package.json`.

Die Diffs von `JETNITY_START_HERE.md` / `docs/ACTIVE_WORK_STATUS.md` gegen `main` stammen aus den TL-Vorbereitungscommits, nicht aus dieser Agenten-Session.

## origin/main vor Handoff

Erneut gelesen: `origin/main` = `f7ccdc5b98ce933b06c216135be7c4f4b08f8222`.  
Merge-Base identisch. Behind: 0. Ahead vor Docs-Commit: 4.

Kompletter Diff gegen `origin/main` (Namen):

- `JETNITY_START_HERE.md` (TL)
- `docs/ACTIVE_WORK_STATUS.md` (TL)
- `docs/ENTRY_REQUIREMENTS_EPHEMERAL_AIRPORT_EVENT_INSTANT_E5B2A_TASK_2026-08-31.md` (TL)
- `lib/flights/provider.ts`
- `lib/flights/airport-event-instant.ts`
- `lib/flights/airport-event-instant.test.ts`
- `lib/flights/duffel/adapter.ts`
- `lib/flights/duffel/adapter.test.ts`
- `lib/flights/suche.ts`
- `lib/flights/suche.test.ts`
- `lib/flights/schema.test.ts`

plus die drei Agent-Delivery-Docs nach diesem Commit.

## Residuals

- Instant-Evidence hat in diesem Slice keinen E5-A-Konsumenten.
- Overlap-Stunden bleiben fail-closed ohne Instant; Provider-Offsets in Rohstrings werden nicht als zweite Zone benutzt.
- Kein Browser-/Real-Device-Abnahmebeweis, weil keine UI.
- CI/Vercel auf Runtime-Head `3d645041` waren grün; der Docs-Commit erzeugt einen neuen Head und invalidiert diese Exact-Head-Evidence.
- Folgeslice nur nach TL-PASS und neuem versionierten Auftrag.

## Nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review auf dem **neuen** Head. Nicht Ready. Nicht mergen. Kein E5-B2B/Resolver-Persistenz/E5-A-Bindungs-Start.
