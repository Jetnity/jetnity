# PR #32 – Foundation C Production Acceptance

Stand: 22. August 2026  
Status: **abgeschlossen / Production-Schema verifiziert**

## GitHub / Anwendung

- PR #32 `Foundation C – Travel Readiness & Dokumente` wurde nach Human-/Architecture-Review und finalem Truth-/Freshness-Fix auf Ready gesetzt und per Squash nach `main` gemergt.
- PR-Head vor Merge: `a5099b98c9456ce07c9b12443d5540843ef8f669`
- Squash-Merge auf `main`: `b50d2ce9ebc4e50da858f67258f94f887b183f79`
- CI auf dem finalen PR-Head: erfolgreich.
- Vercel Preview auf dem finalen PR-Head: READY.
- Vercel Production-Deployment für Merge-Commit `b50d2ce9...`: READY (`target=production`).

## Supabase

Production-Projekt: `qscbgcdmivbbnzrcyegn`  
Development-Projekt: `yfvbxvijcorffwxbxahl`

Vor der Production-Übernahme lag Development exakt zwei Migrationen vor Production:

1. `20260822010000_trip_readiness_items`
2. `20260822020000_trip_travellers`

Keine weitere Migration/Drift lag zwischen Development und Production.

Die Development-Branch wurde anschließend kontrolliert nach Production gemergt. Danach wurden beide Migrationen direkt in der Production-Migrationshistorie verifiziert.

## Production-Schema

Neu auf Production:

- `public.trip_readiness_items`
- `public.trip_travellers`

Beide Tabellen haben RLS aktiviert.

### Policies

Für `trip_readiness_items` und `trip_travellers` existieren jeweils getrennte Policies für:

- SELECT
- INSERT
- UPDATE
- DELETE

Alle Policies gelten nur für `authenticated` und sind auf `user_id = auth.uid()` begrenzt. INSERT/UPDATE besitzen entsprechende `WITH CHECK`-Grenzen.

### Grants

- `authenticated`: SELECT, INSERT, UPDATE, DELETE auf den beiden neuen Tabellen
- `anon`: keine Tabellenrechte
- `public`: keine Tabellenrechte

Damit sind die Tabellen zwar für angemeldete Nutzer über die API-Domäne erreichbar, aber RLS begrenzt den Zeilenzugriff auf den Eigentümer.

## Supabase Security Advisor

Nach der DDL-Änderung wurde der Production Security Advisor erneut ausgeführt.

Für die beiden neuen Tabellen meldet Supabase den generischen Hinweis `pg_graphql_authenticated_table_exposed`, weil `authenticated` SELECT besitzt. Das ist für die aktuelle Jetnity-Datenzugriffsarchitektur erwartet; die tatsächlichen Zeilen bleiben durch RLS auf `auth.uid()` begrenzt.

Der Advisor meldet daneben ältere, bereits bestehende Warnungen zu anderen Tabellen und mehreren `SECURITY DEFINER`-Funktionen. Diese Warnungen wurden **nicht durch Foundation C eingeführt** und bleiben als separater Security-Hardening-Track sichtbar.

## Was Foundation C jetzt produktiv bereitstellt

- persistenter User-Readiness-Stand
- trip-spezifischer Traveller Context
- Guest-/Account-Parität
- automatische Context-Stale-/Freshness-Grundlage
- provider-neutrale Travel Requirements Engine
- Requirement-Typen für Visa, ETA/eTA/ESTA, Pass, ID, Passgültigkeit, Transit, Health, Vaccination, Health Documents, Entry Forms, Insurance, Return/Onward Ticket, Booking Documents und weitere Anforderungen
- strikt getrennte Official Requirement Truth und User Readiness
- fail-closed Verhalten ohne Provider (`unknown` / `provider_unavailable` / `insufficient_context`)
- async Provider-Port, Multi-Transit-Vollständigkeit, Evidence-Trust-/Validity-Grenzen
- UI-Bereich `Einreise & Reisevorbereitung` im Trip Workspace

## Bewusst noch nicht aktiv

- kein echter Requirements-/Visa-/Health-Provider
- kein Timatic-Vertrag, kein Secret
- keine automatisch belegten Visa-/Impf-/Transit-Aussagen ohne Provider
- Origin-/Transit-Ländercodes werden noch nicht aus strukturierten Flight-/Itinerary-Daten gespeist; `routeFactsAusReise()` bleibt die vorbereitete Naht
- kein Dokumententresor, keine OCR, keine Pass-/ID-/Visa-Scans, keine Dokumentnummern, keine Gesundheitsakte

## Kosten

- keine neuen laufenden Kosten durch Foundation C
- kein kostenpflichtiger Provider aktiviert

## Ergebnis

Foundation C ist auf `main`, Vercel Production ist READY und das notwendige Supabase-Production-Schema ist verifiziert. Die Foundation ist abgeschlossen.

Nächste fachliche Schritte müssen auf diesem Stand aufbauen und Foundation C **nicht erneut entwickeln**.