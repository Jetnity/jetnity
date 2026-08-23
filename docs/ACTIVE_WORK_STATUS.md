# Jetnity – Active Work Status

Stand: 23. August 2026
Arbeitsstand: **Multi-Agent – Seasonal-PR #38 läuft parallel; Account-Platform-Audit auf diesem Branch fertig; keine Account-Kernimplementierung**

Diese Datei ist der Live-Handoff **dieses Branchs** `audit/account-platform`. Sie ersetzt nicht den Seasonal-Handoff auf `feat/travel-timing-seasonal-intelligence`.

---

## 1. Arbeitsblock / Ziel

**Jetnity Account Platform – Benutzerkonto Audit & Vorbereitung**

Cursor-Anzeigename: **Account plattform audit vorbereitung**  
Agent: https://cursor.com/agents/bc-01a030a0-d97f-782b-8bd0-acb906563518

Produktregel: Benutzerkonto = dauerhaftes Zuhause; Trip Workspace = eine Reise. Keine zwei Dashboards.

---

## 2. Branch / PR / Head

- Branch: `audit/account-platform`
- Tracking: `origin/audit/account-platform`
- Prep-Head vor diesem Audit: `e6b3e62c`
- Aktueller Docs-Head: nach dem letzten Commit dieses Workstreams (`git rev-parse HEAD`)
- Draft-PR: der PR dieses Branchs gegen `main`
- Basis `origin/main`: `cd220beb`

Unabhängig verifiziert, **nicht owned**:

- PR #38 Draft OPEN, Head zum Prüfzeitpunkt `f4f2fbd5bf89438ae0ccb6999eb0baa2c536e72f`
- Seasonal-Agent-Anzeigename: **Reisezeitpunkt saisonale intelligenz**

---

## 3. Status

**Audit fertig / wartet auf Technical-Lead-Review**

Nicht: implementiert, nicht Ready, nicht merge-freigegeben.

---

## 4. Bereits umgesetzt (dieser Workstream)

Nur Dokumentation:

- `docs/ACCOUNT_PLATFORM_AUDIT.md`
- `docs/ACCOUNT_PLATFORM_TARGET_ARCHITECTURE.md`
- `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`
- `docs/ACCOUNT_PLATFORM_EVIDENCE_MATRIX.md`
- `docs/ACCOUNT_PLATFORM_HANDOFF.md`
- Workstream-Zeile in `docs/MULTI_AGENT_WORKSTREAMS.md`

Keine Runtime-, Schema- oder Auth-Änderung.

---

## 5. Gerade offen / nicht umgesetzt

- Account-IA, Übersicht, Reisende, Favoriten, Abo, Privacy-Flows
- Shared-Contract-Fixes (`profiles`, Traveller-Registry, Delete/Export, MFA Step-up, `party_schreiben`)
- Implementierungs-PRs AP-1 ff. – **gesperrt** bis Lead-Freigabe nach PR-#38-Closure

---

## 6. Letzte relevante Änderungen

Audit des Ist-Codes gegen `docs/ACCOUNT_TRIP_WORKSPACE_PRODUCT_MODEL.md`.  
Der vorherige Branch-Text „Seasonal-Implementierung hat noch nicht begonnen“ war gegenüber PR #38 **veraltet** und gilt auf diesem Branch nicht mehr als Aussage über Seasonal.

---

## 7. Tests / CI / Preview

- Lokal grün: Übernahme 77, Navigation 10, Auth-Erwartung 33, Readiness-Übernahme 4
- Kein Production-Build, kein UI-Audit, kein `auth:pruefen`, kein Preview dieses Audit-PR zum Zeitpunkt der Fertigmeldung behauptet
- CI/Preview dieses PRs nach Push gesondert prüfen

---

## 8. DB / RLS / Production-Grenze

Keine Migration. Keine RLS-Änderung. Keine Production-Änderung.  
Bekannte Shared-Defekte nur dokumentiert.

---

## 9. Kosten / Provider / Secrets

Keine neuen Kosten, keine Secrets, keine Provider-/Payment-Aktivierung.

---

## 10. Bekannte Risiken / Review-Funde

Siehe Evidence-Matrix A1–A26. Höchste: fehlende Privacy-Selbstbedienung, ADR-0102 vs Account-Traveller, MFA unauffindbar/ohne Step-up, Legal 404, Launch-Redirects.

---

## 11. Offene Nutzerentscheidungen / Freigaben

- Legal-Texte
- Ob Guest→Account Traveller opt-in in eine Registry schreibt
- Snapshot vs. Live bei Account-Travellern
- Implementierungsstart nach PR #38
- Jeder Merge weiter nur mit aktueller Product-Owner-Freigabe

---

## 12. Exakter nächster Schritt

Unabhängiger ChatGPT/Lead-Review dieses Audits. Keine Account-Implementierung, kein Ready, kein Merge. PR #38 nicht anfassen.

---

## 13. Zuerst lesen

1. `docs/ACCOUNT_PLATFORM_HANDOFF.md`
2. `docs/ACCOUNT_TRIP_WORKSPACE_PRODUCT_MODEL.md`
3. `docs/CURSOR_ACCOUNT_PLATFORM_AUDIT_TASK.md`
4. `docs/ACCOUNT_PLATFORM_AUDIT.md`
5. `docs/MULTI_AGENT_WORKSTREAMS.md`
6. `docs/PROJECT_PROGRESS_PERSISTENCE_POLICY.md`
