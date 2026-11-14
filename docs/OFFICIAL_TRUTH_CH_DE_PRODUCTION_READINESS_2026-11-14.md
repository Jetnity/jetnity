# CH→DE: Production-Ausführungsplan und Freigabefolge

Stand: 14.11.2026; Production-Metadaten ab 20:55 UTC lesend geprüft. **Ausführungsplan; Production-Softwarepaket noch unvollständig, keine Ausführungsbereitschaft oder Aktivierung.**
Nur dieses Dokument wurde geändert. Production, #1198 und Merge bleiben unberührt; kein Tarif oder Add-on aktiviert.

## Verbindliche Grundlage und Grenzen

- Aktuelle Wahrheit: [PR #1197](https://github.com/Jetnity/jetnity/pull/1197); gelesener Head `b7426918c5bb7604cbeb40e4e33da29effddc2be`, Tree `d450e6dfa2165ac4e6b0c02e0369f6868dbb6f36`.
- [CI 4245 / Run 43634089271](https://github.com/Jetnity/jetnity/actions/runs/43634089271): laut aktuellem PR alle neun Jobs grün und Dev-Abnahme bestanden. Dies ist Evidence dieses Heads, keine Production-Abnahme.
- Dev `yfvbxvijcorffwxbxahl`: eine echte Veröffentlichung und Besucheranzeige nachgewiesen; deren ursprüngliche Leserfrist war 14.11.2026, 21:31:53.315 Zürich. Spätere Erneuerung nur aus neuer Live-Evidence ableiten.
- Production `qscbgcdmivbbnzrcyegn`, Merge, #1198 und neue Kosten bleiben beim PO. Dev darf der TL autonom bearbeiten; abgeschlossene Dev-Owner-Schritte werden nicht wiederholt.
- Umfang: Visumpflicht für Schweizer Staatsangehörige mit Schweizer Reisepass bei direkter Einreise nach Deutschland. Keine vollständige Einreisezusage, Transit-/Aufenthalts-/Arbeitsberechtigung oder allgemeine Länderabdeckung.
- Die Recherche zu 206 Zielen bleibt `RESEARCH_ONLY` und wird nicht importiert.

## Bestätigte Production-Voraussetzungen

Die folgenden Befunde stammen aus lesenden Connector-Aufrufen und `BEGIN READ ONLY`-Katalogabfragen; keine Secret-Werte, Cron-Kommandos oder Vault-Inhalte wurden ausgegeben.

| Bereich | Live-Befund | Konsequenz für die Freigabe |
| --- | --- | --- |
| Supabase | `qscbgcdmivbbnzrcyegn`, `ACTIVE_HEALTHY`, Region `eu-central-2`, Engine 17 / Release `17.6.1.003`, Server `17.6`; `ssl=on`; Organisation `nvyzgizlpxfhtslmiwyx` auf **Pro** | Kein neues Projekt oder Tarifwechsel erforderlich. Echter TLS-/Rollen-Verbindungsnachweis aus der Production-Runtime bleibt offen. |
| V3-Pakete/Rollen | Keine `official*`-Schemas; keine Rollen mit Präfix `ot_v3`, `official` oder `jetnity_v3` | Sämtliche benötigten V3-Pakete und sechs technischen LOGINs müssen durch einen eigenen geprüften Production-Installer angelegt werden. |
| Erweiterungen | `pg_cron 1.6.4`, `supabase_vault 0.3.1`, `pgcrypto 1.3` vorhanden; `pg_net` und Schema `net` fehlen | Bestehendes Cron verwenden; für den vorgesehenen HTTP/HMAC-Anschluss `pg_net` im Production-Paket gesondert vorbereiten und prüfen. |
| Bestehende Jobs/Vault | Nur `sync_profile_emails_hourly`, `@hourly`, aktiv, Benutzer `postgres`; Vault-Namensliste leer | Bestehenden Job erhalten. CH→DE- und BG1-Jobs sowie eigene Scheduler-Credentials fehlen. |
| Migrationen/#1198 | Neuester registrierter Stand `20261101202029_places_search_quality_metadata`; `public.saved_offers` fehlt | #1198 benötigt nach eigener Freigabe seine gesonderte Migration; kein Produktionsnachweis aus Dev übernehmen. |
| Vercel | `jetnity-app` / `prj_wTTVawPItEO7a4HihEmaU3PsuaXM`, Team `team_fgOHJvth4GbXnyclxk95GQul` auf **Pro**, Next.js, Node `22.x`; SSO `all_except_custom_domains` | Bestehendes Projekt verwenden. Kein projektweiter Protection-Bypass oder neues Scheduler-Angebot vorgesehen. |
| Production-Env-Metadaten | Connector-Liste ist gekürzt; acht Production-Keys sichtbar, sechs V3-Passwortnamen nur im sichtbaren #1197-Preview-Scope | Vollständige Production-Key-/Scope-Inventur bleibt offen. Keine vollständige Abwesenheit weiterer Keys behaupten; neue Production-Credentials niemals aus Dev übernehmen. |
| IPv4 | Projekt-API liefert keinen Aktivierungsstatus | Vor kostenpflichtiger Aktivierung aktuellen Status lesend nachweisen; Preisfreigabe nur bei tatsächlich neu benötigtem Add-on. |

Sichtbare Production-Keys: `NEXT_PUBLIC_TRAVELPAYOUTS_FRAME_ORIGIN`, `OMIO_KATALOG_SCHLUESSEL`, `KAYAK_SANDBOX_API_KEY`, `KAYAK_SANDBOX_ENABLED`, `DISCOVERCARS_API_KEY`, `JETNITY_DISCOVERCARS_SEARCH_ENABLED`, `TWELVE_GO_TIMETABLE_ENABLED`, `NEXT_PUBLIC_TWELVE_GO_TIMETABLE_ENABLED`. Dies ist ausdrücklich kein vollständiges Inventar.
GitHub-Livebefund: #1197 bleibt Draft/unmerged auf `b7426918…`, CI4245/43634089271 **9/9 SUCCESS**; #1198 bleibt Draft/unmerged auf `bae95fb2…`, CI4227/43502391436 **9/9 SUCCESS**. Beide gegen `main` `63544e820e912bd275556588c956a09b99b1cf90`. Neue lokale Änderungen sind darin noch nicht geprüft.

## Bereits vorhanden und noch fehlend

| Bereich | Vorhandene Grundlage | Vor Production noch erforderlich |
| --- | --- | --- |
| Transport | `lib/readiness/official-truth-product-v3/transport/node-postgres-selection.ts` mit sechs begrenzten technischen LOGINs und TLS/PG17-Prüfung | Separat geprüfte feste Production-Auswahl. Aktuell nur `preview` und exakter #1197-Branch erlaubt; Dev-Host fest eingebaut. |
| Methodenfreigabe | `method/human-contract.ts`, `method/human-release.ts` im selben Paket; Dev-Owner/AAL2 und Freigabe abgeschlossen | Production-Ziel/Decoder/Releaseauswahl implementieren und prüfen; echte eigene Production-Freigabe statt Übernahme der Dev-Quittung. |
| Import | `runtime/ch-de-tick.ts`, bisherige Tick-Route; neuer Dev-Anschluss unter `scripts/db/official-truth-v3-dev-import-schedule-1/` | Produktionsroute und Zielbindung noch bauen; echte Aktualisierung samt exakter Fortsetzung und dauerhaft tragfähiger Budgetführung belegen. |
| Besucher | `app/api/readiness/ch-de-visa/route.ts`, `visitor/ch-de-snapshot.ts`; geprüfter Dev-Pfad | Production-Bindung, echte Antwort mit Quelle/Stand/Version und `synthetic:false`; Frische und negatives Verhalten prüfen. |
| Datenbank | Geprüfte Dev-Pakete und erhaltene Installationsnachweise in #1197/#1196 | Gegen den tatsächlichen Production-Katalog vorbereiteter Installer, eigene Baselines/Identitäten und Vor-/Nachvergleich. Dev-Providerdateien sind kein ausführbares Production-Paket. |
| Hintergrundschutz | `scripts/db/official-truth-v3-background-guard-1/` mit Vollprüfung, Sperre, Status und Dev-Recovery | Production-Installer und eigener Fünfminutentakt; echter vollständiger Nachfolgerproof; unabhängige Alarmzustellung samt Ausfallnachweis. |
| Diagnose | `scripts/official-truth-product-v3-dev/verify-installed-dev.mjs` und `vercel.json` | Temporären Dev-Build-Hook samt exaktem Import-Permit vor Production wie dort verlangt entfernen; eigene Production-Abnahme. |

Die relativen Kurzpfade `method/`, `runtime/` und `visitor/` liegen unter `lib/readiness/official-truth-product-v3/`.
Ein Merge von #1197 allein aktiviert CH→DE auf jetnity.com nicht: die aktuelle Zielauswahl verweigert Production.

## Offener Aktualisierungsfehler: ein Zeitplan allein genügt nicht

`source/aa-ch-de-reviewed-program.ts` bindet Quellenfrische an 24 Stunden, Projektion und Monitorintervall jeweils an eine Stunde.
`monitor/monitor.ts` liefert bei unverändertem Inhalt ohne anderen Anlass `unchanged`; dabei wird keine neue Regel angelegt.
Der bestehende Negativtest in `monitor/monitor.test.ts` verlangt ausdrücklich, dass unveränderter Inhalt weder eine neuere Regel erfindet noch die alte Quellenfrist erneuert.
Damit können eine noch gültige Quellenqualifikation und eine bereits abgelaufene öffentliche Projektion gleichzeitig bestehen. Häufigere Tick-Aufrufe beweisen keine Erneuerung.

Erforderlich ist ein unabhängig geprüfter regulärer Aktualisierungspfad mit tatsächlich neuen Abrufen und vollständigen Autoritäts-/Quellen-/Versionsprüfungen, auch wenn der fachliche Inhalt unverändert bleibt.
Keine Änderung alter Zeitstempel, kein blosses Verlängern von `expiresAt`, kein Umgehen von `unchanged`, Owner oder unbekannten Ausgängen.
Ein neues Prepared-/Publikationsergebnis muss aus echter Arbeit stammen. Die aktuelle Quelle darf bei Änderung/Widerspruch weiterhin nicht automatisch als unverändert angenommen werden.
Dieser Dokumentationsauftrag implementiert oder bestätigt diese Korrektur nicht.

Der neue [Dev-Scheduler-Plan](../scripts/db/official-truth-v3-dev-import-schedule-1/README.md) führt reguläre neue Anfragen und deren gespeicherte Fortsetzung mit Request-/Response-HMAC zusammen; sein neuer Head und echte automatische Folgeausführung sind separat zu prüfen.
Die unveränderte M04-Lebenszeitgrenze von 64 START/256 Queue-Operationen begrenzt einen 40-Minuten-Takt auf einen endlichen Pilot von ungefähr 38 Stunden; ein auf 48 Stunden begrenzter Alias-Sharelink löst diese Grenze nicht.
Die dauerhaft tragfähige Quoten-/Historienführung ist noch in Vorbereitung. Kein Reset, keine Erhöhung und kein Umgehen bestehender Zähler; der Production-Plan erhält erst nach eigener Prüfung den endgültigen Mechanismus.

Abnahme: echte geplante Ausführung und anschliessender automatischer Folgezyklus; neue gespeicherte Originale/Prüfungen, korrekte Bindungen und rechtzeitig erneuerte öffentliche Frist.
Auch Timeout, verlorene Antwort, Source-Änderung, Widerruf und abgelaufene Projektion müssen fail-closed bleiben. HTTP 200 oder ein registrierter Job allein reichen nicht.

## Vorbereitung vor der abschliessenden PO-Freigabe

1. Dev-Aktualisierungsfehler und Scheduler im zulässigen Dev-Scope abschliessen; Änderungen, tatsächliche Läufe und Grenzen in #1197 dokumentieren.
2. Production-Auswahl, Installer und Prüfschritte als überprüfbares, noch inaktives Paket fertigstellen. Exakte Quelle, Head/Tree, Migrationsartefakte, Hashes, Reihenfolge und Rücknahme festhalten.
3. Obigen Live-Katalog in Installer-Vorbedingungen übernehmen. Noch offen: vollständige Production-Env-Key-/Scope-Inventur, tatsächlicher IPv4-Status, Runtime-TLS, Owner-/AAL2-Sitzung und verfügbare Nutzungskapazität. Vor Ausführung erneut gegen Drift prüfen.
4. Passenden finalen Kandidaten unabhängig prüfen; alle erforderlichen neun CI-Jobs und Build gemeinsam auswerten. Fehler eines Laufs gesammelt korrigieren. Vorherige Dev-Nachweise nicht als neue Production-Gates ausgeben.
5. Einen konkreten Freigabeumfang samt Kosten vorlegen. Solange das Production-Paket oder automatische Aktualisierung unvollständig ist, keine reine Ausführungsbereitschaft behaupten.

## Ausführungsfolge nach entsprechender PO-Freigabe

1. **#1197 zuerst:** finalen Head/main-Bezug, unabhängigen Review, vollständige CI und passende Preview bestätigen; dann #1197 mergen. #1196-Backend ist in #1197 integriert, kein zweiter unabhängiger Altstand wird vorausgesetzt.
2. Das erst noch fertigzustellende Production-Paket am genehmigten Ziel installieren: eigene Methoden-/Intake-/Job-/Result-/Owner-/Transport-/Guard-Pakete, benötigtes `pg_net`, eigene Zielbindungen und Baselines. Voraussetzungen und Bestand vorher sichern/lesen, danach vollständiger Katalog-/Daten-/Rechtevergleich. Keine Dev-Daten, Quittungen oder Recoveryzustände übernehmen; bestehenden Profil-Cron erhalten.
3. Sechs eigene technische Production-Zugangsdaten nur serverseitig als Sensitive-Variablen setzen; Begrenzungen des geprüften Pakets erhalten. Keine Dev-Passwörter oder service_role als Ersatz verwenden.
4. Hintergrundschutz mit echtem Fünfminuten-Vollbeleg und unabhängiger Alarmzustellung nachweisen. Der bestehende Dev-CI-Statuscheck ist kein laufender Alarmdienst.
5. In der echten Production-Owner-/AAL2-Sitzung das vorbereitete Methodenpaket freigeben und dieselbe Operation unabhängig bestätigen. Vorhandene Anmeldung/MFA nicht neu einrichten; der PO wird nur für eine tatsächlich erforderliche Anmeldung oder einen 2FA-Code gebraucht.
6. Ersten regulären Quellenlauf durchführen, Originalclaim bei Bedarf über den geprüften Weg fortsetzen, Veröffentlichung und öffentliche Anzeige prüfen. Den vorbereiteten Importplan auf bestehendem `pg_cron` mit eigener Production-HMAC-Authentisierung aktivieren; echten Folgezyklus, Fristeinhaltung und endgültige Quotenführung belegen. Dev-Sharelink/-Cookie gehört nicht in Production.
7. Erst den mit Production-Einstellungen geprüften Build auf jetnity.com freigeben; Anmeldung, Ortssuche und CH→DE prüfen. Öffentliche CH→DE-Latenz in der echten Umgebung gegen das bestehende 750-ms-Budget messen; ein CI-Limit von 2 Sekunden ersetzt dies nicht.
8. **#1198 danach und unabhängig:** aktuellen main integrieren, die zwei reservierten Audit-Dateien auf #1197 aufbauen, vollständige CI am endgültigen Head; eigene PO-Freigabe für Migration/Merge/Veröffentlichung beachten.

Relevante Secret-Namen: `JETNITY_V3_PG_METHOD_PASSWORD`, `JETNITY_V3_PG_INTAKE_PASSWORD`, `JETNITY_V3_PG_JOBS_PASSWORD`, `JETNITY_V3_PG_RESULT_WRITER_PASSWORD`, `JETNITY_V3_PG_RESULT_READER_PASSWORD`, `JETNITY_V3_PG_RESULT_VERIFIER_PASSWORD`.
Der bestehende feste GET `/api/internal/readiness/ch-de-visa-tick` verlangt zusätzlich ein korrektes `CRON_SECRET`; er erlaubt keine Methodenauswahl oder Freigabe. Seine Verfügbarkeit und der endgültige Scheduler sind gesondert zu prüfen.
Der aktuelle `activate-scheduler.sql` prüft ausdrücklich `dev:yfvbxvijcorffwxbxahl:BG1`; diese Dev-Datei nicht in Production ausführen oder nur per Textersetzung umwidmen.

## #1198: genauer separater Umfang

[PR #1198](https://github.com/Jetnity/jetnity/pull/1198), gelesener Head `bae95fb27062d5e041ad38755bd05fe7f00fe312`, ist Reise-UX/Merkliste und keine Voraussetzung für CH→DE.
Die Vorrangregel betrifft `scripts/next-16-4-1-security-patch-p1/audit.mjs` und `audit.test.mjs`; `components/trips/Reisevorbereitung.tsx` bleibt #1197.
Nach Integration von #1197 braucht #1198 einen neuen vollständigen Lauf; seine vorherigen neun grünen Jobs sind nur Evidence des alten Heads.
Production benötigt die neue eigene CRUD-/RLS-Tabelle aus `supabase/migrations/20261113173644_saved_offers.sql`; bisher ist sie nur in Dev installiert.
Laut aktuellem #1198 werden keine neuen Production-Variablen benötigt. `NEXT_PUBLIC_ACTIVITIES_FRAME_ORIGIN` bleibt Preview-only.
Vorhandene produktive Providerwerte erhalten; keine fremden Preview-Widget-Hosts oder Testdaten übernehmen. Keine Änderung an #1198 durch diesen Auftrag.

## Kostenentscheidung – offizielle Quellen geprüft am 14.11.2026

| Posten | Preis / Einordnung | Entscheidung |
| --- | --- | --- |
| Supabase Dedicated IPv4 | 0,0055 USD je Stunde, ungefähr 4 USD je Monat pro Datenbank; nicht vom Spend Cap erfasst [1] | Dev bereits freigegeben. Production nur falls tatsächlich erforderlich und noch nicht aktiv, separat vom PO; zzgl. anfallender Steuern. |
| Bestehendes Supabase `pg_cron` | SQL/Funktions-/HTTP-Jobs laufen als Datenbankmodul [2] | Kein neuer externer Scheduleranbieter nötig; vorhandene Kapazität und eventuelle Mehrnutzung prüfen. Exakt null Zusatzkosten nicht belegt. |
| Klassische Vercel Cron Jobs | Scheduler im Tarif enthalten; normale Functions-Nutzung. Hobby täglich, Pro/Enterprise minütlich; nur Production [3] | Bestehendes Pro bestätigt. Mögliche Alternative, aber kein bereits geprüfter Ersatz des vorgesehenen pg_cron-Anschlusses. |
| Neue Vercel Schedules | Seit 5.11.2026 Preview möglich; Pro/Enterprise ab 5 USD/1 Mio. Runs plus 10 USD/1 Mio. Erstellungen, Function-Nutzung zusätzlich [4] | Keine Aktivierung ohne Kostenfreigabe. Bei fünf Minuten rechnerisch 8.640 Runs/30 Tage ≈ 0,043 USD reine Schedule-Runs; keine Gesamtprognose. |
| #1198 | Laut PR keine neue kostenpflichtige Infrastruktur; zusätzliche kleine Datenbankzeilen | Keine Tarif-/Provideränderung erforderlich; tatsächliche Nutzung bleibt Teil der bestehenden Rechnung. |

Vercel- und Supabase-Pro sind lesend bestätigt. Vercel-Billing belegt bereits nutzungsabhängige Build-/Function-Posten; eine Tageslesung ist keine CH→DE-Kostenprognose und keine Monatsrechnung. Die vollständige Monatsabfrage überschritt das Connectorlimit. Konkrete Mehrnutzung, bestehende Freikontingente und Supabase-Kapazität sind noch nicht ausreichend belegt; kein verbindlicher Gesamtmehrpreis und keine Nullkosten-Zusage.
Freigabeumfang Kosten: bedingt ein noch nicht aktives Production-IPv4-Add-on zu 0,0055 USD/Stunde sowie ausdrücklich bezifferte Mehrnutzung nach Messung; keine neue KI-/Research-API, kein Tarifwechsel und keine Vercel-Schedules-Buchung vorgesehen. Kein Tarif oder Add-on aktiviert.

## Rücknahme und Abschlussnachweis

- Bei Fehlern zuerst den Quellenzeitplan stoppen und die Veröffentlichung über den geprüften Sperr-/Widerrufspfad geschlossen halten; keine veraltete Antwort als aktuell anzeigen.
- Vorheriges Production-Deployment bereithalten. Ein App-Rollback entfernt keine Datenbankänderung; inkompatible Schemarücknahmen brauchen ein geprüftes eigenes Paket.
- Historie, Originale, Freigaben und unbekannte Ausgänge erhalten; kein Reset, keine rekonstruierte Authority und keine destruktive Recovery benutzter Pakete.
- Abschluss nur mit exaktem Production-Head, Installationsbelegen, eigenem Owner-/Methodenbeleg, echtem Quellen-/Publikationsnachweis, aktuellem BG1-Proof, Alarmtest, automatischem Folgezyklus und Besucher-Smokes.
- Im jetzigen Stand: Ausführungsumfang und Live-Voraussetzungen konkretisiert; Production-Zieltransport/-Installer, dauerhafte Quotenführung, Installation, Kostenfreigabe und Abnahme **offen**. Kein Ready/Merge/Launch-PASS.

## Quellen

1. [Supabase IPv4-Nutzung und Preis](https://supabase.com/docs/guides/platform/manage-your-usage/ipv4).
2. [Supabase Cron-Dokumentation](https://supabase.com/docs/guides/cron).
3. [Vercel Cron Jobs](https://vercel.com/docs/schedules/cron-jobs) und [Nutzung/Preise](https://vercel.com/docs/schedules/cron-jobs/usage-and-pricing).
4. [Vercel Schedules: öffentliche Beta vom 5.11.2026](https://vercel.com/changelog/vercel-schedules-is-now-in-public-beta).
5. [Dev-Recovery-/Installationshandoff](OFFICIAL_TRUTH_DEV_GUARD_RECOVERY_1_HANDOFF_2026-11-14.md), [Owner-Import-Handoff](OFFICIAL_TRUTH_DEV_OWNER_IMPORT_1_HANDOFF_2026-11-13.md), aktuelle PRs #1197/#1198 und die oben benannten Quelldateien. Historische Handoff-Abschnitte verlieren bei neuerer Live-Evidence ihren Status als aktueller Stand.
6. Live-Metadaten: Supabase `get_project`, `get_organization` und nur lesende `pg_namespace`-/`pg_roles`-/`pg_extension`-/`cron.job`-/`vault.secrets`-/Migrationsabfragen; Vercel `get_project`, `get_git_deployment_context`, `filter_project_envs(decrypt=false)` und `list_billing_charges`; GitHub `fetch_pr`, `fetch_commit_workflow_runs`, `fetch_workflow_run_jobs`. [Production-Projekt](https://supabase.com/dashboard/project/qscbgcdmivbbnzrcyegn), [Vercel-Projekt](https://vercel.com/jetnity-e1b93c82/jetnity-app), [CI #1198](https://github.com/Jetnity/jetnity/actions/runs/43502391436).
