# PR #38 – Production Integration

Stand: 24. August 2026

## Status

**Vollständig integriert und auf Production verifiziert.**

- PR: `#38 Travel Timing & Seasonal Intelligence – provider-neutrale Foundation`
- R17: **PASS / Technical Closure**
- finaler PR-Head vor Merge: `1a61d21fe853c77faa1109ae0828e39f3629098a`
- Squash-Merge auf `main`: `ee988bbe46a8dd63d4001c42825fc0159453f811`
- Vercel Production: `dpl_5wwLu6tbPLhPJgFMLC1PHx3wzcVS`, **READY**, exakt auf Merge-Commit `ee988bbe...`
- Supabase Production: `qscbgcdmivbbnzrcyegn`, **ACTIVE_HEALTHY**

## Production-Migrationen

Mit ausdrücklicher Product-Owner-Freigabe wurden beide Route-Surface-Migrationen auf Production angewendet und die Migration-History auf die Repository-Versionen ausgerichtet:

- `20260824120000_flug_route_itinerary_surface_evidence`
- `20260824140000_flug_route_itinerary_untrusted_surface`

Die zweite Migration ist der aktuelle kanonische Endzustand: untrusted Client-`surfaceFromAirportCode` wird nicht persistiert.

Live verifiziert:

- manipuliertes `LAX→JFK`, `SFO→NRT`, `surfaceFromAirportCode='JFK'` wird kanonisiert, aber **ohne** Client-Surface-Claim ausgegeben;
- `public.flug_route_itinerary_metadata(text,jsonb)` bleibt **SECURITY INVOKER**;
- `anon` hat **kein EXECUTE**;
- `authenticated` hat **EXECUTE**.

## Qualitätsnachweis

Final unabhängig geprüfter Runtime-Head `5782401943b41ddd1eea1337c93cb37163210362`:

- `npm test` 1703/1703
- Typecheck / Lint / Hygiene grün
- Production Build Exit 0
- UI Audit 1014/1014, 0 Fehler
- DB Rechte 51 / RLS Exit 0 / Security 216/216 / Parallelität 7/7
- GitHub Actions Run `32677741683`: SUCCESS
- Vercel Preview `dpl_74A67UxWrCLWviihrsn9hfYqqZDQ`: READY

Finaler Docs-/Merge-Head `1a61d21f` hatte ebenfalls GitHub CI SUCCESS (`32680746340`) und Vercel SUCCESS vor dem Merge.

## Scope / Provider

- `seasonalProviderAus()` bleibt `null`
- kein Live-Seasonal-Provider
- keine neuen Secrets
- keine Seasonal-Tabelle
- keine neuen laufenden Providerkosten

## Abschluss

PR #38 ist abgeschlossen. Kein weiterer PR-#38-Review-Rundlauf ohne konkrete neue Runtime-Änderung oder neuen belegbaren Defekt.

Die technische Sperre für die ersten konfliktarmen Account- und Admin-Slices ist aufgehoben. Shared Auth/RLS/DB/Privacy/Billing/Support/Traveller/Route-Verträge bleiben zentral Technical-Lead-koordiniert und seriell.