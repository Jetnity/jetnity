# Explicit Visit History 1 – Migrationsnachweis

Stand: 17. September 2026 (Review-Runde 1 eingearbeitet)

Migration: `supabase/migrations/20260917120000_account_visits.sql`

Die Migrationsdatei wurde nach dem Technical-Lead-Review überarbeitet statt
ergänzt. Das ist zulässig, weil sie **nirgends angewendet** ist – weder auf
Development noch auf Production. Es bleibt eine additive Migration.

---

## 1. Was die Migration jetzt zusichert

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

Der gemeinsame Kern `public.account_visit_pruefen` hat **für keine Rolle**
`EXECUTE`, auch nicht für `authenticated`.

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
durchsetzbar, weil die Tabelle keinen anderen Schreibweg mehr hat.

---

## 2. Was nicht belegt ist

Die Migration ist **nicht** auf Supabase Development angewendet.

Grund unverändert: Der in dieser Cloud-Agent-Umgebung hinterlegte
`SUPABASE_ACCESS_TOKEN` wird vom Supabase-Management-API abgewiesen.

```
$ curl -sS -o /dev/null -w "%{http_code}\n" \
    -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
    https://api.supabase.com/v1/projects
401

$ npm run db:anwenden -- --probe
SUPABASE_PROJECT_REF ist weder Projekt (401) noch Branch (401).
Ref oder Token prüfen. Abgebrochen.
```

Offen bleiben deshalb:

- Anwendung auf Development;
- Live-Schema, Live-RLS, Policies, Grants und Advisors;
- `auth:pruefen`;
- `npm run db:typen` gegen das Live-Schema.

`types/supabase.ts` trägt den Tabellenblock **und** die drei Vertragsfunktionen
von Hand in Generatorform. Nach dem Anwenden muss der Generator sie ersetzen und
der Diff gegengelesen werden.

### Insbesondere: über `service_role` wird hier nichts behauptet

Das Review hat zu Recht angemerkt, dass Supabase Tabellen, die `postgres`
anlegt, von sich aus Rechte für `service_role` mitgibt. Die Migration entzieht
sie jetzt ausdrücklich:

```sql
revoke all on table public.account_visits from public;
revoke all on table public.account_visits from anon;
revoke all on table public.account_visits from authenticated;
revoke all on table public.account_visits from service_role;

grant select on table public.account_visits to authenticated;
```

Dieses Dokument behauptet **nicht**, dass `service_role` auf dem
Development-Branch blockiert ist. Es behauptet, dass die Migration den Entzug
ausspricht und dass derselbe Entzug gegen eine nachgebildete Voreinstellung
nachweislich wirkt (Abschnitt 3). Ob er auf Development wirkt, entscheidet die
Live-Prüfung – und sie gehört zu den Schritten in Abschnitt 5.

---

## 3. Was belegt ist: isolierter Lauf gegen lokale PostgreSQL

`npm run db:besuche-lokal` legt jedes Mal eine frische lokale Datenbank an,
spielt einen minimalen Supabase-ähnlichen Unterbau ein, wendet **dieselbe
Migrationsdatei** an und misst danach Rechte, Vertrag und Eigentum empirisch.
Alles läuft in einer Transaktion, die am Ende zurückgerollt wird.

Umgebung: PostgreSQL 16.15 (Ubuntu), lokal, kein Netz, kein Management-API.

### Der Lauf prüft zuerst seine eigene Voraussetzung

Die erste Fassung dieses Nachweises hatte einen Fehler, den das Review
mitverursacht aufgedeckt hat: das Bootstrap gab neu angelegten Tabellen keine
Rechte. Ein `revoke` sah dort auch dann grün aus, wenn es nichts zu entziehen
gab – der Lauf maß sich selbst.

Das Bootstrap bildet die Voreinstellung jetzt nach:

```sql
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to anon, authenticated, service_role;
```

Und eine Kontrolltabelle entsteht danach, ohne je entzogen zu werden. Der erste
Testfall schreibt als `authenticated` in sie hinein und **muss gelingen**.
Gelänge er nicht, wäre die Voreinstellung unwirksam und jedes folgende
`abgelehnt` wertlos.

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

Die ersten Fälle nehmen bewusst die Rolle des Angreifers ein: sie schreiben als
`authenticated` direkt auf die Tabelle, so wie ein Client es über PostgREST
tun könnte, und erwarten abgewiesen zu werden.

### Was dieser Lauf nicht ersetzt

- die tatsächliche Anwendung auf dem Development-Branch und dessen
  Migrationshistorie;
- die tatsächliche Supabase-ACL dieses Projekts – nachgebildet ist nachgebildet;
- die Supabase-Advisors;
- `auth:pruefen`;
- die Typen aus dem Live-Schema.

---

## 4. Production

Production wurde nicht berührt. Es wurde kein Kommando mit `--produktion`
ausgeführt, und derselbe 401 hätte jeden Zugriff verhindert. Es liegt keine
Änderung an Production vor, weil keine Verbindung zu Production zustande kam.

---

## 5. Ablauf nach Freigabe

```bash
export SUPABASE_PROJECT_REF='<development-branch-ref>'
export SUPABASE_ACCESS_TOKEN='<gültiges PAT>'

npm run db:anwenden -- --probe     # zeigt die offenen Migrationen
npm run db:anwenden                # nur Development
npm run db:typen                   # types/supabase.ts neu erzeugen
git diff types/supabase.ts         # muss den hier ergänzten Block bestätigen

npm run db:rechte
npm run db:rls
npm run db:sicherheit
npm run db:advisors
npm run check:schema-bezug
```

Zusätzlich auf Development einmal ausdrücklich nachsehen, weil der lokale Lauf
es nur nachbildet:

```sql
-- Muss leer sein.
select grantee, privilege_type
  from information_schema.role_table_grants
 where table_schema = 'public' and table_name = 'account_visits'
   and grantee in ('anon', 'service_role', 'PUBLIC');

-- Muss genau SELECT sein.
select privilege_type
  from information_schema.role_table_grants
 where table_schema = 'public' and table_name = 'account_visits'
   and grantee = 'authenticated';

-- Muss leer sein.
select p.proname, rolle
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  cross join unnest(array['anon', 'service_role', 'public']) as rolle
 where n.nspname = 'public'
   and p.proname like 'account_visit%'
   and has_function_privilege(rolle, p.oid, 'execute');
```

Produktion bleibt ausgeschlossen. Sie ist eine eigene Entscheidung des
Technical Lead nach dem Exact-Head-Review und nicht Teil dieser Etappe.

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
