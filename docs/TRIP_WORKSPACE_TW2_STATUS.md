# Jetnity – Trip Workspace TW-2 Status

Stand: 25. August 2026  
Status: **Runtime umgesetzt / Draft / STOPP für unabhängigen Technical-Lead-Re-Review**

## Steuerung

- Agent: `Trip workspace audit architecture`
- Branch: `feat/trip-workspace-tw2-overview`
- Draft-PR: #58
- Basis: `origin/main` @ `8faf135e1e15145f787a9ab9449aa09c81d61760` nach kontrollierter Docs-Synchronisation
- Historische Branch-Erzeugung: `5eed1baf01b3dc787269bb94f9bd23358a17d983`
- TW-1: PR #56 gemergt, `02b166e652f046d41f6e5b8d292e980369ca255e`
- ADR: `docs/ADR_0164_TRIP_WORKSPACE_TW2_OVERVIEW.md`
- Auftrag: `docs/TRIP_WORKSPACE_TW2_TASK.md`

## Ziel

TW-2 verdichtet ausschließlich die bestehende Reise-Wahrheit zu einer schnellen, ruhigen Reiseübersicht. Kein neuer persistierter Gesamtstatus, kein Shadow-Lifecycle, kein TW-4.

## Umgesetzt

Runtime:

- `lib/trips/uebersicht.ts`
- `components/trips/TripWorkspace.tsx`
- `components/trips/TripWorkspaceKopf.tsx`
- `components/trips/TripWorkspaceUebersicht.tsx`

Tests:

- `lib/trips/uebersicht.test.ts`

Wiederverwendete Ableitungen:

- `bereichStatus` / `planStatus` für Coverage- und Plantexte
- `reiseGruppe` (AP-3) für date-only Lage
- `heutigesDatum` für den Geräte-Kalendertag
- `party[]` nur als Personenanzahl; sonst ehrlich `Angaben noch offen`

Nicht umgesetzt und nicht vorgetäuscht:

- kein `trips.status`-Write / kein neuer Lifecycle
- kein `Jetzt wichtig` (TW-4)
- keine Timeline (TW-3)
- keine Safety-/Seasonal-Orchestrierung
- keine Traveller Registry / Citizenship-Defaults

## Self-Review

- **Truth:** jede Übersichtszeile kommt aus Graph oder vorhandener Coverage-Funktion.
- **Lifecycle:** Lage = `reiseGruppe`; undatiert nie vergangen/abgeschlossen.
- **Unknown:** `nicht vollständig bestimmbar` zählt nicht als belegt.
- **Guest/Account:** dieselbe Ableitung, Ablage nur im Kopf-Badge.
- **Citizenship:** `uebersichtPersonen` liest keine Citizenships/Dokumente.
- **Device parity:** TW-1-Shell unverändert; Kopf/Übersicht dieselbe Logik.
- **Scope:** kein TW-3/TW-4, keine DB/RLS/Auth/Provider-Änderung.

## Offene Risiken

- Safety-/Seasonal-Stille im Produktpfad bleibt TW-4.
- Budget bleibt sekundär im Desktop-Kopf, ist keine neue Wahrheit.
- `trips.status` existiert weiter als persistiertes Feld; TW-2 schreibt und zeigt es nicht als Overview-Lage.

## Nächster Schritt

Unabhängiger ChatGPT/Technical-Lead-Re-Review von Draft-PR #58. Kein TW-3, kein TW-4, keine besonderen Product-Owner-Gates eigenmächtig öffnen.
