# CH→AT — gebündelter Go-Scope nach bestehendem Production-V1-Parent

**STATUS: `CHIEF_OF_STAFF_REVIEW_READY / INSTALL_GO_HOLD`.** Das bisherige Production-Katalog-Lese-Go ist verbraucht; der erfolgreiche Read vom **22.11.2026 21:03:32 UTC** wurde bereits auf dem bestehenden Production-V1-Baum gesichert. Kein weiterer Production-Read und keine Production-Mutation durch diesen Paketbau.

**Chief of Staff prüft zunächst offline:** Exakt dieselben Quell-/Methoden-/BG1-V1-Parentdefinitionen, die tatsächlichen Versionen in `CATALOG-READBACK.json`, alle **neu zu berechnenden** SHA-256 in `MANIFEST.json` und `SHA256SUMS`; Dev-Testfälle 60–63, die noch offenen nativen Gesamtguard-Gates, Postcommit-RPC, Rollback und unveränderte HTTP-v4-/CH→DE-Historie.

**Installations-GO darf erst auf den freigegebenen exakten vollständigen Paketstand folgen.** Wenn alle Tests grün sind, muss der Product Owner ausdrücklich *einen* atomaren Production-V1-Installationsversuch anhand der Dateinamen und **vollen SHA-256** freigeben. Die Reihenfolge ist:
1. Exakte Production-Zielauswahl `qscbgcdmivbbnzrcyegn`, Parent/Drift und natürliche BG1-/Source-Freshness im `$pre$` prüfen; `30-PRODUCTION-V1-V2.PROBE-ROLLBACK.sql` ist ein **eigener** zu bewilligender Prod-Schritt mit `ROLLBACK`.
2. Nur bei erfolgreich dokumentierter Proof-Abnahme und neuem Installations-Go `31-PRODUCTION-V1-V2.INSTALL-COMMIT.sql` genau einmal, ohne Retry bei unklarem Zustand.
3. Danach nur mit separater Nachlesefreigabe `40-PRODUCTION-POSTCOMMIT.READONLY.sql`; vollständige Funktions-, Objekt-, ACL-/RLS-/Katalog-/Zeitbelege; echter natürlicher BG1-Vollproof. Zunächst `unavailable`, kein Positiv-Fakt ohne Rev2.
4. Echte **neue** Production Owner/AAL2-MA1-Revisionsfreigabe (Rev2; separate Admin-UI-Paket-/Featureflag-Abnahme und echter Head-Vorgänger), keine Kopie der Dev-Owner-Methode. Erst danach natürliche amtliche Beobachtung und automatische Faktversion, anschliessend gesondert freigegebenes `50-PRODUCTION-VISITOR-READBACK.ROLLBACK.sql` unter `anon` und Browserprüfung.
5. Separate `32` Rücknahmeprobe/`33` Rücknahme-COMMIT nur nach eigener Freigabe; immer fail-closed und ohne Löschen der alten Quellen-/Faktenhistorie.

**Nicht Teil dieses Go:** CH→DE Cycle12-Abschluss oder Wiederanlauf, neue Schlüssel/Kosten/Rollen/ACL für direkten DB-Zugang, Production-Vercel-Featureflag/Deploy ohne eigenes Go, Login/2FA/Passkeys durch KI oder Cursor. Quelle BMEIA bleibt `changed` mit exakt beglaubigtem neuem Rohhash; nur Schweiz/Österreich/gewöhnlicher gültiger CH-Pass/direkte Visumfreiheit positiv. Die übrigen 49 Pässe und alle anderen Themen bleiben gesperrt.
