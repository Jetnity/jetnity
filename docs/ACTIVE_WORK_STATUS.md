# Jetnity – Active Work Status

Stand: 31. August 2026  
Status: **CURRENT / E5-A CLOSED / E5-B1 BLOCKER CLOSED / E5-B1R PREPARED / AGENT DISPATCH PENDING / LIVE-EVIDENCE WINS**

## 1. Aktueller Main

Baseline beim E5-B1R-Task-Cut:

`main@7fdd06f983a47afbbb28313479adf4e81fb9a359`

- PR #329 E5-B1 Trust-Boundary Closure: MERGED;
- Main CI #1497 / Run `33409025821`: SUCCESS;
- Vercel Production: SUCCESS;
- Ruleset `Jetnity main protection` / ID `21875372`: active, strict Required Checks, Conversation Resolution, merge-only, bypass leer.

Letzter abgeschlossener Runtime-Slice bleibt E5-A. Der Merge #329 war docs-only.

## 2. Aktiver vorbereiteter Slice

Issue:

**#330 – Entry Requirements E5-B1R – ephemeral provider-observed airport timezone evidence**

Branch:

`feat/entry-requirements-ephemeral-timezone-evidence-e5b1r-2026-08-31`

Binding Task:

`docs/ENTRY_REQUIREMENTS_EPHEMERAL_PROVIDER_TIMEZONE_E5B1R_TASK_2026-08-31.md`

Fresh logical Cursor Agent:

**`Jetnity entry requirements provider timezone evidence 1`**, Generation 1

Session: **noch nicht belegt / Dispatch pending**.

## 3. E5-B1R Truth-Grenze

Ziel ist ausschließlich eine **flüchtige serverseitige Companion-Evidence** am aktiven FlightProvider-Port.

Timezone wird nicht Teil von:

- `FlugSegment`;
- `FlugOption`;
- Ranking-/Client-Option;
- Browser-Antwort;
- Route-Itinerary;
- Trip-/Route-Metadata;
- Account-Adoption / `flugNachweis`;
- Supabase.

Evidence muss exakt an normalisierte Option + Leg + Segment + Endpoint + IATA gebunden sein.

Duffel darf sie nur aus dem strukturierten Airport-Endpunkt mit explizitem `time_zone` erzeugen. Kein IATA-/Country-/City-/Name-/Offset-Fallback.

Die Search-Orchestrierung gibt diese Evidence in E5-B1R nicht an den Browser weiter.

## 4. Fresh Precheck

Geprüft gegen aktuellen Main:

- `lib/flights/provider.ts` ist die aktive Runtime-Provider-Naht;
- Duffel endet in dieser Naht;
- `FlugOption` und Client-Contract sind timezone-frei und bleiben es;
- kein bestehender timezone-evidence Contract/Resolver gefunden;
- `lib/providers/flights/*` ist eine separate Offline-/Fixture-Readiness-Schicht und wird nicht als zweites Runtime-System erweitert;
- kein DB-/Route-/Account-Scope erforderlich.

## 5. Verworfener erster Versuch

Issue #327: CLOSED / not_planned.  
PR #328: CLOSED / NOT MERGED.  
Verworfener Head: `fdf05f26928dfc556cc3b3b954eb3c61981b29c4`.

Dieser Stand ist ausschließlich Review-Evidence und wird nicht cherry-picked.

Logical Agent damals:

**`Jetnity entry requirements trusted event time 1`**, Generation 1  
Session `bc-c0a4c448-2029-4b3a-8746-53985c8ca2e0`.

## 6. Bindende Provenance-Regel

Der Production-live geprüfte erste Blocker bleibt bindend:

> **Persisted does not mean provider-proven.**

Owner-beschreibbare Trip-Metadaten dürfen nicht allein wegen ihres Speicherorts als Provider-Provenance gelesen werden.

Eine spätere persistente Timezone/Event-Provenance benötigt eine technisch erzwungene server-owned Write-Grenze und wird als eigener DB-/Security-Slice behandelt.

## 7. Entry Requirements Gesamtstand

Provider-neutral vorhanden:

- S4-R1 Truth Ops;
- E1 Detail Contract;
- E2 Official Actions;
- E3 Visitor Checklist;
- E4 Official Temporal Rules;
- R1 Workspace Integration;
- E5-A Exact Event-Instant Projection Core.

Weiterhin nicht aktiv:

- echter Requirements Provider;
- persistente trusted Timezone/Event-Provenance;
- Local-Time+IANA→absolute Instant;
- DST Resolver;
- Trip/Route→Event-Occurrence Resolver;
- E5-A Auto-Bind;
- Deadline/Urgency/Task/Reminder/Notification Runtime;
- Credential Ranking.

`requirementsProviderAus()` bleibt `null`.

## 8. Traveller Truth

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Account Registry = wiederverwendbare aktuelle Traveller-Fakten. Trip Snapshot = einzige Current Truth für die konkrete Reise.

Kein Default-/Primary-/Preferred-/Chosen-Pass, keine Residence→Nationality-Inferenz, Issuer Country ≠ Citizenship.

## 9. Product-Owner-Gates

E5-B1R löst kein besonderes PO-Gate aus: keine Migration/RLS/Auth/Secrets/Provideraktivierung/paid calls/Persistenz/neue Infrastrukturkosten.

Sobald persistente server-owned Timezone/Event-Provenance erforderlich wird: STOPP am Production-DB/Security-Gate.

## 10. Nächste Aktion

1. Vorbereitungsbranch gegen `main@7fdd06f...` prüfen;
2. vor Agent-Dispatch nur Task + TL-Continuity zulassen;
3. Draft-PR zu #330 öffnen;
4. fresh Agent `Jetnity entry requirements provider timezone evidence 1` starten;
5. Agent liefert Runtime + Status/Handoff/Self-Review + Gates und stoppt;
6. Technical Lead reviewed den exakten finalen Head unabhängig;
7. kein Folgeslice automatisch.

**Live-Evidence gewinnt immer.**
