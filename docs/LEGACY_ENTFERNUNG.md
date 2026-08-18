# Jetnity – Entfernung der Legacy-Datenbank (Phase 1.4b)

Stand: 17. August 2026 · Abschnitt 14 als Nachtrag aus Phase 1.5
Gültig für: Supabase-Development-Branch

Dieser Bericht dokumentiert eine unumkehrbare Handlung: die Entfernung von 29 Tabellen aus dem Schema `public`. Er hält fest, was entfernt wurde, was bewusst geblieben ist, und woraus sich beides ableitet – damit die Entscheidung ohne den Chat nachvollziehbar bleibt, in dem sie getroffen wurde ([AGENTS.md](../AGENTS.md) Regel 30).

Der Zustand des Schemas nach dieser Phase steht in [docs/DATENBANK.md](DATENBANK.md). Diese Datei erklärt den Übergang.

---

## 1. Archiv

Vor der ersten destruktiven Anweisung ist der gemergte `main`-Stand mit einem annotierten Tag gesichert und ins Remote gepusht ([AGENTS.md](../AGENTS.md) Regel 22, [DECISIONS.md](../DECISIONS.md) ADR-0003).

| Angabe | Wert |
| --- | --- |
| Tag | `archive/pre-1-4b-legacy-datenbank` |
| Commit | `c058e845e2c0f3349dcfbbf7ee9e023bd6d7ba2c` |
| Commit-Titel | „Phase 1.4: Reproduzierbare und abgesicherte Datenbank-Baseline (#12)" |
| Tag-Objekt | `74a6559128c343b3c0018e5881509cbc4a080954` |
| Vorgänger | `archive/jetnity-v1-main`, `archive/pre-1-1b-alt-ui` |

Der Tag macht den Zustand wiederherstellbar, nicht nur lesbar: Auf ihm beschreiben zehn Migrationen das vollständige Schema mit 37 Tabellen, und `npm run db:reproduzierbarkeit` hat auf diesem Stand nachgewiesen, dass die Kette genau das laufende Schema erzeugt. Wer die alte Struktur braucht, spielt die Migrationen dieses Tags auf einen leeren Branch.

Daten sind nicht Teil des Archivs – sie mussten es nicht sein, siehe Abschnitt 3.

---

## 2. Umfang in Zahlen

Gemessen unmittelbar vor und nach der Migration `20260817110000_legacy_entfernen.sql`, jeweils gegen den Development-Branch.

| Gegenstand | vorher | nachher | Differenz |
| --- | --- | --- | --- |
| Tabellen | 37 | **8** | −29 |
| Spalten | 324 | 66 | −258 |
| Fremdschlüssel | 52 | 2 | −50 |
| Indizes | 127 | 25 | −102 |
| Bedingungen (PK, FK, UNIQUE, CHECK) | 119 | 17 | −102 |
| RLS-Policies | 66 | 19 | −47 |
| Funktionen | 43 | 19 | −24 |
| Trigger | 13 | 4 | −9 |
| Enums | 4 | 2 | −2 |
| Sequenzen | 2 | 1 | −1 |
| Tabellenrechte für `anon` / `authenticated` | 118 | 20 | −98 |
| Advisor-Befunde Security | 45 | 13 | −32 |
| Advisor-Befunde Performance | 47 | 9 | −38 |

### Abweichung von der Erwartung „39 → 10"

Die Aufgabenstellung nannte ungefähr 39 → 10 Tabellen. Gemessen sind es 37 → 8. Die Abweichung ist keine fachliche, sondern eine zeitliche: **39** beschreibt den Stand *vor* Phase 1.4. Dort sind `admin_domains` und `app_admins` entfernt worden ([docs/DATENBANK.md](DATENBANK.md) Abschnitt 10, [DECISIONS.md](../DECISIONS.md) ADR-0033), womit der Ausgangswert 37 lautet.

Die Liste der zu entfernenden Tabellen ist unverändert 29. 37 − 29 = 8.

---

## 3. Zeilenzahlen vor der Entfernung

Vor dem `drop` ist jede der 29 Tabellen gezählt worden. Keine einzige enthielt eine Zeile.

| Tabellen | Zeilen |
| --- | --- |
| alle 29 entfernten, einzeln gezählt | **0** |
| Summe | **0** |

Damit ist keine Entscheidung über Testdaten gegen echte Daten nötig geworden: Es gab nichts zu unterscheiden. Zeilen führten zum Zeitpunkt der Messung ausschliesslich Tabellen, die bleiben – `payments` (4), `security_events` (4), `blocked_ips` (2), `stripe_webhooks` (2), `refunds` (1), zusammen 13 Zeilen aus den manuellen Prüfungen der Phase 1.4.

Das ist der Grund, warum das Archiv aus Abschnitt 1 nur das Schema sichert und keinen Datenauszug: Ein Auszug leerer Tabellen wäre eine leere Datei.

---

## 4. Dependency-Nachweis

Geprüft wurde gegen den realen Development-Stand, nicht gegen die Namen der Tabellen ([docs/DATENBANK.md](DATENBANK.md) Abschnitt 10 nennt die Verwendung als Maßstab).

| Prüfung | Quelle | Ergebnis |
| --- | --- | --- |
| Zeilen je Tabelle | `count(*)` über alle 29 | 0 |
| Fremdschlüssel **auf** die 29 von aussen | `pg_constraint` | **keine** |
| Fremdschlüssel **von** den 29 | `pg_constraint` | 50, alle nach `auth.users`, `creator_profiles`, `creator_sessions` oder untereinander |
| Views / materialisierte Views | `pg_class.relkind in ('v','m')` | in `public` **keine** |
| Publikationen (Realtime) | `pg_publication_tables` | `supabase_realtime` führt **keine** Tabelle |
| Funktionen mit Bezug auf eine der 29 | `pg_get_functiondef` | 18 Signaturen, alle entfernt (Abschnitt 6) |
| Trigger auf den 29 | `pg_trigger` | 9, alle mit ihrer Tabelle entfallen |
| Policies auf behaltenen Tabellen mit Bezug auf eine der 29 | `pg_policy` + `pg_get_expr` | **keine** |
| Enums | `pg_attribute`, `pg_proc` | 2 ausschliesslich in den 29 verwendet (Abschnitt 7) |
| Sequenzen | `pg_depend` | 1 gehört `copilot_suggestions`, fällt mit ihr |
| Kommentare | `pg_description` | auf den 29 **keine** |
| Anwendungscode | `npm run db:verwendung` | 8 Tabellen, 2 RPCs – **keine** der 29 |
| Textsuche im ganzen Baum | `rg -w` je Objektname | Treffer nur in `types/supabase.ts` (erzeugt), `scripts/db/sicherheit.mjs` (angepasst), Migrationen und Dokumentation. **0** in `app/`, `components/`, `lib/` |
| Auth-Trigger | `pg_trigger` auf `auth.users` | **keiner** – die Entfernung berührt die Registrierung nicht |
| cron-Jobs | `cron.job` | 0 – es läuft nichts zeitgesteuert auf den Tabellen |

### Der Trockenlauf ist der eigentliche Nachweis

Die Aufzählung oben sagt, was gefunden wurde. Sie kann nicht sagen, was übersehen wurde. Deshalb ist die Migration zuerst in einer Transaktion gefahren worden, die am Ende zurückrollt – und **ohne `cascade`**.

Das ist der Kern: Ein `drop … cascade` nimmt jede Abhängigkeit still mit und gelingt deshalb immer. Ohne `cascade` scheitert die Anweisung, sobald irgendetwas ausserhalb der Liste an den Objekten hängt. Der Trockenlauf ist damit nicht die Probe einer Vermutung, sondern ihr Beweis.

Er hat dabei zwei echte Abhängigkeiten gefunden, die keine Abfrage der Liste oben gezeigt hätte:

1. **`publish_due_blog_posts(integer)` gibt `setof blog_posts` zurück.** Damit hängt sie hart am Zeilentyp der Tabelle. Der `drop table` brach mit `2BP01` ab: „function publish_due_blog_posts(integer) depends on type blog_posts". Die Funktion muss vor der Tabelle fallen.
2. **Triggerfunktionen lassen sich nicht vor ihren Triggern entfernen.** `drop function creator_uploads_set_slug()` brach ab, solange `trg_creator_uploads_set_slug` auf `creator_uploads` existierte. Sie müssen nach den Tabellen fallen.

Daraus ergibt sich die Reihenfolge der Migration: Abfragefunktionen → Tabellen → Triggerfunktionen → Enums. Sie ist kein Stil, sondern gemessen.

Nach dem Rollback waren alle zwölf Kennzahlen aus Abschnitt 2 unverändert – der Trockenlauf hat die Datenbank nicht verändert, die er geprüft hat.

---

## 5. Entfernte Tabellen – 29

Gruppiert wie in [docs/DATENBANK.md](DATENBANK.md) Abschnitt 10. Die Oberflächen dazu sind mit Phase 1.1b, die Endpunkte mit Phase 1.1 entfernt worden.

| Bereich | Tabellen | Anzahl |
| --- | --- | --- |
| Blog | `blog_posts`, `blog_comments` | 2 |
| Creator-Analytics und Alarme | `creator_alert_events`, `creator_alert_rules`, `creator_session_metrics`, `session_metrics`, `session_metrics_daily` | 5 |
| Publishing | `creator_publish_events`, `creator_publish_queue`, `creator_publish_schedule` | 3 |
| Medien und Rendering | `creator_uploads`, `edit_docs`, `media_versions`, `render_jobs`, `session_media` | 5 |
| Sitzungen und Social | `session_cocreations`, `session_comments`, `session_impressions`, `session_review_requests`, `session_saves`, `session_snippets`, `session_stories`, `session_versions`, `session_views` | 9 |
| Infrastruktur-Automatisierung | `admin_email_boxes`, `dns_audit_events` | 2 |
| Sonstiges | `copilot_suggestions`, `insights_bets`, `insights_user_settings` | 3 |

Mit den Tabellen sind ihre 102 Indizes, 102 Bedingungen, 47 Policies, 9 Trigger, 98 Tabellenrechte und die Sequenz `copilot_suggestions_id_seq` entfallen. Das ist kein Nebeneffekt, sondern die Definition von `drop table`: Objekte, die einer Tabelle gehören, haben ohne sie keine Bedeutung.

Die vier Tabellen mit doppelten Fremdschlüsseln, die [docs/DATENBANK.md](DATENBANK.md) Abschnitt 10 als bekannte Redundanz führte – `blog_comments`, `creator_session_metrics`, `edit_docs`, `render_jobs` – sind damit mitsamt der Redundanz weg. Sie einzeln zu bereinigen wäre Arbeit an Code gewesen, der unmittelbar danach entfernt wird ([AGENTS.md](../AGENTS.md) Regel 22).

---

## 6. Mitentfernte Funktionen – 24 Signaturen

### 6.1 Abfragefunktionen – 18

Jede liest oder schreibt eine der 29 Tabellen. Sie mussten ausdrücklich entfernt werden, nicht weil PostgreSQL es verlangt, sondern weil es es *nicht* verlangt: Tabellenbezüge im Rumpf einer Funktion stehen nicht in `pg_depend`. Die Funktionen hätten den `drop table` überlebt und wären erst beim Aufruf mit „relation does not exist" gescheitert – dieselbe Klasse von Fehler, die Phase 1.4 bei `ip_blocklist` und `admin_security_overview` gefunden hat.

| Funktion | referenzierte Tabelle |
| --- | --- |
| `creator_alerts_eval_all()` | `creator_alert_rules` |
| `creator_alerts_eval_for(uuid)` | `creator_alert_events`, `creator_alert_rules`, `creator_session_metrics` |
| `creator_alerts_eval_current_user()` | keine direkt – ruft `creator_alerts_eval_for()` |
| `creator_impact_percentile(integer)` | `creator_session_metrics` |
| `creator_impact_percentile(jsonb)` | Hülle um die Fassung darüber |
| `creator_metrics_timeseries(integer, creator_content_type)` | `creator_session_metrics` |
| `creator_metrics_timeseries(jsonb)` | Hülle |
| `creator_posting_heatmap(integer, creator_content_type)` | `creator_session_metrics` |
| `creator_posting_heatmap(jsonb)` | Hülle |
| `csm_increment_impressions(uuid)` | `creator_session_metrics` |
| `csm_increment_views(uuid)` | `creator_session_metrics` |
| `increment_impression(uuid)` | `creator_session_metrics` |
| `increment_like(uuid)` | `creator_session_metrics` |
| `increment_view(uuid)` | `creator_session_metrics` |
| `platform_avg_impact_score()` | `creator_session_metrics` |
| `platform_avg_impact_score(integer)` | `creator_session_metrics` |
| `publish_due_blog_posts(integer)` | `blog_posts` – zusätzlich als Rückgabetyp `setof blog_posts` |
| `publish_due_posts()` | `blog_posts`, Enum `blog_status` |

### 6.2 Triggerfunktionen ohne verbleibenden Aufrufer – 6

Der Nachweis je Funktion ist eine vollständige Aufzählung ihrer Trigger. Bleibt kein Trigger übrig, hat die Funktion keinen Weg mehr, aufgerufen zu werden.

| Funktion | ihre Trigger vor der Entfernung | verbleibend |
| --- | --- | --- |
| `set_owner()` | `blog_posts.blog_posts_set_owner` | 0 |
| `creator_uploads_set_slug()` | `creator_uploads.trg_creator_uploads_set_slug` | 0 |
| `slugify(text)` | kein Trigger; einziger Aufrufer war `creator_uploads_set_slug()` | 0 |
| `tg_set_updated_at()` | `creator_alert_rules`, `creator_publish_queue`, `edit_docs`, `insights_user_settings` | 0 |
| `touch_updated_at()` | `creator_publish_schedule.trg_cps_touch` | 0 |
| `blog_posts_set_owner()` | kein Trigger – war bereits vorher unbenutzt | 0 |

`blog_posts_set_owner()` verdient eine Bemerkung, weil sie leicht zu verwechseln ist: Der gleichnamige **Trigger** auf `blog_posts` rief nicht sie auf, sondern `set_owner()`. Die Funktion war also schon vor dieser Phase toter Code, benannt nach einer Tabelle der alten Produktidee.

### 6.3 Entfernte Trigger – 9

| Tabelle | Trigger | Funktion |
| --- | --- | --- |
| `blog_posts` | `blog_posts_set_owner` | `set_owner()` |
| `blog_posts` | `blog_posts_set_updated_at` | `set_updated_at()` |
| `creator_alert_rules` | `set_updated_at` | `tg_set_updated_at()` |
| `creator_publish_queue` | `set_updated_at_cpq` | `tg_set_updated_at()` |
| `creator_publish_schedule` | `trg_cps_touch` | `touch_updated_at()` |
| `creator_uploads` | `trg_creator_uploads_set_slug` | `creator_uploads_set_slug()` |
| `edit_docs` | `tg_edit_docs_updated_at` | `tg_set_updated_at()` |
| `insights_user_settings` | `trg_insights_user_settings_updated_at` | `tg_set_updated_at()` |
| `render_jobs` | `trg_render_jobs_set_updated_at` | `set_updated_at()` |

---

## 7. Mitentfernte Typen – 2

| Enum | letzte Verwendung | Nachweis |
| --- | --- | --- |
| `blog_status` | Spalte `blog_posts.status`, Funktion `publish_due_posts()` | beide entfernt; keine weitere Spalte, Signatur oder `pg_depend`-Zeile |
| `creator_content_type` | Spalten `creator_alert_rules.content_type` und `creator_session_metrics.content_type`, Signaturen von `creator_metrics_timeseries` und `creator_posting_heatmap` | alle vier entfernt |

---

## 8. Bewusst verbliebene Tabellen – 8

| Tabelle | Grund |
| --- | --- |
| `creator_profiles` | einzige Rollenquelle ([DECISIONS.md](../DECISIONS.md) ADR-0033). Wird in Phase 1.5 zum generischen Profil; der Tabellenname steht nur in `ROLE_TABLE` in `lib/auth/admin-guard.ts` |
| `airports` | Flughafendaten für die Flugintegration, benutzt von `api/search/airports` (ADR-0011) |
| `payments`, `refunds`, `stripe_webhooks` | Zahlungen bleiben ohne Priorität (ADR-0010) |
| `security_events`, `blocked_ips` | Sicherheitsereignisse und IP-Sperren im Administrationsbereich |
| `creator_sessions` | vorläufig benötigt: versorgt `AdminStatsStrip` und `AdminTimeSeries` mit „Sitzungen (30 Tage)" und dem 14-Tage-Verlauf. Die Umstellung auf Reisen gehört zu Phase 1.5 |

`anon` liest von diesen acht nur noch **eine**: `airports`. Vor dieser Phase waren es drei – `blog_posts` und `blog_comments` sind mit ihren Tabellen entfallen.

---

## 9. Bewusst verbliebene Objekte, die verwaist wirken

Diese Liste ist der wichtigere Teil des Berichts. Nach [AGENTS.md](../AGENTS.md) Regel 22 darf ein abhängiges Objekt nur entfernt werden, wenn nachgewiesen ist, dass es **ausschliesslich** zur Legacy-Struktur gehört. Für die folgenden Objekte fehlt dieser Nachweis – nicht aus Vorsicht, sondern weil er tatsächlich nicht zu führen ist.

Phase 1.5 hat ihn für alle bis auf eines geführt und die Objekte entfernt; der Stand steht in Abschnitt 14. Die Begründungen hier bleiben unverändert stehen, weil sie den Zustand zum Zeitpunkt der Entscheidung beschreiben.

### `set_updated_at()` – bleibt, weil sie noch gebraucht wird

Sie hing an `blog_posts` und `render_jobs`, **und** an `creator_sessions.t_creator_sessions_updated_at`. `creator_sessions` bleibt, also bleibt die Funktion. Von den drei inhaltsgleichen `updated_at`-Triggerfunktionen ist sie die einzige mit verbleibendem Aufrufer; die frühere Dreifachpflege ist damit nebenbei aufgelöst, ohne dass eine Umbenennung nötig war.

### Enum `session_status` – bleibt, weil der Nachweis fehlt

Der Typ hat auf dem Branch keine Spalte, keine Signatur und keinen Eintrag in `pg_depend`. Er war **schon vor dieser Migration verwaist** und ist damit keine Folge von ihr.

Entfernt wurde er trotzdem nicht. Seine Werte sind `pending`, `approved`, `rejected` – und dieselben drei Werte erlaubt die CHECK-Bedingung `creator_sessions_review_status_check` auf der **verbleibenden** Spalte `creator_sessions.review_status`. Ebenso plausibel wäre die entfernte `session_review_requests.status`; beide Spalten sind `text`. Damit gehört der Typ nicht nachweisbar ausschliesslich zur entfernten Struktur, und diese Migration entfernt nur, was nachgewiesen ist. Geführt als offener Punkt in [docs/DATENBANK.md](DATENBANK.md) Abschnitt 11.

### `darf_konfiguration_verwalten()` und die Fähigkeit `konfiguration-verwalten` – bleiben, weil sie zum Rollensystem gehören

Ein Befund, der erst bei der Nacharbeit auffiel: Diese Fähigkeit deckte genau drei Tabellen ab – `admin_email_boxes`, `dns_audit_events`, `copilot_suggestions` –, und **alle drei** gehörten zu den 29. Seit der Migration ruft **keine Policy** mehr `darf_konfiguration_verwalten()` auf.

Entfernt wird sie nicht. Sie ist die höchste Stufe eines Modells, das an zwei Orten zusammengehalten wird: `CAPABILITY_MINIMUM` in `lib/auth/roles.ts` und die `darf_…()`-Funktionen in der Datenbank, verglichen von `lib/auth/faehigkeiten-datenbank.test.ts`. Sie zu entfernen wäre ein Eingriff in das Admin-Rollen- und Fähigkeitssystem, das ausdrücklich zu schützen ist – und beim nächsten konfigurationsnahen Eingriff müsste dieselbe Stufe neu erfunden werden.

Damit sie nicht unbelegt bleibt, prüft `npm run db:sicherheit` sie jetzt **direkt** statt über eine Tabelle: `select 1 where public.darf_konfiguration_verwalten()` liefert für eine Administration eine Zeile und für den Betrieb keine. Der Doc-Kommentar in `lib/auth/roles.ts` nennt die Lage ausdrücklich, statt weiter drei Tabellen zu behaupten, die es nicht mehr gibt.

### `sync_creator_profile_core()`, `sync_creator_profile_emails()`, `append_email_to_array()` (2 Signaturen), `remove_email_from_array()` – bleiben, weil sie nicht zur Legacy-Struktur gehören

Diese fünf Signaturen sind an keinen Trigger gebunden und haben keinen Aufrufer im Anwendungscode. Sie sind damit toter Code – aber toter Code auf **verbleibenden** Tabellen: `creator_profiles` beziehungsweise `creator_sessions`. Die beiden `sync_creator_profile_*` sind Doppelfassungen der tatsächlich angebundenen `set_profile_core_from_auth()` und `set_profile_email_from_auth()`.

Sie hier zu entfernen wäre eine Änderung an `creator_profiles` und `creator_sessions` und damit ausserhalb des Auftrags dieser Phase. Beide Tabellen werden in Phase 1.5 ohnehin neu geschnitten; dort ist die Entscheidung fällig. Geführt als offener Punkt.

---

## 10. Verbleibendes Schema in Zahlen

| Gegenstand | Anzahl |
| --- | --- |
| Tabellen | 8 |
| Spalten | 66 |
| Fremdschlüssel | 2 – `creator_profiles.user_id` und `creator_sessions.user_id`, beide auf `auth.users` mit `ON DELETE CASCADE` |
| Indizes | 25 |
| RLS-Policies | 19, RLS auf allen 8 Tabellen |
| Funktionen | 19 |
| Trigger | 4 – drei auf `creator_profiles`, einer auf `creator_sessions` |
| Enums | 2 – `session_status` (verwaist), `visibility_status` |
| Sequenzen | 1 – `airports_id_seq` |
| Tabellenrechte für `anon` / `authenticated` | 20 |

Die 21 Tabellen, die vorher mit 23 Fremdschlüsseln auf `auth.users` zeigten, sind auf zwei geschrumpft. Ein gelöschtes Konto nimmt weiterhin seine Daten mit.

---

## 11. Prüfungen nach der Entfernung

| Prüfung | Ergebnis |
| --- | --- |
| `npm run db:anwenden` | Migration `20260817110000_legacy_entfernen.sql` angewendet und in `supabase_migrations.schema_migrations` eingetragen |
| `npm run db:reproduzierbarkeit` | **kein Unterschied** – der Wiederaufbau aus allen 11 Migrationen entspricht dem laufenden Schema, über achtzehn verglichene Abschnitte |
| `npm run db:typen` | `types/supabase.ts` neu erzeugt, 1400 Zeilen entfallen |
| `npm run db:typen -- --pruefen` | kein Drift |
| `npm run db:rechte` | 20 Tabellenrechte, jedes durch eine Policy gedeckt; kein TRUNCATE/REFERENCES/TRIGGER; RLS überall; jede Policy nennt eine Fähigkeit; **keine Funktion mit totem Bezug** |
| `npm run db:rls` | 144 Proben über 8 Tabellen × 4 Akteure, alle acht Saat-Anweisungen erfolgreich |
| `npm run db:sicherheit` | **78 von 78** Nachweisen erfüllt |
| `npm run db:advisors` | Security 13, Performance 9 |
| `npm run db:verwendung` | 8 Tabellen, 2 RPCs |
| `npm run check:schema-bezug` | jede angesprochene Struktur existiert |
| `npm test` | 83 von 83 |
| Typecheck (702 Dateien), Lint, `check:dead`, `check:exports`, `check:deps`, `check:api-schutz` | grün |
| Production-Build | grün, 36 Seiten |
| GitHub CI auf dem Pull Request | grün – `npm ci`, Setup-Check, Typecheck, Lint, Tests, vier Hygiene-Checks, Production-Build |
| Vercel-Preview-Deploy | erfolgreich gebaut und ausgerollt |

Der Bestand ist danach gegengeprüft statt vorausgesetzt: Von den 29 entfernten Tabellen existiert keine mehr, von den 8 zu schützenden fehlt keine, und `supabase_migrations.schema_migrations` führt genau elf Einträge.

Die Preview-Deployments des Projekts liegen hinter dem Zugriffsschutz von Vercel (SSO). Der Build und das Ausrollen sind damit belegt, ein Aufruf der Oberfläche gegen die Preview-URL nicht – jede Anfrage endet in einer Weiterleitung auf `vercel.com/sso-api`. Funktional geprüft ist stattdessen der lokal laufende Server gegen denselben Development-Branch: `GET /api/search/airports?q=zur` antwortet 200 mit einer leeren Liste. Das ist die richtige Antwort und keine Ausweichantwort – `airports` führt auf dem Branch null Zeilen, und die Route greift seit Phase 1.4 nicht mehr auf Amadeus zurück, um zu schreiben. Wäre die Tabelle mitentfernt worden, hätte dieselbe Route nichts zu lesen gehabt.

Die Abfragen, die die Startseite des Administrationsbereichs stellt – `creator_sessions` zählen, `admin_payments_summary_30d()` und `admin_security_overview()` rufen –, sind nicht über die Oberfläche geprüft, sondern in `npm run db:sicherheit` als acht benannte Nachweise über die Stufen `moderator`, `creator` und `admin`. Das ist die belastbarere Prüfung: Sie läuft in einer zurückgerollten Transaktion, legt ihre Konten selbst an und braucht keine dauerhaften Testkonten auf dem gemeinsamen Branch.

### Die neue vierte Regel in `npm run db:rechte`

Der Fehler, den diese Phase beheben musste, ist eine Klasse, nicht ein Einzelfall: PostgreSQL verfolgt Tabellenbezüge im Rumpf einer Funktion nicht. 18 Signaturen hätten den `drop table` unbemerkt überlebt.

`npm run db:rechte` prüft deshalb jetzt zusätzlich, dass jedes `public.<name>` in einem Funktionsrumpf sich auflöst – als Relation, als Funktion oder als Typ. Löst es sich zu keinem der drei auf, greift die Funktion ins Leere.

Die Prüfung ist gegengeprobt worden, statt ihr zu vertrauen: In einer zurückgerollten Transaktion ist eine Funktion nach dem Muster der alten erzeugt und ihre Tabelle danach entfernt worden. Der Check hat sie gefunden. Ein Test, der nur bei grünem Schema grün ist, wäre keiner.

### Angepasste Nachweise in `npm run db:sicherheit`

Neun Fälle bezogen sich auf entfernte Tabellen oder Funktionen. Sie sind nicht gestrichen, sondern durch gleichwertige an verbleibenden Strukturen ersetzt – ein Nachweis, der wegfällt, nimmt seine Aussage mit.

| entfallener Fall | Ersatz |
| --- | --- |
| `anon` liest sichtbare Blogkommentare | `anon` hat auf keiner Tabelle ausser `airports` ein Recht |
| `anon` liest Creator-Uploads / Sitzungskommentare | `anon` liest Sitzungen → abgelehnt |
| `anon` legt einen Creator-Upload an | `anon` legt eine Sitzung an → abgelehnt |
| `anon` und angemeldetes Konto rufen `creator_alerts_eval_all` | keine `SECURITY DEFINER`-Funktion ist für `anon` ausführbar |
| Moderation verbirgt einen fremden Blogkommentar | Moderation ändert eine fremde Sitzung → erlaubt; Creator ändert eine fremde Sitzung → 0 Zeilen |
| vier Fälle zu `dns_audit_events` und `admin_email_boxes` | Fähigkeit `konfiguration-verwalten` direkt geprüft, in beiden Stufen |

Der Ersatz für die `creator_alerts_eval_all`-Fälle ist strenger als das Original: Er prüft nicht eine benannte Funktion, sondern **jede** `SECURITY DEFINER`-Funktion in `public` darauf, dass `anon` sie nicht ausführen darf. Damit deckt der Nachweis auch Funktionen ab, die noch niemand geschrieben hat.

Bei dieser Arbeit ist ein echter Fehler im ersten Entwurf aufgefallen: Der neue Fall „Moderation ändert eine fremde Sitzung" setzte `review_status` auf einen Wert, den `creator_sessions_review_status_check` nicht erlaubt. Der Fall schlug fehl, statt still durchzulaufen – und lieferte dabei die Erkenntnis über `session_status` aus Abschnitt 9.

### Advisor-Befunde

| Befund | vorher | nachher | Bewertung |
| --- | --- | --- | --- |
| `authenticated_security_definer_function_executable` | 4 | 4 | unverändert: `aktuelle_rolle()` und `hat_rolle_mindestens()` brauchen die Policies, `admin_payments_summary_30d()` und `admin_security_overview()` prüfen die Fähigkeit intern – nachgewiesen in [docs/DATENBANK.md](DATENBANK.md) Abschnitt 7 |
| `pg_graphql_anon_table_exposed` | 3 | **1** | nur noch `airports`. `blog_posts` und `blog_comments` sind entfernt |
| `pg_graphql_authenticated_table_exposed` | 37 | **8** | Folge des `SELECT`-Rechts, nicht ein zusätzliches Recht. Welche Zeilen sichtbar sind, entscheidet RLS |
| `unused_index` | 46 | **8** | die 19 Fremdschlüsselindizes aus `20260817100400` gehörten zu den entfernten Tabellen und sind mit ihnen weg. Die verbleibenden 8 liegen auf `airports`, `creator_profiles`, `creator_sessions`; ein Branch ohne Verkehr sagt darüber nichts |
| `auth_db_connections_absolute` | 1 | 1 | Einstellung des Auth-Servers, kein Schemabefund |
| `auth_leaked_password_protection` | 1 | **nicht gemeldet** | siehe unten |
| `rls_enabled_no_policy` | 0 | 0 | bleibt behoben |

Zu `auth_leaked_password_protection`: Der Befund erschien im Abschlusslauf der Phase 1.4, im Lauf dieser Phase nicht. `password_hibp_enabled` ist **nicht** geändert worden – Phase 1.4b hat ausschliesslich über Migrationen und SQL gearbeitet und keine Auth-Einstellung geschrieben. Naheliegend ist derselbe Zusammenhang, den [docs/DATENBANK.md](DATENBANK.md) Abschnitt 8 schon vermerkt: Der Advisor meldet ihn offenbar nur, solange passwortgestützte Konten auf dem Branch existieren, und die Testkonten der Phase 1.4 sind in zurückgerollten Transaktionen entstanden. Bewiesen ist das nicht. Festgehalten ist, dass die Einstellung unverändert ist und als offener Punkt für Phase 1.4c geführt bleibt.

---

## 12. Tote Codepfade

Ausserhalb von Migrationen und Dokumentation gab es genau drei Stellen mit Bezug auf die entfernten Objekte. In `app/`, `components/` und `lib/` keine einzige.

| Stelle | Behandlung |
| --- | --- |
| `types/supabase.ts` | neu erzeugt. 1400 Zeilen entfallen; die Datei beschreibt 8 Tabellen statt 37 |
| `scripts/db/sicherheit.mjs` | neun Fälle ersetzt, fünf Saat-Anweisungen für entfernte Tabellen entfallen |
| `scripts/db/verwendung.mjs` | Kommentarbeispiel nannte `session_metrics` / `creator_session_metrics`; auf ein noch existierendes Paar umgestellt |
| `lib/auth/roles.ts` | Doc-Kommentar der Fähigkeit `konfiguration-verwalten` nannte drei entfernte Tabellen; jetzt hält er die Lage fest |

`scripts/db/rls.mjs`, `scripts/db/inventory.mjs`, `scripts/db/rechte.mjs` und `scripts/db/reproduzierbarkeit.mjs` brauchten keine Anpassung an den Tabellenbestand: Sie lesen das Schema, statt es zu kennen.

---

## 13. Was diese Phase nicht angefasst hat

| Bereich | Einordnung |
| --- | --- |
| Production | keine Verbindung, keine Migration, kein Zugriff. Der Abgleich gehört zum ersten Production-Deploy nach Phase 1.5 |
| Auth-Server-Konfiguration, `password_hibp_enabled` | Phase 1.4c |
| Fehlerdarstellung in `PaymentsCenter.tsx` | Phase 1.4d |
| Reise-Schema | Phase 1.5 |
| `creator_profiles` → generisches Profil | Phase 1.5 |
| `creator_sessions` aus den Admin-Kennzahlen lösen | Phase 1.5 |
| Service-Role-Pfade | keine eingeführt. Alle Arbeit lief über die Management-API mit dem Development-Token |

Keine Secrets im Repository, in Logs oder in Ausgaben. Keine neuen laufenden Kosten – es sind ausschliesslich Objekte entfernt worden.

---

## 14. Nachtrag Phase 1.5 – die offenen Punkte sind geschlossen

Abschnitt 9 dieses Berichts führt fünf Objekte, die Phase 1.4b bewusst stehen liess, weil der Nachweis fehlte, dass sie **ausschliesslich** zur Legacy-Struktur gehören. Phase 1.5 hat diesen Nachweis geführt, indem sie das Reiseschema gebaut hat, das `creator_sessions` ersetzt. Der Stand:

| Objekt aus Abschnitt 9 | Stand nach Phase 1.5 |
| --- | --- |
| `creator_sessions` (Abschnitt 8) | **entfernt** in `20260817120200_creator_sessions_entfernen.sql`. Die Admin-Kennzahlen lesen jetzt Reisen: `admin_reisen_kennzahlen()` und `admin_reisen_zeitreihe(integer)` |
| `set_updated_at()` | **entfernt.** Ihr letzter Aufrufer war `t_creator_sessions_updated_at`. Das Reiseschema führt `setze_aktualisiert_am()` mit festem `search_path` und ohne Doppelfassung |
| Enum `session_status` | **entfernt.** Mit der Tabelle ist `creator_sessions.review_status` gefallen – die einzige Spalte, deren CHECK dieselben drei Werte erlaubte. Damit ist belegt, dass der Typ zu keiner verbleibenden Struktur gehörte |
| Enum `visibility_status` | **entfernt**, aus demselben Grund |
| `sync_creator_profile_core()`, `sync_creator_profile_emails()` | **entfernt** in `20260817120300_generisches_profil.sql`. Sie waren Doppelfassungen der angebundenen Auslöser; die Entscheidung war laut Abschnitt 9 in dieser Phase fällig |
| `append_email_to_array()` (2 Signaturen), `remove_email_from_array()` | **entfernt.** Alle drei schrieben in `creator_sessions.emails` |
| `darf_konfiguration_verwalten()` und die Fähigkeit `konfiguration-verwalten` | **bleiben.** Die Lage ist unverändert: keine Policy ruft sie auf, und sie zu entfernen wäre ein Eingriff in das Rollen- und Fähigkeitssystem. `npm run db:sicherheit` weist sie weiter direkt nach, in beiden Stufen |
| `creator_profiles` | **umbenannt zu `profiles`**, neun Creator-Spalten entfernt. Bedingungen, Indizes, Policies, Auslöser und Funktionen tragen die neuen Namen ([DECISIONS.md](../DECISIONS.md) ADR-0044) |

Zwei Punkte sind wichtiger als die Liste:

**Auch diese Migrationen arbeiten ohne `cascade`.** Die Reihenfolge ist wieder gemessen und nicht gewählt: Funktionen fallen vor dem Auslöser, der Auslöser vor der Tabelle, die Tabelle vor den Enums. Eine unerwartete Abhängigkeit lässt die Migration scheitern, statt still mitgenommen zu werden – derselbe Grundsatz wie in Abschnitt 4.

**Der Ersatz stand vor der Entfernung.** `20260817120100_reise_anlegen.sql` bringt die Admin-Kennzahlen auf Reisen, und erst `20260817120200` entfernt `creator_sessions`. Zwischen beiden Migrationen ist die Startseite des Administrationsbereichs zu keinem Zeitpunkt ohne Datenquelle.

Der Bestand nach Phase 1.5 – 11 Tabellen, 0 Enums, 17 Funktionen – steht in [docs/DATENBANK.md](DATENBANK.md) Abschnitt 3. Das Reisemodell selbst in [docs/REISEN.md](REISEN.md).
