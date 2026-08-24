# Jetnity – Provider Readiness S2 Self-Review

Stand: 24. August 2026  
Branch: `feat/provider-flight-evidence-s2`  
Draft-PR: `#51`  
Functional Exact Head: `1b06b28494086ab24569f48e83978f77543dfc89`

## Auftragstreue

Nur S2-B2. Additive Development-Migration. Production unverändert. Kein S3, keine Service Role, keine spoofbaren Trusted-Flags, keine Tabellenrechte entzogen.

## Trust-Grenze

- App und `reise_anlegen` bleiben fail-closed (S2 / S2-B1).
- Direkte `trip_items`-Writes als `authenticated`/`anon` können Flug-Handelsfelder nicht setzen oder ändern.
- `current_user` ist die Grenze, kein GUC und kein Client-Feld.
- Ein späterer Nachweis darf kommerzielle Felder nicht über denselben `authenticated`-INSERT adeln.

## Pflichtregressionen

`scripts/db/sicherheit.mjs` enthält direkte INSERT-, UPDATE-, kind-Wechsel- und Stay-Kontrollfälle. B1-RPC-Fälle bleiben grün. `db:sicherheit` 223/223.

## Offener Remote-Gate

`ci.yml` hat auf `34a87e9f`, `1b06b284` und `1063f279` keine Check-Suite erzeugt. Vercel auf diesen Heads ist READY. Das ist kein stiller Erfolg; der Technical Lead muss den Gap bewerten.

## Offene Review-Fragen

1. Ist fail-closed ohne Suchkontext-Speicher die richtige S2-Grenze?
2. Soll Guest → Account Flugpunkte ganz verwerfen statt nur Handelsfelder zu streichen?
3. Soll der spätere Nachweis-Schreibvertrag jetzt skizziert werden, oder erst mit Provider-Gate?
