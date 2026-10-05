# Product Owner Addendum – Provider Readiness und Reihenfolge

Stand: 22. August 2026  
Status: **verbindliche Product-Owner-Entscheidung / kein Foundation-D-Code-Scope**

## Entscheidung

Der Product Owner hat verbindlich entschieden:

1. **Echte Provider, Verträge, Secrets und Production-Aktivierungen werden bewusst erst in einer späteren finalen Providerphase angeschlossen.**
2. Vorher müssen alle providerabhängigen Jetnity-Funktionen auf Jetnitys Seite professionell `provider-ready` sein.
3. Das bedeutet: provider-neutrale Ports/Interfaces, interne Verträge, Normalisierung, Truth/Evidence/Freshness, Failure-/Timeout-/Unavailable-States, Kill Switches, Security-/Secret-Grenzen, sichere Übernahme/Nachweis, Contract-Testbarkeit und UI ohne Fake-Daten müssen fertig sein.
4. Ein **konkreter provider-spezifischer Adapter** wird erst vollständig gebaut, wenn der Anbieter und sein echter aktueller API-Vertrag gewählt wurden. Keine erfundenen Provider-Schemas.
5. Diese Regel gilt nicht nur für Hotels, sondern systemweit für Flüge, Unterkunft, Aktivitäten, Mobilität/Bahn/Bus/Fähre/Transfers, Mietwagen, Travel Requirements, Safety/Disruption, Timing/Seasonality und jede weitere relevante externe Datenfunktion.

Globale verbindliche Policy auf `main` nach Branch-Synchronisierung:

- `docs/PROVIDER_INTEGRATION_READINESS_POLICY.md`

## Aktueller Architekturstand

- **Flights:** `FlightProvider` + Duffel Development Adapter vorhanden; Production Provider/Live-Aktivierung später.
- **Hotels:** `HotelProvider` + `HotelNachweis` vorhanden; konkrete Factory/Adapter aktuell `null`.
- **Activities:** `ActivityProvider` + `ActivityNachweis` vorhanden; konkreter Adapter aktuell `null`.
- **Mobility:** `MobilityProvider` + `MobilityNachweis` vorhanden; konkreter Adapter aktuell `null`.
- **Rental Cars:** `RentalCarProvider` + `RentalCarNachweis` vorhanden; konkreter Adapter aktuell `null`.
- **Readiness:** provider-neutrale Requirements Engine/Port vorhanden; echter Provider erst nach Foundation E.
- **Safety/Disruption:** technische provider-neutrale Foundation noch zu bauen.
- **Timing/Seasonality:** technische provider-neutrale Foundation noch zu bauen.
- Weitere externe Datenabhängigkeiten (z. B. Routing/POI/Live Status/Monitoring) werden in einem späteren Provider-Readiness-Audit vollständig inventarisiert.

## Neue verbindliche Reihenfolge

Diese Reihenfolge ersetzt ältere Sequenzformulierungen, in denen Safety/Seasonality erst nach dem großen Workspace-Umbau vorgesehen waren:

1. Foundation D sauber abschließen.
2. Foundation E – Traveller Context / Multi-Citizenship / Multi-Document.
3. Travel Safety & Disruption Intelligence provider-neutral bauen.
4. Travel Timing & Seasonal Intelligence provider-neutral bauen.
5. Provider-Readiness-Lücken aller bestehenden/neuen externen Datenfunktionen inventarisieren und Jetnity-seitige Ports/Verträge schließen.
6. Großen Trip-Workspace-/Übersicht-Umbau auf diesen Grundlagen durchführen.
7. Vollständigen Workspace Intelligence / Cross-Domain Audit durchführen.
8. Finale echte Providerphase: Anbieter wählen, konkrete provider-spezifische Adapter implementieren/verifizieren, Sandbox/Preview, Kosten/Security/Production-Gates.
9. Provider-backed End-to-End-/Regression-/Truth-Audit erneut ausführen.
10. Finale Startseiten-Positionierung/-Kommunikation auf Basis der real verfügbaren Produktfähigkeiten.

## Auswirkung auf PR #34

Keine dieser späteren Funktionen jetzt in Foundation D implementieren.

Beim Closeout:

- Branch mit aktuellem `main` synchronisieren.
- `docs/PROVIDER_INTEGRATION_READINESS_POLICY.md` übernehmen und als verbindlich behandeln.
- `ROADMAP.md`, `JETNITY_HANDOFF.md` und andere Sequenzangaben semantisch auf die neue Reihenfolge aktualisieren, wenn dort noch die ältere Reihenfolge steht.
- `docs/ACTIVE_WORK_STATUS.md` muss die neue verbindliche Reihenfolge nennen.
- PR #34 weiterhin nicht mergen / nicht Mark Ready / keine Production-Migration ohne separate Freigabe.
