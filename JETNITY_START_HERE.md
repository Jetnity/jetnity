# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 31. August 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / REQUIREMENTS TRUTH-OPS S4-R1 CLOSED / LIVE-EVIDENCE GEWINNT IMMER**

> **Vor jedem neuen Slice zuerst den relevanten Live-Stand rekonstruieren. Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen. Continuity ist Definition of Done.**

## 1. Zuerst lesen

1. `docs/CHATGPT_TECHNICAL_LEAD_REQUIREMENTS_TRUTH_OPS_S4_R1_CLOSED_2026-08-31.md` ← **aktuellster Checkpoint**
2. `docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md` ← **verbindlicher bestätigter Zielzustand für Entry Requirements + Travel Companion**
3. `docs/ACTIVE_WORK_STATUS.md`
4. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
5. `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
6. `JETNITY_HANDOFF.md`
7. `docs/REQUIREMENTS_PROVIDER_GROUNDWORK_AUDIT_2026-08-30.md`
8. `docs/REQUIREMENTS_PROVIDER_CONTRACT_GAP_MAP_2026-08-30.md`
9. `docs/REQUIREMENTS_PROVIDER_SELECTION_MATRIX_2026-08-30.md`
10. `docs/JETNITY_BINDING_BUILD_ORDER.md`
11. `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`

Danach GitHub/CI/Vercel und – nur bei betroffenem DB-/Security-/Storage-/Migration-Scope – Supabase **live** verifizieren.

Frühere Gate-0-/Cleanup-Checkpoints bleiben historische Evidence, sind aber nicht mehr der aktuelle Einstieg.

## 2. Aktueller Übergabe-Anker

Requirements Truth-Ops S4-R1 ist auf `main` abgeschlossen.

Runtime-Merge:

`43177a7bab61b0934775f86442833af0f27b3361`

Verifiziert nach Merge:

- Review-PR #296: **MERGED**.
- Implementierungs-Head `595b4ad2a827beff7bec597433b3316d21da0747`.
- Draft-PR #293: **CLOSED / NOT MERGED / MECHANICALLY SUPERSEDED** ausschließlich wegen des bekannten Draft→Ready-Connectorfehlers.
- Main-CI #1423 / Run `33342536940`: **SUCCESS** exakt auf `43177a7b...`.
- Vercel Production `dpl_EkrbQmFfxD8gwnZ4AnYFegfaRBWG`: **READY** exakt auf `43177a7b...`.
- Issue #292: **CLOSED / completed**.
- GitHub Review Threads: 0.
- Vercel Toolbar unresolved Threads auf Review-Branch und `main`: 0.

Der docs-only Continuity-PR, der diesen Einstieg aktualisiert, bewegt `main` nochmals weiter. **Finalen `main` immer live lesen.**

## 3. Aktiver Agent / aktiver Slice

Es läuft derzeit **kein neuer Cursor-Runtime-Slice**.

Letzter Agent:

**`Jetnity requirements truth ops 1`**, Generation 1  
Session: `bc-49df8304-48ed-4820-bdf4-57f53aa1aaee`  
Status: **STOPPED / DELIVERY COMPLETE / TL PASS**.

Kein Folgeslice wurde automatisch gestartet.

## 4. Produkt-Nordstern / Traveller Truth

> **Jetnity = Travel Operating System für die konkrete Reise.**

Pfeiler: **Planen / Entscheiden / Reisebereit sein.**

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

> **Account Registry = wiederverwendbare aktuelle Traveller-Fakten. Trip Snapshot = einzige Current Truth für eine konkrete Reise.**

Kein Default-/Primary-/Preferred-/Chosen-Pass, keine Default-Citizenship, Issuer Country ≠ Citizenship, kein `documents[0]` oder `evaluations[0]` als Product Truth.

## 5. Requirements Runtime Boundary nach S4-R1

Jetzt vorhanden:

- Pflicht-`AbortSignal` am Requirements Provider Port;
- 4.000-ms Domain-Timeout mit Cancellation;
- fail-closed technische Failure-Semantik;
- Readiness-Kill-Switch `JETNITY_READINESS_AKTIV` auf Provider-Ops-Muster;
- Production hart aus;
- globales Official-`checkedAt`-Ceiling von 60 Minuten;
- `checkedAt` = Jetnity Retrieval-/Evaluation-Zeit, nicht Vendor-`lastUpdatedAt`.

Weiterhin **nicht** aktiv:

- `requirementsProviderAus()` bleibt `null`;
- kein echter Requirements-/Visa-/Entry-Provider;
- keine Provider-Secrets / paid calls / Verträge / Runtime-Aktivierung;
- kein Workspace-Live-Provider-Wiring.

## 6. Bestätigte Entry-Requirements-/Travel-Companion-Zielarchitektur

Verbindlicher Zielzustand steht in:

`docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md`

Jetnity soll später nicht nur Visa ja/nein zeigen, sondern die vollständige praktisch relevante Einreisevorbereitung strukturiert pro Reisendem, Credential-Option, Route und Datum abbilden. Dazu gehören insbesondere:

- visumfrei / klassisches Visum / Visa on Arrival / eVisa / eTA;
- offizielle Antrags-/Informationslinks und direkte sichere Actions;
- Passgültigkeit;
- eigene Typen `blank_passport_pages` und `financial_means`;
- Transit;
- Entry-/Arrival-/Gesundheitsformulare;
- Impf-/Gesundheitsanforderungen;
- Versicherungspflicht;
- Rück-/Weiterflug-, Unterkunfts- und relevante Nachweise;
- proaktive Travel-Companion-/Deadline-Logik;
- Warnungen wie „jetzt innerhalb des 72-Stunden-Fensters erledigen“ nur aus belastbarer Evidence;
- Neuberechnung bei Reiseänderungen;
- priorisierte, deduplizierte In-App-/Push-/gegebenenfalls E-Mail-Begleitung.

Diese Zielarchitektur ist **kein automatischer Build-Auftrag**.

## 7. GitHub Governance

`main` bleibt über Ruleset `Jetnity main protection` / ID `21875372` geschützt.

Pflicht:

- PR vor Merge;
- Branch up to date;
- Conversation Resolution;
- `Typecheck, Lint & Build`;
- `Auth-Konfiguration gegen config.toml`;
- `Vercel`;
- nur Merge;
- kein Force Push / keine Löschung von `main`;
- bypass leer.

Bekannter Draft→Ready-Connectorfehler `Repository.fullDatabaseId` ist kein Jetnity-Codeproblem. Branch Protection deswegen niemals lockern.

Solange der Fehler besteht, gilt der mechanische Ersatzprozess: TL reviewt den exakten Draft-Head, erstellt bei PASS einen non-draft Review-PR auf exakt demselben Commit und gatet CI/Vercel/Mergeability/Threads erneut.

## 8. Supabase Kurzstand

S4-R1 hat Supabase nicht mutiert.

Letzter bekannter Requirements-Gate-0-Stand:

- Production `qscbgcdmivbbnzrcyegn`: `ACTIVE_HEALTHY`.
- Development `yfvbxvijcorffwxbxahl`: `ACTIVE_HEALTHY`.
- Development-vs-Production-Migration-History weist Drift auf.

Vor migrationsnahem oder DB-/RLS-/Storage-/Security-Scope live erneut prüfen und reconciliieren.

## 9. FIRST NEXT ACTION

**Kein Runtime-Slice und kein Cursor-Agent ist automatisch freigegeben.**

Der Technical Lead:

1. liest den aktuellen Closure-Checkpoint vollständig;
2. verifiziert finalen `main`, offene PRs/Issues, CI/Vercel und Agentenstatus live;
3. liest die bestätigte Entry-/Travel-Companion-Zielarchitektur gegen den aktuellen Code;
4. prüft Supabase nur bei relevantem Scope;
5. definiert erst danach den kleinsten verantwortbaren bounded Slice.

Issue #294 bleibt als Architektur-Tracker offen. Providerwahl, Vertrag/DPA, Secrets/API Keys, paid calls, sensitive Daten und Production-Aktivierung bleiben besondere Product-Owner-Gates.

**Live-Evidence gewinnt immer.**
