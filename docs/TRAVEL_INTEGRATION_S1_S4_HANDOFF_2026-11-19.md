# Reiseintegration S1–S4 — unabhängiger Technical-Lead-Handoff (19.11.2026)

**Issue:** [#1256](https://github.com/Jetnity/jetnity/issues/1256) · **Base:** [Gesamtplan 18.11.](JETNITY_GESAMTSTAND_RECONCILIATION_2026-11-18.md) · **Branch:** `feat/travel-integration-20261119` · **PR:** genau einer, sobald wieder ein Platz verfügbar ist.

## Teil 1 – Etappenkontext, Gast/Konto und Stay22

Vorhandene Hotelsuche bleibt der einzige Suchpfad. `hotelSuchvorlage` liest die einzelne vollständige Etappe aus `hotelZeitraumAusEtappe`; nur für eine einzelne Etappe ohne eigene Daten kann der Gesamtzeitraum dienen. Wiederholte Zielnamen werden über `stageId` getrennt. Erwachsenen-/Kinder-/Zimmerwahl muss ausdrücklich vom Nutzer kommen, weil `Trip.travellers` nur eine Kopfzahl ist und `Trip.party` keine Altersdaten liefert. Bei ungleicher Gesamt-/Hotelsuch-Personenzahl erscheint eine nicht blockierende Warnung; 2 Erwachsene+1 Kind bei vier Reisenden bleibt erlaubt. Hotel-Kinderalter und konkrete Zimmerbelegung werden **nicht** bei Stay22 übertragen. Fehlende Suchbelegung bleibt gesperrt.

## Teil 2 – Sichere Rückkehr

`Organisieren` zeigt einen internen Link `/reisen/<TripId>?ansicht=plan`, optional den **tatsächlich existierenden** zuletzt ausgewählten Reisetag. `lib/trips/workspace-mode.ts` ist die gemeinsame URL-Validierung, nicht ein eigener Router. Externes Anbieter-Checkout/Linkout öffnet separat; **es gibt keine Kontrolle über die Drittanbieter-Webseite und keinen automatisch bestätigten Buchungsimport**. Ein Link aus der Jetnity-Seite ist keine Buchungsquittung. Die Originalreise bleibt unverändert.

## Teil 3 – Merklisten-Evidence, Preise, Buchung

`saved_offers` speichert personalisierte Referenzen, nicht verlässliche aktuelle Preisquotes. Server speichert DiscoverCars-Referenz nur nach erlaubtem Angebotsdetail; manuelle Links sind ungeprüft. Die UI unterscheidet diese Herkunft und ursprüngliches Ablaufdatum, zeigt **Preis/Verfügbarkeit heute: nicht geprüft** und **Nur gemerkt, nicht gebucht**. Der überprüfte sichere HTTPS-Angebotslink kann separat geöffnet werden, um im Anbieterportal **manuell** neu zu prüfen. Keine Fake-Quote, automatisches Repricing, Server-Scraping, Preiscache, importierte Buchung oder Umsatzmeldung.

## Teil 4 – Drittanbieter-Consent

Vorher konnte das separate alte DiscoverCars-Widget nach lokalem „Suchformular laden“ ohne verfügbare CMP-API geöffnet werden; die Netzwerk-/Marketing-Zwecke des Anbieteriframes sind nicht abschliessend qualifiziert. In diesem Paket verweigert der Renderer frühzeitig jede externe DOM-/Network-Aktivierung, solange `CMP_RELEASE_AUTHORIZED`, `VENDOR_SCRIPT_EXECUTION_AUTHORIZED` oder die geprüfte DiscoverCars-Policy fehlt. Eine erneute explizite CMP-Optionalentscheidung ist **zusätzlich** nötig. Damit läuft die bereits integrierte **native serverseitige DiscoverCars-Suche** unverändert, ebenso der sichere vorhandene Affiliate-Link. Vendor-Widget bleibt OFF bis gesonderter Legal-/Owner-Abnahme. False-Policy wird nicht still überschrieben.

## Prüfung und verbleibende Gates

- Historischer S1-Autorlauf 34/34 lokal grün am alten Head, plus TL-S1-R1-Differenzwarnung. Die danach hinzugefügten Tests, S2/S3/S4 und vollständiger CI wurden zum Dokumentationszeitpunkt **noch nicht** als ausgeführt/erfolgreich ausgewiesen; genaue CI und Fehler bitte ausschliesslich am **neuen** PR-Head auf GitHub ablesen.
- Neue Tests: `lib/trips/hotel-suchbelegung.test.ts` (Teilgruppe), `lib/trips/provider-rueckkehr.test.ts` (exakte Trip-/Tag-URL), `lib/saved-offers/evidence.test.ts` (Provenance/Stale/Booking) und `lib/providers/discovercars/widget/renderer.test.ts` (keine DOM- oder Drittanbieteraktivierung ohne alle Gates).
- Einschränkungen: Es gibt keine End-to-End-Provider-Wiedereinstiegs-Automatik, keine automatische Live-Preisprüfung und keinen gekoppelten realen Booking-WebHook. Dies darf nicht als Vollabnahme bezeichnet werden. Stage-/Kinder-/Zurück-/Partnerzustände in Dev UI und echten Geräten sind nach Preview-Isolation #968 getrennt zu prüfen. 
- **Keine** DB, SQL, Auth, Official Truth, Vercel-ENV, bezahlten Live-Calls, Viator-/GYG-Produktionsfreigabe oder Domain-Umschaltung. Gesamte Quelländerung bleibt fail-closed ohne zusätzliche Kosten.

**Merge-Gate:** Der Technical Lead prüft fremde PR-Lanes und alle Diff-Dateien, exakte CI/Test-Gates, bestehende Provider-/Privacy-Sperren und die weiterhin separate Production-Aktivierung. Keine PR-Bereinigung nur aus Anzahlgründen; `Closes #1256` erst mit vollständiger, wirklich geprüfter S1–S4-Scope-Abnahme.
