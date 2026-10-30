# Unified Workspace 1 – freigegebener Darstellungsumbau

Status: Umsetzung auf eigener Arbeitskopie; keine Live-Freigabe. Basis: main
`8e667661b490758b25bdd5be720421cea33fda9c`, live am 30.10.2026 geprüft.
Branch: `codex/unified-workspace-navigation`.

## Auftrag und Zuständigkeit

Der Product Owner hat im Work/Codex-Chat den gemeinsamen Konto-/Reiserahmen
mit einklappbarer grüner Glas-Seitenleiste und schmalem Header freigegeben und
am 30.10.2026 ausdrücklich diese Umsetzung beauftragt. Dieser konkrete Auftrag
ersetzt für diesen Branch die allgemeine Cursor-Writer-Vorgabe. Kein zweiter
Writer. Technical Lead behält unabhängige Abnahme, Ready, Merge und Deployment.
Die zuvor gestoppte Sites-Veröffentlichung bleibt gestoppt.

### Fortsetzung und Review, 30.10.2026

Der Product Owner hat diesen Work/Codex-Chat inzwischen ausdrücklich mit der
Technical-Lead-Rolle für diesen Workspace-Umbau beauftragt. Der Root-Agent bleibt
einziger Writer. Zwei getrennte, read-only Reviewer prüfen Quellcode/A11y sowie
Erhalt/Überschneidung mit #1082; ihre Befunde sind keine Selbstfreigabe des Writers.
MULTI_AGENT gilt ausschliesslich für diese Review-Lanes. Anbieterarbeiten bleiben
bei ihren bisherigen Verantwortlichen. Der Review-Auftrag steht zusätzlich in
[PR #1092](https://github.com/Jetnity/jetnity/pull/1092#issuecomment-6511963252).

Zulässige Nacharbeit: die im unabhängigen Review gefundenen Darstellungs-, Fokus-
und Navigationsregressionen im bestehenden Branch beheben und neu prüfen. Eine
Anbindung der Vorschau an die vorhandene Testdatenbank ist separat angefragt,
aber bei Erstellung dieses Nachtrags noch nicht freigegeben oder vorgenommen.

## Ziel und Grenzen

Homepage bleibt unverändert. Reiseplanung: Übersicht, Reiseplan, Organisieren,
Vorbereitung. Persönlicher Bereich: Meine Reisen, Deine Welt, Reisende,
Einstellungen. Reise ändern und Reisebegleiter im Header der geöffneten Reise.
Neue Reise und Kontomenü oben rechts; mobile Navigation eigenständig mit
beschriftetem Menü und Reisebereichen. Tooltip auch bei Tastaturfokus.

Nur Darstellung/Navigation. Kein neues Reisemodell, keine Migration, keine
Auth-/RLS-/API-Änderung, keine Anbieteraktivierung oder Konfigurationsänderung.
Keine zusätzlichen Bibliotheken, laufenden Kosten oder Modell-/Provideraufrufe.
Geschäftslogik, manuelle und intelligente Planung, Jetzt wichtig, gespeicherte
Reisen, Reiseprüfung, Anbieter-Opt-in und sämtliche Kontofunktionen bleiben.

## Geplante Dateien und Architektur

- `components/workspace/`: gemeinsamer Rahmen, Navigationsziele, Slots für die
  existierenden Reise-Handler; keine Kopie des fachlichen Workspace-Zustands.
- Public-/Account-Layout: Rahmen nur für Reise-/Konto-/Planen-Routen.
- `TripWorkspace`: vorhandene Navigation und Aktionen an neue Plätze projizieren;
  Detailzustand, Verlauf, Fokus, Readiness und lazy Providerflächen weiterverwenden.
- Audit und Dokumentation: isolierter lokaler Browser, synthetische Gastdaten,
  beide Planungswege, schmale Geräte und Tastatur/Textvergrösserung.

## Erhaltungsmatrix

| Bisher | Neuer Zugang | Zu prüfender Erhalt |
|---|---|---|
| Homepage | unverändert | öffentliche Navbar/Footer |
| Reise planen | Header / vorhandene Homepage-CTA | beide vollständigen Formulare, Entwurf vor Speichern, Gastschutz |
| Reiseübersicht | Reiseplanung → Übersicht | Jetzt wichtig inklusive weiterer Gruppen, Reise prüfen, Ziele, Bereichslücken |
| Reiseplan | Reiseplanung → Reiseplan | Tage/Etappen, Hin-/Rückreise, Wiederholungen, Details, Zurück/Deep Links |
| Organisieren | Reiseplanung → Organisieren | Flüge, Unterkunft, Aktivitäten, Mobilität/Mietwagen, unveränderte Opt-ins |
| Vorbereitung | Reiseplanung → Vorbereitung | Reisende, Dokumente, offizielle/Sicherheits-/Saisoninformationen |
| Reise ändern / Begleiter | Reise-Header | originale Handler, Referenzen und Vorschau-/Freigabegrenzen |
| Kontoübersicht | Kontomenü → Konto | nächste Reise, Buchungen, Welt, Datenfenster bleiben erreichbar |
| Reisen/Welt/Reisende/Einstellungen | Mein Bereich | bestehende Routen, Lesen/Schreiben und Fehlerzustände |
| Security/Export/Konto löschen | bestehende Einstellungen | keine Funktionsänderung |
| Footerlinks / Abmelden | Kontomenü + Quellenzeile | Kontakt, Pro, Recht, bestätigtes Abmelden, GeoNames-Lizenz |

## Bekannte parallele Arbeit und Gates

PR #1082 (U1-C, `f2ff4928…`) ist offen und überschneidet sich mit der
Reise-Darstellung. Nicht ungeprüft übernehmen; TL muss beide Diffs vor einem
Merge abgleichen. #1084/#1086/#1079/#1091 bleiben eigenständige Anbieterarbeiten.
STOP-/HOLD-Gates aus #751, #748, #968, #1073, #917/#985 bleiben unverändert.
Persönliches Browserprofil, Kontoreisen und Production-Schreibtests ausgeschlossen.

## Prüfplan

Typecheck, Lint, zentrale Tests, Build und Hygiene-Checks. Isolierter Browser:
Desktop mit offener/geschlossener Leiste, 320/390px, Tablet, Tastatur, 200 % Text,
Menü-Fokus/Rückkehr, Deep Links/Browser-Zurück, synthetische Mehrort-Gastreise,
beide Planungswege und keine automatischen Anbieterrequests. Auditflächen sind
als synthetisch auszuweisen und ersetzen keine echte Konto-/Preview-Abnahme.
Ergebnisse und verbleibende Einschränkungen in separatem Report/Handoff.
