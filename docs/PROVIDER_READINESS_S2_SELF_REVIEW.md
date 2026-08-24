# Jetnity – Provider Readiness S2 Self-Review

Stand: 24. August 2026  
Branch: `feat/provider-flight-evidence-s2`  
Draft-PR: `#51`

## Auftragstreue

S2 ist auf den Flug-Nachweis begrenzt. Kein Live-Duffel, kein S3–S6, keine DB-Migration, keine Homepage-/Account-/Admin-Arbeit.

## Trust-Grenze

- Browser darf für die Kontoübernahme nur `tripId`, `dayId`, `optionId` senden.
- Kommerzielle Felder aus dem Request werden vom Schema verworfen.
- Nachweis bindet Legs, Passagiere, Kabine, Währung und Gültigkeit.
- Ohne Nachweis oder Suchkontext: fail-closed.
- Guest persistiert keine kommerzielle Provider-Flugoption.
- Guest → Account adelt unbewiesene Flugfelder nicht.

## Foundation-D / Traveller

Keine zweite Route Truth. Keine Route-Heuristik als Nachweisersatz. Traveller-Zusammensetzung kommt aus dem Reisegraphen (`travellers` → adults, children/infants 0), nicht aus Browserfeldern.

## Offene Review-Fragen

1. Ist fail-closed ohne Suchkontext-Speicher die richtige S2-Grenze, oder wäre ein minimaler In-Memory-Store schon S5?
2. Soll Guest → Account Flug-Handelsfelder nur streichen oder Flugpunkte ganz verwerfen?

Gates und Exact Head folgen nach dem Pflichtlauf.
