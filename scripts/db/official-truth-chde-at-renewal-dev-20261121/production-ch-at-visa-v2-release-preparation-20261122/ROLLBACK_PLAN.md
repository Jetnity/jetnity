# CH→AT Production V1/V2 — geschützter, historienerhaltender Rücknahmeplan

**PREPARED FOR CHIEF-OF-STAFF REVIEW / kein Production-Go.** Die V1-Production-Struktur und alte BG1-HTTP-v4-Baseline wurden über den einzigen bewilligten Katalog-READONLY vom **22.11.2026 21:03:32.563156 UTC** gebunden. Keine Production-Installation, Probe oder Rücknahme wurde ausgeführt.

## Prä- und Post-COMMIT-Gates

- `32-PRODUCTION-V1-V2.ROLLBACK-PROBE.sql` und `33-PRODUCTION-V1-V2.ROLLBACK-COMMIT.sql` sind eigenständige, identisch gebundene SQL-Pfade mit `ROLLBACK` bzw. `COMMIT`. Beide prüfen `postgres`, PG17, exakte Projekt-Zuordnung (auch externe Zielauswahl), v5 vorhanden/v6 abwesend, aktueller Schutzkatalog, eine **zusätzliche** aktive V2-Renew-Cron, drei Quellen und geeignete Locks. Jede Abweichung stoppt die Transaktion; keine Wiederholung bei unklarem Ausgang.
- Bei Rücknahme wird **ausschliesslich die neue V2-Cron unscheduled**; die drei bisherigen Source-Crons sowie sämtliche V1-Originale, V1-Visa-Fakten, V2-Originale, V2-Fakten, Quellenbelege und MA1-Owner-Quittungen bleiben erhalten. Bestehende CH→DE-Jobs, Dispatches 38–46, Provider, Rollen, HTTP-ID-v4-Allocator/IDs und andere Länder werden nicht berührt.
- Die **bestehende öffentliche V1-Visumfunktion** wird als streng fail-closed Version ersetzt: CH und alle Fremdpässe liefern `unavailable`, selbst wenn ein altes Rev1- oder Rev2-Methodenrecht existiert. Die neue private V2-Issuerfunktion sperrt nach vorhandenem `bg1_prod_ch_at_rollback_v6` ebenfalls jeden weiteren Faktimport.
- Ein **neuer RLS-geschützter BG1-v6-Nachfolger** bindet den eingefrorenen v5-Baseline-Digest und den neuen geschützten Katalog, verlangt eine zusätzliche natürliche Vollproof-Generation nach `proof_not_before`. Wie v5 ist die V6-Baseline nach genau einer atomaren Kataloginitialisierung gegen UPDATE/DELETE/TRUNCATE geschützt.
- Nach `ROLLBACK-PROBE.sql` muss durch identische erwartete SHA-256 und unabhängigen Diff-/PG17-/Chief-Review belegt sein, dass die echte Rücknahme fehlerfrei auszuführen wäre. **Ein Production-Rollback-COMMIT erfordert seine eigene explizite Go-Zielbindung** und wird in diesem Auftrag nicht ausgeführt.

## Bei Fehlern/Abbruch

- Fehlschlag vor `COMMIT`: Eine einzelne nicht bestätigte Transaktion ist kein Beleg für ausgeführtes COMMIT; bei Verbindungsunterbruch **keinen Write wiederholen**, sondern mit eigenem neuen Lese-Go gegen den tatsächlich vorhandenen v5/v6-Katalog und faktischen Cronstatus lesen.
- Wenn Installations-SQL aufgrund Source-, BG1- oder Rollenabweichung nicht durchgeht, bleibt Production unverändert und CH→AT weiterhin `derzeit nicht verfügbar`.
- Nach erfolgter V2-Live-Aktivierung darf keine Originalversion oder Faktversion gelöscht oder umgeschrieben werden; Rücknahme ist ein **append-only Sperrnachfolger**, nicht ein historienverändernder „Restore“.
- Ein Widerruf der Owner-Methode ist **eine andere echte Owner/AAL2-Aktion**. Die V6-Rücknahme stellt bewusst zunächst nur die öffentliche Ausgabe fail-closed; sie darf keine fremde MFA/Owner-Operation simulieren.

## Abnahmebelege

- Nativer Dev-PG17-V1-Fixture-Test: `60` Quelle/positiver CH-Fakt/10-passartige negative, SHA-Change-Sperre/immutable `ROLLBACK` **PASS**.
- Nativer Dev-PG17-Rollback-Fixture-Test: `61` positive Ausstellung, sofortige CH-/Fremdpass-Sperre, V2-Cron entfernt, V1-Crons/Quellen/Fakten erhalten, v6-Predecessor-Digest und `ROLLBACK` **PASS**.
- PG17-Compile-Test `62` für v5/v6-Guard-Funktionen und Test `63` für zwei Bootstrap-Baselines, vier verweigerte Nachmanipulationen **PASS**.
- **Neuer Dev-Nachweis:** `66-DEV-PROD-V1-V4-V5-V6-FULL.REHEARSAL-ROLLBACK.sql` hat den zusammenhängenden vollständigen **V1/BG1-Schatten-Installations-/Rücknahmetest** nativ in Dev-PG17 bestanden, einschliesslich echter amtlicher Dev-Originalbytes, positivem CH-Fakt, erzwungener 5-Minuten-BG1-Frische im synthetischen State, abgelehntem manipuliertem Cron, unveränderlicher historischer Quelle und fail-closed V6-Rücknahme. **Offen:** unveränderte Production-Probe gegen tatsächliche Production-V1/BG1-v4-OIDs/Source-/Cron-/Katalog-Wahrheit, unabhängige CoS-Review, installierte Production Owner/AAL2-Rev2-UI-Gates und Production-Readback (nur nach eigenem Go). Dieser Plan ist mit den zugehörigen Hashes Chief-of-Staff-prüffähig, **nicht automatisch Production-installationsreif**.


## Rücknahmeplanung nach P7905-Fix

Die neue Production-Probe hat **vor der ersten DDL** verweigert, also wurde **keine** Version v5 installiert und **keine** Rücknahme ausgeführt. Das eine Product-Owner-READ-ONLY zur Ursachenbestimmung hat die Daten nicht verändert. Die alte geprüfte V6-Rücknahme `32/33` bleibt inhaltlich und SHA-256 **identisch**; sie ist nur für den Fall einer *später tatsächlich per neuem Go installierten* V5-Version vorgesehen und darf jetzt nicht ausgeführt werden. Neue 30/31-Hashes und das erneut bestandene native Dev-BG1-V1-Schattenmodell sind dem CoS zur eigenen Prüfung vorzulegen. Bei jedem künftigen Source-/Cron-/BG1-Drift erneut STOP; kein stilles Retry oder Lockerung des Canonical-/Asset-Prädikats.
