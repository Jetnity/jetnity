# Jetnity – Datenbank

Stand: 17. August 2026
Gültig für: Supabase-Development-Branch nach Phase 1.4

Diese Datei beschreibt den **tatsächlichen** Zustand des Schemas, wie er sich aus dem Repository herstellen lässt. Sie ist die Antwort auf die Frage, die [ARCHITECTURE.md](../ARCHITECTURE.md) Abschnitt 6 bis Phase 1.4 offenlassen musste: Was steht in der Datenbank, wer darf was, und woher weiß man das.

Alle Angaben stammen aus dem Development-Branch. Production ist in Phase 1.4 nicht angefasst worden.

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
| `npm run db:sicherheit` | 45 benannte Nachweise mit Erwartung, positiv und negativ |
| `npm run db:rechte` | Tabellenrechte gegen Policies prüfen |
| `npm run db:verwendung` | welche Tabellen und RPCs der Anwendungscode anspricht |
| `npm run check:schema-bezug` | dieselbe Auswertung als Prüfung gegen `types/supabase.ts` (läuft in der CI) |
| `npm run db:typen` | `types/supabase.ts` erzeugen; `-- --pruefen` vergleicht nur |
| `npm run db:advisors` | Security- und Performance-Advisors von Supabase |

Bis auf `check:schema-bezug` braucht jedes davon den Development-Zugang. `check:schema-bezug` liest nur die erzeugte Typdatei und läuft deshalb in der CI mit.

---

## 3. Bestand

| Gegenstand | Anzahl |
| --- | --- |
| Tabellen | 37 |
| Spalten | 324 |
| Primärschlüssel | 37 |
| Fremdschlüssel | 52 |
| Eindeutigkeitsbedingungen | 4 |
| CHECK-Bedingungen | 26 |
| Indizes | 127 |
| RLS-Policies | 60 |
| Funktionen | 38 |
| Trigger | 13 |
| Enums | 4 |
| Views / materialisierte Views | 0 |
| Sequenzen | 2 |
| Extensions | 10 |

Enums: `blog_status`, `creator_content_type`, `session_status`, `visibility_status`.

Extensions: `citext`, `pg_cron`, `pg_graphql`, `pg_net`, `pg_stat_statements`, `pg_trgm`, `pgcrypto`, `plpgsql`, `supabase_vault`, `uuid-ossp`.

`pg_cron` ist installiert, aber `cron.job` ist leer. Das passt zu Phase 1.1, in der alle vier Cron-Jobs entfernt wurden – es läuft nichts mehr zeitgesteuert.

### Auth- und Storage-Abhängigkeiten

21 Tabellen verweisen mit zusammen 23 Fremdschlüsseln auf `auth.users`, fast durchgehend mit `ON DELETE CASCADE`. Ein gelöschtes Konto nimmt seine Daten also mit.

Auf `auth.users` liegt **kein** Trigger. Ein Profil in `creator_profiles` entsteht nicht automatisch bei der Registrierung, sondern erst, wenn die Anwendung eine Zeile anlegt. Ein frisch registriertes Konto hat deshalb kein Profil und damit keine Rolle. Die Zugangsentscheidung aus Phase 1.3 kennt diesen Zustand („keine Rolle hinterlegt") und lehnt ab – das ist das gewollte Verhalten, kein Fehler.

Storage wird nicht verwendet: `storage.buckets` ist leer, und in `storage` existiert keine Policy. Die Alt-Oberflächen, die Dateien hochluden, sind mit Phase 1.1b entfernt worden; die zugehörigen Tabellen (`creator_uploads`, `session_media`, `media_versions`) enthalten nur noch Verweise.

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

Die Reihenfolge ist nicht beliebig: `20260817100200` darf erst laufen, wenn `20260817100000` die Rollen der Betroffenen übernommen und `20260817100100` alle Policies auf `creator_profiles.role` umgestellt hat. Sonst verlöre jemand seinen Zugang oder eine Policy liefe ins Leere.

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

### Kontostatus

`creator_profiles.status` ist `NOT NULL` mit Vorgabe `active` und erlaubt `active`, `pending`, `disabled`, `banned`.

### Eigentum

Das Eigentumsmodell ist einheitlich: Eine Zeile gehört dem Konto in ihrer Spalte `user_id`. Bei Tabellen, die an einer Sitzung hängen, gehört die Zeile dem Konto der Sitzung.

| Muster | Regel |
| --- | --- |
| eigene Zeile | `user_id = auth.uid()` – lesen, ändern, löschen |
| Zeile an fremder Sitzung | Eigentum folgt `creator_sessions.user_id` |
| öffentlich | `airports` sowie veröffentlichte Beiträge und sichtbare Kommentare, lesend |
| Administration | ab `admin` lesend über alles, schreibend nur dort, wo die Verwaltung es braucht |
| nur Service-Key | `stripe_webhooks` |

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

RLS ist auf allen 37 Tabellen eingeschaltet, mit 60 Policies.

Ein Zugriff hängt an vier Dingen, nicht an einem: am Tabellenrecht, am RLS-Schalter, an der Policy und an deren Rollenbindung. Fehlt das Tabellenrecht, ist die schönste Policy wirkungslos – und umgekehrt.

### Rechte

`anon` und `authenticated` haben kein Recht mehr, das nicht eine Policy braucht. `npm run db:rechte` prüft beide Richtungen und meldet 115 vergebene Tabellenrechte, jedes durch eine Policy gedeckt, und keine Policy ohne das zugehörige Recht.

`TRUNCATE`, `REFERENCES` und `TRIGGER` sind entzogen. `TRUNCATE` war der schwerwiegendste Einzelbefund der Inventur: Das Recht umgeht RLS vollständig. Jedes angemeldete Konto – und über `anon` jeder Besucher – konnte `truncate public.payments` ausführen und die Tabelle leeren, obwohl keine Policy ihm auch nur eine Zeile zum Lesen gab.

`anon` darf nur noch drei Tabellen lesen: `airports`, `blog_posts`, `blog_comments`.

### Nachweise

`npm run db:rls` misst die vollständige Matrix aus Rolle × Tabelle × Operation. Gemessen wird, nicht abgeleitet: Vier Konten (nicht angemeldet, Eigentümerin, fremdes Konto, Administration) probieren jede Operation auf jeder Tabelle aus. Der ganze Lauf liegt in einer Transaktion, die am Ende zurückgerollt wird, und jede einzelne Probe zusätzlich in einem eigenen Unterabschnitt – sonst nähme ein erfolgreiches `delete` die Zeilen abhängiger Tabellen mit und verfälschte jede spätere Messung.

`npm run db:sicherheit` prüft dieselbe Datenbank gegen 45 benannte Erwartungen. Der Unterschied ist wichtig: Die Matrix zeigt, was gilt; die Nachweise sagen, was gelten **soll**, und schlagen fehl, wenn es sich ändert.

Ein Ausschnitt:

| Nachweis | Erwartung |
| --- | --- |
| `anon` liest Flughäfen | erlaubt |
| `anon` liest Profile, Zahlungen, Sicherheitsereignisse | abgelehnt, 42501 |
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
| gewöhnliches Konto liest Zahlungen | 0 Zeilen |
| Administration liest Zahlungen | erlaubt |
| gewöhnliches Konto sperrt eine IP | abgelehnt |
| angemeldetes Konto liest Stripe-Ereignisse | abgelehnt, 42501 |

Die Unterscheidung zwischen „abgelehnt" (`42501`, das Recht fehlt) und „0 Zeilen" (das Recht besteht, die Policy gibt nichts frei) ist beabsichtigt und wird mitgeprüft. Beides sieht für die Anwendung gleich aus, sagt aber Verschiedenes über die Ursache.

### `stripe_webhooks`

Diese Tabelle hat RLS eingeschaltet und **keine** Policy. Das ist Absicht: Ohne Policy gibt RLS nichts frei, und `anon` wie `authenticated` haben zusätzlich kein Tabellenrecht. Die Tabelle gehört allein dem Webhook, der mit dem Service-Key schreibt. Der Advisor meldet das als `rls_enabled_no_policy` (siehe Abschnitt 8).

---

## 8. Advisor-Befunde

Behoben sind `function_search_path_mutable`, `auth_rls_initplan`, `multiple_permissive_policies` und `duplicate_index`. Nach den Migrationen bleiben 44 Security- und 48 Performance-Befunde. Was bleibt, bleibt mit Grund:

| Befund | Anzahl | Bewertung |
| --- | --- | --- |
| `rls_enabled_no_policy` – `stripe_webhooks` | 1 | gewollt. Ohne Policy gibt RLS nichts frei; genau das ist der Zweck. Eine Policy hinzuzufügen wäre die Lockerung, nicht die Härtung |
| `authenticated_security_definer_function_executable` | 4 | `aktuelle_rolle()` und `hat_rolle_mindestens()` werden von den Policies gebraucht und müssen deshalb für `authenticated` ausführbar sein. Sie geben nur Auskunft über das aufrufende Konto selbst. `admin_payments_summary_30d()` und `admin_security_overview()` prüfen die Rolle intern und liefern ohne `admin` keine Zeile – nachgewiesen in Abschnitt 7 |
| `pg_graphql_anon_table_exposed` | 3 | `airports`, `blog_posts`, `blog_comments` sollen ohne Anmeldung lesbar sein. Sichtbarkeit im GraphQL-Schema ist die Folge des `SELECT`-Rechts, nicht ein zusätzliches Recht |
| `pg_graphql_authenticated_table_exposed` | 36 | dasselbe für angemeldete Konten. Welche Zeilen sichtbar sind, entscheidet RLS – nachgewiesen in Abschnitt 7 |
| `unused_index` | 47 | der Development-Branch trägt keine echte Last. Ein Index, den nie eine Abfrage benutzt hat, ist auf einem Branch ohne Verkehr keine Aussage – die Zahl schwankt allein danach, was zuletzt jemand abgefragt hat. Darunter sind die 19 Fremdschlüsselindizes aus `20260817100400`, die genau für den Betrieb angelegt wurden |
| `auth_db_connections_absolute` | 1 | Einstellung des Auth-Servers, kein Schemabefund. Gehört zur Kapazitätsplanung vor dem Launch |

Ein Befund ist bewusst hinzugekommen: Die neue Funktion `admin_security_overview()` erhöht die zweite Gruppe von drei auf vier. Sie folgt demselben Muster wie `admin_payments_summary_30d()` – `SECURITY DEFINER` mit interner Rollenprüfung. `pg_policy` wäre für jede Rolle lesbar und verriete die Bedingung jeder Policy; die Funktion gibt nur deren Anzahl heraus.

---

## 9. Reproduzierbarkeit und Prüfungen

### Der Wiederaufbau wird gemessen

`npm run db:reproduzierbarkeit` verlässt sich nicht darauf, dass die Migrationen fehlerfrei durchlaufen. Ein Durchlauf ohne Fehler ist nicht dasselbe wie ein gleiches Ergebnis.

Das Skript verwirft `public` in einer Transaktion, baut es aus den Migrationen neu auf, nimmt von beiden Ständen – dem laufenden und dem neu gebauten – denselben Fingerabdruck und rollt zurück. Verglichen werden achtzehn Abschnitte: Tabellen, Spalten, Bedingungen, Indizes, Policies, Trigger, Funktionen, Typen, Views, Sequenzen, Tabellen-, Funktions-, Sequenz-, Spalten- und Vorgaberechte, Kommentare, Extensions, Publikationen. Funktionen werden über einen Hash ihres Textes verglichen statt über den Text selbst – `pg_get_functiondef` bringt bei gleicher Definition Formatierungsunterschiede mit, die keine Schemaabweichung sind.

Danach prüft das Skript ein zweites Mal, dass das laufende Schema unverändert ist. Ein Test, der die Datenbank verändert, die er prüft, wäre wertlos.

Ergebnis über alle neun Migrationen: kein Unterschied.

Zwei Dinge mussten dafür geklärt werden. Erstens hing die Darstellung von Bedingungen und Typen am `search_path` – derselbe Index wurde einmal mit und einmal ohne Schemapräfix ausgegeben und sah dadurch verschieden aus, obwohl er identisch war. Beide Fingerabdrücke laufen jetzt mit demselben Pfad. Zweitens gehören 48 Vorgaberechte dem Platform-Rollenkonto `supabase_admin`; `alter default privileges for role supabase_admin` scheitert als `postgres` mit „permission denied", eine Anwendungsmigration kann sie also gar nicht herstellen. Sie sind ausdrücklich vom Vergleich ausgenommen, statt den Vergleich weicher zu machen.

Der Vergleich hat sich gelohnt: Er fand 153 Rechte, die im Abzug anders standen als im laufenden Schema. Ohne ihn wären sie mit der Baseline eingefroren worden.

### Was in der CI läuft

| Prüfung | braucht Datenbank |
| --- | --- |
| `npm test` – darin `lib/auth/roles-datenbank.test.ts`, Rollenmodell in TypeScript gegen das Rollenmodell im Migrations-SQL | nein |
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

Maßstab ist nicht der Name, sondern die Verwendung. Grundlage ist `npm run db:verwendung`, das nur die Stellen zählt, an denen der Supabase-Client eine Struktur wirklich anspricht. Eine Textsuche zählt zu viel: `payments` trifft auch `admin_payments`, `session_metrics` auch `creator_session_metrics`.

### V2 benötigt – 7

| Tabelle | Zweck |
| --- | --- |
| `creator_profiles` | Konto, Rolle, Status. Wird in Phase 1.5 zum generischen Profil |
| `airports` | Flughafendaten für die Flugintegration (Phase 3), benutzt von `api/search/airports` |
| `payments`, `refunds`, `stripe_webhooks` | Zahlungen, behalten ohne Priorität ([DECISIONS.md](../DECISIONS.md) ADR-0010) |
| `security_events`, `blocked_ips` | Sicherheitsereignisse und IP-Sperren im Administrationsbereich |

### Vorläufig benötigt – 1

`creator_sessions` gehört zur alten Produktidee, versorgt aber die Startseite des Administrationsbereichs mit den Kennzahlen „Sitzungen (30 Tage)" und dem 14-Tage-Verlauf (`AdminStatsStrip`, `AdminTimeSeries`). Die Tabelle verschwindet, sobald diese Kennzahlen auf Reisen umgestellt sind – das gehört zu Phase 1.5, nicht hierher.

### Obsolet – 29

Kein Anwendungscode spricht diese Tabellen mehr an. Sie stammen aus der Creator-, Media-, Blog- und Publishing-Welt, deren Oberflächen mit Phase 1.1b und deren Endpunkte mit Phase 1.1 entfernt wurden.

| Bereich | Tabellen |
| --- | --- |
| Blog | `blog_posts`, `blog_comments` |
| Creator-Analytics und Alarme | `creator_alert_events`, `creator_alert_rules`, `creator_session_metrics`, `session_metrics`, `session_metrics_daily` |
| Publishing | `creator_publish_events`, `creator_publish_queue`, `creator_publish_schedule` |
| Medien und Rendering | `creator_uploads`, `edit_docs`, `media_versions`, `render_jobs`, `session_media` |
| Sitzungen und Social | `session_cocreations`, `session_comments`, `session_impressions`, `session_review_requests`, `session_saves`, `session_snippets`, `session_stories`, `session_versions`, `session_views` |
| Infrastruktur-Automatisierung | `admin_email_boxes`, `dns_audit_events` |
| Sonstiges | `copilot_suggestions`, `insights_bets`, `insights_user_settings` |

`insights_bets` und `insights_user_settings` bilden Wetten mit Quoten ab (`odds >= 1.01`). Sie haben mit Reisen nichts zu tun.

**Sie sind trotzdem nicht in Phase 1.4 gelöscht.** 29 Tabellen zu entfernen ist eine eigene, unumkehrbare Handlung; nach [AGENTS.md](../AGENTS.md) Regel 22 gehört ein Archiv-Tag davor. Sie sind jetzt versioniert, RLS-gedeckt und rechtlich eng geführt – damit richten sie keinen Schaden an, und ihre Entfernung ist eine Aufräumaktion statt einer Sicherheitsmaßnahme. Der Schritt steht in [ROADMAP.md](../ROADMAP.md) vor dem Reise-Schema, weil die freiwerdenden Namen dort gebraucht werden.

### Entfernt in Phase 1.4 – 2

| Tabelle | Grund |
| --- | --- |
| `admin_domains` | Eine Domain erteilt keine Berechtigung ([DECISIONS.md](../DECISIONS.md) ADR-0027). Unbenutzt |
| `app_admins` | zweite Admin-Liste neben `creator_profiles.role`. Die Einträge haben vorher die Rolle `admin` erhalten |

Mit ihnen sind `public.is_admin(uuid)` und die Spalte `creator_profiles.is_admin` entfallen.

### Bekannte Redundanz in den obsoleten Tabellen

Vier Tabellen tragen denselben Fremdschlüssel doppelt oder dreifach: `blog_comments.user_id` (2), `creator_session_metrics.session_id` (3), `edit_docs.session_id` (2), `render_jobs.session_id` (2). Das kostet bei jedem Schreibvorgang eine überflüssige Prüfung.

Nachgemessen wurde, ob mehr dahintersteckt: Bei `blog_comments` haben die beiden Bedingungen verschiedene Löschregeln (`ON DELETE SET NULL` und keine). Das Löschen eines Kontos mit Kommentaren gelingt trotzdem – PostgreSQL führt die Regel aus, bevor es die strengere Bedingung prüft, und die trifft dann auf `NULL`. Es ist also Redundanz, kein Defekt.

Alle vier Tabellen stehen in der Liste der obsoleten. Sie dafür einzeln zu bereinigen wäre Arbeit an Code, der als Nächstes entfernt wird ([AGENTS.md](../AGENTS.md) Regel 22).

---

## 11. Offene Punkte

| Punkt | Einordnung |
| --- | --- |
| 29 obsolete Tabellen entfernen | eigener Schritt mit Archiv-Tag, vor dem Reise-Schema |
| `creator_profiles` in ein generisches Profil überführen | Phase 1.5. Der Tabellenname steht nur in `ROLE_TABLE` in `lib/auth/admin-guard.ts` |
| `creator_sessions` aus den Admin-Kennzahlen lösen | Phase 1.5, zusammen mit dem Reise-Schema |
| Datenbanknahe Prüfungen in die CI | braucht einen kurzlebigen Branch je Lauf, siehe Abschnitt 9 |
| Production-Stand | in Phase 1.4 nicht erhoben und nicht verändert. Der Abgleich gehört zum ersten Production-Deploy nach 1.5 |
