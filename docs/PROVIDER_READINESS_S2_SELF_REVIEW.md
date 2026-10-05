# Jetnity – Provider Readiness S2 Self-Review

Stand: 24. August 2026  
Branch: `feat/provider-flight-evidence-s2`  
Draft-PR: `#51`  
Integrations-Exact-Head: `e2fcffde68f3ca5244697741c9a9bfc63a2d8a3d`
Vorheriger Functional Exact Head: `1b06b28494086ab24569f48e83978f77543dfc89`

## Auftragstreue

S2-B2 bleibt additiv und nur auf Development. Der nachgezogene Auftrag war das offene GitHub-Actions-Gate: PR #51 war `CONFLICTING` gegenüber `main`, deshalb startete `ci.yml` auf den S2-B2-Heads nicht. `origin/main` @ `2827d1cb` wurde in den Feature-Branch gezogen. Das ist kein Merge von PR #51, kein Mark Ready, kein S3 und keine Production-Migration.

## Trust-Grenze

- App und `reise_anlegen` bleiben fail-closed (S2 / S2-B1).
- Direkte `trip_items`-Writes als `authenticated`/`anon` können Flug-Handelsfelder nicht setzen oder ändern.
- `current_user` ist die Grenze, kein GUC und kein Client-Feld.
- Ein späterer Nachweis darf kommerzielle Felder nicht über denselben `authenticated`-INSERT adeln.
- Der `main`-Sync ändert diese Grenze nicht.

## Pflichtregressionen

`scripts/db/sicherheit.mjs` enthält direkte INSERT-, UPDATE-, kind-Wechsel- und Stay-Kontrollfälle. B1-RPC-Fälle bleiben grün. `db:sicherheit` 223/223 auf `e2fcffde`.

## Remote-Gate

Der vorherige Actions-Gap ist geschlossen: `ci.yml` Run `32732334063` ist SUCCESS auf `e2fcffde`. Vercel Preview `4uQEc9GNFnBYqjoxSpSkw7sQ6pow` ist READY auf demselben Head. PR #51 ist `MERGEABLE` / `CLEAN` und bleibt Draft.

## Integrationshinweis für den Review

Dieser Branch enthält jetzt auch die auf `main` gemergten Account-Slices AP-1 und AP-2. S2-Runtime und S2-Migrationen wurden dabei nicht abgeschwächt. Der Review muss prüfen, dass der Sync keine S2-Trust-Grenze und keine Account-/Auth-Verträge vermischt.

## Offene Review-Fragen

1. Ist fail-closed ohne Suchkontext-Speicher die richtige S2-Grenze?
2. Soll Guest → Account Flugpunkte ganz verwerfen statt nur Handelsfelder zu streichen?
3. Soll der spätere Nachweis-Schreibvertrag jetzt skizziert werden, oder erst mit Provider-Gate?
4. Ist der `main`-Sync fachlich sauber genug für ein späteres Merge-Gate, ohne S2 oder Account zu verwässern?
