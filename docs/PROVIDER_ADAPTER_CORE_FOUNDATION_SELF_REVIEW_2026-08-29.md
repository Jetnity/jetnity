# Provider Adapter Core Foundation — Cursor Self-Review

Stand: 29. August 2026  
Status: **SELF-REVIEW ONLY / KEINE FREIGABE / KEIN PASS**  
Cursor-Agent: `Jetnity provider adapter core 1`  
PR: https://github.com/Jetnity/jetnity/pull/187  
Branch: `feat/provider-adapter-core-foundation-2026-08-29`  
Baseline `origin/main`: `69ef27b169780e41ba506a69acb15caafa645517`  
Reviewed Head (CHANGES REQUIRED): `98edd7b81a92d1eea6289cfc75048f09398cdff0`  
Review: `5058500841`  
Review-Fix implementation Head: `ab2ea861c2af6ac4d5842b7d5cbe7d8b0c82c5e2`

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
| Harte Body-Grenze während des Stream-Reads, nicht erst nach `text()` | ja |
| Secrets nicht in Errors/Events/Metadaten/Snapshots | ja |
| Observer injiziert, allowlisted, keine Bodies; Throws isoliert | ja |
| Preflight Throw/invalid Outcome fail-closed, normalisiert | ja |
| `retry_exhausted` nur nach wirklich benutztem Retry | ja |
| Server-only Produktions-Entry (`import 'server-only'`) | ja |
| Deterministische Offline-Tests für alle geforderten Fälle | ja |
| Skyscanner Create/Poll nur als Neutralitätsbeweis, nicht generalisiert | ja |
| Bestehende Fixture-Foundation unverändert | ja |

## 2. Scope / Non-Scope

| Grenze | Gehalten? |
| --- | --- |
| Nur Review-Fixes aus `5058500841` | ja |
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

- Trust ist eine Modulgrenze plus `import 'server-only'` auf der Produktions-Entry. Runtime-Objekte tragen keine `trusted`/`live`/`sourceKind`-Felder.
- HTTPS-only; Userinfo in URLs wird abgelehnt; Query/Fragment erscheinen nicht in Metadaten.
- `credentials: 'omit'`, `redirect: 'manual'`, `cache: 'no-store'` im Fetch-Wrapper.
- Observer-Events sind allowlisted; kein Spread von Caller-Input.
- Observer- und Preflight-Exceptions verlassen die Grenze nicht als Raw-Throw und tragen keinen Exception-Text.
- Kein Traveller-Context in diesem Slice; keine Dokument-/Citizenship-Daten.

## 4. Secret / Redaction

- Default-sensitive Namen inkl. `authorization`, `x-api-key`, Cookies.
- Adapter können weitere Namen registrieren.
- Tests beweisen, dass der Secret-Wert und Query-Strings nicht in Result/Error/Events serialisiert werden.
- Preflight-Throw mit `secret=sk-live-xyz` erscheint nicht in Error/Events.

## 5. Retry / Timeout / Rate-Limit / Body

- Timeout bricht den in-flight Request ab.
- Externes Abort stoppt den Loop und verhindert Sleep.
- Retry-After nur als Delta-Sekunden oder IMF-fixdate; Clamp auf Bound.
- Ungültige Policy wird als `invalid_configuration` abgelehnt.
- 5xx/Netz/429 retrybar nach Policy; Auth/Invalid/Malformed/Timeout nicht.
- HTTP-429 und Preflight-429: `maxAttempts=1` oder `retryOn429=false` → `rate_limited`; erst nach wirklich benutztem Retry → `retry_exhausted`.
- Body: Stream-Read; fehlendes/gelogenes `Content-Length` wird nicht als Länge vertraut; Overflow cancelt den Reader.

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
- `lib/server/providers/core/exports.ts`
- `lib/server/providers/core/headers.ts`
- `lib/server/providers/core/headers.test.ts`
- `lib/server/providers/core/http.ts`
- `lib/server/providers/core/index.ts`
- `lib/server/providers/core/observability.ts`
- `lib/server/providers/core/observability.test.ts`
- `lib/server/providers/core/parse.ts`
- `lib/server/providers/core/parse.test.ts`
- `lib/server/providers/core/retry.ts`
- `lib/server/providers/core/retry.test.ts`
- `lib/server/providers/core/trust-boundary.test.ts`
- `lib/server/providers/core/url.ts`
- `scripts/erreichbarkeit.mjs`

Unverändert: `lib/providers/**`, `lib/commercial-provenance/**`, `lib/provider-ops/**`, keine Migrationen.

## 7. Tests / Gates auf diesem Arbeitsstand

Lokal ausgeführt auf `ab2ea861c2af6ac4d5842b7d5cbe7d8b0c82c5e2`. Dieser Stamp ändert nur Docs.

Gezielte Regressionen: `lib/server/providers/core/*.test.ts` — **43** PASS, inkl. fehlendes/gelogenes `Content-Length`, Chunk-Overflow, Reader-Cancel, `maxAttempts=1`, `retryOn429=false`, exhausted-after-real-retries, Observer-Throw, Preflight-Throw/invalid Outcome, `import 'server-only'`.

| Gate | Ergebnis |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS, 0 errors / 135 warnings (bestehende Repo-Warnings) |
| `npm test` | PASS, **2654** tests, 0 fail |
| `npm run check:dead` | PASS (2 begründete Orphans: CookieConsent, server-only `index.ts`) |
| `npm run check:exports` | PASS, 0 unbegründete Exporte |
| `npm run check:deps` | PASS |
| `npm run check:api-schutz` | PASS, 12 Admin-Routen |
| `npm run check:schema-bezug` | PASS |
| `npm run build` | PASS, Next.js 16.3.3 Turbopack Production |

Keine echten Netz-Calls in den neuen Tests. Exact-Head GitHub Actions / Vercel sind nach diesem Push neu zu lesen. Prior-Gates und CI/Vercel auf `98edd7b8` gelten nicht für den neuen Head.

## 8. origin/main Drift

Zum Zeitpunkt der lokalen Gates:

- `origin/main` = `69ef27b169780e41ba506a69acb15caafa645517`
- merge-base exakt diese Baseline
- `behind_by=0`
- `ahead` = Task-Docs + Implementierung + Review-Fix + dieser Stamp; live am PR zählen

## 9. Residual Risks / Debt

- Duffel nutzt den Kern noch nicht. Eine Migration ist ein späterer, extra gegateter Slice.
- Create/Poll-Lifecycle, Provider-Keys und Live-Transport bleiben bewusst ungebaut.
- `AbortSignal.any` setzt Node 22 voraus; das entspricht dem bestehenden Runtime-Vertrag.
- `exports.ts` ist test-/hygiene-ladbar, weil `node:test` `import 'server-only'` nicht laden kann. Produktionsadapter müssen `index.ts` importieren. Client-/Component-Importe sind per Test gesperrt.
- Agent-Self-Review ist kein PASS. `main` Branch Protection bleibt `protected=false` (unverändert, nicht dieser Slice).

## 10. Explizite Bestätigung

Keine echte Provider-Call-Site, kein Credential, keine Supabase-Mutation, keine Runtime-Aktivierung und kein Commercial-Provenance-Mint wurden eingeführt.

## STOPP

Draft-PR #187 bleibt Draft. **Do not mark Ready. Do not merge. Do not start a follow-up slice.**

Nächster Schritt: unabhängiger ChatGPT Technical-Lead Exact-Head-Re-Review.
