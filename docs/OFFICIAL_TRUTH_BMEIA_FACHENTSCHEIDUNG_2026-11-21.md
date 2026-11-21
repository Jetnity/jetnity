# BMEIA Bern: unabhängige fachliche Änderungsprüfung am 21.11.2026

## Entscheidung

**Betrifft die erfasste Änderung eine österreichische Einreise-, Pass- oder Visaantragsregel? Nein.** Zwischen dem aufbewahrten Original vom 16.11.2026 und der tatsächlichen Dev-Antwort aus Batch 105 vom 21.11.2026 ist der vollständige Hauptinhalt einschließlich sämtlicher dortiger Links bytegleich. Geändert wurden ausschließlich 19 Versionsparameter für Theme-Dateien und ein fremder Navigationspunkt zur ID Austria.

Diese Entscheidung beschreibt den Inhalt der beiden tatsächlich vorliegenden Fassungen. Sie ist **keine Quellenqualifikation, keine Methodenfreigabe und keine positive Erneuerungsprüfung**. Der bestehende Monitor muss nach seinem bisherigen Vertrag weiterhin `changed` melden. Die Originale bleiben `RESEARCH_ONLY`, `importable=false`, `accepted_fact_count=0`; abgelaufene Auskünfte bleiben **derzeit nicht verfügbar**.

## Tatsächliche Belege und Herkunft

Der Reviewer hat keine Datenbank-, Browser- oder Productionaktion ausgeführt. Root hat Original und aktuelle Antwort mit einer Dev-Abfrage in `REPEATABLE READ READ ONLY` exportiert; der Reviewer hat diese Dateien unabhängig vollständig verglichen. Die exportierte Antwort ist dem Quellenwatch-Beleg über Batch 105 / Quelle `bmeia-bern-how-to-apply` / Request 1805 zugeordnet. Metadaten und Dateiinhalte stimmen bytegenau miteinander überein.

| Beleg | Tatsächlich geprüft |
|---|---|
| Amtliche URL | <https://www.bmeia.gv.at/oeb-bern/reise-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag/> |
| Original abgerufen | `2026-11-16T19:45:39Z` |
| Original | 172.460 Bytes; SHA-256 `7ca5618875cf1eccea033e1b851cdd8aea3d1aef80585048f62826c8c5266c18` |
| Tatsächlicher Request | Batch `105`, Request `1805`, angefordert `2026-11-21T15:25:00.224038Z` |
| Tatsächliche Antwort | `HTTP 200`; `text/html; charset=utf-8`; `timed_out=false`; `error_msg=null`; erstellt `2026-11-21T15:25:00.479713Z` |
| Antwortkörper | 172.428 Bytes; SHA-256 `2521a95cc70490decb12051b28f1e5d208b9429ffb589e2491b34ca110f62cbe` |
| Quellenwatch-Beobachtung | `2026-11-21T15:30:00.237429Z`, `changed`; Hash und Bytezahl entsprechen der tatsächlichen Antwort |
| Unabhängiger Root-Export | `2026-11-21T15:51:09.192649Z`, Dev-Projekt `yfvbxvijcorffwxbxahl` |

## Vollständige ermittelte Differenz

| Änderung | Alter Wert | Neuer Wert | Einordnung |
|---|---|---|---|
| 19 CSS-/JavaScript-Theme-Verweise | Versionsparameter `1794830959` | Versionsparameter `1795172470` | Gleiche Ressourcenpfade; andere Cache-/Versionsparameter. Die Ressourcen selbst wurden nicht verglichen. |
| Ein Linktext im Hauptmenü | `Handy-Signatur / ID-Austria` | `ID-Austria` | Menü für österreichische Bürgerdienste, außerhalb des Reiseartikels. |
| Ziel desselben Menülinks | Suffix `/handy-signatur-id-austria` | Suffix `/id-austria` | Gleicher Bereich `service-fuer-buergerinnen/information-fuer-auslandsoesterreicherinnen-und-auslandsoesterreicher/`. |

Der Zeilenvergleich findet genau **20 geänderte HTML-Zeilen**. Die Verkürzung des Menüankers erklärt die vollständige Differenz von **−32 Bytes**. Werden ausschließlich die 19 Zeitstempel nach der bereits bestehenden Normalisierung entfernt und genau dieser eine alte Menüanker durch den neuen ersetzt, sind die vollständigen HTML-Dokumente bytegleich. Damit bleibt keine weitere HTML-Differenz übrig.

Zusätzlich unabhängig geprüft:

| Inhaltsprüfung | Ergebnis |
|---|---|
| `main#content[role="main"]` einschließlich Start-/Endtag | In beiden Fassungen exakt 42.541 Bytes |
| SHA-256 dieses vollständigen Inhaltsblocks | In beiden Fassungen `9ed47f7fd1544d813a16b0f204b34a20174757b0dd58159646a695b0b052d83f` |
| Sichtbarer Hauptinhalt nach HTML-Tokenisierung | Identisch |
| Links im Hauptinhalt | Jeweils 28; vollständige geordnete `href`-Folge identisch |
| Links in der gesamten Seite | Jeweils 162; genau ein verändertes Ziel, der bezeichnete Menülink |
| Bisherige 19-Asset-Normalisierung | In beiden Fassungen genau 19 Treffer |
| Bisheriger Canonical-Hash | `b696180d20ac97333f54f0bb6fc3dc55481884ac3663d3dcb67a7a3367052a55` |
| Neuer Canonical-Hash nach derselben Normalisierung | `5358fa717d60edcf74d011795bd46b607b7faa78b4833241c23edb249176ce26` |

## Fachlicher Kontext aus amtlichen Quellen

Der unveränderte [BMEIA-Reiseartikel](https://www.bmeia.gv.at/oeb-bern/reise-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag/) behandelt EU-/EWR-/Schweizer Staatsangehörige, getrennte Aufenthaltsbewilligungsfälle und die Visaantragstellung in Bern. Unverändert sind die Abschnitte zu Dokumenten, Terminen, Versicherung, Geldmitteln, Unterkunft, Gebühren und Formularen. Anforderungen an Visaanträge dürfen nicht pauschal als Einreisevorgaben für visumfreie Schweizer Reisende gelesen werden.

Die neu verlinkte amtliche [ID-Austria-Seite](https://www.bmeia.gv.at/oeb-bern/service-fuer-buergerinnen/information-fuer-auslandsoesterreicherinnen-und-auslandsoesterreicher/id-austria) beschreibt digitale Identifizierung und elektronische Dienste sowie die Umstellung von der Handy-Signatur. Das bestätigt die sachliche Zuordnung des geänderten Menülinks zu einem anderen Bürgerdienst. Daraus folgt keine neue Einreise- oder Reisepassanforderung.

Die aktuellen [BMI-Hinweise zu Reisedokumenten](https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/start.html) nennen einen gültigen Personalausweis ausdrücklich auch für EU-, EWR- und Schweizer Staatsangehörige. Diese zusätzliche Kontextprüfung erweitert nicht den vorhandenen Jetnity-Freigabeumfang: Der versionierte CH→AT-Produktfall ist auf gültigen Schweizer Reisepass und direkte Einreise begrenzt. Die hier entschiedene HTML-Differenz verlangt keine neue Passregel; eine vollständige neue Prüfung aller BMI-Regeln war nicht Gegenstand dieses Vergleichs.

## Tatsächliche versionierte Zuordnungen im Repository

Repository-Lesestand: Commit `cb135cdda139e6963789c7f8350ce4a35e46e781`. Die folgenden Aussagen beschreiben die gelesene Implementierung, keine zusätzliche aktuelle DB-Inventur.

| Ebene | Zuordnung | Bedeutung der ermittelten Differenz |
|---|---|---|
| Source-bound Renewal | `scripts/db/official-truth-source-bound-renewal-dev-1/install.sql`: anfänglich genau ein AT-Subject, Staatsangehörigkeit `CH`, `visa`, `passport`, `direct_entry`; drei Quellen einschließlich BMEIA als `independent_official`. | Whole-document-Änderung sperrt den gemeinsamen Quellenbatch weiterhin technisch; die sachliche CH-Visumaussage im Artikel änderte sich nicht. |
| Öffentliche Darstellung | `lib/readiness/official-truth-at-method-v1/at-visitor-display.ts`: CH benötigt exakt BMI-General, BMI-Matrix und Bern; Nicht-CH-Antworten mit Bern werden abgewiesen. | Keine Übertragung der Bern-Belege auf andere Staatsangehörigkeiten. |
| Reiner Offline-Kandidat | `lib/readiness/official-truth-at-method-v1/at-v3-source-program.ts`: Kandidaten behalten das Drei-Originale-Paket, `approved=false`, `importable=false`, `offline_semantic_candidate`. | Auch diese Drei-Quellen-Bindung ist keine Produktfreigabe. |
| Forschungszuordnung, 50 Pässe | `scripts/db/official-truth-at-passport-research-50-dev-1/install.sql`: Bern ist Forschungsquelle für `blank_passport_pages`, `insurance`, `entry_forms`, `financial_means`, `booking_or_travel_document`, `official_actions`. | Alle sechs Sachabschnitte und ihre Links liegen im bytegleichen Hauptinhalt. Die Forschungszellen bleiben unverfügbar. |
| Weitere Rechtsprüfung | `scripts/db/official-truth-at-eu-ch-legal-review-dev-1/install.sql`: 19 EU-/CH-Pässe werden anhand der BMI-Matrix als begrenzte Rechtsprüfbelege erfasst; keine neue Methodenfreigabe oder Kundenpublikation. | Kein Anlass, aus dem fremden Menülink neue Passregeln abzuleiten oder bestehende Freigabegrenzen zu erweitern. |
| Quellenmonitor | `scripts/db/official-truth-at-source-watch-dev-1/install.sql`: Asset-only-Zulassung erfordert alte Bytezahl, genau 19 Treffer und alten Canonical-Hash. | Neue Bytezahl und neuer Canonical-Hash weichen ab. `changed` ist korrekt und darf durch diese Analyse nicht rückwirkend in `unchanged_asset_version_only` umbenannt werden. |

## Aussagegrenzen und konkrete Folgeentscheidung

1. **Fachlicher Review abgeschlossen:** Bei der verglichenen BMEIA-Fassung ist keine AT-Regelkorrektur erforderlich; der Reiseartikel und sämtliche darin verlinkten Ziele sind unverändert.
2. **Betriebszustand unverändert:** Der Befund verleiht keinem Original eine rechtliche Qualifikation, erzeugt keine frischen Fakten und belegt keinen positiven Publisher-Pfad. Vorhandene History, Pins und negative Belege bleiben erhalten.
3. **Ein späterer Quellen-Nachfolger wäre ein gesonderter Schritt:** Er müsste das neue ganze Original samt Herkunft, Quellenqualifikation und Methodenbindung ausdrücklich aufnehmen. Eine breitere automatische Navigation-/HTML-Normalisierung ist durch diesen Einzelvergleich nicht freigegeben.
4. **Beweisgrenze:** Verglichen wurden genau diese zwei erhaltenen HTML-Antworten. Verlinkte PDF-/HTML-Dokumente und externe CSS-/JavaScript-Inhalte wurden nicht in ihren Bytes verglichen; unbekannte Zwischenfassungen und Änderungen anderswo im Rechtssystem werden damit nicht ausgeschlossen.
5. **Production:** Dieser Review enthält keinen Productionzugriff, keine Installation und keine Freigabe. Ein begrenzter späterer Production-Leseauftrag ist getrennt zu definieren.

## Reproduzierbare versionierte Belege

Die [Metadaten](evidence/official-truth-bmeia-restart-20261121/bmeia-input-metadata.json) und die [ausgeführte Dev-Leseabfrage](evidence/official-truth-bmeia-restart-20261121/bmeia-input.READONLY.sql) binden [Original](evidence/official-truth-bmeia-restart-20261121/bmeia-original-20261116.html) und [tatsächliche Antwort](evidence/official-truth-bmeia-restart-20261121/bmeia-observed-batch105-20261121.html). Der separate Quellenwatch-Beleg ist **kein** neuer versiegelter Eintrag im Erneuerungsjournal; für Batch105 wurden in der vorherigen Nachprüfung null solche Journalbindungen bestätigt.

Der [reproduzierbare Vergleich](evidence/official-truth-bmeia-restart-20261121/bmeia-source-delta-compare.py) liest ausschließlich diese lokalen Dateien und schreibt sein JSON nach stdout. Er prüft sämtliche Eingabe-Hashes, die tatsächliche Antwortbindung, den vollständigen Hauptinhalt und alle Links. Das [vollständige Ergebnis](evidence/official-truth-bmeia-restart-20261121/bmeia-source-delta-evidence.json) und die separate [Root-Gegenprüfung](evidence/official-truth-bmeia-restart-20261121/bmeia-root-difference-check.json) sind erhalten. Weder Vergleich noch Bericht ändern Datenbank, Quellenstatus oder Fakten.

Aus dem Repository-Verzeichnis wiederholbar mit:

```sh
python3 docs/evidence/official-truth-bmeia-restart-20261121/bmeia-source-delta-compare.py
```
