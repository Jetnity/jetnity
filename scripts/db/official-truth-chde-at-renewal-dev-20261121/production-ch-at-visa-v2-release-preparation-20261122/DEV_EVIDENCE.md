# CH→AT-Dev-Abnahme — getrennte Fakten und offene Zeitgrenze

**Nur Dev `yfvbxvijcorffwxbxahl`. Keine Production-Tests oder -Writes.**

## Nachgewiesen

- Echte Dev-Owner/AAL2-Vorgänge **Stage** 22.11.2026 18:51:22 UTC und **Approve** 18:51:51 UTC für `jetnity-destination-primary-at-visa`, Revision2, Epoch2, `status=approved`, `until_revoked`. MethodDigest `fe161a865c50d26be4a41c1b122fcd14efb3b39bc9100fd66b13304dfca07a4e`, PackageDigest `6584d20adcc08e94edc4a74cad6c780b6db9c7ce89fff8e89afb0d23380e27a0`.
- Drei Dev-Originale unverändert präzise verifiziert, BMEIA neue 172428-Byte-Fassung ausdrücklich `changed` und nur für CH→AT-Visum fachlich regelneutral; BMI 498415/91655 Bytes `unchanged_exact`. Ältere Originale weiterhin append-only `RESEARCH_ONLY`.
- **Fremdpass-Negativtest im echten Dev-PostgREST-`anon`-Rollenvertrag** unter normalem `BEGIN/ROLLBACK`: 10 Fälle `IN, DE, US, TR, CN, FR, IT, AT, ZZ, ''` zweimal über bestehende und neue RPC geprüft. Alle `unavailable`; keine neuen Rechte oder Mutation. Der positive CH-Browserbefund wurde vom Inhaber am 22.11.2026 um 20:08 Zürich visuell bestätigt.
- Dev-BG1 v9/v10/v11 sowie der neue v12-Nachfolger: `dev-at-ch-v12-natural-renewal.REHEARSAL-ROLLBACK.sql` bestand echte native PG17-Probe. `dev-at-ch-v12-natural-renewal.INSTALL-COMMIT.sql` wurde in **Dev**, nicht Production, dauerhaft installiert, mit unabhängigem kataloggenauen Readback; `seal_at_v1` archiviert weiterhin `changed`, lässt aber nur die separat qualifizierte CH/AT-Visum-Regel über den engen v4-Issuer verlängern.
- Vor v12 hatte die natürliche Quelle Batch135 (watch 22.11. 18:05 UTC) genau einen CH-positiven Dev-Fakt erzeugt; nach neuer natürlich versiegelter Quelle Batch136 (watch 19:00 UTC, sealed 19:02 UTC) fehlte eine zweite Faktversion. Das war der reproduzierte Automatik-Block, der mit v12 gezielt korrigiert wurde.

## Noch erforderlicher strenger Zeitbeleg

- Nach dem v12-Installationscutoff **22.11.2026 19:16:16.782636 UTC** muss der unveränderte Produktionsschutz ausschließlich in Dev mit einem **natürlich durch pg_cron** ausgeführten BG1-Vollbeleg **Generation ≥2413** den neuen Katalog akzeptieren (erwarteter planmässiger Due-Slot **19:20 UTC / 20:20 Zürich**). Keine manuelle Audit-Freigabe.
- Danach muss der bereits existente natürliche AT-Cron `jetnity-source-renew-at-dev-v1` ohne interaktiven Funktionsaufruf die archivierte `changed`-Batch136 nachprüfen und **eine neue Faktversion** schreiben (nächster passender Slot **19:22 UTC / 20:22 Zürich**). Fakt-Chron-Historie und Zeitpunkt separat belegen.
- Erst wenn die ursprüngliche Watch-Abrufzeit **18:05 UTC** mindestens 60 Minuten vor dem **neuen natürlichen** geprüften Quelle/Fakt-/Besucherbeleg liegt, und die echte `anon`-Auskunft CH `accepted` mit drei amtlichen URLs zeigt, dürfen wir einen *>1h-Natural-Renewal-PASS* ausweisen. IN/DE und andere unqualifizierte Pässe müssen weiter `unavailable` bleiben.
- Eine erzwungene manuelle Prozedur, ein synthetisches Datum oder ein grüner zeitlich abgelaufener Cache zählen ausdrücklich **nicht** als natürlicher Langzeitnachweis.

## Tatsächlicher natürlicher Nachtest — 22.11.2026 19:22 UTC

**PASS für die natürliche *erneute* Quellen-/Faktprüfung nach 77 Minuten; keine Behauptung durchgehend verfügbarer >60 Minuten.**

- BG1 `generation=2413`, natürlicher `last_proof_started=2026-11-22T19:20:00.164033Z`, also **nach** v12-Installations-Cutoff `19:16:16.782636Z`, mit `incident_generation=resumed_generation=14` und Katalogv12 exakt gleich. Kein manuelles Audit.
- Original-Quellenbeobachtung: Batch135 `source_checked_at=2026-11-22T18:05:00.224517Z`; erster automatisch qualifizierter CH-Dev-Fakt Id1 unter Owner-Methode Revision2/Epoch2, `verified_at=18:54:17.252283Z` und `expires_at=19:15:00.224517Z`. Dieser Fakt war **vor dem v12-Proof** abgelaufen.
- Nachfolgenden natürlichen Watch-Batch136 beobachtete der echte Collector `source_checked_at=2026-11-22T19:00:00.281082Z`; `seal_at=19:02:03.019413Z` mit Outcome **`changed`**, die 3 Original-SHA/Bytes entsprechen exakt den fachlich zugelassenen Quellenversionen.
- Der bestehende, unveränderte Cronjob `jetnity-source-renew-at-dev-v1` wurde **natürlich** mit Run `25558` am `2026-11-22T19:22:00.082494Z` gestartet, endete `19:22:05.430103Z` mit `status=succeeded`; kein manueller Funktions-/Cron-Aufruf erfolgte.
- Neue unveränderliche Faktversion **Id2, Batch136**, `verified_at=2026-11-22T19:22:03.243300Z`, `source_checked_at=19:00:00.281082Z`, `expires_at=20:10:00.281082Z`. Seit dem ersten Quellen-Check liegen **77 Minuten und 3 Sekunden**; der neue Fakt wurde automatisch durch den echten Cron erzeugt, nicht durch einen Simulator.
- **Echter `anon`-Dev-Readback unmittelbar danach:** `public.jetnity_source_bound_at_visa_v1('CH')` und die enge V4-Funktion liefern `status=accepted`, `visaEffect=not_required`, RuleVersion2 und drei erlaubte amtliche Links. 10 echte Fremd-/Ungültig-Passfälle `IN,DE,US,TR,CN,FR,IT,AT,ZZ,''` geben in beiden APIs ausnahmslos `unavailable`. Abschluss transaktional `ROLLBACK`, keine neuen Rechte.
- **Transparenter Verfügbarkeitsvorbehalt:** Zwischen `19:15:00.224517Z` (Ablauf Fakt1) und `19:22:03.243300Z` (Fakt2) gab es durch den einmaligen Dev-v12-Installations-/BG1-Wechsel **rund sieben Minuten** ohne Positiv-Fakt. Der vorliegende Beleg zeigt **erneute automatische Verfügbarkeit nach mehr als einer Stunde**, nicht hundertprozentig ununterbrochene Sichtbarkeit über die gesamte Stunde. Für diesen strengeren Nachweis braucht es eine neue natürliche Beobachtung **frühestens 22.11.2026, 20:22:04 UTC / 21:22:04 Zürich**, idealerweise nach einem weiteren automatischen Source-Batch ohne Gültigkeitslücke.
- Kein Production-Read, kein Production-Commit, keine neue Owner/AAL2-Handlung, keine Publikation in Production. Für ein Live-Go bleibt der separate aktuelle Production-Katalogread mit neuem eigenen Go erforderlich.

**Ergebnis: `NATURAL_AFTER_77_MINUTES_PASS; UNINTERRUPTED_60_MINUTES_NOT_YET_PROVEN`.**

**Nächster rein lesender Dauercheck:** Ein einmaliger Dev-only-Nachtest ist für **22.11.2026, 21:25 Zürich / 20:25 UTC** angelegt (Automation `6b03413fe09c8191976840973c4c9ec4`). Er darf weder Production abfragen noch Fakten/Methoden oder BG1 verändern. Er prüft, ob nach mindestens einer Stunde seit Fakt2 die Quellen- und Fakt-Historie ohne neue Lücke fortgelaufen ist und die echte `anon`-Kundenausgabe weiterhin korrekt ist.
