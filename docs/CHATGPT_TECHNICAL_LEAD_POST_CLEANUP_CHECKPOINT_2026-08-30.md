# Jetnity – Technical Lead Post-Cleanup Checkpoint – 2026-08-30

Stand: 30. August 2026  
Status: **KANONISCHER POST-CLEANUP CHAT-ÜBERGANG / LIVE-EVIDENCE GEWINNT IMMER**

> Dieser Checkpoint supersediert zeitgebundene Aussagen in älteren Übergaben, soweit sie dem hier dokumentierten und live verifizierten Stand widersprechen. Er ersetzt niemals einen frischen Live-Precheck.

## 1. Pre-Continuity-Anker

Bei Erstellung dieses Checkpoints:

`main@0f7d80fa48d958a8708af982806b99966289b2bd`

Dieser SHA enthält den letzten mechanischen Repository-Cleanup.

- Issue #282: **CLOSED / completed**
- PR #283: **MERGED**
- final geprüfter Cleanup-Head: `204511f552d58e246cd08fd8b724eb98edd4dc49`
- PR CI #1398: **SUCCESS**
- Vercel Preview: **SUCCESS**
- Cleanup merge: `0f7d80fa48d958a8708af982806b99966289b2bd`
- Post-Merge CI #1399 / Run `33334863504`: **SUCCESS**
- Post-Merge Vercel: **SUCCESS**

Der docs-only Continuity-PR aus Issue #284 bewegt `main` danach weiter. Finalen `main` im neuen Chat live lesen.

## 2. Mechanischer Legacy-Cleanup – jetzt abgeschlossen

Die drei HIGH-confidence `DELETE-CANDIDATE`-Gruppen aus dem Core Repository Hygiene Audit sind umgesetzt:

### D-01 – Supabase CLI temp metadata

Aus dem aktuellen Tree entfernt/untracked:

- `supabase/.temp/cli-latest`
- `supabase/.temp/gotrue-version`
- `supabase/.temp/pooler-url`
- `supabase/.temp/postgres-version`
- `supabase/.temp/rest-version`

`.gitignore` ignoriert `supabase/.temp/` weiterhin, damit lokale CLI-Artefakte künftig nicht erneut getrackt werden.

### D-02 – Supabase branch marker

Aus dem aktuellen Tree entfernt/untracked:

- `supabase/.branches/_current_branch`

`.gitignore` ignoriert `supabase/.branches/` weiterhin.

### D-03 – unreferenziertes Asset

Entfernt:

- `public/images/prague.jpg`

Repository-Code-Suche hatte keine aktuelle Referenz darauf gefunden.

### Evidence Lock

`lib/project-sanitation/closure-invariants.test.ts` wurde im selben Slice angepasst. Der Test verlangt jetzt ausdrücklich, dass D-01/D-02/D-03 **abwesend bleiben**, während bewusst offene/gated Funde weiterhin sichtbar bleiben.

Kein History Rewrite, keine Migration gelöscht, kein Supabase-/Production-Write.

## 3. Was damit unter „alte Jetnity-Sachen bereinigt“ gemeint ist

Die alte aktive Jetnity-/Creator-/MediaStudio-Welt ist nicht mehr Teil der aktuellen Runtime:

- Creator Hub / MediaStudio / Feed / Blog / Render Runtime: entfernt
- alte GitHub-Repositories `jetnity-bets` und `jetnity-travel`: gelöscht
- alter eigenständiger Supabase `jetnity-bets`: gelöscht
- zehn alte leere Storage-Buckets: entfernt
- 24 orphaned Storage-Policies: entfernt
- `creator-media` Source-Bucket: nach Backup/Restore-Proof entfernt
- 165 sicher gemergte alte Branch-Refs: entfernt
- P1 Migration-History `20260829140000_trip_item_commercial_provenance`: repariert und replay-verifiziert
- D-01/D-02/D-03 mechanische Repo-Reste: jetzt ebenfalls entfernt

Bewusst retained und **nicht** als „alter aktiver Code“ zu verstehen:

- Supabase-Migrationen und historische Evidence
- private `jetnity-legacy-recovery`
- ungemergte/unique-evidence Branches bis separate Evidence-Entscheidung
- alte dated Audit-/Task-/Handoff-Pakete

## 4. Noch vorhandene UPDATE-CANDIDATEs

Diese sind **kein alter aktiver Jetnity-Systemteil** und kein Launch-Blocker, aber können später in einem separaten kleinen Config-/Copy-Hygiene-Slice bereinigt werden:

- zwei ungenutzte V1 Image-Hosts in `next.config.js`
- `components.json` Alias `@/hooks` ohne vorhandenes `hooks/`
- stale `zod` Exception in `scripts/pakete.mjs`
- kosmetische `Mega Pro` Copy in `check-jetnity-setup.ts`
- ungenutzter Tailwind `content/**` Glob
- optionale Docs-/Kommentar-Hygiene

Nicht automatisch mit Produktarbeit vermischen.

## 5. Bewusst gated / nicht mechanisch ändern

- `/privacy` / `/terms` / `CookieConsent.tsx` → Legal / Product Owner
- `creator` RBAC / `inhalte-moderieren` Retirement → Auth / Product Owner, falls vorgeschlagen
- `jetnity-legacy-recovery` → Production/Data-Gate
- unique-evidence Branches → separate Branch-Hygiene
- Provider Live / Secrets / paid calls / Commercial Write → besondere Gates

## 6. GitHub Governance

`main` bleibt geschützt über:

- Ruleset `Jetnity main protection`
- ID `21875372`
- Enforcement `active`
- PR-Pflicht
- Branch up to date
- Conversation resolution
- Required Checks:
  - `Typecheck, Lint & Build`
  - `Auth-Konfiguration gegen config.toml`
  - `Vercel`
- nur Merge-Commit
- Force Push / Branch deletion blockiert
- Bypass list leer

Bekannter Connectorfehler: Draft→Ready kann wegen `Repository.fullDatabaseId` scheitern. Das ist **kein Jetnity-Codeproblem**. Ruleset niemals dafür lockern. Falls nötig: gleicher unveränderter TL-PASS-SHA → nicht-draft Recovery PR → frische Gates → Expected-Head-Lock-Merge.

## 7. Supabase Current Truth

Beim letzten Transition-Precheck:

- Production `qscbgcdmivbbnzrcyegn`: ACTIVE_HEALTHY
- Development `develop` / `yfvbxvijcorffwxbxahl`: ACTIVE_HEALTHY
- alter eigenständiger Supabase `jetnity-bets`: gelöscht
- P1 Migration-History repariert via PR #251 / Merge `5ee8c7017180747bb29112f1c5a2cf3419fd062d`
- `creator-media`: entfernt
- `jetnity-legacy-recovery`: privat, 1 Objekt / 3,030,830 Bytes, bewusst retained
- Production Edge Functions nach Cleanup: 0

Vor DB-/Security-/Storage-Arbeit live neu prüfen.

## 8. Produkt-/Traveller-Nordstern

> **Jetnity = Travel Operating System für die konkrete Reise.**

Pfeiler: **Planen / Entscheiden / Reisebereit sein.**

Leitfrage:

> **„Macht das Jetnity einzigartiger oder nur größer?“**

Traveller Truth:

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Dual Authority:

> **Account Registry = wiederverwendbare aktuelle Traveller-Fakten. Trip Snapshot = einzige Current Truth für eine konkrete Reise.**

Kein Default-/Primary-/Preferred-/Chosen-Pass. Keine Default-Citizenship. Keine Passnummern, Scans, MRZ, Biometrie, DOB oder Health-Daten im aktuellen Kernmodell.

AP-5, AP-7, TA-DL1, AP-UX-NAV1, TA-CUX1 und AP-10-S1 sind bereits integriert und nicht neu zu bauen.

## 9. Aktive Arbeit / Agenten

Nach diesem Übergang:

- kein Produkt-/Runtime-Slice automatisch aktiv
- kein Cursor-Implementierungsagent automatisch aktiv
- Core-Hygiene-Agent ist completed/stopped

Der nächste Chat muss zuerst einen frischen Binding Slice Precheck durchführen.

## 10. Nächste sinnvolle Kandidaten – nicht automatisch freigegeben

1. optional kleiner **Config-/Copy-Hygiene-Slice** für die verbleibenden UPDATE-CANDIDATEs;
2. danach nicht in Cleanup verharren, sondern zurück zum Produktkern – insbesondere **Requirements / Travel Readiness Provider Groundwork** unter den bestehenden Official-Truth-/Provider-Gates;
3. Legal Gap `/privacy` / `/terms` separat Product-Owner-/Legal-gated.

Der neue TL entscheidet nach Live-Precheck, welcher Kandidat tatsächlich als nächster bounded Slice sinnvoll ist.

## 11. Universal-Prompt

Der vom Product Owner verwendete Universal-Prompt bleibt der bevorzugte Startprompt für neue Chats. Er ist bewusst nicht an einen festen SHA gebunden und verlangt Live-Rekonstruktion.

Wichtig ist nur: `JETNITY_START_HERE.md` und der dort genannte **aktuellste Checkpoint** müssen vollständig gelesen werden.

## 12. FIRST NEXT ACTION im neuen Chat

1. finalen `main` live lesen;
2. prüfen, dass Issue #284 / Continuity-PR gemergt und post-merge grün ist;
3. offene PRs/Issues/Branches und Agentenstatus live klassifizieren;
4. Ruleset/Required Checks live bestätigen;
5. relevante Supabase-Wahrheit live prüfen, falls nächster Scope DB/Security/Storage betrifft;
6. Abweichungen Docs vs Live-Evidence benennen;
7. erst danach 1–3 bounded nächste Kandidaten empfehlen;
8. keinen Agenten/Runtime-Slice vorher automatisch starten.

**Live-Evidence gewinnt immer.**