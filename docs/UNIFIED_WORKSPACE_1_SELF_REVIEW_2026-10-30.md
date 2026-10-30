# Unified Workspace 1 – Selbstprüfung

> **Aktueller visueller Nachtrag, 30.10.2026:** Die ursprüngliche Umsetzung
> entsprach dem Entwurf in den Inhaltsflächen noch nicht ausreichend. Diese
> Nacharbeit ist im [visuellen Abgleich](UNIFIED_WORKSPACE_1_VISUAL_ALIGNMENT_2026-10-30.md)
> mit aktuellem Codeumfang, Nachprüfungen und verbleibenden Gates dokumentiert.
> Frühere Ergebnisse unten bleiben historische Belege. PR #1092 bleibt Draft.

Stand: 30.10.2026. Dies ist die Prüfung des implementierenden Agents,
**keine unabhängige technische Abnahme**.

## Geprüfte Änderungsgrenzen

- Kein API-, Auth-, Datenbank-, Readiness-, Provider-, Vertrags- oder
  Lockfile-Diff. Keine neue Abhängigkeit, Umgebungsdatei oder Zugangsdaten.
- PublicChrome verwendet ausserhalb der Reise-/Planungsseiten die vorherige
  öffentliche Navigation und den bisherigen Footer. Konto-Metadaten bleiben
  `noindex, nofollow`; Seiten behalten ihre eigenen Zugriffsprüfungen.
- TripWorkspace behält alle fachlichen Zustände und Handler. Portale verschieben
  nur die vier Modus-Schaltflächen, Titel und bestehenden Aktionen.
- Die ursprüngliche Navigation bleibt ausserhalb des neuen Rahmens als Fallback
  nutzbar, insbesondere in vorhandenen Tests/Einbettungen.
- FooterSitzung erhält ausschliesslich einen Darstellungsparameter. Sein
  Auth-Lesen, Aktualisieren, Fehler-/Pending-Verhalten und Sign-out-Handler
  bleiben bestehen. Es wird kein zweiter Logout-Weg erfunden.
- Die alte Kontoübersicht wird nicht gelöscht, sondern über die bestehenden
  sitzungsabhängigen Konto-Links weiterhin erreichbar gehalten.
- Kein zweiter Reise-/Kontodatenspeicher. Kollapszustand ist nur lokaler
  Darstellungszustand und wird nicht in Kontodaten persistiert.
- Reduzierte Transparenz und Forced Colors besitzen deckende Fallbacks.
  Normale Schaltflächen bleiben beschriftet; eingeklappte Symbole besitzen
  zugängliche Namen und zusätzlich Hover-/Fokus-Tooltips.
- Mobile Drawer: Escape, Tab-Schleife, inaktiver Hintergrund, Scroll-Sperre und
  Fokusrückkehr. Resize-Observer und Listener werden beim Unmount entfernt;
  veränderte CSS-Offsets werden zurückgesetzt.

## Im lokalen Lauf korrigiert

- Header auf kleinen Geräten in bedarfsgerechte Zeilen gegliedert; Reisetitel
  erhält eine eigene Zeile. Menübeschriftung und vorhandener Gast-CTA-Text bleiben
  vollständig sichtbar. Bei 200 % Text darf der Header höher werden und scrollt mit.
- Bei 200 % Text schmale Aktionsgruppen und Navigation in den normalen Fluss
  gesetzt; Schaltflächen-Icons bleiben in ihren Grenzen.
- Tooltip bleibt beim Wechsel des Mauszeigers auf den Tooltip sichtbar und kann
  mit Escape geschlossen werden.
- Menü schliesst bei allen Navigationslinks; Fokus kehrt nach dem Reise-Dialog
  zum ursprünglichen Auslöser zurück.
- Bestehender Skip-Link-Quelltest auf den neuen Besitzer des Inhaltsziels
  angepasst. Die Sicherheits-Inventarprüfung wurde nicht gelockert; das lokale
  Logo benötigt keinen neuen Next-Image-Optimizer-Eintrag.

## Verbleibende Grenzen

Nach unabhängigem Review auf `690c9183` wurden weitere Fehler korrigiert:
Kontomenü über der Rücksprungleiste, Umbruch/Position bei 200 % Text,
Ziel-Fokus nach Tastaturnavigation sowie Erhalt von „Nach oben“ inklusive Abstand
zur mobilen Navigation. Der neue Voll-App-Lauf besteht aus 19 bestehenden und
6 ergänzenden Browserprüfungen, alle PASS; 52 gezielte Tests bestanden zusätzlich.
Die unabhängige erneute Prüfung auf `1117b1cd` ist abgeschlossen: 6/6 Regressionen,
3/3 native Zoomprüfungen und 35/35 gezielte Tests bestanden; keine offenen P0–P3
im geprüften Code-/Gastumfang. Die geschützte Vorschau besteht zehn eindeutige
Gast-/UI-Prüfungen. Angemeldete Kontotests warten auf ein develop-Testkonto. Einzelheiten
und Grenzen im [Review-Nachtrag](UNIFIED_WORKSPACE_1_REVIEW_2026-10-30.md).

Im ersten Implementierungslauf bestanden alle 19 gezielten Browserprüfungen und 124 gezielten Tests; der
separate vorhandene Route-/Detail-Browserlauf bestand mit 17/17. Build,
Typecheck, Lint und Hygieneprüfungen bestanden. Der Gesamt-Testlauf ist wegen
der im [Report](UNIFIED_WORKSPACE_1_REPORT_2026-10-30.md) einzeln beschriebenen
13 Fehlschläge **nicht grün**.

Echter Chrome-Zoom 200 % besteht separat mit 3/3 Szenarien. Die zweite Review-
Runde führte ausserdem zur Korrektur des Detail-Rückkehrfokus und des Drawers
bei Browser-Zurück/Vorwärts. Angemeldete Kontoreisen, Reisebegleiter-Backend,
VoiceOver und physische Mobilprüfung bleiben offen. Der Code erhält diese Wege, aber daraus
wird kein Browser-PASS abgeleitet. Die Überschneidung mit PR #1082 erfordert
eine Entscheidung des Technical Lead vor Integration. Keine Merge-/Livefreigabe.
