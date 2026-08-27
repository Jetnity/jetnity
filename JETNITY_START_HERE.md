# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 27. August 2026  
Status: **kanonischer erster Einstieg. Live-Evidence gewinnt immer. PR #97 ist integriert; die frische Technical-Lead-Live-Rekonstruktion ist auf `main`. Der verbleibende operative P1 ist die fehlende Admin-AAL2-Datenebene in Production. TW-7 ist nach live geprüftem Hub-Gate der nächste fachlich zulässige Produktslice, wird aber erst nach Entscheidung/Closure dieses P1 gestartet. Kein Production-AAL2-Apply ist autorisiert.**

> **Do not blindly trust this file — live verify `origin/main`, PRs, CI, Vercel, Supabase and Branch Protection first.**

Aktuelle operative Evidence:

- `docs/CHATGPT_TL_LIVE_RECONSTRUCTION_CHECKPOINT_2026-08-27.md`
- `docs/QS2_ADMIN_AAL2_PRODUCTION_RECONCILIATION_TASK_2026-08-27.md`
- `JETNITY_HANDOFF.md`
- `docs/ACTIVE_WORK_STATUS.md`
- `docs/CHATGPT_PR94_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-27.md`
- `docs/CHATGPT_TL_POST_PR94_CHECKPOINT_2026-08-27.md`
- `docs/CHATGPT_TL_POST_PR87_CHECKPOINT_2026-08-27.md`
- `docs/CHATGPT_PR91_GATE0B_POST_MERGE_CHECKPOINT_2026-08-27.md`
- `docs/PRODUCTION_GATE_A_EXECUTION_CHECKPOINT_2026-08-27.md`

Die detaillierte vor-PR-#97-Fassung dieser Datei bleibt historische Git-Evidence. Historische Checkpoints und ältere PR-Bodies werden nicht gelöscht und dürfen spätere Live-Evidence nicht überschreiben.

## 1. Pflichtlektüre vor jeder Aktion

Jeder neue Chat, Technical Lead oder Coding Agent liest mindestens in dieser Reihenfolge:

1. `JETNITY_START_HERE.md`
2. `docs/TECHNICAL_LEAD_MERGE_AUTONOMY_SUPERSESSION_2026-08-26.md`
3. `docs/JETNITY_ENGINEERING_EXCELLENCE_STANDARD.md`
4. `docs/JETNITY_PRODUCT_POSITIONING_STANDARD.md`
5. `docs/JETNITY_GUARDIAN_AND_WHAT_IF_SIMULATOR_STANDARD.md`
6. `docs/JETNITY_MARKETING_GROWTH_STANDARD.md`
7. `docs/ADMIN_MARKETING_GROWTH_CONTROL_CENTER_STANDARD.md`
8. `docs/JETNITY_AI_SEARCH_DISCOVERABILITY_STANDARD.md`
9. `docs/JETNITY_AGENT_WORKSTREAM_GOVERNANCE.md`
10. `docs/JETNITY_FUTURE_NATIVE_APP_AND_TECHNICAL_LEAD_STANDARD.md`
11. `docs/JETNITY_BINDING_BUILD_ORDER.md`
12. `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`
13. `JETNITY_HANDOFF.md`
14. `docs/ACTIVE_WORK_STATUS.md`
15. `docs/CHATGPT_TL_LIVE_RECONSTRUCTION_CHECKPOINT_2026-08-27.md`
16. `docs/QS2_ADMIN_AAL2_PRODUCTION_RECONCILIATION_TASK_2026-08-27.md`
17. `docs/CHATGPT_PR94_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-27.md`
18. `docs/CHATGPT_TL_POST_PR94_CHECKPOINT_2026-08-27.md`
19. `docs/CHATGPT_TL_POST_PR87_CHECKPOINT_2026-08-27.md`
20. `docs/CHATGPT_PR91_GATE0B_POST_MERGE_CHECKPOINT_2026-08-27.md`
21. `docs/PRODUCTION_GATE_A_EXECUTION_CHECKPOINT_2026-08-27.md`
22. den aktuell relevanten Slice-Task/Status/Handoff sowie ADRs/Checkpoints.

`docs/TRIP_WORKSPACE_TW6_GATE_B_PREP_STATUS.md` bleibt historische Gate-B-Evidence; seine früheren „nicht angewendet“-Aussagen sind durch Live-Evidence superseded.

## 2. Verbindliche Betriebsregeln

1. Rolle: ChatGPT ist übergeordneter Jetnity **Technical Lead / Hauptentwickler**.
2. **Live-Evidence gewinnt** über Prompt, Docs, Chat, Screenshot, SHA-Erinnerung und Agentenbericht.
3. Feature-/Audit-Autor ersetzt nie den unabhängigen Finalreview.
4. Autonomes Ready/Merge ist für normale scope-treue PRs erlaubt, aber nur nach Exact-Head-PASS. **Blind mergen ist verboten.**
5. Besondere Product-Owner-Gates bleiben zwingend.
6. Keine stillen Shared-Contract-/Produkt-/Truth-Änderungen.
7. Kein automatischer Folgeslice.
8. Materiale Arbeit wird im Repository persistiert.
9. Produktmaxime: **Eine Reise, eine Oberfläche. Komplexität intern, Klarheit für den Nutzer.**
10. Native-Maxime: **one product, one truth, multiple clients.**

## 3. Vor jeder technischen Entscheidung live verifizieren

Mindestens:

- `origin/main` SHA / aktueller Commit;
- offene PRs/Drafts und operativ relevante Branches;
- Ahead/Behind, Merge-Base, Mergeability;
- tatsächlichen Diff und changed files;
- Review-Threads;
- Exact-Head GitHub Actions;
- Exact-Head Vercel Preview bzw. Production;
- relevante Supabase-Projekte, Migration-History, RLS/Ownership/Auth-Grenzen;
- Production vs. Development;
- Branch Protection / Rulesets;
- Parallelkollisionen / Shared Contracts;
- P0/P1/P2/P3;
- welche alten PRs/Dokumente nur historische Evidence sind.

## 4. Aktuell verifizierte Integrationsbaseline

Nach PR #97:

- `origin/main`: `4362502bf23c1c54f721af48c0f7bdd6fcbdee3b`
- Commit: `Merge PR #97: TL live reconstruction + AAL2 production gate`
- Post-Merge GitHub Actions Run `33083120148`: **SUCCESS** auf exakt diesem SHA
- Post-Merge Vercel Production `dpl_BDLvwuKCfxYmrTSSb2pRchKZ7JzT`: **READY** auf exakt diesem SHA
- `main` Branch Protection: weiterhin **nicht aktiviert** (`protected=false`)
- PR #97: integriert/geschlossen
- die alten offenen Drafts #88/#52/#50/#40/#39/#28 bleiben historische bzw. non-destructive Evidence; keinen davon blind fortsetzen oder mergen.

Dieser SHA ist keine ewige Wahrheit. Nach jedem Merge wieder live prüfen.

## 5. Supabase-Live-Grenzen

Production:

- `qscbgcdmivbbnzrcyegn`
- `ACTIVE_HEALTHY`

Development:

- `yfvbxvijcorffwxbxahl`
- `ACTIVE_HEALTHY`

Separates Top-Level-Projekt:

- `jrixsujkzvlvglvcmtia` / `jetnity-bets`
- nicht automatisch verändern/decommissionen.

### Gate B

Production enthält live bereits:

`20260826220000 → 20260826230000 → 20260826240000 → 20260827010000`

Gate B ist angewendet und semantisch verifiziert. **Kein Re-Apply.**

## 6. Aktueller P1 – Admin AAL2 Production Data Plane

Der Application-Guard verlangt AAL2. Production-DB-Capabilities tun das live noch nicht.

Live Production:

- `public.aktuelles_admin_aal2()` fehlt;
- `darf_betrieb_lesen()` prüft nur Mindestrolle `moderator`;
- `darf_betrieb_eingreifen()` nur `operator`;
- `darf_konten_verwalten()` nur `moderator`;
- `darf_inhalte_moderieren()` nur `moderator`;
- `darf_konfiguration_verwalten()` nur `admin`;
- sensitive RLS-Policies und mehrere authenticated-executable `SECURITY DEFINER`-Admin-RPCs hängen an diesen Capabilities.

Folge: Eine bereits privilegierte AAL1-Sitzung kann die Application-AAL2-Grenze über direkte PostgREST/RPC-Pfade umgehen.

**Finding:** `P1-AAL2-PROD-01`.

Development besitzt den gewünschten Vertrag bereits: Rolle **UND** aktueller signierter JWT-Claim `aal='aal2'`.

### Migrations-History

- Repo-Datei: `20260826090000_admin_aal2_data_plane.sql`
- Development-History: `20260826052735_admin_aal2_data_plane`
- Production: keine AAL2-Version.

`scripts/db/anwenden.ts` entscheidet nach Repo-Dateiversion und ist für Production zusätzlich auf eine alte Phase-3.1-Grenze beschränkt. Deshalb gilt:

> **AAL2 nicht über den generischen `db:anwenden`-Pfad und nicht über blindes `apply_migration` ausrollen.**

Der Vorbereitungsslice muss einen dedizierten, hash-/history-/verify-gebundenen Rollout-Pfad analog zum bewährten Gate-B-Muster entwerfen. Keine historische Migration umbenennen/löschen und keine Migration-History vortäuschen.

**Production-Apply bleibt besonderes Product-Owner-Gate.** Diese Datei autorisiert keinen Write.

## 7. Workstream-Ownership für den P1

Technical-Lead-Entscheidung:

- Autor/Fachowner: `Cursor-Agent: Admin platform audit`
- zusätzliche adversariale Security-Verifikation: `Cursor-Agent: Jetnity quality security audit`
- finaler unabhängiger Integrationsreview: ChatGPT / Technical Lead

`Cursor-Agent: Admin platform audit` erhält zunächst **nur Preparation/Implementation auf Branch/Development**, keinen Production-Apply.

`Cursor-Agent: Jetnity quality security audit` ist kein Feature-Autor und verifiziert den Fix später unabhängig.

## 8. Traveller-Wahrheit

Kanonisch:

> **Ein Reisender → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

- kein Default-Pass;
- keine Default-Citizenship;
- Issuer Country != Citizenship;
- Foundation E vorhanden;
- P1-TA-02 geschlossen;
- P2-TA-06 (`documents[0]` Legacy-Fallback) offen;
- AP-7 Account-Traveller-Registry bleibt Shared-Contract-Gate.

## 9. Provider / Commercial Truth

- S1–S3 integriert;
- S5-A integriert;
- S5-B nicht gestartet;
- keine Provideraktivierung, Secrets oder paid calls;
- TW-8 bleibt gegated.

Keine Fake-Preise, Fake-Verfügbarkeit, Fake-Provider-Health, Fake-Visa-/Entry-/Safety-/Impf- oder Commercial-Truth.

`confirmed`, `unknown`, `stale`, `unavailable`, `error`, `insufficient_context`, `empty` bleiben getrennt.

## 10. Trip Workspace / nächster Produktslice

Integriert:

- TW-1 ✅
- TW-2 ✅
- TW-4 ✅
- TW-3 ✅
- TW-5 ✅
- TW6-A ✅
- TW6-B Runtime / progressive Ziele / Day→Stage Mode Contract ✅
- Visitor Search UX ✅
- `TW6-REST-01` geschlossen ✅

Live TW-7-Gate-Prüfung:

- `/account`, `/reisen`, `/reisen/[tripId]`, Gast und Konto führen bereits auf dieselbe fachliche Reise und denselben `TripWorkspace`;
- TW-7 darf keine zweite Workspace-/Hub-State-Machine bauen;
- realer Rest-Gap: Hub/Reisekarte zeigt trotz Multi-Destination nur `stageCount`, nicht die kanonischen Ziele/Etappen verständlich.

Damit ist **TW-7 – enger read-only Hub-Anschluss** der nächste fachlich zulässige Produktslice **nach** dem P1-AAL2-Gate.

Non-Scope für TW-7:

- kein AP-4/AP-7;
- keine DB/RLS/Auth/Traveller-Shared-Contract-Änderung;
- kein S5-B/TW-8;
- kein Homepage-Relaunch;
- keine neue Workspace-State-Machine.

## 11. Domain / Growth

- `https://jetnity.com` = einzige künftige kanonische/indexierte Public-Hauptdomain;
- `jetnity.ch` = später Entry/Redirect;
- `*.vercel.app` nie kanonisch;
- Indexing fail-closed;
- kein Domain-Cutover/Public Indexing ohne Gate;
- Homepage-Hero/Farbwelt grundsätzlich erhalten;
- dokumentierter Mehrziel-Hero-Wunsch ist **kein** aktueller Startauftrag.

## 12. P0 / P1 / P2 / P3

P0:

- aktuell keiner live bestätigt.

P1:

- `P1-AAL2-PROD-01` – Production Admin AAL2 Data Plane fehlt.

P2 u. a.:

- `main` ohne Branch Protection/Ruleset;
- P2-TA-06 `documents[0]`;
- Multi-Destination-Zielidentität fehlt auf Reisekarten;
- weitere Supabase Security-/Performance-Advisors separat prüfen.

P3/Hygiene:

- viele historische Remote-Branches;
- PR #88 Sanitation-Audit teilweise stale;
- AAL2 Development-/Repo-Migrationsversion driftet.

## 13. Besondere Product-Owner-Gates

Ausdrückliche Freigabe bleibt erforderlich insbesondere für:

- Production-Migrationen / destruktive Production-Datenänderungen;
- große Production-RLS-/Ownership-/Identity-Änderungen;
- fundamentale Auth-/Session-/MFA-/AAL-Änderungen;
- Speicherung sensibler Passport-/MRZ-/Biometrie-Daten;
- sensible externe Datenweitergabe;
- reale Provider-Verträge/Secrets/paid calls;
- echte Payments/Geldbewegung;
- neue laufende Kosten > USD 100/Monat;
- fundamentale Produkt-/Business-/Build-Order-Änderung;
- Public Launch / Domain Cutover / Provider-live / Store-Großaktivierung.

## 14. Exakte Cursor-Anzeigenamen

1. `Trip workspace audit architecture`
2. `Account plattform audit vorbereitung`
3. `Jetnity provider readiness audit`
4. `Admin platform audit`
5. `Jetnity growth discoverability`
6. `Jetnity quality security audit`
7. `Jetnity native app architecture`

Aufträge immer als `Cursor-Agent: <exakter Anzeigename>`.

## 15. Exakter nächster Technical-Lead-Schritt

1. `P1-AAL2-PROD-01` preparation/implementation an `Cursor-Agent: Admin platform audit` vergeben.
2. Kein Production-Write.
3. Agent öffnet eigenen Draft-PR, liefert Exact-Head-Evidence und stoppt.
4. `Cursor-Agent: Jetnity quality security audit` verifiziert adversarial nach Autor-Fix, ohne den Finalreview zu ersetzen.
5. ChatGPT / Technical Lead reviewt unabhängig von Anfang an.
6. Erst wenn ein konkreter, reviewter Production-Rollout-Head vorliegt, Product Owner um **exakte Production-Migrationsfreigabe** bitten.
7. Nach Security-Closure: TW-7 als kleinen Hub-/Multi-Destination-Slice an `Cursor-Agent: Trip workspace audit architecture` vergeben.

**Kein automatischer Production-Apply. Kein TW-7 vor P1-Entscheidung. Kein TW-8/TW-9/AP-7/S5-B/Homepage/Provider-live automatisch starten.**

## 16. Continuity

Kein wesentlicher Fortschritt darf nur im Chat existieren. Neue Chats und Agenten rekonstruieren Live-Evidence selbst. Alte SHAs, Screenshots, PR-Bodies und frühere Checkpoints bleiben historische Evidence, nicht aktuelle Wahrheit.
