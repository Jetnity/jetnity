# Provider Adapter Core Foundation — Cursor Self-Review

Stand: 29. August 2026  
Status: **SELF-REVIEW ONLY / KEINE FREIGABE / KEIN PASS**  
Cursor-Agent: `Jetnity provider adapter core 1`  
PR: https://github.com/Jetnity/jetnity/pull/187  
Branch: `feat/provider-adapter-core-foundation-2026-08-29`  
Slice baseline `main`: `69ef27b169780e41ba506a69acb15caafa645517`  
Live `origin/main`: `f80a7f0b9e517e60c893ed80ff80b3c1b4cd9eb3` (`behind_by=4`, docs-only checkpoint, nicht rebased)  
Reviewed Head (CHANGES REQUIRED): `80129085b23f7fda4ede3e9347b98975fab3002d`  
Review: `5463627429`  
Review-Fix implementation Heads: `6f9a8b76a5cd5fec30bde07bd2d25f38e2924327`, stub lint-fix `f82fe28ec04aad2bc3c98da3534fc8cbd23f311f`

Ein Agenten-Self-Review ersetzt keinen unabhängigen Technical-Lead Exact-Head-Review.  
Exact Head ist der Commit dieses Stamps; live am PR prüfen.

---

## 1. Acceptance-Criteria Review

| Kriterium | Gehalten? |
| --- | --- |
| `retry_exhausted` nur bei aktuellem retrybaren Fehler nach benutztem Retry | ja |
| `500→401` bleibt `authentication` | ja |
| `500→429` mit `retryOn429=false` bleibt `rate_limited` | ja |
| Späteres disabled Preflight bleibt `rate_limited` | ja |
| Wiederholte retrybare 429/5xx/Netz-Erschöpfung bleibt `retry_exhausted` | ja |
| Jedes Runtime-Modul trägt `import 'server-only'` | ja |
| Alternativimport ohne Test-Stub scheitert mechanisch | ja |
| node:test bleibt ladbar über lokalen Stub, kein neues npm-Paket | ja |
| Harte Body-Grenze / Observer-Isolation aus dem vorherigen Head bleiben | ja |
| Kein Commercial-Provenance-Mint, keine forgebaren Trust-Flags | ja |
| Fixture-Foundation unverändert | ja |

## 2. Scope / Non-Scope

| Grenze | Gehalten? |
| --- | --- |
| Nur die zwei P1-Findings aus `5463627429` | ja |
| Kein echter Provider-Call / keine Secrets / keine Production-Mutation | ja |
| Kein Ready / kein Merge / kein Folgeslice | ja |
| Task-Datei unangetastet | ja |

## 3. Truth / Security / Privacy

- Trust ist `import 'server-only'` auf jedem Runtime-Modul, nicht nur `index.ts`.
- Der Test-Stub existiert nur unter `scripts/server-only-*` und wird ausschliesslich von `npm test` geladen.
- Kein Traveller-Context in diesem Slice.

## 4. Retry-Klassifikation

`terminalAfterRetryStop()` verlangt `usedRetry && currentRetryable`. Ein früheres `lastFailure` allein macht einen späteren nicht-retrybaren Fehler nicht zu `retry_exhausted`.

## 5. Changed Files (gegen Slice-Baseline `69ef27b1`; live `origin/main` ist 4 Docs-Commits weiter)

Zusätzlich zu den bereits auf dem Branch liegenden Core-Dateien:

- `lib/server/providers/core/executor.ts`
- `lib/server/providers/core/executor.test.ts`
- `lib/server/providers/core/{domain,exports,headers,http,index,observability,parse,retry,url}.ts`
- `lib/server/providers/core/*.test.ts`
- `package.json` (`npm test` lädt den Stub)
- `scripts/server-only-test-register.mjs`
- `scripts/server-only-test-loader.mjs`
- `scripts/server-only-empty.mjs`
- `scripts/server-only-empty.js`
- `scripts/erreichbarkeit.mjs` (index-Orphan-Ausnahme entfernt)
- `docs/ADR_0199_PROVIDER_ADAPTER_CORE_FOUNDATION.md`
- `DECISIONS.md`
- `ARCHITECTURE.md`
- Status / Handoff / Self-Review / `docs/ACTIVE_WORK_STATUS.md`

Unverändert: `lib/providers/**`, `lib/commercial-provenance/**`, `lib/provider-ops/**`, keine Migrationen.

## 6. Tests / Gates

Lokal auf `f82fe28e`:

Gezielte Regressionen: `lib/server/providers/core/*.test.ts` — **46** PASS, inkl. `500→401`, `500→429` disabled, disabled Preflight nach Retry, exhausted-after-real-retries, jedes Runtime-Modul `server-only`, Alternativimport ohne Stub fail.

| Gate | Ergebnis |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS, 0 errors / 135 warnings |
| `npm test` | PASS, **2657** tests, 0 fail |
| `npm run check:dead` | PASS (1 begründetes Orphan: CookieConsent) |
| `npm run check:exports` | PASS |
| `npm run check:deps` | PASS |
| `npm run check:api-schutz` | PASS, 12 Admin-Routen |
| `npm run check:schema-bezug` | PASS |
| `npm run build` | PASS, Next.js 16.3.3 |

Keine echten Netz-Calls. Exact-Head CI/Vercel nach diesem Push neu lesen. Evidence auf `80129085` gilt nicht.

## 7. origin/main Drift

- Slice-merge-base bleibt `69ef27b169780e41ba506a69acb15caafa645517`
- Live `origin/main` = `f80a7f0b9e517e60c893ed80ff80b3c1b4cd9eb3`
- `behind_by=4` (authoritative current-state checkpoint Docs). Nicht rebased.
- `ahead` = Slice + Review-Fixes + dieser Stamp; live am PR zählen

## 8. Residual Risks / Debt

- Duffel nutzt den Kern noch nicht.
- Create/Poll, Provider-Keys und Live-Transport bleiben ungebaut.
- Der Test-Stub patcht `Module._resolveFilename` nur im Testprozess. Production/Next-Client bleibt die Compile-Time-Grenze.
- Agent-Self-Review ist kein PASS.

## 9. Explizite Bestätigung

Keine echte Provider-Call-Site, kein Credential, keine Supabase-Mutation, keine Runtime-Aktivierung und kein Commercial-Provenance-Mint wurden eingeführt.

## STOPP

Draft-PR #187 bleibt Draft. **Do not mark Ready. Do not merge. Do not start a follow-up slice.**

Nächster Schritt: unabhängiger ChatGPT Technical-Lead Exact-Head-Re-Review.
