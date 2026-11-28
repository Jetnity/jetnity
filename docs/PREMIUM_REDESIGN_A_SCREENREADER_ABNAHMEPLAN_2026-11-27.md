# Premium-Redesign PR A – Abnahmeplan Screenreader (VoiceOver und TalkBack)

Stand: 27. November 2026. Gehört zu Draft #1320 (Branch `feat/workspace-premium-redesign-a`), Work-Nachtest «Kontrast-FAIL».

**Status: OFFEN.** Dieser Plan ist die Anleitung für eine manuelle Abnahme. Bis eine Person ihn mit echtem VoiceOver und echtem TalkBack durchgespielt und die gehörten Ansagen eingetragen hat, gilt die Screenreader-Bedienung von PR A als **nicht abgenommen**. Ein grüner Lauf von `scripts/premium-redesign-a/tastatur-a11y.mjs`, ein axe-Lauf, ein Zugänglichkeitsbaum oder eine Playwright-Emulation sind **keine** Sprachausgabe und ersetzen diesen Plan nicht.

## Was bereits ohne Sprachausgabe geprüft ist (ergänzend, kein Ersatz)

`node scripts/premium-redesign-a/tastatur-a11y.mjs --base <Adresse> --konto <Prüfstand> --label nachher --commit <sha>` prüft im Zugänglichkeitsbaum von Chromium und mit echter Tastatur: Namen, Rollen und Zustände (`aria-pressed`, `aria-current`, `aria-expanded`), Tab-Reihenfolge, Fokus nach einer Änderung, Menüdialog (Fokus hinein, gefangen, Escape, Fokus zurück), Rückmeldungen. Das Ergebnis steht im PR. Zwei Feststellungen daraus sind **nicht** behoben (keine Logikänderung in diesem Auftrag) und stehen unten als Empfehlung; beide sind bei der manuellen Abnahme gezielt zu hören.

## Voraussetzungen

- Vorschau: die Dev-Vorschau des Branches `feat/workspace-premium-redesign-a` mit dem Head, der im PR-Bericht steht. Kein anderer Branch, keine Production-Adresse.
- Nur **synthetische Testreise** (z. B. «Thailand-Test»). Keine echte Buchung, kein Schreiben von Kundendaten, keine Passdaten.
- **Product Owner** erledigt Anmeldung und 2FA selbst. Zugangsdaten stehen nie in Chat, PR, Protokoll oder Bild.
- Ohne Anmeldung sind Startseite, Entdecken, Planen und die Gast-Reise (`/reisen`, `/reisen/<id>` mit lokal gespeicherter Reise) prüfbar; «Meine Reisen» mit Konto und Konto-Seiten brauchen die Anmeldung.
- Keine Installation, kein Login und keine Kosten ohne PO. Ein Android-Studio-Emulator mit «Android Accessibility Suite» (TalkBack) ist kostenlos, wird aber nur nach PO-Entscheid eingerichtet und im Bericht **ausdrücklich als Emulator** bezeichnet (kein Gerätenachweis). Keine Überwachung, kein Hintergrunddienst.

## Geräte

| Gerät | Software | Hinweis |
|---|---|---|
| iPhone | Safari, VoiceOver (Einstellungen → Bedienungshilfen) | echtes Gerät, Hell und Dunkel |
| Android | Chrome, TalkBack | echtes Gerät; ersatzweise Emulator, dann als «Emulator» ausweisen |

## Ablauf (je Gerät, je Theme Hell und Dunkel, einmal mit grosser Schrift)

Je Schritt eintragen, was **gehört** wurde (Wortlaut), nicht, was erwartet wird. PASS nur, wenn Name, Rolle und Zustand hörbar und richtig sind; sonst FAIL; nicht durchgeführt oder nicht hörbar nachprüfbar: OFFEN.

| Nr. | Schritt | Erwartet (hörbar) | Gehört | Ergebnis |
|---|---|---|---|---|
| 1 | Seite öffnen, zum Seitenanfang wischen | Seitentitel, erste Überschrift; zuerst «Zum Inhalt» erreichbar | | OFFEN |
| 2 | Menü öffnen («Menü») und wieder schliessen | Name «Menü», Zustand ein-/ausgeklappt; beim Öffnen springt die Ansage in «Workspace-Navigation»; beim Schliessen kehrt der Fokus auf «Menü» zurück | | OFFEN |
| 3 | Darstellung wählen (Einstellungen oder Menü): «Hell» / «Dunkel» | Name, Zustand «gewählt/gedrückt» wechselt; der Fokus bleibt auf dem bedienten Knopf | | OFFEN |
| 4 | **Meine Reisen: Filter «Alle», «Offen», «Archiv»** | je Knopf Name und Zustand («gedrückt»/«ein» für den gewählten, «nicht gedrückt»/«aus» für die anderen); nach dem Aktivieren ist die neue Auswahl hörbar; die Ergebnisaussage «Diese Ansicht ist … in Offen.» wird ohne Fokuswechsel angesagt (siehe Empfehlung A4) | | OFFEN |
| 5 | Navigation der Reisebereiche und Reisekopf (Übersicht, Reiseplan, Organisieren, Vorbereitung, Einreise & Visum, «Reise ändern», «Reiseoptionen») | Reihenfolge wie angezeigt; der aktuelle Bereich als «aktuelle Seite»; Reisekopf als Zusammenhang lesbar (Ziel, Datum, Reisende) | | OFFEN |
| 6 | Dialoge: Menü, Reisebegleiter (Escape bzw. «Schliessen») | Fokus wandert hinein, bleibt gefangen (Menü) bzw. kehrt zum Auslöser zurück; Hintergrund ist nicht erreichbar, solange das Menü offen ist | | OFFEN |
| 7 | Bildnachweis zum Foto (Startseite, Reisekopf) | Name «Bildnachweis …», ein-/ausgeklappt; der Nachweistext wird beim Öffnen lesbar; Fokus bleibt auf dem Knopf | | OFFEN |
| 8 | Formular: «Deine Reise in eigenen Worten» leer absenden, danach mit Text | Feld hat einen Namen (Label); die Fehlermeldung wird ohne Fokuswechsel angesagt; ob das Feld als «ungültig» angesagt wird, ist Empfehlung H2b | | OFFEN |
| 9 | Reiseplan: Tabs «Reiseplan/Karte», «Mit Anreise/Etappen», Tagesauswahl | Name und Zustand je Tab; nach einer Änderung bleibt der Fokus auf dem bedienten Element oder wandert in den benannten Zielbereich und geht nicht verloren | | OFFEN |
| 10 | Einreise & Visum: Länderauswahl-Chips, Knopf «Einreise anzeigen» (zuerst deaktiviert) | Chip: Name und Zustand «gewählt»; deaktivierter Knopf wird als «nicht verfügbar/abgeblendet» angesagt, der Grund ist lesbar | | OFFEN |

Eine Karte (Leaflet) ist ein eigener Fall: Zoom-Knöpfe und Pins haben Namen; die Karte selbst ist keine vollständige Alternative zur Liste. Notieren, ob Pins mit Namen und Position angesagt werden.

## Empfehlungen aus der automatischen Ergänzungsprüfung (nicht behoben, keine Logikänderung in diesem Auftrag)

- **A4 – Ergebnisaussage der Meine-Reisen-Filter (WCAG 4.1.3).** `components/trips/MyTripsCollection.tsx`: Der Satz «Diese Ansicht ist … in Offen.» (`data-sammlung-besitz`) steht in einem nur bei Bedarf eingefügten `<p class="sr-only">` ohne Live-Region. Eine Person mit Screenreader hört nach dem Wechsel von Alle auf Offen nur den neuen Knopfzustand, nicht, dass sich die Liste geändert hat. Empfehlung: den Absatz immer rendern und als `role="status"` führen (Inhalt wechselt, Region bleibt). Aufwand gering (eine Zeile plus Test), betrifft aber den Wahrheits-/Besitzsatz der Sammlung und deren Tests (`scripts/my-trips-collection-archive-workflow-completion-1/mounted.test.ts`); Priorität mittel; als eigener kleiner Auftrag, nicht in diesem Kontrast-Auftrag.
- **H2b – leeres Planen-Formular.** Die Fehlermeldung wird als Live-Region angesagt (geprüft), das Feld trägt aber weder `aria-invalid` noch `aria-describedby`, und der Fokus bleibt auf dem Absenden-Knopf. Empfehlung: Feld als ungültig markieren, mit der Meldung verknüpfen, Fokus ins Feld. Aufwand gering; Priorität niedrig bis mittel.

## Auswertung

Ein Eintrag je Gerät und Theme: Gerät und Version, Browser, Datum, Head des Vorschau-Builds, ausgefüllte Tabelle, Fundliste mit Priorität. PASS für VoiceOver oder TalkBack steht erst, wenn alle zehn Schritte mit gehörtem Wortlaut eingetragen und ohne FAIL sind. Alles andere bleibt OFFEN und blockiert die Abnahme der Screenreader-Bedienung (nicht die Kontrastabnahme).
