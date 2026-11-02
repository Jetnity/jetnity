# Organisieren Desktop 1 — 02.11.2026

Status: Umsetzung; Release erst nach eigenständigem Review und Prüfungen.

## Auftrag und Basis

Der Product Owner verlangt anhand seiner Produktions-Screenshots dieselbe
Desktop-Anordnung in allen vier Organisieren-Kategorien wie bisher bei
Aktivitäten: Flüge, Unterkunft, Aktivitäten und Mobilität bleiben gemeinsam
oberhalb des jeweiligen Inhalts. Kategorie-Wechsel dürfen die Navigation nicht
in eine linke Spalte verschieben. Der Citrus-Strich am Aktivitäten-Kartenkopf
muss sauber innerhalb der abgerundeten Karte enden.

Baseline: `main` / `11a0d7a193a0a9ee7fa82d1aa8a0c0f7a8c0dfed`.
Branch: `codex/organisieren-desktop-20261102`.
Operating mode NORMAL. Offene PRs 1084/1086 bleiben unberührt; keine aktive
konkurrierende Arbeit an diesem Layout gefunden.

## Umsetzungsplan und Grenzen

- Gemeinsame Organisieren-Anordnung in `TripWorkspace.tsx` angleichen; nötige
  Präsentationshelfer nur soweit direkt betroffen anpassen.
- Citrus-Kante in `AktivitaetenBereich.tsx` an die Kartenrundung anpassen, ohne
  Anbieterrahmen, Auswahllisten oder Fokusrahmen abzuschneiden.
- Bestehende Kategorien-Reihenfolge und Gestaltung bewahren. Kein neues
  Sticky-Verhalten beim Scrollen; der Wunsch betrifft die Position beim Wechsel.
- Mobile Navigation, Reiseplan-Aufteilung, Browser-Zurück, Fokus und gespeicherte
  Reise bleiben funktional erhalten.
- Keine API-, Datenbank-, Auth-, RLS-, Provider-, Consent- oder Kostenänderung.
  Keine zusätzlichen Pakete, Verträge oder Nachrichten an externe Kontakte.
- DESIGN_SYSTEM und gezielter Prüfbericht dokumentieren den neuen Layoutvertrag.
  Vision und Datenarchitektur bleiben unverändert; keine neue ADR erforderlich.

## Arbeitsteilung

SINGLE_AGENT-Implementierung: `organisieren_desktop_1` ist alleiniger Code-Writer.
Der Technical Lead überprüft Diff, Browserdarstellung, CI und Veröffentlichung
eigenständig. Lokaler Codex-Subagent wird verwendet; keine externe Cursor- oder
Guardian-Session wird behauptet. Das ist ein kleiner Präsentations-Slice.

## Abnahme

Desktop: alle vier Kategorien wechseln, Navigation oberhalb und gleich breit;
keine leere linke Inhaltsspalte. Aktivitäten-Karte ohne überstehende Citrus-Ecken.
Zusätzlich kompakte Ansicht, Hell/Grün, Tastatur/Fokus und Zurück prüfen.
Bestehende relevante Tests, Typecheck, Lint, fünf Hygieneprüfungen, Build;
exakte PR-CI und Vercel-Vorschau vor Merge, main-CI/Deployment danach.
Screenshots als echte visuelle Evidence; kein behaupteter Real-Device-Test.

STOPP für den Builder: Handoff nach Implementierung und lokaler Prüfung.
`do not mark Ready`; `do not merge`; `do not start a follow-up slice`.
Nur der Technical Lead entscheidet über Ready, Merge und Release.
