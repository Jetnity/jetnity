# Jetnity – QS-2 Independent Quality / Security / Resilience Audit – Task

Stand: 26. August 2026  
Agent: **`Jetnity quality security audit`**  
Branch: `audit/qs2-quality-security-resilience`  
Baseline: `main @ ba86279e5ee2505bfd13801ae5e05ef50ba87c22`  
Typ: **UNABHÄNGIGER AUDIT ONLY**

## 1. Rolle

Du bist für diesen Slice unabhängige QA-/Security-/Resilience-Prüfinstanz, **kein Feature-Entwickler**. Prüfe den integrierten `main` adversarial nach TW-5, D0-1 und der aktuellen Governance-/Parallelitätsöffnung.

Ziel ist nicht, möglichst viele kosmetische Findings zu erzeugen, sondern echte Produkt-, Security-, Privacy-, Logic-, Resilience-, Accessibility-, Performance- und Test-Qualitätsrisiken mit belastbarer Evidence zu finden.

## 2. Pflichtlektüre / Live-Rekonstruktion

Lies zuerst vollständig mindestens:

- `JETNITY_START_HERE.md`
- `docs/TECHNICAL_LEAD_MERGE_AUTONOMY_SUPERSESSION_2026-08-26.md`
- `docs/JETNITY_ENGINEERING_EXCELLENCE_STANDARD.md`
- `docs/JETNITY_PRODUCT_POSITIONING_STANDARD.md`
- `docs/JETNITY_AGENT_WORKSTREAM_GOVERNANCE.md`
- `docs/JETNITY_BINDING_BUILD_ORDER.md`
- `JETNITY_HANDOFF.md`
- `docs/ACTIVE_WORK_STATUS.md`
- QS-1 Audit/Status/Follow-ups;
- TW-1 bis TW-5 relevante Status/ADRs/Tests;
- D0/G0 Audit und D0-1 Status/Tests;
- Account AP-1–AP-3, Provider S1–S3 und Admin A–C relevante Handoffs soweit für systemische Grenzen nötig.

Danach live verifizieren:

- `main` muss exakt gegen die Baseline geprüft werden; wenn er inzwischen weitergezogen ist, dokumentiere das und bleibe für diesen Audit auf der vereinbarten QS-2-Baseline, solange der TL nichts anderes anweist;
- Branch/Draft-PR/Ahead-Behind/Merge-Base;
- offene parallele PRs und deren Scope nur zur Kollisionsanalyse;
- GitHub Actions/Vercel;
- Supabase Production/Migrations lesend, wenn Findings DB/RLS/Ownership betreffen;
- Review-Threads.

**Nicht `docs/ACTIVE_WORK_STATUS.md` ändern.**

## 3. Audit-Schwerpunkte

### A. Product Truth / Logic

- `unknown`, `stale`, `error`, `unavailable`, `insufficient_context`, `empty` korrekt getrennt?
- irgendwo Fake-/Fallback-Truth als echte Preis-/Verfügbarkeits-/Provider-/Visa-/Safety-/Route-Truth sichtbar?
- doppelte oder widersprüchliche Reise-/Coverage-/Attention-/Timeline-Truth?
- regressierte P1-QS1-01 oder ähnliche Doppelkomposition?
- mobile/desktop gleiche fachliche Wahrheit?

### B. Auth / Ownership / RLS / Guest→Account

- fail-closed Grenzen;
- IDOR/BOLA-Risiken;
- Account/Guest Cross-Contamination;
- Session/AAL/MFA-Inkonsistenzen;
- serverseitige vs clientseitige Autorisierung;
- fremde Trip-UUIDs / Enumeration / Error-Semantik;
- keine Annahme, dass UI-Hiding Sicherheit ersetzt.

Keine Shared-Contract-Änderung vornehmen.

### C. Traveller / sensitive data

- Single-Citizenship-/Default-Pass-Annahmen;
- Issuer ≠ Citizenship;
- sensible Daten unnötig im Client/URL/Logs/Telemetry?
- Multi-Document-Context korrekt oder `insufficient_context`?

### D. D0-1 / Privacy / Indexing

Prüfe integriert auf `main`:

- `/reisen`, `/reisen/[tripId]` noindex;
- parametrisierte `/planen`-Varianten noindex nach Key-Präsenz;
- Sitemap ohne `/reisen`;
- Admin/Auth/Unauthorized Indexgrenzen;
- Tests dürfen nicht die falsche Semantik festschreiben.

D0-2 läuft parallel auf **anderem Branch** und ist nicht Teil dieser Baseline. Keine D0-2-Änderung hier.

### E. Security / Abuse / Resilience

- Request validation / injection / XSS / unsafe HTML;
- CSRF/redirect/open-redirect soweit relevant;
- rate-limit/bot/abuse assumptions;
- secret leakage / logs;
- retry/idempotency/race/revision conflicts;
- network/provider failure semantics;
- localStorage/sessionStorage trust boundaries;
- graceful failure ohne Fake-Success.

### F. Test Quality

Nicht nur grün/rot prüfen. Suche nach:

- Tests, die falsche Produktannahmen als korrekt festschreiben;
- fehlenden negativen/adversarial cases;
- brittle snapshots ohne Semantik;
- ungetesteten Security-/Ownership-/Truth-Grenzen;
- unpassenden Mocks, die echte Failure States verschleiern.

### G. Accessibility / UX / Performance

- Focus/hidden/inert;
- Keyboard/semantics;
- mobile overflow / duplicated controls;
- unnötige eager mounts / network work;
- SSR/CSR hydration risks;
- Performance-Hotspots, wenn sie fachlich relevant sind.

### H. Continuity / Governance Drift

- stale kanonische Aussagen, die zu falscher Agentenarbeit führen würden;
- widersprüchliche Merge-/Build-Order-/Shared-Contract-Aussagen;
- historische PRs dürfen nicht als aktuelle Wahrheit gelten.

## 4. Severity

Klassifiziere strikt:

- **P0**: akute kritische Security/Data-Loss/Production-Truth-Katastrophe;
- **P1**: Merge-/Release-blockierender erheblicher Security/Privacy/Product-Truth/Logic-Defekt;
- **P2**: wichtiger Defekt/Risiko, nicht akut P1;
- **P3**: Verbesserung/Hygiene mit realem Nutzen.

Nicht Severity aufblasen. Evidence vor Meinung.

## 5. Deliverables

Aktualisiere `docs/QS2_QUALITY_SECURITY_RESILIENCE_AUDIT_STATUS.md` und optional ein separates QS-2-Audit-Dokument.

Für jedes Finding:

- ID / Severity;
- betroffene Dateien/Routes/Contracts;
- reproduzierbare Evidence;
- tatsächlicher Impact;
- warum bestehende Tests es nicht verhindern;
- minimaler Closure-Scope;
- ob Shared Contract / Product Owner Gate betroffen wäre.

Zusätzlich:

- explizite Liste geprüfter Bereiche ohne Finding;
- aktuelle Test-/CI-/Vercel-/Supabase-Evidence;
- Regression-Check der früheren P1s;
- priorisierte Closure-Reihenfolge.

## 6. Harte Non-Scope-Grenzen

Keine Feature-Runtime. Keine stillen Fixes an:

- Auth/RLS/Ownership/Guest→Account;
- Traveller/Route;
- Provider/Payment;
- D0-2;
- DB/Migrationen;
- Admin/Growth;
- Produktionskonfiguration.

Wenn du einen akuten P0/P1 findest: Evidence sichern, im Audit dokumentieren und **STOPP**. Nicht eigenmächtig einen breiten Fix bauen.

## 7. Abschluss

Adversarial Self-Review des eigenen Audits: False Positives entfernen, Severity prüfen, jede Behauptung belegen.

Dann Status aktualisieren und **STOPP**. Kein Ready/Merge, keine Feature-Korrektur, kein Folgeslice. ChatGPT / Technical Lead führt den unabhängigen Closure-Review durch und entscheidet Fix-Owner/Reihenfolge.
