# Cursor-Auftrag – PR #31 Production-Dokumentation synchronisieren

Stand: 22. August 2026  
Branch: `feat/rental-car-foundation`  
PR: #31 – Foundation B – Mietwagen  
Status: **Dokumentation synchronisiert**; keine Code- oder Migrationsänderung; PR Ready for Review, nicht mergen

## Zweck

Nur den bereits verifizierten Production-Stand in den bestehenden Repository-Dokumenten sauber nachziehen. **Keine Produktlogik, keinen Code, keine Migration und keinen Provider ändern.**

## Verifizierter Stand – nicht neu interpretieren

- Nutzer hat die Production-Migration ausdrücklich separat freigegeben.
- Migration `20260821200000_trip_items_rental_car` wurde über den Supabase-Branch-Migrationsweg von Development nach Production übernommen.
- Development hatte gegenüber Production genau diese eine zusätzliche Migration; beide hatten keine Edge Functions.
- Production-Migrationshistorie enthält jetzt kanonisch `20260821200000_trip_items_rental_car`.
- Production-Verifikation:
  - vier Spalten vorhanden: `rental_supplier`, `vehicle_class`, `transmission`, `rental_evidence`
  - neun relevanten Rental-/Mobility-/Booking-CHECKs vorhanden
  - 0 ungültige Mietwagenfelder auf Nicht-Mietwagen
  - 0 ungültige `rental_evidence`
  - 0 Transfer-spezifische Mobility-Felder auf `rental_car`
  - 0 ungültige gebuchte Kinds
  - 0 gebuchte Mietwagen mit anderer Quelle als `user`
  - zum Migrationszeitpunkt 0 bestehende `rental_car`-Zeilen
  - `reise_anlegen(jsonb)` bleibt `SECURITY INVOKER`, `search_path=public, pg_temp`, schreibt Mietwagenfelder
  - `reise_aendern(jsonb)` bleibt unverändert und schreibt keine Mietwagenfelder
- Production-Mietwagensuche bleibt hart aus.
- Kein echter Mietwagenprovider, keine Provider-Secrets.
- Real-Device-iPhone-Test ist bestanden.
- Logic-/Truth- und Ranking-Truth-Reviews sind abgeschlossen.
- PR ist Ready for Review, aber **noch nicht mergen**.
- Production-Nachweis: `docs/PR31_PRODUCTION_MIGRATION_ACCEPTANCE.md`.

## Zu aktualisieren

Mindestens:

- `JETNITY_HANDOFF.md`
- `ROADMAP.md`
- `docs/RENTAL_CARS.md`
- `docs/PRODUCTION_ROLLOUT.md`
- relevante aktuelle Statuszeilen in `docs/CONTINUITY_STANDARD.md`, falls dort PR #31 noch als Development-only beschrieben ist
- die drei PR31-Cursor-Auftragsdateien nur dort, wo eine aktuelle Statuszeile sonst fälschlich behauptet, Production sei noch nicht migriert; historische Arbeitsanweisungen nicht umschreiben

## Harte Regeln

1. Keine TypeScript-/TSX-/SQL-/Config-Dateien ändern.
2. Migration `20260821200000` nicht erneut ausführen oder verändern.
3. Keine Production-Suche aktivieren.
4. Kein Provider, Secret, Environment-Flag oder Vercel-Setting ändern.
5. Keine anderen Foundations oder Roadmap-Phasen vorziehen.
6. Kein Merge.
7. Keine Tatsachen erfinden; nur den oben verifizierten Stand dokumentieren.
8. `docs/PR31_PRODUCTION_MIGRATION_ACCEPTANCE.md` ist der verbindliche Nachweis dieses Production-Schritts.

## Abschluss

Nach dem Doku-Sync:

- prüfen, dass nur Dokumentationsdateien geändert wurden
- GitHub CI auf dem neuen finalen Head grün
- Vercel Preview auf dem neuen finalen Head `READY`
- PR bleibt Ready for Review und offen
- Abschlussbericht mit neuem Head und Liste der aktualisierten Dokumente

Danach wartet PR #31 nur noch auf den finalen unabhängigen Review und eine **separate Merge-Freigabe**.
