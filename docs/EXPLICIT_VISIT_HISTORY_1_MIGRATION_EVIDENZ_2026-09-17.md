# Explicit Visit History 1 – Migrationsnachweis

Stand: 17. September 2026 (Development live angewendet und verifiziert)

Migration: `supabase/migrations/20260917120000_account_visits.sql`

---

## 0. Wer was getan hat

Die Anwendung auf Supabase Development und die Live-Verifikation hat der
**Technical Lead** durchgeführt, nicht der Cursor-Agent. Der Agent hat in
dieser Etappe **keine** Migration angewendet und **kein** Supabase-Projekt
verändert; der in seiner Umgebung hinterlegte `SUPABASE_ACCESS_TOKEN` wurde
vom Management-API durchgehend mit HTTP 401 abgewiesen.

Dieses Dokument trennt deshalb strikt:

| Abschnitt | Quelle |
| --- | --- |
| 1 – was die Migration zusichert | Repository |
| 2 – Live-Stand Development | Messung des Technical Lead |
| 3 – erzeugte Typen | Generator des Technical Lead, im Branch nachgezogen |
| 4 – isolierter lokaler Lauf | Cursor-Agent, lokale PostgreSQL |
| 5 – Production | Messung des Technical Lead |

**Die Migration ist angewendet. Sie darf nicht erneut angewendet werden.**

---

## 1. Was die Migration zusichert

### Die Tabelle ist für PostgREST-Rollen nur lesbar

| Rolle | Tabellenrecht |
| --- | --- |
| `authenticated` | `SELECT` (RLS: nur eigene Zeilen) |
| `anon` | keines |
| `service_role` | keines |
| `PUBLIC` | keines |

Es gibt genau **eine** Policy, und sie liest. `INSERT`, `UPDATE` und `DELETE`
existieren als Recht nicht und deshalb auch nicht als Policy – beides zusammen,
weil `npm run db:rechte` sonst zu Recht anschlägt: ein Recht ohne Policy legt
die Tabelle offen, eine Policy ohne Recht täuscht eine Erlaubnis vor.

### Geschrieben wird nur über den Vertrag

```
public.account_visit_bestaetigen(_place_id, _country_code, _jahr, _monat, _tag) -> uuid
public.account_visit_aendern(_id, _place_id, _country_code, _jahr, _monat, _tag) -> uuid
public.account_visit_widerrufen(_id) -> uuid
```

`SECURITY DEFINER`, `search_path` festgenagelt, `EXECUTE` nur für
`authenticated`. Jede beginnt mit `auth.uid()` und bricht ohne angemeldetes
Konto ab; `aendern` und `widerrufen` filtern zusätzlich auf `user_id = _uid`,
weil eine Funktion als Eigentümer der Tabelle läuft und RLS nicht sieht.

Der gemeinsame Kern `public.account_visit_pruefen` hat **für keine
PostgREST-Rolle** `EXECUTE`.

### Was der Vertrag prüft

| Zusage | Umsetzung |
| --- | --- |
| Ortsreferenz muss existieren | `select * from public.places where id = _place_id` |
| Flughafen ist kein Besuch | `_ort.typ = 'airport'` wird abgewiesen |
| Landtreffer ist ein Land, kein Ort | `_ort.typ = 'country'` → `place_id`, Label und Koordinaten bleiben NULL, der Ländercode kommt aus der Referenz |
| Name, Land und Koordinaten nie aus dem Aufruf | werden aus `public.places` abgeschrieben; der Aufruf hat dafür keine Argumente |
| Land ohne Ort nur aus dem Katalog | `public.ist_katalogland(...)`, zusätzlich als Check-Bedingung der Spalte |
| Kalender | `make_date`, Ausnahme wird zu einer Ablehnung |
| keine Zukunft | Vergleich gegen `(now() at time zone 'utc')::date` |
| Jahr ab 1900 | Vergleich im Vertrag, zusätzlich Bereichs-Check der Spalte |

Dass die Zukunft nicht in einer Check-Bedingung steht, ist kein Versäumnis: ein
Check muss immutable sein und darf `now()` nicht lesen. Diese Zusage ist
durchsetzbar, weil die Tabelle keinen anderen Schreibweg hat.

---

## 2. Live-Stand Development (gemessen vom Technical Lead)

Angewendet wurde **nur** auf Development. Die Migrationshistorie des Branches
ist exakt auf die Repository-Fassung normalisiert:

```
20260917120000  account_visits
```

| Gemessen | Ergebnis |
| --- | --- |
| RLS auf `public.account_visits` | **aktiv** |
| Policies | genau eine: `account_visits_lesen`, `USING user_id = auth.uid()`, für `authenticated` |
| Tabellenrechte `authenticated` | **nur `SELECT`** |
| Tabellenrechte `anon` | keine |
| Tabellenrechte `service_role` | keine |
| `EXECUTE` auf den drei öffentlichen Schreib-RPCs | nur `postgres` und `authenticated` |
| `EXECUTE` auf `account_visit_pruefen` | nur `postgres` |
| Zeilen in der Tabelle | 0 |

Damit ist der Befund aus Review-Runde 1 zur Supabase-Voreinstellung live
bestätigt: `service_role` hat auf dieser Tabelle nichts, obwohl Supabase neu
angelegten Tabellen von sich aus Rechte dafür mitgibt. Der explizite Entzug in
der Migration wirkt.

### Security Advisors: bewertet, nicht weggelassen

Der Technical Lead hat die Advisors auf Development durchgesehen. Diese Etappe
erzeugt zwei Arten von Hinweisen, und beide sind gewollt:

1. der allgemeine Hinweis auf GraphQL-Sichtbarkeit für die angemeldete Rolle –
   Folge des beabsichtigten `SELECT` für `authenticated` zusammen mit
   Owner-RLS;
2. `SECURITY DEFINER`-Hinweise für die drei absichtlich exponierten, an
   `auth.uid()` gebundenen Schreib-RPCs.

Kein Hinweis auf fehlendes RLS und kein Hinweis auf einen anon-Schreibweg ist
hinzugekommen.

Das ist ausdrücklich **keine** Zusage „null Warnungen“. Es sind geprüfte
Entwurfsentscheidungen mit bekannter Warnung; die Gegenmassnahmen zu (2) stehen
im Self-Review, Abschnitt 2.2.

---

## 3. Erzeugte Typen

`types/supabase.ts` war in dieser Etappe von Hand vorweggenommen, weil es das
Schema auf Development noch nicht gab. Der Technical Lead hat den echten
Supabase-Generator gegen Development laufen lassen und dabei festgestellt:
Tabelle und die drei öffentlichen RPC-Signaturen stimmten überein, **zwei
Funktionen fehlten** in der Handfassung:

- `account_visit_pruefen` – der Generator gibt sie aus, obwohl sie für keine
  PostgREST-Rolle ausführbar ist, samt Rückgabetyp der Tabellenzeile und
  `SetofOptions`;
- `ist_katalogland`.

Beide sind jetzt generator-genau nachgetragen. Unbeteiligte Bereiche der Datei
wurden nicht angefasst.

Damit sich dieselbe Lücke nicht wiederholt, prüft ein Test, dass jede Funktion
der Migration, die kein Trigger ist, in `types/supabase.ts` steht
(`lib/account/besuche.test.ts`, „jede aufrufbare Funktion der Migration steht in
den erzeugten Typen“). Trigger-Funktionen lässt der Generator bewusst aus.

---

## 4. Isolierter Lauf gegen lokale PostgreSQL

`npm run db:besuche-lokal` bleibt als eigenständiger Nachweis bestehen. Er
ersetzt die Live-Prüfung nicht und wird von ihr nicht ersetzt: er misst, was
eine Live-Momentaufnahme nicht misst, nämlich das Verhalten unter Angriff.

Der Lauf legt jedes Mal eine frische lokale Datenbank an, bildet die
Supabase-Default-Privilegien nach, wendet **dieselbe Migrationsdatei** an und
schreibt dann als `authenticated` direkt auf die Tabelle – so, wie ein Client
es über PostgREST versuchen könnte.

Umgebung: PostgreSQL 16.15 (Ubuntu), lokal, kein Netz, kein Management-API.

### Der Lauf prüft zuerst seine eigene Voraussetzung

Die erste Fassung dieses Nachweises gab neu angelegten Tabellen keine Rechte.
Ein `revoke` sah dort auch dann grün aus, wenn es nichts zu entziehen gab – der
Lauf maß sich selbst. Das Bootstrap bildet die Voreinstellung jetzt nach:

```sql
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to anon, authenticated, service_role;
```

Eine Kontrolltabelle entsteht danach und wird nie entzogen. Der erste Testfall
schreibt als `authenticated` in sie hinein und **muss gelingen**. Gelänge er
nicht, wäre die Voreinstellung unwirksam und jedes folgende `abgelehnt` wertlos.

### 41 Nachweise

```
  ok   die nachgebildete Supabase-Voreinstellung ist wirksam          erlaubt    1 Zeilen
  ok   anon liest keine Besuche                                       abgelehnt  42501 permission denied for table account_visits
  ok   service_role erreicht die Tabelle nicht                        abgelehnt  42501 permission denied for table account_visits
  ok   Konto liest den eigenen Besuch                                 erlaubt    1 Zeilen
  ok   Konto liest den fremden Besuch nicht                           leer       0 Zeilen
  ok   Konto schreibt nicht direkt in die Tabelle                     abgelehnt  42501 permission denied for table account_visits
  ok   Konto erfindet keine Geografie per Direktschreibung            abgelehnt  42501 permission denied for table account_visits
  ok   Konto schreibt keinen Besuch von morgen per Direktschreibung   abgelehnt  42501 permission denied for table account_visits
  ok   Konto ändert die Tabelle nicht direkt                          abgelehnt  42501 permission denied for table account_visits
  ok   Konto löscht nicht direkt aus der Tabelle                      abgelehnt  42501 permission denied for table account_visits
  ok   anon ruft den Schreibvertrag nicht auf                         abgelehnt  42501 permission denied for function account_visit_bestaetigen
  ok   service_role ruft den Schreibvertrag nicht auf                 abgelehnt  42501 permission denied for function account_visit_bestaetigen
  ok   ohne angemeldetes Konto schreibt der Vertrag nicht             abgelehnt  42501 Anmeldung erforderlich
  ok   der interne Vertragskern ist für niemanden aufrufbar           abgelehnt  42501 permission denied for function account_visit_pruefen
  ok   ein bekannter Ort wird mit Referenzgeografie übernommen        erlaubt    1 Zeilen
  ok   eine unbekannte Ortsreferenz wird abgewiesen                   abgelehnt  22023 Diese Ortsreferenz gibt es nicht.
  ok   ein Flughafen ist kein besuchter Ort                           abgelehnt  22023 Ein Flughafen ist kein besuchter Ort.
  ok   ein Landtreffer der Ortssuche wird zum Landbesuch, nicht zum Ort  erlaubt 1 Zeilen
  ok   ein Land ohne Ländercode in der Referenz wird abgewiesen       abgelehnt  22023 kein Laendercode
  ok   ein Ländercode ausserhalb des Katalogs wird abgewiesen         abgelehnt  22023 Diesen Laendercode kennt Jetnity nicht.
  ok   ein Ländercode in falscher Form wird abgewiesen                abgelehnt  22023 Diesen Laendercode kennt Jetnity nicht.
  ok   ein Besuch ohne Ort und ohne Land wird abgewiesen              abgelehnt  22023 Ort oder Land
  ok   Koordinaten der Referenz werden übernommen, nicht geraten      erlaubt    1 Zeilen
  ok   ein unbekannter Zeitpunkt bleibt unbekannt                     erlaubt    1 Zeilen
  ok   ein Monat ohne Jahr wird abgewiesen                            abgelehnt  22023 keine Angabe
  ok   ein Tag ohne Monat wird abgewiesen                             abgelehnt  22023 keine Angabe
  ok   der 30. Februar wird abgewiesen                                abgelehnt  22023 Dieses Datum gibt es nicht.
  ok   ein Jahr in der Zukunft wird abgewiesen                        abgelehnt  22023 Jahr ausserhalb des Bereichs
  ok   ein Monat in der Zukunft wird abgewiesen                       abgelehnt  22023 nicht in der Zukunft
  ok   ein Jahr vor 1900 wird abgewiesen                              abgelehnt  22023 Jahr ausserhalb des Bereichs
  ok   derselbe Ort darf mehrfach bestätigt werden                    erlaubt    1 Zeilen
  ok   Konto ändert den eigenen Besuch über den Vertrag               erlaubt    1 Zeilen
  ok   Konto ändert den fremden Besuch nicht                          leer       0 Zeilen
  ok   Konto widerruft den eigenen Besuch                             erlaubt    1 Zeilen
  ok   Konto widerruft den fremden Besuch nicht                       leer       0 Zeilen
  ok   ein Besuch verändert keine Reisezeile                          erlaubt    1 Zeilen
  ok   die Tabelle führt keinen persistierten Zähler                  leer       0 Zeilen
  ok   RLS ist aktiv und es gibt genau eine Lesepolicy                erlaubt    1 Zeilen
  ok   authenticated hat auf der Tabelle nur SELECT                   leer       0 Zeilen
  ok   anon, service_role und PUBLIC haben kein Tabellenrecht         leer       0 Zeilen
  ok   anon und service_role dürfen keine Vertragsfunktion ausführen  leer       0 Zeilen

41/41 isolierte Besuchs-Nachweise erfüllt.
Ziel: lokale PostgreSQL. Supabase und Production nicht berührt.
```

---

## 5. Production

Production ist **unverändert**. Der Technical Lead hat nachgesehen: sowohl
`public.account_visits` als auch `account_visit_bestaetigen(...)` fehlen dort.

Der Cursor-Agent hat kein Kommando mit `--produktion` ausgeführt und hätte es
mit dem vorliegenden Token auch nicht gekonnt.

Die Produktionsmigration bleibt eine eigene Entscheidung des Technical Lead nach
dem Exact-Head-Review. Sie ist nicht Teil dieser Etappe.

---

## 6. Ownership und Aufbewahrung

- Eigentümer jeder Zeile ist `user_id`; die Spalte hat `default auth.uid()` und
  einen Fremdschlüssel auf `auth.users` mit `on delete cascade`. Wird ein Konto
  gelöscht, verschwindet die Historie mit ihm.
- Es gibt keinen öffentlichen Lesepfad, keine Freigabe und keine zweite Rolle
  mit Zugriff.
- Der Anschluss an einen künftigen Kontoexport ist **noch nicht** gebaut. Die
  Tabelle ist dafür vorbereitet – eine flache, owner-gefilterte Leseabfrage
  genügt –, aber sie ist an keine bestehende Exportroutine angeschlossen. Das
  ist offen und im Self-Review als offener Punkt geführt.
