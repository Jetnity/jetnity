# Jetnity – AP-4 Start Prompt für Cursor

**Nimm einen neuen Agenten und nenne ihn exakt: `Account plattform audit vorbereitung 3`.**

Du übernimmst ausschließlich den neuen Runtime-Slice **AP-4 Account Archive Lifecycle**.

Bevor du irgendetwas änderst:

1. hole aktuellen `origin/main` und verifiziere die Live-SHA;
2. lies vollständig `JETNITY_START_HERE.md`;
3. lies `docs/JETNITY_AGENT_SESSION_ROTATION_STANDARD.md`, `docs/JETNITY_AGENT_WORKSTREAM_GOVERNANCE.md`, `docs/JETNITY_BINDING_BUILD_ORDER.md`, `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`, `docs/CONTINUITY_STANDARD.md`, `docs/LOGIC_STANDARD.md`;
4. lies vollständig `docs/ACCOUNT_AP4_ARCHIVE_LIFECYCLE_TASK_2026-08-27.md`, `docs/ACCOUNT_AP4_ARCHIVE_LIFECYCLE_DECISION_2026-08-27.md`, `docs/ACCOUNT_AP4_ARCHIVE_LIFECYCLE_STATUS_2026-08-27.md`, `docs/ACCOUNT_AP4_ARCHIVE_LIFECYCLE_HANDOFF_2026-08-27.md`;
5. lies AP-3 Status/Handoff, PR-#107-Reconciliation und TW7-A Status/Handoff sowie die relevanten ADRs;
6. verifiziere offene PRs/Branches und die betroffenen Runtime-Dateien gegen Live-Evidence.

Implementiere danach **nur** den im AP-4-Task freigegebenen Scope.

Besonders verbindlich:

- Archivieren/Wiederherstellen nur für Konto-Reisen;
- normale AP-3-Datumsgruppen enthalten keine archivierten Reisen;
- eigener Archiv-Bereich unter `/reisen`;
- Restore darf niemals einen früheren `draft/planned/booked`-Status erfinden;
- gültige Restore-Provenienz namespaced in bestehender `trips.metadata`, alle fremden Metadata-Keys erhalten;
- historische archivierte Reise ohne gültige Provenienz: fail-closed, kein Default;
- ein serverseitiger Status-Schreibweg, `auth.getUser()`/bestehender `konto()`-Vertrag, authenticated + Owner-RLS, kein Service Role;
- optimistic/stale guard; kein blindes Überschreiben;
- keine Migration, kein RLS/Auth/AAL, kein AP-7, kein P2-TA-06, keine Provider/Admin/Growth/Homepage/TW-8-Arbeit;
- TW7-A Kartenidentität/`TripSummary.stages`/`reiseOrte()` nicht zurückbauen;
- Gast-Reisen erhalten kein Archiv.

Schreibe gezielte Tests plus Regressionen, führe danach die vollständigen aktuellen Repository-Gates aus und erstelle einen **Draft-PR**. Warte auf Exact-Head GitHub Actions und Vercel Preview, prüfe Review-Threads, dokumentiere Status/Handoff/Continuity auf deinem Branch und führe einen adversarial Self-Review durch.

Dann **STOPP** und melde:

- Branch
- Draft-PR
- Exact Head
- Dateien
- Tests
- Build/Gates
- Security/DB
- Kosten
- offene Risiken

**Kein Ready und kein Merge durch dich.** ChatGPT / Technical Lead führt den unabhängigen Exact-Head-Finalreview durch.
