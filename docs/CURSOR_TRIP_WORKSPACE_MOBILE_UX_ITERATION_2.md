# Cursor-Auftrag – Trip Workspace Mobile UX · Iteration 2

Stand: 21. August 2026

## Status

Iteration 1 von PR #27 ist technisch grün und bleibt Draft. Der Nutzer hat den Preview auf einem echten iPhone geprüft und möchte die mobile Informationsarchitektur jetzt gezielt vereinfachen.

Diese Iteration setzt genau **eine Produktentscheidung** um:

> Auf Mobile gehören `Übersicht` und `Plan` zusammen. Der Tagesplan ist Teil von „Deine Reise auf einen Blick“ und kein eigener Hauptbereich.

Kein Merge. Keine Production-Aktivierung.

---

## 1. Pflichtlektüre vor Umsetzung

Vor Änderungen lesen bzw. aktuellen Branch-Stand prüfen:

- `AGENTS.md`
- `JETNITY_HANDOFF.md`
- `ARCHITECTURE.md`
- `ROADMAP.md`
- `DECISIONS.md`
- `DESIGN_SYSTEM.md`
- `docs/PRODUCT_QUALITY_STANDARD.md`
- `docs/CONTINUITY_STANDARD.md`
- `docs/REISEN.md`
- `docs/CURSOR_TRIP_WORKSPACE_MOBILE_UX_ITERATION_1.md`
- `lib/trips/arbeitsbereich.ts`
- `components/trips/TripWorkspace.tsx`
- `components/trips/TripWorkspaceNavigation.tsx`
- `components/trips/TripWorkspaceUebersicht.tsx`
- `components/trips/TripWorkspacePlan.tsx`
- bestehende Workspace-Tests und Browser-Audit-Harness

---

## 2. Verbindliche Produktentscheidung

### Mobile Hauptnavigation nach Iteration 2

Die sichtbare Hauptnavigation soll auf Mobile nur noch enthalten:

- `Übersicht`
- `Flüge`
- `Unterkunft`
- `Aktivitäten`

`Plan` ist **kein eigener sichtbarer Haupt-Tab mehr**.

### Übersicht = Dashboard + Tagesplan

`Übersicht` bleibt Default beim Öffnen der Reise und enthält künftig zusammenhängend:

1. `Deine Reise auf einen Blick`
2. ehrliche Statusinformationen zu Flügen, Unterkunft und Aktivitäten
3. den Tagesplan mit Tagesauswahl
4. den aktuell gewählten Reisetag mit Punkten
5. `Punkt hinzufügen`
6. ungeplante Punkte, falls vorhanden
7. kompakte Aktion `Reise ändern`
8. Reiseprofil sekundär

Die Reihenfolge darf UX-seitig leicht optimiert werden, aber der Tagesplan soll im Dashboard klar und prominent sein und nicht wie ein separater Bereich wirken.

---

## 3. Bestehende Plan-Funktion vollständig erhalten

Die Verschmelzung ist eine **Informationsarchitektur-/Darstellungsänderung**, keine fachliche Neuentwicklung.

Unverändert erhalten:

- gemeinsame `aktiverTag`-Wahrheit
- Tagesauswahl für Plan und Aktivitäten
- Punkt hinzufügen
- Punkt löschen
- `ohneTag` / noch nicht eingeplante Punkte
- alle bestehenden Validierungen
- Gast- und Konto-Persistenz
- kommerzielle Schutzlogik
- bestehende Trip-Domain

Keine zweite Plan-Implementierung bauen. `TripWorkspacePlan` darf refaktoriert/eingebettet werden, soll aber fachlich dieselbe Quelle bleiben.

---

## 4. Statusbereich im Dashboard anpassen

Die bisherige Statuszeile `Plan` darf nicht mehr wie ein Link in einen separaten Hauptbereich funktionieren.

Bevorzugt:

- Planstatus direkt als Teil/Einleitung des eingebetteten Tagesplans anzeigen, z. B. `0 Punkte geplant`, `3 Punkte geplant`.
- Die kompakten Dashboard-Statuszeilen für `Flüge`, `Unterkunft`, `Aktivitäten` bleiben direkte Sprünge in diese Hauptbereiche.

Falls ein kleiner Plan-Summary oberhalb des Tagesplans sinnvoll ist, darf er bleiben, aber **kein separater Bereichswechsel auf `plan`**.

---

## 5. State-/Typ-Refaktor sauber lösen

Der aktuelle Branch kennt `plan` als `Arbeitsbereich`. Entscheide sauber, wie der Code nach der Verschmelzung aussieht.

Bevorzugte Zielrichtung:

- sichtbare/navigierbare Hauptbereiche entsprechen der tatsächlichen UX;
- kein toter sichtbarer `Plan`-Tab;
- kein unnötiger `plan`-Client-State, der nur noch historisch existiert;
- falls `plan` intern aus Kompatibilitätsgründen vorübergehend als Typwert bleibt, darf er nicht als erreichbarer separater Mobile-Bereich auftreten und muss klar dokumentiert sein.

Nicht mit Sonderfällen/Redirect-Kaskaden überladen. Eine kleine saubere Refaktorierung ist besser als Legacy-State künstlich mitzuschleppen.

### Desktop

Desktop ab 1024 px soll nicht unnötig redesigniert werden. Wenn die bestehende breite Desktop-Arbeitsansicht Plan und andere Inhalte gleichzeitig sinnvoll zeigt, darf sie das weiterhin tun.

Die Mobile-Produktentscheidung darf nicht zu einer Desktop-Regression führen.

---

## 6. Navigation / Accessibility

Nach der Änderung:

- aktive Navigation eindeutig
- keine leere Lücke durch entfernten `Plan`-Tab
- `Aktivitäten` auf 390–430 px möglichst besser erreichbar als zuvor; horizontales Scrollen ist erlaubt, aber überprüfe, ob die kürzere Leiste nun vollständig oder nahezu vollständig sichtbar sein kann
- Touch-Ziele ≥44 px
- sichtbarer Tastaturfokus
- `aria-current` korrekt
- keine versteckten fokussierbaren Elemente
- keine Fokusfalle beim eingebetteten Planformular

---

## 7. Scroll-/Interaktionsverhalten

Wichtig auf echtem Mobile-Verhalten:

- Wechsel von `Flüge` / `Unterkunft` / `Aktivitäten` zurück zu `Übersicht` zeigt das Dashboard inkl. Plan zuverlässig
- Tageswechsel im Dashboard bleibt stabil
- Tageswechsel in Aktivitäten und anschließender Wechsel zurück zur Übersicht zeigt denselben fachlich aktiven Tag
- kein Doppelscroll
- sticky Bereichsnavigation verdeckt den Tagesplan nicht
- `Punkt hinzufügen` bleibt schnell erreichbar
- keine Request-Loops bei kommerziellen Bereichen

---

## 8. Tests

Bestehende Tests aktualisieren und neue gezielte Tests ergänzen für mindestens:

- Mobile-Navigation enthält keinen separaten `Plan`-Tab
- Default bleibt `Übersicht`
- Übersicht enthält Tagesplan
- Planstatus ist kein separater Bereichswechsel mehr
- Flüge/Unterkunft/Aktivitäten weiterhin direkt aus Übersicht erreichbar
- gemeinsamer aktiver Tag zwischen Übersicht/Tagesplan und Aktivitäten bleibt erhalten
- Planpunkt anlegen/löschen unverändert
- Gast/Konto unverändert
- Desktop-Regression vermeiden

Alle bestehenden Tests müssen grün bleiben.

---

## 9. Browser-Audit

Workspace-Audit mindestens erneut mit:

- WebKit
- Chromium
- 280 / 320 / 360 / 390 / 430 / 768 px
- Landscape 844×390
- Desktop ≥1280 px

Prüfen:

- Navigation nach Entfernen von `Plan`
- Übersicht mit leerem Plan
- Übersicht mit mehreren Planpunkten
- 15+ Reisetage
- Tagesauswahl horizontal
- Punkt-hinzufügen-Formular
- Wechsel Übersicht ↔ Aktivitäten bei gemeinsamem Tag
- Übersicht ↔ Flüge / Unterkunft
- Overflow
- Fokus
- Touch-Ziele
- Layout Shift

Activities-Regression ebenfalls erneut ausführen.

---

## 10. Harte Grenzen

Nicht Teil dieses Auftrags:

- `Meine Reisen` zusätzlich in die Leiste integrieren (wird separat entschieden)
- Startseite ändern
- Reise-Erstellungsseite ändern
- Provider integrieren
- Production-Suchen aktivieren
- Secrets/ENV hinzufügen
- Datenbankmigration
- neue API-Route
- Deep-Link-Konzept groß umbauen
- Desktop-Redesign
- neue UI-Library

---

## 11. Dokumentation

Nach Umsetzung aktualisieren, soweit betroffen:

- `JETNITY_HANDOFF.md`
- `ROADMAP.md`
- `ARCHITECTURE.md`
- `DECISIONS.md` mit neuer ADR für `Übersicht + Plan` als gemeinsames Mobile-Dashboard
- `DESIGN_SYSTEM.md`, falls Navigationsregel angepasst wird
- `docs/REISEN.md`

Nur bestätigte Fakten dokumentieren. Test-/Audit-Zahlen erst nach tatsächlichem Lauf eintragen.

---

## 12. Abschlussbericht

Am Ende knapp berichten:

1. was geändert wurde
2. welche Dateien maßgeblich betroffen sind
3. Tests mit echten Zahlen
4. Browser-Audit mit echten Zahlen
5. CI/Vercel Preview
6. Security/DB/Provider/Kosten: was unverändert blieb
7. offene Risiken
8. Preview-Link für echten iPhone-Test

PR #27 bleibt Draft. Nicht mergen.
