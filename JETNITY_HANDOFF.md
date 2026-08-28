# Jetnity – Handoff und nächste Schritte

Stand: 28. August 2026  
Status: **AP-7-S1 Dual-Authority Domain Contract / Draft-PR #145. Dual-Authority ist product-owner-freigegeben. PR #144 Gate 0 ist MERGED (`bb38aef5`). S1 ist shared Domain-Contract ohne Schema/Persistenz/UI. STOP für unabhängigen Technical-Lead-Review. Kein Ready. Kein Merge. Kein AP-7-S2. PR #143 bleibt MERGED (`1947285c`). S5-B Runtime/Persistenz, AP-5-S3–S5, C2 und TW-8/TW-9 sind nicht automatisch gestartet. Live-Evidence immer erneut verifizieren.**

> **Live-Evidence gewinnt immer.** Dieser Handoff ist Übergabe-Evidence, niemals Ersatz für Live-Rekonstruktion.

Aktuellster versionierter finaler Post-Merge-Checkpoint:

- `docs/CHATGPT_PR142_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-28.md` – neueste Chat-Übergabe-Evidence nach PR #142
- `docs/CHATGPT_PR141_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-28.md` – Post-Merge-Evidence nach PR #141
- `docs/CHATGPT_PR138_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-28.md` – Post-Merge-Evidence nach PR #138
- `docs/CHATGPT_PR137_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-28.md` – integrierter AP-5-S2-Runtime-Stand vor dem finalen #138-Continuity-Merge
- `docs/AP5_S2_PASSWORD_REAUTH_STATUS_2026-08-28.md` – S2-Author-Evidence
- `docs/AP5_S1_SECURITY_UI_TRUTH_STATUS_2026-08-28.md` – integrierter S1-Stand
- `docs/CHATGPT_PR129_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-28.md`

Die ausführliche vorherige Fassung dieses Handoffs bleibt byte-identisch als historische Evidence erhalten unter:

- `docs/history/JETNITY_HANDOFF_PRE_PR113_2026-08-27.md`

## 1. Pflicht vor jeder neuen Arbeit

Zuerst vollständig lesen:

1. `JETNITY_START_HERE.md`
2. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
2a. `docs/JETNITY_UNIVERSAL_NEW_CHAT_RECOVERY_PROMPT.md`
3. `docs/TECHNICAL_LEAD_MERGE_AUTONOMY_SUPERSESSION_2026-08-26.md`
4. `docs/JETNITY_ENGINEERING_EXCELLENCE_STANDARD.md`
5. `docs/JETNITY_PRODUCT_POSITIONING_STANDARD.md`
6. `docs/JETNITY_GUARDIAN_AND_WHAT_IF_SIMULATOR_STANDARD.md`
7. `docs/JETNITY_MARKETING_GROWTH_STANDARD.md`
8. `docs/ADMIN_MARKETING_GROWTH_CONTROL_CENTER_STANDARD.md`
9. `docs/JETNITY_AI_SEARCH_DISCOVERABILITY_STANDARD.md`
10. `docs/JETNITY_AGENT_WORKSTREAM_GOVERNANCE.md`
11. `docs/JETNITY_FUTURE_NATIVE_APP_AND_TECHNICAL_LEAD_STANDARD.md`
12. `docs/JETNITY_BINDING_BUILD_ORDER.md`
13. `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`
14. `JETNITY_HANDOFF.md`
15. `docs/CHATGPT_PR142_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-28.md`
16. `docs/CHATGPT_PR141_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-28.md`
16a. `docs/CHATGPT_PR138_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-28.md`
17. `docs/CHATGPT_PR137_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-28.md`
18. `docs/ACTIVE_WORK_STATUS.md`
19. `ROADMAP.md`
20. `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`
21. `docs/AP5_GATE0_ACCOUNT_SECURITY_CAPABILITY_STATUS_2026-08-28.md`
22. `docs/CHATGPT_PR129_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-28.md`
23. `docs/CHATGPT_PR113_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-27.md`
24. `docs/P2_TA06_READINESS_CREDENTIAL_NORMALIZATION_STATUS_2026-08-27.md`
25. `docs/P2_TA06_READINESS_CREDENTIAL_NORMALIZATION_HANDOFF_2026-08-27.md`
26. danach alle für den betrachteten Workstream relevanten Slice-Tasks, Statusdateien, Handoffs, ADRs, Reviews und Checkpoints.

Hinweis: Ältere Gate-0-, S1-, S2-, PR-#138- und Draft-PR-#142-Aussagen sind historische Evidence ihres jeweiligen Zeitpunkts. AP-5-S1 / Issue #132 / PR #133 ist integriert. AP-5-S2 / Issue #136 / PR #137 ist integriert. PR #138 ist ebenfalls integriert. PR #141 Provider S5-B Gate 0 ist integriert als docs/readiness only; S5-B Runtime ist nicht gestartet. PR #142 Operating Standard ist integriert. S3–S5 starten nicht aus S2. Product-Owner-Sondergates bleiben AP-5-P1–P4 sowie separate P5/C2-/Identity-/RLS-/Production-Gates.

Danach live prüfen: `main`, offene PRs/Drafts, Branches, Merge-Base/Ahead/Behind, tatsächliche Diffs, Review-Threads, Actions, Vercel, relevante Supabase-/Production-Grenzen und P0/P1/P2/P3-Risiken.

## 2. Letzter vollständig verifizierter Chat-Übergabepunkt

Letzter integrierter Post-Merge:

- PR #142: **MERGED** – Technical Lead / Cursor Operating Standard
- Reviewed Exact Head: `507bcb170604b0f680dad7325ab4f32c7c4f2f61`
- Independent Technical-Lead PASS: Issue-Kommentar `5454570805`
- Merge / verifizierter `main`: `9d4778b81f34e199466e089fe06fb093895f2df1`
- Post-Merge GitHub Actions Run `33186501087`: **SUCCESS** auf exakt diesem `main`
- Post-Merge Vercel Production `dpl_8NN5v8rV27D4MTs9JwDyyLdXqpzo`: **READY** auf exakt diesem `main`
- Branch Protection: unverändert `protected=false`
- Continuity-Regel und universeller Recovery-Prompt sind Teil dieses integrierten Vertrags
- Checkpoint: `docs/CHATGPT_PR142_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-28.md`

Historischer vorheriger Chat-Übergabepunkt (PR #141, bleibt Evidence):

- PR #141: **MERGED** – Provider S5-B Gate 0, docs/readiness only
- Reviewed Exact Head: `a2f1f0a80e5715b5ab0fef39b671dd887ae0204b`
- Pre-Merge GitHub Actions Run `33180483619`: **SUCCESS** auf exakt diesem Head
- Pre-Merge Vercel Preview `dpl_8tGmMtJvHhUUBrccy7mqyesqYCrd`: **READY** auf exakt diesem Head
- Merge / verifizierter `main`: `3b119ae34843b40d043ed921070c60e35dd1517a`
- Post-Merge GitHub Actions Run `33182424045`: **SUCCESS** auf exakt diesem `main`
- Post-Merge Vercel Production `dpl_BmpsTYQC3ANoMT1z33pjMVYws2nS`: **READY** auf exakt diesem `main`
- Branch Protection: unverändert `protected=false`
- S5-B Runtime/Persistenz/Schema/Migration: **nicht** gestartet; TW-8 bleibt geschlossen
- Checkpoint: `docs/CHATGPT_PR141_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-28.md`

Historischer vorheriger Chat-Übergabepunkt (PR #138, bleibt Evidence):

- PR #138: **MERGED**
- Reviewed Exact Head: `54bc9d2fb062341b8ff8b8e4b92f0666af725d79`
- Technical-Lead PASS: Review `5051245059`
- PR-Head vor Merge: 4 ahead / 0 behind; Merge-Base exakt `f11a17533c56f5746ca9ef56e08c3e4a21a5a3c5`
- Exact-Head GitHub Actions Run `33172681840`: **SUCCESS**
- Exact-Head Vercel Preview `dpl_BbDuhHQoNexWbHojuo4iQxWHBvGV`: **READY**
- PR-#138 Merge / verifizierter `main`: `4148ab3eb31244b49433d4604c43398cce4246bf`
- Post-Merge GitHub Actions Run `33173185296`: **SUCCESS** auf exakt `4148ab3e...`
- Post-Merge Vercel Production `dpl_Dfxvu4HgAnwE62cAYuDuKPHEMKEd`: **READY** auf exakt `4148ab3e...`
- `main` Branch Protection: weiterhin `protected=false`
- Issue #136: **CLOSED / completed**
- keine freigegebene neue Account-Runtime-Generation

Supabase zuletzt live verifiziert:

- Production/default: `qscbgcdmivbbnzrcyegn` / `main` / ACTIVE_HEALTHY
- non-default Branch: `develop`
- Branch-ID: `74809331-0243-493a-8c14-20bb78c015f5`
- develop project ref: `yfvbxvijcorffwxbxahl`
- `is_default=false`
- preview status: ACTIVE_HEALTHY
- Functions/Branch-Status: FUNCTIONS_DEPLOYED
- Production Migration History endet mit `20260828015304_traveller_write_contract_integrity`
- develop enthält die historische/develop-spezifische `20260828120000_traveller_write_contract_integrity`; nicht mit Production verwechseln

Live offene historische/future Draft-PRs beim Übergabepunkt: #88, #52, #50, #40, #39, #28.  
Live offene Issues: #20, #109, #110.

Diese Werte sind Übergabe-Evidence. Nach jedem weiteren Merge oder externen Change müssen sie erneut live verifiziert werden.

Historische Account-Gate-0-Evidence bleibt zusätzlich erhalten:

- PR #129: **MERGED**
- Reviewed Exact Head: `1bf49fe3f870f00a1f228b81a4ee69c66e39307f`
- Review-Fix-Ausgangspunkt: Technical-Lead Review `5049870788`
- Exact-Head GitHub Actions Run `33160582183`: **SUCCESS**
- PR-#129 Merge: `a0eec330eac54a78c8743a72c5ef3ddc82a0cb80`
- Issue #128: **CLOSED / completed**

## 3. Aktuell integrierte Produktlinie

### Trip Workspace / Search

Integriert bzw. geschlossen:

- TW-1
- TW-2
- TW-4
- TW-3
- TW-5
- TW6-A
- TW6-B Runtime / PR #87
- `TW6-REST-01` geschlossen
- Visitor Search UX / PR #94
- TW7-A Runtime / PR #106
- Issue #103 CLOSED / completed

TW-8 bleibt hinter Provider-/Commercial-Provenance-Gates. TW-9 wird nicht automatisch gestartet.

### Traveller / Account

Verbindliche Wahrheit:

> **Ein Traveller → mehrere Staatsbürgerschaften → mehrere Dokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

- kein Default-Pass
- Issuer Country ≠ Citizenship
- Residence/Standort/Sprache/Domain/Abflugland ≠ Citizenship
- kein `documents[0]` oder `evaluations[0]` als Product Truth
- Foundation E integriert
- P1-TA-02 geschlossen
- AP-1, AP-2, AP-3 integriert
- AP-4 Account Archive Lifecycle / PR #108 integriert
- AP-4 Continuity / PR #111 integriert
- P2-TA-06 / PR #113 integriert
- Issue #112 CLOSED / completed
- `travellerNormalisieren()` kollabiert mehrere Dokumente nicht mehr auf `documents[0]`
- P2-TA-03 / PR #117 integriert; `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` ist der kanonische AP-5–AP-12-Plan
- P2-TA-04 Gate 0 / PR #120 integriert
- P2-TA-04 C1 / PR #126 integriert; Production C1 ist als `20260828015304` live verifiziert und darf nicht erneut angewendet werden
- AP-5 Gate 0 / PR #129 integriert; Issue #128 CLOSED / completed
- AP-5-S1 / PR #133 integriert; Issue #132 CLOSED / completed
- AP-5-S2 / PR #137 integriert; Issue #136 CLOSED / completed
- PR #138 Post-Merge Continuity integriert
- PR #142 Technical-Lead-/Cursor-Operating-Standard integriert

AP-5-S3–S5 werden **nicht automatisch** gestartet. Dual-Authority ist product-owner-freigegeben. AP-7 Gate 0 / ADR-0186 ist integrierte Architecture-Evidence (PR #144 / `bb38aef5`). AP-7-S1 / ADR-0187 ist der shared Domain-Contract auf Draft-PR #145: keine Persistenz, kein Schema, keine UI. Production-Migration / RLS / Identity bleiben separat gegated. Kein AP-7-S2 aus diesem Handoff.

Der integrierte AP-5-Gate-0-Vertrag trennt insbesondere Password Recovery von signed-in Reauthentication, hält Session-/Gerätelisting ohne unterstützte User-API ehrlich auf `unsupported`, dokumentiert den heutigen globalen `signOut()`-Default und hält verified-factor `mfa.unenroll` an der serverseitigen AAL2-Anforderung. Details: `docs/AP5_GATE0_ACCOUNT_SECURITY_CAPABILITY_STATUS_2026-08-28.md`, ADR-0182 und die aktuellen Account-Checkpoints.

AP-5 verbleibende normale TL-Slices, jeweils nur nach eigenem Task / Live-Gate:

- **S3:** Logout-UI – heutiges Abmelden bleibt `global`; optional `others`; Fehler nicht schlucken; JWT-Restlaufzeit ehrlich
- **S4:** `challenge`/`verify`-Step-up vor Unenroll verified TOTP; kein globales Consumer-AAL2
- **S5:** aktuelle Sitzung ehrlich anzeigen; andere Sitzungen `unsupported`; keine Fake-Geräteliste

Product-Owner-Sondergates:

- P1: Default-Logout `global` → `local`
- P2: Session-/Geräteliste über Service Role / `auth.sessions` / neues Schema
- P3: Consumer-AAL2 / Login-Hard-Gate
- P4: Auth-Config-Push, `current_password`, Passkey/OAuth live, `sessions_single_per_user`
- P5/C2: REVOKE / SECURITY DEFINER / RLS / Identity – außerhalb normalem AP-5

Nach AP-5 bleiben gemäß kanonischem Account-Plan AP-6a/6b, AP-7, AP-8, AP-9, AP-10, AP-11 und AP-12. Das ist Programmübersicht, keine automatische Startreihenfolge.

### Provider / Commercial Provenance

- S1–S3 integriert
- S5-A integriert
- S5-B Gate 0 integriert (PR #141, docs/readiness only)
- S5-B Runtime/Persistenz/Schema/Migration **nicht** gestartet und nicht autorisiert
- keine echten Provider/Secrets/Verträge/paid calls aktiviert
- TW-8 bleibt geschlossen

### Admin / AAL2

- Admin Foundations A–C integriert
- zentraler Admin-AAL2 Application Guard integriert
- Production `20260827170000_admin_aal2_data_plane_alignment` ist **angewendet und verifiziert, exakt einmal**
- `aktuelles_admin_aal2()` ist live
- kein zweiter Apply
- historische/development-only Admin-Migrationen nicht blind anwenden

### Production Gates

- Production Gate A: PASS
- Production Gate B: operativ PASS
- Vier-Datei-Vertrag `20260826220000 → 20260826230000 → 20260826240000 → 20260827010000`: bereits angewendet, **kein Re-Apply**
- P2-TA-04 C1 Production `20260828015304`: angewendet/verifiziert, **kein Re-Apply**

## 4. Truth-, Security- und Privacy-Vertrag

Keine erfundenen Preise, Verfügbarkeit, Provider-Health, Visa-/Einreise-/Safety-/Impf-/Wetter- oder Commercial-Truth.

Zustände sauber trennen:

- `confirmed`
- `unknown`
- `stale`
- `unavailable`
- `error`
- `insufficient_context`
- `empty`
- `unsupported`, wo eine Fähigkeit technisch nicht unterstützt ist

LLM/Assistant darf harte Wahrheit erklären, priorisieren und zusammenfassen, aber nicht erzeugen oder überschreiben.

Keine neue Persistenz von Passnummern, Passscans, MRZ, Biometrie oder anderen besonders sensitiven Identitätsdaten ohne ausdrückliches Product-Owner-Gate.

## 5. Merge- und Product-Owner-Governance

> **AUTONOM MERGEN IST ERLAUBT. BLIND MERGEN IST VERBOTEN.**

> **Nur ChatGPT / Technical Lead darf Ready setzen oder mergen. Cursor-Agenten tun das niemals.**

Current Truth: `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`.

Normale scope-treue PRs darf der Technical Lead nach unabhängigem Exact-Head-Review Ready setzen und mergen, und nur wenn er absolut überzeugt ist, dass dies die beste verantwortbare Entscheidung ist.

Vor jedem Merge mindestens prüfen:

- Auftrag / Scope / Non-Scope
- tatsächlichen Diff und Semantik
- Tests und Testannahmen
- Truth Contracts
- Security / Privacy
- Auth / RLS / Ownership, falls relevant
- Shared Contracts
- Exact-Head GitHub Actions
- Exact-Head Vercel
- aktuelle Base / Merge-Base / Drift / Ahead / Behind
- offene Review-Threads
- Parallelkollisionen
- P0/P1/P2/P3-Risiken
- Special Gates

Ein früherer PASS überträgt sich niemals automatisch auf einen veränderten Head.

GitHub-Eigenheit: Weil verbundener Owner und PR-Autor häufig derselbe GitHub-Account sind, kann GitHub formales `APPROVE` oder `REQUEST_CHANGES` verweigern. In diesem Fall den unabhängigen Technical-Lead-PASS bzw. CHANGES-REQUIRED als COMMENT auf dem exakten Head dokumentieren und trotzdem alle Gates unverändert anwenden. Merge mit Expected-Head-SHA schützen.

Besondere Product-Owner-Gates bleiben insbesondere für Production-Migrationen/destruktive Daten, große Auth/MFA/AAL/RLS/Identity-Änderungen, sensitive Dokumentdaten, reale Provider/Secrets/paid calls, Payments, Kosten > USD 100/Monat, fundamentale Produkt-/Build-Order-Änderungen, Public Launch, Domain Cutover, Provider-live und Store-Live-Aktivierungen.

## 6. Bekannte Residuals – nicht automatisch priorisieren

Nach Live-Rekonstruktion neu einordnen:

- `main` Branch Protection zuletzt `protected=false`
- Issue #20: Future Collaboration für Paare/Familien/Gruppen
- Issue #109: Country-/Alias-/Intent-Relevance der Visitor Search, u. a. Peru / Schweiz / China
- Issue #110: spätere natürliche Homepage-Mehrziel-Eingabe
- Visitor Search Real-Device-Browser-Evidence bleibt separat zu prüfen
- `officialFingerprint` kann außerhalb #112 bei fehlendem `documents[]` Legacy-Singularfelder lesen; separat bewerten, nicht P2-TA-06 erneut öffnen
- Provider S5-B Gate 0 integriert (docs/readiness); S5-B Runtime nicht gestartet
- TW-8 gated
- TW-9 nicht automatisch starten
- AP-5-S3–S5 nicht automatisch starten
- AP-7 Persistenz/UI/S2 gated; S1 Domain-Contract auf Draft-PR #145
- P2-TA-04 C2 nicht automatisch starten
- weitere QS-/Supabase-Security-/Performance-Advisories
- Project-Sanitation Closure / PR #135 / Issue #134 ist integriert/abgeschlossen; ADR-0184 ist Authority
- PR #88 ist historische Evidence vom 26.08.2026, nicht Current Truth; PR-Disposition `CLOSE-SAFE`, Branch `HISTORICAL-EVIDENCE`
- offene historische/future Drafts #88, #52, #50, #40, #39, #28 nicht blind mergen/schließen/löschen
- kein automatisches Branch-/Tag-/Supabase-/Vercel-/Cloud-Delete
- kein Public Indexing / Domain Cutover ohne Gate

Diese Liste ist keine automatische Prioritätenliste. Binding Build Order + Live-Evidence entscheiden.

## 7. Cursor-Agenten / Rotation

Exakte Basis-Anzeigenamen bleiben verbindlich:

1. `Cursor-Agent: Trip workspace audit architecture`
2. `Cursor-Agent: Account plattform audit vorbereitung`
3. `Cursor-Agent: Jetnity provider readiness audit`
4. `Cursor-Agent: Admin platform audit`
5. `Cursor-Agent: Jetnity growth discoverability`
6. `Cursor-Agent: Jetnity quality security audit`
7. `Cursor-Agent: Jetnity native app architecture`

Aktueller Account-Status:

- Generation 12: `Cursor-Agent: Account plattform audit vorbereitung 12` für AP-7-S1 / Draft-PR #145. Sichtbarer Cursor-Titel: `Dual-authority domain contract`; nicht als umbenannt behauptet.
- Generation 11: `Cursor-Agent: Account plattform audit vorbereitung 11` für AP-7 Gate 0 / PR #144 ist abgeschlossen (Merge `bb38aef5`); nicht wiederverwenden.
- `Cursor-Agent: Account plattform audit vorbereitung 10` ist mit AP-5-S2 / PR #137 und PR #138 Continuity abgeschlossen
- Generation 10 nicht wiederverwenden

Aktueller Quality-/Security-Status:

- `Cursor-Agent: Jetnity quality security audit 4` ist mit PR #143 abgeschlossen
- Generation 4 nicht für einen Produktslice wiederverwenden

Abgeschlossen / nicht wiederverwenden:

- Generation 10: AP-5-S2 / PR #137 + #138
- Generation 9: AP-5-S1 / PR #133
- Generation 8: AP-5 Gate 0 / PR #129
- Generation 7: P2-TA-04 C1 / PR #126
- Generation 6: P2-TA-04 Gate 0 / PR #120
- Generation 5: P2-TA-03 / PR #117
- Generation 4: P2-TA-06 / PR #113
- Quality/Security Generation 3: Issue #134 / PR #135
- Quality/Security Generation 2: PR #88 historical only

Generation 12 ist für AP-7-S1 / PR #145 vergeben. Generation 11 nicht wiederverwenden. AP-7-S2 oder AP-5-S3 brauchen eine frische Generation. Das ist **keine automatische Freigabe**.

Regel: derselbe Agent bleibt bei demselben Slice/PR/Review-Fix. Eine neue logische Arbeitseinheit bekommt eine frische nummerierte Session gemäß Rotation Standard.

## 8. Exakter nächster Technical-Lead-Schritt

Unabhängiger Technical-Lead Exact-Head-Review von Draft-PR #145 (AP-7-S1 Domain Contract). Autor-Agent setzt kein Ready, kein Merge, startet kein AP-7-S2 und keine Persistenz.

PR #144 ist MERGED (`bb38aef5`). Dual-Authority ist product-owner-freigegeben. PR #143 ist MERGED (`1947285c`).

Current-State-Continuity (kein Fortschritt nur im Chat) steht im Operating Standard §9 und im universellen Recovery-Prompt.

**Kein Persistence-Slice und kein anderer Produkt-Folgeslice ist dadurch automatisch freigegeben.**

Der nächste Chat muss zuerst den vollständigen Live-Zustand rekonstruieren und anschließend Binding Build Order, Abhängigkeiten, Parallelität und Product-Owner-Gates neu bewerten.

AP-5-S3/S4/S5 sind nach dem integrierten Gate-0-Vertrag mögliche normale Technical-Lead-Account-Slices, **nicht Product-Owner-gated** und **nicht automatisch der nächste globale Jetnity-Slice**.

Nicht automatisch starten:

- AP-5-S3 bis S5
- AP-7
- P2-TA-04 C2
- TW-8
- TW-9
- S5-B Runtime / Provider-live
- neue globale AAL2-Arbeit
- Direction A
- Homepage-Mehrziel-Runtime
- Issue #109 / #110
- neuer Search-Slice
- Public Indexing / Domain Cutover
- Native-App-Implementierung

Vor Start eines anderen zulässigen Slices dem Product Owner kurz erklären:

- warum genau dieser Slice jetzt dran ist
- welche Abhängigkeiten erfüllt sind
- welche Risiken bestehen
- ob ein Cursor-Agent gebraucht wird
- welcher exakte Cursor-Agent verwendet wird
- ob ein Product-Owner-Sondergate betroffen ist

## 9. Continuity

Kein wesentlicher Fortschritt darf nur im Chat existieren. Neue Chats und Agenten beginnen mit den kanonischen Dateien, dem Operating Standard und dem neuesten Post-Merge-Checkpoint, behandeln ältere Checkpoints/PR-Bodies als zeitgebundene Evidence und verifizieren danach den Live-Zustand selbst. Kanonischer Recovery-Prompt: `docs/JETNITY_UNIVERSAL_NEW_CHAT_RECOVERY_PROMPT.md`.

Falls ältere aktuelle Dateien an einzelnen Stellen PR #142 noch als Draft / nächsten Review-Schritt nennen, wird ausschließlich diese operative Aussage durch `docs/CHATGPT_PR142_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-28.md` und diesen Handoff superseded. Historische Evidence bleibt erhalten.