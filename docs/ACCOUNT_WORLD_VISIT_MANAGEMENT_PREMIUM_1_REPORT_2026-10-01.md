# Account / Deine Welt Visit Management Premium UX 1 — Bericht

Stand: 1. Oktober 2026
Status: **UMGESETZT / STOP FÜR TECHNICAL-LEAD CODE-, SICHT- UND INTERAKTIONSREVIEW**

Issue: #692
Draft PR: #693
Branch: `fix/account-world-visit-management-premium-1`
Baseline: `main@ed5350e702f2b6b248cf49ae366420cf1b49039a`
Task: `docs/ACCOUNT_WORLD_VISIT_MANAGEMENT_PREMIUM_1_TASK_2026-10-01.md`

Cursor-Session: https://cursor.com/agents/bc-809e6d21-da18-4e7d-992f-31eff656e0c4
`originalModelName`: `grok-4.7-high-fast`
Generation: 1
Logical agent: Jetnity Account world visit management premium UX 1

Der exakte Branch-Kopf steht im Handoff. Der geprüfte Code nach R1 und dem Merge von `main@08928f43` ist `6e1a7879`.

CI `36915104158` auf `ddc52b6c` scheiterte nur an dem unbenutzten Export `besuchVerwaltungSuchtext`. Der Export ist entfernt. `check:exports` auf dem neuen Kopf meldet 0. #695 ist per Merge erhalten, ohne Besuchskarte und ohne `AccountWeltKarte.tsx`.

## Entscheidung

`/account/welt` bleibt die persönliche Besuchswelt. Der Atlas bleibt. Die Verwaltung darunter wird dicht, ohne die Besuchswahrheit zu ändern.

- „Besuch hinzufügen“ steht neben der Seitenüberschrift, auf dem Telefon in voller Breite darunter, nicht hinter der Historie.
- Das bestehende Formular klappt dort auf. Es sucht nicht, nur weil es aufgeht. Ort oder Land bleiben alternativ. Ein Datum wird nicht erfunden. Gespeichert werden Kennungen und Zahlen, keine Beschriftung und keine Koordinaten.
- Bestehende Ereignisse bleiben einzelne Ereignisse. Wiederholungen bleiben „Besuch N von M“.
- In Ruhe sind die ersten 12 sichtbar. „Weitere anzeigen“ legt 12 dazu, „Alle anzeigen“ zeigt die geladene Liste. Die Quelle wird nicht gekürzt.
- Die Suche filtert nur den schon geladenen Anzeigetext, auf Deutsch kleingeschrieben, und behält die Reihenfolge. Ein leeres Feld ist keine Suche. Kein Treffer sagt das ausdrücklich und lässt die Gesamtzahl stehen.
- Bearbeiten und Widerrufen bleiben Textaktionen am genauen Ereignis. Der erste Widerruf fragt „Diesen bestätigten Besuch widerrufen?“. Erst „Ja, widerrufen“ ruft die bestehende Aktion.
- Leer und Fehler bleiben getrennte Zustände. Im Fehler gibt es kein Hinzufügen.
- Eingaben sind auf schmalen Breiten 16 px, ab `sm` 14 px. Ziele sind mindestens 44 px hoch. Die Bewegung beim Absenden entfällt bei `prefers-reduced-motion`.

`AccountBesuche` ruft die Karte weiter exakt so auf: `<AccountWeltKarte welt={welt} besucht={besucht} laender={laender} />`. Die Sektionsklasse `mt-14 border-t border-line-200 pt-10` bleibt.

Die 40er-Messung hängt an `/ui-audit/account?dichte=40`. Das ist eine Audit-Darstellung aus den bestehenden Ländergeometrien. `AccountAuditClient.tsx` ist unverändert. Nichts davon ist Persistenz.

## Gemessen

Produktionsserver `next start`, Chromium, Harness wie oben. Konsole leer. Öffnen des Formulars und die lokale Suche erzeugen keinen neuen Request.

40 Ereignisse, Ruhe gegen die alte Kartenwand:

| Breite | Vorher | Nachher | Karten nachher | Formular offen unter der Überschrift |
| --- | ---: | ---: | ---: | ---: |
| 390×844 | 11618 | 5052 | 12 | 152 px |
| 768×1024 | 7120 | 3656 | 12 | 128 px |
| 1440×900 | 6840 | 3046 | 12 | 128 px |
| 1920×1080 | 6830 | 3036 | 12 | 128 px |

Vorher lagen alle 40 Karten offen, und das Formular 8176 px (390) bzw. 4164 px darunter. Nachher ist die Aktion in der ersten Ansicht 44 px hoch.

Dieselbe Ruhe über die Matrix, jeweils 12 Karten, kein Dokumentüberlauf, Aktion 44 px:

| Breite | Seitenhöhe | Abstand bei offenem Formular |
| --- | ---: | ---: |
| 320×568 | 5905 | 152 px |
| 360×800 | 5169 | 152 px |
| 390×844 | 5052 | 152 px |
| 412×915 | 5025 | 152 px |
| 430×932 | 4992 | 152 px |
| 768×1024 | 3656 | 128 px |
| 820×1180 | 3640 | 128 px |
| 1024×768 | 3252 | 128 px |
| 1280×800 | 2983 | 128 px |
| 1440×900 | 3046 | 128 px |
| 1728×1117 | 3036 | 128 px |
| 1920×1080 | 3036 | 128 px |
| 844×390 | 3650 | 128 px |

Unter 640 px sind die Formularschriften 16 px. Darüber gilt die bestehende `sm`-Stufe.

Weitere Zustände auf jeder Breite der Matrix: Bearbeiten lässt 12 Karten stehen, die Widerrufsfrage ist sichtbar, „Lissabon“ zeigt nur Lissabon und viermal bei „Alle anzeigen“, eine Suche ohne Treffer lässt die 40 Ereignisse im Zähler, Welt mit 7 Ereignissen zeigt alle 7, Leer und Fehler bleiben unterscheidbar. Tastatur: Enter auf „Besuch hinzufügen“, danach Tab.

200 % Text bei 360×800: 12 Karten, Verwaltung und Kopf ohne horizontalen Überlauf, Dokumentüberlauf 0. Seitenhöhe 14723, weil die Schrift doppelt ist.

R1-F1: CSS-Zoom 1,25 und 1,5 auf 1440×900 haben Dokumentüberlauf 0 (`scrollWidth` 1440). Der Atlas bleibt bis 90rem breit und zentriert. Seine Breite folgt `100cqw` der Dokumentbreite. 200 % Text bei 360×800 hat Dokumentüberlauf 0. Ein echter schmalerer Viewport, 1152×720 und 960×600, hat keinen Dokumentüberlauf und weiter 12 Karten.

Das 7er-Welt-Fixture wird kürzer, ohne Ereignisse zu verstecken, weil 7 unter der Schwelle 12 liegt: 390×844 von 6289 auf 5447, 768×1024 von 4730 auf 4116, 1440×900 von 4124 auf 3375, 1920×1080 von 4150 auf 3401.

## Grenzen

Keine Datenbank, kein Auth, kein Provider, keine Production, keine Indexierung. Die Audit-Route bleibt hinter dem bestehenden Schalter und `noindex`. Globale Kontinuitätsdateien sind absichtlich nicht geändert; dieser Bericht und der Handoff sind die Spur dieser Lane.
