# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 31. August 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / REQUIREMENTS GATE 0 CLOSED / LIVE-EVIDENCE GEWINNT IMMER**

> **Vor jedem neuen Slice zuerst den relevanten Live-Stand rekonstruieren. Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen. Continuity ist Definition of Done.**

## 1. Zuerst lesen

1. `docs/CHATGPT_TECHNICAL_LEAD_REQUIREMENTS_GATE0_CLOSED_2026-08-31.md` ← **aktuellster Checkpoint**
2. `docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md` ← **verbindlicher bestätigter Zielzustand für vollständige Einreiseanforderungen**
3. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
4. `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
5. `JETNITY_HANDOFF.md`
6. `docs/ACTIVE_WORK_STATUS.md`
7. `docs/REQUIREMENTS_PROVIDER_GROUNDWORK_AUDIT_2026-08-30.md`
8. `docs/REQUIREMENTS_PROVIDER_CONTRACT_GAP_MAP_2026-08-30.md`
9. `docs/REQUIREMENTS_PROVIDER_SELECTION_MATRIX_2026-08-30.md`
10. `docs/JETNITY_BINDING_BUILD_ORDER.md`
11. `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`

Danach GitHub/CI/Vercel und – nur bei betroffenem DB-/Security-/Storage-/Migration-Scope – Supabase **live** verifizieren.

Der frühere `docs/CHATGPT_TECHNICAL_LEAD_POST_CLEANUP_CHECKPOINT_2026-08-30.md` bleibt historische Evidence, ist aber nicht mehr der aktuelle Einstieg.

## 2. Aktueller Übergabe-Anker

Requirements-Gate-0-Merge auf `main`:

`1327759d9210386ae39303c65461e2fce864b5fd`

Verifiziert nach Merge:

- PR #290: **MERGED**.
- PR #289: **CLOSED / NOT MERGED / MECHANICALLY SUPERSEDED** wegen bekanntem Draft→Ready-Connectorfehler; Schutzregeln wurden nicht gelockert.
- Main-CI #1413 / `33339603883`: **SUCCESS** exakt auf `1327759d...`.
- Vercel Production `dpl_9Vgk6yeZLe6tSZvmAqypYfUDca2y`: **READY** exakt auf `1327759d...`.
- Issue #288: **CLOSED / completed**.
- Ruleset `Jetnity main protection` / ID `21875372`: active, bypass leer, PR + strict checks erforderlich.

Der docs-only Continuity-PR, der diesen Einstieg aktualisiert, bewegt `main` nochmals weiter. **Finalen `main` immer live lesen.**

## 3. Aktiver Agent / aktiver Slice

Es läuft **kein Cursor-Agent** und **kein neuer Produkt-/Runtime-Slice**.

Letzter Agent:

**`Jetnity requirements provider groundwork 1`**, Generation 1  
Session: `bc-77badb21-f262-4ee2-86ce-f71a5aa1f051`  
Status: **STOPPED**.

Kein Folgeslice wurde automatisch gestartet.

## 4. Produkt-Nordstern / Traveller Truth

> **Jetnity = Travel Operating System für die konkrete Reise.**

Pfeiler: **Planen / Entscheiden / Reisebereit sein.**

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

> **Account Registry = wiederverwendbare aktuelle Traveller-Fakten. Trip Snapshot = einzige Current Truth für eine konkrete Reise.**

Kein Default-/Primary-/Preferred-/Chosen-Pass, keine Default-Citizenship, Issuer Country ≠ Citizenship, kein `documents[0]` oder `evaluations[0]` als Product Truth.

## 5. Requirements Gate 0 – verbindliche aktuelle Grenze

- `requirementsProviderAus()` bleibt fail-closed `null`.
- kein echter Requirements-/Visa-/Entry-Provider ist aktiv.
- keine Provider-Secrets, paid calls, Verträge oder Runtime-Aktivierung.
- vor realem Adapter: AbortSignal/Timeout, Readiness-Kill-Switch und bounded Freshness/TTL lösen.
- Sherpa-Origin→Nationality-Fallback ist für Jetnity verboten.
- Sherpa max. 3 Transit-Nodes dürfen Jetnitys bis zu 12 Transitländer niemals still verkleinern.
- Timatic/IATA und Sherpa sind nur Kandidaten; kein Provider ist gewählt.

### Bestätigte Entry-Requirements-Zielarchitektur

Für den Zielzustand ist verbindlich: Jetnity bildet nicht nur Visa/eTA/eVisa ab, sondern die vollständige praktisch relevante Einreise-Checkliste strukturiert pro Reisendem, Credential-Option, Route und Datum. Dazu gehören insbesondere Passgültigkeit, freie Passseiten, Transit, Einreise-/Gesundheitsformulare, Impf-/Gesundheitsanforderungen, Versicherungspflicht, Rück-/Weiterflugnachweis, Buchungs-/Reisenachweise und finanzielle Mittel. `blank_passport_pages` und `financial_means` müssen eigene strukturierte Requirement-Typen erhalten und dürfen nicht in `other_entry_requirement` verschwinden.

Kanonische Zielarchitektur: `docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md`.

Diese Produktentscheidung erweitert keinen laufenden Slice automatisch. Jeder Implementierungsslice braucht einen frischen Binding Slice Precheck.

Details zum Ist-Zustand im aktuellen Closure-Checkpoint und den Gate-0-Deliverables.

## 6. GitHub Governance

`main` ist über Ruleset `Jetnity main protection` / ID `21875372` geschützt.

Pflicht:

- PR vor Merge;
- Branch up to date;
- Conversation resolution;
- `Typecheck, Lint & Build`;
- `Auth-Konfiguration gegen config.toml`;
- `Vercel`;
- nur Merge;
- kein Force Push / keine Löschung von `main`;
- bypass leer.

Bekannter Draft→Ready-Connectorfehler `Repository.fullDatabaseId` ist kein Jetnity-Codeproblem. Branch Protection deswegen niemals lockern.

## 7. Supabase Kurzstand

Gate 0 hat Supabase nicht mutiert.

Letzter Gate-0-Precheck:

- Production `qscbgcdmivbbnzrcyegn`: `ACTIVE_HEALTHY`.
- Development `yfvbxvijcorffwxbxahl`: `ACTIVE_HEALTHY`.
- Development-vs-Production-Migration-History weist Drift auf.

Vor migrationsnahem oder DB-/RLS-/Storage-/Security-Scope live erneut prüfen und reconciliieren.

## 8. FIRST NEXT ACTION

**Kein Runtime-Slice und kein Cursor-Agent ist automatisch freigegeben.**

Der Technical Lead:

1. liest den aktuellen Closure-Checkpoint vollständig;
2. verifiziert finalen `main`, offene PRs/Issues, CI/Vercel und Agentenstatus live;
3. prüft Supabase nur bei relevantem Scope;
4. revalidiert die Gate-0-Gaps gegen den aktuellen Code;
5. definiert erst danach einen neuen bounded Slice.

Wahrscheinlicher technischer Kandidat: provider-neutral **Requirements Truth-Ops S4-R1** mit AbortSignal/Timeout, Readiness-Kill-Switch und bounded Freshness/TTL; Factory bleibt `null`. **Noch nicht gestartet.**

**Live-Evidence gewinnt immer.**
