# Jetnity – Next.js Framework Security Upgrade Gate 0 Handoff

Stand: 28. August 2026  
Status: **REVIEW-FIX FÜR 5457148091 / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD RE-REVIEW**  
Logical Cursor-Agent: **`Cursor-Agent: Jetnity framework security audit 1`**  
Draft-PR: https://github.com/Jetnity/jetnity/pull/148  
Branch: `audit/framework-security-upgrade-gate0-2026-08-28`

Dieser Handoff übergibt den Review-Fix gegen Technical-Lead-Kommentar `5457148091` auf Head `c4bfc2bb`. Er startet keinen Implementierungsslice. Agent-Self-Review ist kein PASS. Jeder neue Head invalidiert Prior-Gates.

---

## 1. Was dieser Agent getan hat

Docs-only Review-Fix gegen Technical-Lead-Kommentar `5457148091` auf reviewed Head `c4bfc2bb`:

1. Empfehlungs-Semantik: Ziel ist **16.x Active LTS live-resolved**; `16.3.3` ist auditiertes Minimum/August-2026-Referenz, kein Ewigkeits-Pin. React/ESLint/TypeScript ebenso live-resolved.
2. PR-#147 Production-Evidence: TL-verifiziertes Vercel `dpl_3UZX5HrgwUyyr887ZSKBXMzPKMKM` (READY, `aliasError=null`, Node 24.x→22.x cache skip) persistiert. GitHub `6147375507` nur als GitHub-Evidence. Dieser Agent holt die Vercel-ID nicht als eigene Live-Abfrage.
3. TypeScript: deklariert `^5.0.0`, Lockfile resolved `5.9.2`. Slice 2 muss die Deklaration auf >= 5.1.0 angleichen. Kein Dependency-Change in diesem PR.

Kein Runtime-Code, keine Dependency, keine Vercel-/Supabase-Mutation. Kein Ready. Kein Merge.

---

## 2. Naming

| Feld | Wert |
| --- | --- |
| Logischer Name | `Cursor-Agent: Jetnity framework security audit 1` |
| Preferred visible title | `Jetnity framework security audit 1` |
| Observed run title | `Jetnity framework security audit` |
| Evidence | https://cursor.com/agents/bc-1ec3726f-b33b-45d1-aad2-b1bce3c895b9 |
| Regel | PO-Supersession: sichtbarer Titel ist Best Effort, kein Blocker |
| Generation | 1. Keine Generation 2. |

UI wurde nicht umbenannt. Keine Rename-Fähigkeit vorhanden.

---

## 3. Git / Live-Evidence

| Fakt | Wert |
| --- | --- |
| Task-Baseline `origin/main` | `56aff7ff89f7113554c45891e024f9c06f6b0d15` |
| `origin/main` Re-Fetch vor Stamp | `56aff7ff89f7113554c45891e024f9c06f6b0d15` – **0 behind** |
| Branch | `audit/framework-security-upgrade-gate0-2026-08-28` |
| Draft-PR | #148 OPEN Draft |
| Merge-Base | `56aff7ff` |
| Reviewed Head (invalidiert) | `c4bfc2bb8f0f149bf18fd3dad1032953040dec9d` |
| Exact / Review-Head | Stamp nach `c4bfc2bb`; live an PR #148 prüfen |
| Branch Protection | unverändert; letzte Evidence `protected=false` |
| Supabase | nicht live abgefragt, nicht mutiert |
| PR #147 GitHub Actions | `33204438255` SUCCESS auf `56aff7ff` (dieser Run) |
| PR #147 GitHub Production deployment | `6147375507` success – **nur GitHub-Evidence** |
| PR #147 Vercel Production | `dpl_3UZX5HrgwUyyr887ZSKBXMzPKMKM` READY / `production` / `aliasError=null` / exact `56aff7ff` – **TL-verifiziert in `5457148091`, nicht von diesem Agent geholt** |

Jeder neue Push invalidiert Prior-Gates.

---

## 4. Ist-Zustand in einem Satz

Production und `main` laufen auf **unsupported** `next@14.2.32` / React 18.2.0 / `next lint`, bei bereits erfülltem Node-22-Vertrag. Gate 0 empfiehlt **16.x Active LTS live-resolved** (Minimum `16.3.3`), führt das Upgrade nicht aus.

---

## 5. Empfehlung

- **Ziel:** Next 16.x Active LTS, zum Implementierungszeitpunkt live-resolved und security-gepatcht; `16.3.3` = auditiertes Minimum/Referenz; nie darunter.
- **Begleitlinie:** React 19.2.x, ESLint 9, passendes `eslint-config-next`, TypeScript-Deklaration >= 5.1.0 – ebenfalls live-resolved.
- **Nicht als Production-Ziel:** `15.5.24` (Maintenance LTS, EOL 21 Oct 2026).
- **Nicht als Security-Ziel:** `14.2.35` (letzter 14.2-Patch, weiterhin unsupported, ohne August-2026-Fixes).
- **Stufe:** Slice 1 = async Request-API-Prep auf 14 ohne Dependency-Bump; Slice 2 = live-resolved 16.x (>= `16.3.3`) + Lint-CLI + `proxy` + TS-Deklarationsangleichung.
- Optional 15.5.24 nur als kurzlebige Preview-Isolation.

Details: `docs/NEXT_FRAMEWORK_SECURITY_UPGRADE_GATE0_STATUS_2026-08-28.md`, ADR-0189.

---

## 6. Höchste Jetnity-Risiken für eine spätere Implementation

1. Sync-`cookies()` in `lib/supabase/server.ts` und `lib/modell/kontingent.ts` – Signaturänderung, Auth/Session.
2. `middleware.ts` → `proxy.ts` bei Supabase `setAll` / fail-closed Auth-Rand.
3. `/planen` `generateMetadata(searchParams)` = D0-Indexgrenze.
4. Sync-`unauthorized`-Page und Login/Register `searchParams.next`.
5. CI: `next lint` + eslint 8 → ESLint CLI + eslint 9.

---

## 7. Was ausdrücklich nicht passiert ist

Keine Änderung an `package.json` Runtime-Dependencies, Application-Code, Middleware, Vercel, Supabase, Auth, RLS, Schema, Secrets, Branch Protection. Kein mutierender Codemod. Kein AP-7-S2. Kein Provider-/TW-Runtime. Kein Ready. Kein Merge.

---

## 8. Offene Freigabe

Product Owner muss vor jedem tatsächlichen Framework-Bump eine der Optionen in Status Abschnitt 12 wählen. Technical-Lead-Review dieses Gate 0 ist nicht die Upgrade-Freigabe.

---

## 9. Exakter nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Re-Review von PR #148 nach `5457148091`. Autor setzt kein Ready und merget nicht.

Nach einem späteren Merge: Gate 0 ist integrierte Evidence. Nächster Schritt = Product-Owner-Entscheidung. Kein automatischer Implementierungsslice. Keine erfundene Merge-SHA.
