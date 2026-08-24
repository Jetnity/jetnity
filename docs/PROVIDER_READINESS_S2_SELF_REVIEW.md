# Jetnity – Provider Readiness S2 Self-Review

Stand: 24. August 2026  
Branch: `feat/provider-flight-evidence-s2`  
Draft-PR: `#51`  
Exact Runtime Head: `f8af2059181e1f47d686893a1b5538441c6e2554`

## Auftragstreue

S2 bleibt auf den Flug-Nachweis begrenzt. S2-B1 ist der freigegebene DB-Contract-Fix für den Direct-RPC-Bypass. Kein Live-Duffel, kein S3–S7, keine Production-Migration, keine Homepage-/Account-/Admin-Arbeit, keine Service-Role-/Auth-Änderung.

## Trust-Grenze

- Browser darf für die Kontoübernahme nur `tripId`, `dayId`, `optionId` senden.
- Kommerzielle Felder aus dem Request werden vom Schema verworfen.
- Nachweis bindet Legs, Passagiere, Kabine, Währung und Gültigkeit.
- Ohne Nachweis oder Suchkontext: fail-closed.
- Guest persistiert keine kommerzielle Provider-Flugoption.
- Guest → Account adelt unbewiesene Flugfelder nicht.
- `public.reise_anlegen(jsonb)` übernimmt für `kind='flight'` keine Handelsfelder aus JSON. `booking_url` bleibt null.

## Pflichtregressionen

Die 14 App-Fälle bleiben in `lib/flights/nachweis.test.ts`, `lib/flights/konto-uebernahme.test.ts`, `lib/flights/nutzlast.test.ts`, `lib/trips/gastspeicher.test.ts` und `lib/trips/uebernahme.test.ts` belegt.

S2-B1 ergänzt in `scripts/db/sicherheit.mjs`:

- direkter RPC mit manipuliertem Flugpreis/Provider/Ref/Booking-URL persistiert diese Felder nicht und behält User-Intake plus Foundation-D-Itinerary;
- derselbe RPC behält Hotel-/Aktivitäts-/Mobilitäts-/Mietwagen-Handelsfelder;
- der Tagespunkt-INSERT-Pfad nullt dieselben Flug-Handelsfelder.

Hotel-Nachweis- und Provider-Ops-Regressionen bleiben im vollen `npm test` grün. `db:sicherheit` ist 219/219.

## Foundation-D / Traveller

Keine zweite Route Truth. Keine Route-Heuristik als Nachweisersatz. Traveller-Zusammensetzung kommt aus dem Reisegraphen (`travellers` → adults, children/infants 0), nicht aus Browserfeldern. `flug_route_itinerary_metadata` bleibt der einzige Itinerary-Kanonisierer.

## Bewusste Grenze dieses Fixes

Kein `BEFORE`-Trigger auf `trip_items`, der alle Flug-Handelsfelder nullt. Ein späterer nachgewiesener Server-INSERT (`flugInReiseUebernehmen`) soll nicht pauschal blockiert werden. Gehärtet ist nur der browser-erreichbare JSON-RPC.

## Offene Review-Fragen

1. Ist fail-closed ohne Suchkontext-Speicher die richtige S2-Grenze, oder wäre ein minimaler In-Memory-Store schon S5?
2. Soll Guest → Account Flug-Handelsfelder nur streichen oder Flugpunkte ganz verwerfen?

Diese Fragen sind keine stillen Scope-Erweiterungen. Der Technical Lead entscheidet, ob sie S2 blockieren oder spätere Slices bleiben.
