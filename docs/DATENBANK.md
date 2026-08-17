# Jetnity – Datenbank

Stand: 17. August 2026
Gültig für: Supabase-Development-Branch nach Phase 1.4b

Diese Datei beschreibt den **tatsächlichen** Zustand des Schemas, wie er sich aus dem Repository herstellen lässt. Sie ist die Antwort auf die Frage, die [ARCHITECTURE.md](../ARCHITECTURE.md) Abschnitt 6 bis Phase 1.4 offenlassen musste: Was steht in der Datenbank, wer darf was, und woher weiß man das.

Alle Angaben stammen aus dem Development-Branch. Production ist weder in Phase 1.4 noch in Phase 1.4b angefasst worden.

Phase 1.4b hat 29 Tabellen entfernt. Warum, mit welchem Nachweis und was bewusst geblieben ist, steht in [docs/LEGACY_ENTFERNUNG.md](LEGACY_ENTFERNUNG.md). Diese Datei beschreibt das Ergebnis, jene den Übergang.

---

## 1. Grundsatz

Die Migrationen in `supabase/migrations/` sind die Quelle. Was dort nicht steht, existiert für Jetnity nicht.

Konkret heißt das:

- Eine Schemaänderung entsteht als Migration und wird von dort angewendet, nicht in der Supabase-Oberfläche.
- `types/supabase.ts` wird erzeugt, nicht gepflegt.
- Dass beides zusammenpasst, wird geprüft und nicht angenommen.

Die Prüfungen dazu stehen in Abschnitt 9.

---

## 2. Werkzeuge

Alle Skripte liegen in `scripts/db/` und sprechen über die Supabase Management API mit dem Development-Branch. Sie brauchen `SUPABASE_ACCESS_TOKEN` und `SUPABASE_PROJECT_REF` aus der Umgebung; im Repository steht keiner der beiden Werte.

| Befehl | Aufgabe |
| --- | --- |
| `npm run db:inventar` | vollständige Inventur eines Schemas als JSON |
| `npm run db:anwenden` | offene Migrationen anwenden und in `supabase_migrations.schema_migrations` eintragen; `-- --probe` zeigt nur, was offen ist |
| `npm run db:reproduzierbarkeit` | baut das Schema aus den Migrationen neu auf und vergleicht es mit dem laufenden |
| `npm run db:rls` | empirische RLS-Matrix: was darf welche Rolle auf welcher Tabelle wirklich |
| `npm run db:sicherheit` | 78 benannte Nachweise mit Erwartung, positiv und negativ |
| `npm run db:rechte` | Tabellenrechte gegen Policies prüfen; zusätzlich, dass keine Funktion eine Struktur nennt, die es nicht gibt |
| `npm run db:verwendung` | welche Tabellen und RPCs der Anwendungscode anspricht |
| `npm run check:schema-bezug` | dieselbe Auswertung als Prüfung gegen `types/supabase.ts` (läuft in der CI) |
| `npm run db:typen` | `types/supabase.ts` erzeugen; `-- --pruefen` vergleicht nur |
| `npm run db:advisors` | Security- und Performance-Advisors von Supabase |

Bis auf `check:schema-bezug` braucht jedes davon den Development-Zugang. `check:schema-bezug` liest nur die erzeugte Typdatei und läuft deshalb in der CI mit.

---

## 3. Bestand

| Gegenstand | Anzahl | vor Phase 1.4b |
| --- | --- | --- |
| Tabellen | **8** | 37 |
| Spalten | 66 | 324 |
| Primärschlüssel | 8 | 37 |
| Fremdschlüssel | 2 | 52 |
| Eindeutigkeitsbedingungen | 3 | 4 |
| CHECK-Bedingungen | 4 | 26 |
| Indizes | 25 | 127 |
| RLS-Policies | 19 | 66 |
| Funktionen | 19 | 43 |
| Trigger | 4 | 13 |
| Enums | 2 | 4 |
| Views / materialisierte Views | 0 | 0 |
| Sequenzen | 1 | 2 |
| Extensions | 10 | 10 |

Die acht Tabellen: `creator_profiles`, `creator_sessions`, `airports`, `payments`, `refunds`, `stripe_webhooks`, `security_events`, `blocked_ips`. Ihre Einordnung steht in Abschnitt 10.

Enums: `session_status`, `visibility_status`. `blog_status` und `creator_content_type` sind mit ihren Tabellen entfallen. `session_status` hat auf dem Branch keine Spalte und keine Signatur – es war schon vor Phase 1.4b verwaist und ist geblieben, weil sich nicht nachweisen liess, dass es ausschliesslich zur entfernten Struktur gehört ([docs/LEGACY_ENTFERNUNG.md](LEGACY_ENTFERNUNG.md) Abschnitt 9). Geführt als offener Punkt in Abschnitt 11.

Extensions: `citext`, `pg_cron`, `pg_graphql`, `pg_net`, `pg_stat_statements`, `pg_trgm`, `pgcrypto`, `plpgsql`, `supabase_vault`, `uuid-ossp`.

`pg_cron` ist installiert, aber `cron.job` ist leer. Das passt zu Phase 1.1, in der alle vier Cron-Jobs entfernt wurden – es läuft nichts mehr zeitgesteuert.

### Auth- und Storage-Abhängigkeiten

Zwei Tabellen verweisen mit je einem Fremdschlüssel auf `auth.users`: `creator_profiles.user_id` und `creator_sessions.user_id`, beide mit `ON DELETE CASCADE`. Ein gelöschtes Konto nimmt seine Daten also mit. Vor Phase 1.4b waren es 21 Tabellen mit 23 Fremdschlüsseln.

Auf `auth.users` liegt **kein** Trigger. Ein Profil in `creator_profiles` entsteht nicht automatisch bei der Registrierung, sondern erst, wenn die Anwendung eine Zeile anlegt. Ein frisch registriertes Konto hat deshalb kein Profil und damit keine Rolle. Die Zugangsentscheidung aus Phase 1.3 kennt diesen Zustand („keine Rolle hinterlegt") und lehnt ab – das ist das gewollte Verhalten, kein Fehler.

Storage wird nicht verwendet: `storage.buckets` ist leer, und in `storage` existiert keine Policy. Die Alt-Oberflächen, die Dateien hochluden, sind mit Phase 1.1b entfernt worden; die Tabellen, die deren Verweise noch führten (`creator_uploads`, `session_media`, `media_versions`), sind mit Phase 1.4b entfallen.

---

## 4. Drift – was vorgefunden wurde

Der Ausgangszustand war nicht reproduzierbar. Drei Beschreibungen desselben Schemas widersprachen einander:

| Quelle | Aussage |
| --- | --- |
| `supabase/migrations/` | 10 Dateien, die zusammen **2** Tabellen erzeugen (`creator_alert_rules`, `creator_alert_events`) |
| `types/supabase.ts` | **37** Tabellen |
| Development-Branch | **39** Tabellen |

Für 37 der 39 Tabellen gab es keine Migration. Eine Datei war unversioniert benannt (`<timestamp>_realtime_creator_session_metrics.sql`), und der Inhalt einzelner Dateien wich vom realen Bestand ab.

Weitere Befunde der Inventur:

| Befund | Ausmaß |
| --- | --- |
| `anon` und `authenticated` hatten auf **allen** Tabellen alle Rechte, einschließlich `TRUNCATE` | 39 Tabellen |
| Policies, teils doppelt unter zwei Namen, teils an `service_role` (die RLS ohnehin umgeht) oder an die Sammelrolle `public` gebunden | 151 Policies |
| Konkurrierende Admin-Autoritäten: `creator_profiles.role`, `creator_profiles.is_admin`, Tabelle `app_admins`, Tabelle `admin_domains` | 4 Stellen |
| Anwendungscode greift auf Strukturen zu, die es nicht gibt: Tabelle `ip_blocklist`, Funktion `admin_security_overview` | 5 Fundstellen |
| `admin_payments_summary_30d` las `public.payouts` – die Tabelle existiert nicht | 1 Funktion |

Der Zustand nach Phase 1.4 steht in Abschnitt 9; dort ist auch nachgewiesen, dass sich die Migrationen zum laufenden Schema zurückrechnen lassen.

---

## 5. Migrationen

| Datei | Inhalt |
| --- | --- |
| `20260815060111_baseline.sql` | vollständiger Abzug des Schemas, wie es vorgefunden wurde. Ersetzt die zehn früheren Dateien |
| `20260817100000_rollenmodell.sql` | `rollenrang()`, `aktuelle_rolle()`, `hat_rolle_mindestens()`; Rollen und Status in `creator_profiles` bereinigt und mit Bedingungen versehen |
| `20260817100100_policies.sql` | alle 151 Policies verworfen, danach neu aufgebaut; Trigger gegen Rechteausweitung |
| `20260817100200_altlasten_admin.sql` | `admin_domains`, `app_admins`, `is_admin(uuid)` und `creator_profiles.is_admin` entfernt |
| `20260817100300_rechte.sql` | Tabellen-, Sequenz- und Funktionsrechte auf das Nötige begrenzt |
| `20260817100400_schema_hygiene.sql` | deckungsgleiche Indizes, fehlende Fremdschlüsselindizes, doppelte Trigger, `admin_payments_summary_30d` |
| `20260817100500_rollenwechsel_beim_anlegen.sql` | derselbe Schutz beim Anlegen eines Profils wie beim Ändern |
| `20260817100600_policies_zusammenfassen.sql` | überlappende Policies je Tabelle und Operation zu einer zusammengefasst |
| `20260817100700_admin_security_overview.sql` | die von der Oberfläche erwartete, nie vorhandene Funktion hergestellt |
| `20260817100800_faehigkeiten.sql` | Policies von der pauschalen Rolle `admin` auf Fähigkeiten umgestellt, passend zum Rollenmodell aus Phase 1.3 |
| `20260817110000_legacy_entfernen.sql` | 29 obsolete Tabellen, 24 Funktionssignaturen und 2 Enums entfernt (Phase 1.4b) |

Die Reihenfolge ist nicht beliebig: `20260817100200` darf erst laufen, wenn `20260817100000` die Rollen der Betroffenen übernommen und `20260817100100` alle Policies auf `creator_profiles.role` umgestellt hat. Sonst verlöre jemand seinen Zugang oder eine Policy liefe ins Leere.

Auch innerhalb von `20260817110000` ist die Reihenfolge gemessen und nicht gewählt: Abfragefunktionen fallen vor den Tabellen, Triggerfunktionen danach. Die Migration arbeitet **ohne `cascade`**, damit eine unerwartete Abhängigkeit sie scheitern lässt statt still mitgenommen zu werden. Der Nachweis dazu steht in [docs/LEGACY_ENTFERNUNG.md](LEGACY_ENTFERNUNG.md) Abschnitt 4.

---

## 6. Rollen und Eigentum

### Eine Autorität

Wer welche Rolle hat, steht in `creator_profiles.role`. Sonst nirgends.

Vor Phase 1.4 entschieden das vier Stellen unabhängig voneinander – ein Konto konnte in der Anwendung `user` sein und in den Policies trotzdem Administrator, weil eine andere Quelle das sagte. Die drei überzähligen Quellen sind entfernt; wer über `is_admin` oder `app_admins` Administrator war, hat vorher in `20260817100000` die Rolle `admin` erhalten.

Drei Funktionen bilden das Modell in der Datenbank ab:

| Funktion | Aufgabe |
| --- | --- |
| `public.rollenrang(text)` | Rang einer Rolle; `null` für unbekannte Rollen |
| `public.aktuelle_rolle()` | Rolle des angemeldeten Kontos |
| `public.hat_rolle_mindestens(text)` | erreicht das angemeldete Konto einen Mindestrang |

Die Rangfolge ist dieselbe wie in `lib/auth/roles.ts`:

| Rolle | Rang |
| --- | --- |
| `user` | 0 |
| `creator` | 10 |
| `moderator` | 20 |
| `operator` | 30 |
| `admin` | 40 |
| `owner` | 50 |

Dass beide Seiten übereinstimmen, prüft `lib/auth/roles-datenbank.test.ts` bei jedem `npm test` – ohne Datenbank, allein aus dem Migrations-SQL und der TypeScript-Datei. Eine Rolle, die nur auf einer Seite eingetragen wird, lässt den Test fehlschlagen.

`rollenrang()` gibt für eine unbekannte Rolle `null` zurück, nicht `0`. Das ist der Unterschied zwischen „hat die niedrigste Rolle" und „diese Rolle kennt niemand". Die CHECK-Bedingung auf `creator_profiles.role` lautet deshalb `rollenrang(role) is not null`: Eine Rolle, die das Modell nicht kennt, lässt sich nicht eintragen, und die Bedingung wächst mit dem Modell mit, statt eine zweite Liste zu führen.

### Fähigkeiten

Eine Rolle zu kennen genügt nicht. Es muss auch feststehen, **wofür** sie reicht – und zwar für die Anwendung und die Datenbank gemeinsam.

Der erste Anlauf in `20260817100100` stellte jede administrative Policy auf `hat_rolle_mindestens('admin')`. Das war grob und falsch. Die Anwendung lässt den Administrationsbereich seit Phase 1.3 ab `moderator` zu, einzelne Eingriffe verlangen `operator`. Beide Aussagen standen unabhängig voneinander an zwei Orten und liefen auseinander:

| Weg | Anwendung liess durch | Datenbank verlangte | Folge |
| --- | --- | --- | --- |
| `GET /api/admin/security/list` | ab `moderator` | `admin` | leere Liste – sieht aus wie „nichts vorgefallen" |
| `POST /api/admin/security/block` | ab `operator` | `admin` | die Sperre lief ins Leere |
| `POST /api/admin/payments/refund` | ab `operator` | keine Policy für `refunds`/`payments` | die Buchung wurde nie geschrieben |
| `GET /api/admin/payments/webhooks` | ab `moderator` | kein Recht auf `stripe_webhooks` | immer leere Antwort |
| `/admin/users` | ab `moderator` | `admin` | eine Moderation sah kein einziges fremdes Konto |

Seit `20260817100800` sprechen beide Seiten dieselbe Sprache. `CAPABILITY_MINIMUM` in `lib/auth/roles.ts` nennt je Fähigkeit eine Mindestrolle, die Datenbank bildet dieselbe Fähigkeit als Funktion ab:

| Fähigkeit | ab | Funktion | gilt für |
| --- | --- | --- | --- |
| `betrieb-lesen` | `moderator` | `public.darf_betrieb_lesen()` | `security_events`, `blocked_ips`, `payments`, `refunds`, `stripe_webhooks` – lesend |
| `betrieb-eingreifen` | `operator` | `public.darf_betrieb_eingreifen()` | `blocked_ips` schreibend, `refunds` anlegen, `payments` auf erstattet setzen |
| `konten-verwalten` | `moderator` | `public.darf_konten_verwalten()` | fremde `creator_profiles` |
| `inhalte-moderieren` | `moderator` | `public.darf_inhalte_moderieren()` | `creator_sessions` |
| `konfiguration-verwalten` | `admin` | `public.darf_konfiguration_verwalten()` | derzeit **keine Tabelle** |

Die Zuordnung ist aus den bestehenden Gates der Anwendung abgelesen, nicht erfunden.

Zwei Fähigkeiten haben mit Phase 1.4b Fläche verloren. `inhalte-moderieren` deckte zusätzlich `blog_comments` und `session_review_requests` ab; beide Tabellen sind entfallen, `creator_sessions` bleibt. `konfiguration-verwalten` deckte ausschliesslich `admin_email_boxes`, `dns_audit_events` und `copilot_suggestions` ab – alle drei entfernt. Seither ruft keine Policy `darf_konfiguration_verwalten()` mehr auf.

Die Fähigkeit bleibt trotzdem bestehen. Sie ist die höchste Stufe eines Modells, das an zwei Orten übereinstimmen muss – `CAPABILITY_MINIMUM` in `lib/auth/roles.ts` und die `darf_…()`-Funktionen in der Datenbank – und ihre Entfernung wäre ein Eingriff in das Admin-Rollen- und Fähigkeitssystem statt eine Aufräumaktion. Damit sie nicht unbelegt dasteht, prüft `npm run db:sicherheit` sie jetzt direkt: `select 1 where public.darf_konfiguration_verwalten()` liefert einer Administration eine Zeile und dem Betrieb keine. Die Begründung im Einzelnen steht in [docs/LEGACY_ENTFERNUNG.md](LEGACY_ENTFERNUNG.md) Abschnitt 9.

Zwei Prüfungen halten das zusammen:

- `lib/auth/faehigkeiten-datenbank.test.ts` vergleicht `CAPABILITY_MINIMUM` mit den Rollen in den `darf_…()`-Funktionen. Ohne Datenbank, damit die CI ihn ausführen kann.
- `npm run db:rechte` lehnt jede Policy ab, die `hat_rolle_mindestens()` direkt aufruft. Eine neue Policy muss eine Fähigkeit nennen; nur so bleibt die Mindestrolle an einer Stelle.

`hat_rolle_mindestens()` bleibt bestehen – aber nur noch als Baustein innerhalb der fünf Funktionen, nicht mehr als Sprache der Policies.

### Kontostatus

`creator_profiles.status` ist `NOT NULL` mit Vorgabe `active` und erlaubt `active`, `pending`, `disabled`, `banned`.

### Eigentum

Das Eigentumsmodell ist einheitlich: Eine Zeile gehört dem Konto in ihrer Spalte `user_id`.

| Muster | Regel |
| --- | --- |
| eigene Zeile | `user_id = auth.uid()` – lesen, ändern, löschen. Gilt für `creator_profiles` und `creator_sessions` |
| öffentlich | `airports`, lesend – seit Phase 1.4b die einzige Tabelle ohne Anmeldung |
| Verwaltung | über eine Fähigkeit, nicht über eine Rolle – siehe die Tabelle oben |
| nur mit Service-Key schreibbar | `stripe_webhooks` |

Ein Profil gehört zu genau einem Konto: `user_id` ist `NOT NULL`, eindeutig, und verweist mit `ON DELETE CASCADE` auf `auth.users`.

### Rechteausweitung

Rolle und Status ändert niemand an sich selbst. Der Trigger `creator_profiles_rollenwechsel` prüft beim Anlegen **und** beim Ändern:

- Die eigene Rolle und der eigene Status sind unveränderlich – auch für den Inhaber.
- Rollen vergeben darf erst ab `moderator`.
- Vergeben lässt sich nur eine Rolle unterhalb der eigenen, und nur an ein Konto unterhalb der eigenen. Ausgenommen ist `owner`, damit eine Nachfolge einrichtbar bleibt.
- Ein selbst angelegtes Profil bekommt `role = 'user'` und `status = 'active'`, sonst nichts.

Der letzte Punkt war eine echte Lücke: Ein frisch registriertes Konto ohne Profil konnte sich sein erstes Profil mit `role = 'owner'` ausstellen. Die Policy prüfte nur, dass die Zeile dem eigenen Konto gehört.

---

## 7. Row Level Security

RLS ist auf allen 8 Tabellen eingeschaltet, mit 19 Policies. Vor Phase 1.4b waren es 37 Tabellen mit 66 Policies; die 47 entfallenen Policies gehörten zu den entfernten Tabellen und haben ohne sie keine Bedeutung.

Ein Zugriff hängt an vier Dingen, nicht an einem: am Tabellenrecht, am RLS-Schalter, an der Policy und an deren Rollenbindung. Fehlt das Tabellenrecht, ist die schönste Policy wirkungslos – und umgekehrt.

### Rechte

`anon` und `authenticated` haben kein Recht mehr, das nicht eine Policy braucht. `npm run db:rechte` prüft beide Richtungen und meldet 20 vergebene Tabellenrechte, jedes durch eine Policy gedeckt, und keine Policy ohne das zugehörige Recht. Vor Phase 1.4b waren es 118.

`TRUNCATE`, `REFERENCES` und `TRIGGER` sind entzogen. `TRUNCATE` war der schwerwiegendste Einzelbefund der Inventur: Das Recht umgeht RLS vollständig. Jedes angemeldete Konto – und über `anon` jeder Besucher – konnte `truncate public.payments` ausführen und die Tabelle leeren, obwohl keine Policy ihm auch nur eine Zeile zum Lesen gab.

`anon` darf genau **eine** Tabelle lesen: `airports`. `blog_posts` und `blog_comments` waren die beiden anderen und sind mit Phase 1.4b entfallen.

Seit Phase 1.4b prüft `npm run db:rechte` eine vierte Regel: Kein `public.<name>` in einem Funktionsrumpf darf ins Leere greifen – es muss sich als Relation, Funktion oder Typ auflösen. Das ist die Antwort auf eine Fehlerklasse, nicht auf einen Einzelfall: PostgreSQL verfolgt Tabellenbezüge im Rumpf einer Funktion nicht in `pg_depend`, weshalb 18 Signaturen den `drop table` unbemerkt überlebt hätten und erst beim Aufruf mit „relation does not exist" gescheitert wären – dieselbe Klasse wie `ip_blocklist` und `admin_security_overview` in Phase 1.4. Die Prüfung ist gegengeprobt: In einer zurückgerollten Transaktion findet sie eine künstlich erzeugte Funktion mit totem Bezug.

### Nachweise

`npm run db:rls` misst die vollständige Matrix aus Rolle × Tabelle × Operation. Gemessen wird, nicht abgeleitet: Vier Konten (nicht angemeldet, Eigentümerin, fremdes Konto, Administration) probieren jede Operation auf jeder Tabelle aus – nach Phase 1.4b sind das 144 Proben über 8 Tabellen. Der ganze Lauf liegt in einer Transaktion, die am Ende zurückgerollt wird, und jede einzelne Probe zusätzlich in einem eigenen Unterabschnitt – sonst nähme ein erfolgreiches `delete` die Zeilen abhängiger Tabellen mit und verfälschte jede spätere Messung.

`npm run db:sicherheit` prüft dieselbe Datenbank gegen 78 benannte Erwartungen. Der Unterschied ist wichtig: Die Matrix zeigt, was gilt; die Nachweise sagen, was gelten **soll**, und schlagen fehl, wenn es sich ändert.

Neun Nachweise bezogen sich auf Tabellen oder Funktionen, die Phase 1.4b entfernt hat. Sie sind nicht gestrichen, sondern durch gleichwertige an verbleibenden Strukturen ersetzt – ein Nachweis, der wegfällt, nimmt seine Aussage mit. Der Ersatz ist teils strenger als das Original: Statt zu prüfen, dass `anon` eine benannte `SECURITY DEFINER`-Funktion nicht ausführen darf, prüft er das für **jede** solche Funktion in `public` und deckt damit auch Funktionen ab, die noch niemand geschrieben hat. Die Gegenüberstellung steht in [docs/LEGACY_ENTFERNUNG.md](LEGACY_ENTFERNUNG.md) Abschnitt 11.

Neun Konten decken jede Stufe des Modells ab: `user`, ein zweites `user`, `creator`, `moderator`, `operator`, `admin`, `owner`, ein gesperrtes Konto und eines ganz ohne Profil. Die beiden mittleren Rollen fehlten zunächst – und genau deshalb blieb unbemerkt, dass die Policies pauschal `admin` verlangten.

Ein Ausschnitt:

| Nachweis | Erwartung |
| --- | --- |
| `anon` liest Flughäfen | erlaubt |
| `anon` hat auf keiner Tabelle ausser `airports` ein Recht | erfüllt |
| `anon` liest Profile, Zahlungen, Sicherheitsereignisse, Sitzungen, Stripe-Ereignisse | abgelehnt, 42501 |
| `anon` legt eine Sitzung an | abgelehnt, 42501 |
| `anon` und angemeldetes Konto leeren eine Tabelle mit `TRUNCATE` | abgelehnt, 42501 |
| Konto liest und ändert das eigene Profil | erlaubt |
| Konto liest oder ändert ein fremdes Profil | 0 Zeilen |
| Konto legt eine Sitzung im fremden Namen an | abgelehnt |
| Konto befördert sich selbst zum Inhaber | abgelehnt |
| gesperrtes Konto entsperrt sich selbst | abgelehnt |
| neues Konto legt sich ein Profil mit `role = 'owner'` an | abgelehnt |
| Administration ernennt eine zweite Administration | abgelehnt |
| Inhaber ernennt eine Administration | erlaubt |
| unbekannte Rolle oder unbekannter Status | abgelehnt, 23514 |

Und je Fähigkeit ein Paar aus der Stufe, ab der sie gilt, und der Stufe direkt darunter:

| Nachweis | Erwartung |
| --- | --- |
| Moderation liest Sicherheitsereignisse, Sperrliste, Zahlungen, Rückerstattungen, Stripe-Ereignisse | erlaubt |
| Creator liest dieselben fünf | 0 Zeilen |
| Betrieb sperrt eine IP, entsperrt eine IP | erlaubt |
| Moderation sperrt eine IP | abgelehnt |
| Moderation entsperrt eine IP | 0 Zeilen |
| Betrieb bucht eine Rückerstattung, setzt eine Zahlung auf erstattet | erlaubt |
| Moderation bucht eine Rückerstattung | abgelehnt |
| Moderation liest fremde Profile, setzt ein fremdes Konto auf `creator` | erlaubt |
| Moderation ernennt eine Administration | abgelehnt |
| Creator liest fremde Profile, fremde Sitzungen | 0 Zeilen |
| Moderation liest eine fremde Sitzung, ändert eine fremde Sitzung | erlaubt |
| Creator ändert eine fremde Sitzung | 0 Zeilen |
| Administration erreicht die Fähigkeit `konfiguration-verwalten` | erlaubt |
| Betrieb erreicht dieselbe Fähigkeit | 0 Zeilen |
| keine `SECURITY DEFINER`-Funktion ist für `anon` ausführbar | erfüllt |
| Moderation ruft `admin_payments_summary_30d()` und `admin_security_overview()` | erlaubt |
| Creator ruft dieselben beiden | 0 Zeilen |

Die Unterscheidung zwischen „abgelehnt" (`42501`, das Recht fehlt) und „0 Zeilen" (das Recht besteht, die Policy gibt nichts frei) ist beabsichtigt und wird mitgeprüft. Beides sieht für die Anwendung gleich aus, sagt aber Verschiedenes über die Ursache.

### Notzugang

`ADMIN_ALLOWED_EMAILS` öffnet die Oberfläche des Administrationsbereichs, auch wenn die Rolle fehlt oder nicht lesbar war. Es erteilt **keine** Rechte in der Datenbank. Die Begründung steht in ADR-0036; kurz: Die Liste ist eine Umgebungsvariable der Anwendung, und eine zweite Autorität neben `creator_profiles.role` ist genau das, was Phase 1.4 mit `admin_domains` und `app_admins` beseitigt hat.

Für die Datenbank ist ein solches Konto schlicht das, was seine Rolle sagt. Vier Nachweise halten das fest:

| Nachweis | Erwartung |
| --- | --- |
| Notzugang mit Rolle `user` liest Sicherheitsereignisse | 0 Zeilen |
| Notzugang mit Rolle `user` sperrt eine IP | abgelehnt |
| Notzugang ohne Profil liest Zahlungen | 0 Zeilen |
| Notzugang ohne Profil liest alle Profile | 0 Zeilen |

Damit das nicht als Ausfall missverstanden wird, zeigt der Bereich seit dem Nachtrag einen Hinweis über der gesamten Shell (`components/admin/NotzugangHinweis.tsx`), sobald `grant === 'break-glass'` gilt. Ohne ihn wäre die Einschränkung nicht zu erkennen: Die Seiten laden, die Listen bleiben leer – dieselbe Verwechslung von „nichts vorgefallen" mit „nicht berechtigt", die Phase 1.4 an mehreren Stellen behoben hat.

Auf der Seite der Anwendung hält `reachesDatabase()` in `lib/auth/admin-access.ts` denselben Satz fest, und `lib/auth/admin-access.test.ts` prüft ihn – auch für den Fall einer ausgefallenen Rollenabfrage.

Der Weg zurück in den regulären Betrieb führt nicht durch die Anwendung: Das Konto braucht einen Eintrag in `creator_profiles.role`. Auf dem Development-Branch geschieht das über den SQL-Editor oder `scripts/db/sql.mjs`, für Production über eine Migration oder eine bereits berechtigte Person. Ein Selbstbedienungsweg wäre wieder eine Autorität, die an der Rolle vorbeigeht.

### Leere Liste und Fehler

Eine leere Liste ist im Administrationsbereich eine Aussage: keine Sperre, keine Fehlanmeldung, keine Zahlung. Deshalb darf sie nicht auch die Antwort auf einen Fehler sein. Seit ADR-0037 trennen die lesenden Routen drei Ausgänge:

| Lage | Antwort |
| --- | --- |
| Abfrage lief, keine Zeile | 200 mit leerer Liste |
| Zeilen von RLS weggefiltert | 200 mit leerer Liste – die Datenbank hat geantwortet, und ihre Antwort lautet „keine" |
| Datenbank lehnt ab: fehlendes Recht, fehlende Relation, fehlerhafte Anfrage | 500 mit `{ message }` |
| Datenbank nicht erreichbar, abgebrochen, Verbindungen erschöpft | 503 mit `{ message }` |

Die Unterscheidung steht einmal in `lese()` in `lib/api/datenbank-lesen.ts` und wird von `security/summary`, `security/events`, `payments/list`, `payments/summary`, `payments/breakdown` und `payments/webhooks` benutzt. `security/list` und `payments/refund` waren bereits vorher fail-closed und antworten auf jede Fehlerart mit 500.

Nachgewiesen ist das am laufenden Server: Mit entzogenem `select` auf `payments` antworten die drei Zahlungswege 500 mit `permission denied for table payments`, während die Sicherheitswege unverändert 200 liefern – vorher gaben alle drei 200 mit `{"rows":[],"next_cursor":null}` zurück. Eine Suche ohne Treffer bleibt 200 mit leerer Liste.

### `stripe_webhooks`

Die Tabelle wird ausschliesslich vom Webhook geschrieben, der mit dem Service-Key arbeitet; eine Schreibpolicy gibt es bewusst nicht. Lesbar ist sie seit `20260817100800` ab der Fähigkeit `betrieb-lesen`, weil `GET /api/admin/payments/webhooks` sie anzeigt und die Antwort sonst dauerhaft leer bliebe. Sie führt nur Kennung, Ereignisart und Zeitpunkt – keine Nutzlast und keine Kundendaten.

---

## 8. Advisor-Befunde

Behoben sind `function_search_path_mutable`, `auth_rls_initplan`, `multiple_permissive_policies`, `duplicate_index` und – seit `20260817100800` – `rls_enabled_no_policy`. Es bleiben **13** Security- und **9** Performance-Befunde; vor Phase 1.4b waren es 45 und 47. Was bleibt, bleibt mit Grund:

| Befund | Anzahl | vor 1.4b | Bewertung |
| --- | --- | --- | --- |
| `authenticated_security_definer_function_executable` | 4 | 4 | `aktuelle_rolle()` und `hat_rolle_mindestens()` werden von den Policies gebraucht und müssen deshalb für `authenticated` ausführbar sein. Sie geben nur Auskunft über das aufrufende Konto selbst. `admin_payments_summary_30d()` und `admin_security_overview()` prüfen die Fähigkeit intern und liefern ohne `betrieb-lesen` keine Zeile – nachgewiesen in Abschnitt 7 |
| `pg_graphql_anon_table_exposed` | 1 | 3 | nur noch `airports`; die Tabelle soll ohne Anmeldung lesbar sein. Sichtbarkeit im GraphQL-Schema ist die Folge des `SELECT`-Rechts, nicht ein zusätzliches Recht. `blog_posts` und `blog_comments` sind mit Phase 1.4b entfallen |
| `pg_graphql_authenticated_table_exposed` | 8 | 37 | dasselbe für angemeldete Konten, jetzt für alle acht verbleibenden Tabellen. Welche Zeilen sichtbar sind, entscheidet RLS – nachgewiesen in Abschnitt 7 |
| `unused_index` | 8 | 46 | der Development-Branch trägt keine echte Last. Ein Index, den nie eine Abfrage benutzt hat, ist auf einem Branch ohne Verkehr keine Aussage. Die 19 Fremdschlüsselindizes aus `20260817100400` lagen auf den entfernten Tabellen und sind mit ihnen weg; die verbleibenden acht liegen auf `airports`, `creator_profiles` und `creator_sessions` |
| `auth_db_connections_absolute` | 1 | 1 | Einstellung des Auth-Servers, kein Schemabefund. Gehört zur Kapazitätsplanung vor dem Launch |
| `auth_leaked_password_protection` | – | 1 | im Lauf nach Phase 1.4b **nicht gemeldet**, siehe unten. `password_hibp_enabled` ist unverändert `false` und bleibt offener Punkt, siehe Abschnitt 11 |
| `rls_enabled_no_policy` | 0 | 0 | bleibt behoben |

Die vier `SECURITY DEFINER`-Funktionen folgen demselben Muster: interne Prüfung statt Rechteentzug. `pg_policy` wäre für jede Rolle lesbar und verriete die Bedingung jeder Policy; `admin_security_overview()` gibt nur deren Anzahl heraus.

`auth_leaked_password_protection` meldeten die Advisors in den Läufen vom 17. August 09:20 und 10:49 nicht, im Abschlusslauf der Phase 1.4 dagegen schon – und im Lauf nach Phase 1.4b wieder nicht. Geschrieben hat die Einstellung keine der beiden Phasen; gearbeitet wurde ausschliesslich über Migrationen und SQL. Naheliegend ist, dass der Advisor den Befund nur meldet, solange passwortgestützte Konten auf dem Branch existieren, und die Testkonten entstehen in zurückgerollten Transaktionen. Bewiesen ist das nicht. Festgehalten ist, dass `password_hibp_enabled` unverändert `false` ist.

Die fünf `darf_…()`-Funktionen erzeugen keinen Befund: Sie sind `SECURITY INVOKER` und tragen einen festen `search_path`.

---

## 9. Reproduzierbarkeit und Prüfungen

### Der Wiederaufbau wird gemessen

`npm run db:reproduzierbarkeit` verlässt sich nicht darauf, dass die Migrationen fehlerfrei durchlaufen. Ein Durchlauf ohne Fehler ist nicht dasselbe wie ein gleiches Ergebnis.

Das Skript verwirft `public` in einer Transaktion, baut es aus den Migrationen neu auf, nimmt von beiden Ständen – dem laufenden und dem neu gebauten – denselben Fingerabdruck und rollt zurück. Verglichen werden achtzehn Abschnitte: Tabellen, Spalten, Bedingungen, Indizes, Policies, Trigger, Funktionen, Typen, Views, Sequenzen, Tabellen-, Funktions-, Sequenz-, Spalten- und Vorgaberechte, Kommentare, Extensions, Publikationen. Funktionen werden über einen Hash ihres Textes verglichen statt über den Text selbst – `pg_get_functiondef` bringt bei gleicher Definition Formatierungsunterschiede mit, die keine Schemaabweichung sind.

Danach prüft das Skript ein zweites Mal, dass das laufende Schema unverändert ist. Ein Test, der die Datenbank verändert, die er prüft, wäre wertlos.

Ergebnis über alle elf Migrationen: kein Unterschied. Das ist nach Phase 1.4b die wichtigste Einzelaussage: Die Entfernung von 29 Tabellen steht vollständig in einer Migration, nicht in der Oberfläche – ein Wiederaufbau aus dem Repository ergibt genau die acht Tabellen des laufenden Branches.

Zwei Dinge mussten dafür geklärt werden. Erstens hing die Darstellung von Bedingungen und Typen am `search_path` – derselbe Index wurde einmal mit und einmal ohne Schemapräfix ausgegeben und sah dadurch verschieden aus, obwohl er identisch war. Beide Fingerabdrücke laufen jetzt mit demselben Pfad. Zweitens gehören 48 Vorgaberechte dem Platform-Rollenkonto `supabase_admin`; `alter default privileges for role supabase_admin` scheitert als `postgres` mit „permission denied", eine Anwendungsmigration kann sie also gar nicht herstellen. Sie sind ausdrücklich vom Vergleich ausgenommen, statt den Vergleich weicher zu machen.

Der Vergleich hat sich gelohnt: Er fand 153 Rechte, die im Abzug anders standen als im laufenden Schema. Ohne ihn wären sie mit der Baseline eingefroren worden.

### Was in der CI läuft

| Prüfung | braucht Datenbank |
| --- | --- |
| `npm test` – darin `lib/auth/roles-datenbank.test.ts`, Rollenmodell in TypeScript gegen das Rollenmodell im Migrations-SQL | nein |
| `npm test` – darin `lib/auth/faehigkeiten-datenbank.test.ts`, `CAPABILITY_MINIMUM` gegen die `darf_…()`-Funktionen | nein |
| `npm test` – darin `lib/api/datenbank-lesen.test.ts`, Fehler gegen echte Leere, und `lib/api/suchfilter.test.ts` | nein |
| `npm run check:schema-bezug` – jedes `.from()` und `.rpc()` gegen `types/supabase.ts` | nein |
| `npm run check:api-schutz` – jede Admin-Route ruft `requireAdminApi()` | nein |

`check:schema-bezug` ist die Antwort auf einen konkreten Fehler. Drei Routen schrieben und lasen `ip_blocklist`; diese Tabelle gibt es nicht, die richtige heißt `blocked_ips`. Aufgefallen ist es nie, weil `supabase-js` nicht wirft, sondern im `error`-Feld meldet – das `try/catch` um den Aufruf lief also nie an, und das Sperren einer IP meldete Erfolg, ohne etwas zu tun. Ebenso rief die Oberfläche eine Funktion `admin_security_overview` auf, die es nicht gab, fing den Fehler ab und zeigte aus null Zeilen „RLS aktiv 0/0 – alle Tabellen geschützt".

Beides ist behoben. Die Prüfung verhindert den Rückfall und kostet keinen Datenbankzugang.

| Prüfung | braucht Datenbank |
| --- | --- |
| `npm run db:reproduzierbarkeit` | ja |
| `npm run db:sicherheit` | ja |
| `npm run db:rechte` | ja |
| `npm run db:typen -- --pruefen` | ja |
| `npm run db:advisors` | ja |

Diese fünf laufen vor einer Zusammenführung von Hand gegen den Development-Branch. In die CI gehören sie erst, wenn dafür ein eigener, kurzlebiger Branch entsteht – ein CI-Lauf gegen den gemeinsamen Development-Branch würde bei nebenläufigen Läufen dieselben Testkonten anlegen.

---

## 10. Einordnung der Tabellen

Maßstab ist nicht der Name, sondern die Verwendung. Grundlage ist `npm run db:verwendung`, das nur die Stellen zählt, an denen der Supabase-Client eine Struktur wirklich anspricht. Eine Textsuche zählt zu viel: `payments` trifft auch `admin_payments`, `creator_profiles` auch `sync_creator_profile_core`.

Nach Phase 1.4b enthält das Schema nur noch Tabellen, die verwendet werden. Die Einordnung bleibt trotzdem stehen: Sie erklärt, warum die acht geblieben sind, und die letzten beiden Abschnitte halten fest, was entfernt wurde.

### V2 benötigt – 7

| Tabelle | Zweck |
| --- | --- |
| `creator_profiles` | Konto, Rolle, Status. Wird in Phase 1.5 zum generischen Profil |
| `airports` | Flughafendaten für die Flugintegration (Phase 3), benutzt von `api/search/airports` |
| `payments`, `refunds`, `stripe_webhooks` | Zahlungen, behalten ohne Priorität ([DECISIONS.md](../DECISIONS.md) ADR-0010) |
| `security_events`, `blocked_ips` | Sicherheitsereignisse und IP-Sperren im Administrationsbereich |

### Vorläufig benötigt – 1

`creator_sessions` gehört zur alten Produktidee, versorgt aber die Startseite des Administrationsbereichs mit den Kennzahlen „Sitzungen (30 Tage)" und dem 14-Tage-Verlauf (`AdminStatsStrip`, `AdminTimeSeries`). Die Tabelle verschwindet, sobald diese Kennzahlen auf Reisen umgestellt sind – das gehört zu Phase 1.5, nicht hierher.

### Entfernt in Phase 1.4b – 29

Kein Anwendungscode sprach diese Tabellen mehr an. Sie stammten aus der Creator-, Media-, Blog- und Publishing-Welt, deren Oberflächen mit Phase 1.1b und deren Endpunkte mit Phase 1.1 entfernt wurden. Alle 29 waren beim Entfernen leer.

| Bereich | Tabellen |
| --- | --- |
| Blog | `blog_posts`, `blog_comments` |
| Creator-Analytics und Alarme | `creator_alert_events`, `creator_alert_rules`, `creator_session_metrics`, `session_metrics`, `session_metrics_daily` |
| Publishing | `creator_publish_events`, `creator_publish_queue`, `creator_publish_schedule` |
| Medien und Rendering | `creator_uploads`, `edit_docs`, `media_versions`, `render_jobs`, `session_media` |
| Sitzungen und Social | `session_cocreations`, `session_comments`, `session_impressions`, `session_review_requests`, `session_saves`, `session_snippets`, `session_stories`, `session_versions`, `session_views` |
| Infrastruktur-Automatisierung | `admin_email_boxes`, `dns_audit_events` |
| Sonstiges | `copilot_suggestions`, `insights_bets`, `insights_user_settings` |

`insights_bets` und `insights_user_settings` bildeten Wetten mit Quoten ab (`odds >= 1.01`). Sie hatten mit Reisen nichts zu tun.

Der Schritt war absichtlich nicht Teil von Phase 1.4: 29 Tabellen zu entfernen ist eine eigene, unumkehrbare Handlung, und nach [AGENTS.md](../AGENTS.md) Regel 22 gehört ein Archiv-Tag davor. Phase 1.4 hat sie stattdessen versioniert, RLS-gedeckt und rechtlich eng geführt, damit sie in der Zwischenzeit keinen Schaden anrichten konnten.

Mit den Tabellen sind 24 Funktionssignaturen, 9 Trigger und die Enums `blog_status` und `creator_content_type` entfallen. Der vollständige Nachweis – Zeilenzahlen, Abhängigkeiten, Trockenlauf ohne `cascade`, bewusst verbliebene Objekte – steht in [docs/LEGACY_ENTFERNUNG.md](LEGACY_ENTFERNUNG.md).

### Entfernt in Phase 1.4 – 2

| Tabelle | Grund |
| --- | --- |
| `admin_domains` | Eine Domain erteilt keine Berechtigung ([DECISIONS.md](../DECISIONS.md) ADR-0027). Unbenutzt |
| `app_admins` | zweite Admin-Liste neben `creator_profiles.role`. Die Einträge haben vorher die Rolle `admin` erhalten |

Mit ihnen sind `public.is_admin(uuid)` und die Spalte `creator_profiles.is_admin` entfallen.

### Erledigte Redundanz

Vier Tabellen trugen denselben Fremdschlüssel doppelt oder dreifach: `blog_comments.user_id` (2), `creator_session_metrics.session_id` (3), `edit_docs.session_id` (2), `render_jobs.session_id` (2). Phase 1.4 hat sie nicht einzeln bereinigt, weil das Arbeit an Code gewesen wäre, der als Nächstes entfernt wird ([AGENTS.md](../AGENTS.md) Regel 22). Alle vier Tabellen gehörten zu den 29 und sind mitsamt der Redundanz entfallen.

Keine der zwei verbleibenden Fremdschlüsselbedingungen ist doppelt.

---

## 11. Offene Punkte

| Punkt | Einordnung |
| --- | --- |
| `creator_profiles` in ein generisches Profil überführen | Phase 1.5. Der Tabellenname steht nur in `ROLE_TABLE` in `lib/auth/admin-guard.ts` |
| `creator_sessions` aus den Admin-Kennzahlen lösen | Phase 1.5, zusammen mit dem Reise-Schema |
| Enum `session_status` | verwaist: keine Spalte, keine Signatur, kein `pg_depend`-Eintrag. Schon vor Phase 1.4b verwaist und deshalb nicht mitentfernt – seine drei Werte `pending`, `approved`, `rejected` sind genau die, die `creator_sessions_review_status_check` auf der verbleibenden Spalte `creator_sessions.review_status` erlaubt. Damit gehört er nicht nachweisbar ausschliesslich zur entfernten Struktur ([docs/LEGACY_ENTFERNUNG.md](LEGACY_ENTFERNUNG.md) Abschnitt 9). Entscheidung fällig, wenn Phase 1.5 `creator_sessions` neu schneidet |
| Fähigkeit `konfiguration-verwalten` ohne Fläche | deckt seit Phase 1.4b keine Tabelle mehr ab, bleibt aber als höchste Stufe des Fähigkeitsmodells bestehen und wird direkt geprüft, siehe Abschnitt 6 |
| Fünf Funktionen ohne Aufrufer auf verbleibenden Tabellen | `sync_creator_profile_core()`, `sync_creator_profile_emails()`, `append_email_to_array()` (2 Signaturen), `remove_email_from_array()` hängen an keinem Trigger und werden vom Anwendungscode nicht gerufen. Sie gehören zu `creator_profiles` und `creator_sessions`, nicht zur Legacy-Struktur, und lagen damit ausserhalb des Auftrags von Phase 1.4b. Entscheidung fällig in Phase 1.5 |
| Datenbanknahe Prüfungen in die CI | braucht einen kurzlebigen Branch je Lauf, siehe Abschnitt 9 |
| Fehler in der Oberfläche sichtbar machen | Die Routen antworten seit ADR-0037 korrekt, aber `TransactionsCard` und `WebhooksCard` in `components/admin/payments/PaymentsCenter.tsx` werfen die Meldung in ein `finally` ohne `catch`. Die Tabelle bleibt dann leer statt zu erklären, warum. `OverviewCard` und `SecurityWidget` zeigen die Meldung bereits an |
| Schutz vor kompromittierten Passwörtern | `password_hibp_enabled` steht auf `false`, obwohl `components/auth/RegisterForm.tsx` die zugehörige Fehlermeldung bereits übersetzt. Bewusst nicht im Vorbeigehen umgelegt: Eine Auth-Einstellung liegt neben dem Schema, sie steht in keiner Migration und wäre aus dem Repository weder nachvollziehbar noch reproduzierbar. Sie gehört zusammen mit `password_min_length` und den Redirect-URLs in einen eigenen Schritt, der die Auth-Konfiguration versioniert |
| Auth-Konfiguration nicht versioniert | `supabase/config.toml` ist der unveränderte Vorlagenstand der CLI – `site_url` zeigt auf `127.0.0.1`, `minimum_password_length` steht auf 6, der Branch verlangt 12. Die Datei beschreibt damit weder Development noch Production. Solange das so bleibt, ist die Auth-Ebene die einzige Schicht, die nicht aus dem Repository hervorgeht |
| Production-Stand | weder in Phase 1.4 noch in Phase 1.4b erhoben oder verändert. Ob Production dieselben 29 Tabellen trägt, ist damit unbekannt – nicht angenommen. Der Abgleich gehört zum ersten Production-Deploy nach 1.5 |
