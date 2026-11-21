# Reiseideen: separater öffentlicher CMS-Leser

## Auftrag und Grenzen

Der Owner hat am 21. November 2026 die separate Korrektur der öffentlichen Reiseideen-Abfrage einschließlich Dev-Prüfung, eigenem PR, vollständiger grüner CI, Merge und Production-Auslieferung freigegeben. Der statische Ersatzkatalog bei Fehlern bleibt bestehen. Login, Zwei-Faktor-Anmeldung, Admin-Schreibschutz, Official-Truth-/BG1-Guard und Anbieter bleiben unverändert. Keine neuen Kosten, kein Upgrade und keine erneute Veröffentlichung der bereits freigegebenen Inhalte.

Parallel wird ausschließlich lesend die Ursache des Supabase-Ausfalls untersucht. 18:25 Uhr Zürich ist der belegte erfolgreiche BG1-Folgelauf, nicht ohne weiteren Nachweis der Zeitpunkt oder die Ursache eines Serverneustarts. Speicherknappheit darf nur mit belastbarer Ressourcen- oder Systemlog-Evidence als Ursache bezeichnet werden.

## Bereits belegter Ausgangszustand

- Production enthält Bali, Lissabon, Zermatt und Amsterdam mit jeweils Version 2, Entwurf 1 und veröffentlichter Revision 1, nicht archiviert. Die acht Inhaltsfelder wurden gegen die freigegebenen Texte und Bilder unabhängig geprüft. Readback: 21.11.2026, 17:45:47 UTC.
- Der aktuelle öffentliche Leser cms_inspiration_published_v1 ruft den Admin-/BG1-Katalogguard zweimal auf. Anonyme Aufrufe erreichen das bestehende Drei-Sekunden-Zeitlimit; Logs zeigen SQLSTATE 57014. Ein leerer CMS-Bestand oder fehlende Ausführungsrechte sind damit nicht die Ursache.
- Die getrennten anonymen Abrufe von API, Startseite und Entdecken um 17:48 UTC liefern API 503 und zwei erfolgreiche Seiten mit vier statischen Ersatzkarten. Die freigegebenen erweiterten CMS-Texte erscheinen dabei nicht.
- Der schmale veröffentlichungsbezogene Leser cms_inspiration_published_v2 ist bereits in Dev vorhanden. Das frühere gemischte SQL-Paket enthält zusätzlich eine KI-Quotenkorrektur und darf für diesen Auftrag nicht als Ganzes angewandt werden.

## Umsetzungsplan

1. Den bereits entwickelten Leser für veröffentlichte Inhalte als eigenes SQL-Paket mit Vorbedingungen, genauer Rechteprüfung, Readback und Rücknahme abtrennen. Nur bestätigte, nicht archivierte Veröffentlichungsrevisionen dürfen die private CMS-Grenze verlassen; keine Entwürfe, Historien oder Akteursdaten. Der geschützte v1-Leser und sämtliche Schreibfunktionen bleiben bytegleich.
2. Die vorhandene Anwendungsschaltung JETNITY_CMS_PUBLIC_V2_ENABLED ausschließlich für diesen geprüften Production-Schritt aktivieren. Der neue Dev-Preview-Branch erhält nur den vorhandenen öffentlichen Dev-Lesezugang zum Dev-Projekt; keine Admin-/Auth-Freischaltung.
3. In Dev Rechte, Entwurfs-/Archivtrennung, Originalinhalte, echte anonyme Latenz und bestehenden Fehler-Fallback prüfen. Die installierte Funktion mit der Paketdefinition vergleichen. Zusätzliche Datenprüfungen verwenden isolierte oder zurückgerollte Fixtures und hinterlassen keine Kundendaten.
4. Im PR die schmale Datenbankänderung, Konfigurationsgrenze, Rücknahme und Dev-Evidence zusammenführen. Unabhängiges Review und vollständige CI müssen auf dem tatsächlichen unveränderten Head grün sein. Höchstens drei offene PRs; ein erforderliches vorübergehendes Parken eines unabhängigen Drafts erhält Branch und Evidence und wird danach rückgängig gemacht.
5. Nach Merge Production-Vorbedingungen frisch prüfen, nur den freigegebenen CMS-Leser installieren und einen Production-Build mit Production-Konfiguration zunächst ohne Domainwechsel bereitstellen. API und beide Seiten müssen die vier tatsächlichen Veröffentlichungen liefern. Erst den geprüften Build live schalten; bei Fehlern zum vorherigen Build und zur vorherigen Konfiguration zurückkehren.

## Betroffene Bereiche und Risiken

SQL: ausschließlich die neue öffentliche Lesefunktion und deren eigene Ausführungsrechte. Anwendung: bestehende öffentliche CMS-Auswahl, strenger Decoder, Dev-Branch-Zulassung und bestehender Release-Schalter. API-Schema, öffentliche Seitenstruktur, Katalogergänzung, Reiseplanungslinks und gespeicherte Inhalte bleiben gleich. Es entstehen keine Anbieteraufrufe und keine neuen laufenden Kosten. Die Änderung betrifft die redaktionelle Inspiration vor der Reiseplanung, nicht den gespeicherten Reisegraphen.

Wesentliche Risiken sind versehentlich freigegebene Entwürfe, Änderung überwachten Katalogs, Vermischung mit KI-/BG1-Schritten, falsche Supabase-Zielbindung sowie eine vermeintlich erfolgreiche Anzeige aus dem Ersatzkatalog. Diese Fälle benötigen explizite negative Prüfungen beziehungsweise Inhalts- und Quellenabgleich.

## Tatsächlicher Prüf- und Release-Stand

Der eigene Branch heißt `fix/cms-public-reader-release-20261121`. Ihm sind ausschließlich im Vercel-Preview die drei bestehenden Dev-Konfigurationen `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` und `JETNITY_ADMIN_DEV_RUNTIME_ENABLED` zugeordnet. Ihre Quelle ist der bereits geprüfte Katalog-Dev-Branch; der Supabase-Zielabgleich verlangt weiterhin das genaue Dev-Projekt. Production-Konfiguration blieb während der Vorbereitung unverändert.

Das gehostete Dev-Readback bestätigt die exakte schon vorhandene v2-Definition samt Rechten und anonymer Ausführung. Dev hat keine veröffentlichten Einträge; die leere anonyme Abfrage brauchte 0,32 ms. Die lokale Prüfung von Anwendung, öffentlichem API-Zugang, genauer Branch-/Datenbankbindung, striktem Production-Release-Schalter und Fehler-Fallback bestand mit 40 erfolgreichen Prüfungen. Typecheck, Lint und die vorhandenen API-/Schema-/Erreichbarkeits-/Export-/Abhängigkeitsprüfungen bestanden. Die Pflicht-CI enthält zusätzlich den isolierten PostgreSQL-17-Nachweis; die bestehenden Gates und Budgets bleiben erhalten. Der zugehörige endliche Workflow-Fingerprint-Nachfolger und seine Verträge wurden unabhängig geprüft.

Die vollständige native PostgreSQL-Prüfung ist lokal mangels PostgreSQL nicht ausführbar und wird ausdrücklich nicht als bestanden dargestellt. Die gehostete Dev-Datenprobe bestand nach unabhängigem Review: Der echte anonyme Leser sah ausschließlich die zwei aktuellen Veröffentlichungen, keine neueren Entwürfe, archivierten Inhalte, alten Revisionen oder Akteure; gemessene Lesezeit 2,40 ms. Die vollständigen Inhalte aller drei CMS-Tabellen wurden vor und nach der Transaktion unabhängig abgeglichen und blieben nach ROLLBACK identisch. Setup und Production-Build bestanden lokal ebenfalls; für den Setup-Check wurde wegen einer lokalen IPC-Sperre derselbe TypeScript-Quellcheck direkt mit node --import tsx ausgeführt. Die echte Preview, eigener PR, vollständige CI, Production-Installation und Live-Auslieferung stehen bei Erstellung dieses Snapshots noch aus. Ihre tatsächlichen Ergebnisse und der unveränderte geprüfte Head werden im zugehörigen PR vor Merge festgehalten. Die vier Production-Inhalte werden nicht erneut geschrieben.


## Lesende Supabase-Untersuchung

Die [Production-Ressourcenansicht](https://supabase.com/dashboard/project/qscbgcdmivbbnzrcyegn/observability/database) belegt am 21.11.2026 um 18:15 Uhr Zürich eine Speicherzusage von 2,04 GB bei angezeigten 1,88 GB Kapazität und 911,75 MB Swap; um 18:45 Uhr waren es 2,44 GB Zusage, 1.019,82 MB Swap sowie 96,4 Prozent RAM einschließlich Cache. Beide Messpunkte sind als SEVERE markiert. Das belegt erheblichen Speicherdruck und macht ihn als Ausfallursache plausibel; ein ausdrücklicher Kernel-/Host-OOM-Kill und ein bestimmter verursachender Job sind nicht belegt. Die CMS-Entkopplung behebt den gesondert nachgewiesenen langsamen Leser, garantiert aber nicht das Ende aller Ressourcenprobleme.

HTTP 522 beim manuellen Auth-Aufruf ist für 18:18:17 Uhr Zürich belegt. Pooler und PostgREST liefen um 18:20:01–02 Uhr wieder an; 18:25 Uhr war der nächste erfolgreiche BG1-Lauf mit erneuerter Gültigkeit. Ein späterer eigenständiger Postgres-Neustart ist mit Postmaster-Start 18:45:46 Uhr belegt. Um 18:57:47 Uhr war das Projekt ACTIVE_HEALTHY mit sechs von höchstens 60 Verbindungen. Es wurden ausschließlich Metadaten, begrenzte Logs und historische Ressourcen gelesen.

Ein identischer Supabase-OOM am 12.11. konnte in den erfolgreich gelesenen Quellen nicht unabhängig bestätigt werden. Der vorhandene [SIGKILL/SIGTERM-Nachweis vom 12.11.](official-truth-product-v3/AA_REVISION_PROBE_HANDOFF_V1.md) betrifft einen GitHub-CI-Runner und bezeichnet dessen Ursache ausdrücklich als UNKNOWN; er ist kein Beleg für einen Supabase-Absturz. Keine Ressourcen-, Kosten-, Cron-, Login- oder 2FA-Konfiguration wurde für diese Untersuchung geändert.
