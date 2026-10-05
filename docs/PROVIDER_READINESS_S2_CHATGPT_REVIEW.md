# Jetnity – Provider Readiness S2 / unabhängiger Technical-Lead-Review

Stand: 24. August 2026

Status: **REQUEST CHANGES – S2-B1 Direct-RPC-Bypass**

Draft-PR: `#51`
Branch: `feat/provider-flight-evidence-s2`
Review-relevanter Runtime-Head: `f61bf7f03d503b1eb62cc324d35a7b659b3e4157`
Docs-only Head vor diesem Review: `2f078b9c5a314bd4383802315ebf0980705d6b45`

## 1. Was im Runtime-Slice korrekt ist

Der neue TypeScript-/App-Vertrag ist fachlich in die richtige Richtung gebaut:

- Konto-Flugübernahme akzeptiert nur `tripId`, `dayId`, `optionId`.
- Browser-Preis, Zeiten, Provider, `externalRef` und zusätzliche Felder werden nicht als Flugnachweis akzeptiert.
- `FlugNachweis` bindet Option an Legs, Passagiere, Kabine, Währung und Gültigkeit.
- Ohne Nachweis oder serverseitigen Suchkontext bleibt die Kontoübernahme fail-closed.
- Guest persistiert keine kommerzielle Provider-Flugoption über den neuen Übernahmepfad.
- Guest → Account entfernt unbewiesene kommerzielle Flugfelder.
- `booking_url` bleibt `null`.
- Route Truth bleibt Foundation D; keine neue Route-Heuristik.

Die dokumentierten Runtime-Gates sind grün:

- `npm test`: 1755/1755
- Production Build: 38/38, Exit 0
- Typecheck/Lint/Hygiene/`check:api-schutz`: PASS
- Trip-Workspace UI-Audit: 1014/1014, 0 Fehler, WebKit + Chromium, 8 Viewports
- GitHub Actions Run `32716484287`: SUCCESS auf Runtime-Head `f61bf7f0...`
- Vercel Preview: READY auf demselben Runtime-Head

## 2. Blocker S2-B1 – authentifizierter Client kann die App-Grenze umgehen

### Befund

Die neue App-Grenze schützt `lib/trips/anlegen.ts`, aber die eigentliche Datenbankfunktion `public.reise_anlegen(jsonb)` bleibt für die Rolle `authenticated` direkt ausführbar.

Live verifiziert auf Supabase Development **und** Production:

- `reise_anlegen(jsonb)` ist `SECURITY INVOKER`.
- `authenticated` besitzt `EXECUTE`.
- `anon` besitzt kein `EXECUTE`.

Die aktuelle DB-Funktion liest aus der übergebenen JSON-Nutzlast weiterhin Handelsfelder für `trip_items`, darunter:

- `price_amount`
- `price_currency`
- `provider`
- `external_ref`
- `booking_url`

Für diese Feld-Provenienz existiert auf `trip_items` kein entsprechender DB-Guard, der einen direkten authentifizierten RPC-Aufruf auf die neue S2-Flugregel begrenzt. Die vorhandenen Trigger schützen u. a. Graph-Revision und Route-Itinerary, nicht diese kommerziellen Flugfelder.

### Konsequenz

Ein authentifizierter Browser muss nicht `reiseAusNutzlastAnlegen()` oder `flugNutzlastOhneUnbewieseneWahrheit()` benutzen. Er kann `public.reise_anlegen(jsonb)` direkt über Supabase/PostgREST aufrufen und für einen `kind='flight'` eigene Preis-/Provider-/Ref-/Booking-URL-Werte mitsenden.

RLS schützt dabei weiterhin das Eigentum an der Reise; das Problem ist die **Provenienz/Truth-Grenze**: Browserdaten können weiterhin als kommerzielle Flugfelder persistiert werden.

Damit ist das S2-Ziel

> Browserdaten dürfen keine kommerzielle Flugwahrheit persistieren.

noch nicht durchgängig erfüllt.

## 3. Warum grüne Tests den Blocker nicht schließen

Die neuen Regressionen prüfen die TypeScript-/Server-Action-Grenze. Sie beweisen nicht, dass ein authentifizierter Client die DB-Funktion nicht direkt aufrufen kann.

Das ist ein separater Trust-Boundary-Pfad und muss selbst fail-closed werden.

## 4. Erforderliche Fix-Richtung

Die Datenbank muss dieselbe Regel erzwingen. Zulässige Zielrichtung:

1. Für `kind='flight'` darf `public.reise_anlegen(jsonb)` unbewiesene kommerzielle Felder nicht aus dem Client übernehmen; sie müssen server-/DB-seitig verworfen bzw. auf `null` gesetzt werden, solange kein expliziter vertrauenswürdiger Nachweis-Pfad existiert.
2. Alternativ darf ein zukünftiger getrennter, server-only vertrauenswürdiger Schreibvertrag kommerzielle Flugfelder setzen. Der heute öffentlich für `authenticated` erreichbare Reise-Anlagevertrag darf dies nicht aus Browser-JSON tun.
3. Keine Service-Role-Ausweitung als Abkürzung.
4. Keine bereits angewandte Migration rückwirkend editieren; nur neue Migration.
5. Production bleibt unverändert, bis der Product Owner eine Production-Migration ausdrücklich freigibt.

## 5. Pflichtregressionen für S2-B1

Nach freigegebenem DB-Scope mindestens:

1. Direktes `authenticated` RPC `reise_anlegen(jsonb)` mit `kind='flight'` + manipuliertem `price_amount/provider/external_ref/booking_url` kann diese Werte nicht als kommerzielle Flugwahrheit persistieren.
2. Derselbe direkte RPC kann weiterhin einen nichtkommerziellen/user-intake Flugpunkt mit erlaubten nichtkommerziellen Feldern anlegen, sofern das bestehende Produkt dies benötigt.
3. Hotels/Aktivitäten/Mobility/Rental bleiben in ihrem bestehenden Vertrag unverändert; kein globales unbeabsichtigtes Nulling fremder Domains.
4. Foundation-D Route-Itinerary bleibt kanonisch/fail-closed und unverändert geschützt.
5. App-Pfad mit `FlugNachweis` bleibt grün.
6. Guest → Account bleibt ohne Hochstufung kommerzieller Flugfelder.
7. DB rights/RLS/security checks bleiben grün.
8. Vollständige lokale Suite + GitHub Actions + Vercel auf neuem Exact Runtime Head grün.

## 6. Gate / Governance

Dieser Review **autorisiert noch keine DB-Migration**. Der ursprüngliche S2-Auftrag schloss DB-/Production-Migrationen aus.

Darum:

- PR #51 bleibt Draft.
- Kein Mark Ready.
- Kein Merge.
- Kein S3.
- Keine Production-Migration.
- Keine Provider-/Secret-/Kosten-Aktivierung.
- Cursor darf S2-B1 erst implementieren, nachdem der Product Owner den notwendigen DB-Contract-/Development-Migrations-Scope ausdrücklich freigegeben hat.

Nach Fix + neuem Exact-Head-Gate folgt ein erneuter unabhängiger Technical-Lead-Re-Review.