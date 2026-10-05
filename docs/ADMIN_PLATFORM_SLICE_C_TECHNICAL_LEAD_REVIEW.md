# Admin Slice C – Independent Technical-Lead Review

Stand: 24. August 2026, 20:34 Europe/Zurich  
Agent: `Admin platform audit`  
PR: #49 `Admin Control Center Slice C – Provider & Cost Board`  
Branch: `feat/admin-provider-cost-board`  
Base: `main` `e3bad749c8e03512001e7bccd5e08467f10a7134`  
ADR: ADR-0162

## Ergebnis

**PASS / Technical Integration Closure für Admin Slice C.**

Kein Mark Ready und kein Merge durch diesen Review. Product-Owner-Gates bleiben separat.

## Geprüfte Heads / Evidence

- funktionaler Runtime-Head: `965034d6c5ac412472ceca38be97863bf072e9c0`
- Exact Head mit belegten Remote-Gates: `bc60120f953508ede0410c26c9384f20d380738d`
- vor diesem Review beobachteter docs-only PR-Head: `61b6b376c960b8ac43ccdf3584519e8e01cb03dc`
- GitHub Actions auf `61b6b376...`: Run `32760714279` = SUCCESS, Base `main` exakt `e3bad749...`
- Vercel auf `61b6b376...`: Status `success` / Preview READY (`DpzA6Kd2f1DzHc7WsSDNBbrSL6Jh`)
- lokale Evidence des Agenten: 1846/1846 Tests, Typecheck, Lint, Hygiene, `check:api-schutz` 12/12, `auth:pruefen` 55/55, Production Build und `audit:admin-provider-ops` 8/8

## Adversarial geprüft

### Authorization / Security

- `/admin/provider-ops` verlangt `requireAdminPage(... capability: 'betrieb-lesen')`.
- `/api/admin/provider-ops` ist GET-only und verlangt `requireAdminApi(... capability: 'betrieb-lesen')`.
- keine POST/PUT/PATCH/DELETE-Route in Slice C.
- keine Service Role, keine Management-API, keine neuen Secrets oder Provider-Tokens.
- `model_usage` wird über den authentifizierten Supabase-Client und die bestehende RLS-Policy `darf_betrieb_lesen()` gelesen.
- selektiert werden nur `created_at` und `kosten_mikro_usd`; insbesondere kein `kennung_hash`, Prompt oder Reiseinhalt.

### Truth / Provider / Cost

- Parent Provider-Ops bleibt `foundation_only`, auch wenn eine einzelne Test-Capability `available` ist.
- sichtbares Grün ist auf frische, eng belegte Domain-Test-Capabilities begrenzt; Parent, Kill-Switch, Cost Guard und Model Usage werden nie pauschal grün.
- Kill-Switch wird nicht als persistente Enforcement verkauft.
- In-Memory Cost Guard wird ausdrücklich nicht als globales/persistentes Budget verkauft.
- Production-Provider-Health, Verträge und Live-Traffic werden nicht behauptet.
- leere `model_usage` wird als `empty`, nicht als 0-USD-Budgetwahrheit dargestellt.
- Fehler/Timeout bei Usage wird als `unavailable`, nicht als leer behandelt.
- Usage-Auswertung liest höchstens 200 Zeilen aus 30 Tagen. Die UI behauptet deshalb keinen vollständigen Monatsabschluss; sie benennt nur gelesene gespeicherte Werte. Diese Begrenzung bleibt ein dokumentierter Scope-Limit, kein Slice-C-Blocker.
- keine CHF-Umrechnung, keine nachträgliche Preisannahme, kein Stripe/Bexio/Refund-Live.

### Shared Contracts / Cross-Domain

- `lib/provider-ops` und `lib/admin/system-health` werden gegenüber aktuellem `main` nicht fachlich verändert.
- Admin A+B, Account AP-1/AP-2 und Provider S1/S2 bleiben erhalten.
- keine Account-/Trip-/Traveller-/Route-/Readiness-/Safety-/Seasonal-Truth-Änderung.
- Multi-Citizenship ist für dieses read-only Operationsboard fachlich nicht relevant und wird nicht neu modelliert.

### DB / Kosten / Production

- keine Migration.
- keine RLS-/Capability-Änderung.
- keine Provideraktivierung.
- keine neuen laufenden Kosten oder kostenpflichtigen Calls.
- geerbter Billing-/Refund-P1 bleibt ausdrücklich außerhalb Slice C und Pflichtblock vor Finance-/Payment-Live.

## Nicht behauptete Evidence

- Keine eingeloggte manuelle Admin-Browser-Acceptance wird durch diesen Review behauptet; CI/UI-Audit/Preview-Evidence ersetzt keine authentifizierte Browser-Abnahme.
- Green CI/Vercel beweist nicht Provider-Health oder Produktkorrektheit außerhalb des geprüften Slice-C-Scopes.

## Restgrenzen / spätere Pflichtblöcke

- `model_usage` ist eine begrenzte read-only Sicht, kein vollständiger Monatsabschluss.
- persistenter/globaler Cost Guard gehört zu Provider Readiness S6.
- echte Provider-Health/Observability gehört zu späteren Provider-/Admin-Slices.
- Billing-/Refund-P1 bleibt vor Finance-/Payment-Live zwingend.

## Nächster Schritt

Slice C darf nach ausdrücklicher aktueller Product-Owner-Freigabe auf **Ready for Review** gesetzt werden. Ein Merge benötigt danach eine **separate** ausdrückliche Product-Owner-Freigabe.

Slice D–K startet erst nach erfolgreicher Integration von Slice C und neuem kontrollierten Auftrag.
