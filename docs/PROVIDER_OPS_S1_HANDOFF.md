# Jetnity – Provider Ops S1 Handoff

Stand: 24. August 2026  
Status: **S1 implementiert und lokal gegatet; Draft-PR #47 wartet auf Exact-Head CI/Vercel und unabhängigen Technical-Lead-Review**

## 1. Übernahme

Ein neuer Agent liest zuerst:

1. `docs/PROVIDER_OPS_S1_TASK.md`
2. `docs/PROVIDER_OPS_S1_STATUS.md`
3. diesen Handoff
4. `docs/ACTIVE_WORK_STATUS.md`
5. ADR-0152 in `DECISIONS.md`
6. Audit-Quellen auf `audit/provider-readiness` (PR #45 bleibt Audit-Draft)

Nicht auf `audit/provider-readiness` implementieren. S1 lebt nur auf `feat/provider-ops-s1`.

## 2. Exact Runtime Head

- Branch: `feat/provider-ops-s1`
- Draft-PR: https://github.com/Jetnity/jetnity/pull/47
- Base: `main` @ `e4f4cca75e55028fab231c1827abf6236ae30eec`
- Implementierungs-Commit: `66413cf9`
- Dokumentations-Head: der Commit, der diese Datei trägt
- Account AP-1 PR #43 und Admin Slice A PR #44 sind parallele Workstreams und nicht Teil dieses Heads

## 3. Gate-Ergebnisse

Lokal gegen `66413cf9` verifiziert:

- `npm test`: 1726/1726 pass
- Typecheck: pass
- Lint: pass
- `check:dead` / `check:exports` / `check:deps` / `check:schema-bezug`: pass
- Production-Build: pass (Exit 0)
- `check:api-schutz`: pass

Noch offen, bis gegen den **Dokumentations-Head** belegt:

- GitHub Actions SUCCESS auf Exact Head
- Vercel Preview READY auf demselben Exact Head

Keine UI-Änderung. Kein neuer visueller Produktslice.

## 4. Geänderte Domains

Nur Operationshüllen und die Flights-Route:

- neu: `lib/provider-ops/*`
- Wrapper: `lib/{flights,hotels,activities,mobility,rental-cars,readiness,safety,seasonal}/{anfrage,rate-limit,zustand}.ts`
- Flights: `lib/flights/anfrage.ts`, `lib/flights/domain.ts` (`maxAnfrageBytes`), `lib/flights/suche.ts` (`retryAfterSec`), `app/api/flights/search/route.ts`

Öffentliche Domain-Funktionsnamen und deutsche Fehlermeldungen der bestehenden Hüllen bleiben erhalten.

Kleine Härtungs-Konsistenz der Flugsuche: Request-Fehler nutzen jetzt dieselbe Client-Antwortform wie Hotels (`sucheFuerClient`), inklusive `coverageNote`. Zuvor war `coverageNote` auf dem JSON-Parse-Fehlerpfad leer.

## 5. Bewusst unveränderte Domain-Truth

Unverändert bleiben:

- Route Truth / Traveller Registry / Official / Safety / Seasonal Fact Truth
- Duffel-Adapter und fehlendes Request-`currency`
- Flug-Kontoübernahme ohne `FlugNachweis`
- Mobility-/Rental-Nachweis-Stubs
- Safety-HTTP-Rekonstruktion `party: []`
- Mobility Auto-Search im Workspace
- Seasonal-Rate-Limit-Algorithmus (Fensterzähler, nicht Sliding-Window)
- Mobility-/Rental-Timeout-HTTP **504**

## 6. Datenbank

Keine Migration. Keine RLS-Änderung. Keine Typenänderung. Kein Service Role in `lib/provider-ops`.

## 7. Security

- Request-Härtung fail-closed: nur `application/json`, Content-Length-Precheck, Stream-Cap, kein Request-Rohtext in Fehlern
- Cost Guard fail-closed bei leerer Kennung; Domain-Wrapper normalisieren leer weiter auf `unbekannt`, wie bisher
- Production-Kill-Switch bleibt hart aus
- keine Secrets, keine Client-Bundles mit Provider-Keys
- Observability-Typ ohne Tokens, Namen, Dokumente, Routen, Preise oder Rohpayloads
- öffentliche Guest-Suche bleibt öffentlich; S1 macht daraus kein Auth-Feature

## 8. Kosten

Keine neuen laufenden Kosten. Keine Live-Provider-Calls. Keine neue SaaS. In-Memory-Limits bleiben prozesslokal und sind **kein** globales Production-Kostenschutz.

## 9. Offene P0/P1 aus PR #45, die S1 nicht schließt

Aus dem Audit auf `audit/provider-readiness` (Exact Head `172ff5eb`), hier nicht erneut implementiert:

- **P0** Flug-Kontoübernahme persistiert Browser-`FlugOption` ohne `FlugNachweis` → S2
- **P0** In-Memory-Limits sind kein globales Production-Cost-Guard → S6
- **P1** keine Provider-Telemetrie / Admin-Health → S7
- **P1** kommerzielle Optionen ohne `retrievedAt` / Stale-Label → S5
- **P1** Mobility-/Rental-Nachweis sind Stubs → S3
- **P1** Readiness `evaluate` ohne `AbortSignal` / explizites Timeout → S4
- **P1** Safety-HTTP-Rekonstruktion setzt `party: []` → S4
- **P1** Mobility sucht beim Workspace-Mount automatisch → S3
- **P1** Duffel-Request sendet kein `currency` → S5

S1-Restpunkt: Mobility-/Rental-Timeout bleibt HTTP 504, weil eine stille Umstellung auf 200 den Public Contract brechen würde.

## 10. Nächster Schritt

1. GitHub Actions und Vercel Preview auf dem Exact Head dieses Branches belegen.
2. Unabhängigen Technical-Lead-Review von Draft-PR #47 anstoßen.
3. **Nicht** Mark Ready, **nicht** mergen, **nicht** S2 starten, **nicht** Provider aktivieren.

PR #45 bleibt Audit-Draft.
