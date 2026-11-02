# Workspace Navigation 1 — Prüfstand 02.11.2026

Status: Implementiert, lokal geprüft; finale Head-CI, Vercel-Vorschau und Release
werden durch den Technical Lead auf PR #1106 ergänzt. Kein Production-PASS aus
diesem lokalen Bericht ableiten.

## Änderung

Header mit Logo über die ganze Breite; Header und Sidebar deckend weiß auch bei
grünem Inhalt. Desktop startet mit 72px-Leiste (4,5rem bei Standardschrift), Hover
öffnet 224px (14rem) über dem Inhalt. Maus raus schließt, ohne die Inhaltskante
zu bewegen. Tastaturfokus öffnet die Labels, Escape schließt, Touch-Desktop bietet
einen Symbolschalter. Mobile Drawer und untere Bereichsnavigation bleiben.
Konto und Mond/Sonne sind reine Symbole mit zugänglichen Namen. Tooltips und
Collapse-Beschriftung entfernt; Quellen-Seite `/datenquellen` im Kontomenü.

## Verhalten und visuelle Prüfung

Isolierter Chromium-Browser mit realem Workspace und synthetischer, ausschließlich
lokal gespeicherter Lissabon-Gastreise. Externe Netzwerkaufrufe werden blockiert.
Kein Zugriff auf das angemeldete Chrome-Profil und kein physischer Gerätetest.

Builder: `lib/ui/white-mint-home-workspace-1/browser.test.ts`, **11/11 PASS**.

- 1024/1440px: Sidebar initial72px, Hover224px, Header x0/volle Breite, Inhalt
  bleibt an gleicher x-Position. Hover auf Portal-Reisebuttons, Klick-Reisewechsel,
  Verlassen, Keyboard-Tab, Escape und erneutes Tab funktionieren.
- Beide Themes: Header und Sidebar RGB255/255/255, Konto-/Theme-Icons sichtbar,
  mindestens44px Bedienfläche; zugängliche Namen, Theme-Persistenz und gemessener
  Sidebar-Textkontrast bestehen. Quellen-Link wird geöffnet, vollständiger Nachweis
  und Lizenz-/Quellenlinks werden sichtbar.
- Touch-Desktop1440: explizites Öffnen und Schließen durch Berührung außerhalb.
- Mobile320/390/768: Drawer, Hintergrund-inert, Body-Scroll-Lock, Fokusfalle,
  Escape/Rückkehrfokus; kein horizontaler Overflow, Kontosymbol bleibt sichtbar.
- 200%-Schrift320/1440: Headerlogo frei, Sidebar beginnt unter dem Header und
  bleibt nach Scrollen bedienbar; auf Mobile auch letzter Menülink erreichbar.
  Reduced-motion reduziert die Rail-Transition auf höchstens0,001s.
- Bestehender Gastnoten-Flow, Speichern/Neuladen, Verlauf, Form-/Fehlerkontrast,
  öffentliche Homepage sowie negative Admin-/Provider-Kontrollen bleiben grün.

Builder hat Bilder `navigation-hover-light.png`, `navigation-mobile-320.png` und
`navigation-enlarged-desktop.png` visuell gesichtet. Lokales Artefaktverzeichnis:
`outputs/jetnity-navigation-builder-2026-11-02/` im übergeordneten Arbeitsbereich.
Diese Artefakte enthalten ausschließlich die synthetische Prüf-Reise.

Unabhängiger Technical Lead meldet **54/54 lokale Browserchecks PASS**, keine
Browserausnahmen (42 Darstellungs-/Bedienchecks,12 Keyboard/Touch/200%-Text/
Reduced-motion). Eigenständig gesichtete Bilder: Desktop geschlossen/offen/grün,
Mobile390 und200%-Schrift. Bestehende
`lib/trips/ux-u1c-route-design-alignment-1/workspace-browser.test.ts`: **7/7 PASS**.
Alle fünf Hygieneprüfungen lokal PASS (finale Head-CI bleibt Releasegate).

## Befunde während der Umsetzung und Korrekturen

1. React-Portal-Events folgen dem React-Komponentenbaum. Synthetisches Hover/Fokus
   am DOM-Aside erreichte die Reisebuttons nicht. Native DOM-Listener behandeln
   Pointer, focusin/out und Tastatur nun an der tatsächlichen Navigationsfläche.
2. Während Breitenanimation konnten umgebrochene Labels Klickziele verschieben.
   Desktop-Beschriftungen bleiben einzeilig, Kicker-/Footerhöhe bleibt reserviert.
3. Die geerbte bottom0-Regel zog die bei200%-Text sticky gewordene Sidebar über
   das Logo. Die Flow-Variante setzt bottom:auto und beginnt unter dem Header.
4. Der vorhandene mobile svg:last-child-Selektor hätte nach Entfernen des Konto-
   Pfeils das einzige Symbol versteckt; er ist entfernt. Symbolflächen skalieren
   bei vergrößerter Schrift mit.

## Technik / Self-Review

`npm ci` erfolgreich (Technical Lead). Typecheck erfolgreich. Lint **0 Fehler**,
192 vorhandene Warnungen; kein neuer Lintfehler im Scope. Production-Build durch
Technical Lead erfolgreich, einschließlich statischer `/datenquellen`-Route.
Gehostete Gates sind Aufgabe des nachfolgenden unabhängigen TL-Releases.

Geänderte Runtime beschränkt auf Shell/Navigation/CSS und öffentliche Quellen-
Seite; kein Trip-State wird in die Shell kopiert. Keine neue Abhängigkeit,
Migration, API, Auth-/RLS-/Provider-/Consent-Regel oder laufende Kosten.
Native Listener werden vollständig entfernt; die Theme-Speicherung bleibt im
bestehenden Hook. Änderungen an ARCHITECTURE, DECISIONS, DESIGN_SYSTEM und ROADMAP
halten den aktuellen Owner-Auftrag gegenüber älteren Glas-/Label-Vorgaben fest.

Builder `workspace_navigation_1` stoppt nach lokalem Commit/Handoff. Kein eigener
Push/Ready/Merge/Release; finale Entscheidung ausschließlich beim Technical Lead.
