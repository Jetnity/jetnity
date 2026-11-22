# AT-Quellenentscheidung und technische Folge — vorbereitete Grenzen

**Stand 22.11.2026; vorbereitet, nichts ausgeführt.** Dieses Paket enthält genau eine künftige READ-ONLY-Datei und eine fachliche Quellenentscheidung. Es enthält keine ausführbare Installation, keinen Publisher-Aufruf und keine pauschale Kundenfreigabe. Ausgangspunkt ist Commit `86238b2c34011554c05353ddf6f9f764e92fd6ca` und der dokumentierte Production-Read vom 22.11.2026, 11:54:53.145099 UTC. Spätere Aktualität wird nicht behauptet.

## 1. Warum die Quellenentscheidung eine technische Folge braucht

Die drei vorhandenen `source_pins_v1` erzwingen `research_only=true` und `source_qualified=false`; `first_originals_v1` erzwingt `legal_source_approved=false` und `customer_rule_approved=false`. Immutable-Trigger schützen die Originale und Historien. Ein UPDATE der Freigabefelder wäre weder der vorhandene unterstützte Pfad noch eine Quellenqualifikation. Das Abschwächen dieser CHECKs oder Umgehen der Trigger ist nicht Teil dieses Plans.

Der seit Allocator-Installation tatsächlich gebundene Publisher `renew_ch_v1()` prüft zuerst die echte Qualifikation aller drei Quellen und Originale, dann BG1, Vollständigkeit, Frische und MA1. Außerdem blockiert jede `changed`-Beobachtung seit dem vorherigen Fakt. Bei der BMEIA-Quelle unterscheiden sich der konfigurierte alte Pin `7ca56188…5266c18`, das erhaltene tatsächliche Production-Original `b678259a…898e0` und die neue geprüfte Fassung `2521a95c…62cbe`. Alle vollständigen Werte stehen in SOURCE_SCOPE.json. Keiner dieser historischen Werte darf durch den anderen ersetzt werden.

Die vorhandene Methodenrevision 1 bindet den bisherigen Methodendigest `cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9` und Paketdigest `55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe`. Die vollständige BMEIA-Fassung darin hat 172460 Bytes. Eine neue 172428-Byte-Quelle wird nicht durch ein fachliches „regelneutral“ automatisch Bestandteil dieser Methode.

## 2. Genau vorbereiteter nächster Schritt

Nach dem **separaten Paket-Go** wird die fachliche Entscheidung mit den drei vollständigen SHA-256 und dem engen CH→AT-Visumumfang dokumentiert. Danach darf ausschließlich `00-at-qualification-bindings.READONLY.sql` einmal auf `qscbgcdmivbbnzrcyegn` ausgeführt werden. Die Datei liest:

- Native Katalog-, Owner-, ACL-, RLS-, Spalten-, Constraint- und Trigger-Metadaten der neun ausdrücklich aufgeführten AT-/Methodenrelationen.
- Vollständige Definitionshashes und Aufrufmetadaten der ausdrücklich benannten AT-, Visitor-, Methoden- und Owner-Schutzfunktionen; **keine dieser Projektfunktionen wird aufgerufen**.
- Den einen AT-Methodenkopf einschließlich Status, Gültigkeit und korrelierter, nur gehashter Quittungsidentität. Keine Auth-Sessions, Tokens, Secrets, E-Mail-Adressen oder Owner-UUIDs werden ausgegeben.
- Die drei vorhandenen Pins und Metadaten der drei erhaltenen Originale, inklusive tatsächlich berechnetem Körperhash, aber ohne Rohkörperausgabe.
- Die letzten drei vorhandenen Watch-Batches, höchstens neun Quellenzeilen und bereits gespeicherte HTTP-Response-Metadaten/Hashes. Es wird keine HTTP-Anfrage ausgelöst.
- Den gebundenen BG1-v4-Parent, den vorhandenen vollständigen Proof und feste aggregierte AT-Faktenzahlen.

Die Abfrage schreibt nichts, ruft keinen privaten oder öffentlichen Jetnity-Publisher auf, reserviert keine Sequenz-ID und endet mit ROLLBACK. Daten können durch die normalen bereits bestehenden Cronjobs vor oder nach dem Abfragesnapshot fortschreiten; das Paket startet oder verändert diese Jobs nicht.

Vor dem ersten Zugriff auf Projektdaten prüft sie ausschließlich im PostgreSQL-Katalog alle 13 gelesenen Relationen mit ihren 126 Spalten: gewöhnliche Tabellen, keine Views/Foreign Tables/Vererbung, exakte Namen und eingebaute PostgreSQL-Typen. Unbekannte Form stoppt bereits davor. GUC-Konfiguration, Default-, Constraint- und Triggerausdrücke werden ausschließlich als SHA-256 und Bytezahl ausgegeben. Die tatsächlich verbundene Quellenmenge wird vor der Ausgabe auf höchstens neun Zeilen geprüft; doppelte Batch-/Quellenpaare, fremde Quellen und doppelte gespeicherte HTTP-Antworten stoppen den Auftrag. Fehlende gespeicherte Antworten bleiben fehlende Belege.

Beide Dreierlisten müssen genau die drei freigegebenen Quellenidentitäten ohne Duplikate enthalten. Methodenkopf und vollständig korrelierter BG1-Join werden jeweils mit einem LIMIT-2-Sentinel geprüft; mehr als eine Zeile führt vor dem Ergebnisaufbau zum STOP. Null Zeilen werden weiterhin als fehlender Nachweis erfasst. Diese Ausgabegrenzen beruhen damit nicht auf noch ungeprüften Unique-Constraints.

**Grenzen:** eine Transaktion, eine unveränderte Datei, maximal fünf Minuten Gesamtfenster ab Start; SQL-Statement 15 Sekunden, Transaktion/Idle 20 Sekunden, Lock 500 ms; eine Ergebniszeile, höchstens 131072 UTF-8-Bytes. Die festen Tabellenzeilenobergrenzen stehen zusätzlich in der Datei. Bei SQL-Fehler, falschem Projekt, unklarer Antwort, unbekannter Ergebnisform, fehlendem Pflichtobjekt, anderer Parent-Bindung oder Überschreitung STOP; kein Retry und kein Zusatzread. Ein `STOP_OUTPUT_CAP` ist ein STOP, kein erfolgreicher Fachnachweis. Fehler beenden den Auftrag; bei offen gebliebener Transaktion ausschließlich vollständiger ROLLBACK, keine weitere Diagnose.

## 3. Noch nicht installierbarer technischer Nachfolger

Nach dem Bindungsread muss zunächst ein getrenntes Dev-Paket den folgenden konkreten Vertrag implementieren und beweisen. Diese Spezifikation vergibt **keine** Ausführungsfreigabe:

1. Neue private append-only Quellen-Generation mit allen drei vollständigen aktuellen Originalen, Quelle/URL, Bytes, Roh-SHA, geprüftem Scope und unverfälschter Herkunft aus einem vollständig gebundenen echten Quellenbatch. Die alten Pins, gespeicherten Originale, Beobachtungen und Fakten bleiben unverändert.
2. Eindeutige Quellenentscheidung und Nachfolgerlinie: der neue BMEIA-Hash gilt nur ab einer ausdrücklich qualifizierten Generation. Historisches `changed` bleibt `changed`; es wird nicht gelöscht oder umetikettiert. Vor dieser Grenze liegt weiterhin keine automatisch gültige Erneuerung vor.
3. Neue exakt gebundene Methoden-/Paketrevision für die drei aktuellen Fassungen und allein CH/AT/Visum/Schweizer Reisepass/direkte Einreise. Die echte nächste Revision und erwartete Epoche werden aus der gelesenen Methodenkette ermittelt; der bestehende Owner-/AAL2-Pfad bleibt zwingend. Ein Chat-Go wird nicht als technische MA1-Quittung nachgebildet. Ein nötiger Login/2FA-Schritt wird gesondert vorgelegt.
4. Collector, Publisher und Visitor verwenden gemeinsam dieselbe Qualifikationsgeneration, Methode und Quellenbindung. Der Publisher erzeugt nur aus einem frischen echten 3/3-Batch einen neuen Fakt; nach Quellenänderung, fehlender Qualifikation, abgelaufener/widerrufener Methode oder unvollständigem BG1 bleibt die Rückgabe gesperrt. Keine synthetische Verlängerung und kein Wiederbeleben der 62 abgelaufenen Fakten.
5. BG1 bekommt einen gebundenen Nachfolger mit tatsächlichem Parent, festen Katalogdefinitionen, erforderlicher neuer Proof-Generation und Proof-Zeitgrenze. Erst ein nach dieser Grenze natürlich abgeschlossener Vollbeleg kann die neue Linie öffnen. Kein pauschales Neuversiegeln des jeweils vorgefundenen Katalogs.
6. Der mögliche Kundenpfad bleibt genau der bestehende enge CH→AT-Visumpfad. Das allgemeine 50-Pass-UI ist kein Nachweis 50 freigegebener Auskünfte. Andere Themen und Pässe erhalten durch dieses Paket keine positive Aussage.

Für den Nachfolger sind **noch keine installierbaren SQL-Dateien oder installierbaren SHA-Werte vorhanden**. Dieses Paket enthält absichtlich keine leeren oder mit Platzhaltern gebundenen Installations-, COMMIT- oder Fence-Dateien.

## 4. Erforderliche Nachweise vor einer späteren Production-Installation

Die tatsächliche positive AT-Erneuerung ist noch nicht bewiesen. Der vorhandene Dev-Negativtest verweigerte wegen `changed`, also vor der Qualifikationsbarriere. Deshalb sind mindestens folgende getrennte Nachweise erforderlich:

- Frischer, tatsächlich unveränderter 3/3-Batch ohne Qualifikation: Verweigerung aus genau diesem Grund, keine neue Faktenzeile.
- Derselbe zulässige technische Pfad mit echten qualifizierten Originalen, echter gültiger MA1-Quittung und frischem BG1: genau ein neuer vollständig gebundener CH→AT-Fakt; wiederholte Verarbeitung desselben Batches erzeugt keinen zweiten Fakt.
- Neue Quellenänderung, falscher Hash/Bytes/URL, fehlender Originalkörper, abgelaufene Quelle, fehlende/abgelaufene/widerrufene Methode und falsche Epoche: jeweils fail closed; alter positiver Cache überlebt Ablauf oder Widerruf nicht.
- Nicht-CH, anderes Dokument, Transit oder anderes Thema: keine übertragene CH-Positivauskunft. Der echte öffentliche Visitor unter den vorhandenen Rollen zeigt nur die gebundene CH-Visumauskunft samt Herkunft und Frische.
- Native Transaktionsrücknahme, unabhängiger Nachread, konkurrierender natürlicher Cronlauf, immutable Alt-Historie und neuer BG1-Vollbeleg: ohne zusätzliche Production-Rechte, Owner-Imitation oder manuelles Erzwingen von Quellen-/Publisherergebnissen.

Erst danach werden konkrete Rehearsal-, Installations-, Nachread- und gegebenenfalls Sperrdateien mit ihren endgültigen SHA-256 getrennt zur Prüfung vorgelegt. Es wird kein bestandener Test und keine Production-Bereitschaft aus dieser Spezifikation abgeleitet.

## 5. Rücknahme und Reihenfolge der beiden Pakete

**Dieses Paket:** Der Bindingread endet mit ROLLBACK; er hat keine dauerhafte DB-Änderung rückzubauen. Die Quellenentscheidung kann vor der späteren technischen Aktivierung zurückgezogen werden; Kunden sehen nach diesem Go weiterhin „derzeit nicht verfügbar“.

**Späterer Nachfolger:** Vor COMMIT muss jede fehlgeschlagene Prüfung die gesamte Transaktion zurückrollen. Bei unklarer COMMIT-Antwort STOP, kein Wiederholen. Nach bestätigtem COMMIT darf die konkrete zuvor geprüfte qualifikationsbezogene Sperr-/Widerrufsdatei nur mit der dafür gegebenen Freigabe ausgeführt werden; sie bewahrt Originale und Historie und stellt keine alten positiven Fakten wieder her. Ein konkreter Rollback nach COMMIT ist erst mit den endgültigen native gebundenen Schreibdateien freigabefähig.

AT und CH→DE Zyklus 12 haben **getrennte Entscheidungen und Gos**. Beide derzeit vorbereiteten Lesephasen können denselben unveränderten v4-Parent lesen. Nach der ersten späteren katalog- oder zustandsändernden Installation muss das andere Schreibpaket gegen den tatsächlich entstandenen Parent neu gebunden und erneut vorgelegt werden. Keines der beiden Gos erlaubt die andere Quellen-/Import-/Owneraktion.

## 6. Grundlagen und tatsächlicher Prüfstand

Ausgewertet wurden die aktuelle Installationsdatei 20, die Read-only-Dateien 50 und 02, die Production-Operational-Read-Belege, die vollständige BMEIA-Fachentscheidung, das vorhandene Production-stage1-Schema, die Dev-Whole-Originals-/Source-Renewal-/EU-CH-Review-Pfade, die Hosted-MA1-Definitionen und die aktuelle AT-Visitor-Präsentation. Nur Repository- und vorhandene Belegdateien wurden gelesen.

Die Prüfdateien werden lokal auf JSON-Form, feste SHA-256, unveränderte Quellenwerte und die READ-ONLY-/ROLLBACK-Grenzen kontrolliert. **Kein SQL ausgeführt, keine Dev-/Production-Abfrage, kein Quellenabruf, kein Testserver, kein Login, kein Build und kein Deployment in dieser Vorbereitung.** Der Read ist nicht bereits ein bestätigter Hosted-PASS.

