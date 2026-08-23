# Jetnity Account Platform – Workstream-Handoff

Stand: 23. August 2026  
Status: **Auditphase fertig – wartet auf Technical-Lead-Review; kein Mark Ready, kein Merge**

Ein neuer Agent muss hier weiterarbeiten können, ohne diese Cursor-Session.

---

## Pflichtfelder

| Feld | Wert |
| --- | --- |
| Exakter Cursor-Anzeigename | **Account plattform audit vorbereitung** |
| Agent-URL | https://cursor.com/agents/bc-01a030a0-d97f-782b-8bd0-acb906563518 |
| Workstream | Jetnity Account Platform – Benutzerkonto Audit & Vorbereitung |
| Branch | `audit/account-platform` |
| Basis | `origin/main` @ `cd220beb` plus Prep-Commits bis `e6b3e62c`, danach Audit-Doku-Commits |
| PR | Draft, siehe GitHub-PR dieses Branchs |
| Runtime-/Docs-Head | nach letztem Push dieses Workstreams; immer `git rev-parse HEAD` prüfen |
| Status | Audit fertig / Review |

## Scope

**Erlaubt und erledigt:** Code-/DB-/UX-Audit, Zielarchitektur, Evidence-Matrix, Implementierungsplan, Handoff.

**Gesperrt und nicht angefasst:** Auth-Kernverträge, RLS, Migrationen, Traveller-Truth, Guest→Account-Persistenz, Payment-Live, Production, Secrets, PR #38, Mark Ready, Merge.

## Zuerst lesen

1. `JETNITY_HANDOFF.md`
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/ACCOUNT_TRIP_WORKSPACE_PRODUCT_MODEL.md`
4. `docs/CURSOR_ACCOUNT_PLATFORM_AUDIT_TASK.md`
5. `docs/MULTI_AGENT_WORKSTREAMS.md`
6. `docs/ACCOUNT_PLATFORM_AUDIT.md`
7. `docs/ACCOUNT_PLATFORM_TARGET_ARCHITECTURE.md`
8. `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`
9. `docs/ACCOUNT_PLATFORM_EVIDENCE_MATRIX.md`
10. diesen Handoff

`docs/MULTI_AGENT_DEVELOPMENT_TEAM_POLICY.md` ist referenziert, im Repo **nicht vorhanden**.

## Geprüfte Bereiche

Account-Routen, Navbar/Footer, Auth-Lifecycle, MFA, Guest→Account, Traveller/Foundation E, RLS/Ownership-Doku, Privacy-Lücken, Subscription-Readiness, UX/a11y der Auth- und Reiseliste, Cross-Domain zu Workspace/Readiness/Route/Safety/Seasonal.

## Wichtigste Befunde

1. Es gibt keine Account Platform, sondern Auth + `/reisen` + Workspace + verwaiste MFA-Seite.
2. Kein Zwillings-Dashboard – das Risiko ist fehlendes Konto, nicht ein duplizierter Workspace.
3. Traveller sind trip-scoped (ADR-0102). Das neue Produktmodell will Account-Registry. Das ist ein Shared-Konflikt, kein stiller Umbau.
4. Guest→Account ist für den Graphen professionell; Party/Readiness-Teilerfolg und `party_schreiben`-Merge sind offene Truth-Lücken.
5. Privacy: Legal 404, Consent unpersistiert, kein Export/keine Löschung.
6. Security: TOTP-Technik da, Produkt nicht (unauffindbar, kein Step-up, keine Sessions).
7. Meine Reisen: keine Zeitgruppen; `archived` ohne Schreibweg; Gast-CTA widerspricht One-Trip-Regel.
8. Keine Citizenship-/Credential-Erfindung im geprüften Code – das muss so bleiben.

## Entscheidungen / Annahmen

- Cursor-Anzeigename ist der Run-Name aus Cursor Cloud `run-info`.
- Audit darf bestehende professionelle Trip-/Auth-Module weiterverwenden, nicht parallel neu bauen.
- Implementierung wartet auf PR-#38-Closure + Lead-Slicing.
- Account-Übersicht darf Workspace-Bereichskarten nicht kopieren.
- Zeitgruppen zuerst aus Daten ableiten; Archiv-Status später.

## Offene Risiken / Blocker

- Live-`auth:pruefen` / RLS nicht in dieser Session gelaufen
- Production-Redirect-URLs weiterhin Launch-Gate
- Fehlende Team-Policy-Datei
- `ACTIVE_WORK_STATUS` auf dem Prep-Branch war gegenüber PR #38 veraltet; dieser Handoff korrigiert das für den Account-Strang
- Admin-Audit-Agent war in den ersten Cloud-Agent-Treffern nicht gestartet
- Shared Traveller-Umbau ohne Lead erzeugt Parallelmodelle

## Abhängigkeiten

- PR #38 Seasonal – nicht anfassen
- Admin Platform Audit – `profiles`, Export/Löschung, Payments, Support
- ADR-0102 Nachfolger vor Reisenden-Registry
- Product-Owner-Texte für Legal/Abo

## Tests / Gates dieser Phase

- Lokal grün: `uebernahme.test.ts` 77, `oeffentliche-navigation.test.ts` 10, `auth-erwartung.test.ts` 33, `readiness/uebernahme.test.ts` 4
- Kein Production-Build, kein UI-Audit, kein `auth:pruefen` behauptet
- Kein Ready, kein Merge

## Exakter nächster Schritt

1. Technical Lead / ChatGPT prüft dieses Audit unabhängig nach `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md`.
2. Mit Admin-Audit-Ergebnissen gegen Shared Contracts legen.
3. Erst nach PR-#38-Closure und ausdrücklicher Implementierungsfreigabe AP-1/AP-2/AP-3 aus `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` schneiden.
4. Shared-Änderungen (Traveller, RLS, Delete, Status-Archiv, Consent-DB) serial, nicht in den ersten UI-PRs.

Kein Agent darf aus diesem Handoff eine Implementierungsfreigabe ableiten.
