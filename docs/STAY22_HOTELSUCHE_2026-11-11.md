# Stay22 Hotelsuche — Arbeitsauftrag und Nachweise

## Auftrag und Basis

- Nutzerauftrag: Stay22 im bestehenden Unterkunftsbereich als echte Suche mit Bildern, Preisen und Karte einsetzen; günstigere Angebote erkennbar machen.
- Basis: `e7aae86c18238033c2186722e24c84dc7a5f69b9`, Branch `feat/stay22-hotelsuche`; Betriebsmodus NORMAL.
- Ein Writer: Codex im aktuellen Chat. Read-only Codebase Explorer `stay22_codeanalyse`; kein zweiter Writer, keine Änderungen an paralleler M04-Arbeit.
- Aktuelle Freigabe umfasst Einrichtung und prüfbare Umsetzung. Keine neue Zahlung, keine Buchung, keine Vertragsänderung. Produktionsveröffentlichung erst nach konkreter Vorschau und Releaseprüfung.

## Verifizierte Anbietergrenze

Am 11. November 2026 im angemeldeten Stay22 Hub sichtbar: AID `jetnity`, Direct Travel API „Access is currently closed“, keine API-Tokens. Die offizielle Karte zeigt Originalbilder (u.a. bstatic.com), Anbieterpreise, Bewertungen und eine Karte. Die Parameter `checkin`, `checkout`, `adults`, `rooms`, `currency=CHF`, `priceper=total` sowie ausgeblendete externe Such-/Datumsfelder wurden an der offiziellen Einbettung geprüft. Die Anzeige bezeichnet Preise als Summe inkl. Gebühren für die gewählten Nächte.

- https://dev.stay22.com/docs/maps
- https://dev.stay22.com/docs/maps/parameters
- https://dev.stay22.com/docs/api
- https://dev.stay22.com/docs/allez/roam

Roam optimiert Buchungswahrscheinlichkeit. Es beweist keinen niedrigsten Preis. Kein Vergleich gleicher Zimmer über mehrere Anbieter, kein Vollmarkt-/Bestpreisversprechen, keine erfundenen Ergebniszahlen. Die API bleibt geschlossen; keine ausgelesenen Widget-Ergebnisse in Jetnitys Datenbank. Stay22 stellt die Ergebnisliste dar und verantwortet deren Filter. Eine Sortierung nach dem günstigsten Preis wurde nicht belegt. Jetnity kennzeichnet diese Grenze.

## Umsetzungsplan

1. Kleiner Stay22-Vertrag: validierter öffentlicher Suchort, explizite gültige Aufenthaltsdaten, Erwachsene/Kinder/Zimmer, unterstützte Anzeigewährung. Feste AID und nicht personenbezogene Kampagne. Keine privaten Reise-IDs, Notizen, Budgets oder Passdaten.
2. `Hotelsuche.tsx`: zentrale Suche bleibt erhalten. Reiseziel aus Etappe oder bestätigter Ortssuche, bearbeitbare Belegung, Ergebnisse direkt darunter. Keine Anfrage vor Suchen. Änderungen verwerfen alte Ergebnisse. Der Reisegraph bleibt unverändert.
3. Separate Ergebnisfläche mit offizieller Stay22-Einbettung, Liste/Karte, Budget-/Bewertungsfiltern und Provider-Handoff. Keine manipulierten Anbieterinhalte. Mobile und Tastaturbedienung prüfen.
4. Fremder Origin, restriktive iframe-Berechtigungen, kein Script auf Jetnitys Origin; CMP-Ablehnungen und Widerruf respektieren. Suchaktion erläutert die Datenübertragung. Ausblenden entfernt den Rahmen. Ladeereignis gilt nicht als Nachweis verfügbarer Angebote; externe Fehler bleiben externe Fehler.
5. Keine Migration, keine neue Jetnity-API, kein API-Schlüssel, keine neue Bibliothek, keine bezahlte Infrastruktur. Aktualisierung der Integrationsdokumentation und zutreffender Datenschutzhinweise außerhalb des unveränderten PrivacyBee-Texts.

## Prüfungen und Abnahme

- Vertragsfälle: Ort, echte Kalenderdaten, fehlende/alte/verkehrte Termine, Belegung und Währung, Parameter-Allowlist, keine private Datenweitergabe.
- Browser: vor Suche keine Stay22-Verbindung; richtige Termine/Belegung; Standortwechsel; Ergebnisentfernung bei Eingabe/Tab/Tripwechsel; Ablehnung/Widerruf; Wiederholen; iPhone-Breite.
- Reale Anbieteranzeige und Buchungshandoff getrennt von kontrollierten UI-Tests prüfen; keine Testpreise als Live-Ergebnis.
- TypeScript, Lint, Production-Build und relevante Hygieneprüfungen. Unabhängiger read-only Review vor Abschluss.

## Nachweise am 11.11.2026

- Lokale Production-Vorschau im isolierten Chrome-Tab: `http://127.0.0.1:3972/vorschau`. Synthetische Thailand-Testreise; keine Änderung an der echten gespeicherten Reise. Neue Vorschauaufrufe ersetzen ausschließlich die eigene gleichnamige Testreise.
- Reale Anbieteranzeige in Chrome: Bilder, Preise, Liste/Karte sowie Budget-, Sterne- und Gästebewertungsfilter sichtbar; Stay22 zeigte u.a. Booking.com/Vrbo und in weiteren Suchorten Hotels.com/Expedia. Der beobachtete Hotels.com-Handoff enthielt Aufenthalt, Erwachsene und Affiliate-Parameter. Keine Buchung durchgeführt. Kein Beweis für gleiche Zimmer/gleiche Bedingungen über alle Anbieter.
- Freie Ortsauswahl Paris tatsächlich über den bestehenden Serverpfad bestätigt: Frankreich mit Region und Koordinaten, getrennt von Paris/Texas. Reisegraph bleibt unverändert.
- 23 gezielte Vertrags-/Orts-/Katalogtests erfolgreich; davon 5 neue Stay22-Tests. TypeScript erfolgreich. Vollständiger Lint: 0 Fehler, 195 bereits vorhandene Warnungen; gezielter Lint der Änderung ohne Fehler. Alle fünf erforderlichen Hygieneprüfungen erfolgreich. Production-Build erfolgreich.
- Kontrollierte Browserprüfung mit einem fremden iframe **ohne Angebote/Preise**: keine Anfrage vor Submit, Datumsfehler und Fokus, Belegungsparameter, erneut identische Suche, Verwerfen bei Änderungen, Ausblenden und Kategorie-Wechsel, unbestätigte Ortswahl, CMP-Widerruf und danach fehlender CMP, unveränderter Reiseinhalt. Desktop Chromium, mobiles Chromium und iPhone WebKit erfolgreich. Zusätzliche Knöpfe oben/unten im Test-iframe prüfen echte Klickbarkeit neben der festen Jetnity-Navigation; die Rahmenhöhe berücksichtigt nun deren beide Abstände. Der schwebende Nach-oben-Knopf wird auf kleinen Bildschirmen während der geöffneten Suche ausgeblendet, damit er keine Kartensteuerung verdeckt. Kontrollknöpfe wurden mit echten Bildschirmklicks bedient und davor gegen verdeckende Elemente geprüft; keine erzwungenen Klicks oder simulierten DOM-Click-Ereignisse.
- Unabhängiger read-only Review: erste drei P2-Befunde (identische Wiederholung, bestätigte Ortsidentität, Fehler/Fokus) behoben und nachgeprüft. Anschließend keine nachgewiesenen P1/P2-Codeblocker im geprüften Umfang. Der spätere mobile Abstand ist zusätzlich durch die Kontrollprüfung abgedeckt.

## Status und offene Abnahme

Lokale Vorschau implementiert. Keine Veröffentlichung, kein Merge und kein Wechsel des laufenden Production-Deployments. Keine Datenbankmigration, keine neue Bibliothek und kein bezahlter Dienst aktiviert. Architektur, Roadmap, Entscheidung und ergänzender Datenschutzhinweis dokumentiert.

- Die Direkt-API ist für das Konto geschlossen. Ein eigener Katalog, ein Gleichzimmer-Vergleich über Anbieter und eine garantierte günstigste Auswahl bleiben extern blockiert/nicht belegt.
- Original-Widget auf physischem iPhone/Safari noch nicht abgenommen. Die simulierte WebKit-Prüfung belegt die Jetnity-Oberfläche und den kontrollierten Rahmen; sie ersetzt diese Abnahme nicht. Wiederholte automatische Live-Zugriffe führten zu HTTP 429, deshalb nicht weiter wiederholt. Ein iframe-load wird nicht als erfolgreicher Angebotsabruf dargestellt.
- Kinderalter und tatsächliche Verarbeitung mehrerer Zimmer beim externen Buchungsanbieter sind nicht abschließend belegt. Die Übergabe der angefragten Parameter ist getestet; Nutzer müssen Zimmeraufteilung, Kinderalter und Endpreis beim Anbieter prüfen.
- E-Mail-Verifikation und Auszahlungseinrichtung im Stay22 Hub stehen aus. Keine Support-Nachricht, kein API-Wartelistenantrag und kein Token wurde ausgelöst.
- Nächster Schritt: Owner-Vorschau und tatsächlicher mobiler Anbieterablauf; danach konkrete Releaseprüfung und Freigabe. Die separate M04-CI-Arbeit anderer Chats bleibt unverändert.
