# Explicit Visit History 1 – Status

Stand: 17. September 2026 (Review-Runde 2 eingearbeitet, Development live)

Status: **IMPLEMENTIERT / REVIEW-BEFUNDE BEHOBEN / DEVELOPMENT LIVE ANGEWENDET UND VERIFIZIERT / PRODUCTION UNVERÄNDERT**

Issue: #445
Product-Owner-Direktive: #441
Draft-PR: #448
Branch: `feat/phase-1-explicit-visit-history-1`
Basis: `main@69f3b206fc87bf4a3ff9e3c275cf55d244c0a9a6`, integriert bis
`main@cfcb6b5ba12bef2383782e5d27e968b23d446b04`

Agent: `Jetnity explicit visit history 1`, Generation 1, Claude Opus 5 High.

Verbindliche Aufgabe: `docs/EXPLICIT_VISIT_HISTORY_1_TASK_2026-09-17.md`

---

## Kurzfassung

Die Account-Weltkarte trägt zwei getrennte Wahrheiten: **bestätigt besucht** und
**in Jetnity geplant**. Besucht entsteht ausschliesslich dadurch, dass der
Kontoinhaber es ausdrücklich bestätigt – auch für Reisen von lange vor Jetnity.
Keine Reise, kein vergangenes Datum, kein Archivstand und kein Buchungszustand
erzeugt einen Besuch.

Der Technical Lead hat den Head `a372f215` geprüft und vier inhaltliche Befunde
plus eine Integrationsauflage gestellt. Alle fünf sind eingearbeitet; der
wichtigste hat die Architektur des Schreibwegs verändert.

Die Migration ist inzwischen auf Supabase **Development** angewendet und dort
live verifiziert – **durch den Technical Lead**, nicht durch den Cursor-Agenten.
Der Agent hat in keiner Runde eine Migration angewendet; sein
`SUPABASE_ACCESS_TOKEN` wurde vom Management-API durchgehend mit HTTP 401
abgewiesen. Die Migration darf **nicht erneut** angewendet werden.

Production ist unverändert: `public.account_visits` und
`account_visit_bestaetigen(...)` fehlen dort, vom Technical Lead nachgesehen.

---

## Review-Runde 1: Befund für Befund

### 1. Der Wahrheitsvertrag liess sich über direkte Tabellenschreibrechte umgehen

**Befund:** `authenticated` hatte `SELECT, INSERT, UPDATE, DELETE` auf
`account_visits`. RLS schützte das Eigentum, nicht die Wahrheit. Ein
angemeldeter Client konnte die Serveraktion umgehen und erfundene Geografie oder
ein Besuchsdatum von morgen in sein eigenes Konto schreiben.

**Behoben.** Der Vertrag steht jetzt in der Datenbank:

- `authenticated` hat auf der Tabelle nur noch `SELECT`; `anon`, `service_role`
  und `PUBLIC` haben nichts;
- es gibt genau eine Policy, und sie liest;
- geschrieben wird über `account_visit_bestaetigen`, `account_visit_aendern`
  und `account_visit_widerrufen` – `SECURITY DEFINER`, `search_path`
  festgenagelt, `EXECUTE` nur für `authenticated`, jede beginnt mit
  `auth.uid()`;
- der gemeinsame Kern `account_visit_pruefen` ist für **keine** Rolle
  ausführbar;
- Ortsname, Ländercode und Koordinaten kommen aus `public.places`; der Aufruf
  hat für sie keine Argumente;
- `country_code` ohne Ortsreferenz muss im ISO-Katalog stehen – als
  Check-Bedingung der Spalte *und* im Vertrag, über dieselbe immutable Funktion
  `public.ist_katalogland`;
- Kalendergültigkeit und Zukunftsausschluss prüft der Vertrag. In eine
  Check-Bedingung passen sie nicht: ein Check muss immutable sein und darf
  `now()` nicht lesen. Durchsetzbar ist die Zusage, weil es keinen anderen
  Schreibweg mehr gibt.

Kein Browser-Service-Role, kein neuer offener Endpunkt.

### 2. Ein Landtreffer der Ortssuche wurde zu einem gefälschten „Ort“

**Befund:** Die Ortssuche liefert für die Rolle `ziel` auch Länder. Wer „Peru“
wählte, bekam eine Zeile mit `place_id`; sie erhöhte die Ortszahl und wäre als
gewöhnliche Ortsmarke am Landesschwerpunkt erschienen.

**Behoben.** Der Vertrag führt einen Treffer mit `typ = 'country'` auf seine
Landesidentität zurück: `place_id`, Label und Koordinaten bleiben NULL, der
Ländercode kommt aus der Referenz. Abgelehnt wird nichts – „ich war in Peru“
bleibt wahr, es wird nur als Land gezählt statt als Ort. Fehlt der Referenz der
Ländercode, wird abgewiesen statt geraten.

Das Formular sagt es vorher: „Wählst du ein Land statt eines Ortes, wird der
Besuch als Land gezählt.“

### 3. Die Ersatzmarke unterschied `besucht` und `beides` nicht

**Befund:** Länder ohne zeichenbare Fläche bekamen einen Kreis; `besucht` und
`beides` trennte nur die Strichdeckkraft.

**Behoben, und dabei ein zweiter Fehler mitgefunden.** Die drei Zustände haben
jetzt drei Formen:

| Zustand | Form | entspricht der Fläche |
| --- | --- | --- |
| besucht | geschlossener Ring | volle Füllung |
| geplant | gestrichelter Ring | Schraffur |
| beides | beide Ringe ineinander | Füllung mit Schraffur |

Beim Belegen fiel auf, dass die Marke in der Kartengrafik lag und mit der Karte
skalierte, während die Ortsmarken darüber in Bildpunkten gesetzt sind. Auf
390 px verschwand der Ring eines geplanten Kleinstaats vollständig unter dem
Punkt derselben Reise – im Baum vorhanden, im Bild unsichtbar. Die Marken liegen
deshalb jetzt in der Ortsmarken-Ebene, behalten auf jeder Breite dieselbe Grösse
und stehen vor den Ortsmarken, sodass der Ring den Punkt umschliesst.

Die Länderliste zeigt für solche Länder dieselbe Form wie die Karte, nicht das
Flächenquadrat.

### 4. Die lokale Evidenz bildete die Supabase-ACL nicht ab


**Befund:** Supabase gibt Tabellen, die `postgres` anlegt, von sich aus Rechte
für `service_role`. Die Migration entzog `public` und `anon`, nicht
`service_role`. Das lokale Bootstrap modellierte die Voreinstellung nicht und
konnte den Unterschied deshalb nicht sehen.

**Behoben, beides.** Die Migration entzieht jetzt jeder Rolle einzeln, auch
`authenticated` und `service_role`, und gibt danach nur `SELECT` an
`authenticated`. Das Bootstrap setzt die Supabase-Default-Privilegien nach, und
eine Kontrolltabelle, die nie entzogen wird, belegt im ersten Testfall, dass die
Voreinstellung wirksam ist. Ohne diesen Fall wäre jedes folgende „abgelehnt“
wertlos gewesen.

Inzwischen live bestätigt: auf Development hat `service_role` auf dieser
Tabelle kein Recht, obwohl Supabase neu angelegten Tabellen von sich aus welche
mitgibt. Der explizite Entzug wirkt. Die vollständige Messung steht in
`docs/EXPLICIT_VISIT_HISTORY_1_MIGRATION_EVIDENZ_2026-09-17.md`, Abschnitt 2.

### 5. `origin/main` integrieren, 0 behind

**Erledigt.** `main@cfcb6b5b` ist per Merge integriert (kein Rebase, kein
Force-Push). Der Zuwachs von `main` war reine Dokumentation; es gab keinen
Konflikt. Nach der Integration sind alle Gates erneut gelaufen.

---

## Review-Runde 2: die erzeugten Typen waren nicht generator-genau

Der Technical Lead hat die Migration auf Development angewendet, live geprüft
und danach den echten Supabase-Generator laufen lassen. Tabelle und die drei
öffentlichen RPC-Signaturen stimmten mit der Handfassung überein; **zwei
Funktionen fehlten**:

- `account_visit_pruefen` – der Generator gibt sie aus, obwohl sie für keine
  PostgREST-Rolle ausführbar ist, mit dem Rückgabetyp der Tabellenzeile und
  `SetofOptions`;
- `ist_katalogland`.

**Behoben.** Beide Einträge sind generator-genau nachgetragen; unbeteiligte
Bereiche von `types/supabase.ts` blieben unangetastet. Damit dieselbe Lücke
nicht wiederkehrt, prüft jetzt ein Test, dass jede Funktion der Migration, die
kein Trigger ist, in den erzeugten Typen steht.

---

## Umgesetzt (Gesamtstand)

### Persistenz

- eine additive Migration `supabase/migrations/20260917120000_account_visits.sql`;
- `public.account_visits` mit Zeilen-Id, `user_id` (FK auf `auth.users`,
  `on delete cascade`), Ortsreferenz, Ortslabel, Ländercode, Koordinaten,
  getrennten Feldern für Jahr/Monat/Tag, `created_at`/`updated_at`;
- `public.ist_katalogland` mit den 249 offiziellen ISO-3166-1-alpha-2-Codes,
  Zeichen für Zeichen identisch mit `lib/country/katalog.ts` (durch Test
  gesichert);
- RLS aktiv, eine Lesepolicy, Schreiben nur über drei Vertragsfunktionen;
- weiche Obergrenze von 1000 Besuchen je Konto;
- **kein** persistierter Zähler, **keine** Eindeutigkeit über (Konto, Ort):
  wiederholte Besuche bleiben getrennte Zeilen;
- **kein** Fremdschlüssel auf `public.places`: ein bestätigter Besuch darf einen
  Katalogimport überleben. Die Existenz prüft der Schreibweg.

### Wahrheitsregeln im Code

- `lib/account/besuche.ts` – Domäne, Zeitgenauigkeit, abgeleitete Kennzahlen;
- `lib/account/welt-ansicht.ts` – bestätigte Seite (`fehler` / `leer` / `erfasst`);
- `lib/account/world-map.ts` – geplante Seite, ohne jedes Besuchsfeld;
- `lib/account/welt-laender.ts` – Zustandszuordnung, ohne dass eine Seite die
  andere überschreibt;
- `lib/account/besuche-eingabe.ts` – Zod plus Kalender- und Zukunftsprüfung, um
  früh und verständlich abzulehnen, was die Datenbank ohnehin ablehnen würde;
- `lib/account/besuche-aktionen.ts` – ruft den Vertrag auf und übersetzt dessen
  Hinweise in Sätze. Kein `.from(...)` mehr.

### Kartografie

- `scripts/kartografie/weltkarte-geometrie.mjs` erzeugt zusätzlich
  `lib/account/world-map-laender.ts`: dieselbe Natural-Earth-Quelle (v5.1.2,
  50m), je Land nach ISO-3166-1-alpha-2 getrennt;
- 175 Länder mit zeichenbarer Fläche, 61 Kleinstaaten mit Beschriftungspunkt;
- drei Gebiete ohne anerkannten ISO-Code bleiben neutrale Grundkarte;
- `lib/account/world-map-geografie.ts` ist byte-identisch unverändert;
- Zeichenreihenfolge: Wasser → Land → Zustandsflächen → Seen → **Grenzen** →
  Gradnetz; darüber die Ersatzmarken, darüber die Ortsmarken.

### Zustandssprache

| Zustand | Fläche | Textur | Ersatzmarke | Wort |
| --- | --- | --- | --- | --- |
| neutral | Grundkarte | – | – | (keine Aussage) |
| besucht | volle Füllung | keine | Ring | „Besucht“ |
| geplant | helle Füllung | Schraffur | gestrichelter Ring | „Geplant“ |
| besucht + geplant | volle Füllung | Schraffur | Doppelring | „Besucht und geplant“ |

### Kennzahlen

`Besucht: N Länder · M Orte` und `Geplant: N Länder · M Orte`, beide abgeleitet.
Ohne bestätigte Historie steht dort ein Satz statt einer Null; bei einem
Lesefehler „Gerade nicht lesbar“ und daneben der ganze Satz.

### Oberfläche

- Route `/account/welt` („Wo du schon warst“): Karte, Historie, Formular;
- `Besuchten Ort hinzufügen` mit der bestehenden Jetnity-Ortssuche;
- Jahr/Monat/Tag einzeln und einzeln leer lassbar;
- wiederholte Besuche tragen „Besuch 1 von 3“;
- Bearbeiten und Widerrufen je Ereignis, Widerruf mit Rückfrage;
- Navigationspunkt „Deine Welt“;
- die Kontoübersicht zeigt die Karte und verlinkt die Verwaltung.

### Nutzlast

Die vollständige Ländertabelle (rund 90 kB) bleibt auf dem Server; nur
`lib/account/welt-geometrie.ts` schlägt sie nach und trägt `import 'server-only'`.
Kein Client-Chunk enthält sie.

---

## Gates

| Gate | Ergebnis |
| --- | --- |
| `npm test` | 3309 Tests, 585 Suiten, 0 Fehler |
| `npx tsc --noEmit` | grün |
| `npm run lint` | 0 Fehler, 139 Warnungen (alle bestehend, keine aus dieser Etappe) |
| `npm run build` | grün, `/account/welt` als dynamische Route |
| `npm run check:dead` | grün |
| `npm run check:exports` | grün, 0 Exporte ohne Aufrufer |
| `npm run check:deps` | grün |
| `npm run check:api-schutz` | grün |
| `npm run check:schema-bezug` | grün (22 Tabellen/Views, 25 Funktionen) |
| `npm run audit:account` | 48/48 grün (WebKit + Chromium, 6 Breiten) |
| `npm run db:besuche-lokal` | 41/41 gegen lokale PostgreSQL 16 |
| `node scripts/kartografie/besuchshistorie-belege.mjs` | 14 Belege + 3 Lupen, `ok: true` |
| `node scripts/kartografie/weltkarte-geometrie.mjs --pruefen` | beide erzeugten Dateien aktuell |

---

## Live-Stand Supabase Development

Angewendet und gemessen vom **Technical Lead**; Migrationshistorie exakt auf die
Repository-Fassung normalisiert (`20260917120000 account_visits`).

| Gemessen | Ergebnis |
| --- | --- |
| RLS auf `public.account_visits` | aktiv |
| Policies | genau eine: `account_visits_lesen`, `USING user_id = auth.uid()`, `authenticated` |
| Tabellenrechte | `authenticated` nur `SELECT`; `anon` keine; `service_role` keine |
| `EXECUTE` auf den drei Schreib-RPCs | nur `postgres` und `authenticated` |
| `EXECUTE` auf `account_visit_pruefen` | nur `postgres` |
| Zeilen | 0 |
| Production | unverändert – Tabelle und RPC fehlen dort |

**Security Advisors:** geprüft, nicht weggelassen. Diese Etappe erzeugt zwei
Arten von Hinweisen, beide gewollt: den allgemeinen Hinweis auf
GraphQL-Sichtbarkeit für die angemeldete Rolle (Folge des beabsichtigten
`SELECT` für `authenticated` mit Owner-RLS) und `SECURITY DEFINER`-Hinweise für
die drei absichtlich exponierten, an `auth.uid()` gebundenen Schreib-RPCs. Kein
Hinweis auf fehlendes RLS und keiner auf einen anon-Schreibweg ist
hinzugekommen. Das ist ausdrücklich **keine** Zusage „null Warnungen“, sondern
eine bewertete Entwurfsentscheidung.

Ergänzend – und von der Live-Messung unabhängig – misst
`npm run db:besuche-lokal` (41/41) das Verhalten unter Angriff: direkte
Schreibversuche als `authenticated` gegen eine lokale PostgreSQL, die die
Supabase-Voreinstellung nachbildet und ihre eigene Voraussetzung mitprüft.

---

## Offene Punkte

1. Produktionsmigration bleibt ausdrücklich beim Technical Lead; sie ist nicht
   Teil dieser Etappe.
2. Der Anschluss an Kontoexport, Kontolöschung und Aufbewahrung ist nicht
   gebaut; die Löschung hängt an `on delete cascade` auf `auth.users`.
3. Kein Real-Device-Test.
4. Die Advisor-Hinweise oben bleiben stehen; sie sind bewertet, nicht behoben.

Technical-Lead-Review erforderlich. Kein Ready, kein Merge durch den Agenten.
