# Provider Readiness S6-A – Persistent Cost Guard Repository Foundation

Stand: 1. September 2026  
Status: **PRODUCT-OWNER APPROVED / SINGLE_AGENT / REPOSITORY FOUNDATION ONLY / NO PRODUCTION APPLY**

Parent issue: #375  
Baseline: `main@0b1a53bf39c9b418d8f65b9fce1f771232d8dbfd`  
Branch: `feat/provider-readiness-s6a-persistent-cost-guard-foundation-2026-09-01`

## Ziel

S6-A schafft den repository-seitigen Vertrag für einen global wirksamen persistenten Provider Cost Guard vor jedem späteren bezahlten/live Provider-Aufruf.

Der vorhandene `ProviderOpsCostGuard`-Port bleibt die gemeinsame Domain-Grenze. Der heutige In-Memory-Guard bleibt für Preview/Test ohne bezahlten Schlüssel zulässig, darf aber niemals als Production-globaler Schutz ausgegeben werden.

## Verbindliche Invarianten

- Atomare Reservierung über Kennungs-, Domain- und optional globale Buckets; Parallelität darf Limits nicht überschreiten.
- Fail closed bei fehlender Konfiguration, ungültiger Eingabe, geschlossenem Gate, unbekannter Domain, fehlender Policy, DB-/Port-Fehler oder unlesbarer Antwort.
- Repository-Default hard-off: Runtime-Gate `false`, keine aktivierten Policies, keine >0-Live-Budgets.
- Keine Reise-, Traveller-, Citizenship-, Pass-, Suchpayload- oder Provider-Response-Inhalte im Cost Store.
- Keine Client-Secrets und kein Direct-Write über `public`/Data API.
- Neue privilegierte Funktion nur in `jetnity_internal`, `SECURITY DEFINER`, `search_path=''`, explizit qualifizierte Relationen, EXECUTE nicht für `public`, `anon`, `authenticated` oder `service_role`.
- Kein `auth.role()` als neuer S6-A-Autorisierungsvertrag.
- Kein neuer `service_role`-/`sb_secret`-Runtime-Client in diesem Slice. Der TypeScript-Vertrag nutzt einen injizierten server-only Port; Production-Principal/Transport bleibt später gegatet.
- Kennungen werden vor Persistenz mit serverseitigem HMAC-SHA256 pseudonymisiert; S6-A erzeugt oder liest dafür kein Production-Secret.
- Kosten werden konservativ vor dem Call reserviert. S6-A reduziert Reservierungen nachträglich nicht still auf null/0.
- Persistente Zähler können über `leeren()` nicht prozesslokal zurückgesetzt werden.

## DB-Vertrag

Repository-only Migration:

`supabase/migrations/20260901020000_provider_cost_guard_s6a.sql`

Der Name wurde nach Live-Prüfung des Repository-Migrationsbestands gewählt; in dieser Ausführungsumgebung ist die Supabase CLI nicht installiert. Die Migration wird **nicht** auf Production angewendet.

Vorgesehen:

- internes Runtime-Gate mit `production_write_path_allocated=false`;
- interne Policy-Tabelle für `caller` / `domain` / optional `global` und `window` / `day`;
- interne konservative Reservation-Tabelle;
- atomare `jetnity_internal.provider_cost_guard_reservieren(jsonb)`-Funktion;
- NOLOGIN Capability-Role `jetnity_provider_cost_guard_writer`, aber **keine** Production-Login-/Runtime-Principal-Zuweisung;
- keine aktiven Policy-Zeilen.

## TypeScript-Vertrag

Neues server-only Modul `lib/provider-ops/persistent-cost-guard.ts`:

- injizierter `ProviderOpsPersistentCostGuardPort`;
- Domain + konservative Reservierung werden beim Guard-Bau festgelegt;
- Kennung → HMAC-SHA256 → nur Hash an den Port;
- DB-/Port-Uhr ist autoritativ; `uhr` des In-Memory-Testinterfaces wird nicht als persistente Wahrheit benutzt;
- malformed result / throw / invalid config → `{ ok:false, retryAfterSec:1 }`;
- `leeren()` ist absichtlich No-op.

## Tests

- Adapter: HMAC, kein Roh-Identifier, Fail-closed, malformed result, Port-Fehler, Retry-Parsing, DB-clock-Semantik, No-op reset.
- SQL-Contract: internes Schema, hard-off Gate, keine aktiven Policies, RLS defense-in-depth, atomarer Advisory Lock, Pflicht-Buckets, kein `auth.role()`, kein Service-Role-EXECUTE, EXECUTE nur Capability-Role, keine exposed-schema RPC.
- Vollständige CI/Hygiene/Build-Gates auf Exact Head.

## Hard Non-Scope

Kein Production-Apply. Keine Production-RLS/Grant/Role/Function-Mutation. Keine Runtime-Principal-Allokation. Kein Secret/API-Key. Kein >0-Live-Budget. Kein Providervertrag. Kein paid/live Call. Keine Factory-Aktivierung. Kein S7/S8. Kein TW-8/TW-9. Kein Auth/MFA/AAL-Redesign. Keine sensitive Dokument-/MRZ-/Scan-/Biometrie-/Health-Speicherung.

## Multi-Agent Suitability

**SINGLE_AGENT.** Ein gemeinsamer Schema-/Security-/Atomicity-Vertrag und ein gemeinsamer `ProviderOpsCostGuard`-Port. Mehrere Writer würden denselben Shared Contract verändern und erhöhen Race-/Security-/Merge-Risiko.

## Stop Rule

Nach repository-seitiger Integration und Post-Merge-Verifikation stoppen. Production-Apply/Principal/Secret/Budget/Provider-Aktivierung bleiben eigene Product-Owner-Gates.
