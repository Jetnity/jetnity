# CH→DE: Production-Ausführungsplan und Freigabefolge

Stand: 14.11.2026; Production-Metadaten ab 20:55 UTC lesend geprüft, Add-ons zuletzt um 22:02 UTC im Cloud-Browser gelesen. **Konkreter Arbeits-/Releaseumfang; Production-Softwarepaket noch unvollständig, keine Ausführungsbereitschaft oder Aktivierung.**
Production, #1198 und Merge bleiben unberührt; kein Tarif oder Add-on aktiviert. Ein Dev-only-Merge von #1197 und die spätere Production-Aktivierung sind getrennte Freigaben.

## Verbindliche Grundlage und Grenzen

- Veröffentlichte Grundlage dieses Arbeitsstands in [PR #1197](https://github.com/Jetnity/jetnity/pull/1197): `0ef655667c2143420acc8421c1f63bcfb74d6319`. CI4246 hatte zwölf Pinfehler; sie sind gemeinsam korrigiert. In CI4247 bestanden sieben Jobs; Hosted-PG17 und sein Schlussgate scheiterten an zwei zusammen ausgewerteten Testproblemen: erneutem Terminal-CAS nach Ablauf seines ursprünglichen 5s-Envelopes und dem 700s-Testdeckel während des regulären nächsten BG1-Slots. Die echte Historie mit 87 STARTs / 448 Operationen war bereits vollständig vorhanden. Der Folgekandidat erhält alle echten Aufbauaufrufe, verwendet die reguläre Bestätigung derselben Originaloperation und gibt allein dem neuen Testfall 1000s für Aufbau plus bis zu 300s echte Slot-Wartezeit. Bestehende CI-30min- sowie Runtime-5s-/30s-Grenzen bleiben unverändert. Claim-Fortsetzung und aktuelle Pins bestanden lokal **46/46** beziehungsweise **586/586** Prüfungen; eigene vollständige CI und passende Preview bleiben erforderlich. Den danach tatsächlichen Head und Abschluss ausschließlich aus dem aktuellen PR-Stand übernehmen.
- **Historische Ausgangsbasis:** Head `b7426918c5bb7604cbeb40e4e33da29effddc2be`, Tree `d450e6dfa2165ac4e6b0c02e0369f6868dbb6f36`, [CI4245 / Run43634089271](https://github.com/Jetnity/jetnity/actions/runs/43634089271) mit neun grünen Jobs, erster Dev-Regelversion und bestandener Dev-Abnahme. Ihre ursprüngliche Leserfrist 21:31:53.315 Zürich ist kein aktueller Frischenachweis.
- Dev `yfvbxvijcorffwxbxahl`: der normale Quellenlauf veröffentlichte **Regelversion 2 am 14.11.2026 um 21:20:24 UTC**, Quelle geprüft um **21:18:53 UTC**, ursprünglicher Ablauf **22:18:56 UTC**. Der Ablauf ist im Besucherpfad tatsächlich bestätigt. Ein weiterer normaler Quellenauftrag ab 22:03 UTC bleibt mit seinen ursprünglichen IDs gespeichert; sein Claim wurde ohne neuen START committed und ist abgelaufen. Die reguläre Fortsetzung desselben Auftrags wird korrigiert, ohne neue Owner-Freigabe oder Ersatzquelle. Der regelmäßige Importplan ist in diesem Arbeitsstand **noch nicht installiert oder aktiviert**; spätere Frische und Aktivierung verlangen neue Live-Evidence in #1197.
- Production `qscbgcdmivbbnzrcyegn`, Merge, #1198 und neue Kosten bleiben beim PO. Dev darf der TL autonom bearbeiten; abgeschlossene Dev-Owner-Schritte werden nicht wiederholt.
- Umfang: Visumpflicht für Schweizer Staatsangehörige mit Schweizer Reisepass bei direkter Einreise nach Deutschland. Keine vollständige Einreisezusage, Transit-/Aufenthalts-/Arbeitsberechtigung oder allgemeine Länderabdeckung.
- Die Recherche zu 206 Zielen bleibt `RESEARCH_ONLY` und wird nicht importiert.

## Bestätigte Production-Voraussetzungen

Die folgenden Befunde stammen aus lesenden Connector-Aufrufen, `BEGIN READ ONLY`-Katalogabfragen und der ausdrücklich benannten Dashboard-Navigation; keine Secret-Werte, Cron-Kommandos oder Vault-Inhalte wurden ausgegeben.

| Bereich | Live-Befund | Konsequenz für die Freigabe |
| --- | --- | --- |
| Supabase | `qscbgcdmivbbnzrcyegn`, `ACTIVE_HEALTHY`, Region `eu-central-2`, Engine 17 / Release `17.6.1.003`, Server `17.6`; `ssl=on`; Organisation `nvyzgizlpxfhtslmiwyx` auf **Pro**. Dashboard um 22:02 UTC: **Micro**, 1 GB RAM, 8 GB Disk, Spend Cap aktiv, keine Read Replicas | Kein neues Projekt oder Tarifwechsel erforderlich. Echter TLS-/Rollen-Verbindungsnachweis aus der Production-Runtime und ausreichende Nutzungskapazität bleiben offen. |
| V3-Pakete/Rollen | Keine `official*`-Schemas oder `jetnity_ot_auth`; keine Rollen mit Präfix `ot_v3`, `official` oder `jetnity_v3`; PAI-Funktion `profil_autoritaet_integritaet_pruefen_v1` und Trigger `profiles_autoritaet_integritaet_v1` fehlen | Sämtliche benötigten PAI-/V3-Pakete und sechs technischen LOGINs müssen durch einen eigenen geprüften Production-Installer angelegt werden. Der vorhandene Creator `postgres` hat LOGIN/CREATEROLE/BYPASSRLS, aber kein SUPERUSER; der vollständige Production-Katalogvergleich bleibt offen. |
| Erweiterungen | `pg_cron 1.6.4`, `supabase_vault 0.3.1`, `pgcrypto 1.3` vorhanden; `pg_net` und Schema `net` fehlen | Bestehendes Cron verwenden; für den vorgesehenen HTTP/HMAC-Anschluss `pg_net` im Production-Paket gesondert vorbereiten und prüfen. |
| Bestehende Jobs/Vault | Nur `sync_profile_emails_hourly`, `@hourly`, aktiv, Benutzer `postgres`; Vault-Namensliste leer | Bestehenden Job erhalten. CH→DE- und BG1-Jobs sowie eigene Scheduler-Credentials fehlen. |
| Migrationen/#1198 | Neuester registrierter Stand `20261101202029_places_search_quality_metadata`; `public.saved_offers` fehlt | #1198 benötigt nach eigener Freigabe seine gesonderte Migration; kein Produktionsnachweis aus Dev übernehmen. |
| Vercel | `jetnity-app` / `prj_wTTVawPItEO7a4HihEmaU3PsuaXM`, Team `team_fgOHJvth4GbXnyclxk95GQul` auf **Pro**, Next.js, Node `22.x`; SSO `all_except_custom_domains` | Bestehendes Projekt verwenden. Kein projektweiter Protection-Bypass oder neues Scheduler-Angebot vorgesehen. |
| Production-Env-Metadaten | Connector-Liste ist gekürzt; acht Production-Keys sichtbar, sechs V3-Passwortnamen nur im sichtbaren #1197-Preview-Scope | Vollständige Production-Key-/Scope-Inventur bleibt offen. Keine vollständige Abwesenheit weiterer Keys behaupten; neue Production-Credentials niemals aus Dev übernehmen. |
| IPv4 | Production-Dashboard `/settings/addons` um **22:02 UTC**: **Dedicated IPv4 address — DISABLED** [7] | Aktivierung ist eine neue kostenpflichtige Änderung und braucht die PO-Freigabe, falls der geprüfte Production-Transport sie benötigt. Kein Add-on aktiviert. |

Sichtbare Production-Keys: `NEXT_PUBLIC_TRAVELPAYOUTS_FRAME_ORIGIN`, `OMIO_KATALOG_SCHLUESSEL`, `KAYAK_SANDBOX_API_KEY`, `KAYAK_SANDBOX_ENABLED`, `DISCOVERCARS_API_KEY`, `JETNITY_DISCOVERCARS_SEARCH_ENABLED`, `TWELVE_GO_TIMETABLE_ENABLED`, `NEXT_PUBLIC_TWELVE_GO_TIMETABLE_ENABLED`. Dies ist ausdrücklich kein vollständiges Inventar.
Historischer GitHub-Metadatensnapshot: #1198 war Draft/unmerged auf `bae95fb2…`, CI4227/43502391436 **9/9 SUCCESS**, Main `63544e820e912bd275556588c956a09b99b1cf90`. Die oben genannte #1197-Grundlage und ihre Folgeänderungen hatten zum Dokumentationszeitpunkt noch keinen abschließenden gemeinsamen CI-/Live-Nachweis. Vor jeder Mergefreigabe beide tatsächlichen Heads und Main erneut lesen.

## Bereits vorhanden und noch fehlend

| Bereich | Vorhandene Grundlage | Vor Production noch erforderlich |
| --- | --- | --- |
| Transport | `lib/readiness/official-truth-product-v3/transport/node-postgres-selection.ts` mit sechs begrenzten technischen LOGINs und TLS/PG17-Prüfung | Separat geprüfte feste Production-Auswahl. Aktuell nur `preview` und exakter #1197-Branch erlaubt; Dev-Host fest eingebaut. |
| Methodenfreigabe | `method/human-contract.ts`, `method/human-release.ts`, `method/human-server.ts` im selben Paket; Dev-Owner/AAL2 und Freigabe abgeschlossen | Production-Ziel/Decoder/Releaseauswahl und Server-Zielprüfung implementieren und prüfen; echte eigene Production-Freigabe statt Übernahme der Dev-Quittung. |
| Import | `runtime/ch-de-tick.ts`, bisherige Tick-Route; neuer Dev-Anschluss unter `scripts/db/official-truth-v3-dev-import-schedule-1/` | Produktionsroute und Zielbindung noch bauen; echte Aktualisierung samt exakter Fortsetzung und dauerhaft tragfähiger Budgetführung belegen. |
| Besucher | `app/api/readiness/ch-de-visa/route.ts`, `visitor/ch-de-snapshot.ts`; geprüfter Dev-Pfad | Production-Bindung, echte Antwort mit Quelle/Stand/Version und `synthetic:false`; Frische und negatives Verhalten prüfen. |
| Datenbank | Geprüfte Dev-Pakete und erhaltene Installationsnachweise in #1197/#1196 | Gegen den tatsächlichen Production-Katalog vorbereiteter Installer, eigene Baselines/Identitäten und Vor-/Nachvergleich. Dev-Providerdateien sind kein ausführbares Production-Paket. |
| Hintergrundschutz | `scripts/db/official-truth-v3-background-guard-1/` mit Vollprüfung, Sperre, Status und Dev-Recovery | Production-Installer und eigener Fünfminutentakt; echter vollständiger Nachfolgerproof; unabhängige Alarmzustellung samt Ausfallnachweis. |
| Diagnose | `scripts/official-truth-product-v3-dev/verify-installed-dev.mjs` und `vercel.json`; der Hook überspringt Production vor allen DB-Imports | Vor einem Production-Deployment gemäß eigenem Hook-Vertrag entfernen; zugehörige Importgrenzen und Deployment-Audit-Pins gemeinsam aktualisieren. Das ist ein kleiner Abschlusscleanup, keine Voraussetzung, die ganze Production-Funktion in #1197 zu bauen. |

Die relativen Kurzpfade `transport/`, `method/`, `runtime/` und `visitor/` liegen unter `lib/readiness/official-truth-product-v3/`.
Ein Merge von #1197 allein aktiviert CH→DE auf jetnity.com nicht: die aktuelle Zielauswahl verweigert Production, die öffentliche Fallback-Abfrage liefert ehrlich `unavailable/unbound`. Die fehlenden Production-Artefakte sind **vor Aktivierung zwingend, technisch aber nicht vor einem ausdrücklich Dev-only-#1197-Merge**. Sie können in einem eigenen Anschluss-PR auf #1197 vorbereitet und nach dessen Merge erneut gegen Main geprüft werden. Ein gegebenenfalls automatisch ausgelöstes Production-Deployment von Main bleibt trotzdem Bestandteil der ausdrücklich zu genehmigenden Merge-/Releasewirkung.

### Minimale Änderungspakete für den Anschluss

- **Feste Ziele und Owner-Pfad:** `transport/node-postgres-selection.ts` sowie `method/human-contract.ts`, `method/human-release.ts`, `method/human-server.ts` auf die getrennt geprüften Production-Ziele `db.qscbgcdmivbbnzrcyegn.supabase.co` / `https://qscbgcdmivbbnzrcyegn.supabase.co` vorbereiten. Die bestehende manuelle Importoberfläche benötigt außerdem `app/api/internal/readiness/ch-de-owner-import/route.ts` und `app/(admin)/admin/official-truth/import/page.tsx`; Methodenseite/-texte müssen die tatsächliche Umgebung benennen. Bei Übernahme der Guard-Bedienung gehören `runtime/guard-server.ts`, Owner-Guard-Route und Guard-Seite zur gleichen Zielprüfung. Keine frei wählbaren Hosts oder Dev-Credentials in Production.
- **Eigene SQL-/Scheduler-Artefakte:** geprüfte Production-Fassungen für HMT, BG1 samt Status/Vollprüfplan, rollierende Quote und Import-Sender mit eigenem HMAC-/Vault-/Cron-Vertrag erstellen. Die bestehenden Verzeichnisse `official-truth-v3-human-method-transport-1`, `official-truth-v3-background-guard-1`, `official-truth-v3-rolling-jobs-quota-1` und `official-truth-v3-dev-import-schedule-1` liefern Vorlagen. Neue Produktionsroute und Sender binden die genehmigte jetnity.com-Adresse; Dev-Preview-Cookie/-Erneuerung bleiben ausgeschlossen. Installer, Readback und Rücknahme müssen den tatsächlichen Production-Vorgänger prüfen.
- **Kleiner Build-Cleanup:** `vercel.json`, der temporäre `verify-installed-dev.mjs`, dessen Import-Permits in `scripts/db/official-truth-v3-node-postgres-transport-1/boundary.test.ts` sowie die passenden `scripts/next-16-4-1-security-patch-p1/audit.mjs` / `audit.test.mjs` und abhängigen Pins gemeinsam nachführen. Der lesende Node22-Check mit `VERCEL_ENV=production` ergab bereits Exit0 / `SKIPPED_OUTSIDE_SELECTED_DEV`; der Hook ist kein technischer Production-Buildfehler. Wenn #1197 automatisch nach Production deployt, erfolgt der vertragliche Cleanup vor diesem Merge; sonst spätestens im Anschluss-PR vor Production-Deployment. Dev-Branch/Alias und Zeitplan bis zum gesondert geprüften Übergang erhalten.

## Verbindliche SQL-Reihenfolge und fehlende Zielartefakte

Die vorhandenen Vorlagen liegen unter `scripts/db/`; der vollständige HRS-Aufbau in `official-truth-v3-hosted-result-store-1/native.ts` belegt diese Reihenfolge:

1. `profile-authority-integrity-1/install-candidate.sql` (PAI), nach Vergleich mit dem tatsächlichen bestehenden Profil-/Auth-Katalog und unter nachgewiesener DDL-Ruhe.
2. Die drei eigenen Transport-LOGINs `ot_v3_method_transport_login`, `ot_v3_intake_transport_login`, `ot_v3_jobs_transport_login` mit begrenzten CONNECT-Rechten anlegen, bevor die geschützten Kataloge eingefroren werden.
3. `official-truth-v3-private-owner-guards-1/install-candidate.sql` (PG1) → `official-truth-v3-hosted-method-authority-1/install-candidate.sql` (HMA1) → `official-truth-v3-hosted-intake-store-1/install-candidate.sql` (HS1).
4. `official-truth-v3-human-method-transport-1/install-candidate.sql` (HMT1) mit eigener geprüfter Production-Zielbindung.
5. `official-truth-v3-hosted-result-store-1/install-candidate.sql` (HRS) mit eigener vollständiger Ergebnisbindung → **erst danach** `official-truth-v3-hosted-durable-jobs-1/install-candidate.sql` (HM04). HRS verweigert ausdrücklich eine Installation nach vorhandenen HM04-Objekten. Seine drei Result-LOGINs entstehen im HRS-Paket.
6. Genau die drei geprüften SET-Rollenkanten für Methoden-/Intake-/Jobs-Transport anlegen; keine zusätzliche Owner-Mitgliedschaft oder globale Rechte.
7. Eigenes Production-BG1-Paket aus den Vorlagen `official-truth-v3-background-guard-1/provider-migration-body.sql`, `status-rpc-provider-migration-body.sql` und `activate-scheduler.sql` ableiten, prüfen und mit eigenen Baselines ausführen.
8. Eigenes Production-Importpaket auf Basis von `official-truth-v3-dev-import-schedule-1/core.sql` und `activate.sql` samt geprüfter dauerhafter Quotenführung installieren; `pg_net` erst im genehmigten Production-Paket ergänzen. Preview-Zugangserneuerung bleibt Dev-spezifisch.

**Noch fehlende ausführbare Artefakte:** ein gegen den tatsächlichen Production-Katalog geprüftes Installations-/Readback-Paket mit exakten Dateiidentitäten, Production-Fassungen der festen Transport-/HMT-/HumanRelease-/BG1-Zielbindungen, Production-Importroute und zugehöriger HMAC-/Vault-/Cron-Vertrag sowie deren zusammenhängender Abnahme-/Rücknahmeplan. Die vorhandenen Dev-Dateien sind dafür Vorlagen, keine unmittelbar ausführbare Production-Auswahl.
Die synthetischen Auth-/Profil-Seeds aus dem Native-Harness, Dev-Owner-Quittungen und Dev-Recovery-Dateien werden nicht übernommen. `COMPOSED_DEV_MANIFEST_V1.installOrder` allein enthält HRS nicht und ersetzt diese Reihenfolge nicht.

## Regelmäßige Aktualisierung: manueller Nachweis und noch offene Automatik

`source/aa-ch-de-reviewed-program.ts` bindet Quellenfrische an 24 Stunden, Projektion und Monitorintervall jeweils an eine Stunde.
`monitor/monitor.ts` liefert bei unverändertem Inhalt ohne anderen Anlass `unchanged`; dabei wird keine neue Regel angelegt.
Der bestehende Negativtest in `monitor/monitor.test.ts` verlangt ausdrücklich, dass unveränderter Inhalt weder eine neuere Regel erfindet noch die alte Quellenfrist erneuert.
Damit können eine noch gültige Quellenqualifikation und eine bereits abgelaufene öffentliche Projektion gleichzeitig bestehen. Häufigere Tick-Aufrufe beweisen keine Erneuerung.

Erforderlich ist ein unabhängig geprüfter regulärer Aktualisierungspfad mit tatsächlich neuen Abrufen und vollständigen Autoritäts-/Quellen-/Versionsprüfungen, auch wenn der fachliche Inhalt unverändert bleibt. Der neue manuelle Quellenlauf samt Original-ID-Resume hat dies mit Regelversion 2 belegt; ein automatischer Folgezyklus steht noch aus.
Keine Änderung alter Zeitstempel, kein blosses Verlängern von `expiresAt`, kein Umgehen von `unchanged`, Owner oder unbekannten Ausgängen.
Ein neues Prepared-/Publikationsergebnis muss aus echter Arbeit stammen. Die aktuelle Quelle darf bei Änderung/Widerspruch weiterhin nicht automatisch als unverändert angenommen werden.
Dieser Dokumentationsauftrag installiert keinen Scheduler und überträgt keinen Dev-Nachweis auf Production.

Der neue [Dev-Scheduler-Plan](../scripts/db/official-truth-v3-dev-import-schedule-1/README.md) führt reguläre neue Anfragen und deren gespeicherte Fortsetzung mit Request-/Response-HMAC zusammen; sein neuer Head und echte automatische Folgeausführung sind separat zu prüfen.
Die ursprünglich installierte M04-Lebenszeitgrenze von 64 START/256 Queue-Operationen begrenzt einen 40-Minuten-Takt auf einen endlichen Pilot von ungefähr 38 Stunden; der ursprüngliche 48-Stunden-Sharelink löst diese Grenze nicht.
Der getrennte Kandidat `rolling_24h_v2` führt dieselben Grenzen über die letzten 24 Stunden, bei unveränderter vollständiger Lebenszeithistorie. Die aliasgebundene Preview-Erneuerung begrenzt JWTs ohne `exp` lokal auf sieben Tage nach `iat`. Beide Kandidaten und ihre gemeinsame automatische Live-Abnahme sind noch offen. Kein Counterreset, keine neue Subjektidentität oder Übernahme dieser Dev-Auswahl als Production-Freigabe.

Abnahme: echte geplante Ausführung und anschliessender automatischer Folgezyklus; neue gespeicherte Originale/Prüfungen, korrekte Bindungen und rechtzeitig erneuerte öffentliche Frist.
Auch Timeout, verlorene Antwort, Source-Änderung, Widerruf und abgelaufene Projektion müssen fail-closed bleiben. HTTP 200 oder ein registrierter Job allein reichen nicht.

## Vorbereitung vor der abschliessenden Production-Ausführungsfreigabe

1. Dev-Aktualisierung und Scheduler im zulässigen Dev-Scope abschliessen; Änderungen, tatsächliche Läufe und Grenzen in #1197 dokumentieren.
2. Production-Auswahl, Installer und Prüfschritte als überprüfbares, noch inaktives Paket fertigstellen, wahlweise im eigenen Anschluss-PR. Exakte Quelle, Head/Tree, Migrationsartefakte, Hashes, Reihenfolge und Rücknahme festhalten. Dies ist keine technische Vorbedingung für einen gesondert genehmigten Dev-only-Merge von #1197.
3. Obigen Live-Katalog in Installer-Vorbedingungen übernehmen. Production-IPv4 ist um 22:02 UTC bestätigt deaktiviert; noch offen sind die vollständige Production-Env-Key-/Scope-Inventur, Runtime-TLS, Owner-/AAL2-Sitzung und verfügbare Nutzungskapazität. Vor Ausführung erneut gegen Drift prüfen.
4. Passenden finalen Kandidaten unabhängig prüfen; alle erforderlichen neun CI-Jobs und Build gemeinsam auswerten. Fehler eines Laufs gesammelt korrigieren. Vorherige Dev-Nachweise nicht als neue Production-Gates ausgeben.
5. Einen konkreten Freigabeumfang samt Kosten vorlegen. Solange das Production-Paket oder automatische Aktualisierung unvollständig ist, keine reine Ausführungsbereitschaft behaupten.

## Kurzer genehmigungsfähiger Arbeits-/Releaseumfang

Diese Liste benennt die getrennt freizugebenden Leistungen und ihre Reihenfolge. Sie behauptet keine heutige Ausführungsbereitschaft; vor der jeweiligen Production-Ausführung müssen deren oben genannte konkrete Artefakte und Gates vorliegen.

1. **#1197 zuerst als Dev-Stand mergen:** nach echter Dev-Automatik, finalem Review, vollständiger CI und passender Preview; notwendiger Build-Cleanup und mögliche Main-Deploymentwirkung gehören zur Freigabe. CH→DE bleibt dabei in Production geschlossen. #1196 ist bereits integriert.
2. **Production-Anschluss fertigstellen und separat freigeben:** die oben benannten Ziel-/SQL-/Scheduler-Artefakte, Secrets-Verträge, Rücknahme und vollständige Tests liefern; endgültigen Head gegen Main prüfen. Erst nach eigenem Review-/CI-/PO-Gate mergen und den zugehörigen Build bereitstellen. Vor Installation und echter Methodenfreigabe muss dieser weiterhin geschlossen bleiben.
3. **Production aufbauen:** eigenes Paket am genehmigten Ziel installieren, **HRS vor HM04**, sechs eigene Sensitive-Zugangsdaten und Scheduler-HMAC/Vault/`pg_net` einrichten. Vor-/Nachvergleich, echte TLS-Verbindung, Hintergrundschutz im Fünfminutentakt und unabhängigen Alarmtest belegen; bestehenden Profil-Cron erhalten.
4. **CH→DE aktivieren und abnehmen:** eigene Production-Owner-/AAL2-Freigabe im Cloud-Browser bestätigen, normalen Quellenimport ausführen und Originalauftrag bei Bedarf fortsetzen. Importplan aktivieren; jetnity.com mit Quelle/Version/Frische, Sperrverhalten, echter Latenz innerhalb 750 ms, automatischem Folgezyklus und BG1-Proof abnehmen. PO nur für erforderliche Anmeldung/2FA einbeziehen.
5. **#1198 danach separat:** nach #1197 und zur Wahrung des CH→DE-Vorrangs nach dessen Production-Abnahme auf aktuellem Main neu prüfen; eigene Merkliste-Migration, vollständige CI sowie eigene Merge-/Releasefreigabe. Die 206-Ziele-Recherche bleibt `RESEARCH_ONLY` und wird nicht importiert.
6. **Kosten vor Ausführung begrenzen:** kein neues Tarif-/Scheduler-Abo vorsehen. Für das bestätigt deaktivierte Production-IPv4 bei tatsächlichem Transportbedarf den angezeigten Betrag **4,00 USD/Monat pro Datenbank zzgl. Steuern** separat freigeben; tatsächliche Abrechnung 0,0055 USD/Stunde. Zusätzliche Datenbank-/Function-Nutzung erst nach Bezifferung freigeben; kein belegter Gesamtmehrpreis von null.

Die sechs festen Runtime-ENV-Namen, jeweils mit eigenen Sensitive-Werten ausschliesslich im Production-Scope: `JETNITY_V3_PG_METHOD_PASSWORD`, `JETNITY_V3_PG_INTAKE_PASSWORD`, `JETNITY_V3_PG_JOBS_PASSWORD`, `JETNITY_V3_PG_RESULT_WRITER_PASSWORD`, `JETNITY_V3_PG_RESULT_READER_PASSWORD`, `JETNITY_V3_PG_RESULT_VERIFIER_PASSWORD`.
Der bestehende feste GET `/api/internal/readiness/ch-de-visa-tick` verlangt `CRON_SECRET`; der neue Dev-POST verwendet `JETNITY_DEV_IMPORT_CRON_SECRET`. Keiner davon belegt bereits den noch fehlenden Production-Scheduler-Vertrag; dessen zusätzlicher Secret-Name/-Scope und Vault-Bindung müssen vor Freigabe konkret implementiert sein.
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
| Supabase Dedicated IPv4 | Dashboardbetrag **4,00 USD/Monat pro Datenbank zzgl. Steuern** [7]; Abrechnung 0,0055 USD je Stunde, nicht vom Spend Cap erfasst [1] | Dev bereits freigegeben. Production um 22:02 UTC ausdrücklich **DISABLED**, Detailauswahl `No IPv4 address` [7]; angezeigten Monatsbetrag nur bei tatsächlichem Transportbedarf separat vom PO freigeben. |
| Bestehendes Supabase `pg_cron` | SQL/Funktions-/HTTP-Jobs laufen als Datenbankmodul [2] | Kein neuer externer Scheduleranbieter nötig; vorhandene Kapazität und eventuelle Mehrnutzung prüfen. Exakt null Zusatzkosten nicht belegt. |
| Klassische Vercel Cron Jobs | Scheduler im Tarif enthalten; normale Functions-Nutzung. Hobby täglich, Pro/Enterprise minütlich; nur Production [3] | Bestehendes Pro bestätigt. Mögliche Alternative, aber kein bereits geprüfter Ersatz des vorgesehenen pg_cron-Anschlusses. |
| Neue Vercel Schedules | Seit 5.11.2026 Preview möglich; Pro/Enterprise ab 5 USD/1 Mio. Runs plus 10 USD/1 Mio. Erstellungen, Function-Nutzung zusätzlich [4] | Keine Aktivierung ohne Kostenfreigabe. Bei fünf Minuten rechnerisch 8.640 Runs/30 Tage ≈ 0,043 USD reine Schedule-Runs; keine Gesamtprognose. |
| #1198 | Laut PR keine neue kostenpflichtige Infrastruktur; zusätzliche kleine Datenbankzeilen | Keine Tarif-/Provideränderung erforderlich; tatsächliche Nutzung bleibt Teil der bestehenden Rechnung. |

Vercel- und Supabase-Pro sind lesend bestätigt. Vercel-Billing belegt bereits nutzungsabhängige Build-/Function-Posten; eine Tageslesung ist keine CH→DE-Kostenprognose und keine Monatsrechnung. Die vollständige Monatsabfrage überschritt das Connectorlimit. Konkrete Mehrnutzung, bestehende Freikontingente und Supabase-Kapazität sind noch nicht ausreichend belegt; kein verbindlicher Gesamtmehrpreis und keine Nullkosten-Zusage.
Freigabeumfang Kosten: bei tatsächlichem Transportbedarf das bestätigt deaktivierte Production-IPv4-Add-on zum angezeigten Betrag **4,00 USD/Monat pro Datenbank zzgl. Steuern**, stündlich mit 0,0055 USD abgerechnet, sowie ausdrücklich bezifferte Mehrnutzung nach Messung. Der Shared Pooler unterstützt IPv4 ohne dieses Add-on, ist aber kein bereits geprüfter Ersatz für den vorgesehenen direkten Transport. Keine neue KI-/Research-API, kein Tarifwechsel und keine Vercel-Schedules-Buchung vorgesehen; kein Tarif oder Add-on aktiviert.

## Rücknahme und Abschlussnachweis

- Bei Fehlern zuerst den Quellenzeitplan stoppen und die Veröffentlichung über den geprüften Sperr-/Widerrufspfad geschlossen halten; keine veraltete Antwort als aktuell anzeigen.
- Vorheriges Production-Deployment bereithalten. Ein App-Rollback entfernt keine Datenbankänderung; inkompatible Schemarücknahmen brauchen ein geprüftes eigenes Paket.
- Historie, Originale, Freigaben und unbekannte Ausgänge erhalten; kein Reset, keine rekonstruierte Authority und keine destruktive Recovery benutzter Pakete.
- Abschluss nur mit exaktem Production-Head, Installationsbelegen, eigenem Owner-/Methodenbeleg, echtem Quellen-/Publikationsnachweis, aktuellem BG1-Proof, Alarmtest, automatischem Folgezyklus und Besucher-Smokes.
- Im jetzigen Stand: Arbeits-/Releaseumfang und gelesene Voraussetzungen konkretisiert; Production-Zieltransport/-Installer, automatische Live-Abnahme, Installation, Kostenfreigabe und Production-Abnahme **offen**. Ein eigener Anschluss-PR ist möglich; kein Ready/Merge/Launch-PASS aus diesem Runbook.

## Quellen

1. [Supabase IPv4-Nutzung und Preis](https://supabase.com/docs/guides/platform/manage-your-usage/ipv4).
2. [Supabase Cron-Dokumentation](https://supabase.com/docs/guides/cron).
3. [Vercel Cron Jobs](https://vercel.com/docs/schedules/cron-jobs) und [Nutzung/Preise](https://vercel.com/docs/schedules/cron-jobs/usage-and-pricing).
4. [Vercel Schedules: öffentliche Beta vom 5.11.2026](https://vercel.com/changelog/vercel-schedules-is-now-in-public-beta).
5. [Dev-Recovery-/Installationshandoff](OFFICIAL_TRUTH_DEV_GUARD_RECOVERY_1_HANDOFF_2026-11-14.md), [Owner-Import-Handoff](OFFICIAL_TRUTH_DEV_OWNER_IMPORT_1_HANDOFF_2026-11-13.md), aktuelle PRs #1197/#1198 und die oben benannten Quelldateien. Historische Handoff-Abschnitte verlieren bei neuerer Live-Evidence ihren Status als aktueller Stand.
6. Live-Metadaten: Supabase `get_project`, `get_organization` und nur lesende `pg_namespace`-/`pg_roles`-/`pg_extension`-/`cron.job`-/`vault.secrets`-/Migrationsabfragen; Vercel `get_project`, `get_git_deployment_context`, `filter_project_envs(decrypt=false)` und `list_billing_charges`; GitHub `fetch_pr`, `fetch_commit_workflow_runs`, `fetch_workflow_run_jobs`. [Production-Projekt](https://supabase.com/dashboard/project/qscbgcdmivbbnzrcyegn), [Vercel-Projekt](https://vercel.com/jetnity-e1b93c82/jetnity-app), [CI #1198](https://github.com/Jetnity/jetnity/actions/runs/43502391436).
7. Root-Readback im Cloud-Browser, 14.11.2026 um 22:02 UTC, nur Navigation: [Supabase main PRODUCTION → Settings → Add-ons](https://supabase.com/dashboard/project/qscbgcdmivbbnzrcyegn/settings/addons). Dedicated IPv4 `DISABLED`; Micro, 1 GB RAM, 8 GB Disk, Spend Cap aktiv, keine Read Replicas. Detailpanel: `No IPv4 address` ausgewählt, Dedicated IPv4 **$4.00 / month / database**, Steuern zusätzlich, Confirm deaktiviert; anschließend Cancel. Keine Einstellung oder Kostenoption geändert.
