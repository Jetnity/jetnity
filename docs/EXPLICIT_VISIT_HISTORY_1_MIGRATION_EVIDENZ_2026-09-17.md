# Explicit Visit History 1 – Migrationsnachweis

Stand: 17. September 2026

Migration: `supabase/migrations/20260917120000_account_visits.sql`

---

## 1. Was nicht belegt ist

Die Migration ist **nicht** auf Supabase Development angewendet.

Grund: Der in dieser Cloud-Agent-Umgebung hinterlegte `SUPABASE_ACCESS_TOKEN`
wird vom Supabase-Management-API abgewiesen.

```
$ curl -sS -o /dev/null -w "%{http_code}\n" \
    -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
    https://api.supabase.com/v1/projects
401

$ npm run db:anwenden -- --probe
SUPABASE_PROJECT_REF ist weder Projekt (401) noch Branch (401).
Ref oder Token prüfen. Abgebrochen.
```

Damit sind folgende Zusagen der Aufgabe **offen**, nicht erfüllt:

- Migration einmal auf Development angewendet;
- Live-Schema, Live-RLS, Live-Policies, Live-Grants und Advisors auf
  Development geprüft;
- `npm run db:typen` gegen das Live-Schema erzeugt.

Der Eintrag `account_visits` in `types/supabase.ts` ist in der Form des
Generators von Hand ergänzt, damit `check:schema-bezug`, TypeScript und der
Build gegen dieselbe Struktur laufen wie später die Datenbank. Er ersetzt den
Generator nicht und muss nach dem Anwenden mit `npm run db:typen` neu erzeugt
und gegengelesen werden.

## 2. Production

Production wurde nicht berührt. Es wurde kein Kommando mit `--produktion`
ausgeführt, und mit dem vorliegenden Token wäre auch keines möglich gewesen:
dasselbe 401 trifft jeden Management-API-Aufruf. Es liegt keine Änderung an
Production vor, weil keine Verbindung zu Production zustande kam.

## 3. Was belegt ist: isolierter Lauf gegen lokale PostgreSQL

`npm run db:besuche-lokal` legt jedes Mal eine frische lokale Datenbank an,
spielt einen minimalen Supabase-ähnlichen Unterbau ein (Rollen `anon`,
`authenticated`, `service_role`, `auth.users`, `auth.uid()`, der
`setze_aktualisiert_am`-Trigger), wendet **dieselbe Migrationsdatei** an und
misst danach Rechte, RLS und jede Check-Bedingung empirisch. Alles läuft in
einer Transaktion, die am Ende zurückgerollt wird.

Umgebung: PostgreSQL 16.15 (Ubuntu), lokal, kein Netz, kein Management-API.

```
  ok   anon liest keine Besuche                                       abgelehnt  42501 permission denied for table account_visits
  ok   anon legt keinen Besuch an                                     abgelehnt  42501 permission denied for table account_visits
  ok   anon ändert keinen Besuch                                      abgelehnt  42501 permission denied for table account_visits
  ok   anon löscht keinen Besuch                                      abgelehnt  42501 permission denied for table account_visits
  ok   service_role erreicht die Tabelle nicht über PostgREST-Rechte  abgelehnt  42501 permission denied for table account_visits
  ok   Konto liest den eigenen Besuch                                 erlaubt    1 Zeilen
  ok   Konto liest den fremden Besuch nicht                           leer       0 Zeilen
  ok   Konto ändert den fremden Besuch nicht                          leer       0 Zeilen
  ok   Konto löscht den fremden Besuch nicht                          leer       0 Zeilen
  ok   Konto schreibt keinen Besuch auf ein fremdes Konto             abgelehnt  42501 new row violates row-level security policy
  ok   Konto schiebt den eigenen Besuch nicht auf ein fremdes Konto   abgelehnt  42501 new row violates row-level security policy
  ok   Konto ändert und löscht den eigenen Besuch                     erlaubt    1 Zeilen
  ok   derselbe Ort darf mehrfach bestätigt werden                    erlaubt    1 Zeilen
  ok   ein Besuch ohne Ort und ohne Land wird abgelehnt               abgelehnt  23514 account_visits_hat_identitaet
  ok   ein Monat ohne Jahr wird abgelehnt                             abgelehnt  23514 account_visits_monat_braucht_jahr
  ok   ein Tag ohne Monat wird abgelehnt                              abgelehnt  23514 account_visits_tag_braucht_monat
  ok   ein unbekannter Zeitpunkt bleibt unbekannt                     erlaubt    1 Zeilen
  ok   ein Ortsname ohne Ortsreferenz wird abgelehnt                  abgelehnt  23514 account_visits_place_label_bei_ort
  ok   Koordinaten ohne Ortsreferenz werden abgelehnt                 abgelehnt  23514 account_visits_koordinaten_nur_mit_ort
  ok   eine halbe Koordinate wird abgelehnt                           abgelehnt  23514 account_visits_koordinaten_paarig
  ok   ein Ländercode in falscher Form wird abgelehnt                 abgelehnt  23514 account_visits_country_format
  ok   ein Ortslabel mit Markup wird abgelehnt                        abgelehnt  23514 account_visits_keine_html
  ok   ein Besuch verändert keine Reisezeile                          erlaubt    1 Zeilen
  ok   die Tabelle führt keinen persistierten Zähler                  leer       0 Zeilen
  ok   RLS ist aktiv und die vier Owner-Policies stehen               erlaubt    1 Zeilen
  ok   anon und service_role haben kein einziges Tabellenrecht        leer       0 Zeilen

26/26 isolierte Besuchs-Nachweise erfüllt.
Ziel: lokale PostgreSQL. Supabase und Production nicht berührt.
```

Was dieser Lauf **nicht** ersetzt:

- die tatsächliche Anwendung auf dem Development-Branch und dessen
  Migrationshistorie;
- die Supabase-Advisors (Performance- und Security-Hinweise des Anbieters);
- die Auth-Konfigurationsprüfung `auth:pruefen`;
- die Typen aus dem Live-Schema.

## 4. Ablauf nach Freigabe

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

Produktion bleibt ausgeschlossen. Sie ist eine eigene Entscheidung des
Technical Lead nach dem Exact-Head-Review und nicht Teil dieser Etappe.

## 5. Ownership und Aufbewahrung

- Eigentümer jeder Zeile ist `user_id`; die Spalte hat `default auth.uid()` und
  einen Fremdschlüssel auf `auth.users` mit `on delete cascade`. Wird ein Konto
  gelöscht, verschwindet die Historie mit ihm.
- Es gibt keinen öffentlichen Lesepfad, keine Freigabe und keine zweite Rolle
  mit Zugriff.
- Der Anschluss an einen künftigen Kontoexport ist **noch nicht** gebaut. Die
  Tabelle ist dafür vorbereitet (eine flache, owner-gefilterte Leseabfrage
  genügt), aber sie ist an keine bestehende Exportroutine angeschlossen. Das ist
  offen und im Self-Review als offener Punkt geführt.
