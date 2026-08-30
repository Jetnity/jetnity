# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 30. August 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / POST-CLEANUP FINAL / LIVE-EVIDENCE GEWINNT IMMER**

> Vor jedem neuen Slice zuerst den relevanten Live-Stand rekonstruieren. Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen. Continuity ist Definition of Done.

## 1. Zuerst lesen

1. `docs/CHATGPT_TECHNICAL_LEAD_CHECKPOINT_2026-08-30_POST_CLEANUP_FINAL.md`
2. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
3. `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
4. `JETNITY_HANDOFF.md`
5. `docs/ACTIVE_WORK_STATUS.md`
6. `docs/CORE_REPOSITORY_HYGIENE_AUDIT_2026-08-30.md`
7. `docs/CORE_REPOSITORY_HYGIENE_MATRIX_2026-08-30.md`
8. `docs/JETNITY_BINDING_BUILD_ORDER.md`
9. `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`
10. `docs/JETNITY_PRODUCT_DIFFERENTIATION_DOCTRINE_2026-08-30.md`
11. `docs/JETNITY_STRATEGIC_DIFFERENTIATION_OPPORTUNITY_REGISTER_2026-08-30.md`

Danach GitHub/CI/Vercel und – sobald DB/Security/Storage betroffen sind – Supabase live verifizieren.

Der frühere `docs/CHATGPT_TECHNICAL_LEAD_CHECKPOINT_2026-08-30_FINAL.md` sowie der datierte `docs/CHATGPT_NEW_CHAT_START_PROMPT_2026-08-30_FINAL.md` bleiben historische Pre-Cleanup-Evidence und sind für Current-State-Fragen superseded.

## 2. Aktueller Übergabe-Anker

Pre-Handoff-Refresh-`main`:

`0f7d80fa48d958a8708af982806b99966289b2bd`

Dieser SHA enthält bereits PR #283 – den letzten mechanischen Cleanup.

- PR #283 merged
- Post-Merge CI #1399 SUCCESS
- Vercel SUCCESS
- Issue #282 completed

Der docs-only Handoff-Refresh aus Issue #286 bewegt `main` danach erneut weiter. Finalen `main` immer live lesen.

## 3. Alt-Jetnity-Cleanup

Für die aktive Codebasis abgeschlossen:

- alte Creator Hub / MediaStudio / Feed / Blog / Render Runtime entfernt
- alte `jetnity-bets` / `jetnity-travel` GitHub-Repositories gelöscht
- alter eigenständiger Supabase `jetnity-bets` gelöscht
- alte Legacy-Storage-Buckets/Policies entfernt
- `creator-media` Source-Bucket nach Backup/Restore-Proof entfernt
- 165 sicher gemergte Branch-Refs entfernt
- P1 Migration-History repariert/replay-verifiziert
- Core Repository Hygiene Audit abgeschlossen
- D-01/D-02/D-03 final bereinigt:
  - `supabase/.temp/*` untracked/entfernt
  - `supabase/.branches/_current_branch` entfernt
  - `public/images/prague.jpg` entfernt
  - `lib/project-sanitation/closure-invariants.test.ts` gekoppelt aktualisiert

Bewusst erhaltene Migrationen, historische Evidence, Recovery-Material und Unique-Evidence-Branches sind kein Cleanup-Rückstand.

## 4. Produkt-Nordstern

> **Jetnity = Travel Operating System für die konkrete Reise.**

Pfeiler: **Planen / Entscheiden / Reisebereit sein.**

Leitfrage:

> **„Macht das Jetnity einzigartiger oder nur größer?“**

## 5. Traveller / Account Current Truth

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

> **Account Registry = wiederverwendbare aktuelle Traveller-Fakten. Trip Snapshot = einzige Current Truth für eine konkrete Reise.**

Verbindlich:

- kein Default-/Primary-/Preferred-/Chosen-Pass
- keine Default-Citizenship
- Issuer Country ≠ Citizenship
- Document↔Citizenship erhalten
- keine Passnummern, Scans, MRZ, Biometrie, DOB oder Health-Daten im aktuellen Kernmodell
- keine Official Requirements/Entry Truth erfinden

Integriert: Foundation E, AP-5 Gate 0 + S1–S5 + AP-5-R1, AP-7 Gate 0 + S1–S4, TA-DL1, AP-UX-NAV1, TA-CUX1, AP-10-S1.

## 6. GitHub Governance

`main` Ruleset:

- `Jetnity main protection` / ID `21875372` / active
- PR-Pflicht
- Branch up to date
- Conversation resolution
- Required Checks: `Typecheck, Lint & Build`, `Auth-Konfiguration gegen config.toml`, `Vercel`
- nur Merge
- keine Branch-Löschung / kein Force Push
- keine Bypass-Akteure

Bekannter Draft→Ready-Connectorbug: `Repository.fullDatabaseId`. Das ist kein Jetnity-Fehler. Branch Protection niemals deswegen lockern; dokumentierten Same-SHA-Recovery-Transport verwenden.

## 7. Verbleibende Hygiene

Keine bestätigten mechanischen DELETE-CANDIDATEs aus dem Core Audit mehr offen.

Kleine `UPDATE-CANDIDATE` bleiben optional:

- alte V1 Image-Hosts in `next.config.js`
- `components.json` hooks alias ohne `hooks/`
- stale `zod` Checker-Exception
- `Mega Pro` Copy
- Tailwind `content/**` Glob
- optionale Docs-/Kommentar-Hygiene

Diese sind keine Legacy-Blocker.

Legal/Auth/Recovery/Unique-Branch-Fragen bleiben separate Gates.

## 8. Supabase

Letzter verifizierter Übergabestand:

- Production `qscbgcdmivbbnzrcyegn`: ACTIVE_HEALTHY
- develop ref `yfvbxvijcorffwxbxahl`: ACTIVE_HEALTHY
- P1 `20260829140000_trip_item_commercial_provenance`: repariert
- `creator-media`: entfernt
- `jetnity-legacy-recovery`: privat, 1 Objekt / 3,030,830 Bytes, Production/Data-Gate
- Production Edge Functions nach Cleanup: 0

Vor DB-naher Arbeit live erneut prüfen.

## 9. Privacy / Legal

PrivacyBee AG / `privacybee.io` bleibt Product-Owner-binding für die website-visible Privacy Layer. Activation bis echte erreichbare `jetnity.com` Production geparkt.

Real Gap:

- Register verlinkt `/privacy`
- `/privacy` und `/terms` fehlen
- `CookieConsent.tsx` ist unmounted/stale

Nicht mechanisch mounten und keine Legal-Copy erfinden.

## 10. FIRST NEXT ACTION

Kein Runtime-Slice und kein Cursor-Agent ist automatisch freigegeben.

Der neue TL:

1. liest den POST-CLEANUP-FINAL-Checkpoint;
2. verifiziert finalen `main`, letzte Merges, offene PRs/Issues/Branches, CI/Vercel und Ruleset live;
3. prüft Supabase, sobald der nächste Scope DB/Security/Storage berührt;
4. meldet Docs-vs-Live-Widersprüche;
5. priorisiert erst dann den nächsten bounded Slice.

**Live-Evidence gewinnt immer.**