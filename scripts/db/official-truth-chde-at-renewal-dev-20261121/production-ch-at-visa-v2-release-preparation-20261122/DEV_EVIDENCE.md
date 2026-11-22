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

**Zwischenstand dieser Datei: `PENDING_NATURAL_BG1_AND_CRON_RENEWAL`; erst mit echten Nachweisen aktualisieren.**
