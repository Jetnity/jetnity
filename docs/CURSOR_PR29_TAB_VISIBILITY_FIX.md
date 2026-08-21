# Cursor-Auftrag – PR #29 Mobile Tab Visibility Fix

Stand: 21. August 2026

Branch: `feat/trip-coverage-booking-status`
PR: #29

## Ziel

Den auf einem echten iPhone reproduzierten Fehler beheben, dass nach einem Wechsel zwischen `Flüge`, `Unterkunft` und `Aktivitäten` Inhalte bereits besuchter Bereiche sichtbar bleiben und sich unter dem aktiven Bereich stapeln.

PR #29 bleibt Draft. Nicht mergen. Keine Production-Migration und keine Provider-Aktivierung.

## Reproduzierter Fehler

Auf Mobile ist beim ersten Öffnen eines Bereichs die Darstellung korrekt. Nach einem Wechsel, z. B. `Flüge -> Unterkunft`, bleiben Teile des zuvor besuchten Flugbereichs sichtbar. Dasselbe kann bei anderen Reihenfolgen auftreten.

Die Ursache ist im aktuellen `components/trips/TripWorkspace.tsx` sichtbar:

- besuchte Bereiche sollen aus Zustands-/Performance-Gründen gemountet bleiben;
- nicht aktive Bereiche erhalten korrekt `hidden` und `inert`;
- die Wrapper von `Flüge` und `Unterkunft` tragen gleichzeitig Tailwind `grid`;
- `grid` setzt als Author-CSS `display: grid` und kann damit die UA-Darstellung von `[hidden]` (`display: none`) überstimmen;
- dadurch ist der Bereich semantisch hidden/inert, visuell aber nicht zuverlässig verborgen.

Das ist ein Sichtbarkeits-/CSS-Problem, kein Booking-/Coverage-Datenfehler.

## Verbindliche Umsetzung

1. Behebe die Sichtbarkeit so, dass auf Viewports < 1024 px **genau ein Hauptbereich sichtbar** ist:
   - Übersicht
   - Flüge
   - Unterkunft
   - Aktivitäten

2. Bereits besuchte Bereiche dürfen weiterhin gemountet bleiben, wenn das für bestehenden State/Lazy-Mount vorgesehen ist. Sie müssen aber visuell garantiert `display: none` sein und inert bleiben, solange sie nicht aktiv sind.

3. Verlasse dich nicht auf die Kombination `hidden` + statische Display-Klasse (`grid`, `flex`, `block` etc.). Verwende eine robuste explizite Display-Steuerung, z. B. bedingte `hidden`/`grid`-Klassen oder eine gleichwertige Lösung, die Tailwind/Author-CSS nicht gegen das `hidden`-Attribut arbeiten lässt.

4. Prüfe alle vier Hauptbereichs-Wrapper, nicht nur Flüge und Unterkunft. Die Lösung soll als einheitliches Muster gelten und künftige Regressionen vermeiden.

5. Desktop >= 1024 px bleibt funktional und visuell unverändert: breite Arbeitsansicht mit den vorgesehenen Bereichen.

6. Keine Änderung an:
   - Booking-/Coverage-Domainlogik
   - Datenmodell/Migration
   - RLS/Auth/Security
   - Provider-/Production-Kill-Switches
   - Startseite, Meine Reisen, Reise-Erstellung

## Pflicht-Regressionstest

Erweitere den Trip-Workspace-Browser-Audit so, dass er echte Bereichswechsel prüft und nicht nur statische Einzelzustände.

Mindestens folgende Sequenzen auf WebKit und Chromium:

- Übersicht -> Flüge -> Unterkunft -> Aktivitäten -> Übersicht
- Unterkunft -> Flüge -> Aktivitäten -> Unterkunft
- Aktivitäten -> Unterkunft -> Flüge -> Aktivitäten

Nach jedem Wechsel muss der Audit für die kompakte Ansicht verifizieren:

- genau der gewählte Hauptbereich ist sichtbar;
- die anderen bereits besuchten Hauptbereiche sind nicht sichtbar (`display: none`/kein sichtbares Layout);
- kein Inhalt eines inaktiven Bereichs nimmt Höhe/Breite im Layout ein;
- `inert`/Interaktionsschutz der inaktiven gemounteten Bereiche bleibt erhalten;
- Navigation markiert nur den aktiven Bereich;
- kein horizontaler/vertikaler Layout-Überlauf durch versteckte Bereiche.

Die Prüfung muss den Fehler erkennen, der auf dem echten iPhone gemeldet wurde. Ein Test, der nur `hidden` als Attribut prüft, ist nicht ausreichend; prüfe die tatsächliche Sichtbarkeit/computed layout behavior.

Nutze die bestehenden Referenzbreiten des Trip-Workspace-Audits und mindestens 390/430 px für diese Interaktionssequenzen.

## Qualität / Abschluss

Vor Abschluss:

- `npm test` vollständig grün
- Typecheck grün
- Lint grün
- Hygiene-Checks grün
- Production-Build grün
- Trip-Workspace-Audit WebKit + Chromium grün, inklusive neuer Tab-Wechsel-Regression
- Activities-Regression unverändert grün
- Vercel Preview READY

Dokumentiere den Fix knapp in `JETNITY_HANDOFF.md` und ggf. `ROADMAP.md`, ohne den Status zu schönen.

## Abschlussmeldung

Melde:

- genaue Root Cause
- geänderte Dateien
- gewählte Display-/Mount-Strategie
- neue Regressionstests und Ergebnisse
- vollständige Test-/CI-/Preview-Ergebnisse
- ob DB/Security/Provider/Kosten unverändert sind
- offene Risiken

**PR #29 bleibt Draft. Nicht mergen.**
