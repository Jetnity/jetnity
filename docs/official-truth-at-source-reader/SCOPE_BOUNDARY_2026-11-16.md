# AT-Source-Reader #1223 — Scope und Dateigrenze

Stand: 16. November 2026, Live-Abruf 20:01 UTC. Branch `cursor/at-official-source-reader-31a9`. Issue [#1223](https://github.com/Jetnity/jetnity/issues/1223).

## Was diese Lane ist

Technischer Leser für drei fest gepinnte österreichische Originalseiten und ein fail-closed Importadapter davor. Der Adapter erzeugt einen nicht freigegebenen Kandidaten mit `RESEARCH_ONLY`, Kundenaussage `derzeit nicht verfügbar`, `acceptedFactCount: 0` und `importable: false`.

Maschinenlogik prüft URL, Host, Pfad, HTTP-Status, Weiterleitungen, Medientyp, UTF-8, Grösse, Titel, optionalen Canonical-Link und den SHA-256 der dekodierten Bytes. Ein einzelner `(Stand: …)`-Token wird nur beobachtet. `approvedVersion` bleibt `null`.

## Was diese Lane nicht ist

Keine amtliche Quellenprüfung, keine Bedeutung, keine Nationalitäten- oder Visumklassifikation, keine Auswahl akzeptierter Fakten, keine Reviewer- oder Owner-Rolle. Keine Methode, kein S1/M04/I1/HRS, kein BG1, kein Visitor-Readback. Auch ein äusserlich gültiger Verweis auf eine Technical-Lead-Bewertung und eine Methodengenehmigung bleibt `shared_v3_method_not_attached`, weil diese Lane die bestehenden V3-Verträge nicht aufruft und nicht verändert.

## Stop an der gemeinsamen V3-/#1222-Grenze

Die ältere Formulierung „Method → S1/M04/I1/HRS → BG1 → Visitor-Readback“ würde gepinnte V3-Dateien und die Anzeige-Lane [#1222](https://github.com/Jetnity/jetnity/issues/1222) berühren. Das ist hier gestoppt. #1222 bleibt exklusiv für Kundenanzeige, `/einreise`, Komponenten, Präsentation und Visitor-Logik.

Nicht angefasst:

- `components/trips/Reisevorbereitung.tsx`
- `components/readiness/**`
- `components/trips/reisekarte/**`
- `app/(public)/einreise/**`
- `lib/readiness/official-truth-product-v3/**` einschliesslich `visitor/**` und der CH→DE-Source-Programme
- `lib/readiness/preparation-premium-experience-5.ts`
- `lib/readiness/official-presentation.ts`
- `lib/trips/destination-essentials.ts`
- Datenbank-, RLS-, Auth- und CI-Verträge

Eigene Dateien:

- `lib/readiness/official-truth-at-source-reader/publications.ts`
- `lib/readiness/official-truth-at-source-reader/bind.ts`
- `lib/readiness/official-truth-at-source-reader/transport.ts`
- `lib/readiness/official-truth-at-source-reader/import-adapter.ts`
- `lib/readiness/official-truth-at-source-reader/reader.test.ts`
- `docs/official-truth-at-source-reader/LIVE_READ_2026-11-16.json`
- `docs/official-truth-at-source-reader/SCOPE_BOUNDARY_2026-11-16.md`

Der Test `lane files stay inside the isolated reader` prüft die Importe dieser Dateien gegen die verbotenen Pfade.

## Live-Abruf 16.11.2026, ohne fachliche Freigabe

Alle drei GETs lieferten HTTP 200 ohne Weiterleitung. Der HTML-Körper liegt nicht im Repository.

| Quelle | Bytes | SHA-256 | Bindung | Versionsbeobachtung |
| --- | ---: | --- | --- | --- |
| BMI Visum-/Nationalitätsmatrix | 498415 | `fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778` | Titel gebunden, BOM | ein Token `(Stand: 6.11.2026)`, nicht genehmigt |
| BMI allgemeine Einreise | 91655 | `ab2b735bf53e21a83c447fe9cfefabd7ffc54406f68793d01acac421fd6c301e` | Titel gebunden, BOM | kein Stand-Token |
| BMEIA Bern, Antrag | 172460 | `7ca5618875cf1eccea033e1b851cdd8aea3d1aef80585048f62826c8c5266c18` | Titel und ein Canonical | kein Stand-Token |

Der Literal `15.7.2026` kam in keiner der drei Antworten vor. `6.11.2026` kam nur in der Matrix vor. Das ist eine Beobachtung für den Technical Lead, keine Feststellung, dass die Matrixfassung vom 6.11.2026 die freigegebene Rechtsfassung ist. Beide BMI-Antworten trugen dasselbe `Last-Modified: Mon, 16 Nov 2026 19:49:32 GMT`. Dieser Header ist deshalb kein Dokumentversions-Pin.

Der Adapter liess den Kandidaten ohne externen Technical-Lead-Beleg auf `tl_evaluation_required`. Akzeptierte Fakten: 0. Kundenaussage: derzeit nicht verfügbar.

## Nächster Schritt

Der Technical Lead bewertet die Originalbytes fachlich und entscheidet, welche Teilregeln überhaupt ein V3-Methodenkandidat werden dürfen. Erst danach kann eine eigene, ausdrücklich beauftragte Anbindung an den bestehenden V3-Pfad geprüft werden. Diese Lane setzt nicht Ready, mergt nicht und veröffentlicht nicht.
