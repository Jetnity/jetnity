# Jetnity Copilot Pro – automatische KI-Inhaltsprüfung für Official Truth

**Product Owner Decision:** 18. November 2026  
**Verbindlicher GitHub-Entscheid:** [#1232](https://github.com/Jetnity/jetnity/issues/1232)  
**Status:** Genehmigte **Zielarchitektur**, **nicht** aktivierte KI-Laufzeit oder Production-Freigabe.  
**Bestehende Vorgaben:** [Copilot-Pro-Autonomie #741](https://github.com/Jetnity/jetnity/issues/741), [kanonische Direktion #744](https://github.com/Jetnity/jetnity/issues/744), [Einreiseumfang #294](https://github.com/Jetnity/jetnity/issues/294). Diese Entscheidung ergänzt sie, ohne bestehende Freigabe- und Sicherheitsgrenzen zu ersetzen.

## Bindende Architekturentscheidung

**Ein gemeinsamer Prozess für alle 206 Reiseziele und die 50 priorisierten Staatsangehörigkeiten, mit getrennten Pass-, Dokument-, Routen- und Themenregeln.** Die KI unterstützt die Analyse; die einzige amtliche Wahrheit bleibt Jetnitys bestehende deterministische Official-Truth-/MA1-/BG1-Evidence- und Freigabekette. Kein eigener zweiter »KI-Wahrheitsdienst«.

| Komponente | Verantwortung | Keine Befugnis |
| --- | --- | --- |
| **Jetnity Copilot Pro** | Überwacht Aufträge, priorisiert, dedupliziert, delegiert Analyse, erstellt Prüf- und Änderungsberichte, triggert nur durch genehmigte Auto-Policy zugelassene Freigabeversuche | Keine eigene ungeprüfte Veröffentlichung; kein stiller Methoden-/Rollenwechsel |
| **Jetnity-Quellenmonitor** | Holt ausschließlich registrierte amtliche Originalquellen unter Jetnity-Custody ab; speichert URL, Quellenidentität, `retrievedAt`, Rohtext, Body-Hash, Vorgängerversion und Prüfspur | Keine automatische juristische Aussage aus einem HTTP-200 oder SHA-Unterschied |
| **OpenAI (primärer KI-Analyst)** | Vergleicht nur die von Jetnity bereitgestellten amtlichen Versionen; extrahiert streng strukturiertes **Candidate Evidence** mit exakter Belegstelle, Thema, Pass-/Zielland-/Routen-/Dokumentumfang, Datums-/Gebühren-/Formularangaben und Unsicherheiten | Kein Rechtsurteil als Official Truth, kein selbständiger DB-Schreibzugriff |
| **Grok / xAI (unabhängiger Challenger)** | Prüft **risikobasiert** Änderungen mit hoher Auswirkung, Widerspruch, unklarer Formulierung oder unvollständiger Erstrecherche; liefert abweichende Interpretationen und Gegenbelege | Kein Ersatzzertifikat: Zwei zustimmende KI-Modelle sind kein amtlicher Beweis |
| **Jetnity Official-Truth-Gates** | Prüfen amtliche Originalbelege, Provenienz/Hash/Version, Zeit- und Geltungsbereich, Gegenquellen soweit verfügbar, Konflikte, bestehende Methode, Berechtigungen, MA1/BG1, versionierte Auto-Acceptance-Policy, Audit und Nachfolger | Kein Trust-by-LLM und keine Freigabe unbekannter oder widersprüchlicher Regeln |

**Grok-Differenzierung:** Der bisherige separate **Jetnity Guardian/Grok Bot** ist ein unabhängiger Prüfer und **nicht** gleichbedeutend mit einem in Copilot Pro integrierten xAI-API-Adapter. Die Verbindung bedarf eigener, späterer Provider-/Kostenfreigabe. Es werden keine Grok- oder OpenAI-Modelle allein wegen dieses Entscheids aktiviert.

## Automatischer Regelkreislauf

1. **Amtliche Quelle erfasst:** Nur der registrierte Server-Retriever legt einen versionierten Originalbeleg in der append-only Quellenhistorie ab. Ein Quellen-Body-Hash darf nicht als „Gesetz geändert“ interpretiert werden.
2. **Quelle verifiziert unverändert:** Bereits **separat** akzeptierte, pass-/dokument-/routenbezogene Fakten dürfen ohne KI-Aufruf verlängert werden, falls die bisher genehmigte Methode, Quellfrische, gesetzliche Gültigkeit, unveränderte Quelle, MA1/BG1 und alle Lease-Grenzen dies erlauben.
3. **Quelle verändert oder widersprüchlich:** Betroffene frühere Angaben werden **fail-closed**; OpenAI erzeugt nur strukturiertes Candidate Evidence samt präzisen Belegstellen. Fehler, Ausfälle, abweichende HTML-/Quellstrukturen oder unbekannte Bedeutung ergeben keine positive Regel.
4. **Risikogesteuerte zweite Kontrolle:** Kritische, neue, widersprüchliche oder unklare Fälle können an den unabhängig betriebenen Grok-Adapter und, soweit verfügbar, eine zweite **amtliche** Quelle gehen. Der unabhängige amtliche Gegenbeleg ist nicht durch Grok ersetzbar.
5. **Deterministische Zulassung:** Jetnity prüft die exakten Originale erneut und verwaltet den Nachfolger: Genehmigte, hinreichend eng gefasste Auto-Acceptance-Policy erlaubt Copilot Pro nur das **Auslösen** der geschützten Promotion. Alles andere bleibt `derzeit nicht verfügbar` und geht an Owner/Eskalations-Queue, statt sich selbst freizugeben.
6. **Öffentliche Abfrage:** Der bestehende Official-Truth-Engine stellt ausschließlich gültige akzeptierte Fakten mit Quelle, Prüfdatum, Links, Änderungen und Haftungshinweis dar. Reisende mit mehreren Pässen werden nicht pauschal zusammengelegt.

## Verbindliche Sicherheits- und Kostenregeln

- Nur registrierte amtliche HTTPS-Primärquellen des Zielstaats. Zusätzliche amtliche Gegenprüfung, wenn verfügbar. Uneindeutige Herkunft oder widersprüchliche Rechtslage sperrt.
- **Datenminimierung:** Keine Passnummer, MRZ, Scans, biometrischen Daten, Namen, Gesundheitsakten, Konto-/Reise-/Traveller-IDs an ein Modell oder in eine globale Research-Faktenbank. Nur nötiger nicht-persönlicher Länder-, Dokument-, Routen- und Datumsbezug.
- Untrusted HTML, Modell-Ausgaben, externe Hinweise oder Seitenprompts können weder Tool-, Schreib- noch Source-Registry-Berechtigungen erteilen; Ausgaben benötigen feste Schemas, Belegbindung, Text-/Kosten-/Zeitlimits.
- **Kosten/Provider:** Kein KI-Aufruf bei unverändert bestätigter Quelle; teure Grok-Doppelprüfung nur bei begründetem Risiko. Serverseitiger Kill-Switch, harte Budget- und Tokenkontingente **vor** Aufruf, Rate-Limits, Abbruchzeiten, kontrollierte Fehlerzustände. Providerkeys, zusätzliche Kosten und echte Production-Aktivierung ausschließlich nach ausdrücklicher Owner-Freigabe.
- Ereignisse und Freigaben bleiben append-only und prüfbar; Recovery/Rollback nur über den geschützten Prozess. Merges und Production bleiben Owner-Gates; kein stillschweigendes AAL2-/Rollen-Upgrade.

## Implementierungsstand und nächster Schritt (18.11.2026)

Die vorhandene **OpenAI-Reiseplanungsanbindung** ist ein separater, kostenkontrollierter und nicht automatisch für Official Truth freigegebener Modellweg. Der Grok-Research-Intake und Guardian sind bisher unabhängige **Research-/Challenger**-Mechanismen, nicht ein aktiver xAI-Releasebot.

- 206 Ziele × 50 Pässe existieren als **private RESEARCH_ONLY**-Prüfmatrix. Einzelne offizielle Quellenmonitore und eine gemeinsame private Quellen-Review-Queue sind in Dev vorhanden; siehe [#1228](https://github.com/Jetnity/jetnity/pull/1228).
- Für CH→AT existiert eine **separate** produktive geschützte Quellenerneuerung. Daraus folgt **keine** Freigabe aller AT-Pässe oder der anderen Ziele.
- **Nicht fertig:** Gemeinsamer Copilot-Pro-Automatik-Operator, semantischer OpenAI-Prüfadapter, unabhängiger xAI-Adapter, beleggebundene LLM-Quarantäne und sichere automatische Inhalts-Neufreigabe für alle Länder/Pässe.

**Nächste Implementierungsreihenfolge:** (A) amtliche Quellen und Änderungsbelege für AT/IT/FR/ES/PT sowie weitere Zielländer systematisch anbinden; (B) OpenAI-Candidate-Extractor zunächst nur als kostengeschlossene Dev-Fixture mit deterministischen Negativtests; (C) unabhängiger Grok-Review-Adapter; (D) eng begrenzte versionierte Auto-Acceptance-Policy mit nachvollziehbarer Owner-Eskalation; (E) gesonderte Owner-Freigaben für echte Anbieteraufrufe, Kosten und Production.

**Diese Datei ist eine Architekturentscheidung, keine Runtime-Implementierung, kein API-Key-Auftrag und keine Freigabe kostenpflichtiger Dienste.**
