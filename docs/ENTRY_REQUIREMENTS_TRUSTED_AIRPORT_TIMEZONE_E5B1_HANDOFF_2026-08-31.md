# Entry Requirements Trusted Airport Timezone E5-B1 – Handoff

Stand: 31. August 2026  
Status: **STOPPED / TL PRE-IMPLEMENTATION BLOCKER / KEIN RUNTIME / KEIN READY / KEIN MERGE / KEIN E5-B2**  
Cursor-Agent: **`Jetnity entry requirements trusted event time 1`**, Generation 1  
Session: `bc-c0a4c448-2029-4b3a-8746-53985c8ca2e0`  
Issue: [#327](https://github.com/Jetnity/jetnity/issues/327)  
Branch: `feat/entry-requirements-trusted-timezone-e5b1-2026-08-31`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/328 — **CLOSED / NOT MERGED**

> Ein Git-Commit kann seinen eigenen finalen SHA nicht im Tree tragen. Exact Head + Ahead/Behind stehen live im Branch, nicht self-embedded.

## Zuerst lesen

1. Technical-Lead-Kommentar `5480369184` auf PR #328 (PRE-IMPLEMENTATION STOP)
2. `docs/ENTRY_REQUIREMENTS_TRUSTED_AIRPORT_TIMEZONE_E5B1_TASK_2026-08-31.md`
3. `docs/ENTRY_REQUIREMENTS_TRUSTED_AIRPORT_TIMEZONE_E5B1_STATUS_2026-08-31.md`
4. `docs/ENTRY_REQUIREMENTS_TRUSTED_AIRPORT_TIMEZONE_E5B1_SELF_REVIEW_2026-08-31.md`
5. `JETNITY_START_HERE.md`
6. `docs/ACTIVE_WORK_STATUS.md` — TL-owned, von diesem Agenten nicht geändert

## Was ein neuer Chat wissen muss

E5-B1 ist **nicht** geliefert. Der Binding Task ist in seiner Persistence-Annahme ungültig, bevor Runtime zulässig ist.

Harte Wahrheiten aus dem TL-Precheck:

1. Ownership-RLS auf `trip_items` ist **keine** Write-Authority für server-proven Hard Truth.
2. `authenticated` darf eigene `trip_items` direkt `insert`/`update`/`delete` (`20260817120000_reiseschema.sql`).
3. `metadata` ist deshalb client-beschreibbar. Ein Timezone-Feld dort ist nicht allein durch Persistenz trusted.
4. Zusätzlich verwirft `flug_route_itinerary_metadata` unbekannte Segmentfelder, darunter jede Timezone, bei jedem Trigger-Write.
5. Eine Integrity-/Write-Boundary, Signatur, Migration oder RLS-Änderung ist **nicht** E5-B1 und nicht still einzuführen.
6. `docs/ACTIVE_WORK_STATUS.md` bleibt TL-owned.
7. Der Technical Lead recuttet den Slice. Dieser Agent startet keinen Folgeslice und kein Alternativdesign.

## Session-Abweichung

Live Evidence: STOP-Kommentar `5480369184` und PR-Close kamen, nachdem diese Session bereits mit der ursprünglichen Dispatch-Anweisung `5480278824` intern implementiert hatte.

Diese Session hat den STOP nicht vor dem Runtime-Push gelesen und hat `fdf05f26928dfc556cc3b3b954eb3c61981b29c4` nach `origin` geschoben. Das verletzt den Blocker.

Korrektur derselben Generation-1-Session: Revert `998f1f55`. Kein Generation-2-Auftrag, kein neuer Slice, kein Ersatzdesign.

## Duplicate-/Integration-Entscheidung (nur Audit, kein Bau)

Vor dem STOP geprüft und danach nicht verbaut:

| Baustein | Befund |
| --- | --- |
| `lib/flights/domain.ts` / `zeit.ts` | lokale Wall-Clock; kein Instant |
| `lib/flights/duffel/antwort.ts` | strukturiertes Airport-Objekt ohne `time_zone` |
| `lib/route/schema.ts` | untrusted vs trusted nur für `surfaceFromAirportCode` |
| `itineraryAusMetadata` | war untrusted; ein trusted Metadata-Read würde Client-Writes adeln |
| `flug_route_itinerary_metadata` | rebuild ohne Extra-Felder |
| `trip_items` Grants/Policies | Owner-Client kann metadata direkt schreiben |

Genau dieser letzte Punkt invalidiert den geplanten Trusted-Metadata-Read.

## Nicht angefasst nach STOP

Keine bleibende Runtime. Keine Migration. Keine RLS. Keine Signatur. Keine Secrets. Kein Provider. Kein E5-A-Aufruf. Kein E5-B2. `ACTIVE_WORK_STATUS.md` unverändert.

## Residuals

- Slice muss nach vollständigem Trust-Precheck neu geschnitten werden.
- Jede spätere Persistenz braucht eine Write-Boundary, die Client-`metadata` von server-proven Timezone trennt. Das ist nicht dieser Auftrag.
- Historischer Runtime-Head `fdf05f26` bleibt in der Git-Historie sichtbar, gilt aber nicht als Delivery.

## Nächster Schritt

Unabhängiger Technical-Lead-Recut. Dieser Agent stoppt vollständig. Nicht Ready. Nicht mergen. Kein Folgeslice.
