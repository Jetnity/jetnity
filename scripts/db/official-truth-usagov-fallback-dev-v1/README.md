# USA: USAGov als amtliche Reserve-Quelle – Research-only V1

**Stand:** 19.11.2026, nur Supabase Development (`yfvbxvijcorffwxbxahl`). **Keine amtliche Freigabe, keine Production-Veröffentlichung und kein KI-Aufruf.**

## Tatsächlich untersuchtes Problem

Der vorhandene US-VWP-Quellenmonitor für die offiziell registrierte US-Department-of-State-Seite
`https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visa-waiver-program.html`
hat 26/26 Beobachtungen als `unavailable` gespeichert. Die zuletzt in Dev geprüfte echte `pg_net`-Antwort hatte **HTTP 403**. Griechenlands MFA-Seite hat ebenfalls 26/26 `unavailable` mit HTTP 403, wird **nicht** durch diesen US-spezifischen Schritt verändert.

Die **offizielle US-Bundesregierungsseite**
`https://www.usa.gov/visa-waiver-esta`
ist eine andere, eigenständige Behördenquelle zu Visa Waiver Program und ESTA. Sie wurde im Web als amtliche Primärquelle der USA geprüft. **Nur ein** ausdrücklich eingeschränkter, öffentlicher GET wurde in Supabase Dev abgesetzt. Das echte Ergebnis hatte **HTTP 200, text/html, 42'833 UTF-8-Bytes**, den bei der Quelle beobachteten VWP-/ESTA-Titel und SHA-256 `40f0bd8cf60b63b169218f790bcbb1c92d377ba96a11fdff639dbee72cb4de47`.

Wichtig: Ein erfolgreicher GET und eine gespeicherte Betreiber-Zuordnung sind **noch kein unabhängig kryptografisch attestierter Quellenursprung und erst recht keine bestätigte Einreiseregel**. Daher bleibt `source_custody_verified=false`; ein amtliches Foto/PDF, persönliches Passdokument, Reiseprofil oder ein allgemeines Visabefreiungsrecht wird nicht abgeleitet.

## Installation und technische Grenze

`install.sql` ist eine **einzige** Dev-only PG17-Transaktion mit exakter Zielkennung, BG1-Guard, PostgreSQL-`postgres`-Prüfung, `US`-50-Pass-/206×50-Research-Index, unverändertem ursprünglichen 11-Quellen-Monitor, unverändertem globalen 5-Minuten-Cron und einem einzigen bereits bekannten HTTP-Response-Beleg. Der Installer erstellt **ausschließlich** ein eigenes, privat gesperrtes, immutable Source-Sample und einen `security_invoker`-View:

- `jetnity_usagov_fallback_private.original_v1`: genau ein unveränderlicher Rohtext-Beleg mit fest gepinntem SHA, Größe, URL, HTTP-Status und archiviertem UTC-Zeitpunkt; keine automatische Erneuerung oder Nachladefunktion
- `jetnity_usagov_fallback_private.us_passport_review_v1`: 50 reine US-Recherchekombinationen; **jeder** Passfall bleibt `UNQUALIFIED_SOURCE_CANDIDATE`, `source_custody_verified=false`, `legal_rule_qualified=false`, `publication_allowed=false`, `accepted_fact_count=0`, `customer_answer='derzeit nicht verfügbar'`
- Erzwingt private Schema-Rechte, `FORCE ROW LEVEL SECURITY`, postgres-only, Trigger für UPDATE/DELETE/TRUNCATE, keine öffentlichen oder authenticated/anon/service_role-Reads. Keine Änderungen an Original-Monitoren, V3/MA1/BG1, bestehender Quellenhistorie oder Kundenantworten
- **Keine** weitere HTTP-Abfrage, kein Cron-Job, kein externer Schlüssel, keine neuen Provider oder bezahlte KI-Aufrufe, keine Mehrkostenbestellung

Dieses Verfahren erzeugt **nicht automatisch 50 bestätigte US-Rechtsfakten**. Es fügt lediglich einen nachgewiesen erreichbaren amtlichen Recherchekandidaten zur bereits existierenden Struktur hinzu.

## Belege und offene Schritte

Vor dem Installieren wurde der exakte SQL-Installer als echte **PG17-Transaktion mit ROLLBACK** ausgeführt: eine Quelle und 50 reine Rechercheeinträge, BG1 `current`. Nach der Dev-Installation müssen zuerst FORCED RLS und die vollständigen Original-SHA-/Byte-Werte, die unveränderten 11 bisherigen Quellen, 10'300 Research-Kombinationen, das unveränderte Cron und **0** neue positive Fakten rückgelesen werden; anschliessend den echten `native-negative-rollback.sql` ausführen, der UPDATE/DELETE/TRUNCATE verweigert und die Zeilen bewahrt.

Ein nachfolgender, eigener, sicherer Quellenmonitor muss künftig die öffentlich dokumentierte offizielle URL selbst dauerhaft registrieren, regelmäßig bei amtlichen Änderungen nachprüfen und die Quellenidentität und Editionsstände unabhängig beweisen, **bevor** das Material zur eigentlichen Rechtsqualifikation führen kann. Die ursprüngliche 403-Quelle wird weiterhin als nicht verfügbar geführt. Für **Griechenland** bleibt eine separate staatliche, nicht gesperrte Primärquelle erforderlich; europäische Schengen-Texte oder fremde Quellen gelten höchstens als Gegenprüfung.

**No merge, no Production, no neue Kosten, keine Owner-AAL2-Aktion.** Der PR wird nur in der normalen Abhängigkeitskette nach [#1228](https://github.com/Jetnity/jetnity/pull/1228), [#1236](https://github.com/Jetnity/jetnity/pull/1236) und [#1250](https://github.com/Jetnity/jetnity/pull/1250) zur späteren ausdrücklichen Owner-Freigabe gebracht.
