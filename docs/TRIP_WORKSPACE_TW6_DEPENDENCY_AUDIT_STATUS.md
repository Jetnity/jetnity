# Jetnity – TW-6 Dependency / Guest-One-Trip Contract Audit – Status

Stand: 26. August 2026  
Agent: `Trip workspace audit architecture`  
Branch: `audit/tw6-guest-one-trip-dependency`  
Draft-PR: #75  
Audit-Baseline: `main @ ba86279e5ee2505bfd13801ae5e05ef50ba87c22`  
Letzter Audit-Sync: `main @ 8ab4e666d4963ac98b32de4b0371dfbd6eefc30f`  
Live-Main beim finalen Technical-Lead-Re-Review: `c73e87773dd6d234f1b76fc82206f03aac35fd2c`  
Status: **TECHNICAL-LEAD PASS FÜR AUDIT-/EVIDENCE-SCOPE / READY FÜR INTEGRATION. KEINE TW-6-RUNTIME IN DIESEM PR.**

Verbindlicher Auftrag: `docs/TRIP_WORKSPACE_TW6_DEPENDENCY_AUDIT_TASK.md`  
Decision Package: `docs/TRIP_WORKSPACE_TW6_DEPENDENCY_AUDIT.md`

`docs/ACTIVE_WORK_STATUS.md` wurde nicht geändert.

## 1. Finaler Technical-Lead-Stand

Bestätigt:

- Der Guest-One-Trip-Speichervertrag ist bereits implementiert; TW-6 braucht keinen neuen Gastspeicher.
- Guest→Account bleibt additiv/idempotent und löscht lokal erst nach Server-OK.
- `P1-TW6-01` war überklassifiziert und ist korrekt ein `TW6-START-GATE / PRODUCT-OWNER-DECISION`.
- `P1-TW6-02` war überklassifiziert und ist korrekt ein `TW6-CONTRACT-GATE / P2 UX-Truth-Risk`.
- Der Product Owner hat Option 1 ausdrücklich genehmigt.
- D0-2 ist inzwischen separat auf `main` integriert (PR #74, Merge `c73e87773dd6d234f1b76fc82206f03aac35fd2c`). Damit ist die frühere `/planen`-SEO-Kollision für den späteren TW-6-Runtime-Start auf Integrationsseite geschlossen.
- Dieser PR bleibt ausschließlich Audit-/Evidence-Dokumentation. Keine Runtime, DB, RLS, Auth, Traveller, Route, Provider oder Payment-Änderung.

## 2. Verbindlicher späterer TW-6-Scope

- minimaler, eindeutiger Create-Entry;
- Guest-One-Trip und Guest→Account unverändert;
- keine Citizenship-/Pass-Erhebung im Create;
- ehrliche Gast-CTA: bei bestehender Gastreise keinen zweiten Create suggerieren;
- Tempo-/Interessen-Chips dürfen vereinfacht/entfernt werden;
- SQL-/`reise_anlegen`-Default `balanced` bleibt in TW-6 unverändert und darf im UI nicht als ausdrückliche Nutzerwahl verkauft werden;
- progressive weitere Ziele nur über bestehende Trip-/Stage-Wahrheit;
- keine neue `/planen`-Metadata-/robots-/sitemap-/Origin-Arbeit;
- kein dritter Create-Pfad.

## 3. Restliche Findings

- P2: Gast-CTA-Doppelweg; möglicher Modellaufruf vor Guest-Slot-Reject; UI-Chips; zwei Create-UIs.
- P3: Reisende-Default 2; hartes CHF; ADR-0013-Statuszeile veraltet.

## 4. Integration

Der Audit-Inhalt ist fachlich PASS. Vor Merge ist nur noch der durch diese Reconciliation erzeugte neue Exact Head auf GitHub Actions/Vercel zu verifizieren. Danach darf der Technical Lead diesen normalen docs-only PR autonom integrieren.

Kein Folgeslice in diesem PR.