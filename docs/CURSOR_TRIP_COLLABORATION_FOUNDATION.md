# Cursor-Auftrag – Trip Collaboration Foundation

Stand: 21. August 2026

## Kontext und Startentscheidung

GitHub Issue #20 beschreibt den richtigen Zeitpunkt ausdrücklich als: nach stabiler Phase-3-Kernbasis, aber vor Launch-Reife/Phase 4 und bevor sich `trips.user_id` weiter als Ein-Besitzer-Annahme verankert.

Dieser Zeitpunkt ist erreicht:

- Phase 3.1 Flight Foundation ist abgeschlossen und auf `main`.
- Phase 3.2 Hotel Foundation inkl. Härtung ist abgeschlossen und auf `main`.
- Phase 3.3 Activities Foundation inkl. Browser-Audit ist abgeschlossen und auf `main`.
- Der Reisegraph besitzt eine belastbare `revision`-Logik für Reise und Kindzeilen.
- Phase 3.4 wartet extern auf einen echten Hotelprovider-Zugang.
- Phase 4 / Launch-Reife hat noch nicht begonnen.

Deshalb wird das Kollaborations-Fundament jetzt als eigener, strikt abgegrenzter Entwicklungszweig begonnen.

## Harte Grenzen

- Branch: `feat/trip-collaboration-foundation`
- Basis: `main`
- GitHub Issue: #20
- PR bleibt Draft bis unabhängiger Review und ausdrückliche Freigabe.
- Kein Merge zu `main` ohne ausdrückliche Freigabe.
- Keine Production-Migration und keine Production-Aktivierung.
- Keine neuen Secrets.
- Keine neuen kostenpflichtigen Dienste und keine laufenden Mehrkosten.
- Kein Social Network, Feed, Chat, Likes, Votes oder Gruppenprofil.
- Keine komplexe Realtime-UI in diesem Block.
- Gastreisen bleiben persönliche lokale Entwürfe; echte Kollaboration setzt Konten voraus.
- Bestehende Einzelreisen müssen vollständig rückwärtskompatibel bleiben.
- PR #27 (Trip Workspace Mobile UX) ist separat und darf nicht unnötig nachgebaut oder überschrieben werden.

## Vor Implementierung lesen

Verbindlich zuerst lesen und gegeneinander prüfen:

- `AGENTS.md`
- `JETNITY_VISION.md`
- `ARCHITECTURE.md`
- `ROADMAP.md`
- `DECISIONS.md`
- `DESIGN_SYSTEM.md`
- `JETNITY_HANDOFF.md`
- `docs/REISEN.md`
- `docs/DATENBANK.md`
- `docs/PRODUCT_QUALITY_STANDARD.md`
- `docs/CONTINUITY_STANDARD.md`
- GitHub Issue #20
- alle Migrationen rund um `trips`, `trip_stages`, `trip_days`, `trip_items`, `revision`, `reise_anlegen()` und `reise_aendern()`
- bestehende RLS-/Security-Audits unter `scripts/db/`
- bestehende Trip-Serveraktionen, Loader und Tests

Bei Widersprüchen nicht raten: im PR dokumentieren und den sichereren, rückwärtskompatiblen Weg wählen.

## Ziel dieses Blocks

Eine Reise darf architektonisch nicht mehr dauerhaft an genau einen einzigen Bearbeiter gebunden sein. Die bestehende Eigentümerschaft bleibt jedoch als rückwärtskompatible Owner-Zuordnung bestehen.

Das Ergebnis dieses Blocks ist ein serverseitig abgesichertes Kollaborations-Fundament mit:

1. Reise-Mitgliedschaften
2. Rollen `owner`, `editor`, `viewer`
3. sicheren Einladungen
4. serverseitig erzwungenen RLS-/Berechtigungen
5. rückwärtskompatiblen Einzelreisen
6. Konflikterkennung auf Basis der bestehenden `revision`
7. Realtime-ready Datenarchitektur ohne unnötige Live-Komplexität

## Architekturprinzipien

### 1. `trips.user_id` bleibt vorerst Owner-Kompatibilitätsanker

`trips.user_id` darf in diesem Block nicht entfernt oder semantisch still umgedeutet werden. Bestehende Reisen und bestehende Anwendungspfade verlassen sich darauf.

Neue Kollaboration wird additiv modelliert. Für jede bestehende Reise gilt logisch:

- `trips.user_id` = Owner
- Owner besitzt volle Schreib- und Verwaltungsrechte
- eine vorhandene Reise ohne explizite Mitgliedschaftszeile muss weiterhin funktionieren

Eine Backfill-Strategie darf als Development-Migration enthalten sein, muss aber idempotent, transaktional und vor Production separat freigegeben werden.

### 2. Mitgliedschaften sind die neue Autorisierungsbasis

Eine neue Tabelle, sinngemäß `trip_memberships`, repräsentiert Benutzerzugriff auf eine Reise.

Mindestens:

- `trip_id`
- `user_id`
- `role` mit `owner | editor | viewer`
- `created_at`
- ggf. `updated_at`
- eindeutige Mitgliedschaft pro `(trip_id, user_id)`

Owner-Invarianten müssen serverseitig geschützt werden. Insbesondere darf ein Client nicht:

- sich selbst zum Owner machen,
- den letzten Owner entfernen,
- fremde Rollen erhöhen,
- Eigentümerschaft durch direktes Update von `trips.user_id` übernehmen.

Wenn Owner-Transfer nicht für diesen Block zwingend nötig ist, nicht als Produktfeature bauen. Lieber explizit nicht unterstützen als halb sicher implementieren.

### 3. Rollenmodell

Verbindliche Mindestsemantik:

- `owner`: lesen, Reise bearbeiten, Mitglieder verwalten, Einladungen verwalten, Reise löschen
- `editor`: lesen und Reisegraph fachlich bearbeiten; keine Owner-/Mitgliederverwaltung und kein Löschen der gesamten Reise
- `viewer`: ausschließlich lesen

Berechtigungen gelten serverseitig für Reise und Kindtabellen. Client-Sichtbarkeit ist nur UX und niemals Sicherheitsgrenze.

### 4. Sichere Einladungen

Einladungen benötigen einen serverseitig verifizierbaren, nicht erratbaren Token.

Anforderungen:

- Token niemals im Klartext dauerhaft in der Datenbank speichern; nur sicherer Hash/Verifier.
- ausreichend hohe Entropie aus kryptographisch sicherer Quelle.
- Ablaufzeit (`expires_at`).
- widerrufbar.
- single-use oder eindeutig konsumierbar; Race beim Annehmen darf keine Doppelmitgliedschaft oder Rechteeskalation erzeugen.
- Einladung ist an genau eine Reise und eine Rolle gebunden.
- Einladung zum `owner` ist in diesem ersten Block nicht erlaubt.
- E-Mail kann optional als Zielhinweis gespeichert werden, darf aber ohne verifizierte Identität keine Autorisierungsgrenze darstellen.
- Annahme setzt authentifiziertes Konto voraus.
- Fehlerzustände dürfen nicht unnötig verraten, ob eine fremde Reise existiert.

Einladungslinks dürfen in diesem Block technisch vorbereitet werden. Kein externer E-Mail-Anbieter und keine neuen laufenden Kosten einführen.

### 5. RLS und Trust Boundary

RLS ist die primäre Datenbank-Sicherheitsgrenze.

Alle bestehenden Policies auf:

- `trips`
- `trip_stages`
- `trip_days`
- `trip_items`

müssen auf die neue Rollenlogik geprüft und kontrolliert angepasst werden.

Wichtig: Die Kindtabellen tragen heute `user_id` und einen zusammengesetzten FK zur Owner-Reise. Diese Denormalisierung darf nicht einfach entfernt werden, ohne sämtliche Schreibpfade und RLS-Folgen zu analysieren. Ein additiver, migrationssicherer Weg ist Pflicht.

Der Agent muss vor einer Schemaänderung explizit dokumentieren:

- wie ein Editor Kindzeilen einer Reise schreiben kann, obwohl `trip_items.user_id` etc. heute Owner-Semantik tragen,
- wie bestehende Einzelreisen weiter funktionieren,
- wie direkte PostgREST-/Supabase-Clientzugriffe serverseitig begrenzt bleiben,
- welche Funktionen `security invoker` bzw. nur in eng begründeten Fällen `security definer` sein müssen,
- wie `search_path`, Grants und EXECUTE-Rechte abgesichert sind.

Keine Security-Definer-Funktion darf als pauschaler RLS-Bypass dienen.

### 6. Revision und Konfliktstrategie

Die bestehende `trips.revision` ist die Basis für optimistische Nebenläufigkeitskontrolle.

Ziel:

- jeder fachliche Schreibvorgang basiert auf einer bekannten Revision,
- ein Write darf eine zwischenzeitlich geänderte Reise nicht still überschreiben,
- bei veralteter Revision klarer Conflict-Zustand statt Last-Write-Wins,
- bestehende Trigger, die bei Änderungen an Reise oder Kindzeilen die Revision erhöhen, bleiben die zentrale technische Grundlage.

Für neue kollaborative Mutationen soll ein expliziter Expected-Revision-Vertrag eingeführt oder die vorhandene `reise_aendern()`-Strategie konsistent wiederverwendet werden.

Nicht in diesem Block bauen:

- CRDT
- Operational Transform
- automatische Merge-Algorithmen
- komplexe Event-Sourcing-Plattform

Ein verständlicher optimistischer Konflikt mit Reload/Neuversuch ist zunächst professionell genug.

### 7. Realtime-ready, nicht Realtime-overengineered

Die Tabellen- und Änderungsstruktur soll Supabase Realtime später ermöglichen. Dafür:

- stabile Primärschlüssel
- eindeutige Mitgliedschaften
- nachvollziehbare `updated_at`/`revision`
- keine rein clientseitige Schattenzustandsarchitektur

Aber jetzt keine dauerhaften Channels, Presence, Cursor-Anzeigen oder Live-Coediting-Komplexität bauen, sofern sie nicht für einen Test zwingend benötigt werden.

## Erwartete Implementation

Der Agent soll nach Analyse selbst die kleinste sichere additive Architektur wählen. Voraussichtlich gehören dazu:

- additive Development-Migration(en) für Mitgliedschaften und Einladungen
- rollenbasierte SQL-Helfer/Policies mit sauberem Grant-Modell
- sichere serverseitige Annahme-/Widerrufswege für Einladungen
- Anpassung der Trip-Lese-/Schreibautorisierung an Owner/Editor/Viewer
- Konfliktvertrag für kollaborative Writes
- Types und Servermodule für Membership/Invitation/Permission
- DB-Security-Tests und RLS-Audit-Erweiterungen
- Unit-/Integrationstests für Rollen und Konflikte
- Dokumentation in `ARCHITECTURE.md`, `DECISIONS.md`, `docs/REISEN.md`, `docs/DATENBANK.md`, `JETNITY_HANDOFF.md` und `ROADMAP.md`, soweit der tatsächliche Stand es erfordert

Eine minimale UI zum Verwalten von Mitgliedern ist nicht Teil dieses ersten Fundaments, außer eine interne Testoberfläche ist für die Verifikation unvermeidlich. Produkt-UX kommt separat.

## Pflicht-Testmatrix

Mindestens folgende Fälle automatisiert abdecken:

### Einzelreise-Kompatibilität

- bestehender Owner liest seine alte Reise
- bestehender Owner schreibt Reise und Kindzeilen
- fremder Nutzer sieht/schreibt nichts
- Gastreise bleibt unverändert lokal/persönlich

### Rollen

- Owner: read/write/manage
- Editor: read/write Reisegraph, aber keine Mitgliederverwaltung und kein Trip-Delete
- Viewer: read only
- Nicht-Mitglied: keinerlei Zugriff

### Einladungen

- gültiger Token + authentifiziertes Konto → Mitgliedschaft
- abgelaufen → abgelehnt
- widerrufen → abgelehnt
- bereits verwendet → deterministisch abgelehnt/idempotent sicher
- manipuliert/zufällig → abgelehnt ohne Datenleck
- parallele Annahme → maximal eine Mitgliedschaft
- keine Owner-Einladung

### RLS

- direkte Tabellenzugriffe entsprechen exakt der Rollenmatrix
- Rechte gelten auch auf allen Kindtabellen
- Client kann keine fremde `user_id`/Rolle injizieren
- keine Security-Definer-Eskalation
- Service Role bleibt nur dort möglich, wo bestehende Architektur sie bewusst nutzt

### Konflikte

- Write mit aktueller Revision erfolgreich und Revision steigt
- zwei Nutzer auf derselben Revision: erster Write erfolgreich, zweiter erhält Conflict
- kein stiller Last-Write-Wins
- Konflikt lässt Daten unverändert statt Teiländerungen zu hinterlassen

### Hygiene

- `npm test`
- Typecheck
- Lint
- Hygiene/Exportchecks
- Production Build
- DB-/RLS-Security-Audits
- keine neuen Secrets
- keine Production-Aktivierung

## Umgang mit PR #27

PR #27 ist ein separater Draft für Mobile UX auf `/reisen/[tripId]`.

Dieser Kollaborationsbranch basiert bewusst auf aktuellem `main`, nicht auf PR #27. Keine UI-Arbeit aus #27 kopieren. Wenn nach Abschluss beider Zweige echte Überschneidungen entstehen, erst dann sauber rebasen/integrieren. Das Kollaborations-Fundament soll primär Datenmodell, Autorisierung, Serververträge und Tests betreffen.

## Kosten

Für diesen Block sind keine zusätzlichen laufenden Kosten erforderlich. Supabase/Postgres/Auth sind bereits Teil des bestehenden Stacks. Keine neue Infrastruktur buchen. Falls entgegen der Erwartung eine Lösung laufende Mehrkosten erzeugen würde, Arbeit an diesem Punkt stoppen und vorab Freigabe einholen.

## Abschlusskriterium des Drafts

Der PR bleibt Draft. Er ist erst reviewbereit, wenn:

- das Rollenmodell serverseitig vollständig erzwungen ist,
- alte Einzelreisen nachweislich kompatibel sind,
- Einladungstokens sicher implementiert sind,
- Revision-Konflikte nicht still überschreiben,
- RLS-Audits grün sind,
- alle relevanten Tests/Builds grün sind,
- Dokumentation den tatsächlichen Stand beschreibt,
- keine Production-Migration stattgefunden hat.

Danach unabhängiger Review durch ChatGPT und erst anschließend Entscheidung über weitere UI-Iteration, Development-Migration bzw. Merge.
