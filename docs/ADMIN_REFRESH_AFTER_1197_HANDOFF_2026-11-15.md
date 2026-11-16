# Admin-Pakete auf Main nach #1197 – Freigabekandidat

Stand: 15. November 2026. [Auftrag, Grenzen und genaue Paketstände](ADMIN_REFRESH_AFTER_1197_TASK_2026-11-15.md).

## Ergebnis und Freigabegrenze

Alle vorhandenen Admin-Pakete #1199–#1212 sind auf dem Main-Stand nach dem tatsächlichen Merge von #1197 in einem gemeinsamen Source-Kandidaten enthalten. Die bisherigen Einzel-PRs bleiben offen; kein PR-Merge, keine Production-Aktion und keine Installation wurden ausgeführt. Der gemeinsame Draft-PR ist der Review- und CI-Einstieg. Seine Beschreibung enthält den tatsächlichen Abschluss des einmaligen gemeinsamen CI-Laufs; dieser vorab versionierte Handoff behauptet keinen späteren CI-Erfolg.

Die aktuelle Owner-Anweisung autorisiert die Zusammenführung der vorher eingefrorenen acht Pakete. Die früheren STOP-/Wartehinweise in den einzelnen datierten Handoffs bleiben Historie und werden für diese Source-Integration durch diesen Auftrag ersetzt. Sie sind keine nachträgliche Erlaubnis für Datenbankaktivierung, Login, Production oder den Ortsimport. #1198 bleibt im anderen Chat.

## Enthaltene Pakete

| Pakete | Enthaltener Stand | Verbleibende Grenze |
| --- | --- | --- |
| #1199, #1200, #1201, #1203, #1204 | Reiseauswertung/Betriebsansichten, Content-Inventar, Mietwagen-Diagnose, Erstattungsjournal und Erhalt der Reise-/Etappenstruktur | Bestehende echte Dev-Nachweise bleiben erhalten; keine erneute Einzelabnahme behauptet |
| #1205, #1207, #1208, #1211 | Gespeicherte Sprache, Account-Einstellungen, Marketinglinks, Analytics/Buchungen und Security-Anzeige in DE/EN | Echte Konto-Security-Abnahme nach legitimer Owner-Anmeldung/2FA bleibt offen |
| #1202 | Guarded Kontozähler und atomarer Installationskandidat | Uninstalliert und deaktiviert; BG1-kompatibler Installationsvertrag fehlt |
| #1206, #1209, #1210 | Versionierte CMS-/Kampagnen-SQL-Kandidaten, native Prüfungen und CMS-Editor mit ehrlicher Nichtverfügbarkeit | BG1-/Typen-/Scanner-Integration, Installation und Runtime-Anbindung bleiben offen |
| #1212 | Externer Dev-Ortskatalog-Runner mit Wiederaufnahme und vollständiger Abschlussprüfung | Runner nicht gestartet; vollständiger Import/Hosted-Abnahme und spätere echte Ortsauswahl bleiben offen |

## Tatsächliche Integrationsänderungen

- Der gemeinsame Main enthält die Änderungen von #1197 einschließlich Auth-Konfiguration und aktueller Official-Truth-Prüfungen. Diese wurden nicht durch ältere Admin-Branches zurückgesetzt.
- Ein manueller Konflikt im bestehenden Admin-Harness wurde durch Erhalt beider Verträge gelöst: Content-Query-Wechsel und HTTP-Methodenerfassung. Der zusammengeführte Sprachkatalog enthält sämtliche bisherigen Gruppen sowie die CMS-Texte.
- Die vollständigen PostgreSQL-17-Jobs für CMS und Kampagnen laufen jetzt im normalen `CI`-Workflow. Die bisherigen separaten PR-Workflows entfallen. Der bestehende Pflicht-Aggregator verlangt zusätzlich beide neuen Ergebnisse; keine Prüfung wird optional und kein Fehler wird ignoriert.
- Drei unmittelbar betroffene CI-Vertragstests sind auf die zusätzlichen Pflichtfamilien angepasst. Die historische Inhaltsbindung des Workflows besitzt einen endlichen, exakt geprüften Nachfolger. Der vorhandene AA-Inhalts-Pin wird ausschließlich für die neue CI-Datei gewartet; URL, Branch, Run-Auswahl, Probe-Zulassung und Runtime bleiben unverändert.
- Keine Schema-, Rechte-, Guard-Baseline-, generierten Typen-, Scanner- oder Datenänderung. Keine Quellenanfrage, keine Modell-/Provider-Aktivierung, keine neuen Dienste oder Kostenfreigaben.

## Warum Kontozähler und CMS/Kampagnen noch gesperrt sind

Der gemergte BG1-Katalog erfasst weiterhin die globalen Rollenabhängigkeiten von `anon`, `authenticated` und `service_role`. Zusätzliche Grants für die Kandidaten verändern diesen Katalog. `assert_catalog_v1()` verlangt weiterhin die exakte geprüfte Baseline; neue Rechte dürfen nicht durch Rebaselining oder Abschalten des Guards eingeschleust werden. Der Counts-Installer verweigert deshalb bei vorhandenem BG1, und die bestehende konkrete Dev-Branch-Bindung aktiviert den gemeinsamen Branch nicht automatisch.

Die sechs CMS-/Kampagnen-RPCs stehen weiterhin weder in den generierten Typen noch im geschlossenen Scanner. `types/supabase.ts` gehört zum laufenden #1198-Scope. Die beiden SQL-/Funktionspaare benötigen später eine koordinierte atomare Installation mit einem kompatiblen BG1-Übergang. Danach fehlen noch die zugelassenen Runtime-Zugriffe durch bestehende Admin-/AAL2-/Schreibgrenzen und den angemeldeten Nutzerclient. Ein Service-Role- oder dynamischer RPC-Ersatz ist nicht zulässig.

Der CMS-Editor liefert deshalb weiterhin `unavailable`; er besitzt keinen produktiven Schreibtransport. Die Kampagnenoberfläche erzeugt weiterhin temporäre Links und behauptet keine gespeicherten Entwürfe. Die spätere CMS-Anbindung umfasst auch den veröffentlichten Content-Leser und das dauerhafte Auflösen unklarer Schreibabsichten; Kampagnen benötigen den gespeicherten Entwurfsfluss. Ein Source-Merge ist kein Nachweis dieser Fähigkeiten.

## Übersetzungen und echte Konto-Abnahme

Die Übersetzungen waren in den Einzelpaketen grün; insbesondere [#1211](https://github.com/Jetnity/jetnity/pull/1211) besitzt den [erfolgreichen Gesamtlauf](https://github.com/Jetnity/jetnity/actions/runs/43739148292). Dieser Nachweis gehört zu seinem damaligen Kopf. Der gemeinsame CI-Lauf prüft den neuen Kandidaten.

Einmal nach legitimer Owner-Anmeldung/2FA die gespeicherte Sprache EN auf `/account/security` prüfen und anschließend DE wiederherstellen. Keine Passwortänderung, Faktoränderung oder echte Abmeldung als Nebenwirkung. Die bisherigen acht grünen Pakete besitzen bereits dokumentierte echte angemeldete Dev-Nachweise und werden nicht noch einmal einzeln abgenommen.

## Ortskatalog: weiterhin keine Ausführung

Der [externe Runner](../scripts/places/catalog-external/run.mjs) bleibt unverändert. Keine Geodaten, Roharchive, Importbatches oder Einzelreceipts werden über GitHub/Supabase im Chat übertragen. Es gab keine Supabase-Abfrage, auch keine neue Zählung. Der zuletzt lokal gesicherte Zwischenstand wird nicht als frische Hosted-Wahrheit dargestellt.

Der frühere [Katalog-CI-Lauf](https://github.com/Jetnity/jetnity/actions/runs/43750673582) ist inzwischen abgeschlossen: Repository verification und alle 13 Katalogfälle bestanden, einschließlich des echten isolierten PostgreSQL-Falls. Nur der damalige Auth-Abgleich war fehlgeschlagen. Der neue Main enthält die passende Konfigurationskorrektur; ihre aktuelle Übereinstimmung wird erst der gemeinsame CI-Lauf belegen. Keine erneute Import-Probe im Chat.

## Prüfung und verbleibende Freigaben

Die gezielte lokale Integrationsprüfung der zusammengeführten Source-Verträge bestand. Der unabhängige Quellreview bestätigte den Erhalt des neuen Main und der Paketfunktionen; der CI-Review bestätigte die vollständige Übernahme beider bisherigen Native-Jobs und aller unveränderten Main-Jobs. Die konkrete lokale Typecheck-/Lint-/Hygiene- und gemeinsame CI-Evidence steht im PR. Der lokale Executor erlaubt keine PostgreSQL-Unix-Sockets; native echte Prüfungen bleiben in der normalen CI zwingend, ohne Hosted-Ersatz.

Owner-Entscheidungen: gemeinsamer Source-Merge nach grüner CI; legitime Konto-Anmeldung für die offene Abnahme; Production und mögliche künftige Kosten separat. Der Ortsimport benötigt einen später ausdrücklich beauftragten externen Lauf. Kontozähler sowie CMS/Kampagnen sind noch kein Aktivierungs-Freigabekandidat, solange ihre genannten technischen Voraussetzungen fehlen.

Ziel bleibt jetnity.com bis 30.11.2026. Bei Einreisebestimmungen bleibt die vollständige Anzeige ab Start maßgeblich: Visum, ETA, Pass, Impfungen, Gesundheit, Formulare mit Kosten/Betrugswarnung, Gebühren, Ticket-/Geldnachweis, Transit, Minderjährige, Zoll, Sonderfälle, Quelle/Datum, Hinweis, Änderungen und amtliche Links. Fehlende Wahrheit bleibt „derzeit nicht verfügbar“.
