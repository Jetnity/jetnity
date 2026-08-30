# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 30. August 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / FINAL CHAT TRANSITION / LIVE-EVIDENCE GEWINNT IMMER**

> **Vor jedem neuen Slice – auch im selben Chat – zuerst den relevanten Live-Stand rekonstruieren. Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen. Continuity ist Definition of Done.**

## 1. Zuerst lesen

1. `docs/CHATGPT_TECHNICAL_LEAD_CHECKPOINT_2026-08-30_FINAL.md`
2. `docs/CHATGPT_NEW_CHAT_START_PROMPT_2026-08-30_FINAL.md`
3. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
4. `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
5. `JETNITY_HANDOFF.md`
6. `docs/ACTIVE_WORK_STATUS.md`
7. `docs/CORE_REPOSITORY_HYGIENE_AUDIT_2026-08-30.md`
8. `docs/CORE_REPOSITORY_HYGIENE_MATRIX_2026-08-30.md`
9. `docs/JETNITY_BINDING_BUILD_ORDER.md`
10. `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`
11. Product Differentiation Doctrine + Opportunity Register

Danach GitHub/CI/Vercel und bei relevantem DB-/Security-/Storage-Scope Supabase **live** verifizieren.

## 2. Übergabe-Anker

Pre-Transition-`main`:

`498abfd26e584dcd40e59f4266e1bfc87828649f`

Dieser SHA enthält bereits den abgeschlossenen Core Repository Hygiene Audit über Recovery PR #279.

Der docs-only Transition-PR aus Issue #280 bewegt `main` danach weiter. **Finalen `main` immer live lesen.**

## 3. Was heute sicher superseded ist

Alte Pointer vor diesem Update sind an mehreren Stellen veraltet. Insbesondere gilt jetzt:

- P1 Migration-History `20260829140000_trip_item_commercial_provenance` ist **repariert**, nicht offen; authoritative Recovery PR #251, Merge `5ee8c7017180747bb29112f1c5a2cf3419fd062d`.
- `main` ist **geschützt**, nicht `protected=false`; Ruleset `Jetnity main protection`, ID `21875372`, Enforcement `active`.
- alte GitHub-Repositories `jetnity-bets` und `jetnity-travel` sind gelöscht; live Connector sieht nur `Jetnity/jetnity`.
- alter eigenständiger Supabase `jetnity-bets` ist gelöscht.
- `creator-media` Source-Bucket ist nach Backup/Restore-Proof vollständig entfernt; private `jetnity-legacy-recovery` bleibt als Recovery-Gate.
- 165 sicher gemergte GitHub-Branch-Refs wurden gelöscht.
- Core Repository Hygiene Audit ist abgeschlossen; Issue #273 completed.

## 4. Produkt-Nordstern

> **Jetnity = Travel Operating System für die konkrete Reise.**

Pfeiler: **Planen / Entscheiden / Reisebereit sein.**

Leitfrage:

> **„Macht das Jetnity einzigartiger oder nur größer?“**

Kanonische Doctrine:

`docs/JETNITY_PRODUCT_DIFFERENTIATION_DOCTRINE_2026-08-30.md`

## 5. Traveller / Account Current Truth

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

> **Account Registry = wiederverwendbare aktuelle Traveller-Fakten. Trip Snapshot = einzige Current Truth für eine konkrete Reise.**

Verbindlich:

- kein Default-/Primary-/Preferred-/Chosen-Pass
- keine Default-Citizenship
- Issuer Country ≠ Citizenship
- Document↔Citizenship-Relation erhalten
- keine Passnummern, Scans, MRZ, Biometrie, DOB oder Health-Daten im aktuellen Kernmodell
- keine Official Requirements/Entry Truth erfinden

Bereits integriert: Foundation E, AP-5 Gate 0 + S1–S5 + AP-5-R1, AP-7 Gate 0 + S1–S4, TA-DL1, AP-UX-NAV1, TA-CUX1, AP-10-S1.

## 6. GitHub Governance

`main` Ruleset:

- `Jetnity main protection` / ID `21875372` / active
- PR-Pflicht
- Branch up to date
- Conversation resolution
- Required Checks: `Typecheck, Lint & Build`, `Auth-Konfiguration gegen config.toml`, `Vercel`
- nur Merge-Commit
- keine Branch-Löschung / kein Force Push
- keine Bypass-Akteure

Bekannter Connectorfehler beim Draft→Ready: `Repository.fullDatabaseId`. Branch Protection deswegen **nicht** lockern. Recovery-Transport nur auf exakt demselben TL-PASS-SHA.

## 7. Core Hygiene – noch offene Kandidaten, nicht automatisch starten

Bestätigte `DELETE-CANDIDATE`:

- getrackte `supabase/.temp/*`
- `supabase/.branches/_current_branch`
- `public/images/prague.jpg`

Jeder spätere Cleanup muss gekoppelt `lib/project-sanitation/closure-invariants.test.ts` aktualisieren.

Legal/Auth/Recovery/Unique-Branch-Fragen bleiben separate Gates; Details im finalen Checkpoint und in der Hygiene-Matrix.

## 8. PrivacyBee / Legal

PrivacyBee AG / `privacybee.io` bleibt Product-Owner-binding für die website-visible Privacy Layer. Jetnity-Activation bleibt bis echter erreichbarer `jetnity.com` Production geparkt.

Audit bestätigte aktuellen Gap: Register verlinkt `/privacy`; `/privacy` und `/terms` fehlen. `CookieConsent.tsx` ist unmounted und stale. **Nicht mechanisch mounten und keine Legal-Copy erfinden.**

## 9. Supabase

Live beim Transition-Precheck:

- Production `qscbgcdmivbbnzrcyegn`: ACTIVE_HEALTHY
- develop ref `yfvbxvijcorffwxbxahl`: ACTIVE_HEALTHY
- Production Migration-History enthält die reparierte `20260829140000` sowie `20260830155711` und `20260830183009`
- `creator-media`: entfernt
- `jetnity-legacy-recovery`: privat, 1 Objekt / 3,030,830 Bytes, Production/Data-Gate
- Production Edge Functions nach Cleanup: 0

Vor DB-naher Arbeit live erneut prüfen; Development-Reconciliation nicht aus alten Dokumenten erraten.

## 10. FIRST NEXT ACTION

**Kein Runtime-Slice und kein Cursor-Agent ist durch diesen Übergang automatisch freigegeben.**

Der neue Technical Lead:

1. liest den finalen Checkpoint;
2. verifiziert finalen `main`, Transition-Merge, CI/Vercel und Ruleset live;
3. verifiziert offene PRs/Issues/Branches und Agentenstatus;
4. prüft Supabase, falls für den nächsten Scope relevant;
5. meldet Widersprüche zwischen Docs und Live-Evidence;
6. empfiehlt erst dann den nächsten bounded Slice.

Mögliche Kandidaten sind im finalen Checkpoint beschrieben. **Live-Evidence gewinnt immer.**