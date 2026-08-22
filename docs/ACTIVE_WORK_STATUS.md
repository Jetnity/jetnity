# Jetnity – Active Work Status

Stand: 22. August 2026  
Arbeitsblock: **Foundation D abgeschlossen / Foundation E ist als Nächstes dran**

## Aktueller Zustand

Foundation D – Route & Transit Intelligence ist vollständig abgeschlossen.

- PR #34: gemergt
- Merge-Commit auf `main`: `5bc93bcd35421e3763dc8a3515f254c209b63d6a`
- final geprüfter PR-Head: `11bfc958aba54486148fa756f5f8d4616ff86c8a`
- finaler CI-Lauf: success
- Vercel finaler PR-Head: success
- Vercel Production nach Merge: success
- Production-Abnahme: `docs/FOUNDATION_D_PRODUCTION_ACCEPTANCE.md`

Foundation D **nicht erneut bauen**.

## Production

Nach separater Product-Owner-Freigabe wurden exakt diese Migrationen nach Production übernommen und verifiziert:

- `20260822130000_reise_anlegen_route_itinerary`
- `20260822140000_flug_route_itinerary_airport_truth`
- `20260822150000_trip_items_route_itinerary_guard`

Production ist wieder gesund. Der Route-Guard existiert und die Route-Funktionen laufen als `SECURITY INVOKER` mit festem `search_path`. Ein read-only Production-Test bestätigt, dass Client-Länder nicht als Wahrheit übernommen werden, sondern Airport-Codes gegen die kanonische Referenz ausgewertet werden.

Es wurden keine externen Provider, Secrets oder neuen laufenden Providerkosten aktiviert.

## Nächster Kernblock

**Foundation E – Traveller Context / Multi-Citizenship / Multi-Document**

Vor Implementierung muss ein eigener vollständiger Cursor-Auftrag erstellt werden, inklusive Datenmodell, Migration, RLS, Privacy, API, Domainlogik, UX, Edge Cases, Tests, Security-Review und Production-Gates.

Route Truth aus Foundation D bleibt traveller-neutral und wird wiederverwendet.

## Danach verbindliche Reihenfolge

1. Foundation E – Traveller Context / Multi-Citizenship / Multi-Document
2. Travel Safety & Disruption Intelligence – provider-neutrale Foundation
3. Travel Timing & Seasonal Intelligence – provider-neutrale Foundation
4. Provider-Readiness-Pass über alle relevanten Bereiche
5. großer End-to-End Trip-Workspace-/Übersicht-Umbau inklusive Weg dorthin
6. finaler Workspace Intelligence Audit
7. echte Providerphase
8. Provider-backed End-to-End-/Truth-Audit
9. finale Startseiten-Positionierung

## Großer Workspace-Umbau – verbindlicher Scope

Der spätere Umbau umfasst den kompletten Nutzerweg, nicht nur die Übersicht: Reiseeinstieg, Multi-Destination, Planungsflow, Gast-/Account-Weg, `Meine Reisen`, Übergang in den Workspace, Fachbereiche und deren Zusammenspiel sowie die Übersicht als intelligentes Kontrollzentrum für Status, offene Punkte, Warnungen, Empfehlungen und nächste Schritte.

Fachregel: `docs/TRIP_WORKSPACE_TRANSFORMATION_SCOPE_POLICY.md`.

## Verbindliche globale Regeln

- Kein Bestandsschutz für ältere Funktionen, wenn sie dem heutigen Jetnity-Standard nicht mehr genügen.
- Funktionen müssen mit allen betroffenen Reisebereichen korrekt zusammenspielen.
- Änderungen werden vorgeschlagen und erst nach Nutzerfreigabe übernommen.
- Provider werden erst in der späteren Providerphase produktiv angeschlossen.
- Der Provider-Readiness-Standard gilt global: `docs/PROVIDER_INTEGRATION_READINESS_POLICY.md`.

## Exakter nächster Schritt

1. `main` und Production kurz verifizieren.
2. Handoff, Roadmap und Traveller-/Quality-/UX-/Provider-/Workspace-Policies lesen.
3. Foundation E als separaten Implementierungsblock planen.
4. Vollständigen versionierten Cursor-Auftrag erstellen.
5. Architektur-/Security-/Privacy-Review vor Implementierungsstart.
6. Erst dann Cursor mit Foundation E starten.

Falls ältere Passagen in Handoff oder Roadmap Foundation D noch als offen darstellen, sind sie historisch überholt. **Diese Datei und `docs/FOUNDATION_D_PRODUCTION_ACCEPTANCE.md` enthalten den neueren operativen Stand.**
