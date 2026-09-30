# Account / Meine Welt Premium Map UX 1 — Self-Review

Stand: 30. September 2026
Status: **AUTOR-SELBSTPRÜFUNG / KEIN TECHNICAL-LEAD-PASS**

Session: https://cursor.com/agents/bc-d139c9ce-6f3f-41d1-a209-77e55610f33f
`originalModelName`: `grok-4.7-high-fast`

Diese Prüfung ersetzt kein unabhängiges Exact-Head-Review.

## Vertrag

- Nur die erlaubten Dateien sind geändert. Wahrheit, Projektion, Persistenz, Auth, Tokens und Trip Workspace sind unberührt.
- Besucht, geplant und beides bleiben additiv. Die gesperrten Füllklassen `fill-brand-800/45` und `fill-brand-600/10` stehen weiter im Quelltext. Keine deckende Länderfüllung.
- Marker bleiben an den gespeicherten Prozentpositionen. Die Trefferfläche bleibt `min-h-11 min-w-11`.
- Die Gruppenauswahl entscheidet nicht selbst und liegt unter der Karte.
- Kleinstaat-Formen heissen weiter `ring`, `ring-gestrichelt`, `doppelring`.
- `motion-reduce:transition-none` bleibt. Hover-Skalierung hängt an `motion-safe`.
- Kein `https://` in der Kartenkomponente, keine neue Abhängigkeit, kein Kartendienst.
- Herkunft und Besuchsatz bleiben im sichtbaren Text.

## Gates auf diesem Arbeitsstand

- `npm test`: 4057/4057 grün.
- `npm run typecheck`: grün.
- `npm run lint`: 0 Fehler, 145 bestehende Warnungen.
- `npm run build`: grün, vor der Nachher-Aufnahme.
- `node scripts/account-world-premium-map-ux-1-audit.mjs --marke vorher`: `ok: true`.
- derselbe Lauf `--marke nachher`: `ok: true`, keine fremde Herkunft, Überlauf 0, kleinste Fläche 44, drei Formen, Tastaturfokus.
- `npm run audit:account`: 48/48 grün, WebKit und Chromium.

## Bewusst offen

- Kein Gerätetest auf echter Hardware.
- Bei 1024 px ist die Karte 14 px schmaler als vorher, damit der Ausbruch nicht über den Viewport läuft.
- Der Harness hat keinen isolierten Zustand „nur besucht“. Italien und Singapur im Fixture `welt` tragen ihn.
- Aufnahmen von `[data-account-besuche]` schneiden den Desktop-Ausbruch ab. Die Fensteraufnahmen `*-welt-fenster.webp` zeigen den Viewport.
