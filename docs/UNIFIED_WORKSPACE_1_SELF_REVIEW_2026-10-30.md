# Unified Workspace 1 – Selbstprüfung

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

- Header auf kleinen Geräten auf zwei Zeilen begrenzt; vorhandener Gast-CTA-Text
  wird vollständig erhalten, statt den Überschreibschutz wegzustylen.
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

Alle 19 gezielten Browserprüfungen und 124 gezielten Tests bestanden; der
separate vorhandene Route-/Detail-Browserlauf bestand mit 17/17. Build,
Typecheck, Lint und Hygieneprüfungen bestanden. Der Gesamt-Testlauf ist wegen
der im [Report](UNIFIED_WORKSPACE_1_REPORT_2026-10-30.md) einzeln beschriebenen
13 Fehlschläge **nicht grün**.

Angemeldete Kontoreisen, Reisebegleiter-Backend, native Zoom-/VoiceOver- und
physische Mobilprüfung bleiben offen. Der Code erhält diese Wege, aber daraus
wird kein Browser-PASS abgeleitet. Die Überschneidung mit PR #1082 erfordert
eine Entscheidung des Technical Lead vor Integration. Keine Merge-/Livefreigabe.
