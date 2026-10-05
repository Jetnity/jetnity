# ChatGPT Technical Lead – E5-B1 Trust-Boundary Blocker Closed

Stand: 31. August 2026  
Status: **CLOSED / NOT MERGED / SECURITY PRECHECK BLOCKED / NO RUNTIME CHANGE / LIVE-EVIDENCE WINS**

## 1. Zweck

Dieser Checkpoint dokumentiert den vollständig geprüften Abbruch des ersten E5-B1-Ansatzes **Entry Requirements E5-B1 – Trusted Airport Timezone Provenance**.

Der Slice wurde nicht wegen eines Implementierungsfehlers im engeren Sinn geschlossen, sondern weil der Technical Lead nach Dispatch eine bestehende Datenbank-/Trust-Grenze gefunden und anschließend live in Supabase Production verifiziert hat, die eine zentrale Persistence-Annahme des Tasks invalidiert.

**Kein Code aus PR #328 ist in `main` gelangt.**

## 2. Verifizierter Baseline-Main

Zum Closure-Zeitpunkt:

`main@6928ea637133ff91cfb207cfd5b1175fecbc9699`

Commit:

`Close Entry Requirements E5-A continuity (#326)`

Live GitHub Actions auf diesem SHA:

- CI Run `33404116202` / #1491;
- Status: **SUCCESS**.

Ruleset:

- `Jetnity main protection`;
- ID `21875372`;
- Enforcement: **active**;
- PR erforderlich;
- Conversation Resolution erforderlich;
- strict required checks;
- `Typecheck, Lint & Build`;
- `Auth-Konfiguration gegen config.toml`;
- `Vercel`;
- merge-only;
- bypass leer.

## 3. Verworfener Slice

Issue:

- #327 – `Entry Requirements E5-B1 – trusted airport timezone provenance`;
- Status: **CLOSED / not_planned**.

Draft PR:

- #328 – `Entry Requirements E5-B1 – trusted airport timezone provenance`;
- Status: **CLOSED / NOT MERGED**.

Branch:

`feat/entry-requirements-trusted-timezone-e5b1-2026-08-31`

Binding Task des verworfenen Ansatzes:

`docs/ENTRY_REQUIREMENTS_TRUSTED_AIRPORT_TIMEZONE_E5B1_TASK_2026-08-31.md`

Logical Cursor Agent:

**`Jetnity entry requirements trusted event time 1`**, Generation 1

Cursor Background-Agent-Session:

`bc-c0a4c448-2029-4b3a-8746-53985c8ca2e0`

Der Agent hatte den Auftrag bereits angenommen. Der TL-STOP wurde gepostet, bevor der Technical Lead wusste, dass der Agent zeitgleich bereits einen Runtime-Commit erzeugt hatte.

Verworfener Agent-Head:

`fdf05f26928dfc556cc3b3b954eb3c61981b29c4`

Commit:

`feat: carry trusted airport timezone provenance through flight and route truth`

Dieser Head ist **Review-Evidence only**. Er darf nicht als implementierter Produktstand, PASS oder zukünftige Merge-Basis interpretiert werden.

## 4. Warum der ursprüngliche Task invalidiert wurde

Der Task nahm an, dass eine serverseitig nachgewiesene Flight-Timezone in `trip_items.metadata.routeItinerary` geschrieben und beim späteren DB-Read als **trusted server-proven timezone truth** wieder eingelesen werden könnte.

Diese Annahme ist falsch, solange dieselbe Persistenzfläche vom authentifizierten Owner direkt beschreibbar ist.

### 4.1 Repository-Evidence

Das bestehende Trip-Schema gewährt `authenticated` auf `public.trip_items`:

- SELECT;
- INSERT;
- UPDATE;
- DELETE.

Die bestehenden RLS-Policies erlauben Owner-INSERT und Owner-UPDATE, solange `user_id = auth.uid()` gilt.

RLS schützt damit Ownership, aber **nicht die Provenance jedes einzelnen Metadata-Feldes**.

Ein Owner-Client kann folglich ein syntaktisch gültiges Timezone-Feld in einer grundsätzlich beschreibbaren Metadata-Nutzlast behaupten. DB-Herkunft allein macht dieses Feld nicht provider-belegt.

### 4.2 Production-live Supabase-Evidence

Supabase Production wurde nach dem Blocker ausschließlich read-only geprüft.

Projekt:

`qscbgcdmivbbnzrcyegn` / `Jetnity's Project`

Region:

`eu-central-2`

Status beim Check:

`ACTIVE_HEALTHY`

Live `public.trip_items`:

- RLS: **enabled**;
- FORCE RLS: false;
- Policy `trip_items_anlegen`: authenticated INSERT, `WITH CHECK user_id = auth.uid()`;
- Policy `trip_items_aendern`: authenticated UPDATE, `USING` + `WITH CHECK user_id = auth.uid()`;
- authenticated hat live `INSERT`, `UPDATE`, `SELECT`, `DELETE` auf der Tabelle.

Damit ist der Repository-Befund **Production-live bestätigt**.

### 4.3 Bestehender Route-Metadata-Guard

Production-live existiert weiterhin:

`public.trip_items_route_itinerary_schuetzen()`

Der Trigger kanonisiert bei Flight-INSERT/Metadata-UPDATE die `routeItinerary` über:

`public.flug_route_itinerary_metadata(...)`.

Die live verifizierte Funktion baut Segmente derzeit ausschließlich mit:

- origin;
- destination;
- departureDate;
- departureTime;
- arrivalDate;
- arrivalTime.

Timezone-Felder werden nicht in das kanonische Ergebnis übernommen.

Das bedeutet zusätzlich: Selbst ein serverseitiger TypeScript-Write mit Timezone würde durch die derzeitige DB-Kanonisierung **nicht lossless persistiert**.

## 5. Bestehende server-owned Provenance-Schicht

Der Precheck fand eine bereits existierende getrennte Relation:

`public.trip_item_commercial_provenance`

mit kontrollierter interner Write-Naht:

`jetnity_internal.trip_item_commercial_provenance_schreiben(...)`.

Production-live wurde bestätigt:

- SECURITY DEFINER;
- internes Schema;
- kein allgemeiner direkter authenticated Write auf die Provenance-Relation;
- der Vertrag ist jedoch ausschließlich auf Commercial-Provenance ausgelegt.

Diese Schicht ist wichtige Architektur-Evidence für das Muster **server-owned provenance beside user-owned trip item**, darf aber nicht still für Timezone/Event-Truth zweckentfremdet werden.

Reuse heißt hier: Muster und Sicherheitsprinzip wiederverwenden, nicht fachfremde Commercial-Spalten überladen.

## 6. Bewertung des Agent-Codes aus #328

Der verworfene Head enthielt mehrere grundsätzlich nützliche Ideen als Review-Evidence:

- Duffel strukturiertes Airport-`time_zone` am Adapter lesen;
- keine IATA-/Country-/City-/Offset-Inferenz;
- lokale Flight-Uhrzeit unverändert lassen;
- bounded timezone syntax reader;
- Browser-/Guest-Parsing und trusted parsing trennen;
- Legacy timezone-less itinerary kompatibel halten;
- Fingerprint/Chronologie timezone-neutral halten.

Diese Ideen sind **nicht automatisch angenommen**.

Materieller Blocker des Heads:

`itineraryAusMetadata()` wurde zu einem trusted-timezone Reader gemacht, obwohl `trip_items.metadata` eine owner-beschreibbare Persistenzfläche ist.

Damit hätte ein Owner-Client eine syntaktisch akzeptierte Timezone in dieselbe Metadata-Struktur schreiben und sie anschließend durch den Trusted-Metadata-Reader adeln lassen können, sofern sie die DB-Kanonisierung passiert oder diese später erweitert worden wäre.

Das verletzt die bindende Truth-Regel.

## 7. Neue bindende Trust-Regel

> **Persisted does not mean provider-proven.**

Für Jetnity gilt ab diesem Checkpoint:

> Ein Feld darf nur dann als server-/provider-belegte Provenance gelesen werden, wenn seine gesamte Write-Authority-Kette diese Herkunft technisch erzwingt. Owner-RLS allein beweist Ownership, nicht Provider-Provenance.

Daraus folgt:

- keine Trusted-Timezone aus einer allgemein owner-beschreibbaren Trip-Metadata-Fläche;
- kein `trusted*Reader` allein aufgrund des Speicherorts;
- Provenance benötigt eine server-owned oder kryptografisch/vertraglich gleichwertig gesicherte Write-Grenze;
- DB-Trigger/Kanonisierung ist Teil der Truth-Architektur und muss vor Persistenzannahmen geprüft werden;
- jeder zukünftige server-owned Provenance-Store ist Security-/DB-Scope und muss als eigener bounded Slice behandelt werden.

## 8. Was NICHT verändert wurde

Durch #327/#328 wurde nicht verändert:

- `main` Runtime;
- Supabase Schema oder Policies;
- Production Daten;
- RLS;
- Auth/MFA/AAL;
- Requirements Provider;
- Duffel Secrets oder Runtime-Aktivierung;
- Kosten;
- Event Resolver;
- E5-A Binding;
- Deadline-/Task-/Reminder-Runtime;
- Credential Ranking.

`requirementsProviderAus()` bleibt `null`.

## 9. Product-Owner-Gate

Ein späterer Slice, der eine **persistente trusted timezone/event provenance** einführt und dafür:

- neue Production-Relationen;
- Migrationen;
- Trigger-/RLS-/Grant-Änderungen;
- SECURITY DEFINER / server-owned Write Authority;
- reale Production-Datenwirkung

benötigt, fällt in das besondere Product-Owner-Gate für Production Migration / RLS / Ownership / Security.

Er darf nicht still in einen normalen Feature-Slice eingebaut werden.

Ein rein flüchtiger provider-neutraler Flight-Contract, der explizites Provider-`time_zone` nur während derselben serverseitig belegten Response trägt und **nicht als trusted persisted truth wieder einliest**, kann separat ohne dieses DB-Gate geprüft werden.

## 10. Nächster zulässiger Precheck

Kein automatischer Folgeslice.

Vor einem neuen Runtime-Slice:

1. finalen `main`, offene PRs/Issues, CI/Vercel erneut live prüfen;
2. diesen Checkpoint lesen;
3. #328 ausschließlich als verworfene Review-Evidence behandeln;
4. prüfen, ob der kleinste sichere Schritt wirklich nur **ephemeral provider-observed airport timezone evidence** im Flight-Adapter/Contract sein soll;
5. ausdrücklich sicherstellen, dass dieser Schritt weder `trip_items.metadata` noch einen anderen owner-beschreibbaren Store als trusted persisted provenance nutzt;
6. bestehende Flight-/Route-Schemas auf untrusted injection und backward compatibility prüfen;
7. keinen Event-Instant/UTC/DST-Resolver im selben Slice bauen;
8. wenn persistente server-owned Provenance erforderlich wird: STOPP am Product-Owner-Gate.

## 11. Continuity

Dieser Checkpoint ersetzt die vorbereitenden E5-B1-Aussagen des geschlossenen PR #328 als kanonische Technical-Lead-Entscheidung.

Der verworfene Branch/Head bleibt erhalten, damit Review-Evidence nicht verloren geht, ist aber **nicht** der aktive Entwicklungsstand.

**Live-Evidence gewinnt immer.**
