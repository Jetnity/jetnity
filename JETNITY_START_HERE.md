# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 30. August 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / POST-CLEANUP / LIVE-EVIDENCE GEWINNT IMMER**

> **Vor jedem neuen Slice zuerst den relevanten Live-Stand rekonstruieren. Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen. Continuity ist Definition of Done.**

## 1. Zuerst lesen

1. `docs/CHATGPT_TECHNICAL_LEAD_POST_CLEANUP_CHECKPOINT_2026-08-30.md` ← **aktuellster Checkpoint**
2. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
3. `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
4. `JETNITY_HANDOFF.md`
5. `docs/ACTIVE_WORK_STATUS.md`
6. `docs/CORE_REPOSITORY_HYGIENE_AUDIT_2026-08-30.md`
7. `docs/CORE_REPOSITORY_HYGIENE_MATRIX_2026-08-30.md`
8. `docs/JETNITY_BINDING_BUILD_ORDER.md`
9. `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`
10. Product Differentiation Doctrine + Opportunity Register

Danach GitHub/CI/Vercel und bei relevantem DB-/Security-/Storage-Scope Supabase **live** verifizieren.

Der Product Owner kann weiterhin seinen Universal-New-Chat-Prompt verwenden. Dieser Repository-Einstieg liefert ihm den jeweils aktuellen Checkpoint.

## 2. Aktueller Übergabe-Anker

Pre-Continuity-`main` nach dem letzten mechanischen Cleanup:

`0f7d80fa48d958a8708af982806b99966289b2bd`

- PR #283: MERGED
- Issue #282: completed
- Post-Merge CI #1399 / Run `33334863504`: SUCCESS
- Post-Merge Vercel: SUCCESS

Der docs-only Continuity-PR aus Issue #284 bewegt `main` danach weiter. **Finalen `main` immer live lesen.**

## 3. Alte aktive Jetnity-Reste – bereinigt

Die alte Creator/MediaStudio-/Bets-/Travel-Welt ist nicht mehr Teil der aktuellen Runtime. Zusätzlich sind die letzten mechanischen High-confidence Repo-Reste jetzt entfernt:

- fünf getrackte `supabase/.temp/*` CLI-Dateien
- `supabase/.branches/_current_branch`
- `public/images/prague.jpg`

Der Sanitation-Lock-Test verlangt jetzt ihre Abwesenheit.

Bewusst erhalten bleiben historische Migrationen/Evidence, private Recovery und unique-evidence Branches bis zu separaten Entscheidungen. Das ist **kein alter aktiver Runtime-Code**.

## 4. Noch optionale kleine Hygiene

Separate `UPDATE-CANDIDATEs`, nicht automatisch aktiv und kein Legacy-System:

- zwei ungenutzte V1 Image-Hosts in `next.config.js`
- `components.json` hooks alias ohne `hooks/`
- stale `zod` Exception
- kosmetische `Mega Pro` Copy
- ungenutzter Tailwind `content/**` Glob
- optionale Docs-/Kommentar-Hygiene

Details im aktuellen Post-Cleanup-Checkpoint und in der Hygiene-Matrix.

## 5. Produkt-Nordstern

> **Jetnity = Travel Operating System für die konkrete Reise.**

Pfeiler: **Planen / Entscheiden / Reisebereit sein.**

> **„Macht das Jetnity einzigartiger oder nur größer?“**

Traveller Truth:

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

> **Account Registry = wiederverwendbare aktuelle Traveller-Fakten. Trip Snapshot = einzige Current Truth für eine konkrete Reise.**

Kein Default-/Primary-/Preferred-/Chosen-Pass; keine Default-Citizenship; keine Passnummern/Scans/MRZ/Biometrie/DOB/Health-Daten im aktuellen Kernmodell.

## 6. GitHub Governance

`main` ist geschützt über Ruleset `Jetnity main protection` / ID `21875372` / active.

Pflicht:

- PR vor Merge
- Branch up to date
- Conversation resolution
- `Typecheck, Lint & Build`
- `Auth-Konfiguration gegen config.toml`
- `Vercel`
- nur Merge
- kein Force Push / keine Branch-Löschung
- Bypass leer

Bekannter Draft→Ready-Connectorfehler `Repository.fullDatabaseId` ist kein Jetnity-Codeproblem. Branch Protection niemals deswegen lockern.

## 7. Supabase Kurzstand

Letzter Transition-Precheck:

- Production `qscbgcdmivbbnzrcyegn`: ACTIVE_HEALTHY
- develop `yfvbxvijcorffwxbxahl`: ACTIVE_HEALTHY
- alter eigenständiger `jetnity-bets`: gelöscht
- P1 Migration-History repariert
- `creator-media`: entfernt
- `jetnity-legacy-recovery`: privat, bewusst retained
- Production Edge Functions nach Cleanup: 0

Vor betroffenem Scope live erneut prüfen.

## 8. FIRST NEXT ACTION

**Kein Runtime-Slice und kein Cursor-Agent ist automatisch freigegeben.**

Der neue Technical Lead:

1. liest den Post-Cleanup-Checkpoint vollständig;
2. verifiziert finalen `main`, Continuity-PR, CI/Vercel und Ruleset live;
3. prüft offene PRs/Issues/Branches und Agentenstatus;
4. prüft Supabase, falls für den nächsten Scope relevant;
5. meldet Docs-vs-Live-Widersprüche;
6. empfiehlt erst dann den nächsten bounded Slice.

**Live-Evidence gewinnt immer.**