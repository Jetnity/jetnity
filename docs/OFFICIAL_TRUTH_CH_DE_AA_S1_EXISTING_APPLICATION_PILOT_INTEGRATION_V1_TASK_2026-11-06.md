# CH→DE – bestehender Application-Pilot mit AA/S1 Tabellen-Semantik (synthetisch) V1

Stand: 2026-11-06, Europe/Zurich. Parent [#917](https://github.com/Jetnity/jetnity/issues/917), nach [#1128](https://github.com/Jetnity/jetnity/pull/1128). Start-main: `f96df4ed91aada41b2b635813396749c4ff44096`, Modus NORMAL.

## Wertschöpfung statt erneuter Grundsatzprüfung

Bereits vorhanden: Auth-/Reise-Scope, gebundener CH-Ordinary-Pass, komplette direkte CH→DE-Route, befristeter Application-Grant und die durchgehende aktuelle `evaluateApplicationPilot` → Server-Source → Evidence/Review → Trusted Fact → kanonische Rule → `requirementsFuerReise` → `OfficialEvaluation[]`-Kette. Vorher stammte das synthetische Visa-Faktum immer aus einem Stub, der eine feste Klartextzeile akzeptierte.

**Dieser Test-Slice verbindet den exakt für AA/S1 gebauten HTML-Tabellenparser mit dem existierenden End-to-End-Test des echten Production-Evaluators.** Die Testquelle ist ausdrücklich kein amtliches Original: ein vollständig synthetisches HTML-Dokument auf `application-pilot.example`, mit synthetischem Content-Item/Profil und isoliert injiziertem Test-Extraktor. Die Quelle enthält eine eindeutige `Schweiz | Nein`-Zeile und fake Nachbarländer. `match` und `extract` des **nur lokal injizierten** Extraktors hängen beide vom vorhandenen parse5-Ergebnis ab, nicht mehr vom festen `fixtureBody`-Gleichheitsvergleich. Das positive Resultat wird nur durch echte Production-`evaluateApplicationPilot`-Logik unter isoliert ausgetauschten Ports erzeugt.

## Grenzen der positiven Probe und Negativfälle

- Vollständiges Test-HTML → synthetisch `visa not_required` für eine explizit ausgewählte CH-Person/Pass-Option; alle anderen `OfficialEvaluation[]`-Zellen bleiben unknown. Das ist kein reales deutsches Visumsrecht.
- `Ja` statt `Nein`, `Nein (1)`, doppelte/konfligierende Schweizer Zeile, veränderte Spaltenüberschrift, verstecktes Label, doppelte Überschrift → **kein** positives Visa-Ergebnis.
- Bereits vorhandene Fail-Closed-Prüfungen für abgeschnittene/zu grosse HTTP-Antwort, Timeout, zurückgezogenen Grant, falsches Konto, geänderte Reiseversion, fehlenden/gesperrten Vertrag bleiben unverändert.
- Aktuelle Source-Identity und inhaltliche Visa-Semantik sind zwei getrennte Prüfschichten: ein synthetisch korrekt identifiziertes HTML mit einer rechtlich **widersprüchlichen Zeile** muss im Extraktor blockieren.
- Weder die Rohquelle noch der Parsertext gelangen als `OfficialEvaluation[]`-Inhalt an den Nutzer.

## Exakt erlaubte Dateien

1. `scripts/official-truth-ch-de-application-pilot-1/fixtures.ts` – lediglich synthetische Source- und Extractor-Testports.
2. `lib/readiness/official-truth-ch-de-application-pilot-1/application.test.ts` – integrierte echte Evaluator- und Negativfälle.
3. Dieses versionierte Dokument.

**Unverändert bleiben** `applicationPilotEnabled()=false`, leeres ApplicationContract-Register, leeres echtes Trusted-Extractor-Register, `requirementsProviderAus()=null`, Trip-Workspace Runtime, Supabase-Migrations-/Berechtigungs- und Public API-Contracts. Keine neue Quelle, reale URL, echte HTTP-Abfrage, Datenbankschreiboperation, Provider- oder Production-Freigabe.

## Abnahme / externe Voraussetzungen

Draft bis exakte GitHub-Head-CI, technische Diff-Prüfung und normale TL-Freigabe bestanden sind. Nur synthetischer Beleg; niemals als echte Accepted Evidence oder Deutsche-Einreisegarantie ausgeben. Bestehender Source-Custody-/Rechts-/Origin-Grants-/Dev-DB-Sicherheitsnachweis bleibt vor realer Visa-Auskunft zwingend. Der Supportfall zu #917 ist laut Owner bereits **VERSENDET**, Antwort noch offen. Die konkret blockierte Stage1-Host-SQL-Readback-Aktion wird nicht wiederholt oder an Grok delegiert; Stage2 NOT_ATTEMPTED. #985 Protocol3 und #937 weiter HOLD. Kein Hosted Supabase SQL, kein unautorisierter Live-Source-GET, keine Secrets, kein Provider-Enable, keine Production Migration.

**Ziel der nächsten verantwortbaren technischen Arbeit:** Echte amtliche Quelle mit exakt gebundener Vollantwort/Identität und unabhängig geprüfter Anwendbarkeit im bestehenden Server-Owned-Flow qualifizieren. Eine erfolgreiche synthetische Anwendung allein aktiviert keine Rechtsregel.
