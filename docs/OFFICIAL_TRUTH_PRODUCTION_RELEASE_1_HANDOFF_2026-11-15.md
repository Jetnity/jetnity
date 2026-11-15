# CH→DE Production Release 1 — Freigabe und Übergabe

**Stand 15.11.2026: PREPARED / UNAPPLIED.** Production wurde nicht installiert,
kein Merge und kein kostenpflichtiges Add-on ausgeführt. Die Freigabe gilt erst
nach dem von Root in [#1197](https://github.com/Jetnity/jetnity/pull/1197)
belegten vollständigen grünen CI-Lauf auf dem endgültigen Head, unabhängigem
Review und erneuter Dev-Abnahme. Die tatsächliche Production-Abnahme erfolgt
anschließend im genehmigten Release. Die 206 Ziele bleiben `RESEARCH_ONLY`.

## Einmalige Freigabe durch Sasa

1. **#1197 zuerst als Merge-Commit mergen** und den geprüften Stand nach Production deployen.
   Der temporäre Dev-Buildhook und sein Importer-Permit müssen entfernt sein.
   Alle 38 Commits von #1196 sind in #1197 enthalten: #1196 nicht zusätzlich
   mergen, erst nach dem Merge von #1197 als ersetzt schließen.
2. **Eigenes Production-Paket auf `qscbgcdmivbbnzrcyegn` ausführen:** feste
   Vorprüfung, Provider/Sender/Monitor, atomarer Kern einschließlich echtem
   BG1-Erstaudit, sechs eigene begrenzte Login-Secrets und separater HMAC-Schlüssel.
   Vor PAI/BG1 gehört der unten gebundene einmalige erste Production-Owner dazu.
   Kein Dev-Receipt und keine Dev-Historie werden übertragen.
3. **Production-Ownerfreigabe und normalen Erstimport durchführen:** wir bedienen
   den Cloud-Browser; Sasa wird nur für Anmeldung oder 2FA benötigt. Die reale
   Production-Owner-/AAL2-Sitzung gibt die Methode frei. Anschließend CH→DE über
   den normalen Quellenlauf veröffentlichen und öffentlich auf jetnity.com prüfen.
4. **40-Minuten-Plan, Überwachung und Alarmprobe aktivieren und abnehmen:** erster
   automatischer Import, nächste Fälligkeit vor Ablauf, regulärer BG1-Folgeproof,
   unabhängiger Monitor sowie tatsächlich empfangene Actions-Fehlerbenachrichtigung;
   danach wieder grüner Monitor. Der unten beschriebene Stop-/Rückrollweg gehört dazu.
5. **Beschriebene Nutzung der bestehenden Tarife freigeben; IPv4 nur bei belegtem
   Bedarf des festen Direktzugangs:** 0,0055 USD/Stunde, ungefähr 4 USD/Monat
   zuzüglich Steuern, außerhalb des Spend Cap. Kein anderer neuer Tarif oder
   kostenpflichtiges Add-on. #1198 bleibt ein separater späterer Auftrag nach #1197
   und der CH→DE-Production-Priorität.

## Ausführungsreihenfolge und belegte Artefakte

Maßgeblich sind die Dateien desselben freigegebenen Commits und das
[Production-Manifest](../scripts/official-truth-product-v3-production/manifest.json).
Vor Ausführung `node scripts/official-truth-product-v3-production/build.mjs --check`
erfolgreich prüfen. Ein Ziel-GUC bestätigt nur die bewusste Auswahl; er beweist
keine Serveridentität. Connector/Projekt, festes TLS-Hostname/CA, PG17 sowie die
sechs tatsächlichen LOGIN-Verträge einschließlich `CONNECTION LIMIT 2` prüfen.

| Reihenfolge | Konkreter Schritt | Abnahmekriterium |
| --- | --- | --- |
| 1 | [preflight.sql](../scripts/official-truth-product-v3-production/preflight.sql) nach eigenständigem Projekt-/Host-Readback | Fester unbenutzter Production-Kern, ursprüngliche Rollen/Auth/Profile; bei Abweichung stoppen |
| 1a | [Ersten Production-Owner gebunden vorbereiten und ausführen](https://github.com/Jetnity/jetnity/pull/1197#issuecomment-6887733836), Originalreadback, unveränderten Preflight wiederholen | Tatsächlich angemeldetes vorhandenes Production-Konto, genau sein aktives Adminprofil und eigener verifizierter MFA-Faktor; einmaliger CAS vor PAI/BG1, keine erzeugten Auth-Claims; gültige AAL2 bleibt separat erforderlich |
| 2 | Scheduler [provider-prerequisites.sql](../scripts/db/official-truth-v3-production-import-schedule-1/provider-prerequisites.sql) | pg_net 0.19.5; vorhandene pg_cron 1.6.4, Vault 0.3.1 und pgcrypto 1.3 bleiben erhalten |
| 3 | Scheduler `core.sql` + `monitoring.sql` in einer Transaktion, gemäß [Scheduler-README](../scripts/db/official-truth-v3-production-import-schedule-1/README.md) | Sender deaktiviert, Monitor-ACL **vor** BG1-Baseline installiert |
| 4 | [install-and-start-guard.sql](../scripts/db/official-truth-v3-production-install-1/install-and-start-guard.sql) | PAI → Logins → PG1/HMA/HS/HMT → **HRS vor HM04** → SET-Kanten → frischer BG1/Status/rollierende Quote; BG-Cron und echter Erstaudit atomar |
| 5 | [configure-credentials.sql](../scripts/official-truth-product-v3-production/configure-credentials.sql), sechs ENV-Namen aus dem Manifest; `JETNITY_PROD_IMPORT_CRON_SECRET`/Vault `jetnity_prod_import_cron_v1` | Eigene Production-Werte ausschließlich in Production-Scope; keine Werte in Git/PR/Logs; reale TLS-/Login-Abnahme |
| 6 | [verify.sql](../scripts/official-truth-product-v3-production/verify.sql), normale Owner-/Methoden- und Importoberfläche | Eigene AAL2-Freigabe; echte aktuelle AA-/Bern-Quellen; akzeptierte öffentliche CH→DE-Projektion |
| 7 | Scheduler [activate.sql](../scripts/db/official-truth-v3-production-import-schedule-1/activate.sql), [readback.sql](../scripts/db/official-truth-v3-production-import-schedule-1/readback.sql) | Cron `jetnity-ch-de-prod-import-v1` aktiv; erster automatischer Zyklus publiziert; nächste Fälligkeit vor Projektionsablauf |
| 8 | [Monitor-Workflow](../.github/workflows/official-truth-production-import-monitor.yml) mit explizitem Repository-Gate aktivieren | `JETNITY_PRODUCTION_IMPORT_MONITOR=production:qscbgcdmivbbnzrcyegn:enabled-v1`; eigener öffentlicher Key in `JETNITY_PROD_SUPABASE_PUBLISHABLE_KEY`; gültige Projektion mit mindestens 15 Minuten Restlaufzeit |
| 9 | `workflow_dispatch` mit `alarm_delivery_probe=true`, danach normaler Prüflauf | Beabsichtigter Fehler wird im bestehenden Actions-Benachrichtigungskanal tatsächlich empfangen; anschließend echter grüner Status |

Die technische Anleitung und sechs ENV-/Login-Zuordnungen stehen vollständig im
[Installer-README](../scripts/official-truth-product-v3-production/README.md).
Der Merge allein installiert und genehmigt nichts. Die normalen Original-IDs
bleiben bei Resume/unklarer Antwort erhalten; kein Ersatzlauf, Counterreset oder
Fristpatch. Ohne Installation/Freigabe bzw. bei Widerruf bleibt Production geschlossen.

### Vollständige Kundenangaben im vorbereiteten Installer

Das weiterhin **UNAPPLIED** frische Production-Paket enthält dieselben sechs
geschlossenen Kundenvalidatoren wie der neue Dev-Nachfolger sowie dessen separat
gepinnten, begrenzten History-Memo. Kontextrevision 3 unterscheidet fachliche
Themen und stabile Items; die bestehende V3-JSONB-Kette behält die vollständigen
Details. Der eigene frische Rolling-Baseline-Capture bindet diese Definitionen
vor dem ersten echten Audit. Er importiert keine Dev-Baseline oder Review.
Signaturen, Besitzer und Rechte bleiben erhalten; temporäre SET-Kanten für die
drei tatsächlichen Funktionsbesitzer werden in derselben Transaktion entfernt.

Der History-Nachfolger erhält beide direkten History-Prüfungen und den
vollständigen BG1-Seal eines autorisierten M04-Aufrufs. Der atomare Queue-Pfad
bündelt Claim sowie Enqueue/Complete/Fail in jeweils einer Transaktion mit drei
vollständigen History-Prüfungen im Ein-Subject-Vektor und drei echten
MA1-Beobachtungen innerhalb derselben ursprünglichen Fünf-Sekunden-Frist.
Er übernimmt die vollständigen ursprünglichen Jobprüfungen lokal und
verwendet ausschließlich identische, bereits geprüfte reine Ergebnisse innerhalb
desselben Aufrufs erneut. Die Jobmemo wird auf acht Einträge begrenzt; die
gemeinsamen 64 KiB für kanonische Werte und Knotenzählung bleiben erhalten.
Schnelle erfolgreiche Schlüsselprüfungen gelten nur für die exakt gebundenen
konstanten Feldlisten, mit ursprünglichem Fallback. Es gibt keinen persistierten
Freigabecache und keine Änderung von Quoten, fünf Sekunden oder Originalhistorie.
Der verpflichtende Kapazitätsnachweis gehört zur finalen CI und ersetzt keine
spätere echte Production-Abnahme nach der gemeinsamen Freigabe.

Der zusätzlich gepinnte BG1-Journalabgleich übernimmt ausschließlich einen
erfolgreichen Membership-Nachweis derselben vollständigen Bytes innerhalb
desselben Subjects und Aufrufs. Der einzelne Slot ist auf 64 KiB begrenzt.
Jeder Subjectwechsel verwirft ihn; die vollständige Chain-Prüfung, sämtliche
Zeilen, Locks, Methoden- und Intake-Prüfungen bleiben erhalten. Beide
Definitionen werden vor der frischen Production-Baseline installiert und
gehören zu deren vollständiger Katalogbindung.
Der bestehende Checker-Besitzer bleibt `ot_v3_jobs_owner`. Ausschließlich für
diese Ersetzung erhält er vorübergehend CREATE auf dem Guard-Schema; das Recht
wird sofort in derselben Transaktion zurückgenommen. Vollständige ursprüngliche
Schema-ACL und Rollenmitgliedschaften müssen danach exakt wiederhergestellt sein.

Die beiden neuen privaten Queue-Helfer behalten ausschließlich Owner-EXECUTE.
Wire- und API-Nachfolger behalten ihre bestehenden OIDs, Signaturen und Rechte.
Original-Confirm, tatsächlicher Read, unveränderte Transitionzweige, Rolling-CAS,
erneuter Confirm und vollständiger Schluss-Read bleiben erhalten. Jeder
unerwartete Befund nach CAS rollt die ganze Transaktion zurück. Terminale
Continuation, Token, S1-Originale, Lease und letzte tatsächliche MA1-Prüfung
bleiben zwingend. Historische Adapter behalten ihren alten Vertrag; der neue
Adapter wählt ausdrücklich eigene Executor-Funktionen und wechselt danach bei
Fehlern nicht auf einen Ersatzpfad. Die vollständigen Worker-/Replay-/Native-
Gates sind vor einer Freigabe verpflichtend; derzeit kein Production-PASS.

Die Besucheransicht zeigt alle 26 Themen samt Quelle/Stand und Reiseprüfhinweis.
Unbestätigte Angaben bleiben „Derzeit nicht verfügbar“. Die neuen Felder und
der reproduzierbare Quellenplan erteilen keine zusätzliche fachliche Freigabe:
die aktuelle amtliche Veröffentlichung bleibt an die geprüfte CH→DE-Visa-Methode
gebunden. Weitere Länder und Themen folgen ihrem eigenen Qualification-/Binding-
und Quellenlauf. Fristen und Quotas werden durch diese Erweiterung nicht erhöht.

## Erster Production-Owner als Teil derselben Freigabe

Die reine Production-Metadatenprüfung vom 15.11.2026 ergab kein Ownerprofil,
vier aktive Adminprofile und zwei Konten mit verifizierter MFA. Es wurde kein
Konto ausgewählt und nichts geschrieben. Die genaue einmalige Betreiberaktion
ist vollständig in [#1197, Artefakte 1/2](https://github.com/Jetnity/jetnity/pull/1197#issuecomment-6887733836)
und [Rückweg/Nachweis 2/2](https://github.com/Jetnity/jetnity/pull/1197#issuecomment-6887735479)
veröffentlicht: `bootstrap.sql`, `readback.sql`, `restore-admin.sql`, Manifest und
vollständige Bedienfolge. Sie ist separat mit echtem lokalem PostgreSQL17 geprüft:
26/26 PASS, keine Skips oder Abbrüche; sie ist kein Bestandteil von App-CI4251.

Nach der gemeinsamen Freigabe wird die echte Production-Anmeldung im Cloud-Browser
verwendet; nur Anmeldung oder 2FA erfordert Sasa. Das ausgewählte bestehende Konto,
sein tatsächliches Adminprofil und sein verifizierter eigener MFA-Faktor werden
gebunden. Eine vorhandene gültige AAL2-Sitzung wird weiterverwendet; andernfalls
wird der bestehende MFA-Weg durchlaufen. Der Wartungs-CAS ändert genau eine Rolle
von `admin` auf `owner` vor PAI/BG1. Identitäten, Trigger, Rechte, Auth-/MFA-/Sessiondaten
und alle anderen Profile bleiben unverändert. Der SQL-Readback bestätigt den
beobachteten Zustand und ersetzt keine aktuelle AAL2-Prüfung oder Methodenfreigabe.
Ein unbekannter Commitausgang wird zuerst gelesen, niemals automatisch wiederholt.

## Stop und Rückrollen

Bei unklarem Installations-Commit erst exakt lesen, nicht blind wiederholen.
Ein Fehler vor dem atomaren Kern-Commit nimmt auch BG-Cron und Erstproof zurück;
die vorherigen Provider-/deaktivierten Sendertransaktionen bleiben separat lesbar.
Nach Nutzung: [deactivate.sql](../scripts/db/official-truth-v3-production-import-schedule-1/deactivate.sql)
stoppt neue Dispatches. Bereits zugelassene Anfragen können noch abschließen.
Danach normale Production-Owner-/HMT-Widerrufsfunktion verwenden und ihre originale
Operation bestätigen; öffentlichen Fail-closed-Zustand abnehmen. BG1, originale
Jobs, offene/unklare Ergebnisse und sämtliche Historie bleiben erhalten.
Falls auch die einmalige Ownerrolle zurückgenommen werden soll, erst nach
bestätigtem Stop und Methodenwiderruf die gebundene `restore-admin.sql` verwenden.
Eine Demotion allein widerruft die Methode nicht; der Rückweg prüft diese Sperren.

Root hat für `jetnity.com` das Rückrollziel `dpl_88LzdqY5DUo8mQT9rLzji6apcZBJ`
mit Commit `63544e820e912bd275556588c956a09b99b1cf90` und URL
<https://jetnity-qhlf2ccij-jetnity-e1b93c82.vercel.app> per `get_alias` und
`list_deployments` gelesen. Vor späterer Ausführung erneut abgleichen und nach
geschlossenem Methodenpfad bei Bedarf dieses vorige App-Deployment wiederherstellen.
Kein Schema-Drop, Löschen von Belegen oder Rücksetzen der Lebenszeitzähler.

## Kosten und Sollnutzung

Rechenbasis: 30 Tage, eingeschalteter gesunder Regelbetrieb; zusätzliche manuelle
Prüfungen und begrenzte HTTP-Wiederholungen sind darin nicht enthalten.

| Nutzung | Sollmenge |
| --- | ---: |
| Neue Quellenzyklen alle 40 Minuten | 36/Tag; 1.080/30 Tage |
| Minütliche DB-Senderticks | 43.200/30 Tage |
| Zusätzliche BG1-Audits alle fünf Minuten | 8.640/30 Tage |
| Unabhängige Monitorläufe alle fünf Minuten | 8.640/30 Tage |
| Zwei reine HTTP-Leseprüfungen je Monitorlauf | 17.280/30 Tage |

Standard-GitHub-Runner sind in öffentlichen Repositories kostenlos; der Workflow
verlangt ausdrücklich öffentliches `Jetnity/jetnity` und `ubuntu-24.04`.
[GitHub-Primärquelle](https://docs.github.com/en/billing/concepts/product-billing/github-actions).
GitHub-Zeitplanung ist ein Sollrhythmus, kein Nachweis tatsächlich erfolgter Läufe.

IPv4 ist derzeit deaktiviert. Bei notwendigem Direktzugang nennt Supabase
**0,0055 USD/Stunde bzw. ungefähr 4 USD/Monat**; IPv4-Stunden liegen ausdrücklich
**außerhalb des Spend Cap**. [Preis und Abrechnung](https://supabase.com/docs/guides/platform/manage-your-usage/ipv4),
[Einsatzgrenze des Add-ons](https://supabase.com/docs/guides/platform/ipv4-address).

Bestehende Supabase-/Vercel-Tarife werden weiter genutzt. Datenvolumen, Speicher,
CPU-/Memory-Zeit und andere abrechenbare Nutzung bleiben verbrauchsabhängig;
die Sollmengen sind keine Nullkostengarantie. Vor zusätzlichen Tarif-/Kapazitäts-
oder Add-on-Änderungen ist eine weitere Kostenfreigabe erforderlich.
[Supabase-Preise](https://supabase.com/pricing),
[Spend-Cap-Grenzen](https://supabase.com/docs/guides/platform/cost-control),
[Vercel-Abrechnung](https://vercel.com/docs/pricing). Quellen am 15.11.2026 geprüft.
