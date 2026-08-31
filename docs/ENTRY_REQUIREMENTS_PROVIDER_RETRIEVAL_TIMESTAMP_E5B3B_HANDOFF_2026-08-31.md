# Entry Requirements E5-B3B – Server-observed Provider Retrieval Timestamp – Handoff

Stand: 31. August 2026  
Status: **STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW / KEIN READY / KEIN MERGE / KEIN FOLGESLICE**  
Cursor-Agent: **`Jetnity entry requirements provider retrieval timestamp 1`**, Generation 1  
Session: `bc-1b857acd-7a88-4355-9bc1-4f94ece44f9b`  
Issue: [#343](https://github.com/Jetnity/jetnity/issues/343)  
Branch: `feat/entry-requirements-provider-retrieval-time-e5b3b-2026-08-31`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/344

> Ein Git-Commit kann seinen eigenen finalen SHA nicht im Tree tragen. Exact Head + Ahead/Behind stehen live im PR, nicht self-embedded.

## Zuerst lesen

1. `docs/ENTRY_REQUIREMENTS_PROVIDER_RETRIEVAL_TIMESTAMP_E5B3B_TASK_2026-08-31.md`
2. `docs/ENTRY_REQUIREMENTS_PROVIDER_RETRIEVAL_TIMESTAMP_E5B3B_STATUS_2026-08-31.md`
3. `docs/ENTRY_REQUIREMENTS_PROVIDER_RETRIEVAL_TIMESTAMP_E5B3B_SELF_REVIEW_2026-08-31.md`
4. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B3A_CLOSED_2026-08-31.md`
5. Issue #343 und Parent #294

`docs/ACTIVE_WORK_STATUS.md` und `JETNITY_START_HERE.md` sind Technical-Lead-owned und wurden vom Agenten nicht geändert.

## Was ein neuer Chat wissen muss

E5-B3B aktiviert **keinen** Provider, persistiert **keine** Zeit und mintet **kein** Flight-Event-Provenance-Objekt.

Harte Wahrheiten:

1. `FlugSegment`, `FlugOption`, `BewerteteFlugOption` und der Browser-Contract bleiben ohne Retrieval-/Observation-Felder.
2. `retrievedAt` lebt nur als required Companion-Fakt am serverseitigen `FlugProviderTreffer`.
3. Semantik: Jetnity-Serverzeit des erfolgreich gelesenen Provider-Snapshots. Kanonisches UTC-ISO mit `Z`.
4. Der Wert darf nicht aus Duffel-/Browser-Payload, Airport-Daten oder einem ähnlich benannten Feld stammen.
5. Der aktive Duffel-Adapter mintet erst nach `ok`-HTTP **und** erfolgreichem `json()`. HTTP 500/401/403/Timeout/unlesbares JSON liefern keinen Treffer.
6. Ungültiges Mapping nach gelesenem JSON liefert ebenfalls keinen erfolgreichen `FlugProviderTreffer`, auch wenn die Uhr schon getickt hat.
7. Production nutzt `() => new Date()` ohne neue Infrastruktur. Tests dürfen eine feste `DuffelAdapterUhr` injizieren.
8. `fluegeSuchen()` reicht nur `treffer.options` an `optionenBewerten(...)`. `sucheFuerClient(...)` bekommt kein `retrievedAt`.
9. Serialisierte `FlugSucheAntwort` enthält weder `retrievedAt` noch `retrieved_at` noch `observedAt`/`observed_at`.
10. E5-B1R Timezone-Evidence und E5-B2A Instant-Evidence/Issues bleiben unverändert funktionsfähig, inklusive Angebots-Cap.
11. Leere Evidence ändert den Timestamp-Vertrag nicht: der Treffer hat trotzdem genau ein `retrievedAt`.
12. **Persisted does not mean provider-proven.** Keine Trip-/Route-Metadata, kein Supabase-Write.
13. Keine neue npm-Dependency. `package.json` ist unverändert.
14. `flugNachweisAusUmgebung()` und `requirementsProviderAus()` bleiben `null`.

## Duplicate-/Integration-Entscheidung

| Baustein | Entscheidung |
| --- | --- |
| `lib/flights/provider.ts` | aktive Runtime-Naht; required `retrievedAt` hier ergänzt |
| `lib/flights/duffel/adapter.ts` | einzige Mint-Seam; Clock-Port nur als optionaler dritter Parameter |
| `lib/flights/duffel/factory.ts` | unverändert; Default-Clock reicht |
| `lib/flights/suche.ts` | Discard-Grenze bewusst beibehalten |
| `lib/flights/domain.ts` / `schema.ts` / `client-sicht.ts` | bewusst unverändert (Schema nur Test-Evidence) |
| `lib/commercial-provenance/persistenz.ts` | nur Pattern gelesen; kein Runtime-Pfad |
| `lib/providers/flights/*` | zweite Provider-Welt; nicht berührt |
| E5-B3A SQL | unverändert; kein Apply, kein Writer |

## Dateien

Runtime:

- `lib/flights/provider.ts`
- `lib/flights/duffel/adapter.ts`
- `lib/flights/suche.ts` (Discard-Kommentar; keine Evidence-/Timestamp-Weitergabe)

Tests:

- `lib/flights/duffel/adapter.test.ts`
- `lib/flights/suche.test.ts`
- `lib/flights/schema.test.ts`

Delivery-Docs:

- dieser Handoff
- Status
- Self-Review

Nicht angefasst: `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md`, `lib/flights/domain.ts`, `lib/flights/schema.ts`, `lib/flights/client-sicht.ts`, `lib/flights/airport-event-instant.ts`, `lib/route/*`, `lib/trips/*`, `lib/readiness/*`, `app/api/*`, `supabase/*`, `scripts/db/*`, `types/supabase.ts`, `lib/providers/*`, `lib/commercial-provenance/*`, `package.json`.

Die Diffs von `JETNITY_START_HERE.md` / `docs/ACTIVE_WORK_STATUS.md` gegen `main` stammen aus den TL-Vorbereitungscommits, nicht aus dieser Agenten-Session.

## origin/main vor Handoff

Erneut gelesen: `origin/main` = `ad7fb1fa5d0bd6ac3fe2a7085a65fb8d56cecbb8`.  
Merge-Base identisch. Behind: 0. Ahead vor Docs-Commit: 4.

Kompletter Diff gegen `origin/main` (Namen) vor Docs-Commit:

- `JETNITY_START_HERE.md` (TL)
- `docs/ACTIVE_WORK_STATUS.md` (TL)
- `docs/ENTRY_REQUIREMENTS_PROVIDER_RETRIEVAL_TIMESTAMP_E5B3B_TASK_2026-08-31.md` (TL)
- `lib/flights/provider.ts`
- `lib/flights/duffel/adapter.ts`
- `lib/flights/duffel/adapter.test.ts`
- `lib/flights/suche.ts`
- `lib/flights/suche.test.ts`
- `lib/flights/schema.test.ts`

plus die drei Agent-Delivery-Docs nach diesem Commit.

Agent-Diff gegen Pre-agent-Head `d3baa9c7...` (ohne TL-Docs):

- `lib/flights/provider.ts`
- `lib/flights/duffel/adapter.ts`
- `lib/flights/duffel/adapter.test.ts`
- `lib/flights/suche.ts`
- `lib/flights/suche.test.ts`
- `lib/flights/schema.test.ts`

## Residuals

- `retrievedAt` hat in diesem Slice keinen Persistenz-Konsumenten.
- Host-Uhr ist die einzige Observation-Quelle. Kein NTP, kein zweiter Clock-Service.
- Ein späterer Mint muss genau diesen Snapshot-Zeitpunkt nach `retrieved_at`/`observed_at` übernehmen und darf keinen neuen `Date.now()` erfinden.
- Kein Browser-/Real-Device-Abnahmebeweis, weil keine UI.
- Lokale Gates auf Runtime-Head `09d5c0e0` waren grün; der Docs-Commit erzeugt einen neuen Head und invalidiert diese Exact-Head-Evidence.
- Folgeslice nur nach TL-PASS und neuem versionierten Auftrag.

## Nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review auf dem **neuen** Head. Nicht Ready. Nicht mergen. Kein Persistence-Mint / Runtime-Principal / Production-Apply.
