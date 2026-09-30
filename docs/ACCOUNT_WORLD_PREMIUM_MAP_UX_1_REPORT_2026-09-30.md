# Account / Meine Welt Premium Map UX 1 — Bericht

Stand: 30. September 2026
Status: **UMGESETZT / STOP FÜR TECHNICAL-LEAD CODE- UND SICHTREVIEW**

Issue: #639
Draft PR: #640
Branch: `fix/account-world-premium-map-ux-1`
Baseline: `main@20bf11b0cf24460cf01d9dfe487b89bbfe555191`
Task: `docs/ACCOUNT_WORLD_PREMIUM_MAP_UX_1_TASK_2026-09-30.md`

Cursor-Session: https://cursor.com/agents/bc-d139c9ce-6f3f-41d1-a209-77e55610f33f
`originalModelName`: `grok-4.7-high-fast`

Der exakte Branch-Kopf steht in `docs/ACCOUNT_WORLD_PREMIUM_MAP_UX_1_HANDOFF_2026-09-30.md`.

## Entscheidung

Die Natural-Earth-Platte und die gleichwinklige Projektion bleiben. Geändert ist die Darstellung darum herum.

- Wasser ist `brand-900`, neutrales Land ist das warme `surface-75`. Die bisherige gemeinsame Mintfläche ist weg.
- Ein statisches Randvignett aus den bestehenden Tönen `brand-900` (`#0f302a`) und `night-900` (`#0a1412`) liegt nur auf dem Wasser, unter dem Land.
- Besucht bleibt die volle Fläche `fill-brand-800/45` ohne Schraffur. Geplant bleibt hell plus Schraffur. Beides bleibt dieselbe Fläche plus dieselbe Schraffur. Die Schraffur ist dunkler, damit sie auf dem neuen Land sofort lesbar ist.
- Kleinstaaten behalten Ring, gestrichelten Ring und Doppelring. Dahinter liegt eine helle Scheibe, damit die Form auf dem dunklen Wasser nicht verschwindet.
- Der gewählte Marker trägt einen Citrus-Ring und eine Beschriftung. Direkt unter der Karte steht dieselbe Reise, mit demselben Citrus-Balken.
- Ab `lg` bricht der Atlas auf `min(90rem, 100vw - 4rem)` aus. Die Seitenhülle `max-w-6xl` liegt ausserhalb der erlaubten Dateien. Unter `lg` bleibt der Atlas in der Hülle.
- Herkunft, Grenzvorbehalt und der Satz zur bestätigten Besuchswahrheit bleiben sichtbar, unter der Karte und typografisch zurückgenommen.
- Die Besuchsliste darunter ist durch Abstand und eine Trennlinie vom Atlas getrennt. Formular und Aktionen sind unverändert.

## Gemessen, Zustand `welt`

Produktionsserver, Chromium, Harness `/ui-audit/account?ansicht=besuche`. Keine fremde Herkunft. Kein Konsolenfehler. Fokus per Tastatur erreicht einen Marker, kleinste gemessene Kante 44 px.

| Breite | Karte vorher | Karte nachher | Anteil vorher | Anteil nachher | Ozean/Land vorher | Ozean/Land nachher | Überlauf | kleinste Fläche |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 360×800 | 268 | 270 | 0.744 | 0.750 | 54 | 329 | 0 | 44 |
| 390×844 | 298 | 300 | 0.764 | 0.769 | 49 | 323 | 0 | 44 |
| 768×1024 | 636 | 638 | 0.828 | 0.831 | 49 | 332 | 0 | 44 |
| 1024×768 | 892 | 878 | 0.871 | 0.857 | 51 | 355 | 0 | 44 |
| 1280×800 | 1068 | 1134 | 0.834 | 0.886 | 51 | 340 | 0 | 44 |
| 1440×900 | 1068 | 1294 | 0.742 | 0.899 | 51 | 340 | 0 | 44 |
| 1920×1080 | 1068 | 1358 | 0.556 | 0.707 | 51 | 332 | 0 | 44 |

Ozean/Land ist der euklidische RGB-Abstand einer Wasserprobe und einer neutralen Landprobe. Vorher lag er bei etwa 50, nachher bei etwa 320 bis 355.

Bei 1024 px ist die Karte 14 px schmaler als vorher. Der Ausbruch hält dort `100vw - 4rem` ein, damit kein horizontaler Überlauf entsteht. Ab 1280 px wird die Karte breiter.

Zusätzliche Fensteraufnahmen ab 1024 px liegen als `nachher-*-welt-fenster.webp` im Evidenzordner. Sie zeigen den Atlas im Viewport. Aufnahmen des Elternelements `[data-account-besuche]` schneiden den Ausbruch an der `max-w-6xl`-Kante ab und sind dafür nicht die Kompositionsaussage.

## Zustände

Der bestehende Harness hat keinen eigenen Zustand „nur besucht“. Im Fixture `welt` sind Italien eine besuchte Fläche und Singapur ein besuchter Ring. Japan ist nur geplant, Malta ein geplanter Ring, Brasilien und Portugal besucht und geplant, Hongkong der Doppelring.

| Zustand | Pfad |
| --- | --- |
| leer | `zustand=leer&ansicht=besuche` |
| nur geplant | `zustand=reise&ansicht=besuche` |
| besucht, geplant, beides, Kleinstaat, Gruppe | `zustand=welt&ansicht=besuche` |
| Besuch nicht lesbar | `zustand=besuch-fehler&ansicht=besuche` |
| geplante Seite nicht lesbar | `zustand=fehler&ansicht=besuche` |

Formen aus dem Baum, nicht aus der Farbe: `ring`, `ring-gestrichelt`, `doppelring`.

Ein gewählter Marker schreibt `data-world-map-kontext="ort"` und zeigt den Ort mit seiner Reise. Die Gruppenauswahl bleibt unter der Karte.

## Projektion

Die gleichwinklige Projektion ist nach dieser Reparatur nicht das dominierende Qualitätsproblem. Sie wurde nicht geändert und ist kein Folge-Slice.

## Grenzen

- Kein Real-Device-Test.
- Fixtures nur im Audit-Harness, kein Schreibweg gegen eine Datenbank.
- Einzelpixel auf kleinen Ländern sind bei 360 px unzuverlässig, weil Portugal dort nur wenige Bildpunkte breit ist. Die Flächenunterscheidung ist ab 1024 px in der Probe deutlich; die Formen der Kleinstaaten sind zusätzlich fotografiert.
