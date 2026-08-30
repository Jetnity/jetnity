# Jetnity – Handoff und nächste Schritte

Stand: 30. August 2026  
Status: **CURRENT HANDOFF / POST-CLEANUP / NO ACTIVE RUNTIME SLICE / LIVE-EVIDENCE GEWINNT**

Aktuellster vollständiger Checkpoint:

`docs/CHATGPT_TECHNICAL_LEAD_POST_CLEANUP_CHECKPOINT_2026-08-30.md`

Verbindlicher Precheck:

`docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`

## 1. Verifizierter Übergabestand

Pre-Continuity-`main`:

`0f7d80fa48d958a8708af982806b99966289b2bd`

Dieser SHA enthält den finalen mechanischen Repository-Cleanup:

- PR #283 MERGED
- Issue #282 CLOSED / completed
- finaler Cleanup Head `204511f552d58e246cd08fd8b724eb98edd4dc49`
- PR CI #1398 SUCCESS
- Post-Merge CI #1399 / `33334863504` SUCCESS
- Vercel Preview + Post-Merge SUCCESS

Der docs-only Continuity-PR aus Issue #284 bewegt `main` danach weiter. Finalen SHA live lesen.

**Kein Produkt-/Runtime-Folgeslice und kein Cursor-Agent ist automatisch aktiv.**

## 2. Legacy-/Sanitation-Stand

Abgeschlossen:

- Creator Hub / MediaStudio / Feed / Blog / Render Runtime entfernt
- alte GitHub-Repositories `jetnity-bets` / `jetnity-travel` gelöscht
- alter eigenständiger Supabase `jetnity-bets` gelöscht
- zehn alte leere Storage-Buckets entfernt
- 24 orphaned Storage-Policies entfernt
- `creator-media` Source-Bucket nach Backup/Restore-Proof entfernt
- private `jetnity-legacy-recovery` bewusst retained
- P1 Migration-History `20260829140000` repariert + Fresh Replay PASS
- 165 sicher gemergte alte Branch-Refs entfernt
- Core Repository Hygiene Audit abgeschlossen
- D-01: fünf getrackte `supabase/.temp/*` Dateien entfernt
- D-02: `supabase/.branches/_current_branch` entfernt
- D-03: unreferenziertes `public/images/prague.jpg` entfernt
- `lib/project-sanitation/closure-invariants.test.ts` verlangt jetzt deren Abwesenheit

Bewusst retained: Migrationen, dated Evidence, Recovery und unique-evidence Branches. Das ist kein alter aktiver Runtime-Code.

## 3. Noch optionale UPDATE-CANDIDATEs

Separater kleiner Config-/Copy-Hygiene-Scope, nicht automatisch starten:

- zwei ungenutzte V1 Image-Hosts in `next.config.js`
- `components.json` `@/hooks` Alias ohne `hooks/`
- stale `zod` Exception in `scripts/pakete.mjs`
- kosmetische `Mega Pro` Copy
- ungenutzter Tailwind `content/**` Glob
- optionale Docs-/Kommentar-Hygiene

Diese Punkte sind kein altes aktives Jetnity-System und kein aktueller Runtime-Blocker.

## 4. Bewusst gated

Nicht mechanisch ändern:

- `/privacy` / `/terms` / `CookieConsent.tsx` → Legal / Product Owner
- `creator` RBAC / `inhalte-moderieren` Retirement → Auth / Product Owner, falls vorgeschlagen
- `jetnity-legacy-recovery` → Production/Data-Gate
- unique-evidence Branches → separate Branch-Hygiene
- Provider Live / Secrets / paid calls / Commercial Write → besondere Gates

## 5. GitHub Governance

`main` geschützt durch Ruleset `Jetnity main protection`, ID `21875372`, active.

Required:

- PR
- branch up to date
- conversation resolution
- `Typecheck, Lint & Build`
- `Auth-Konfiguration gegen config.toml`
- `Vercel`
- nur Merge
- Force Push / deletion blockiert
- Bypass leer

Draft→Ready-Connectorbug `Repository.fullDatabaseId` bleibt ein Toolproblem, kein Jetnity-Codeproblem. Ruleset nicht lockern; bei Bedarf documented same-SHA Recovery-Transport.

## 6. Supabase

Letzter verifizierter Übergabestand:

- Production `qscbgcdmivbbnzrcyegn`: ACTIVE_HEALTHY
- develop `yfvbxvijcorffwxbxahl`: ACTIVE_HEALTHY
- P1 repariert via PR #251 / Merge `5ee8c7017180747bb29112f1c5a2cf3419fd062d`
- `creator-media`: entfernt
- `jetnity-legacy-recovery`: privat, 1 Objekt / 3,030,830 Bytes, bewusst retained
- Production Edge Functions nach Cleanup: 0

Vor DB-/Security-/Storage-Scope live neu verifizieren.

## 7. Produkt-/Traveller-Truth

> **Jetnity = Travel Operating System für die konkrete Reise.**

Pfeiler: **Planen / Entscheiden / Reisebereit sein.**

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

> **Account Registry = wiederverwendbare aktuelle Traveller-Fakten. Trip Snapshot = einzige Current Truth für eine konkrete Reise.**

Integriert: Foundation E, AP-5 Gate 0 + S1–S5 + AP-5-R1, AP-7 Gate 0 + S1–S4, TA-DL1, AP-UX-NAV1, TA-CUX1, AP-10-S1.

Kein Default-/Primary-/Preferred-/Chosen-Pass, keine Default-Citizenship, keine Passnummern/Scans/MRZ/Biometrie/DOB/Health-Daten im aktuellen Kernmodell.

## 8. PrivacyBee / Legal

PrivacyBee AG / `privacybee.io` bleibt Product-Owner-binding. Jetnity-Activation bis echte erreichbare `jetnity.com` Production geparkt.

Realer Gap: Register verlinkt `/privacy`, aber `/privacy` und `/terms` fehlen; `CookieConsent.tsx` ist unmounted/stale. Keine Legal-Copy erfinden und nicht still mounten.

## 9. Provider / Commercial Truth

Keine automatische Live-Aktivierung, keine Secrets/paid calls/Writer-Öffnung und keine option-spezifische Official Requirements Truth ohne echten Provider-Nachweis.

Strategisch sinnvoll bleibt Requirements / Travel Readiness Provider Groundwork, aber erst nach frischem Precheck und unter bestehenden Gates.

## 10. FIRST NEXT ACTION

Der neue Chat/Technical Lead muss zuerst:

1. `JETNITY_START_HERE.md` lesen;
2. den Post-Cleanup-Checkpoint vollständig lesen;
3. finalen `main`, Continuity-PR, CI/Vercel und Ruleset live verifizieren;
4. offene PRs/Issues/Branches und Agentenstatus live klassifizieren;
5. bei relevantem Scope Supabase live prüfen;
6. Docs-vs-Live-Widersprüche melden;
7. erst dann 1–3 bounded nächste Kandidaten empfehlen.

Kein Folgeslice ist automatisch freigegeben. **Live-Evidence gewinnt immer.**