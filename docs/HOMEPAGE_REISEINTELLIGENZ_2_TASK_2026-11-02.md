# Homepage Reiseintelligenz 2 – freigegebener Owner-Auftrag

Baseline: main `2311260f005f9702fb0a56f65a1f751cb002808a`.
Branch: `codex/homepage-reiseintelligenz-20261102`. Root ist alleiniger Writer.

## Freigabe und Umfang

Der Owner hat nach zwei Text-/Konzeptreviews den kompakten finalen Auftritt
freigegeben. Der bisherige manuelle Reiseplaner-Auftritt aus PR #1107 wird
ersetzt. Jetnity ist der handelnde Reisebegleiter; das Wort „KI“ darf in
Kundentexten, zugänglichen Namen, Metadaten und Share-Texten nicht erscheinen.
Der Owner will das fertige Zielprodukt darstellen, auch wenn die darunter
beschriebenen Fähigkeiten noch nicht insgesamt produktiv umgesetzt sind.
Diese Freigabe ist eine Positionierungsentscheidung, kein Nachweis oder
Auftrag zur Aktivierung von Flugüberwachung, Einreiseprüfung oder Umbuchungen.

## Abnahme

- H1 „Deine ganze Reise. Intelligent an einem Ort.“ und Bali-Split-Hero erhalten.
- Direkt danach eine bedienbare, ausdrücklich benannte Beispielreise:
  ursprünglicher Plan → Flugänderung → abgestimmter Plan / nächste Handlung.
- Drei starke Fähigkeiten: realistische Route, persönliche Einreise-/Transit-
  und Dokumentenanforderungen mit offiziellen Quellen, Gesamtkosten/Alternativen.
- Automatische Plananpassung klar von bestätigungspflichtigen kommerziellen
  Aktionen unterscheiden. Beispiel führt keine Buchung, Suche oder Persistenz aus.
- Kurzer Einstieg, zusammenhängende Reisebereiche, persönliche Inspiration,
  kompakte FAQ und Abschluss-CTA. Keine Finanzierungs-/Affiliate-FAQ.
- Bestehende bestätigte Ortssuche, Gastfortsetzung und Inspirations-IDs erhalten.
- Kein neues Tracking, keine Abhängigkeiten, keine Datenbank-/API-/Auth-Änderung,
  keine Anbieteraktivierung oder neuen laufenden Kosten.
- Search-Launch-Gate bleibt gesperrt; keine robots-/Sitemap-/ENV-Freigabe.
- Sichtbare Inhalte und Such-/Entity-Beschreibung entsprechen einander.

## Umsetzung und Prüfung

Betroffen: `components/home`, öffentliche Startseite, ihre Texte/Metadaten,
vorhandene Homepage-Prüfungen sowie begrenzte Continuity-Dokumentation.
Weiße Homepage-Navigation wird ausschließlich im Homepage-Rahmen gesetzt.
Statische Inhalte bleiben serverseitig lesbar; nur das lokale Reisebeispiel
braucht einen kleinen interaktiven Zustand. Keine externen Requests daraus.

Prüfen: vorhandene Homepage-/Ortseinstiegs-/SEO-Tests, Typecheck, Lint,
Production-Build, Hygiene. Browser: Desktop/Mobil, 200%-Schrift, Tastatur,
Beispiel vorwärts/rückwärts, FAQ, kein Wort „KI“, keine externen Nebenwirkungen,
korrektes Noindex und unveränderte reale Einstiege. Unabhängiger Review vor Merge.
Reviewer: read-only, kein Ready/Merge und kein Folgeauftrag. Root integriert
nach erfolgreichen erforderlichen Checks und prüft die veröffentlichte Version.
