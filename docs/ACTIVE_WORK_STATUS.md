# Jetnity – Active Work Status

Stand: 28. August 2026  
Status: **Next 16 Compatibility Prep S1 / Draft-PR #150 / SELF-EXPIRING. STOP für unabhängigen Technical-Lead Exact-Head-Review; kein Ready, kein Merge durch den Autor. Kein S2. Kein Framework-Bump. PR #148 Gate 0 und PR #149 PO-Freigabe sind auf `main @ 2fdf8a18` integriert. Kein AP-7-S2. Live-`main` immer live prüfen.**

> **Do not blindly trust this file — live verify first.**

> Self-expiring für PR #150. Agent-Self-Review ist kein PASS. Jeder neue Push invalidiert Prior-Gates.

## Aktueller Arbeitsblock – Next 16 Compatibility Prep S1

1. **Arbeitsblock / Ziel:** Async Request-API-/Auth-Cookie-Kompatibilität auf der bestehenden Next-14-Runtime. Kein Framework-Bump.
2. **Authoring-Branch / PR:** `feat/next16-s1-request-api-compat-prep-2026-08-28`; Draft-PR #150. Exact Head ist der Commit dieses Stamps; live am PR prüfen.
3. **Status:** **IMPLEMENTIERT / DRAFT / SELF-EXPIRING.** STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD-REVIEW. Kein Ready, kein Merge durch den Autor. Kein S2.
4. **Bereits umgesetzt:** async Supabase-Cookie-Factories + alle Caller; async Guest-Quota-Cookie bei exaktem `jetnity_gast`-Vertrag; Promise-kompatible Page-`params`/`searchParams`/`generateMetadata`; adversariale Tests; lokale Gates grün (`npm ci`, typecheck, lint, 2475 tests, hygiene, production build). Runtime bleibt `next@14.2.32`.
5. **Cursor-Agent:** `Cursor-Agent: Jetnity framework compatibility 1`. Preferred visible title: `Jetnity framework compatibility 1`. Observed run title: `Next 16 API compatibility` (Cloud-Run `https://cursor.com/agents/bc-29e60ee0-acc7-4a21-ad50-34cf078cdc37`). Keine Rename-Fähigkeit; UI nicht als umbenannt behauptet.
6. **Live-`main` / Baseline bei diesem Stamp:** `2fdf8a18ab99d22a3ba75df7bd8451908593714f` – immer live neu prüfen. Merge-Base exakt, 3 ahead / 0 behind vor diesem Stamp.
7. **DB / RLS / Production-Grenze:** keine Migration, kein RLS-/Auth-/AAL-Write, kein Auth-Config-Push, keine Supabase-Mutation, keine Vercel-Projektmutation.
8. **Kosten / Provider / Secrets:** keine.
9. **Bekannte Risiken / Review-Funde:** Auth-/Cookie- und `/planen`-Metadata bleiben P1 bis unabhängiger Preview-Review. `main` `protected=false`. Agent-Self-Review ist kein PASS.
10. **Offene Nutzerentscheidungen / Freigaben:** S1 braucht keine neue PO-Freigabe (PR #149). S2 / Framework-Bump bleibt extra gegatet. Production-Migration / Identity / RLS / Provider-live / Payments / Public Launch bleiben extra gegated. AP-7-S2 startet nicht aus diesem Slice.
11. **Exakter nächster Schritt:** unabhängiger Technical-Lead Exact-Head-Review von Draft-PR #150. Kein Ready. Kein Merge. Kein S2.
12. **Zuerst lesen:** `docs/NEXT16_S1_REQUEST_API_COMPATIBILITY_PREP_TASK_2026-08-28.md`, Status, Handoff, Self-Review, ADR-0190, `docs/JETNITY_CURSOR_VISIBLE_AGENT_NAME_GATE.md`.

## Historischer Arbeitsblock – Next.js Framework Security Upgrade Gate 0

Current classification / Nachtrag, 28. August 2026: **HISTORICAL / INTEGRIERT.** PR #148 ist auf `main @ 2fdf8a18` gemergt. Ältere „REVIEW-FIX / DRAFT / SELF-EXPIRING“-Zeilen sind Pre-Merge-Evidence. Aktueller Ops-Block ist Draft-PR #150.

1. **Arbeitsblock / Ziel:** Read-only Compatibility-/Architekturanalyse. Vergleich `next@15.5.24` vs `next@16.3.3`. Empfehlung plus Stufenplan. Kein Runtime-Upgrade.
2. **Authoring-Branch / PR:** `audit/framework-security-upgrade-gate0-2026-08-28`; PR #148 **MERGED**.
3. **Status:** **INTEGRIERT.** Ältere „REVIEW-FIX / DRAFT / SELF-EXPIRING“-Zeilen sind Pre-Merge-Evidence.
4. **Bereits umgesetzt:** Live-Rekonstruktion auf Baseline `56aff7ff`; Inventur der Jetnity-Call-Sites; Empfehlung **16.x Active LTS live-resolved** (Minimum `16.3.3`); 15.5.24 kein Production-Ziel; TypeScript-Deklaration `^5.0.0` / resolved `5.9.2` inventarisiert; ADR-0189. Review-Fix `5457148091`: keine Ewigkeits-Pins; TL-verifiziertes Vercel Production `dpl_3UZX5HrgwUyyr887ZSKBXMzPKMKM` persistiert; GitHub `6147375507` nur als GitHub-Evidence. Keine Runtime-Datei geändert. Prior Head `c4bfc2bb` Gates gelten nicht für diesen Stamp.
5. **Cursor-Agent:** `Cursor-Agent: Jetnity framework security audit 1`. Preferred visible title: `Jetnity framework security audit 1`. Observed run title: `Jetnity framework security audit` (Cloud-Run `https://cursor.com/agents/bc-1ec3726f-b33b-45d1-aad2-b1bce3c895b9`). Keine Rename-Fähigkeit; UI nicht als umbenannt behauptet.
6. **Live-`main` / Baseline bei diesem Stamp:** `56aff7ff89f7113554c45891e024f9c06f6b0d15` – immer live neu prüfen.
7. **DB / RLS / Production-Grenze:** keine Migration, kein RLS-/Auth-/AAL-Write, kein Auth-Config-Push, keine Supabase-Mutation, keine Vercel-Projektmutation.
8. **Kosten / Provider / Secrets:** keine.
9. **Bekannte Risiken / Review-Funde:** 14.x bleibt Production-Runtime bis zu einem späteren PO-gegaten Upgrade. Cookie-Factories und Middleware/Proxy sind die teuersten Regressionsflächen. 15.x EOL 21 Oct 2026. `main` `protected=false`. Agent-Self-Review ist kein PASS.
10. **Offene Nutzerentscheidungen / Freigaben:** Jeder tatsächliche Framework-Bump braucht ausdrückliche Product-Owner-Wahl (Status Abschnitt 12 / ADR-0189). Production-Migration / Identity / RLS / Provider-live / Payments / Public Launch bleiben extra gegated. AP-7-S2 startet nicht aus diesem Slice.
11. **Exakter nächster Schritt:** nicht erneut öffnen. Gate 0 ist integriert; der aktuelle Ops-Block ist Draft-PR #150.
12. **Zuerst lesen:** `docs/NEXT_FRAMEWORK_SECURITY_UPGRADE_GATE0_TASK_2026-08-28.md`, Status, Handoff, Self-Review, ADR-0189, `docs/JETNITY_CURSOR_VISIBLE_AGENT_NAME_GATE.md`.

## Historischer Arbeitsblock – Node 22 Runtime Consistency

Current classification / Nachtrag, 28. August 2026: **HISTORICAL / INTEGRIERT.** PR #147 ist auf `main @ 56aff7ff` gemergt. Post-Merge GitHub Actions `33204438255` SUCCESS. GitHub Production deployment `6147375507` success (nur GitHub-Evidence). TL-verifizierte Vercel Production: `dpl_3UZX5HrgwUyyr887ZSKBXMzPKMKM` READY, target `production`, exact `56aff7ff`, `aliasError=null`; Build-Log cache skip 24.x→22.x. Nicht erneut als Draft öffnen.

1. **Arbeitsblock / Ziel:** Ein reproduzierbarer Node-Runtime-Vertrag: **Node 22.x** in Repository-Metadaten, `@types/node`, GitHub CI und Vercel. Keine Application-Features.
2. **Authoring-Branch / PR:** `ops/node22-runtime-consistency-2026-08-28`; PR #147 **MERGED**.
3. **Status:** **INTEGRIERT.** Ältere „REVIEW-FIX / DRAFT / SELF-EXPIRING“-Zeilen sind Pre-Merge-Evidence.
4. **Bereits umgesetzt:** `engines.node` = `22.x`; `@types/node@22.20.1`; ADR-0188. CI `22.x`. Vercel-Settings wurden im Slice nicht mutiert.
5. **Cursor-Agent:** `Cursor-Agent: Jetnity runtime consistency 1`. Generation 1 für den Ops-Slice abgeschlossen.
6. **Live-`main` bei Integration:** `56aff7ff89f7113554c45891e024f9c06f6b0d15`.
7. **DB / RLS / Production-Grenze:** keine Migration, keine Supabase-Mutation, keine Vercel-Projektmutation.
8. **Kosten / Provider / Secrets:** keine.
9. **Bekannte Risiken / Review-Funde:** `22.x` ist ein Linien-Pin, kein Patch-Pin. `main` `protected=false`. Framework bleibt `next@14.2.32` – das ist jetzt Gate 0 / PR #148, nicht dieser Block.
10. **Offene Nutzerentscheidungen / Freigaben:** Keine aus diesem Slice. Framework-Upgrade ist separat PO-gegatet.
11. **Exakter nächster Schritt:** nicht erneut öffnen. Aktueller Ops-Block ist Draft-PR #148.
12. **Zuerst lesen:** ADR-0188, `docs/NODE22_RUNTIME_CONSISTENCY_STATUS_2026-08-28.md` als historische Evidence.

## Historischer Arbeitsblock – AP-7-S1 Dual-Authority Domain Contract

Current classification / Nachtrag, 28. August 2026: **HISTORICAL / INTEGRIERT auf der Slice-Baseline.** PR #145 ist auf `main @ 4ec83f36` gemergt. Nicht erneut als Draft öffnen. AP-7-S2 startet nicht automatisch.

1. **Arbeitsblock / Ziel:** Shared Domain-Contract für Dual-Authority: account-owned Registry-Fakten + fail-closed unabhängiger Trip-Snapshot. Keine Persistenz.
2. **Authoring-Branch / PR:** `feat/ap7-s1-dual-authority-domain-contract-2026-08-28`; PR #145 MERGED auf Slice-Baseline `4ec83f36`.
3. **Status:** **INTEGRIERT auf dieser Baseline.** Ältere „REVIEW-FIX / DRAFT / SELF-EXPIRING“-Zeilen sind Pre-Merge-Evidence.
4. **Bereits umgesetzt:** Nested Registry-Typ; explizite trip-owned Materialisierung; Pflicht-`authority`; UUID-Refs; Snapshot-`jetzt`; Snapshot-Identität disjunkt zum gesamten Registry-Universum; 16 adversarial Tests inkl. Compile-Zeit-Grenze und Cross-Entity-/id↔clientRef-Kollisionen. Canonical Continuity self-expiring. ADR-0187.
5. **Cursor-Agent:** `Cursor-Agent: Account plattform audit vorbereitung 12`. Generation 12 für S1 abgeschlossen.
6. **Live-`main` bei Integration:** `4ec83f36426c636443d43692d6875e92e9e3b54a`. Immer live neu prüfen.
7. **DB / RLS / Production-Grenze:** keine Migration, kein RLS-/Auth-/AAL-Write, kein Auth-Config-Push, keine Supabase-Mutation.
8. **Kosten / Provider / Secrets:** keine.
9. **Bekannte Risiken / Review-Funde:** Persistenz darf Materialisierung nicht durch kopierte oder kreuzkollidierende Registry-IDs ersetzen. Guest-Auto-Transfer ≠ Registry-Import; `main` `protected=false`; Agent-Self-Review ist kein PASS.
10. **Offene Nutzerentscheidungen / Freigaben:** Dual-Authority-Architektur ist freigegeben. Production-Migration / Identity / RLS / sensible Dokumentdaten bleiben extra gegated. AP-7-S2 bleibt separat PO-gegatet.
11. **Exakter nächster Schritt:** nicht erneut öffnen. Nächster Account-Slice wäre nur ein separat versionierter, PO-gegateter AP-7-S2-Vorschlag – nicht aus PR #147.
12. **Zuerst lesen:** `docs/AP7_S1_DUAL_AUTHORITY_DOMAIN_CONTRACT_TASK_2026-08-28.md`, Status, Handoff, Self-Review, ADR-0187, Product-Owner-Approval.

## Historischer Arbeitsblock – AP-7 Gate 0 Account-Traveller-Registry Architecture

Current classification / Nachtrag, 28. August 2026: **HISTORICAL / INTEGRIERT.** PR #144 ist MERGED (`bb38aef5`). Dual-Authority danach product-owner-freigegeben. Nicht erneut als Draft öffnen.

1. **Arbeitsblock / Ziel:** Read-only Rekonstruktion und Architektur-Empfehlung für eine mögliche accountweite Traveller Registry. Keine Runtime.
2. **Authoring-Branch / PR:** `audit/ap7-account-traveller-registry-gate0-2026-08-28`; PR #144 MERGED.
3. **Status:** **INTEGRIERT.** Ältere „REVIEW-FIX / DRAFT / SELF-EXPIRING“-Zeilen sind Pre-Merge-Evidence.
4. **Bereits umgesetzt:** Live-Rekonstruktion; Optionsvergleich; Empfehlung Dual-Authority; ADR-0186 als Gate-0-Evidence.
5. **Cursor-Agent:** `Cursor-Agent: Account plattform audit vorbereitung 11`. Generation 11 abgeschlossen.
6. **Live-`main` bei Integration:** `bb38aef589f0cdcea1aaf8ddd87d043d0a9f0f05`.
7. **DB / RLS / Production-Grenze:** keine Migration, kein RLS-/Auth-/AAL-Write.
8. **Kosten / Provider / Secrets:** keine.
9. **Bekannte Risiken / Review-Funde:** historische Gate-0-Risiken; Architekturwahl ist jetzt PO-freigegeben.
10. **Offene Nutzerentscheidungen / Freigaben:** Persistence/RLS bleiben extra gegated.
11. **Exakter nächster Schritt:** nicht erneut öffnen. S1 ist Draft-PR #145 und self-expiring; nach Merge integriert, kein automatisches S2.
12. **Zuerst lesen:** Gate-0-Status, ADR-0186, Product-Owner-Approval, S1-Task.

## Historischer Arbeitsblock – PR #142 Post-Merge Continuity

Current classification / Nachtrag, 28. August 2026: **HISTORICAL.** PR #143 ist MERGED (`1947285c`). Die Dual-State-Klausel ist erfüllt/überholt. Nicht erneut als Draft öffnen.

1. **Arbeitsblock / Ziel:** Docs-only Current-State nach Merge von PR #142, damit kein aktuelles Continuity-Surface PR #142 noch als Draft führt. Kein Produkt-Folgeslice.
2. **Authoring-Branch / PR:** `docs/pr142-post-merge-continuity-2026-08-28`; PR #143. Reviewed-Head mit CHANGES REQUIRED `6e668593c36fc6c84f7a77c80e70afa2f7bdf304` (Kommentar `5454696267`). Live Exact Head ist der Commit dieses Stamps; live an PR #143 prüfen. Nach Merge von #143 ist diese Transportzeile historisch.
3. **Status:** **DOCS-ONLY / SELF-EXPIRING.** Solange #143 offen: DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW. Nach Merge von #143: Continuity integriert; kein offener Produkt-Slice. Jeder neue Push invalidiert Prior-Gates. Kein Ready, kein Merge durch den Autor. Kein Produkt-Folgeslice.
4. **Bereits umgesetzt:** PR #142 ist integriert. Dauerhafter Checkpoint `docs/CHATGPT_PR142_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-28.md`. Handoff / Start Here / dieser Status führen PR #142 als MERGED-Wahrheit samt Post-Merge-Evidence.
5. **Cursor-Agent:** `Cursor-Agent: Jetnity quality security audit 4` – exakt zugewiesener Name. Keine andere Generation. Cursor exponiert in dieser Session keine programmierbare Rename-/Title-Fähigkeit; der UI-Anzeigename wird deshalb nicht als geändert behauptet. Cloud-Run `https://cursor.com/agents/bc-93c2dcb4-c12a-4e80-869e-df21404ea9b0` (Run-Titel bleibt `Pr142 post-merge continuity closure`). Nach Merge von #143 ist Generation 4 für diesen Continuity-Stamp abgeschlossen und nicht für einen Produktslice wiederzuverwenden.
6. **Live-`main` bei diesem Stamp:** `9d4778b81f34e199466e089fe06fb093895f2df1`. Immer live neu prüfen.
7. **DB / RLS / Production-Grenze:** keine Migration, kein RLS-/Auth-/AAL-Write, kein Auth-Config-Push, keine Supabase-Mutation.
8. **Kosten / Provider / Secrets:** keine.
9. **Bekannte Risiken / Review-Funde:** `main` Branch Protection bleibt `protected=false`. Dieser Slice ändert das nicht. Ein Agent-Self-Review ist kein PASS. CHANGES REQUIRED `5454696267` auf `6e668593` werden auf diesem neuen Head adressiert. Ältere Draft-PR-#142-Sätze sind Pre-Merge-Evidence.
10. **Offene Nutzerentscheidungen / Freigaben:** besondere Product-Owner-Gates unverändert: S5-B Runtime/Persistenz, TW-8, AP-7, Provider-live/Secrets/paid calls, Payments, Public Launch, AP-5-P1–P5. AP-5-S3/S4/S5 sind normale Technical-Lead-Gates innerhalb Gate 0, **nicht automatisch gestartet** und **nicht PO-gated**. Kein Ready/Merge durch den Autor.
11. **Exakter nächster Schritt:** **Dual-State.** Solange PR #143 offen/unmerged: unabhängiger Technical-Lead-Exact-Head-Review von #143; kein Ready, kein Merge. Sobald PR #143 gemergt ist: Transport-/Review-Klausel historisch; exakt erster unfertiger Produktschritt = Live-Rekonstruktion + Binding-Build-Order-Auswahl. Kein Produkt-Slice dadurch autorisiert.
12. **Zuerst lesen:** `docs/PR142_POST_MERGE_CONTINUITY_TASK_2026-08-28.md`, `docs/CHATGPT_PR142_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-28.md`, `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md` §9, `docs/JETNITY_UNIVERSAL_NEW_CHAT_RECOVERY_PROMPT.md`, `JETNITY_START_HERE.md`, dieser Status.

## Historischer Arbeitsblock – Technical Lead / Cursor Operating Standard

Live integriert über PR #142. Merge `9d4778b81f34e199466e089fe06fb093895f2df1`. Reviewed Head `507bcb170604b0f680dad7325ab4f32c7c4f2f61`. Technical-Lead PASS `5454570805`. Post-Merge Actions `33186501087` SUCCESS. Post-Merge Vercel Production `dpl_8NN5v8rV27D4MTs9JwDyyLdXqpzo` READY. Generation 3 für die Integration abgeschlossen. Nicht erneut als Draft öffnen.

1. **Arbeitsblock / Ziel:** Docs-only Governance-Integration des Product-Owner-Operating-Standards vom 28. August 2026.
2. **Authoring-Branch / PR:** `docs/technical-lead-cursor-operating-standard-2026-08-28`; PR #142 **MERGED**.
3. **Status:** **INTEGRIERT.** Ältere „REVIEW-FIX / DRAFT“-Zeilen sind Pre-Merge-Evidence.
4. **Bereits umgesetzt:** Operating Standard; exklusive Ready-/Merge-Autorität; Agenten-Namensdisziplin; universeller Recovery-Prompt; Current-State-Regel – kein relevanter Fortschritt nur im Chat; Continuity ist Definition of Done.
5. **Cursor-Agent:** `Cursor-Agent: Jetnity quality security audit 3` – Generation für die Integration abgeschlossen.
6. **Live-`main` bei Integration:** `9d4778b81f34e199466e089fe06fb093895f2df1`.
7. **DB / RLS / Production-Grenze:** keine Migration, kein RLS-/Auth-/AAL-Write, kein Auth-Config-Push, keine Supabase-Mutation.
8. **Kosten / Provider / Secrets:** keine.
9. **Bekannte Risiken / Review-Funde:** `main` Branch Protection bleibt `protected=false`. Historische CHANGES REQUIRED `5454244491` auf `0bce940c` sind durch die Review-Fix-Kette geschlossen.
10. **Offene Nutzerentscheidungen / Freigaben:** besondere Product-Owner-Gates unverändert. Kein Produkt-Folgeslice aus #142.
11. **Exakter nächster Schritt:** nicht erneut öffnen. Continuity-Transport war PR #143; nach dessen Merge nicht erneut als Draft öffnen.
12. **Zuerst lesen:** `docs/CHATGPT_PR142_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-28.md`, `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`, `docs/JETNITY_UNIVERSAL_NEW_CHAT_RECOVERY_PROMPT.md`.

## Historischer Arbeitsblock – AP-5-S2 Post-Merge Continuity

1. **Arbeitsblock / Ziel:** Docs-only Continuity nach Merge von PR #137, damit `main` S2 nicht weiter als Draft führt.
2. **Authoring-Branch / PR:** `cursor/ap5-s2-integrated-82e4`; Draft-PR #138.
3. **Status:** **DOCS-ONLY / DRAFT / REVIEW-FIX FÜR 5051188747.** Issue #136 ist CLOSED / completed. Runtime ist bereits integriert. Kein Ready, kein Merge durch den Autor. Kein S3–S5.
4. **Bereits umgesetzt:** S2-Runtime über PR #137. Dieser Stamp schreibt nur Continuity.
5. **Cursor-Agent:** `Account plattform audit vorbereitung 10` – schließt S2; nicht für eine neue Runtime-Einheit wiederverwenden.
6. **Live-`main` bei diesem Stamp:** `f11a17533c56f5746ca9ef56e08c3e4a21a5a3c5` – immer live neu prüfen.
7. **DB / RLS / Production-Grenze:** keine Migration, kein RLS-/Auth-/AAL-Write, kein Auth-Config-Push.
8. **Kosten / Provider / Secrets:** keine.
9. **Bekannte Residuals:** Recovery-UI bleibt für signed-in Sessions mehrdeutig; Login-MFA abbrechbar; Sessionliste ungebaut; `main` `protected=false`.
10. **Offene Nutzerentscheidungen / Freigaben:** S3–S5 nicht automatisch starten. Issue #136 ist CLOSED / completed.
11. **Exakter nächster Schritt:** unabhängiger Technical-Lead-Re-Review dieses Continuity-Stamps nach Review `5051188747`; **kein S3–S5 aus diesem File.**
12. **Zuerst lesen:** `docs/CHATGPT_PR137_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-28.md`, S2-Status, Gate-0-Status, ADR-0182.

## Historischer Arbeitsblock – AP-5-S2 eingeloggte Passwortänderung

Live integriert über PR #137. Merge `f11a1753`. Reviewed Head `e4cb805a`. Technical-Lead PASS `5051115258`. Issue #136 CLOSED / completed. Generation 10 für Runtime abgeschlossen. Nicht erneut öffnen. Gate 0 / ADR-0182 bleibt die Authority.

1. **Arbeitsblock / Ziel:** Issue #136 / AP-5-S2 – signed-in Passwortänderung über `reauthenticate()` → Nonce → `updateUser({ password, nonce })`.
2. **Authoring-Branch / PR:** `cursor/ap5-s2-password-reauth-82e4`; PR #137 MERGED.
3. **Status:** **INTEGRIERT.** Ältere „REVIEW-FIX / DRAFT“-Zeilen sind Pre-Merge-Evidence.
4. **Bereits umgesetzt:** Zustandsmodell; Security-Passwortkarte; kanonische Richtlinie/HIBP; getrennte Recovery-Authority; Truth-State-Fix für `getUser()`-Netz/5xx; S2-Tests; Inventory-Aktualisierung.
5. **Cursor-Agent:** `Account plattform audit vorbereitung 10` – Generation für Runtime abgeschlossen.
6. **Live-`main` bei Authoring:** `0256905cee3e6705156ce642839983daf8b0709a` – historische Start-Baseline.
7. **DB / RLS / Production-Grenze:** keine Migration, kein RLS-/Auth-/AAL-Write, kein Auth-Config-Push.
8. **Kosten / Provider / Secrets:** keine.
9. **Bekannte Residuals:** Recovery-UI bleibt für signed-in Sessions mehrdeutig; Login-MFA abbrechbar; Sessionliste ungebaut; `main` `protected=false`.
10. **Offene Nutzerentscheidungen / Freigaben:** S2 brauchte keines. S3–S5 brauchen eigene Tasks; P1–P5 brauchen Product Owner.
11. **Exakter nächster Schritt:** nicht erneut öffnen. Continuity-Stamp und Issue-Close sind der operative Rest.
12. **Zuerst lesen:** `docs/CHATGPT_PR137_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-28.md`, `docs/AP5_S2_PASSWORD_REAUTH_STATUS_2026-08-28.md`, Gate-0-Status, ADR-0182.

## Historischer Arbeitsblock – Project Sanitation Closure

Live integriert über PR #135. Issue #134 CLOSED / completed. Retention-Plan, kein Cleanup. Nicht erneut öffnen. ADR-0184 bleibt die Sanitation-Entscheidung.

Ältere „REVIEW-FIX / DRAFT“-Zeilen sind Pre-Merge-Evidence. Live-`main` bei Integration: `0256905c`.

## Historischer Arbeitsblock – AP-5-S1 Security-UI Truth

Live integriert über PR #133. Issue #132 CLOSED / completed. Agent 9 abgeschlossen. Nicht erneut öffnen. ADR-0183 bleibt die S1-Entscheidung.

1. **Arbeitsblock / Ziel:** Issue #132 / AP-5-S1 – ehrliche Security-UI-Zustände und Fehlerhygiene ohne Auth-Architektur.
2. **Authoring-Branch / PR:** `cursor/ap5-s1-security-ui-8b13`; PR #133 MERGED.
3. **Status:** **INTEGRIERT.** Ältere „REVIEW-FIX / DRAFT“-Zeilen sind Pre-Merge-Evidence.
4. **Bereits umgesetzt:** Lage-Ableitung; Passkey-Server-Truth; sichere Fehlercopy; TOTP-UI ohne Faktor-ID als Gerät; ADR-0183; fokussierte Tests.
5. **Cursor-Agent:** `Account plattform audit vorbereitung 9` – Generation abgeschlossen.
6. **Live-`main` bei Authoring:** `eaa03ad71509d281990e0d34ca359e0750eb9591` – historische Start-Baseline.
7. **DB / RLS / Production-Grenze:** keine Migration, kein RLS-/Auth-/AAL-Write.
8. **Kosten / Provider / Secrets:** keine.
9. **Bekannte Residuals:** Sessionliste bleibt ungebaut/`unsupported`; heutiges Abmelden ist bereits `global`; Login-MFA abbrechbar; D0-P1-03 Legal-404; C2 PO-gated; `main` Branch Protection `protected=false`.
10. **Offene Nutzerentscheidungen / Freigaben:** S1 brauchte keines. AP-5-P1–P5 brauchen Product-Owner, bevor sie gebaut werden.
11. **Exakter nächster Schritt:** nicht erneut öffnen. S2 ist separat über PR #137 integriert.
12. **Zuerst lesen:** `docs/AP5_S1_SECURITY_UI_TRUTH_STATUS_2026-08-28.md`, Handoff, ADR-0183, Gate-0-Status, ADR-0182.

Historischer abgeschlossener Block AP-5 Gate 0 bleibt integriert: PR #129 MERGED, Issue #128 CLOSED / completed. Nicht erneut öffnen. P2-TA-04 C1 bleibt integriert: PR #126 MERGED, Issue #122 CLOSED / completed. P2-TA-03 bleibt integriert: PR #117 MERGED, Issue #116 CLOSED / completed. P2-TA-06 bleibt integriert: PR #113 MERGED, Issue #112 CLOSED / completed.

## 0. Live-Integrationsbaseline

Live-`main` immer live prüfen. Keine bewegliche Exact-Head-SHA als kanonische Live-Wahrheit.

Post-Merge-Evidence von PR #142:

- Reviewed Head: `507bcb170604b0f680dad7325ab4f32c7c4f2f61`
- Independent Technical-Lead PASS: Issue-Kommentar `5454570805`
- Merge-Commit / aktuelles `main`: `9d4778b81f34e199466e089fe06fb093895f2df1`
- Post-Merge GitHub Actions: Run `33186501087` SUCCESS
- Post-Merge Vercel Production: `dpl_8NN5v8rV27D4MTs9JwDyyLdXqpzo` READY
- Checkpoint: `docs/CHATGPT_PR142_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-28.md`

Post-Merge-Evidence von PR #113:

- Reviewed Head: `928215a2c6c4d4ce914f12ba1bd88dbcab8f548b`
- Independent Technical-Lead PASS: Review `5046006374`
- Merge-Commit: `286d26fec2eed87e1227ebb2cf7327f50e8f5f1a`
- Post-Merge GitHub Actions: Run `33120743073` SUCCESS
- Post-Merge Vercel Production: `dpl_7V8WetsqrXC8m4CQcUZoQb9hXn1e` READY
- Issue #112: CLOSED / completed

Historische Start-Baseline von TW7-A (Issue #103 / PR #106), ausdrücklich nicht aktueller Live-Stand:

- `963186f4ec75501efd253a287131f464a5fd0fdb` — `Merge PR #102: Admin AAL2 production apply gate closure`

PR #102 bleibt integriert. Production `20260827170000_admin_aal2_data_plane_alignment` ist angewendet und verifiziert, exakt einmal. `aktuelles_admin_aal2()` ist live. Admin-Capabilities verlangen Rolle **UND** aktuelles AAL2. Kein zweiter Apply.

Vorherige dokumentierte Baseline (historisch):

- `beaef64a151adceb8f5bc759f58ae9ad13cecc51` — `Merge PR #98: Admin AAL2 production data-plane alignment`
- GitHub Actions auf exakt diesem SHA: Run `33087558642` SUCCESS
- GitHub Production-Deployment auf exakt diesem SHA: `6125680097` success

PR-#97-Docs-Merge bleibt:

- `4362502bf23c1c54f721af48c0f7bdd6fcbdee3b` — `Merge PR #97: TL live reconstruction + AAL2 production gate`

PR-#96-Continuity-Merge bleibt:

- `45be14b1077589953d5dbf21f569311c9a4b59f7` — `Merge PR #96: post-PR94 continuity`

PR-#94-Produktmerge bleibt:

- `819715b1567417893d894b7b110eff1a2ab6cded` — `Merge PR #94: Visitor Search UX`

Verifizierte PR-#94-Linie:

- Base / Merge-Base vor Merge: `b76148e533fb0758c0197d0e0252624bb869cdb5`
- PR-#94 Exact Head: `8da869fd2756f3c1514de6d33678c8c7abfad1c4`
- Independent Technical-Lead PASS review: `5040199350`
- Exact-Head GitHub Actions Run `33066516282`: SUCCESS
- Exact-Head Vercel Preview `CBuVobvymHT9m7A4uUKmb2exU4PU`: SUCCESS
- Merge-Commit auf `main`: `819715b1567417893d894b7b110eff1a2ab6cded`
- Post-Merge `main` GitHub Actions Run `33067498607`: SUCCESS
- Post-Merge Vercel `GrD4MaYqtnR9UL619gVnKx9HSUmH`: SUCCESS auf exakt `819715b1567417893d894b7b110eff1a2ab6cded`
- GitHub Production deployment `6121770601`: SUCCESS auf demselben SHA

Post-Merge-Checkpoints:

- `docs/CHATGPT_PR94_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-27.md` (PR #95, bereits auf `main`)
- `docs/CHATGPT_TL_POST_PR94_CHECKPOINT_2026-08-27.md` (PR-#94-Continuity, mit PR #96 integriert/geschlossen)

PR #91 bleibt Teil der Vorgeschichte (Merge `a2e46f38dcfbbea286e37960c7993adbbd06136a`). Checkpoint: `docs/CHATGPT_PR91_GATE0B_POST_MERGE_CHECKPOINT_2026-08-27.md`. Aussagen dort, Production Gate B sei unangewendet oder PR #87 bleibe Draft, sind **historische Evidence** vor den späteren Gate-B- und Runtime-Merges.

Production Public Runtime bleibt bezüglich D0 unverändert:

- `robots` / `googlebot` = `noindex, nofollow`;
- Canonical `https://jetnity.com`;
- `/planen` ebenfalls `noindex, nofollow`;
- `robots.txt` deny-all;
- kein Domain-Cutover, kein Public Indexing, kein Redirect-Gate.

`main` Branch Protection ist live **nicht aktiviert** (`protected=false`) und bleibt ein Governance-Risiko.

## 1. Aktive Technical-Lead-Governance

> **Autonom mergen ist erlaubt – blind mergen ist verboten.**

> **Nur ChatGPT / Technical Lead darf Ready setzen oder mergen. Cursor-Agenten tun das niemals.**

Current Truth: `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`.

Vor Ready/Merge zwingend: Live-`main`, Diff, Tests und Testannahmen, Security/Privacy/Truth/Shared Contracts, Exact-Head Actions/Vercel, relevante Supabase-Grenzen, Review-Threads und Parallelität prüfen. Bei Fehlern zuerst korrigieren und neu gaten. Der Technical Lead merged nur, wenn er nach unabhängigem Exact-Head-Review absolut überzeugt ist, dass dies die beste verantwortbare Entscheidung ist.

Besondere Product-Owner-Gates bleiben unverändert, insbesondere für Production-Migrationen, große Auth/MFA/AAL-/RLS-/Identity-Änderungen, sensitive Dokumentdaten, reale Provider/Secrets/paid calls, Payments, > USD 100/Monat und Public Launch / Provider-Live / Store-Aktivierung.

Die Product-Owner-Freigabe vom 27. August 2026 galt **nur** für Production Gate A:

1. `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis`
2. danach `20260824180000_trip_items_flug_handelsfelder_guard`

Diese Freigabe galt ausdrücklich **nicht** für TW6-B, AAL2, Direction A oder andere späteren Production-Migrationen. PR #94 brauchte kein besonderes Product-Owner-Gate.

## 2. D0 / Growth

D0-1, D0-2 und **P1-D0-LIVE-01** sind auf `main`.

Domain-Wahrheit:

- `https://jetnity.com` = einzige zukünftige kanonische/indexierte Public-Hauptdomain;
- `jetnity.ch` = Schweizer Entry-/Redirect-Domain, keine zweite indexierte Plattform;
- HTML-robots folgt `darfIndexieren` fail-closed;
- Public Canonical / metadataBase / OG / JSON-LD verwenden `https://jetnity.com`;
- `*.vercel.app` ist niemals kanonische Jetnity-Produktdomain;
- `/planen` emittiert robots explizit;
- Indexing nur bei explizitem `NEXT_PUBLIC_ALLOW_INDEXING=true` und exakter `.com`-Origin;
- Default bleibt deny/false;
- kein Domain-Cutover, kein Public-Launch, kein Redirect, kein DNS.

Offen: **D0-P1-03** Legal-404 (`/privacy`, `/terms` live 404); D0-P2-04 hreflang; D0-P2-05 JSON-LD; G0-Reste.

`Jetnity growth discoverability` bleibt STOPP. Kein D1/G1 automatisch starten.

## 3. Trip Workspace

Integriert:

- TW-1 ✅
- TW-2 ✅
- TW-4 ✅
- TW-3 ✅
- TW-5 ✅
- TW-6 Dependency-Audit ✅
- TW6-A Create-Entry ✅
- TW6-B Gate 0 / Provenance via PR #89 ✅
- TW6-B Gate 0B / Zero-Stage Production Rollout Provenance via PR #91 ✅
- TW6-B Runtime + Day→Stage Mode Contract via PR #87 ✅ (`TW6-REST-01` geschlossen)
- Visitor Search UX via PR #94 ✅

**Gate 0 / Gate 0B ≠ TW6-B Runtime-Merge und ≠ Production Gate B.**

Der Vier-Datei-Vertrag ist der **bereits angewendete historische Production-Gate-B-Rollout**, nicht ein offener späterer Apply:

`20260826220000 → 20260826230000 → 20260826240000 → 20260827010000`

Kein Re-Apply ist pending. Development und Production nicht blind erneut mit diesem Bundle migrieren. `27010000` bleibt die Zero-Stage-Regel: 0 Stages fail-closed, `single_destination` nur bei genau einer Stage.

PR #87 (`feat/tw6-rest-progressive-stages`) ist gemergt und **schließt `TW6-REST-01`**. Reviewed Head `7ef201fb`, Merge-Commit auf `main` `80bbde69`. Checkpoint: `docs/CHATGPT_TL_POST_PR87_CHECKPOINT_2026-08-27.md`.

PR #94 (`cursor/visitor-search-ux-b13d`) ist gemergt. Reviewed Head `8da869fd`, Merge-Commit auf `main` `819715b1`. P1 Listbox und P2 Abort-Race sind geschlossen. Task bleibt historische Slice-Spec: `docs/TRIP_WORKSPACE_VISITOR_SEARCH_UX_TASK.md`. Keine Schema-/Production-Änderung. Kein neuer Search-Provider.

Ältere Exact-Head-Evidence (`72ca1700`, `1008632e`, Review `5040068359` CHANGES REQUIRED) bleibt historisch.

TW-7-Start-Gate ist erfüllt. Der Weg ist bereits einer. TW7-A Runtime ist integriert (PR #106): Mehrziel-Kartenidentität plus Gast-`itemCount`. Spec: `docs/TRIP_WORKSPACE_TW7_HUB_GAP_TASK.md`. Stand: `docs/TRIP_WORKSPACE_TW7_A_STATUS.md`. Issue #103 ist CLOSED / completed. TW-8 bleibt hinter Provider S5 **und** realer Commercial Provenance; S5-A allein ist kein TW-8-Start.

## 4. Traveller / Account

Current Traveller Truth:

> **Ein Reisender → mehrere Staatsbürgerschaften → mehrere Dokumente/Credential-Optionen → kontextabhängig bewertete zulässige Optionen.**

Kein Default-Pass. Issuer ist nicht Citizenship.

Geschlossen:

- P1-QS2-02 durch PR #81;
- P1-TA-02 durch PR #84;
- **P2-TA-06 / Issue #112 durch PR #113.** Der First-Document-Fallback in `travellerNormalisieren()` ist entfernt; PR #113 ist auf `main`, Issue #112 CLOSED / completed. Auftrag: `docs/P2_TA06_READINESS_CREDENTIAL_NORMALIZATION_TASK_2026-08-27.md`. Stand/Handoff sind post-merge aktualisiert. ADR-0178 bleibt die Slice-Entscheidung.

Weiter offen außerhalb dieses Slice:

- **P2-TA-03** – kanonischer Plan durch PR #117 integriert; historische Datei bleibt auf PR #39. Kein AP-5;
- **P2-TA-04 C1** – Issue #122 Implementation; Gate 0 / PR #120 integriert; kein C2/REVOKE/DEFINER;
- Mobility/Rental-Such-Snapshots mit kommerziellen Feldern;
- Account-Traveller-Registry Dual-Authority ist freigegeben; S1 Domain-Contract self-expiring auf Draft-PR #145. AP-4 ist integriert (PR #108). Persistenz/UI/S2 und AP-5-S3–S5 nicht automatisch.

## 5. Provider Readiness

S1–S3 und **S5-A** sind integriert. S5-B ist **nicht gestartet**.

Keine echten Provider, keine Secrets/Verträge/paid calls, keine Aktivierung durch Gate A/Gate 0B/PR #94/PR #113.

Gates:

- **TW8-START-GATE:** Kein TW-8 ohne belastbaren S5-Vertrag **und** spätere Provenance-/Persistenz-Reife. S5-A allein reicht nicht.
- **PROVIDER-ACTIVATION-GATE:** persistenter Cost Guard vor bezahlter/Production-Aktivierung.
- Persistierte kommerzielle Beträge ohne belegten Zeitpunkt bleiben `unknown`/`stale`.

## 6. QS / Admin AAL2 / Sanitation

Admin-AAL2 Application-Guard ist im Code integriert. PR #102 ist integriert. Production `20260827170000_admin_aal2_data_plane_alignment` ist angewendet und verifiziert, exakt einmal. `aktuelles_admin_aal2()` ist live. Admin-Capabilities verlangen Rolle **UND** aktuelles AAL2. Kein zweiter Apply. Ältere Sätze „Production-Datenebene ist weiterhin nicht angewendet“ sind Pre-Apply-Evidence.

Separate Supabase Security-/Performance-Advisors bleiben eigene QS-Arbeit. Keine dieser separaten Baustellen wurde durch PR #94 oder PR #113 still verändert.

Project-Sanitation: Issue #134 ist der aktuelle Closure-Slice. PR #88 ist `CLOSE-SAFE`; Unique Inventur-Dateien hängen am Branch `audit/project-sanitation-inventory-2026-08-26` (`HISTORICAL-EVIDENCE`). Kein Cleanup/PR-Close/Branch-/Cloud-Delete automatisch ausführen.

Live Supabase-Inventur zeigt:

- Production-Elternprojekt `qscbgcdmivbbnzrcyegn` (`Jetnity's Project`) – ACTIVE_HEALTHY
- Development-Branch `[REDACTED]`
- weiteres Top-Level-Projekt `jrixsujkzvlvglvcmtia` (`jetnity-bets`) – Decommission bleibt separate Product-Owner-Entscheidung

## 7. Aktive / nächste Cursor-Workstreams

Kein offener TW-7-Produktdocs-Draft als operative nächste Arbeit.

- **PR #106** integriert TW7-A Runtime (Issue #103). Integrationsvehikel. Issue #103 ist CLOSED / completed.
- **PR #100** versioniert TW-7-Gap / ADR-0176 / TW7-A-Spec. Nach Landung integriert.
- Historische Pre-Merge-Evidence von PR #100: Head `2aa573f1` Actions `33087982878` SUCCESS, Vercel `DUzQZnDEY2TBdP1rwoZFPs2bzFsA` SUCCESS; späterer Stamp-Head `2abe79b4` Actions `33088507998` SUCCESS, Vercel `8NJVH46dzhrvUur8raAGukyiyzcL` SUCCESS.

PR #98 und PR #102 sind integriert. Production-AAL2 `20260827170000` ist angewendet und verifiziert, exakt einmal. Ältere Sätze „Production-AAL2-Apply bleibt ein Gate“ sind Pre-Apply-Evidence.

PR #96 bleibt integriert/geschlossen. Historisch Draft auf `cursor/pr94-continuity-b13d`; das ist keine operative nächste Arbeit.

Account/Traveller zuletzt abgeschlossen:

- **Issue #112 / P2-TA-06** – `Account plattform audit vorbereitung 4`. PR #113 integriert. Issue CLOSED / completed. Generation 4 ist historische Authoring-Evidence.

Account-Implementation zuletzt abgeschlossen:

- **Issue #136 / AP-5-S2** – `Account plattform audit vorbereitung 10`. PR #137 integriert. Merge `f11a1753`. Generation 10 für Runtime abgeschlossen. Issue CLOSED / completed.

- **Issue #132 / AP-5-S1** – `Account plattform audit vorbereitung 9`. PR #133 integriert. Issue CLOSED / completed. Generation 9 ist historische Authoring-Evidence.

Historisch abgeschlossen:

- **Issue #128 / AP-5 Gate 0** – `Account plattform audit vorbereitung 8`. PR #129 integriert. Generation 8 nicht wiederverwenden.

- **Issue #122 / P2-TA-04 C1** – `Account plattform audit vorbereitung 7`. PR #126 integriert. Generation 7 nicht wiederverwenden.

- **Issue #119 / P2-TA-04 Gate 0** – `Account plattform audit vorbereitung 6`. PR #120 integriert. Generation 6 nicht wiederverwenden.
- **Issue #116 / P2-TA-03** – `Account plattform audit vorbereitung 5`. PR #117 integriert. Generation 5 nicht wiederverwenden.

`Cursor-Agent: Jetnity framework compatibility 1` ist der Ops-Slice für Draft-PR #150 (self-expiring: STOP für TL Exact-Head-Review; kein Ready, kein Merge, kein S2). `Cursor-Agent: Jetnity framework security audit 1` / PR #148 ist abgeschlossen und nicht wiederzuverwenden. `Cursor-Agent: Jetnity runtime consistency 1` / PR #147 ist auf `main @ 56aff7ff` abgeschlossen und nicht wiederzuverwenden. Generation 12 (`Account plattform audit vorbereitung 12` / PR #145) bleibt abgeschlossen. Generation 11 (Gate 0 / PR #144) bleibt abgeschlossen. S3–S5 starten nicht aus S2. AP-7-S2 startet nicht aus S1 und nicht aus diesem Ops-Slice.

STOPP weiterhin für automatische Folgeslices:

- `Jetnity framework compatibility` – Generation 1 nur für PR #150; kein S2 / Framework-Bump aus S1
- `Jetnity framework security audit` – Generation 1 für PR #148 abgeschlossen; kein Implementierungs-Bump aus Gate 0
- `Jetnity runtime consistency` – Generation 1 für PR #147 abgeschlossen; kein Produkt-Folgeslice
- `Account plattform audit vorbereitung` – Generation 12 nur für PR #145; kein S2 daraus
- `Jetnity provider readiness audit`
- `Admin platform audit`
- `Jetnity growth discoverability`
- `Jetnity quality security audit` – Generation 3 für Issue #134 abgeschlossen; Generation 4 ist der Continuity-Transport PR #143 und kein Produkt-/Cleanup-Folgeslice. Nach Merge von #143 ist Generation 4 abgeschlossen und nicht wiederzuverwenden.

Reserviert:

- `Jetnity native app architecture`

## 8. Offene PRs / relevante Integration

Operativ relevant:

| PR | Klasse |
| --- | --- |
| **#150** Next 16 Compatibility Prep S1 | **SELF-EXPIRING.** DRAFT, STOP für unabhängigen Technical-Lead Exact-Head-Review; kein Ready, kein Merge, kein S2, kein Framework-Bump. |
| **#149** Next 16 Product Owner approval | **GEMERGT / INTEGRIERT** auf `main @ 2fdf8a18`. Autorisiert das gestufte Compatibility-Programm; kein automatischer Bump. |
| **#148** Next.js Framework Security Upgrade Gate 0 | **GEMERGT / INTEGRIERT** auf `main @ 2fdf8a18`. Ältere SELF-EXPIRING/DRAFT-Zeilen sind Pre-Merge-Evidence. |
| **#147** Node 22 Runtime Consistency | **GEMERGT / INTEGRIERT.** Merge `56aff7ff`. Post-Merge Actions `33204438255` SUCCESS. GitHub Production deployment `6147375507` (GitHub-only). TL-verifizierte Vercel Production `dpl_3UZX5HrgwUyyr887ZSKBXMzPKMKM` READY. Ältere SELF-EXPIRING/DRAFT-Zeilen sind Pre-Merge-Evidence. |
| **#145** AP-7-S1 Dual-Authority Domain Contract | **GEMERGT / INTEGRIERT** auf Slice-Baseline `4ec83f36`. Ältere SELF-EXPIRING/DRAFT-Zeilen sind Pre-Merge-Evidence. Kein automatisches AP-7-S2. |
| **#144** AP-7 Gate 0 Account-Traveller-Registry | **GEMERGT / INTEGRIERT.** Merge `bb38aef5`. Architecture-Evidence; Dual-Authority danach PO-freigegeben. |
| **#143** PR #142 Post-Merge Continuity | **GEMERGT / INTEGRIERT.** Merge `1947285c`. Ältere SELF-EXPIRING/DRAFT-Zeilen sind Pre-Merge-Evidence. |
| **#142** Technical Lead / Cursor Operating Standard | **GEMERGT / INTEGRIERT.** Merge `9d4778b8`. Reviewed Head `507bcb17`. TL PASS `5454570805`. Ältere „DRAFT“-Zeilen sind Pre-Merge-Evidence. |
| **#138** AP-5-S2 Post-Merge Continuity | **GEMERGT / INTEGRIERT** laut kanonischem Handoff. Ältere „DRAFT“-Zeilen in diesem File sind Pre-#138-Evidence. |
| **#137** AP-5-S2 Passwortänderung | **GEMERGT / INTEGRIERT.** Merge `f11a1753`. Reviewed Head `e4cb805a`. TL PASS `5051115258`. Issue #136 CLOSED / completed. |
| **#135** Project Sanitation Closure | **GEMERGT / INTEGRIERT.** Merge `0256905c`. Retention-Plan; kein Cleanup. |
| **#133** AP-5-S1 Security-UI | **GEMERGT / INTEGRIERT.** Merge `51b0c926`. Issue #132 CLOSED / completed. Agent 9 abgeschlossen. |
| **#129** AP-5 Gate 0 Account security capability | **GEMERGT / INTEGRIERT.** Issue #128 CLOSED / completed. Ältere „Draft“-Zeilen sind Pre-Merge-Evidence. |
| **#126** P2-TA-04 C1 Traveller write-contract integrity | **GEMERGT / INTEGRIERT.** Merge `5ed7edbd`. Issue #122 CLOSED / completed. Production C1 live als `20260828015304`. Historische/develop-only Evidence `20260828120000`. Kein C2. |
| **#120** P2-TA-04 Traveller Write-Path Gate 0 | **GEMERGT / INTEGRIERT.** Merge `8d8f3d57`. Issue #119 CLOSED / completed. Audit only; Residual C1 jetzt Issue #122. |
| **#117** P2-TA-03 Account Plan Reconciliation | **GEMERGT / INTEGRIERT.** Merge `b912315d`. Issue #116 CLOSED / completed. Kanonischer AP-5–AP-12-Plan liegt auf `main`. |
| **#113** P2-TA-06 Readiness Credential Normalization | **GEMERGT / INTEGRIERT.** Reviewed Head `928215a2`; Merge `286d26fe`; Issue #112 CLOSED / completed. |
| **#106** TW7-A Runtime Issue #103 | **INTEGRIERT.** Integrationsvehikel. Issue #103 ist CLOSED / completed. Ältere „Draft / nicht auf main“-Zeilen sind Pre-Merge-Evidence. |
| **#102** Admin AAL2 production apply gate closure | **GEMERGT.** Historische Start-Baseline von TW7-A war `963186f4`. Apply von `20260827170000` ausgeführt und verifiziert, exakt einmal. |
| **#100** TW-7-Gap / ADR-0176 / TW7-A-Spec | **VERSIONIERT bzw. nach Landung integriert.** Spec bleibt bindend. Runtime folgt über PR #106. |
| **#98** Admin AAL2 Production Alignment | **GEMERGT.** Merge `beaef64a`. Historische Alignment-Linie vor PR #102. |
| **#97** TL live reconstruction + AAL2 production gate | **GEMERGT.** Merge `4362502b`. |
| **#96** Post-PR-#94 Continuity | **INTEGRIERT / GESCHLOSSEN.** Merge `45be14b1`. |
| **#95** PR94 new-chat checkpoint | **GEMERGT.** Nur `docs/CHATGPT_PR94_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-27.md`. Merge `943d14c2`. |
| **#94** Visitor Search UX | **GEMERGT.** Reviewed Head `8da869fd`. Merge `819715b1`. |
| **#87** TW6-B Runtime + Mode Contract | **GEMERGT.** Checkpoint `docs/CHATGPT_TL_POST_PR87_CHECKPOINT_2026-08-27.md`. |
| **#88** Project Sanitation Audit | Historische Inventur 26.08.2026. Nicht Current Truth. **CLOSE-SAFE**; Branch `HISTORICAL-EVIDENCE`. Close löscht Unique Files nicht. |
| #52 ChatGPT TL handoff 2026-08-24 | **CLOSE-SAFE**; Branch `HISTORICAL-EVIDENCE`. Nicht als Current Truth mergen. |
| #50 S1 merged-status docs | **CLOSE-SAFE**; Branch `DELETE-SAFE`. Unique Files vs Merge-Base = 0. |
| #40 Admin Platform Audit | **CLOSE-SAFE**; Branch `HISTORICAL-EVIDENCE`. Nicht als Current Truth mergen. |
| #39 Account Platform Audit | **CLOSE-SAFE**; Branch `HISTORICAL-EVIDENCE`. Enthält die alte `ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`. Nicht als Current Truth mergen. P2-TA-03 ersetzt den Steuerungsvertrag auf #117. |
| #28 Trip Collaboration Foundation | **KEEP-FUTURE**; Branch `FUTURE`. Nicht beiläufig schliessen. Nicht als aktuelle Runtime wieder aufnehmen. |

PR #89 und PR #91 sind gemergt und keine aktiven Drafts mehr.

Historische Evidence nicht löschen. Nicht als aktuelle Runtime-Arbeit wieder aufnehmen.

## 9. Supabase / Production

Production ist live `ACTIVE_HEALTHY`.

Production Gate A bleibt PASS. Technical-Lead Re-Review vom 27. August 2026 (PR #87, Review `5039338077`): **Production Gate B ist operativ PASS.** Der Vier-Datei-Vertrag `20260826220000 → 20260826230000 → 20260826240000 → 20260827010000` wurde unter Write-Gate transaktional angewendet und post-verifiziert.

Production-AAL2 `20260827170000_admin_aal2_data_plane_alignment` ist über PR #102 angewendet und verifiziert, exakt einmal. `aktuelles_admin_aal2()` ist live. Ältere Sätze „AAL2-Versionen bleiben ausgeschlossen“ beziehen sich auf die historischen Dateien `20260826090000` / `20260826052735`, nicht auf den ausgeführten Alignment-Apply.

Frühere Absätze in älteren Checkpoints, die „Production Gate B nicht angewendet“ sagten, sind **historische Evidence** vor diesem Apply.

PR #94, PR #113 und dieses Continuity-Update schreiben Production nicht.

Weiterhin nicht angewendet:

- historische AAL2-Datei `20260826090000`
- Development-AAL2-Version `20260826052735`

Production `20260827170000` ist angewendet und verifiziert, exakt einmal. Kein zweiter Apply.

Production C1 `20260828015304_traveller_write_contract_integrity` ist unter der bestehenden Product-Owner-C1-Freigabe (Issue #122) vom Technical Lead angewendet und live verifiziert. Kein erneuter Apply. Die historische/develop-only Author-Version `20260828120000` bleibt Develop-Evidence derselben SQL und wird nicht still umgeschrieben.

## 10. Nächster Schritt

**Self-expiring.** Unabhängiger Technical-Lead Exact-Head-Review von Draft-PR #150. Autor-Agent setzt kein Ready, kein Merge, keinen Framework-Bump, keine Vercel-Setting-Mutation und startet kein S2 und kein AP-7-S2.

PR #147 Node 22 ist integriert (`56aff7ff`). AP-7-S1 ist integriert (PR #145 / `4ec83f36`). Dual-Authority bleibt freigegeben. AP-7-S2 / Persistenz startet nicht aus #148 und braucht einen separat versionierten, Product-Owner-gegaten Vorschlag.

AP-5-S2 ist integriert (PR #137 / Merge `f11a1753`). Issue #136 ist CLOSED / completed. AP-5-S1 bleibt integriert (PR #133); Issue #132 ist CLOSED / completed. AP-5 Gate 0 bleibt integriert (PR #129); Issue #128 ist CLOSED / completed. Project Sanitation bleibt integriert (PR #135). PR #141 Provider S5-B Gate 0 bleibt integriert als docs/readiness only. AP-5-S3/S4/S5 sind normale Technical-Lead-Gates, nicht automatisch gestartet und nicht PO-gated. Kein C2, kein Auth-Config-Push, kein Cleanup aus diesem File.

P2-TA-03 bleibt integriert (PR #117); Issue #116 ist CLOSED / completed.

P2-TA-06 bleibt integriert (PR #113); Issue #112 ist CLOSED / completed.

**Kein automatischer Folgeslice.** Vor jeder neuen Runtime-Arbeit: aktuelles `main`, offene PRs/Issues, Binding Build Order, Account/Traveller-, Provider-, Admin-, Growth- und QS-Gates live neu prüfen und erst danach eine frische Task/Spec vergeben.

Kein weiterer Production-Write aus diesem Abschluss. Keine Direction A. Kein TW-8/9. Kein AP-5-S3–S5/AP-7 automatisch starten. S3–S5 ≠ Product-Owner-Gate. Issue #109/#110 bleiben dokumentierte separate Themen. Kein zweiter AAL2-Apply. Live-`main` immer live prüfen.

PR #95 zeichnet einen Product-Owner-Wunsch auf: Homepage-Hero-Design bleibt, die Funktion im bestehenden Kästchen soll später natürliche Mehrziel-/Route-Absicht verstehen. Das bleibt **kein** Startauftrag und ist nicht TW7-A.
