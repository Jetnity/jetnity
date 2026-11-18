# Isolierte KI-Development-Vorschau – 18.11.2026

Auftrag: Den vorhandenen lokalen OpenAI-Testschlüssel sicher mit einer isolierten Vercel-Vorschau verbinden. Vorher Datenbanktrennung und Kostenschutz prüfen. Keine Production-Änderungen und keine kostenpflichtigen Modellaufrufe.

## Abgrenzung

- Eigener Branch: `feat/ki-dev-isolated-20261118`; Basis `f0f376fa2a65ff2276b665d2b549ec75ae9c5ae5`.
- Vercel-Projekt `jetnity-app`; Variablen ausschließlich für Preview und diesen Branch. Keine globalen Preview-Variablen werden verändert.
- Supabase-Development-Branch `develop`, Ref `yfvbxvijcorffwxbxahl`. Production-Ref `qscbgcdmivbbnzrcyegn` ist ausdrücklich ausgeschlossen.
- OpenAI-Projekt `Jetnity Development`, bestehender Testschlüssel `Jetnity Dev KI Test 2026-11`, 30 Tage Laufzeit. Kein Schlüsselwert in Dokumentation, Git oder Logs.
- `JETNITY_MODELL_AKTIV=false`; keine Modellaktivierung, kein Live-Modelltest, keine Promotion auf jetnity.com.
- Keine Anwendungscode-, Schema-, RLS- oder Migrationsänderungen. Andere Chats, Branches und PR #1238 bleiben unangetastet.

## Nachweise vor Verbindung

- Supabase-Branch ist aktiv und kein Default-/Production-Branch.
- Kostenfunktionen und `model_usage` existieren auf Development; RLS aktiv. Reservierung nur für `service_role`, nicht `anon` oder `authenticated`.
- 211 lokale Tests bestanden (44 Suites): Modellkonfiguration, Preise, Antworten, Datenbankgrenzen, Reisevorschlag, Reiseänderung und Reisebegleiter. Netzwerkzugriffe sind in diesen Tests ersetzt.
- Transaktionaler Development-Test bestanden: jeweils letzter erlaubter und erster gesperrter Aufruf bei 4/Stunde, 8/Tag je Kennung, 24/Tag für Gäste, 38/Tag insgesamt sowie 3 USD/Tag. Unbekanntes Modell und anonyme Rolle werden abgewiesen. Testdaten vollständig zurückgerollt; keine Modellaufrufe. Gleichzeitigkeit wurde in diesem Lauf nicht separat gemessen.
- Der Development-Dienstschlüssel wurde gegen ausschließlich den Development-RPC geprüft: unbekanntes Modell liefert `22023`, ohne Reservierung oder Modellaufruf.
- OpenAI-Projektlimit im angemeldeten Dashboard geprüft: 5 USD/Monat, „Limit enforced“, bisher 0 USD. Das ist eine bestätigte Einstellung, kein Test durch Erreichen des Limits.

## Bereitstellung

Vercel-Vorschau und abschließende Nachweise werden nach erfolgreichem Build in einem lokalen Statusbericht dokumentiert. Die KI bleibt bis zur ausdrücklichen Freigabe kostenpflichtiger Tests aus.
