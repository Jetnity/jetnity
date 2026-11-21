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


### Erste echte Preview und Konfigurationskorrektur

Die erste Vorschau zeigte den vorgesehenen statischen Fehler-Fallback. Die Dev-HTTP-Logs belegten 401 für den v2-Aufruf, während die direkte SQL-Probe bereits bestand. Ursache war ausschließlich die neue Preview-Zuordnung: Die Vercel-Sammelliste lieferte trotz angeforderter Entschlüsselung die verschlüsselte Darstellung; diese war beim Kopieren irrtümlich als Wert übernommen worden. Der Einzelabruf des bestehenden öffentlichen Dev-Schlüssels lieferte den nutzbaren Wert. Rolle anon, genaues Dev-Projekt und Ablauf wurden geprüft, anschließend nur die neue branchgebundene Preview-Variable berichtigt. Kein neuer Schlüssel, keine Rotation, keine Production- oder Login-/2FA-Änderung. Ein neuer Build mit dieser Konfiguration und erneute HTTP-Abnahme bleiben verbindlich.

Der erste tatsächliche PG17-CI-Lauf bestand bereits einschließlich des neuen CMS-Lesernachweises. Anschließend wurden ausschließlich zusätzliche Leerzeilen am Ende der acht neuen Paketdateien entfernt; Quellen- und Provider-Gleichheit bestehen weiterhin. Die vollständige CI und Preview müssen den danach aktualisierten PR-Head prüfen.

## Nachtrag vom 21.11.2026: Small und CMS-Release ausgeführt

Dieser Nachtrag beschreibt den tatsächlich erreichten Stand und ersetzt die oben ausdrücklich historischen offenen Release-Schritte. Der Owner gab anschließend sowohl den vorbereiteten CMS-Release als auch das Upgrade des Production-Projekts `qscbgcdmivbbnzrcyegn` von Micro auf Small mit ungefähr 5 USD monatlichen Mehrkosten frei. Die Freigabe umfasste keine anderen Einstellungen und keine Änderungen an Login oder Zwei-Faktor-Anmeldung. Die gesonderte BG1-/Cron-Abfrageoptimierung bleibt ein eigener Arbeitsschritt und ist durch diesen CMS-Abschluss nicht als erledigt erklärt.

Die vollständige PR-CI von [#1270](https://github.com/Jetnity/jetnity/pull/1270) bestand mit zwölf erfolgreichen Jobs im [Lauf 44936691079](https://github.com/Jetnity/jetnity/actions/runs/44936691079). Der tatsächliche normale Merge `5bb0d5909e675de09eb6c7659c3132187e66abf9` hat denselben geprüften Quellbaum. Die nachfolgende Main-CI meldete ausschließlich den inzwischen ausdrücklich gewollten Dev-Passkey-Sollwert als Abweichung. Dessen getrennte Korrektur wurde in #1269 mit vollständig grüner PR-CI gemergt; dieser CMS-Auftrag änderte dafür keine Auth-Einstellung und schwächte keine Prüfung ab.

### Small: Zeitpunkt, Umfang und Kosten

Vor Auswahl wurde am 21.11.2026 um **21:24:22 Uhr Zürich** protokolliert, vor der abschließenden Bestätigung erneut um **21:25:03 Uhr Zürich** (20:25:03 UTC). Das überprüfte Supabase-Formular enthielt genau eine Änderung: **Compute MICRO → SMALL**, 2 GB statt 1 GB RAM. Die angezeigte Monatskalkulation betrug 9,68 → 14,83 USD, entsprechend **5,15 USD Mehrkosten vor Steuern**; die stündlichen Preise waren 0,01344 → 0,0206 USD. Dies ist die dort angezeigte Compute-Schätzung, keine neu berechnete Gesamtrechnung des bestehenden Tarifs.

Das Upgrade wurde genau einmal bestätigt. Anschließend wurden der laufende Größenwechsel und danach Small als aktuelle Größe beobachtet. Disk 8 GB, gp3, 3.000 IOPS und 125 MB/s blieben unverändert. Es gab keinen zusätzlichen manuellen Projektneustart, keine weiteren Projekt- oder Auth-Einstellungen und kein anderes Upgrade. Der vom Größenwechsel ausgelöste Postgres-Neustart ist um 21:25:51,211541 Uhr Zürich belegt; der echte SQL-Readback um 21:26:29,915985 Uhr bestätigte Small-Standardwerte von 90 maximalen Verbindungen und 512 MB `shared_buffers` sowie weiterhin vier Veröffentlichungen. Diese Standardwerte wurden nicht einzeln verändert.

Die bestehende angemeldete Browser-Sitzung blieb nach dem Upgrade nutzbar. „Meine Reisen“ zeigte nach vollständiger Navigation die gespeicherte Kontoreise. Ein neuer Passwort- oder 2FA-Anmeldevorgang wurde nicht ausgeführt und wird nicht als getestet behauptet.

### CMS-Installation und unveränderte Schutzgrenzen

Der frische lesende Production-Preflight um 21:29:27 Uhr Zürich bestätigte vier Veröffentlichungen und noch keinen v2-Leser. Installiert wurde ausschließlich der exakt gemergte `provider-migration-body.sql` über den regulären Supabase-Migrationsanbieter als `cms_public_reader_v2_release_20261121`. Sein SHA-256 war `bbec79d7b9f4009df6614ccd6075d83fb53eb66f926b6f94fde62484031648d7`.

Das Paket-Readback führte den Leser unter der echten Datenbankrolle `anon` aus und bestätigte **vier veröffentlichte Revisionen 1 in 0,43 ms**. Definition, Attribute, Ausführungsrechte und Abhängigkeiten entsprachen exakt dem geprüften Paket. Die Nachprüfung um 21:29:45 Uhr bestätigte identische Fingerabdrücke unmittelbar vor und nach der Installation:

| Geprüfter Bestand | Identischer SHA-256 vor und nach Installation |
| --- | --- |
| Geschützter Katalog | `6403ab688826a8976d3b491076df482209343ebc939d47277b6426bdf06ade71` |
| CMS-Einträge | `864712740b2ab21a3c85d1e23e9dd2650624a07d1412133152da798d138bda67` |
| CMS-Revisionen | `662f8d2ffbf52ff3579aad712f228a66455b4dc50bbc720c7e82e05d4f6040ce` |
| CMS-Operationen | `8926c2ed997a0dc9237d5682b62252ca7c323b4a2d0ffb85cc46c4001359c081` |

Security-Advisories änderten sich ausschließlich um den erwarteten öffentlichen `SECURITY DEFINER`-Leser für `anon` und `authenticated`. Private Tabellenrechte, Admin-Schreiber, bestehende Guard-Funktionen, Rollen und Auth-Konfiguration blieben unverändert. Die vier Inhalte wurden weder neu gespeichert noch erneut veröffentlicht.

Der bisher nicht vorhandene Anwendungsschalter `JETNITY_CMS_PUBLIC_V2_ENABLED=true` wurde ausschließlich für Vercel **Production** angelegt. Andere Variablen, Preview- und Development-Zuordnungen blieben unverändert. Dieser ausdrücklich freigegebene CMS-Schalter ist getrennt vom einzigen Compute-Wechsel in Supabase zu betrachten.

### Separates Staging, Promotion und Live-Abnahme

Die automatische Zuordnung der Production-Domains wurde unmittelbar zuvor als ausgeschaltet bestätigt. Der separate Production-Build `dpl_Gt12S4yqxcFwgAXuVc3PggvwNixH` wurde mit der exakt bestätigten gemergten #1270-Quelle `5bb0d5909e675de09eb6c7659c3132187e66abf9` erstellt. Er enthält keine noch nicht gemergte BG1-/Cron-Optimierung. Die [gestagte Vorschau](https://jetnity-a07m5qxmb-jetnity-e1b93c82.vercel.app/entdecken) war READY und lieferte vor dem Domainwechsel anonym die vier exakten öffentlichen CMS-Snapshots; Startseite und Entdecken antworteten mit 200, Entdecken mit vollständigen freigegebenen Texten und `status:published`. Die Browserprüfung bestätigte zusätzlich vier tatsächlich geladene Bilder.

Um **21:32:57 Uhr Zürich** (20:32:57 UTC) wurde genau dieser geprüfte Build promotet. Beide Live-Domains wurden danach auf diesen Build zurückgelesen. Das vorherige separat bestätigte #1268-Deployment `dpl_4KySqFCx4qgvLn7bhP9uRLeKJwt1`, Quelle `1acee55c412ed1ccb3bba6e6c5919e5ffc57f5d4`, blieb das Rückrollziel. Es war kein Rollback erforderlich.

Die unabhängige Live-Abnahme zwischen 21:33:17 und 21:35:06 Uhr Zürich bestätigte:

- [Startseite](https://jetnity.com/): 200, vier Zielkarten und Bilder, kein Fehlerfallback und kein Leerhinweis. Die Karten zeigen konstruktionsgemäß keine vollständigen Beschreibungstexte.
- [Entdecken](https://jetnity.com/entdecken): 200, vier vollständige freigegebene CMS-Beschreibungen, vier Bilder und ausdrücklich `status:published`, kein Fehlerfallback.
- Querylose öffentliche CMS-API ohne Cookies oder Auth-Header: 200, `no-store`, Schema 1 und genau vier Revisionen 1. Der unabhängige einzelne Aufruf über `www.jetnity.com` mit regulärem Redirect zur Hauptdomain bestätigte die exakte Übereinstimmung aller acht öffentlichen Inhaltsfelder aller vier Einträge.
- Bestehende Anmeldung und „Meine Reisen“ blieben auch nach der Liveschaltung nutzbar; die gespeicherte Kontoreise erschien nach Neuladen. Kein neuer Passwort-/2FA-Test. In den bis 21:35:17 Uhr Zürich geprüften Laufzeitlogs erschienen keine Error-/Fatal-Einträge.

Ein erster Vercel-Connector-Aufruf der Live-API lieferte 503, während die Seiten bereits erfolgreich die CMS-Inhalte anzeigten. Die API-Route verweigert jeden Querystring; ein vom Connector verwendeter Freigabeparameter ist deshalb eine mögliche, **nicht abschließend bewiesene** Ursache. Die danach erfolgreichen direkten querylosen öffentlichen Aufrufe zur Hauptdomain und über www sind getrennt dokumentiert. Ihre Gesamtzeiten von 7,41 bzw. 9,49 Sekunden enthalten Netzwerk und gegebenenfalls Redirect; sie sind weder SQL-Laufzeitmessungen noch ein belastbarer Performance-SLA-Nachweis. Die separate SQL-Paketprüfung maß 0,43 ms.

**Ergebnis:** Bali, Lissabon, Zermatt und Amsterdam werden jetzt öffentlich aus dem CMS auf Startseite und Entdecken ausgeliefert. Die im geprüften Quellstand vorhandene Katalogergänzung bei weniger als acht Veröffentlichungen und der statische Fehler-Fallback bleiben erhalten. Der weitere Stand der getrennten BG1-/Cron-Abfrageoptimierung wird in [deren Kosten- und Prüfbericht](JETNITY_BG1_QUERY_COST_2026-11-21.md) geführt; aus dieser erfolgreichen CMS-Auslieferung folgt keine bereits erfolgte Änderung des BG1-Guards oder seiner Cron-Jobs.
