# Jetnity – Datenbank

Stand: 22. August 2026
Gültig für: Supabase-Development-Branch nach Phase 3.1 plus Booking-Status (`20260821100000`), Mobilität (`20260821120000`) und Mietwagen (`20260821200000`). Airport- und Places-Schema sowie deren Importe gelten nur für Development, bis der kontrollierte Rollout in [PRODUCTION_ROLLOUT.md](PRODUCTION_ROLLOUT.md) ausdrücklich freigegeben ist.

Zwei getrennte Aussagen, kein Widerspruch: **Production hat** `20260821100000` (PR #29), `20260821120000` (PR #30) und `20260821200000` (PR #31) nach ausdrücklicher Nutzerfreigabe. Das Playbook in [PRODUCTION_ROLLOUT.md](PRODUCTION_ROLLOUT.md) hält `20260820130000` als Default-Sicherheitsgrenze für automatische Production-Läufe. Das ist eine Guardrail, kein Gegenbeweis zum realen Production-Stand. Die Mietwagen-Migration wurde über den freigegebenen Supabase-Branch-Migrationsweg übernommen.

Diese Datei beschreibt den **tatsächlichen** Zustand des Schemas, wie er sich aus dem Repository herstellen lässt. Sie ist die Antwort auf die Frage, die [ARCHITECTURE.md](../ARCHITECTURE.md) Abschnitt 6 bis Phase 1.4 offenlassen musste: Was steht in der Datenbank, wer darf was, und woher weiß man das.

Alle Angaben stammen aus dem Development-Branch. Production ist in keiner der Phasen 1.4 bis 1.5 angefasst worden.

Phase 1.4b hat 29 Tabellen entfernt. Warum, mit welchem Nachweis und was bewusst geblieben ist, steht in [docs/LEGACY_ENTFERNUNG.md](LEGACY_ENTFERNUNG.md). Diese Datei beschreibt das Ergebnis, jene den Übergang.

Phase 1.5 hat vier Tabellen für Reisen hinzugefügt und die letzte Alt-Tabelle entfernt. Was die vier fachlich abbilden – und warum in dieser Form –, steht in [docs/REISEN.md](REISEN.md); hier stehen Bestand, Rechte, Policies und Nachweise.

Die Einstellungen des Auth-Servers – Passwortregel, E-Mail-Bestätigung, Anmeldedienste, Ratenbegrenzung – liegen nicht im Schema und stehen deshalb nicht hier, sondern in [docs/AUTH.md](AUTH.md).

---

## 1. Grundsatz

Die Migrationen in `supabase/migrations/` sind die Quelle. Was dort nicht steht, existiert für Jetnity nicht.

Konkret heißt das:

- Eine Schemaänderung entsteht als Migration und wird von dort angewendet, nicht in der Supabase-Oberfläche.
- `types/supabase.ts` wird erzeugt, nicht gepflegt. Nach dem Development-Lauf von `20260821200000` muss die Datei dem live Schema entsprechen (`npm run db:typen -- --pruefen`).
- Dass beides zusammenpasst, wird geprüft und nicht angenommen.

Die Prüfungen dazu stehen in Abschnitt 9.

---

## 2. Werkzeuge

Alle Skripte liegen in `scripts/db/` und sprechen über die Supabase Management API. Der Default ist der Development-Branch (`ziel()`). Production-Schreiben braucht `--produktion --projekt-ref` und die Bestätigung, dass das Ziel ein eigenständiges Projekt ist; Anleitung in [PRODUCTION_ROLLOUT.md](PRODUCTION_ROLLOUT.md). Sie brauchen `SUPABASE_ACCESS_TOKEN` und `SUPABASE_PROJECT_REF` aus der Umgebung; im Repository steht keiner der beiden Werte.

| Befehl | Aufgabe |
| --- | --- |
| `npm run db:inventar` | vollständige Inventur eines Schemas als JSON |
| `npm run db:anwenden` | offene Migrationen anwenden; ohne Flags nur Development-Branch; Production nur mit `-- --produktion --projekt-ref --bis 20260820130000`; `-- --probe` zeigt nur, was offen ist |
| `npm run production:pruefen` | vollständig read-only (nur SELECT/Metadaten); braucht `-- --entwicklung` oder `-- --produktion --projekt-ref`; `--vorab` prüft nur Constraints und Kill Switches |
| `npm run db:reproduzierbarkeit` | baut das Schema aus den Migrationen neu auf und vergleicht es mit dem laufenden |
| `npm run db:rls` | empirische RLS-Matrix: was darf welche Rolle auf welcher Tabelle wirklich |
| `npm run db:sicherheit` | 169 benannte Nachweise mit Erwartung, positiv und negativ; wo es darauf ankommt, mit verlangtem SQLSTATE |
| `npm run db:parallelitaet` | 5 Nachweise gegen die Erzeugungsschranke von `public.trips` unter echter Gleichzeitigkeit |
| `npm run db:rechte` | Tabellenrechte gegen Policies prüfen; zusätzlich, dass keine Funktion eine Struktur nennt, die es nicht gibt |
| `npm run db:verwendung` | welche Tabellen und RPCs der Anwendungscode anspricht |
| `npm run check:schema-bezug` | dieselbe Auswertung als Prüfung gegen `types/supabase.ts` (läuft in der CI) |
| `npm run db:typen` | `types/supabase.ts` erzeugen; `-- --pruefen` vergleicht nur |
| `npm run db:advisors` | Security- und Performance-Advisors von Supabase |
| `npm run airports:importieren` | OurAirports lesen, filtern; Standard ist Probe; Development `--schreiben --entwicklung`; Production nur über den Rollout-Playbook |
| `npm run places:importieren` | GeoNames-Dump lesen, filtern; Standard ist Probe; Development `--schreiben --entwicklung`; Production nur über den Rollout-Playbook |

Bis auf `check:schema-bezug` braucht jedes davon den Development-Zugang. `check:schema-bezug` liest nur die erzeugte Typdatei und läuft deshalb in der CI mit.

Ein Unterschied ist wichtig: Alle Skripte ausser `db:parallelitaet` und `db:anwenden` arbeiten ausschliesslich in Transaktionen, die zurückrollen, und hinterlassen nichts. `db:parallelitaet` **schreibt echte Zeilen**, weil gleichzeitige Sitzungen einander nur festgeschrieben sehen; es räumt vor und nach jedem Lauf auf (Abschnitt 7b).

---

## 3. Bestand

| Gegenstand | Anzahl | nach Phase 1.5 | nach Phase 1.4b | vor Phase 1.4b |
| --- | --- | --- | --- | --- |
| Tabellen | **12** | 11 | 8 | 37 |
| Spalten | 115 | 102 | 66 | 324 |
| Primärschlüssel | 12 | 11 | 8 | 37 |
| Fremdschlüssel | 7 | 7 | 2 | 52 |
| Eindeutigkeitsbedingungen | 7 | 6 | 3 | 4 |
| CHECK-Bedingungen | 56 | 45 | 4 | 26 |
| Indizes | 34 | 31 | 25 | 127 |
| RLS-Policies | 32 | 31 | 19 | 66 |
| Funktionen | 24 | 18 | 19 | 43 |
| Trigger | 17 | 7 | 4 | 13 |
| Enums | **0** | 0 | 2 | 4 |
| Views / materialisierte Views | 0 | 0 | 0 | 0 |
| Sequenzen | 1 | 1 | 1 | 2 |
| Extensions | 10 | 10 | 10 | 10 |

Die dreizehn Tabellen: `profiles`, `trips`, `trip_stages`, `trip_days`, `trip_items`, `model_usage`, `airports`, `places`, `payments`, `refunds`, `stripe_webhooks`, `security_events`, `blocked_ips`. Ihre Einordnung steht in Abschnitt 10.

**Phase 2.2 Nachtrag `20260820060000`:** `public.reise_graph_geaendert()` plus neun Statement-Trigger auf den Kindtabellen. **Nachtrag `20260820070000`:** `public.reise_stamm_geaendert()` erhöht die Fassung bei direkten Stammdaten-Updates auf `trips`. **Nachtrag `20260820080000`:** `trip_days_index_eindeutig` und `trip_days_datum_eindeutig` sind `UNIQUE … DEFERRABLE`; der partielle Unique-Index auf `day_date` entfällt. Die Inventur zählt danach 24 Funktionen, 17 Trigger und 7 Eindeutigkeitsbedingungen. Production unverändert.

**Phase 3.1 Nachtrag `20260820110000`:** `public.airports` erhält `region`, `country_code`, `keywords`, `klasse`, `updated_at`, passende CHECKs und den Trigramm-Index `airports_keywords_trgm`. Der Inhalt kommt nicht aus der Migration, sondern aus `npm run airports:importieren`. Development angewendet. Production erst über [PRODUCTION_ROLLOUT.md](PRODUCTION_ROLLOUT.md). Einzelheiten in [docs/FLUGHAFEN.md](FLUGHAFEN.md).

**Phase 3.1 Nachtrag `20260820120000`:** `public.places` ist die lokale Ortsbasis für Reiseziel und Abreise. Additive Spalten `trips.origin_place_id` und `trip_stages.place_id` (beide nullable). `reise_anlegen()` schreibt die Referenzen, wenn sie in der Nutzlast stehen. Inhalt aus `npm run places:importieren` (GeoNames CC BY 4.0 plus `public.airports`). Development enthält 124 811 Orte. Production erst über den kontrollierten Rollout. Einzelheiten in [docs/ORTE.md](ORTE.md).

**Phase 3.1 Nachtrag `20260820130000`:** `reise_aendern()` schreibt dieselben optionalen Referenzen. Ohne eindeutige Auflösung bleibt der Wert `null`. Production unverändert, bis der Rollout freigegeben ist.

**Coverage/Booking Status `20260821100000`:** Additive Spalten auf `trip_items` plus CHECKs. Historische Zeilen bleiben `unconfirmed`. `reise_anlegen()` durfte einen gebuchten Status nur für Flug/Stay und nur als `user` übernehmen. `reise_aendern()` bleibt ohne diese Spalten. Development angewendet am 21. August 2026. **Production angewendet** am 21. August 2026 nach ausdrücklicher Nutzerfreigabe (PR #29). Das Playbook erlaubt automatische Production-Läufe weiterhin nur bis `20260820130000`.

**Mobilität `20260821120000`:** Additive Spalten auf `trip_items` plus CHECKs. `kind` bleibt `transfer`. Historische Transfer-Zeilen bleiben ohne Modus und `unconfirmed`. `reise_anlegen()` schreibt die Felder. `reise_aendern()` wird nicht ersetzt. **Development und Production angewendet** am 21. August 2026 (Production nach ausdrücklicher Nutzerfreigabe, PR #30). Das Playbook zieht diese Datei nicht automatisch nach.

**Mietwagen `20260821200000`:** Neuer `kind`-Wert `rental_car` plus vier optionale Spalten. Origin/Destination dürfen bei Transfer **oder** Mietwagen stehen; Transfer-Modusfelder bleiben transfer-only. `booked` ist für `flight|stay|transfer|rental_car` zulässig. `reise_anlegen()` schreibt die Felder und setzt Mietwagen-Evidenz nur auf `user`. `reise_aendern()` wird nicht ersetzt. **Development angewendet am 21. August 2026. Production angewendet am 22. August 2026** nach ausdrücklicher Nutzerfreigabe (PR #31, [PR31_PRODUCTION_MIGRATION_ACCEPTANCE.md](PR31_PRODUCTION_MIGRATION_ACCEPTANCE.md)). Production-Suche bleibt aus.

**Readiness `20260822010000`:** Neue Tabelle `trip_readiness_items`. Kein neuer `trip_items.kind`. Speichert nur Nutzer-Vorbereitungsstand, keine offiziellen Visa-Regeln und keine sensiblen Dokumentdaten. `reise_anlegen()` und `reise_aendern()` bleiben unverändert. **Nur Development.** Nicht Production.

**Reisendenkontext `20260822020000`:** Neue Tabelle `trip_travellers`. Trip-spezifisch, datensparsam. Keine Dokumentnummern, keine Gesundheitsakte. **Development und Production** nach Foundation-C-Freigabe.

**Traveller Context `20260822160000`:** Child-Tabellen `trip_traveller_citizenships` und `trip_traveller_documents`, optionales `trip_readiness_items.traveller_id`, RPC `party_schreiben()`. Deterministischer Backfill der Foundation-C-Singularfelder. Legacy-Spalten bleiben. **Nur Development.** Nicht Production.

Das Wachstum liegt vollständig bei den Reisedaten: Die vier neuen Tabellen tragen 61 Spalten, 43 CHECK-Bedingungen, 6 Fremdschlüssel, 5 Eindeutigkeitsbedingungen, 15 Indizes, 16 Policies und 5 Auslöser – vier für `updated_at`, einer für die Erzeugungsregeln von `public.trips` (Abschnitt 7a). Gleichzeitig sind mit `creator_sessions` 16 Spalten, 7 Indizes und 4 Policies sowie die neun Creator-Spalten des Profils entfallen – die Nettozahlen der Tabelle oben sind deshalb kleiner als die Zugänge.

Dass die CHECK-Bedingungen von 4 auf 45 steigen, ist Absicht: Jeder Wertebereich, jede Länge, jede Reihenfolge und jede Zahlengrenze steht als Bedingung im Schema statt als Annahme im Anwendungscode ([DECISIONS.md](../DECISIONS.md) ADR-0043).

**Enums gibt es keine mehr.** `blog_status` und `creator_content_type` sind mit Phase 1.4b entfallen, `visibility_status` und `session_status` mit `creator_sessions` in Phase 1.5. Das Reiseschema führt bewusst keinen neuen ein: Ein Enum lässt sich nur erweitern, nie kürzen, ein CHECK ist eine Zeile in der nächsten Migration. `session_status` war der offene Punkt aus Phase 1.4b – der Nachweis, dass es ausschliesslich zur entfernten Struktur gehört, liegt jetzt vor, weil mit der Tabelle die Spalte `review_status` gefallen ist.

Extensions: `citext`, `pg_cron`, `pg_graphql`, `pg_net`, `pg_stat_statements`, `pg_trgm`, `pgcrypto`, `plpgsql`, `supabase_vault`, `uuid-ossp`. `citext` wird seit Phase 1.5 von keiner Spalte mehr verwendet – `creator_profiles.username` war die letzte. Die Extension bleibt trotzdem: Sie liegt im Schema `extensions`, kostet nichts, und sie zu entfernen ist eine eigene Handlung mit eigenem Nachweis.

`pg_cron` ist installiert, aber `cron.job` ist leer. Das passt zu Phase 1.1, in der alle vier Cron-Jobs entfernt wurden – es läuft nichts mehr zeitgesteuert.

### Auth- und Storage-Abhängigkeiten

Zwei Tabellen verweisen mit je einem Fremdschlüssel auf `auth.users`: `profiles.user_id` und `trips.user_id`, beide mit `ON DELETE CASCADE`. Ein gelöschtes Konto nimmt sein Profil und seine Reisen mit, und über die zusammengesetzten Fremdschlüssel auch alle Etappen, Tage und Planpunkte. Das ist die Erwartung an private Reisedaten und keine Aufbewahrungspflicht. Vor Phase 1.4b waren es 21 Tabellen mit 23 Fremdschlüsseln.

Auf `auth.users` liegt **kein** Trigger. Ein Profil in `profiles` entsteht nicht automatisch bei der Registrierung, sondern erst, wenn die Anwendung eine Zeile anlegt. Ein frisch registriertes Konto hat deshalb kein Profil und damit keine Rolle. Die Zugangsentscheidung aus Phase 1.3 kennt diesen Zustand („keine Rolle hinterlegt") und lehnt ab – das ist das gewollte Verhalten, kein Fehler.

Eine Reise braucht kein Profil: `trips.user_id` verweist auf `auth.users`, nicht auf `profiles`. Ein frisch registriertes Konto kann also sofort speichern, auch bevor jemals eine Profilzeile entsteht. Die Übernahme einer Gastreise hängt damit nicht an einer Reihenfolge, die niemand garantieren kann.

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
| `20260817120000_reiseschema.sql` | `trips`, `trip_stages`, `trip_days`, `trip_items` samt Bedingungen, Indizes, Auslösern, RLS und Rechten (Phase 1.5) |
| `20260817120100_reise_anlegen.sql` | `reise_anlegen(jsonb)` – eine Reise samt Kindern in einer Transaktion, idempotent; dazu `admin_reisen_kennzahlen()` und `admin_reisen_zeitreihe(integer)` |
| `20260817120200_creator_sessions_entfernen.sql` | letzte Alt-Tabelle entfernt, dazu 3 Funktionen, 1 Auslöser mit `set_updated_at()` und die letzten 2 Enums |
| `20260817120300_generisches_profil.sql` | `creator_profiles` → `profiles`, neun Creator-Spalten entfernt, doppelter Auslöser aufgelöst, Namen nachgezogen |
| `20260818010000_reise_erzeugungsregeln.sql` | `trips.client_ref` auf `NOT NULL`; Auslöser `trips_erzeugung_pruefen` für Zeitstempel, Anfangsstatus und Missbrauchsschranke; `reise_anlegen()` ohne eigene Zählung (Nachtrag Phase 1.5, ADR-0045) |
| `20260818020000_reise_wiederholung.sql` | Die Schranke zählt Neuanlagen: Ist `(user_id, client_ref)` belegt, gilt sie nicht – der Retry bleibt auch an der Grenze idempotent (Nachtrag Phase 1.5, ADR-0048) |
| `20260818030000_reise_erzeugung_serialisieren.sql` | Zählung und Einfügung laufen je Konto der Reihe nach, serialisiert über `pg_advisory_xact_lock` – die Schranke hält auch bei gleichzeitigen Anfragen (Nachtrag Phase 1.5, ADR-0049) |
| `20260818040000_modellnutzung.sql` | `model_usage` als Kostenprotokoll, `modell_preis()`, `modell_kontingent_beanspruchen()` und `modell_nutzung_abschliessen()` – die Kostenschranke für Modellaufrufe (Phase 2.1, ADR-0052) |
| `20260819010000_modell_kontingent_nur_server.sql` | `EXECUTE` auf die beiden Kontingent-Funktionen nur noch `service_role`; Identität eines Kontos als Argument vom Server (Nachtrag ADR-0052) |
| `20260820010000_reise_stage_revision.sql` | `trips.revision`, `trips.last_mutation_id`, `trip_days.stage_id` samt Backfill (Phase 2.2, ADR-0057, ADR-0058) |
| `20260820020000_reise_anlegen_stage.sql` | `reise_anlegen()` setzt `stage_id` auch ohne Kalenderdaten; ohne eigene Missbrauchszählung (ADR-0045) |
| `20260820030000_reise_aendern.sql` | `reise_aendern(jsonb)` – atomisch, SECURITY INVOKER, Fassung und Idempotenz, ohne Handelsfelder (ADR-0060) |
| `20260820040000_modell_reiseaenderung.sql` | `model_usage.funktion` kennt `reiseaenderung`; derselbe Kontingenttopf |
| `20260820050000_reise_anlegen_ohne_schranke.sql` | Nachtrag: nimmt die versehentlich zurückgeholte Zählung aus `reise_anlegen()` wieder heraus (ADR-0045, ADR-0048) |
| `20260820060000_reise_graph_revision.sql` | Statement-Trigger erhöhen `trips.revision` bei Graphänderungen; `reise_anlegen()` übernimmt `ungeplante`; keine Doppelzählung in den RPCs (ADR-0058 Nachtrag, ADR-0061) |
| `20260820070000_reise_trips_revision.sql` | Direkte Stammdaten-Updates auf `trips` erhöhen `revision`, ohne `reise_aendern()` doppelt zu zählen (ADR-0058 Nachtrag) |
| `20260820080000_reise_tage_eindeutig_aufgeschoben.sql` | `UNIQUE … DEFERRABLE` für `day_index`/`day_date` in `reise_aendern()` (Phase 2.2, ADR-0060 Nachtrag) |
| `20260820100000_reise_anlegen_handelsfelder.sql` | `reise_anlegen()` schreibt Preis, Währung, Provider, Ref, Buchungslink und Termin (Phase 3.1, ADR-0065). Development angewendet. Production nur über [PRODUCTION_ROLLOUT.md](PRODUCTION_ROLLOUT.md). |
| `20260820110000_airports_referenz.sql` | `public.airports` um Region, Landescode, Keywords, Klasse erweitert (Phase 3.1, ADR-0066). Development angewendet. Production nur über den kontrollierten Rollout. |
| `20260820120000_places_referenz.sql` | `public.places` plus optionale `trips.origin_place_id` / `trip_stages.place_id`; `reise_anlegen()` schreibt die Referenzen, wenn sie in der Nutzlast stehen (Phase 3.1, ADR-0067). Development angewendet. Production nur über den kontrollierten Rollout. |
| `20260820130000_reise_aendern_places.sql` | `reise_aendern()` schreibt `origin_place_id` und `trip_stages.place_id` aus der Nutzlast (Phase 3.1, ADR-0067). Development angewendet. Production nur über den kontrollierten Rollout. |
| `20260821100000_trip_items_booking_status.sql` | `trip_items.booking_status` / `booking_source` / `booking_confirmed_at`; `reise_anlegen()` übernimmt nur `user` als Quelle (Coverage/Booking Status, ADR-0089). **Development und Production angewendet** am 21. August 2026 (Production nach ausdrücklicher Nutzerfreigabe). Das Playbook zieht diese Datei nicht automatisch nach. |
| `20260821120000_trip_items_mobility.sql` | optionale Mobilitätsspalten auf `trip_items`; `reise_anlegen()` schreibt sie; Booking-CHECK erlaubt `booked` für `transfer` (Foundation A, ADR-0090). **Development und Production angewendet** am 21. August 2026 (Production nach ausdrücklicher Nutzerfreigabe). Das Playbook zieht diese Datei nicht automatisch nach. |
| `20260821200000_trip_items_rental_car.sql` | `kind=rental_car` plus optionale Mietwagenspalten; `reise_anlegen()` schreibt sie; Booking-CHECK erlaubt `booked` für `rental_car` (Foundation B, ADR-0092). **Development und Production angewendet** (Production am 22. August 2026 nach ausdrücklicher Nutzerfreigabe). Das Playbook zieht diese Datei nicht automatisch nach. Suche bleibt aus. |

Die Reihenfolge ist nicht beliebig: `20260817100200` darf erst laufen, wenn `20260817100000` die Rollen der Betroffenen übernommen und `20260817100100` alle Policies auf `creator_profiles.role` umgestellt hat. Sonst verlöre jemand seinen Zugang oder eine Policy liefe ins Leere.

Dasselbe gilt für die vier Migrationen der Phase 1.5, und zwar in beide Richtungen: `20260817120200` darf `creator_sessions` erst entfernen, wenn `20260817120100` den Ersatz für die Admin-Kennzahlen bereitstellt, und `20260817120300` benennt das Profil erst um, nachdem keine Migration mehr `creator_profiles` schreibt. Umgekehrt ist `20260817120000` bewusst die erste: Auf `trips` verweist alles Weitere.

`20260818010000` steht nach dem Reiseschema, weil sie dessen Tabelle verschärft, und sie beginnt mit einem Nachtrag für bestehende Zeilen: Jede Reise ohne Kennung bekommt eine aus ihrer eigenen Kennung, bevor die Spalte `NOT NULL` wird. Auf dem Development-Branch war die Tabelle leer; der Nachtrag steht für den Fall, dass sie es später nicht ist.

Auch innerhalb von `20260817110000` ist die Reihenfolge gemessen und nicht gewählt: Abfragefunktionen fallen vor den Tabellen, Triggerfunktionen danach. Die Migration arbeitet **ohne `cascade`**, damit eine unerwartete Abhängigkeit sie scheitern lässt statt still mitgenommen zu werden. Der Nachweis dazu steht in [docs/LEGACY_ENTFERNUNG.md](LEGACY_ENTFERNUNG.md) Abschnitt 4.

---

## 6. Rollen und Eigentum

### Eine Autorität

Wer welche Rolle hat, steht in `profiles.role`. Sonst nirgends. Die Tabelle hiess bis Phase 1.5 `creator_profiles`; der Name stand im Anwendungscode nur in `ROLE_TABLE` in `lib/auth/admin-guard.ts`, weshalb die Umstellung dort eine einzelne Änderung war ([DECISIONS.md](../DECISIONS.md) ADR-0044).

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

`rollenrang()` gibt für eine unbekannte Rolle `null` zurück, nicht `0`. Das ist der Unterschied zwischen „hat die niedrigste Rolle" und „diese Rolle kennt niemand". Die CHECK-Bedingung auf `profiles.role` lautet deshalb `rollenrang(role) is not null`: Eine Rolle, die das Modell nicht kennt, lässt sich nicht eintragen, und die Bedingung wächst mit dem Modell mit, statt eine zweite Liste zu führen.

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
| `konten-verwalten` | `moderator` | `public.darf_konten_verwalten()` | fremde `profiles` |
| `inhalte-moderieren` | `moderator` | `public.darf_inhalte_moderieren()` | seit Phase 1.5 **keine Tabelle** |
| `konfiguration-verwalten` | `admin` | `public.darf_konfiguration_verwalten()` | derzeit **keine Tabelle** |

Die Zuordnung ist aus den bestehenden Gates der Anwendung abgelesen, nicht erfunden.

Zwei Fähigkeiten haben Fläche verloren. `konfiguration-verwalten` deckte ausschliesslich `admin_email_boxes`, `dns_audit_events` und `copilot_suggestions` ab – alle drei mit Phase 1.4b entfernt. `inhalte-moderieren` deckte `blog_comments`, `session_review_requests` und `creator_sessions` ab; die ersten beiden fielen mit 1.4b, die dritte mit Phase 1.5.

**Reisen sind ausdrücklich nicht der neue Gegenstand von `inhalte-moderieren`.** Eine private Reiseplanung wird nicht veröffentlicht, also gibt es nichts zu moderieren, und keine Policy auf den vier Reisetabellen prüft eine Fähigkeit ([DECISIONS.md](../DECISIONS.md) ADR-0041). Eine Fähigkeit ohne Fläche ist unbequemer als eine mit – und die richtige Antwort darauf ist nicht, ihr die nächstliegende Tabelle zuzuweisen.

Beide Fähigkeiten bleiben bestehen. Sie sind Stufen eines Modells, das an zwei Orten übereinstimmen muss – `CAPABILITY_MINIMUM` in `lib/auth/roles.ts` und die `darf_…()`-Funktionen in der Datenbank –, und ihre Entfernung wäre ein Eingriff in das Admin-Rollen- und Fähigkeitssystem statt eine Aufräumaktion. Damit sie nicht unbelegt dastehen, prüft `npm run db:sicherheit` sie direkt: `select 1 where public.darf_konfiguration_verwalten()` liefert einer Administration eine Zeile und dem Betrieb keine, `darf_inhalte_moderieren()` einer Moderation eine und einem Creator keine. Die Begründung im Einzelnen steht in [docs/LEGACY_ENTFERNUNG.md](LEGACY_ENTFERNUNG.md) Abschnitt 9.

Zwei Prüfungen halten das zusammen:

- `lib/auth/faehigkeiten-datenbank.test.ts` vergleicht `CAPABILITY_MINIMUM` mit den Rollen in den `darf_…()`-Funktionen. Ohne Datenbank, damit die CI ihn ausführen kann.
- `npm run db:rechte` lehnt jede Policy ab, die `hat_rolle_mindestens()` direkt aufruft. Eine neue Policy muss eine Fähigkeit nennen; nur so bleibt die Mindestrolle an einer Stelle.

`hat_rolle_mindestens()` bleibt bestehen – aber nur noch als Baustein innerhalb der fünf Funktionen, nicht mehr als Sprache der Policies.

### Kontostatus

`profiles.status` ist `NOT NULL` mit Vorgabe `active` und erlaubt `active`, `pending`, `disabled`, `banned`.

### Eigentum

Das Eigentumsmodell ist einheitlich: Eine Zeile gehört dem Konto in ihrer Spalte `user_id`.

| Muster | Regel |
| --- | --- |
| eigene Zeile | `user_id = auth.uid()` – lesen, ändern, löschen. Gilt für `profiles` und die vier Reisetabellen |
| öffentlich | `airports` und `places`, lesend – Flughafen- und Ortssuche ohne Anmeldung |
| Verwaltung | über eine Fähigkeit, nicht über eine Rolle – siehe die Tabelle oben, **ausgenommen Reisen** |
| nur mit Service-Key schreibbar | `stripe_webhooks` |

Ein Profil gehört zu genau einem Konto: `user_id` ist `NOT NULL`, eindeutig, und verweist mit `ON DELETE CASCADE` auf `auth.users`.

**Bei den Reisedaten steht das Eigentum auf jeder Zeile, auch auf den Kindern.** Der übliche Weg wäre eine Policy mit `exists (select 1 from trips …)` auf `trip_stages`, `trip_days` und `trip_items`. Stattdessen tragen die drei Kindtabellen `user_id` selbst, und ein zusammengesetzter Fremdschlüssel `(trip_id, user_id) → trips (id, user_id)` macht ein Auseinanderlaufen unmöglich: Ein Kind kann nur auf eine Reise zeigen, die derselben Person gehört. Die Policy ist damit ein Spaltenvergleich statt einer Unterabfrage je Zeile.

Vom Client ist das Eigentum nicht setzbar. `user_id` trägt `default auth.uid()`, und jede Policy verlangt in `using` **und** `with check`, dass `user_id = (select auth.uid())` gilt. Eine mitgeschickte fremde Kennung scheitert am `with check` der INSERT-Policy, ein `update … set user_id = <fremd>` an dem der UPDATE-Policy. Die Spalte ist damit faktisch unveränderlich, ohne dass ein Auslöser nötig wäre – beides ist in Abschnitt 7 nachgewiesen.

Zwei weitere Verweise binden einen Planpunkt an seinen Tag und seine Etappe, ebenfalls zusammengesetzt: `(day_id, trip_id)` und `(stage_id, trip_id)`. Sie tragen `on delete set null` spaltenweise – wird ein Tag entfernt, weil die Reise kürzer wird, bleibt der Planpunkt bestehen und unzugeordnet, statt mit zu verschwinden.

### Rechteausweitung

Rolle und Status ändert niemand an sich selbst. Der Trigger `profiles_rollenwechsel` prüft beim Anlegen **und** beim Ändern:

- Die eigene Rolle und der eigene Status sind unveränderlich – auch für den Inhaber.
- Rollen vergeben darf erst ab `moderator`.
- Vergeben lässt sich nur eine Rolle unterhalb der eigenen, und nur an ein Konto unterhalb der eigenen. Ausgenommen ist `owner`, damit eine Nachfolge einrichtbar bleibt.
- Ein selbst angelegtes Profil bekommt `role = 'user'` und `status = 'active'`, sonst nichts.

Der letzte Punkt war eine echte Lücke: Ein frisch registriertes Konto ohne Profil konnte sich sein erstes Profil mit `role = 'owner'` ausstellen. Die Policy prüfte nur, dass die Zeile dem eigenen Konto gehört.

---

## 7. Row Level Security

RLS ist auf allen 11 Tabellen eingeschaltet, mit 31 Policies – 16 davon auf den vier Reisetabellen, je Tabelle eine für SELECT, INSERT, UPDATE und DELETE und alle ausschliesslich für `authenticated`. `anon` bekommt dort weder Recht noch Policy: Ein Gast hat serverseitig keine Identität und deshalb keine Reise in der Datenbank ([DECISIONS.md](../DECISIONS.md) ADR-0042).

Vor Phase 1.4b waren es 37 Tabellen mit 66 Policies; die entfallenen gehörten zu den entfernten Tabellen und haben ohne sie keine Bedeutung.

Alle 16 Reisepolicies benutzen `(select auth.uid())` statt `auth.uid()`. In der Unterabfrage wertet PostgreSQL den Aufruf einmal je Anweisung aus statt einmal je Zeile; die direkte Form melden die Advisors als `auth_rls_initplan`.

Ein Zugriff hängt an vier Dingen, nicht an einem: am Tabellenrecht, am RLS-Schalter, an der Policy und an deren Rollenbindung. Fehlt das Tabellenrecht, ist die schönste Policy wirkungslos – und umgekehrt.

### Rechte

`anon` und `authenticated` haben kein Recht mehr, das nicht eine Policy braucht. `npm run db:rechte` prüft beide Richtungen und meldet 32 vergebene Tabellenrechte, jedes durch eine Policy gedeckt, und keine Policy ohne das zugehörige Recht. Nach Phase 1.4b waren es 20, vor Phase 1.4b 118. Die zwölf neuen sind `select`, `insert`, `update`, `delete` für `authenticated` auf den vier Reisetabellen – abzüglich der vier, die mit `creator_sessions` entfallen sind.

`TRUNCATE`, `REFERENCES` und `TRIGGER` sind entzogen. `TRUNCATE` war der schwerwiegendste Einzelbefund der Inventur: Das Recht umgeht RLS vollständig. Jedes angemeldete Konto – und über `anon` jeder Besucher – konnte `truncate public.payments` ausführen und die Tabelle leeren, obwohl keine Policy ihm auch nur eine Zeile zum Lesen gab.

`anon` darf genau **zwei** Tabellen lesen: `airports` und `places`. `blog_posts` und `blog_comments` waren die früheren öffentlichen Tabellen und sind mit Phase 1.4b entfallen.

Seit Phase 1.4b prüft `npm run db:rechte` eine vierte Regel: Kein `public.<name>` in einem Funktionsrumpf darf ins Leere greifen – es muss sich als Relation, Funktion oder Typ auflösen. Das ist die Antwort auf eine Fehlerklasse, nicht auf einen Einzelfall: PostgreSQL verfolgt Tabellenbezüge im Rumpf einer Funktion nicht in `pg_depend`, weshalb 18 Signaturen den `drop table` unbemerkt überlebt hätten und erst beim Aufruf mit „relation does not exist" gescheitert wären – dieselbe Klasse wie `ip_blocklist` und `admin_security_overview` in Phase 1.4. Die Prüfung ist gegengeprobt: In einer zurückgerollten Transaktion findet sie eine künstlich erzeugte Funktion mit totem Bezug.

### Nachweise

`npm run db:rls` misst die vollständige Matrix aus Rolle × Tabelle × Operation. Gemessen wird, nicht abgeleitet: Vier Konten (nicht angemeldet, Eigentümerin, fremdes Konto, Administration) probieren jede Operation auf jeder Tabelle aus – nach Phase 1.5 sind das 198 Proben über 11 Tabellen. Der ganze Lauf liegt in einer Transaktion, die am Ende zurückgerollt wird, und jede einzelne Probe zusätzlich in einem eigenen Unterabschnitt – sonst nähme ein erfolgreiches `delete` die Zeilen abhängiger Tabellen mit und verfälschte jede spätere Messung.

Für die Kindtabellen musste das Skript in Phase 1.5 genauer werden. Es säte eine Zeile für `trip_days` mit `(select id from public.trips limit 1)` – und traf damit die Reise eines anderen Testkontos, was am zusammengesetzten Fremdschlüssel `trip_days_reise_fk` scheiterte. Es löst Fremdschlüssel jetzt über die Primärschlüsselspalten der Zieltabelle auf und wählt bei Tabellen mit `user_id` deterministisch die Zeile des eigenen Kontos.

**Eine Grenze der Matrix ist zu kennen, damit sie nicht überlesen wird.** Die Probe `insert_eigen` schreibt die Kennung der Eigentümerin auf den jeweiligen Akteur um. Auf den Kindtabellen zeigt der Verweis auf die Reise danach ins Leere – die Reise gehört ja der Eigentümerin –, und die Probe endet mit `23502 not-null violation` statt mit einer Ablehnung durch die Policy. Die Aussage „ein fremdes Konto schreibt hier nichts" bleibt richtig, ihre Ursache ist aber die fehlende Reise und nicht die Policy. Der positive und der negative Schreibfall der Reisetabellen stehen deshalb nicht in der Matrix, sondern in den benannten Nachweisen unten, mit eigens angelegten Reisen je Konto.

`npm run db:sicherheit` prüft dieselbe Datenbank gegen 169 benannte Erwartungen. Der Unterschied ist wichtig: Die Matrix zeigt, was gilt; die Nachweise sagen, was gelten **soll**, und schlagen fehl, wenn es sich ändert.

Beide Läufe teilen eine Grenze: Sie liegen vollständig in einer Transaktion, und damit sehen alle ihre Anweisungen einander. Was nur zwischen **gleichzeitigen** Transaktionen schiefgehen kann, steht in Abschnitt 7b.

Neun Nachweise bezogen sich auf Tabellen oder Funktionen, die Phase 1.4b entfernt hat. Sie sind nicht gestrichen, sondern durch gleichwertige an verbleibenden Strukturen ersetzt – ein Nachweis, der wegfällt, nimmt seine Aussage mit. Der Ersatz ist teils strenger als das Original: Statt zu prüfen, dass `anon` eine benannte `SECURITY DEFINER`-Funktion nicht ausführen darf, prüft er das für **jede** solche Funktion in `public` und deckt damit auch Funktionen ab, die noch niemand geschrieben hat. Die Gegenüberstellung steht in [docs/LEGACY_ENTFERNUNG.md](LEGACY_ENTFERNUNG.md) Abschnitt 11.

Neun Konten decken jede Stufe des Modells ab: `user`, ein zweites `user`, `creator`, `moderator`, `operator`, `admin`, `owner`, ein gesperrtes Konto und eines ganz ohne Profil. Die beiden mittleren Rollen fehlten zunächst – und genau deshalb blieb unbemerkt, dass die Policies pauschal `admin` verlangten.

Ein Ausschnitt:

| Nachweis | Erwartung |
| --- | --- |
| `anon` liest Flughäfen | erlaubt |
| `anon` hat auf keiner Tabelle ausser `airports` und `places` ein Recht | erfüllt |
| `anon` liest Orte | erlaubt |
| `anon` liest Profile, Zahlungen, Sicherheitsereignisse, Reisen, Stripe-Ereignisse | abgelehnt, 42501 |
| `anon` legt eine Reise an, `anon` ruft `reise_anlegen()` | abgelehnt, 42501 |
| `anon` und angemeldetes Konto leeren eine Tabelle mit `TRUNCATE` | abgelehnt, 42501 |
| Konto liest und ändert das eigene Profil | erlaubt |
| Konto liest oder ändert ein fremdes Profil | 0 Zeilen |
| Konto legt eine Reise im fremden Namen an | abgelehnt, 42501 |
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
| Creator liest fremde Profile | 0 Zeilen |
| Moderation erreicht die Fähigkeit `inhalte-moderieren`, Creator nicht | erlaubt / 0 Zeilen |
| Administration erreicht die Fähigkeit `konfiguration-verwalten` | erlaubt |
| Betrieb erreicht dieselbe Fähigkeit | 0 Zeilen |
| keine `SECURITY DEFINER`-Funktion ist für `anon` ausführbar | erfüllt |
| Moderation ruft `admin_payments_summary_30d()` und `admin_security_overview()` | erlaubt |
| Creator ruft dieselben beiden | 0 Zeilen |
| Moderation ruft `admin_reisen_kennzahlen()` und `admin_reisen_zeitreihe()` | erlaubt |
| gewöhnliches Konto und Creator rufen dieselben beiden | 0 Zeilen |

Die Unterscheidung zwischen „abgelehnt" (`42501`, das Recht fehlt) und „0 Zeilen" (das Recht besteht, die Policy gibt nichts frei) ist beabsichtigt und wird mitgeprüft. Beides sieht für die Anwendung gleich aus, sagt aber Verschiedenes über die Ursache.

### Nachweise zu den Reisedaten

Zweiundfünfzig der 140 Nachweise betreffen Reisen. Sie sind der Grund, warum das Modell nicht nur beschrieben, sondern belegt ist:

| Nachweis | Erwartung |
| --- | --- |
| `anon` liest Reisen, Etappen, Tage, Planpunkte | abgelehnt, 42501 |
| `anon` ruft `reise_anlegen()` | abgelehnt, 42501 – kein EXECUTE-Recht |
| Konto liest, ändert, löscht die eigene Reise | erlaubt |
| Konto liest, ändert, löscht eine fremde Reise | 0 Zeilen |
| Konto liest ausser der eigenen keine Reise | 0 Zeilen |
| dasselbe je Kindtabelle, lesend, ändernd und löschend | erlaubt / 0 Zeilen |
| Konto legt eine Reise mit fremder `user_id` an | abgelehnt, 42501 – `with check` der INSERT-Policy |
| Konto legt eine Reise ohne `user_id` an | erlaubt – `default auth.uid()` |
| Konto legt eine Reise ohne `client_ref` an | abgelehnt, 23502 – die Kennung ist Pflicht |
| Konto schreibt die eigene Reise auf ein fremdes Konto um | abgelehnt, 42501 – `with check` der UPDATE-Policy |
| Konto hängt Etappe, Tag oder Planpunkt an eine fremde Reise | abgelehnt, 23503 – zusammengesetzter Fremdschlüssel |
| Konto hängt einen Planpunkt an einen fremden Reisetag | abgelehnt, 23503 |
| Konto hängt eine Etappe mit fremder `user_id` an die eigene Reise | abgelehnt, 42501 |
| Konto legt dieselbe `client_ref` zweimal an | abgelehnt, 23505 |
| zwei Konten benutzen dieselbe `client_ref` | erlaubt – die Eindeutigkeit gilt je Konto |
| `reise_anlegen()` zweimal mit derselben Kennung | dieselbe Reise, keine zweite Zeile |
| `reise_anlegen()` mit mitgeschickter `user_id` oder `status` | beides ignoriert: Eigentum aus `auth.uid()`, Status `draft` |
| `reise_anlegen()` mit unbekanntem Interesse, ohne Kennung, mit 400 Tagen | abgelehnt, 23514 bzw. 22023 |
| `reise_anlegen()` beim 61. Aufruf innerhalb einer Stunde | abgelehnt, 53400 |
| direkter `INSERT` mit `status = 'booked'` | abgelehnt, 22023 – eine neue Reise ist ein Entwurf |
| direkter `INSERT` als Entwurf, mit Kennung | erlaubt – der positive Gegenfall |
| direkter `INSERT` mit rückdatiertem `created_at` | Zeitstempel von der Datenbank gesetzt |
| direkter `INSERT` als 61. Reise der Stunde, auch rückdatiert | abgelehnt, 53400 |
| 61 Reisen in **einer** Anweisung | abgelehnt, 53400 – der Auslöser zählt je Zeile |
| `reise_anlegen()` an der Schranke mit **belegter** Kennung | dieselbe Reise, keine zweite Zeile, weiterhin 60 Reisen im Konto |
| `reise_anlegen()` an der Schranke mit **neuer** Kennung | abgelehnt, 53400 – die Ausnahme gilt der Wiederholung, nicht dem Konto |
| direkter `INSERT` einer belegten Kennung an der Schranke | abgelehnt, 23505 – der eindeutige Index, nicht die Schranke |
| Inhaber, Administration und Moderation lesen eine fremde Reise | 0 Zeilen |
| Administration ändert oder löscht eine fremde Reise | 0 Zeilen |
| keine Policy der vier Reisetabellen nennt eine `darf_…()`-Funktion | erfüllt |

Der letzte Nachweis prüft die Aussage aus ADR-0041 strukturell und nicht beispielhaft: Er fängt auch eine Policy, die es heute noch nicht gibt.

**Sieben dieser Nachweise gehen bewusst nicht über `reise_anlegen()`.** Die Regeln des Anlegens standen bis zum Nachtrag der Phase 1.5 nur in der Funktion, während `authenticated` `INSERT` auf `public.trips` hat – über PostgREST liessen sich Kennung, Anfangsstatus und die Missbrauchsschranke damit vollständig übergehen. Sie liegen jetzt in der Tabelle selbst (Abschnitt 7a), und die Nachweise nehmen deshalb den direkten Weg.

Drei der Nachweise mussten anders geschrieben werden als geplant. `with neu as (select public.reise_anlegen(…)) select …` sieht die von der Funktion geschriebene Zeile nicht – eine Anweisung arbeitet auf einem Schnappschuss. Die Prüfungen auf Idempotenz und auf die ignorierte `user_id` laufen deshalb als mehrere Anweisungen hintereinander, nicht als eine mit CTE.

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

Die Unterscheidung steht einmal in `lese()` in `lib/api/datenbank-lesen.ts` und wird von allen sieben lesenden Routen benutzt. `security/list` war bis Phase 1.4d die Ausnahme – sie bildete jede Ablehnung auf 500 ab, auch eine erschöpfte Verbindung; `payments/refund` schreibt und antwortet auf jede Fehlerart mit 500.

Nachgewiesen ist das am laufenden Server: Mit entzogenem `select` auf `payments` antworten die drei Zahlungswege 500 mit `permission denied for table payments`, während die Sicherheitswege unverändert 200 liefern – vorher gaben alle drei 200 mit `{"rows":[],"next_cursor":null}` zurück. Eine Suche ohne Treffer bleibt 200 mit leerer Liste.

**In der Oberfläche gilt dasselbe, seit Phase 1.4d.** Die Antwort war ab ADR-0037 richtig, ihre Darstellung nicht: `TransactionsCard` und `WebhooksCard` warfen bei `!res.ok` in ein `finally` ohne `catch` und meldeten „Keine Transaktionen". Die Deutung steht jetzt einmal in `lib/admin/ladezustand.ts`, die Fläche in `components/admin/Ladezustand.tsx`, und die serverseitig lesenden Ansichten – Startseite und Benutzerverwaltung – benutzen über `problemAus()` dieselbe Einordnung ([DECISIONS.md](../DECISIONS.md) ADR-0040).

Eine Eigenheit von PostgREST ist dabei zu beachten: **Eine Abfrage mit `head: true` liefert bei einer Ablehnung keine Begründung.** HEAD-Antworten haben keinen Körper, `postgrest-js` gibt `{ message: '' }` ohne SQLSTATE zurück. Dieselbe Abfrage meldet als GET „permission denied for table creator_sessions". Wer eine Zählabfrage schreibt, bekommt die Ursache also nicht mit; `problemAus()` nennt in diesem Fall den Statuscode.

### `stripe_webhooks`

Die Tabelle wird ausschliesslich vom Webhook geschrieben, der mit dem Service-Key arbeitet; eine Schreibpolicy gibt es bewusst nicht. Lesbar ist sie seit `20260817100800` ab der Fähigkeit `betrieb-lesen`, weil `GET /api/admin/payments/webhooks` sie anzeigt und die Antwort sonst dauerhaft leer bliebe. Sie führt nur Kennung, Ereignisart und Zeitpunkt – keine Nutzlast und keine Kundendaten.

---

## 7a. Erzeugungsregeln von `public.trips`

RLS entscheidet, **wem** eine Zeile gehört. Sie sagt nichts darüber, wie eine Reise entstehen darf. Diese Regeln standen bis zum Nachtrag der Phase 1.5 in `public.reise_anlegen()` – und damit nur auf dem Weg, den die Anwendung nimmt. `authenticated` hat `INSERT` auf `public.trips`, PostgREST macht dieses Recht mit dem öffentlichen anon-Key erreichbar, und ein direkter `INSERT` umging alle drei.

Seit `20260818010000_reise_erzeugungsregeln.sql` liegen sie in der Tabelle:

| Regel | Durchsetzung | Verletzung |
| --- | --- | --- |
| Jede Reise trägt eine Kennung | `trips.client_ref` ist `NOT NULL`, Länge 1–64 | `23502` |
| Die Kennung ist je Konto eindeutig | `unique (user_id, client_ref)` – wirkt erst mit `NOT NULL` auf jede Zeile, weil NULL in PostgreSQL nicht mit NULL kollidiert | `23505` |
| Eine neue Reise ist ein Entwurf | Auslöser `trips_erzeugung_pruefen` | `22023` |
| `created_at` und `updated_at` gehören der Datenbank | derselbe Auslöser setzt beide auf `now()` | – (wird überschrieben) |
| Höchstens 60 neue **Neuanlagen** je Konto und Stunde | derselbe Auslöser, Zählung über `trips_user_id_updated_at_idx`; übersprungen, wenn `(user_id, client_ref)` schon belegt ist; je Konto serialisiert über `pg_advisory_xact_lock` | `53400` |

Zur Wahl standen zwei Wege: `INSERT` entziehen und `reise_anlegen()` auf `SECURITY DEFINER` umstellen, oder die Regeln in der Tabelle verankern. Entschieden ist der zweite – nach dem ersten trüge ein Funktionsrumpf die Verantwortung für das Eigentum an vier Tabellen, weil `SECURITY DEFINER` an RLS vorbeiläuft. Begründung und Alternativen in [DECISIONS.md](../DECISIONS.md) ADR-0045.

Fünf Eigenschaften des Auslösers sind zu kennen:

- Er ist `SECURITY DEFINER`, damit die Zählung nicht durch die Lesepolicy läuft. Eine Schranke, die von einer Lesepolicy abhängt, wäre nur so lange richtig, wie diese jede eigene Reise zeigt.
- Aufrufbar ist er trotzdem für niemanden: `revoke all on function public.reise_erzeugung_pruefen() from public, anon, authenticated`. Ein Auslöser braucht kein Ausführungsrecht des Aufrufers – deshalb erscheint er auch nicht unter `authenticated_security_definer_function_executable` in den Advisors.
- Er zählt je Zeile und sieht dabei die Zeilen, die dieselbe Anweisung vorher eingefügt hat. Ein `insert … select … generate_series(1, 61)` scheitert deshalb an derselben Schranke wie 61 einzelne Anweisungen.
- **Er läuft vor dem eindeutigen Index.** Die Reihenfolge einer Einfügung ist: Auslöser, dann `trips_client_ref_eindeutig`, dann `on conflict`. Genau daran ist die Idempotenz zunächst gescheitert – siehe unten.
- **Er serialisiert je Konto.** Zählung und Einfügung gehören zusammen; ohne Sperre sieht jede gleichzeitige Anfrage denselben veralteten Stand.

**Die Schranke zählt Neuanlagen, nicht Schreibversuche (ADR-0048).** Weil der Auslöser vor dem eindeutigen Index läuft, warf er bis `20260818020000` auch dann mit `53400`, wenn `on conflict do nothing` gar keine Reise angelegt hätte. Ein Konto mit 60 Reisen in der letzten Stunde konnte damit einen bereits erfolgreichen Aufruf nicht wiederholen – Retry nach einem Netzfehler, ein Reload, eine zweite Anmeldung –, obwohl die Reise längst in seinem Konto lag. Da `lib/trips/uebernahme.ts` den Entwurf im Browser erst nach der Kennung aus dem Konto löscht, blieb er liegen und jeder weitere Versuch scheiterte gleich, bis eine Stunde vergangen war.

Der Auslöser fragt jetzt zuerst, ob überhaupt eine Reise entsteht. Ist `(user_id, client_ref)` belegt, gilt die Schranke nicht; der Schreibvorgang ist damit nicht erlaubt, sondern läuft weiter in den eindeutigen Index und endet dort – in `reise_anlegen()` im `on conflict do nothing`, auf dem direkten Weg in `23505` statt bisher `53400`. Ein Weg an der Schranke vorbei entsteht dadurch nicht: Er setzt eine belegte Kennung voraus, und genau die lässt keine zweite Zeile werden.

`status = 'draft'` wird weiterhin vor dieser Frage geprüft: `booked` beim Anlegen zu behaupten ist auf jedem Weg falsch, auch wenn die Zeile danach ohnehin am eindeutigen Index scheitern würde.

**Zählung und Einfügung laufen je Konto der Reihe nach (ADR-0049).** Die Prüfung ist ein Lesen mit anschliessendem Schreiben, und in PostgreSQL sieht eine Transaktion die noch nicht festgeschriebene Zeile einer anderen nicht. Bei 59 vorhandenen Reisen sahen darum gleichzeitige Anfragen alle den Stand 59 und kamen alle durch – gemessen mit sechs Sitzungen: 65 Reisen statt höchstens 60, auf beiden Schreibwegen. Über PostgREST sind gleichzeitige Anfragen der Normalfall, nicht der Sonderfall.

Der Auslöser nimmt deshalb vor dem ersten Lesen eine Beratungssperre auf Transaktionsdauer:

```sql
perform pg_advisory_xact_lock(hashtext('public.trips'), hashtext(new.user_id::text));
```

Drei Punkte dazu:

- **Der Schlüssel ist zweiteilig.** Beratungssperren teilen sich einen Namensraum über die ganze Datenbank; der erste Teil benennt den Zweck, damit eine spätere Sperre zu einem anderen Zweck nicht zufällig dieselbe Zahl trifft. Ein Zusammenstoss zweier Konten im zweiten Teil kostet Wartezeit, nie Richtigkeit.
- **Die Sperre steht vor der Prüfung auf eine bestehende Kennung, nicht dazwischen.** Davor gelesen wäre diese Prüfung veraltet, sobald sie gebraucht wird: Zwei gleichzeitige Anfragen mit derselben neuen Kennung sähen beide „noch nicht vorhanden", und die zweite scheiterte nach dem Warten an der Schranke, obwohl die erste ihre Reise angelegt hat. Zwei Tabs, ein Klick – dieser Fall muss idempotent bleiben.
- **`_xact_` gibt von selbst frei**, beim Festschreiben wie beim Abbruch, und ist innerhalb derselben Transaktion wiederholt nehmbar. Eine Anweisung mit 61 Zeilen ruft den Auslöser 61-mal und blockiert sich dabei nicht selbst.

Der Preis ist ein Wartepunkt je Konto, der nur das Anlegen von Reisen trifft und nur dasselbe Konto. Bei 60 erlaubten Neuanlagen je Stunde ist Gedrängel dort kein Dauerzustand, und `authenticated` trägt `statement_timeout = 8s`: Eine wartende Anfrage kann nicht unbegrenzt hängen, sie endet spätestens mit `57014`.

Drei Grenzen bleiben, benannt statt verschwiegen: `status = 'draft'` gilt beim Anlegen, nicht bei jeder Änderung – ein Konto kann seine eigene Reise anschliessend auf `booked` setzen, und ein Statusmodell mit erlaubten Übergängen entsteht mit der Buchung in Phase 3. Die Zahl der Etappen, Tage und Planpunkte **je Reise** prüft weiterhin nur `reise_anlegen()`; der direkte Weg in die Kindtabellen ist unbegrenzt. Der Punkt steht im Backlog der [ROADMAP.md](../ROADMAP.md).

Und: Eine Transaktion, die Reisen für **mehrere** Konten anlegt, nimmt mehrere Beratungssperren und kann mit einer zweiten solchen Transaktion in umgekehrter Reihenfolge verklemmen; PostgreSQL erkennt das und bricht eine der beiden mit `40P01` ab. Auf den vorhandenen Wegen kann der Fall nicht eintreten, weil RLS `user_id = auth.uid()` verlangt und eine Anfrage damit für genau ein Konto schreibt. Erreichbar wäre er nur über die Service Role, die Jetnity für Reisen nicht benutzt.

---

## 7b. Nachweis unter Gleichzeitigkeit

`npm run db:sicherheit` und `npm run db:rls` laufen vollständig in einer Transaktion, die am Ende zurückrollt. Für Policies und Bedingungen ist das genau richtig und hinterlässt nichts. Für Wettläufe ist es blind: Zwei Anweisungen derselben Transaktion sehen einander immer, zwei gleichzeitige Transaktionen nicht.

Die Erzeugungsschranke ist aber genau davon abhängig – sie liest und schliesst daraus auf ein Schreiben. `npm run db:parallelitaet` prüft deshalb, was der andere Lauf nicht kann.

**Aufbau eines Falls.** Aufräumen, dann ein Testkonto mit N Reisen der letzten Stunde säen und **festschreiben** – gleichzeitige Sitzungen sehen einander nur festgeschrieben. Dann ein Treffpunkt auf der Uhr des Servers, weil sonst die Laufzeit der HTTP-Anfragen entscheidet, ob sich die Sitzungen überhaupt begegnen. Dann sechs gleichzeitige Verbindungen: Jede wartet bis zum Treffpunkt, schreibt und hält ihre Transaktion danach 0,8 Sekunden offen. Zum Schluss den Bestand nachzählen und das Konto löschen; `on delete cascade` nimmt alles mit.

Das Offenhalten ist kein Kunstgriff: `reise_anlegen()` schreibt nach der Reise bis zu 1416 weitere Zeilen, das Fenster zwischen Zählung und Festschreibung ist real.

| Nachweis | Erwartung |
| --- | --- |
| 6 parallele **neue** Kennungen bei 59, direkter `INSERT` | genau eine Reise kommt hinzu, der Rest `53400` |
| dasselbe über `reise_anlegen()` | genau eine Reise kommt hinzu |
| 6 parallele **Wiederholungen** einer bestehenden Kennung bei 59 | alle erfolgreich, dieselbe Reise, Bestand unverändert 59 |
| 6 paralleles **Doppelabsenden** derselben neuen Kennung bei 59 | alle erfolgreich, dieselbe Reise, Bestand 60 |
| 6 parallele neue Kennungen bei erreichtem Limit | alle `53400`, Bestand unverändert 60 |

**Der Nachweis hat Zähne, und das ist selbst nachgewiesen.** Mit der Fassung vor `20260818030000` scheitert das Skript mit Exit-Code 1 und meldet 65 Reisen statt 60 – auf beiden Schreibwegen. Ein Nachweis, der auch ohne die Behebung grün wäre, wäre keiner.

Dieses Skript und `npm run db:kontingent` (Abschnitt 7c) sind die einzigen unter `scripts/db/`, die echte Zeilen schreiben und nicht zurückrollen. Beide benutzen ein eigenes Konto, das kein anderer Nachweis anfasst, und räumen vor **und** nach jedem Lauf auf – auch wenn ein Fall scheitert.

---

## 7c. Das Kostenprotokoll für Modellaufrufe

Vollständige Beschreibung der Modellschicht: [MODELL.md](MODELL.md). Hier steht der Teil, der in der Datenbank liegt.

`public.model_usage` ist die Stelle, an der die Kostenkontrolle für Modellaufrufe stattfindet. Nicht aus Bequemlichkeit: Vercel startet beliebig viele Instanzen, und ein Zähler in einem Serverprozess kennt nur seine eigene. Die einzige Stelle, die alle Aufrufe sieht, ist die Datenbank ([DECISIONS.md](../DECISIONS.md) ADR-0052).

### Die Tabelle

| Spalte | Typ | Inhalt |
| --- | --- | --- |
| `id` | `uuid` | Primärschlüssel; wird der Anwendung nach der Buchung zurückgegeben |
| `funktion` | `text` | `reisevorschlag` – die eine Funktion dieser Phase |
| `modell` | `text` | eines der drei Modelle mit bekanntem Preis |
| `art` | `text` | `konto` oder `gast` |
| `kennung_hash` | `text` | SHA-256 der Konto- oder Gastkennung, 64 Hexzeichen |
| `ergebnis` | `text` | `reserviert` oder eine der neun Ergebnisklassen |
| `eingabe_tokens`, `gecachte_tokens`, `ausgabe_tokens` | `integer` | soweit die API sie berichtet, sonst `null` |
| `laufzeit_ms` | `integer` | Dauer des Aufrufs |
| `kosten_mikro_usd` | `bigint` | Reservierung, nach Abschluss der ermittelte Betrag |
| `created_at`, `abgeschlossen_am` | `timestamptz` | Zeitpunkte |

Was **nicht** darin steht: die Reisebeschreibung, der Vorschlag, der Prompt, die Antwort, eine IP-Adresse, eine E-Mail-Adresse, ein Schlüssel. Ein Kostenprotokoll braucht Kosten, keine Reiseinhalte.

`null` bei den Tokens heisst „nicht berichtet" und nicht „null Tokens". Der Unterschied ist Geld: Auf `null` bleibt der reservierte Betrag stehen, auf `0` würde ein bezahlter Aufruf als kostenlos gelten. Die Bedingung `model_usage_abschluss_stimmig` hält zusammen, dass ein abgeschlossener Eintrag einen Zeitpunkt hat und ein reservierter keinen.

### Die drei Funktionen

| Funktion | Rechte | Aufgabe |
| --- | --- | --- |
| `modell_preis(text)` | nur Definer, kein `EXECUTE` für `anon`/`authenticated` | Preis eines Modells in Mikrodollar je Million Tokens |
| `modell_kontingent_beanspruchen(text, text, text, uuid)` | `EXECUTE` nur für `service_role` | prüft alle Grenzen und legt vor dem Aufruf eine Zeile mit dem Preis des schlechtesten Falls an |
| `modell_nutzung_abschliessen(uuid, text, int, int, int, int)` | `EXECUTE` nur für `service_role` | ersetzt Schätzung durch ermittelten Betrag |

Alle drei sind `SECURITY DEFINER` mit `set search_path = public, pg_temp`.

Beide öffentlichen Funktionen beginnen mit `perform pg_advisory_xact_lock(hashtext('public.model_usage'), 0)` – **eine** globale Sperre, kein Schlüssel je Kennung. Der Grund liegt in den Grenzen: Zwei verschiedene Kennungen nähmen verschiedene Sperren, sähen denselben Gesamtstand und kämen beide durch. Gerade die globalen Grenzen sind die, die gegen rotierende Gastkennungen wirken. Die Sperre wird höchstens 38-mal am Tag genommen.

Die Kennung eines angemeldeten Kontos kommt vom Server als `_konto`, nachdem `auth.getUser()` sie gelesen hat. Die Funktionen selbst sind für `anon` und `authenticated` nicht ausführbar.

### Die fünf Grenzen

| Grenze | Wert |
| --- | --- |
| je Kennung und Stunde | 4 |
| je Kennung und Tag | 8 |
| alle Gäste und Tag | 24 |
| insgesamt und Tag | 38 |
| Kosten insgesamt und Tag | 3 000 000 µ$ = $3.00 |

Sie stehen als Konstanten im Rumpf der Funktion und **nicht** in einer Konfigurationstabelle: Eine Grenze, die sich über eine Zeile ändern lässt, ändert sich irgendwann. Dieselben Zahlen stehen in `MODELL_GRENZEN` in `lib/modell/konfiguration.ts`, und `lib/modell/grenzen-datenbank.test.ts` vergleicht beide Seiten bei jedem `npm test` allein aus dem Migrations-SQL.

Die Reservierung wirkt **vor** dem Aufruf. Damit ist die Tagessumme zu jedem Zeitpunkt eine Obergrenze, auch während zehn Aufrufe gleichzeitig laufen. `gesamtTag = 38` hält den Kostendeckel allein ein: 38 × 77 200 µ$ = 2 933 600 µ$ < 3 000 000 µ$.

### Rechte

RLS ist eingeschaltet, eine Policy: `select` für `authenticated` mit `public.darf_betrieb_lesen()` – ab `moderator`.

`anon` hat auf der Tabelle **kein** Recht, auch kein `insert`. Ein Gast schreibt nicht selbst: Die Server Action ruft die beiden Funktionen über `service_role` auf. Für `anon` ist wieder keine `SECURITY DEFINER`-Funktion ausführbar.

`update` und `delete` hat niemand, auch der Betrieb nicht. Ein Kostenprotokoll, das sein Eigentümer aufräumen kann, ist keins.

### Nachweise

`npm run db:kontingent`, **16 Nachweise** gegen den Development-Branch:

| Nachweis | Erwartung |
| --- | --- |
| 4. Aufruf einer Kennung in der Stunde | Kontingent erteilt |
| 5. Aufruf | `53400` |
| 8. Aufruf einer Kennung am Tag | Kontingent erteilt |
| 9. Aufruf | `53400` |
| 25. Gastaufruf am Tag | `53400` |
| Konto bei vollem Gasttopf | Kontingent erteilt |
| 38. Aufruf insgesamt am Tag | Kontingent erteilt |
| 39. Aufruf | `53400` |
| Kostendeckel bei 2 922 798 µ$ | Kontingent erteilt |
| Kostendeckel bei 2 922 801 µ$ | `53400` |
| 6 gleichzeitige Sitzungen auf einen freien Platz | 1× erteilt, 5× `53400`, Bestand 38 |
| Abschluss mit Tokens | Kosten aus `modell_preis()` gerechnet |
| Abschluss ohne Tokens | Reservierung bleibt stehen |
| zweiter Abschluss derselben Zeile | ohne Wirkung |
| Abschluss einer fremden Kennung | ohne Fehler, ohne Wirkung |
| Konto schickt eine Gastkennung mit | `art = konto`, Kennung aus `auth.uid()` |

Wie `db:parallelitaet` schreibt dieses Skript echte Zeilen und rollt sie nicht zurück – gleichzeitige Sitzungen sehen einander nur festgeschrieben.

### Aufbewahrung

Es gibt **keine** automatische Löschung. Die Tabelle wächst um höchstens 38 Zeilen am Tag, also unter 14 000 im Jahr, und enthält keine Reiseinhalte. Der Hash ist eine Pseudonymisierung und keine Anonymisierung: Wer eine Kennung kennt, kann ihren Hash bilden. Er verhindert, dass das Protokoll selbst eine Liste von Kontokennungen ist.

Eine Aufbewahrungsfrist gehört zu der Entscheidung, die Funktion in Production einzuschalten, und steht als offener Punkt in [ROADMAP.md](../ROADMAP.md).

---

## 8. Advisor-Befunde

Behoben sind `function_search_path_mutable`, `auth_rls_initplan`, `multiple_permissive_policies`, `duplicate_index` und – seit `20260817100800` – `rls_enabled_no_policy`. Es bleiben **19** Security- und **6** Performance-Befunde; nach dem ersten Stand von Phase 2.1 waren es 23 und 6, nach Phase 1.5 18 und 6. Die vier Befunde `anon_security_definer_function_executable` (2) und die zwei zusätzlichen unter `authenticated_security_definer_function_executable` sind mit `20260819010000` entfallen: Die Kontingent-Funktionen sind für `anon` und `authenticated` nicht mehr ausführbar. Es bleibt `model_usage` als zwölfte Tabelle im GraphQL-Schema. Was bleibt, bleibt mit Grund:

| Befund | Anzahl | nach 1.5 | nach 1.4b | Bewertung |
| --- | --- | --- | --- | --- |
| `anon_security_definer_function_executable` | 0 | 0 | 0 | **behoben im Nachtrag zu Phase 2.1.** Der erste Stand gab den zwei Kontingent-Funktionen `EXECUTE` für `anon`; das öffnete denselben Weg über PostgREST. Seit `20260819010000` hat `anon` auf keiner `SECURITY DEFINER`-Funktion ein Ausführungsrecht. Nachgewiesen in `npm run db:sicherheit`, einschliesslich eines echten PostgREST-Aufrufs mit dem anon-Key |
| `authenticated_security_definer_function_executable` | 6 | 6 | 4 | `aktuelle_rolle()` und `hat_rolle_mindestens()` werden von den Policies gebraucht und müssen deshalb für `authenticated` ausführbar sein. Sie geben nur Auskunft über das aufrufende Konto selbst. `admin_payments_summary_30d()`, `admin_security_overview()` und seit Phase 1.5 `admin_reisen_kennzahlen()` und `admin_reisen_zeitreihe(integer)` prüfen die Fähigkeit intern und liefern ohne `betrieb-lesen` keine Zeile – nachgewiesen in Abschnitt 7. Die zwei Kontingent-Funktionen aus Phase 2.1 zählen hier nicht mehr |
| `pg_graphql_anon_table_exposed` | 1 | 1 | 1 | nur noch `airports`; die Tabelle soll ohne Anmeldung lesbar sein. Sichtbarkeit im GraphQL-Schema ist die Folge des `SELECT`-Rechts, nicht ein zusätzliches Recht. `blog_posts` und `blog_comments` sind mit Phase 1.4b entfallen. `model_usage` steht hier **nicht**: `anon` hat auf der Tabelle kein einziges Recht |
| `pg_graphql_authenticated_table_exposed` | 12 | 11 | 8 | dasselbe für angemeldete Konten, jetzt für alle zwölf Tabellen einschliesslich `model_usage`. Welche Zeilen sichtbar sind, entscheidet RLS – für `model_usage` sind es ohne `betrieb-lesen` null, nachgewiesen in Abschnitt 7 und in der Matrix von `npm run db:rls` |
| `unused_index` | 5 | 5 | 8 | der Development-Branch trägt keine echte Last. Ein Index, den nie eine Abfrage benutzt hat, ist auf einem Branch ohne Verkehr keine Aussage. Die fünf liegen auf `airports` (drei Trigramm-Indizes der Flughafensuche) und `profiles`. Die zwei Indizes auf `model_usage` erscheinen nicht: Jeder Anspruch liest über beide |
| `auth_db_connections_absolute` | 1 | 1 | 1 | Einstellung des Auth-Servers, kein Schemabefund. Gehört zur Kapazitätsplanung vor dem Launch |
| `auth_leaked_password_protection` | – | – | – | **behoben in Phase 1.4c.** `password_hibp_enabled` steht auf `true`; der Lauf danach meldet den Befund nicht, obwohl ein passwortgestütztes Konto existiert. Siehe unten |
| `rls_enabled_no_policy` | 0 | 0 | 0 | bleibt behoben |

Die sechs `SECURITY DEFINER`-Funktionen für `authenticated` folgen demselben Muster: interne Prüfung statt Rechteentzug. `pg_policy` wäre für jede Rolle lesbar und verriete die Bedingung jeder Policy; `admin_security_overview()` gibt nur deren Anzahl heraus.

**Der Auslöser aus dem Nachtrag der Phase 1.5 erscheint hier nicht, und das ist kein Versehen.** `public.reise_erzeugung_pruefen()` ist ebenfalls `SECURITY DEFINER`, aber `revoke all … from public, anon, authenticated` nimmt ihr das Ausführungsrecht: Sie ist über `/rest/v1/rpc/` nicht erreichbar, und ein Auslöser braucht das Recht des Aufrufers nicht. Dasselbe gilt für `modell_preis(text)` aus Phase 2.1: `revoke all … from public, anon, authenticated` nimmt auch ihr das Ausführungsrecht. Erreichbar ist sie nur aus den beiden Funktionen darüber – ein Preis, den ein Aufrufer selbst abfragen oder gar setzen könnte, wäre kein Deckel.

`auth_leaked_password_protection` meldeten die Advisors in den Läufen vom 17. August 09:20 und 10:49 nicht, im Abschlusslauf der Phase 1.4 dagegen schon – und im Lauf nach Phase 1.4b wieder nicht. Geschrieben hatte die Einstellung keine der beiden Phasen; gearbeitet wurde ausschliesslich über Migrationen und SQL.

Phase 1.4c hat die Vermutung geprüft und bestätigt: **Der Advisor meldet den Befund nur, solange passwortgestützte Konten auf dem Branch existieren.** Ein Lauf ohne solches Konto ergab damals 13 Security-Befunde; nach dem Anlegen genau eines Kontos mit Passwort waren es 14, der zusätzliche war dieser. Die Testkonten der RLS-Nachweise entstehen in zurückgerollten Transaktionen und sind beim Advisor-Lauf nicht mehr da – daher das Kommen und Gehen. Seit `password_hibp_enabled = true` bleibt der Befund aus, obwohl das Konto mit Passwort weiterhin existiert ([docs/AUTH.md](AUTH.md) Abschnitt 5); die Gesamtzahl liegt seit dem Nachtrag `20260819010000` bei **19**. Der Lauf vom 19. August 2026 nach dem Entzug der Kontingent-Rechte hat genau diese 19 Security- und 6 Performance-Befunde erneut gemeldet. Die sechs Performance-Befunde (`auth_db_connections_absolute` plus fünf `unused_index` auf `airports` und `profiles`) werden auf dem Development-Branch ohne repräsentative Last nicht durch Indexlöschung „behoben“.

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
| `npm test` – darin `lib/modell/grenzen-datenbank.test.ts`, `MODELL_GRENZEN` gegen die Konstanten in `20260818040000_modellnutzung.sql` | nein |
| `npm run check:schema-bezug` – jedes `.from()` und `.rpc()` gegen `types/supabase.ts` | nein |
| `npm run check:api-schutz` – jede Admin-Route ruft `requireAdminApi()` | nein |

`check:schema-bezug` ist die Antwort auf einen konkreten Fehler. Drei Routen schrieben und lasen `ip_blocklist`; diese Tabelle gibt es nicht, die richtige heißt `blocked_ips`. Aufgefallen ist es nie, weil `supabase-js` nicht wirft, sondern im `error`-Feld meldet – das `try/catch` um den Aufruf lief also nie an, und das Sperren einer IP meldete Erfolg, ohne etwas zu tun. Ebenso rief die Oberfläche eine Funktion `admin_security_overview` auf, die es nicht gab, fing den Fehler ab und zeigte aus null Zeilen „RLS aktiv 0/0 – alle Tabellen geschützt".

Beides ist behoben. Die Prüfung verhindert den Rückfall und kostet keinen Datenbankzugang.

| Prüfung | braucht Datenbank | schreibt echte Zeilen |
| --- | --- | --- |
| `npm run db:reproduzierbarkeit` | ja | nein |
| `npm run db:sicherheit` | ja | nein, Transaktion rollt zurück |
| `npm run db:rls` | ja | nein, Transaktion rollt zurück |
| `npm run db:rechte` | ja | nein |
| `npm run db:typen -- --pruefen` | ja | nein |
| `npm run db:advisors` | ja | nein |
| `npm run db:parallelitaet` | ja | ja, räumt auf (Abschnitt 7b) |
| `npm run db:kontingent` | ja | ja, räumt auf (Abschnitt 7c) |

Dazu kommt seit Phase 1.4c `npm run auth:pruefen` – der Abgleich der Auth-Konfiguration. Er liegt in einem eigenen CI-Job, weil er ein Geheimnis braucht, liest nur und rührt die Datenbank nicht an ([docs/AUTH.md](AUTH.md) Abschnitt 2). `npm run auth:fluesse` schreibt dagegen (ein Wegwerfkonto) und läuft aus demselben Grund wie die acht oben von Hand.

Diese acht laufen vor einer Zusammenführung von Hand gegen den Development-Branch. In die CI gehören sie erst, wenn dafür ein eigener, kurzlebiger Branch entsteht – ein CI-Lauf gegen den gemeinsamen Development-Branch würde bei nebenläufigen Läufen dieselben Testkonten anlegen.

`npm run modell:probe` gehört **nicht** in diese Liste und nicht in die CI: Es löst einen echten, bezahlten Modellaufruf aus und läuft nur ausdrücklich ([MODELL.md](MODELL.md) Abschnitt 8).

---

## 10. Einordnung der Tabellen

Maßstab ist nicht der Name, sondern die Verwendung. Grundlage ist `npm run db:verwendung`, das nur die Stellen zählt, an denen der Supabase-Client eine Struktur wirklich anspricht. Eine Textsuche zählt zu viel: `payments` trifft auch `admin_payments`, `creator_profiles` auch `sync_creator_profile_core`.

Nach Phase 1.4b enthält das Schema nur noch Tabellen, die verwendet werden. Die Einordnung bleibt trotzdem stehen: Sie erklärt, warum die acht geblieben sind, und die letzten beiden Abschnitte halten fest, was entfernt wurde.

### V2 benötigt – 7

| Tabelle | Zweck |
| --- | --- |
| `creator_profiles` | Konto, Rolle, Status. Wird in Phase 1.5 zum generischen Profil |
| `airports` | lokale Flughafenbasis für die Autocomplete (Phase 3.1), benutzt von `api/search/airports`; Import siehe [docs/FLUGHAFEN.md](FLUGHAFEN.md) |
| `places` | lokale Ortsbasis für Reiseziel und Abreise (Phase 3.1), benutzt von `api/search/places`; Import siehe [docs/ORTE.md](ORTE.md) |
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
| Aufbewahrungsfrist für `model_usage` | keine automatische Löschung. Höchstens 38 Zeilen am Tag, keine Reiseinhalte, Kennung nur als SHA-256. Die Frist gehört zu der Entscheidung, den Modellweg einzuschalten – Phase 2.1 hat ihn implementiert und abgeschaltet gelassen (Abschnitt 7c, [DECISIONS.md](../DECISIONS.md) ADR-0052) |
| ~~`anon` darf zwei `SECURITY DEFINER`-Funktionen ausführen~~ | **behoben im Nachtrag zu Phase 2.1.** `EXECUTE` nur noch `service_role`; Gäste laufen über die Server Action. Direkter anon-PostgREST erzeugt keine Reservierung |
| ~~Fehler in der Oberfläche sichtbar machen~~ | **erledigt in Phase 1.4d.** `TransactionsCard` und `WebhooksCard` prüften den Status der Antwort nicht und schrieben `data.rows ?? []` in den Zustand – bei 500 also eine leere Tabelle. Alle Admin-Ansichten benutzen jetzt dieselbe Fläche für *lädt* / *leer* / *nicht ermittelbar*, auch die drei serverseitig lesenden, bei denen die Prüfung denselben Fehler fand ([DECISIONS.md](../DECISIONS.md) ADR-0040) |
| ~~Schutz vor kompromittierten Passwörtern~~ | **erledigt in Phase 1.4c.** `password_hibp_enabled` steht auf `true`, die Wirkung ist nachgewiesen, und der Sollwert liegt im Repository. Warum der Advisor kam und ging, ist gemessen statt vermutet: Er meldet nur, solange passwortgestützte Konten existieren ([docs/AUTH.md](AUTH.md) Abschnitt 5) |
| ~~Auth-Konfiguration nicht versioniert~~ | **erledigt in Phase 1.4c.** Der Abschnitt `[auth]` in `supabase/config.toml` beschreibt jetzt den Branch; `npm run auth:pruefen` vergleicht ihn mit dem laufenden Stand und verlangt für jeden Schlüssel der API eine Aussage des Repositories. Beschreibung in [docs/AUTH.md](AUTH.md), Entscheidung in [DECISIONS.md](../DECISIONS.md) ADR-0039 |
| Production-Stand | weder in Phase 1.4 noch in Phase 1.4b erhoben oder verändert. Ob Production dieselben 29 Tabellen trägt, ist damit unbekannt – nicht angenommen. Der Abgleich gehört zum ersten Production-Deploy nach 1.5 |
