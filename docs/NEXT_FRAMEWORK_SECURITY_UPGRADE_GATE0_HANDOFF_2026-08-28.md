# Jetnity – Next.js Framework Security Upgrade Gate 0 Handoff

Stand: 28. August 2026  
Status: **DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW**  
Logical Cursor-Agent: **`Cursor-Agent: Jetnity framework security audit 1`**  
Draft-PR: https://github.com/Jetnity/jetnity/pull/148  
Branch: `audit/framework-security-upgrade-gate0-2026-08-28`

Dieser Handoff übergibt Gate 0. Er startet keinen Implementierungsslice. Agent-Self-Review ist kein PASS. Jeder neue Head invalidiert Prior-Gates.

---

## 1. Was dieser Agent getan hat

Read-only Audit gegen Task `docs/NEXT_FRAMEWORK_SECURITY_UPGRADE_GATE0_TASK_2026-08-28.md` auf Baseline `main @ 56aff7ff`.

1. Live-`origin/main`, PR #148, Branch Protection, PR-#147-Post-Merge-CI/Production und aktuelle Dependency-Pins rekonstruiert.
2. Offizielle Support Policy, August-2026-Security-Release und Upgrade-Guides 15/16 gelesen.
3. Jetnity-Call-Sites für `cookies()`, `params`, `searchParams`, middleware, lint, config, Actions, React-Hooks und Dritt-Peers inventarisiert.
4. `15.5.24` vs `16.3.3` gegen Jetnity-Architektur, EOL und Migrationskosten verglichen.
5. Empfehlung und gestufte Slices persistiert. Kein Runtime-Code, keine Dependency, keine Vercel-/Supabase-Mutation.

Kein Ready. Kein Merge.

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
| Prior Head | `8567dcdb` – nur Task |
| Exact / Review-Head | Stamp nach `8567dcdb`; live an PR #148 prüfen |
| Branch Protection | unverändert; letzte Evidence `protected=false` |
| Supabase | nicht live abgefragt, nicht mutiert |
| PR #147 | MERGED; Actions `33204438255` SUCCESS; Production deployment `6147375507` success auf `56aff7ff` |

Jeder neue Push invalidiert Prior-Gates.

---

## 4. Ist-Zustand in einem Satz

Production und `main` laufen auf **unsupported** `next@14.2.32` / React 18.2.0 / `next lint`, bei bereits erfülltem Node-22-Vertrag. Gate 0 empfiehlt **16.3.3 + React 19.2** als Ziel, führt das Upgrade nicht aus.

---

## 5. Empfehlung

- **Ziel:** `next@16.3.3` Active LTS + React 19.2.x.
- **Nicht als Production-Ziel:** `15.5.24` (Maintenance LTS, EOL 21 Oct 2026).
- **Nicht als Security-Ziel:** `14.2.35` (letzter 14.2-Patch, weiterhin unsupported, ohne August-2026-Fixes).
- **Stufe:** Slice 1 = async Request-API-Prep auf 14 ohne Dependency-Bump; Slice 2 = 16.3.3 + React 19.2 + ESLint 9 + `proxy` + Lint-CLI.
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

Unabhängiger Technical-Lead Exact-Head-Review von PR #148. Autor setzt kein Ready und merget nicht.

Nach einem späteren Merge: Gate 0 ist integrierte Evidence. Nächster Schritt = Product-Owner-Entscheidung. Kein automatischer Implementierungsslice. Keine erfundene Merge-SHA.
