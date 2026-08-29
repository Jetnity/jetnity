# Provider Adapter Core Foundation — Cursor Self-Review

Stand: 29. August 2026  
Status: **SELF-REVIEW ONLY / KEINE FREIGABE / KEIN PASS**  
Cursor-Agent: `Jetnity provider adapter core 1`  
PR: https://github.com/Jetnity/jetnity/pull/187  
Branch: `feat/provider-adapter-core-foundation-2026-08-29`  
Baseline `origin/main`: `69ef27b169780e41ba506a69acb15caafa645517`  
Prior implementation Head: `70cd41ba2e3d30afa78a5236202905014bb66596`

Ein Agenten-Self-Review ersetzt keinen unabhängigen Technical-Lead Exact-Head-Review.  
Exact Head ist der Commit dieses Stamps; live am PR prüfen.

---

## 1. Acceptance-Criteria Review

| Kriterium | Gehalten? |
| --- | --- |
| Provider-neutraler Server-Transport unter `lib/server/providers/core/` | ja |
| Starke Typen für IDs, URL ohne Credentials, Policies, Taxonomie, Events | ja |
| Injizierter HTTP-Client; Production kann später `fetch` wrappen | ja |
| Explizites Timeout mit AbortSignal, kein Ignorieren später Antworten | ja |
| Begrenzte Retries, keine Endlosschleife | ja (`maxAttempts` 1–8) |
| 429 explizit; 401/403/400 nie retried | ja |
| Sicheres Body-Parsing + `malformed_response` bei ungültigem JSON | ja |
| Secrets nicht in Errors/Events/Metadaten/Snapshots | ja |
| Observer injiziert, allowlisted, keine Bodies | ja |
| Deterministische Offline-Tests für alle geforderten Fälle | ja |
| Skyscanner Create/Poll nur als Neutralitätsbeweis, nicht generalisiert | ja |
| Bestehende Fixture-Foundation unverändert | ja |

## 2. Scope / Non-Scope

| Grenze | Gehalten? |
| --- | --- |
| Kein echter Skyscanner Create/Poll | ja |
| Kein echter Provider-Call | ja |
| Keine API-Keys/Secrets im Repo oder in ENV-Reads | ja |
| Keine Vercel-/Supabase-/Production-Mutation | ja |
| Kein Commercial-Provenance-Mint | ja |
| Kein `live_api` / `persisted_snapshot` | ja |
| Kein TW-8/TW-9 | ja |
| Keine UI | ja |
| Keine Provideraktivierung / paid calls | ja |
| Task-Datei unangetastet | ja |
| Kein Ready / kein Merge / kein Folgeslice | ja |

## 3. Truth / Security / Privacy

- Trust ist eine Modulgrenze. Runtime-Objekte tragen keine `trusted`/`live`/`sourceKind`-Felder.
- HTTPS-only; Userinfo in URLs wird abgelehnt; Query/Fragment erscheinen nicht in Metadaten.
- `credentials: 'omit'`, `redirect: 'manual'`, `cache: 'no-store'` im Fetch-Wrapper.
- Observer-Events sind allowlisted; kein Spread von Caller-Input.
- Kein Traveller-Context in diesem Slice; keine Dokument-/Citizenship-Daten.

## 4. Secret / Redaction

- Default-sensitive Namen inkl. `authorization`, `x-api-key`, Cookies.
- Adapter können weitere Namen registrieren.
- Tests beweisen, dass der Secret-Wert und Query-Strings nicht in Result/Error/Events serialisiert werden.

## 5. Retry / Timeout / Rate-Limit

- Timeout bricht den in-flight Request ab.
- Externes Abort stoppt den Loop und verhindert Sleep.
- Retry-After nur als Delta-Sekunden oder IMF-fixdate; Clamp auf Bound.
- Ungültige Policy wird als `invalid_configuration` abgelehnt.
- 5xx/Netz/429 retrybar nach Policy; Auth/Invalid/Malformed/Timeout nicht.

## 6. Changed Files (gegen `origin/main`)

- `ARCHITECTURE.md`
- `DECISIONS.md`
- `JETNITY_HANDOFF.md`
- `JETNITY_START_HERE.md`
- `ROADMAP.md`
- `docs/ACTIVE_WORK_STATUS.md`
- `docs/ADR_0199_PROVIDER_ADAPTER_CORE_FOUNDATION.md`
- `docs/CONTINUITY_STANDARD.md`
- `docs/PROVIDER_ADAPTER_CORE_FOUNDATION_AGENT_PROMPT_2026-08-29.md`
- `docs/PROVIDER_ADAPTER_CORE_FOUNDATION_HANDOFF_2026-08-29.md`
- `docs/PROVIDER_ADAPTER_CORE_FOUNDATION_SELF_REVIEW_2026-08-29.md`
- `docs/PROVIDER_ADAPTER_CORE_FOUNDATION_STATUS_2026-08-29.md`
- `docs/PROVIDER_ADAPTER_CORE_FOUNDATION_TASK_2026-08-29.md`
- `lib/server/providers/core/domain.ts`
- `lib/server/providers/core/executor.ts`
- `lib/server/providers/core/executor.test.ts`
- `lib/server/providers/core/headers.ts`
- `lib/server/providers/core/headers.test.ts`
- `lib/server/providers/core/http.ts`
- `lib/server/providers/core/index.ts`
- `lib/server/providers/core/observability.ts`
- `lib/server/providers/core/observability.test.ts`
- `lib/server/providers/core/parse.ts`
- `lib/server/providers/core/retry.ts`
- `lib/server/providers/core/retry.test.ts`
- `lib/server/providers/core/trust-boundary.test.ts`
- `lib/server/providers/core/url.ts`

Unverändert: `lib/providers/**`, `lib/commercial-provenance/**`, `lib/provider-ops/**`, keine Migrationen.

## 7. Tests / Gates auf diesem Arbeitsstand

Ausgeführt lokal auf `70cd41ba` plus dem Typecheck-Fix in `executor.test.ts`:

| Gate | Ergebnis |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS, 0 errors / 135 warnings (bestehende Repo-Warnings) |
| `npm test` | PASS, **2640** tests, 0 fail |
| `npm run check:dead` | PASS (1 begründeter Orphan: CookieConsent) |
| `npm run check:exports` | PASS, 0 unbegründete Exporte |
| `npm run check:deps` | PASS |
| `npm run check:api-schutz` | PASS, 12 Admin-Routen |
| `npm run check:schema-bezug` | PASS |
| `npm run build` | PASS, Next.js 16.3.3 Turbopack Production |

Keine echten Netz-Calls in den neuen Tests. Exact-Head GitHub Actions / Vercel sind nach diesem Push neu zu lesen; Prior-Gates gelten nicht für den neuen Head.

## 8. origin/main Drift

Zum Zeitpunkt der lokalen Gates:

- `origin/main` = `69ef27b169780e41ba506a69acb15caafa645517`
- merge-base exakt diese Baseline
- `behind_by=0`
- `ahead` = Task-Docs + Implementierung + dieser Stamp; live am PR zählen

## 9. Residual Risks / Debt

- Duffel nutzt den Kern noch nicht. Eine Migration ist ein späterer, extra gegateter Slice.
- Create/Poll-Lifecycle, Provider-Keys und Live-Transport bleiben bewusst ungebaut.
- `AbortSignal.any` setzt Node 22 voraus; das entspricht dem bestehenden Runtime-Vertrag.
- Agent-Self-Review ist kein PASS. `main` Branch Protection bleibt `protected=false` (unverändert, nicht dieser Slice).

## 10. Explizite Bestätigung

Keine echte Provider-Call-Site, kein Credential, keine Supabase-Mutation, keine Runtime-Aktivierung und kein Commercial-Provenance-Mint wurden eingeführt.

## STOPP

Draft-PR #187 bleibt Draft. **Do not mark Ready. Do not merge. Do not start a follow-up slice.**

Nächster Schritt: unabhängiger ChatGPT Technical-Lead Exact-Head-Review.
