# Cursor-Auftrag – Phase 3.2c: Letzte Provider-Ready-Härtung

Stand: 20. August 2026

## Ausgangspunkt

Du bist der Hauptentwickler von Jetnity. Arbeite weiter auf `phase-3-2-hotel-foundation` und am bestehenden Draft-PR #22. Lies zuerst `AGENTS.md`, `JETNITY_HANDOFF.md`, `JETNITY_VISION.md`, `docs/HOTELS.md`, `docs/HOTEL_PROVIDER_STRATEGY.md`, `DECISIONS.md` und den aktuellen Code unter `lib/hotels/` sowie `app/api/hotels/search/route.ts`.

Phase 3.2b ist CI-grün und hat die wichtigste Client-Vertrauenslücke geschlossen. Vor dem ersten echten Hotelprovider bleiben zwei provider-unabhängige Integritäts-/Security-Punkte offen.

## Harte Grenzen

- PR #22 bleibt Draft.
- Kein Merge nach `main`.
- Keine Production-Änderung oder -Migration.
- Kein Hotelprovider, kein Provider-Key, kein neuer Secret.
- Keine neuen laufenden Kosten oder externen Dienste.
- Keine Fake-Hotels außerhalb von Tests.
- Production-Hotelsuche bleibt hart aus.

## 1. HotelNachweis an den erwarteten Suchkontext binden

Aktuell lautet die Vertrauensnaht sinngemäß `nachweisen({ optionId })`. Das reicht für einen späteren echten Provider nicht aus: Eine gültige Option-ID könnte zu einem anderen Reiseziel, anderen Daten, anderer Belegung oder anderer Währung gehören. Der Reisegraph bestimmt zwar Check-in/Check-out, aber der Nachweis muss zusätzlich bestätigen, dass der kommerzielle Preis/Fakt genau zu **diesem** erwarteten Suchkontext gehört.

Verbindlich:

- Erweitere die provider-unabhängige Nachweis-/Auswahlschnittstelle so, dass der Nachweis gegen einen serverseitig erwarteten Kontext erfolgt.
- Mindestens binden/prüfen: kanonisches Ziel (`destinationPlaceId` soweit vorhanden), Check-in, Check-out, Zimmer, Erwachsene, Kinder und Währung. Wenn ein Feld im aktuellen vertrauenswürdigen Reisegraphen noch nicht belastbar verfügbar ist, darf es nicht vom Browser als Wahrheit übernommen werden; dokumentiere die Grenze und bleibe fail closed, wo eine kommerzielle Zuordnung sonst falsch wäre.
- Der spätere Adapter darf nicht eine Option für Reise A bestätigen und deren Preis anschließend mit Zeitraum/Ziel von Reise B persistieren.
- Bevorzuge einen kleinen provider-unabhängigen `HotelNachweisKontext` oder äquivalenten Vertrag. Kein Booking-/HBX-spezifisches Design.
- Kein selbst erfundener Token-/Signaturmechanismus ohne echten Providerbedarf.
- Tests: gleiche `optionId`, aber falsches Ziel / falscher Zeitraum / falsche Belegung / falsche Währung muss sauber als geändert/invalid/unbekannt (passende bestehende oder eng ergänzte Fehlerklasse) abgelehnt werden. Ein exakt passender Fake-Nachweis muss weiterhin funktionieren.

## 2. Request-Grössenlimit wirklich vor grosser Allokation erzwingen

Aktuell liest die Route zuerst `await req.text()` und prüft die 16-KB-Grenze danach. Das begrenzt die fachlich akzeptierte Nutzlast, verhindert aber nicht, dass ein grosser Request bereits vollständig in den Speicher gelesen wurde. Der Auftrag 3.2b verlangte ausdrücklich, kein praktisch unbegrenztes JSON einzulesen.

Verbindlich:

- Prüfe `Content-Length` früh, wenn vorhanden, und lehne Werte oberhalb der Grenze mit 413 ab.
- Verlasse dich **nicht nur** auf `Content-Length` (kann fehlen/falsch sein). Lies den Request-Body begrenzt/streamend bzw. mit einem harten Byte-Cap und brich ab, sobald das Limit überschritten ist.
- UTF-8-Bytegrenze beibehalten; keine Zeichenanzahl als Ersatz.
- `application/json`, 400/413/415/429, `Retry-After` und `cache-control: no-store` beibehalten.
- Kein neuer Dienst / keine Middleware-Infrastruktur nötig.
- Tests müssen einen Body abweisen, dessen tatsächlicher Stream > Limit ist, auch ohne bzw. mit irreführendem `Content-Length`. Außerdem Grenzfall exakt am Limit testen.

## 3. Regression und Dokumentation

- Bestehende 919+ Tests müssen grün bleiben; neue gezielte Tests ergänzen.
- Typecheck, Lint, Hygiene, Production-Build, GitHub CI und Vercel Preview vollständig prüfen.
- Kein echter Providercall.
- `docs/HOTELS.md`, `DECISIONS.md`/ADR nur wenn nötig, `JETNITY_HANDOFF.md` und `ROADMAP.md` auf den tatsächlich belegten Stand bringen.
- PR #22 Beschreibung aktualisieren, falls der Agent sie bearbeiten darf; sonst im Abschlussbericht den exakten Text liefern.

## Abschlussbericht

Kurz berichten:

1. wie der Nachweis jetzt an Ziel/Daten/Belegung/Währung gebunden ist,
2. wie die Body-Grenze vor grosser Allokation greift,
3. neue Missbrauchs-/Grenztests,
4. Test-/Typecheck-/Lint-/Hygiene-/Build-/CI-/Preview-Status,
5. verbleibende Risiken,
6. bestätigen: kein Provider, kein Secret, kein Merge, keine Production-Änderung.
