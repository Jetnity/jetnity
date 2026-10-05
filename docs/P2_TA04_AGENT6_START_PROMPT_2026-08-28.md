# Start Prompt – Cursor-Agent: Account plattform audit vorbereitung 6

Du arbeitest im Repository `Jetnity/jetnity` als frische Session:

**Cursor-Agent: Account plattform audit vorbereitung 6**

Dein einziger Auftrag ist:

**P2-TA-04 – Traveller Child Write-Path Hardening Gate 0**

Issue: #119  
Vorbereiteter Branch: `docs/p2-ta-04-traveller-write-path-gate0`

## Zuerst zwingend lesen

1. `JETNITY_START_HERE.md`
2. `docs/TECHNICAL_LEAD_MERGE_AUTONOMY_SUPERSESSION_2026-08-26.md`
3. `docs/JETNITY_ENGINEERING_EXCELLENCE_STANDARD.md`
4. `docs/JETNITY_BINDING_BUILD_ORDER.md`
5. `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`
6. `docs/TRAVELLER_ACCOUNT_NEXT_PHASE_AUDIT.md`
7. `docs/CHATGPT_PR117_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-28.md`
8. `docs/P2_TA04_TRAVELLER_CHILD_WRITE_PATH_GATE0_TASK_2026-08-28.md`
9. `docs/P2_TA04_AGENT_ROTATION_RECORD_2026-08-28.md`
10. relevante Traveller/Foundation-E-/Guest→Account-/Readiness-ADRs und Migrationen.

Danach **Live-Evidence selbst verifizieren**. Verlasse dich nicht blind auf den Start-Prompt.

## Verbindlicher Scope

Audit + Security Architecture + Evidence only.

Du musst exakt klären:

- welche aktuellen Runtime-Pfade direkt auf `trip_travellers`, `trip_traveller_citizenships`, `trip_traveller_documents` schreiben;
- welche ausschließlich `party_schreiben` verwenden;
- welche Invarianten DB/RLS/FKs/Trigger erzwingen;
- welche Invarianten nur im RPC/App-Vertrag liegen;
- ob direkte authenticated-DML heute eine reale Integritäts-/Security-Umgehung ist;
- welche kleinste sichere Closure-Option fachlich richtig ist;
- warum ein blindes `REVOKE` den aktuellen SECURITY-INVOKER-RPC brechen kann;
- welcher konkrete Product-Owner-Gate für einen späteren Implementation-Slice nötig wäre.

## Harte Verbote

In diesem Lauf keine:

- Migration;
- RLS-Änderung;
- `GRANT` / `REVOKE`;
- SECURITY DEFINER/INVOKER-Änderung;
- Schema-Änderung;
- Production-Datenänderung;
- Supabase-Branch-Mutation;
- Auth/MFA/AAL-Änderung;
- AP-5/AP-6a/AP-7 Runtime;
- Passportnummern/Scans/MRZ/Biometrie;
- Provider S5-B / TW-8 / #109 / #110 / Homepage / Public Indexing / Native.

## Evidence-Standard

- Current `main`, branch head, merge-base, ahead/behind dokumentieren.
- Offene parallele PRs auf Kollision prüfen.
- Code-Suche vollständig dokumentieren; keine „keine Caller“-Behauptung ohne Such-Evidence.
- Supabase-Grants/RLS/FKs/Constraints/Trigger/Funktions-Security live lesen, aber nichts mutieren.
- Cross-user Ownership-Risiko und Write-Contract-/Integrity-Risiko strikt trennen.
- Kein P0 aufblasen. Wenn kein Cross-User-Bypass existiert, so sagen.
- Keine Browser-/DB-/Test-Behauptung ohne tatsächlichen Lauf.
- `unknown` bleibt `unknown`.

## Deliverables

Mindestens:

- `docs/P2_TA04_TRAVELLER_CHILD_WRITE_PATH_GATE0_STATUS_2026-08-28.md`
- `docs/P2_TA04_TRAVELLER_CHILD_WRITE_PATH_GATE0_HANDOFF_2026-08-28.md`
- Self-Review / Test-Evidence in geeigneter versionierter Form.

Nur wirklich notwendige Current-Truth-Zeiger anfassen. Historische Evidence nicht still umschreiben.

## Abschluss

Wenn Authoring vollständig ist:

1. vollständigen Diff selbst prüfen;
2. relevante lokale Tests/Checks ausführen;
3. Draft-PR aktualisieren/erstellen;
4. Exact-Head GitHub Actions und Vercel Preview dokumentieren, sobald vorhanden;
5. **STOPP**.

Nicht Ready. Nicht mergen. Kein Implementation-Folgeslice.

Der unabhängige Technical Lead übernimmt danach den Re-Review.
