# Frischer Production-Nachread nach HTTP-ID-Installation – 22.11.2026

**Beobachtung: 22.11.2026, 12:54:53.145099 Zürich / 11:54:53.145099 UTC.** BG1 ist zu diesem Zeitpunkt wieder `current`, mit neuem natürlichem vollständigem Beleg. Der neue ID-Zähler ist durch sechs echte AT-Abrufe bestätigt. **CH→DE ist weiterhin am historischen Zyklus12 blockiert. AT bleibt „derzeit nicht verfügbar“.**

## Umfang und Belege

Der aktuelle Owner-Auftrag erlaubt einen neuen rein lesenden Nachread von BG1, HTTP-IDs, AT-Transport/Collector und CH→DE sowie die Erklärung fehlender Nachweise. Genau zwei Production-Transaktionen auf `qscbgcdmivbbnzrcyegn` wurden ausgeführt, beide **REPEATABLE READ READ ONLY mit ROLLBACK**, ohne Fehler und ohne Wiederholung. Frühere einmalige Installationsfreigaben wurden nicht wiederverwendet.

| Abfrage | SHA-256 | Tatsächliches Connectorfenster UTC |
| --- | --- | --- |
| [01-metadata.READONLY.sql](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-http-allocator-operational-read-20261122/01-metadata.READONLY.sql) | `95956b80a111dec4dec90bed235c928315324d8017d7a580e67e6e9406d0524c` | 11:47:39.281–11:47:40.107, 826 ms |
| [02-operational.READONLY.sql](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-http-allocator-operational-read-20261122/02-operational.READONLY.sql) | `262de69ee78b9d55e9ef15f5560653c417f92ca220793bf672e103bf3105545c` | 11:54:52.609–11:54:54.678, 2069 ms |

01 prüft nur Metadaten, verfügbare Leserechte und native Funktionshashes.02 bindet den tatsächlich installierten Nachfolger `c847d8573ac8f62c2d163fcec7d8f0bde409574bd9ae7319e0bf97d99eb9c0a4`, die vollständigen bekannten Funktionsverträge und den exakten Katalog, bevor die Daten ausgewertet werden. Maximal drei AT-Batches/neun AT-Zeilen, fünf CH→DE-Zyklen/32 Dispatches, 15 Cron-Zeilen und 65536 Ausgabebytes; keine Response-Körper, Request-Header oder Schlüssel werden ausgegeben.

[Metadaten-Rohbeleg](evidence/official-truth-production-http-allocator-operational-read-20261122/01-execution.json), [operativer Rohbeleg](evidence/official-truth-production-http-allocator-operational-read-20261122/02-execution.json), [Gesamtauswertung](evidence/official-truth-production-http-allocator-operational-read-20261122/runtime-result.json) und [unabhängige Prüfung](evidence/official-truth-production-http-allocator-operational-read-20261122/independent-runtime-review.json) halten tatsächliche Antworten und Grenzen fest. Beide SQL-Dateien wurden unabhängig statisch geprüft; ein nativer lokaler Parser war nicht installiert und wird nicht als gelaufener Test behauptet.

## BG1: wieder verfügbar, natürlich belegt

- Öffentlicher DB-Status: `schema=1,status=current`.
- Generation **1775**, höher als die neue Mindestgeneration1759; exakt **ein** passender vollständiger frischer State-/Run-Beleg.
- Natürlicher Vollbeleg am22.11. um **12:50:00.039728–12:50:05.498673 Zürich**, nach dem Installations-Cutoff11:27:14.042745Zürich.
- Genau eine passende erfolgreiche Cron-Ausführung: Job2, Run25733; geprüfter Befehls-Hash, richtige Datenbank/Rolle und zeitlicher Einschluss des vollständigen Guardlaufs.
- Incident-/Resume-Generation beide108; Frische zum Beobachtungszeitpunkt gültig bis12:55:30Zürich. Auch die vorherigen drei gelesenen Guardläufe endeten `complete`.

Dies bestätigt natürliche Erholung und Frische **zum angegebenen Beobachtungszeitpunkt**. Es wurde kein manuelles Audit oder Owner-Schritt ausgelöst und kein unbegrenzt gültiger Grünstatus behauptet. Der GitHub-E-Mail-Alarm wurde hier nicht zusätzlich geprüft.

## ID-Zähler und AT: echter Transport erfolgreich

| Natürlicher Batch | Anfrage Zürich | Tatsächliche IDs | HTTP-/Collector-Nachweis |
| --- | --- | --- | --- |
| 601 | 11:35:00.028339 | 1236,1237,1238 | Alle drei HTTP200; Collector um11:40; Hashes/Größen/Zeiten passend |
| 602 | 12:25:00.049955 | 1239,1240,1241 | Alle drei HTTP200; Collector um12:30; Hashes/Größen/Zeiten passend |

Sechs logische Requests haben sechs verschiedene IDs; keine Kollision zwischen den beobachteten AT-/CH→DE-Request-Ledgern und kein neuer Request unter1236. Sechs vorhandene Responses haben ebenfalls sechs verschiedene IDs. Die Queue war leer. Die eigene Sequenz ist LOGGED, `last_value=1241,is_called=true`. Dieselbe ID in Request, Response und Collector ist die gewünschte Referenz und wurde nicht fälschlich als Duplikat gezählt.

Bei allen sechs Abrufen: `timed_out=false`, kein Fehler, korrekter HTML-MIME-Typ, gültige Größe und keine der vom Collector abgewehrten Bot-/Zugriffsfehlerseiten. Der aus dem **tatsächlichen Response-Inhalt** in der Datenbank neu berechnete SHA-256 stimmt mit dem Collector-Beleg überein; Request→Response→Collector-Zeitfolge und eindeutige Response-Zuordnung passen. Beide vollständigen Batches enthalten genau die drei gepinnten Quellen.

BMI-General und BMI-Matrix sind in beiden neuen Batches `unchanged_exact`. BMEIA ist in beiden `changed`, bei erfolgreichem HTTP-/Collector-Transport. Die drei alten `unavailable`-Belege aus Batch220 bleiben erhalten; fehlende alte Responses werden nicht als neu entstandene HTTP-Fehler ausgegeben.

### Warum AT trotzdem unverfügbar bleibt

Alle drei Originale sind vorhanden und ihre tatsächlichen Körperhashes stimmen mit den gespeicherten Hashes überein. Die Quellen bleiben `research_only=true,source_qualified=false`; alle drei Originale haben weiterhin `legal_source_approved=false,customer_rule_approved=false`. Es gibt keine seit der Installation neu erzeugten AT-Fakten und aktuell keinen unexpired AT-Fakt. Der funktionierende Transport erteilt keine Quellenfreigabe.

Die aktuelle BMEIA-Antwort hat exakt **172428Bytes**, SHA-256 **`2521a95cc70490decb12051b28f1e5d208b9429ffb589e2491b34ca110f62cbe`**. Sie entspricht damit bytegenau der bereits [am21.11. fachlich geprüften Fassung](OFFICIAL_TRUTH_BMEIA_FACHENTSCHEIDUNG_2026-11-21.md): **keine Einreise-/Pass-/Visaregel geändert**, nur19 Asset-Versionsparameter und ein ID-Austria-Menülink. Der frühere Review ist über seine [originalen Metadaten](evidence/official-truth-bmeia-restart-20261121/bmeia-input-metadata.json) gebunden. Der Whole-document-Monitor meldet nach seinem bestehenden Vertrag dennoch korrekt `changed`; dieser Status wurde nicht umgeschrieben.

**Nächster AT-Schritt:** Einen getrennten geschützten Quellen-Nachfolger samt Original-/Quellenqualifikation und Methodenbindung vorbereiten. Dieselbe bereits geprüfte Fassung muss nicht allein wegen ihres identischen Hashes erneut inhaltlich verglichen werden. Eine Änderung von Pins/Freigaben oder ein positiver Erneuerungslauf benötigt das eigene genaue Production-Paket und Go.

## CH→DE: alter terminaler Zyklus blockiert weiterhin

Der Scheduler ist aktiviert und aktuell beobachtet, meldet aber **`operator_review_required`**. Es gibt einen blockierten und keinen aktiven Zyklus. Betroffen ist **Zyklus12 vom16.11.2026**, Phase `resume`, acht ausgeschöpfte Phasenversuche, `last_status=retry_budget_exhausted`, `published=0`.

Die unverändert vorhandenen verarbeiteten Dispatch-Belege zeigen einen Start mit HTTP200/`queued` und acht Fortsetzungen mit HTTP503: siebenmal `unresolved`, einmal `unavailable`. Alle neun Dispatches sind verarbeitet; kein HTTP-Ergebnis wartet auf Einsammlung. Seit der ID-Installation gibt es **keinen neuen CH→DE-Dispatch, keinen neuen erfolgreichen Abschluss, keine neue Projektion und aktuell keine gültige öffentliche Projektion**. Frühere veröffentlichte Zyklen8–11 sind historische Erfolge und kein Abschluss von Zyklus12.

BG1 ist frisch verfügbar, die Methode ist `approved`, und die gelesenen Kontingente zeigen64 verbleibende Starts/255 Operationen. Die jetzige Sperre folgt aus dem terminalen Altzyklus; sie wird durch den reparierten ID-Zähler nicht aufgehoben. Zusätzlich ist **eine abgelaufene Research-Lease** gezählt. Diese Abfrage verknüpft sie nicht mit Zyklus12 und rekonstruiert nicht die tiefere Ursache jedes damaligen503. Die alten HTTP-Response-Körper sind nicht mehr vorhanden; die historischen Outcomes stammen aus den verarbeiteten Scheduler-Belegen.

**Nächster CH→DE-Schritt:** Laut [bestehendem Production-Prüfpaket §6](OFFICIAL_TRUTH_PRODUCTION_REVIEW_PACKAGE_2026-11-21.md) fehlt ein **Production-spezifischer, exakt an Zyklus12 gebundener geschützter Abschluss-/Wiederaufnahme-Nachfolger**. Der bereits abgeschlossene Dev-Cycle5-v6/v7-Pfad dient als geprüftes Muster, nicht als Freigabe für diesen anderen Datensatz. Das Production-Paket ist separat vorzubereiten und zu testen; alte Zyklen, IDs, Quoten und Historien bleiben erhalten. Erst danach folgt das eigene genaue Production-Go und gegebenenfalls ein konkret vorbereiteter persönlicher AAL2-Schritt. Kein Reset und kein neuer Zyklus wurden ausgelöst.

## Abschluss und unveränderte Grenzen

Dieser Auftrag hat ausschließlich gelesen. **Keine Production-Änderung, kein HTTP-/Quellenabruf, kein Audit-/Publisher-/Owner-Schritt, keine Datei20/30/40/50-Wiederholung, keine Rollen-/Rechte-/Login-/2FA-Änderung, keine neuen Kosten und keine Veröffentlichung.** Die beobachteten Abrufe und Guardläufe stammen aus bereits bestehenden natürlichen Prozessen.

Die beiden Reads und ihre Antworten werden zusammen mit der unabhängigen Prüfung im [Ergebnismanifest](evidence/official-truth-production-http-allocator-operational-read-20261122/execution-manifest.json) gebunden. Der [vorherige Gesamtplan](evidence/official-truth-production-http-allocator-operational-read-20261122/overall-plan-before-operational-read-fc30e160.md) bleibt bytegleich erhalten. Die nächsten genannten Pakete wurden in diesem Leseauftrag weder implementiert noch ausgeführt.
