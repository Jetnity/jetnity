# Workspace Navigation 1 — 02.11.2026

Status: Umsetzung; Release erst nach unabhängiger Prüfung.

## Auftrag und Live-Basis

Der Product Owner verlangt anhand seiner Desktop-Screenshots eine standardmäßig
schmale Seitenleiste, die beim Darüberfahren aufklappt und beim Verlassen wieder
zuklappt. Header und Seitenleiste sollen weiß sein, der Header einschließlich
Logo die gesamte Fensterbreite abdecken. Konto und Hell/Grün-Schalter erhalten
nur Symbole. Separate Navigations-Hinweisblasen entfallen. Die GeoNames-Zeile
soll aus dem Arbeitsbereich verschwinden, sofern die Quellenpflicht gewahrt bleibt.

Baseline main: `5605f6770096ebba5dd741166a3a26e650d74f7c` (PR #1105).
Branch: `codex/workspace-hover-navigation-20261102`. Operating mode NORMAL.
Kein konkurrierender Shell-Writer in den offenen PRs gefunden.

## Scope und Plan

- WorkspaceShell/Header/Navigation und ihre CSS-Schichten vereinheitlichen.
- Desktop: schmale Symbolleiste; Hover öffnet als Überlagerung ohne Verschieben
  des Inhalts. Offen, solange die Maus im gesamten Navigationsbereich bleibt;
  auch nach einem Mausklick beim Verlassen schließen. Tastaturfokus und Escape
  sinnvoll behandeln, Touch-Geräten einen erreichbaren Toggle anbieten.
- Header über volle Breite mit Logo; Sidebar darunter. Höhenänderungen und
  vergrößerte Schrift ohne verdeckte Links/Inhalte berücksichtigen.
- Weißer Header und weiße Seitenleiste in beiden Darstellungen; Grün-Modus im
  Inhalt erhalten. Konto und Darstellung nur als verständliche Symbole mit
  zugänglicher Beschriftung und mindestens 44px Bedienfläche.
- Mobile Drawer, Fokusfalle, Rückkehrfokus, Body-Scroll-Lock, untere Navigation,
  Bereichswechsel und bestehende Theme-Persistenz erhalten.
- Alte Collapse-Schrift und Navigations-Tooltips samt ungenutzter Helfer entfernen.
- GeoNames-Nachweis auf öffentlicher Seite „Datenquellen & Lizenzen“, erreichbar
  im Kontomenü auch für Gäste. GeoNames-Quelle, CC BY 4.0-Link und Bearbeitung
  benennen. CC BY 4.0 Section 3(a)(2) erlaubt angemessenen Link auf die Nachweise:
  https://creativecommons.org/licenses/by/4.0/legalcode.en .
- DESIGN_SYSTEM, ROADMAP und gezielte Evidence aktualisieren.

Keine Datenbank-, API-, Provider-, Auth-, RLS-, Consent-, Preis- oder laufenden
Kostenänderungen. Keine neuen Abhängigkeiten. Keine privaten Reisedaten in
Prüfartefakten; lokale Fixtures klar als solche kennzeichnen. Bestehende öffentliche
Marketing-Seiten werden nicht allgemein umgestaltet.

## Agentenwahl und Zuständigkeit

SINGLE_AGENT-Implementierung: `workspace_navigation_1` ist einziger Code-Writer.
Die Shell, ihre Kontext-Slots und Theme-CSS sind eng gekoppelt; parallele Writer
wären kollisionsanfällig. Der Technical Lead überprüft Diff und echte Bedienung
unabhängig und verantwortet Release. Lokaler Codex-Agent, keine behauptete
externe Cursor-/Guardian-Session. Erst Task/Draft-PR, dann Builder-Dispatch.

## Abnahme und Evidence

- Desktop 1024/1440: initial schmal, Hover über gesamter Sidebar stabil, Maus
  raus schließt auch nach Klick, kein horizontaler Inhaltssprung; Header x=0 und
  volle Breite. Alle Navigationsziele erreichbar.
- Tastatur: sichtbarer Fokus, Öffnen, Wechsel, Verlassen und Escape. Desktop
  Touch-Fallback. Keine zusätzlichen schwebenden Textblasen.
- Mobile 320/390/768: Drawer, Schließen, Escape, Fokus und Scroll-Lock; kein
  horizontaler Overflow. Hell/Grün, vergrößerte Schrift, reduzierte Bewegung.
- Kontomenü, Symbol-Theme-Schalter und Quellen-Link wirklich bedienen. Visuelle
  Browser-Evidence aus isolierter lokaler Anwendung; kein behaupteter Test im
  angemeldeten Chrome-Profil des Nutzers oder auf physischer Hardware.
- npm ci, Typecheck, Lint, relevante Browser-/Regressionsprüfungen, fünf Hygiene-
  Checks, Production-Build; vollständige CI und Vercel-Vorschau am finalen Head.
- TL-Review vor Ready/Merge; danach exakte main-CI und Production-Zuordnung.

## Handoff / STOPP

Builder liefert Code, sinnvolle Verhaltenstests, Dokumentation, Prüfresultate und
Self-Review mit offenen Punkten. `do not mark Ready`; `do not merge`;
`do not start a follow-up slice`. Kein eigener Release oder zweiter Writer.
