# CH→AT — gebündelter Go-Scope nach bestehendem Production-V1-Parent

**STATUS: `CHIEF_OF_STAFF_REVIEW_READY / INSTALL_GO_HOLD`.** Das bisherige Production-Katalog-Lese-Go ist verbraucht; der erfolgreiche Read vom **22.11.2026 21:03:32 UTC** wurde bereits auf dem bestehenden Production-V1-Baum gesichert. Kein weiterer Production-Read und keine Production-Mutation durch diesen Paketbau.

**Chief of Staff prüft zunächst offline:** Exakt dieselben Quell-/Methoden-/BG1-V1-Parentdefinitionen, die tatsächlichen Versionen in `CATALOG-READBACK.json`, alle **neu zu berechnenden** SHA-256 in `MANIFEST.json` und `SHA256SUMS`; Dev-Testfälle 60–63 und die neuen vollintegrierten V1/BG1-Shadow-Gates 64–66 (native Dev-PG17 PASS; synthetische BG1-Belege), die weiterhin notwendige unveränderte Production-Probe-ROLLBACK-Abnahme, Postcommit-RPC, Rollback und unveränderte HTTP-v4-/CH→DE-Historie.

**Installations-GO darf erst auf den freigegebenen exakten vollständigen Paketstand folgen.** Wenn alle Tests grün sind, muss der Product Owner ausdrücklich *einen* atomaren Production-V1-Installationsversuch anhand der Dateinamen und **vollen SHA-256** freigeben. Die Reihenfolge ist:
1. Exakte Production-Zielauswahl `qscbgcdmivbbnzrcyegn`, Parent/Drift und natürliche BG1-/Source-Freshness im `$pre$` prüfen; `30-PRODUCTION-V1-V2.PROBE-ROLLBACK.sql` ist ein **eigener** zu bewilligender Prod-Schritt mit `ROLLBACK`.
2. Nur bei erfolgreich dokumentierter Proof-Abnahme und neuem Installations-Go `31-PRODUCTION-V1-V2.INSTALL-COMMIT.sql` genau einmal, ohne Retry bei unklarem Zustand.
3. Danach nur mit separater Nachlesefreigabe `40-PRODUCTION-POSTCOMMIT.READONLY.sql`; vollständige Funktions-, Objekt-, ACL-/RLS-/Katalog-/Zeitbelege; echter natürlicher BG1-Vollproof. Zunächst `unavailable`, kein Positiv-Fakt ohne Rev2.
4. Echte **neue** Production Owner/AAL2-MA1-Revisionsfreigabe (Rev2; separate Admin-UI-Paket-/Featureflag-Abnahme und echter Head-Vorgänger), keine Kopie der Dev-Owner-Methode. Erst danach natürliche amtliche Beobachtung und automatische Faktversion, anschliessend gesondert freigegebenes `50-PRODUCTION-VISITOR-READBACK.ROLLBACK.sql` unter `anon` und Browserprüfung.
5. Separate `32` Rücknahmeprobe/`33` Rücknahme-COMMIT nur nach eigener Freigabe; immer fail-closed und ohne Löschen der alten Quellen-/Faktenhistorie.

**Nicht Teil dieses Go:** CH→DE Cycle12-Abschluss oder Wiederanlauf, neue Schlüssel/Kosten/Rollen/ACL für direkten DB-Zugang, Production-Vercel-Featureflag/Deploy ohne eigenes Go, Login/2FA/Passkeys durch KI oder Cursor. Quelle BMEIA bleibt `changed` mit exakt beglaubigtem neuem Rohhash; nur Schweiz/Österreich/gewöhnlicher gültiger CH-Pass/direkte Visumfreiheit positiv. Die übrigen 49 Pässe und alle anderen Themen bleiben gesperrt.


## Neues separates Go nach P7905-STOP

Die Production-Probe `30` aus dem alten Manifest wurde **vor DDL** wegen einer zu strengen historischen BMEIA-Roh-SHA-Bindung gestoppt; **31/40/50/32/33 nicht ausgeführt**. Das neue einmalig autorisierte Production-READ-ONLY (23.11.2026 00:17 Uhr Zürich) belegte: **2/3 Raw-SHA-gleiche Originale, aber 3/3 korrekt unveränderte Source-/Research-Statusfälle und 3/3 exakte Crons**. Nur `30`/`31`-Quellprädikat auf die bereits alte V1-Canonical-19-Asset-Methode korrigiert, alle übrigen historischen und BG1-/Owner-/HTTP-ID-Gates unverändert. Re-PG17-Tests `67`, `65`, `66` erfolgreich; kein Production-Write.

**Frühere Production-Gos sind vollständig verbraucht.** Vor einem neuen Installations-Go zwingend: neue `MANIFEST.json`-`SHA256SUMS` und vollständige SHA-256 aller veränderten Dateien, erneute unabhängige CoS-Prüfung des engen P7905-Fixes, neu ausdrücklich freigegebenes `30`-Production-PROBEREAD/ROLLBACK und **erst bei PASS** ein neues exaktes `31`-COMMIT-Go. Auch dann Owner/AAL2 und Anzeige-Deploy separat, CH→DE unverändert.
