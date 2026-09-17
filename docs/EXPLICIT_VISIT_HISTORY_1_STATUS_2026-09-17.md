# Explicit Visit History 1 – Status

Stand: 17. September 2026

Status: **IMPLEMENTIERT / LOKAL VOLLSTÄNDIG BELEGT / SUPABASE-DEVELOP-NACHWEIS BLOCKIERT**

Issue: #445
Product-Owner-Direktive: #441
Draft-PR: #448
Branch: `feat/phase-1-explicit-visit-history-1`
Basis: `main@69f3b206fc87bf4a3ff9e3c275cf55d244c0a9a6`

Agent: `Jetnity explicit visit history 1`, Generation 1, Claude Opus 5 High.

Verbindliche Aufgabe: `docs/EXPLICIT_VISIT_HISTORY_1_TASK_2026-09-17.md`

---

## Kurzfassung

Die Account-Weltkarte trägt jetzt zwei getrennte Wahrheiten: **bestätigt besucht**
und **in Jetnity geplant**. Besucht entsteht ausschliesslich dadurch, dass der
Kontoinhaber es ausdrücklich bestätigt – auch für Reisen von lange vor Jetnity.
Keine Reise, kein vergangenes Datum, kein Archivstand und kein Buchungszustand
erzeugt einen Besuch.

Ein Punkt ist **nicht** erfüllt und darf nicht als erfüllt gelesen werden: die
Migration ist **nicht** auf Supabase Development angewendet, weil der in dieser
Umgebung hinterlegte `SUPABASE_ACCESS_TOKEN` vom Management-API mit HTTP 401
abgewiesen wird. Siehe Abschnitt „Blockiert“.

---

## Umgesetzt

### Persistenz

- eine additive Migration `supabase/migrations/20260917120000_account_visits.sql`;
- `public.account_visits` mit Zeilen-Id, `user_id` (FK auf `auth.users`,
  `on delete cascade`), Ortsreferenz, Ortslabel, Ländercode, Koordinaten,
  getrennten Feldern für Jahr/Monat/Tag, `created_at`/`updated_at`;
- RLS aktiv, vier Owner-Policies (`lesen`, `anlegen`, `aendern`, `loeschen`),
  je `to authenticated` mit `user_id = (select auth.uid())`;
- `revoke all` für `public` und `anon`, Rechte nur für `authenticated`;
- weiche Obergrenze von 1000 Besuchen je Konto über einen `security invoker`
  Trigger (bewusst ohne Serialisierung – begrenzt Wachstum, ist keine Invariante);
- **kein** persistierter Zähler, **keine** Eindeutigkeit über (Konto, Ort):
  wiederholte Besuche bleiben getrennte Zeilen;
- **kein** Fremdschlüssel auf `public.places`: ein bestätigter Besuch darf einen
  Katalogimport überleben. Die Referenz prüft der Server beim Schreiben.

### Wahrheitsregeln im Code

- `lib/account/besuche.ts` – Domäne, Zeitgenauigkeit, abgeleitete Kennzahlen;
- `lib/account/welt-ansicht.ts` – bestätigte Seite (`fehler` / `leer` / `erfasst`);
- `lib/account/world-map.ts` – geplante Seite, jetzt ohne jedes Besuchsfeld;
- `lib/account/welt-laender.ts` – Zustandszuordnung `besucht` / `geplant` /
  `beides`, ohne dass eine Seite die andere überschreibt;
- `lib/account/besuche-eingabe.ts` – Zod plus Kalender- und Zukunftsprüfung;
- `lib/account/besuche-aktionen.ts` – Owner-CRUD über Session und RLS.

Der Browser schickt ausschliesslich eine Ortsreferenz **oder** einen Ländercode.
Name, Ländercode und Koordinaten schreibt der Server aus `public.places` ab.
Ein freier Text kann deshalb nie zu Geografie werden, und ein Formular kann
nicht behaupten, Lissabon liege in Frankreich.

### Kartografie

- `scripts/kartografie/weltkarte-geometrie.mjs` erzeugt zusätzlich
  `lib/account/world-map-laender.ts`: dieselbe Natural-Earth-Quelle (v5.1.2,
  50m), aber je Land nach ISO-3166-1-alpha-2 getrennt;
- 175 Länder mit zeichenbarer Fläche, 61 Kleinstaaten mit Beschriftungspunkt
  (`LABEL_X`/`LABEL_Y` aus dem Datensatz, übernommen statt gerechnet);
- drei Gebiete ohne anerkannten ISO-Code (Nordzypern, Somaliland,
  Siachen-Gletscher) bleiben neutrale Grundkarte – bewusste Enthaltung;
- `lib/account/world-map-geografie.ts` ist **byte-identisch** unverändert: die
  Grundkarte aus #443/#444 wurde nicht angefasst, die Flächen liegen darüber;
- Zeichenreihenfolge: Wasser → Land → Zustandsflächen → Seen → **Grenzen** →
  Gradnetz. Die Grenzen liegen damit über jeder Füllung.

### Zustandssprache

Kein Zustand hängt an der Farbe allein:

| Zustand | Fläche | Textur | Wort |
| --- | --- | --- | --- |
| neutral | Grundkarte | – | (keine Aussage) |
| besucht | volle Füllung | keine | „Besucht“ |
| geplant | helle Füllung | Schraffur | „Geplant“ |
| besucht + geplant | volle Füllung | Schraffur | „Besucht und geplant“ |

Der überlagerte Zustand ist buchstäblich die Summe der beiden anderen, keine
dritte Farbe. Zusätzlich nennt die Länderliste unter der Karte jeden Zustand in
Worten, und die SVG-Beschreibung sagt dasselbe für Hilfsmittel.

### Kennzahlen

`Besucht: N Länder · M Orte` und `Geplant: N Länder · M Orte`, beide abgeleitet,
keine gespeichert. Ohne bestätigte Historie steht dort ein Satz statt einer
Null: „Noch keine Besuche bestätigt“. Kann die Historie nicht gelesen werden,
steht dort „Gerade nicht lesbar“ und daneben der ganze Satz – nie eine Zahl.

### Oberfläche

- neue Route `/account/welt` („Wo du schon warst“): Karte, Historie, Formular;
- `Besuchten Ort hinzufügen` mit bestehender Jetnity-Ortssuche;
- Jahr/Monat/Tag einzeln und einzeln leer lassbar;
- wiederholte Besuche tragen „Besuch 1 von 3“ und bleiben getrennte Zeilen;
- Bearbeiten und Widerrufen je Ereignis, Widerruf mit Rückfrage;
- Navigationspunkt „Deine Welt“;
- die Kontoübersicht zeigt die Karte weiterhin nur und verlinkt die Verwaltung.

### Nutzlast

Die vollständige Ländertabelle (rund 90 kB) bleibt auf dem Server. Nur
`lib/account/welt-geometrie.ts` schlägt sie nach, und die Datei trägt
`import 'server-only'`. Der Browser erhält ausschliesslich die Pfade der Länder,
die dieses Konto betreffen. Im Produktionsbuild enthält kein Client-Chunk die
Ländergeometrie (gemessen, siehe Handoff).

---

## Gates

| Gate | Ergebnis |
| --- | --- |
| `npm test` | 3293 Tests, 583 Suiten, 0 Fehler |
| `npx tsc --noEmit` | grün |
| `npm run lint` | 0 Fehler, 139 Warnungen (alle bestehend, keine aus dieser Etappe) |
| `npm run build` | grün, `/account/welt` als dynamische Route |
| `npm run check:dead` | grün |
| `npm run check:exports` | grün, 0 Exporte ohne Aufrufer |
| `npm run check:deps` | grün |
| `npm run check:api-schutz` | grün |
| `npm run check:schema-bezug` | grün |
| `npm run audit:account` | 48/48 grün (webkit + chromium, 6 Breiten) |
| `npm run db:besuche-lokal` | 26/26 gegen lokale PostgreSQL 16 |
| `node scripts/kartografie/besuchshistorie-belege.mjs` | 14 Belege, `ok: true` |
| `node scripts/kartografie/weltkarte-geometrie.mjs --pruefen` | beide erzeugten Dateien aktuell |

---

## Blockiert

**Supabase-Development-Nachweis ist nicht erbracht.**

Der in dieser Cloud-Agent-Umgebung hinterlegte `SUPABASE_ACCESS_TOKEN` wird vom
Management-API abgewiesen:

```
GET https://api.supabase.com/v1/projects  → 401 {"message":"Unauthorized"}
npm run db:anwenden -- --probe
  → SUPABASE_PROJECT_REF ist weder Projekt (401) noch Branch (401).
```

Daraus folgt, ohne Beschönigung:

- die Migration ist **nicht** auf Development angewendet;
- `db:rls`, `db:rechte`, `db:sicherheit`, `db:advisors`, `auth:pruefen` und
  `db:typen` sind **nicht** gelaufen – ein Werkzeug, das sich mangels Secret
  überspringt, gilt nicht als gelaufen;
- der Eintrag `account_visits` in `types/supabase.ts` ist in der Form des
  Generators von Hand ergänzt. Er muss nach dem Anwenden mit `npm run db:typen`
  neu erzeugt und gegengelesen werden.

Production wurde **nicht** berührt: kein Production-Kommando wurde ausgeführt,
und mit dem vorliegenden Token wäre auch keines möglich gewesen.

Ersatzweise – nicht gleichwertig, aber belastbar – liegt ein isolierter Nachweis
gegen eine lokal aufgesetzte PostgreSQL 16 vor
(`npm run db:besuche-lokal`, 26/26). Er wendet dieselbe Migrationsdatei an und
misst RLS, Rechte und jede Check-Bedingung empirisch. Details in
`docs/EXPLICIT_VISIT_HISTORY_1_MIGRATION_EVIDENZ_2026-09-17.md`.

---

## Offene Punkte

1. Migration auf Supabase Development anwenden, danach `db:typen`, `db:rls`,
   `db:rechte`, `db:sicherheit`, `db:advisors` und `production:pruefen`.
2. Produktionsmigration bleibt ausdrücklich beim Technical Lead.
3. Der Anschluss an Kontoexport, Kontolöschung und Aufbewahrung ist noch nicht
   gebaut; die Löschung hängt heute an `on delete cascade` auf `auth.users`.
   Dokumentiert im Self-Review.

Technical-Lead-Review erforderlich. Kein Ready, kein Merge durch den Agenten.
