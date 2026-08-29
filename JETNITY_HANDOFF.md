# Jetnity – Handoff und nächste Schritte

Stand: 29. August 2026  
Status: **Self-expiring für PR #187 / ADR-0199. Solange #187 offen: Draft auf `feat/provider-adapter-core-foundation-2026-08-29`, STOP für unabhängigen Technical-Lead Exact-Head-Re-Review von `5463879179` (kein Ready, kein Merge, kein Folgeslice). Sobald #187 gemergt: Provider-Adapter-Core integriert; nächster Schritt zuerst Post-Merge-Verifikation + TL-Continuity gemäß Binding Slice Precheck, nicht automatisch Skyscanner-Server-Transport. Authoritative current-state: Checkpoint V2 (PR #194/#195) plus Binding Slice Precheck / Continuity Gate (PR #196). `main` live prüfen, keine eingefrorene SHA. S5-B Production-Migration `20260829140000` angewendet/verifiziert; Runtime-Write unallokiert; TW-8 geschlossen. Kosten 0. Live-Evidence gewinnt.**

> **Live-Evidence gewinnt immer.** Dieser Handoff ist Übergabe-Evidence, niemals Ersatz für Live-Rekonstruktion.

Verbindliche Current-Governance (PR #196, auf `main`; Live-Zustand prüfen):

- `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
- `docs/CHATGPT_TL_BINDING_SLICE_PRECHECK_CONTINUITY_CHECKPOINT_2026-08-29.md`

Aktueller New-Chat-Checkpoint (PR #178 ist nur der Continuity-Träger; Live-Zustand von #178 prüfen. Liegt dieser Checkpoint auf `main`, ist die Pre-Merge-#178-Klausel historisch; nächster Schritt = Live-Rekonstruktion + Binding-Build-Order-Auswahl, kein automatischer Produkt-Slice):

- `docs/CHATGPT_SEARCH_PRIVACY_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-29.md`

Aktueller Search-Stand (PR #173 gemergt, Issue #109 CLOSED / COMPLETED):

- `docs/VISITOR_SEARCH_COUNTRY_ALIAS_PRODUCTION_RECOVERY_TASK_2026-08-29.md`
- `docs/VISITOR_SEARCH_COUNTRY_ALIAS_PRODUCTION_RECOVERY_STATUS_2026-08-29.md`
- `docs/VISITOR_SEARCH_COUNTRY_ALIAS_PRODUCTION_RECOVERY_HANDOFF_2026-08-29.md`
- `docs/VISITOR_SEARCH_COUNTRY_ALIAS_PRODUCTION_RECOVERY_SELF_REVIEW_2026-08-29.md`
- ADR-0196 Nachträge, inkl. Trim-Semantik im Retrieval (`5057889604`)

Historischer vorheriger Search-Slice (PR #168 / #172, Production-Acceptance nicht erfüllt):

- `docs/VISITOR_SEARCH_COUNTRY_ALIAS_RANKING_TASK_2026-08-29.md`
- `docs/VISITOR_SEARCH_COUNTRY_ALIAS_RANKING_STATUS_2026-08-29.md`
- `docs/VISITOR_SEARCH_COUNTRY_ALIAS_RANKING_HANDOFF_2026-08-29.md`
- `docs/VISITOR_SEARCH_COUNTRY_ALIAS_RANKING_SELF_REVIEW_2026-08-29.md`

Integrierter vorheriger Account-Slice auf der Baseline (PR #166 / PR #167):

- `docs/AP6A_GATE0_LEGAL_FOUNDATION_STATUS_2026-08-29.md`
- `docs/AP6A_GATE0_LEGAL_FOUNDATION_HANDOFF_2026-08-29.md`
- `docs/AP6A_GATE0_LEGAL_FOUNDATION_SELF_REVIEW_2026-08-29.md`
- `docs/AP6A_GATE0_LEGAL_CONTENT_INPUT_CONTRACT_2026-08-29.md`
- `docs/AP6A_GATE0_LEGAL_RUNTIME_CONTRACT_2026-08-29.md`
- ADR-0195

Integrierter vorheriger Account-Slice auf der Baseline:

- `docs/AP5_S5_HONEST_CURRENT_SESSION_VIEW_STATUS_2026-08-29.md` – AP-5-S5 auf `main @ 765fc547` integriert; ältere Draft-#162-Zeilen sind Pre-AP-6a-Evidence
- ADR-0194
- `docs/AP5_S4_ACCOUNT_SECURITY_MFA_STEP_UP_STATUS_2026-08-29.md` – AP-5-S4 auf `main @ 934d43da` integriert; ältere Draft-#159-Zeilen sind Pre-S5-Evidence
- ADR-0193
- `docs/AP5_S3_ACCOUNT_SECURITY_LOGOUT_SCOPES_STATUS_2026-08-29.md` – AP-5-S3 auf `main @ 5920860e` integriert; ältere Draft-#156-Zeilen sind Pre-S4-Evidence
- ADR-0192

Integrierter Ops-Stand auf der Baseline:

- `docs/NEXT16_S2_FRAMEWORK_BUMP_STATUS_2026-08-28.md` – Next 16 S2 auf `main @ 3c3079de` integriert; ältere Draft-#151-Zeilen sind Pre-Merge-Evidence

Integrierte vorherige Ops-Slices:

- `docs/NEXT16_S1_REQUEST_API_COMPATIBILITY_PREP_STATUS_2026-08-28.md` – S1 Request-API-Kompatibilität / PR #150 integriert
- `docs/NEXT_FRAMEWORK_SECURITY_UPGRADE_GATE0_STATUS_2026-08-28.md` – Framework Security Gate 0 / PR #148 integriert
- `docs/NEXT16_PRODUCT_OWNER_APPROVAL_2026-08-28.md` – PO-Freigabe / PR #149 integriert
- `docs/NODE22_RUNTIME_CONSISTENCY_STATUS_2026-08-28.md` – Node 22 / PR #147 integriert auf `56aff7ff`

Aktuellster versionierter finaler Post-Merge-Checkpoint:

- `docs/CHATGPT_SEARCH_PRIVACY_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-29.md` – neueste Chat-Übergabe-Evidence nach Search #109 + PrivacyBee #169
- `docs/CHATGPT_PR142_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-28.md` – historische Chat-Übergabe-Evidence nach PR #142
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
15. `docs/CHATGPT_SEARCH_PRIVACY_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-29.md`
15a. `docs/CHATGPT_PR142_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-28.md`
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

Hinweis: Ältere Gate-0-, S1-, S2-, PR-#138- und Draft-PR-#142-Aussagen sind historische Evidence ihres jeweiligen Zeitpunkts. AP-5-S1 / Issue #132 / PR #133 ist integriert. AP-5-S2 / Issue #136 / PR #137 ist integriert. PR #138 ist ebenfalls integriert. PR #141 Provider S5-B Gate 0 ist integriert als docs/readiness only. S5-B Zielarchitektur Option C ist über PR #180 angenommen (ADR-0197). S5-B-Persistenz ist integriert; Production-Migration `20260829140000_trip_item_commercial_provenance` ist angewendet und verifiziert. Runtime-Write-Pfad/Principal bleibt unallokiert. Kein realer Provider-Snapshot. TW-8 bleibt geschlossen. PR #142 Operating Standard ist integriert. S3–S5 starten nicht aus S2. Product-Owner-Sondergates bleiben AP-5-P1–P4 sowie separate P5/C2-/Identity-/RLS-/Production-Gates.

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
- S5-B Persistenz: Repository Draft-PR #182 / ADR-0198; TL-182 Review-Fixes im Repository; Production-Write-Pfad nicht allokiert; **nicht** auf Production angewendet; TW-8 bleibt geschlossen. **Diese Zeile ist historische Pre-Apply-Evidence des PR-#141-Übergabepunkts.** Später: Production-Migration `20260829140000` angewendet und verifiziert.
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

AP-6a Gate 0 / ADR-0195 / PR #166 ist integrierte historische Architecture-Evidence. `/privacy` und `/terms` Runtime bleiben ungebaut und Legal-/PO-Content-gegatet. AP-6a-Runtime, AP-6b und AP-7 werden **nicht automatisch** gestartet. Dual-Authority ist product-owner-freigegeben. AP-7 Gate 0 / ADR-0186 ist integrierte Architecture-Evidence (PR #144 / `bb38aef5`). AP-7-S1 / ADR-0187 ist der integrierte shared Domain-Contract; AP-7-S2, Persistenz und Identity/RLS starten nicht automatisch.

Der integrierte AP-5-Gate-0-Vertrag trennt insbesondere Password Recovery von signed-in Reauthentication, hält Session-/Gerätelisting ohne unterstützte User-API ehrlich auf `unsupported`, dokumentiert den heutigen globalen `signOut()`-Default und hält verified-factor `mfa.unenroll` an der serverseitigen AAL2-Anforderung. Details: `docs/AP5_GATE0_ACCOUNT_SECURITY_CAPABILITY_STATUS_2026-08-28.md`, ADR-0182 und die aktuellen Account-Checkpoints.

AP-5 verbleibende normale TL-Slices, jeweils nur nach eigenem Task / Live-Gate:

- **S3:** Logout-UI – integriert über PR #157; heutiges allgemeines Abmelden bleibt `global`; Security-UI bietet `local`/`others`/`global` explizit.
- **S4:** `challenge`/`verify`-Step-up vor Unenroll verified TOTP; kein globales Consumer-AAL2 – integriert über PR #160.
- **S5:** aktuelle Sitzung ehrlich anzeigen; andere Sitzungen `unsupported`; keine Fake-Geräteliste – integriert über PR #164.

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
- S5-B Zielarchitektur Option C angenommen (ADR-0197 / PR #180)
- S5-B Persistenz integriert (ADR-0198); Production-Migration `20260829140000_trip_item_commercial_provenance` angewendet und verifiziert; Runtime-Write-Pfad/Principal nicht allokiert; kein realer Snapshot; TW-8 bleibt geschlossen
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
- Issue #109: Country-Alias-Ranking – **CLOSED / COMPLETED**; ältere „aktueller Draft-PR #173“-Sätze sind Pre-Recovery-Evidence
- Issue #110: spätere natürliche Homepage-Mehrziel-Eingabe, nicht gestartet
- Visitor Search Real-Device-Browser-Evidence bleibt separat zu prüfen
- `officialFingerprint` kann außerhalb #112 bei fehlendem `documents[]` Legacy-Singularfelder lesen; separat bewerten, nicht P2-TA-06 erneut öffnen
- Provider S5-B Gate 0 integriert (docs/readiness); Zielarchitektur Option C angenommen (ADR-0197 / PR #180); Persistenz integriert; Production-Migration `20260829140000` angewendet/verifiziert; Runtime-Write unallokiert; TW-8 geschlossen
- TW-8 gated
- TW-9 nicht automatisch starten
- AP-6a Gate 0 ist auf der Baseline integriert; kein automatisches AP-6a-Runtime / AP-6b / AP-7
- AP-7 Persistenz/UI/S2 gated; S1 Domain-Contract self-expiring auf Draft-PR #145, nach Merge integriert ohne automatisches S2
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

- `Cursor-Agent: Account plattform audit vorbereitung 16` war der AP-6a-Gate-0-Slice für PR #166 und ist mit der Integration abgeschlossen. Exact Run-ID `bc-216be067-b75a-4a2f-a186-8e38c67fb822`. Beobachteter Titel `Account plattform audit vorbereitung`. Keine programmierbare Rename-Fähigkeit; UI nicht als umbenannt behauptet. Generation 16 nicht für AP-6a-Runtime/AP-6b/AP-7 wiederverwenden.
- `Cursor-Agent: Account plattform audit vorbereitung 15` ist mit AP-5-S5 / PR #164 abgeschlossen. Generation 15 nicht wiederverwenden.
- `Cursor-Agent: Account plattform audit vorbereitung 14` ist mit AP-5-S4 / PR #160 abgeschlossen. Generation 14 nicht wiederverwenden.
- `Cursor-Agent: Account plattform audit vorbereitung 13` ist mit AP-5-S3 / PR #157 abgeschlossen. Generation 13 nicht wiederverwenden.
- `Cursor-Agent: Jetnity framework compatibility 2` ist mit Next 16 S2 / PR #152 auf der Baseline abgeschlossen. Generation 2 nicht wiederverwenden.
- `Cursor-Agent: Jetnity framework compatibility 1` ist mit PR #150 / S1 abgeschlossen. Generation 1 nicht wiederverwenden.
- `Cursor-Agent: Jetnity framework security audit 1` ist mit PR #148 abgeschlossen. Generation 1 nicht für einen Implementierungs-Bump wiederverwenden.
- `Cursor-Agent: Jetnity quality security audit 4` ist mit PR #143 abgeschlossen
- Generation 4 nicht für einen Produktslice wiederverwenden
- `Cursor-Agent: Jetnity runtime consistency 1` ist mit PR #147 abgeschlossen

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

Generation 16 ist für AP-6a Gate 0 / PR #166 abgeschlossen und nicht für AP-6a-Runtime/AP-6b/AP-7 wiederzuverwenden. Generation 15 (AP-5-S5 / PR #164), Generation 14 (AP-5-S4 / PR #160), Generation 13 (AP-5-S3 / PR #157), Generation 12 (AP-7-S1 / PR #145) und Generation 11 nicht wiederverwenden. AP-7-S2 braucht eine frische Generation und bleibt Product-Owner-gegatet. Das ist **keine automatische Freigabe**.

Regel: derselbe Agent bleibt bei demselben Slice/PR/Review-Fix. Eine neue logische Arbeitseinheit bekommt eine frische nummerierte Session gemäß Rotation Standard.

## 8. Exakter nächster Technical-Lead-Schritt

Authoritative current-state: Checkpoint V2 (PR #194/#195) plus Binding Slice Precheck / Continuity Gate (PR #196). `main` live prüfen, nicht als eingefrorene SHA. Live-Rekonstruktion zuerst. Kein automatischer Produkt-Slice.

**Self-expiring PR #187:** solange offen → unabhängiger Technical-Lead Exact-Head-Re-Review von `5463879179` (custom-sensitive request-ID). Autor-Agent setzt kein Ready, kein Merge, keinen Folgeslice. Sobald gemergt → Core integriert; erster nächster Schritt ist Post-Merge-Verifikation + TL-Continuity, nicht automatisch Skyscanner-Server-Transport. Keine erfundene Merge-SHA.

PR #180 / #182 / #183 / #173 / #109 sind integriert bzw. CLOSED. Ältere „#180 offen / #173 aktueller Slice / S5-B Production-Apply pending“-Sätze in diesem Handoff sind historische Pre-Apply-/Pre-Recovery-Evidence. S5-B Production-Migration `20260829140000` ist angewendet und verifiziert; Runtime-Write/Snapshot und TW-8 bleiben gegatet. AP-6a Gate 0 / PR #166 ist integriert; `/privacy`/`terms` Runtime bleiben Legal-/PO-Content-gegatet.

PR #144 ist MERGED (`bb38aef5`). Dual-Authority ist product-owner-freigegeben. PR #143 ist MERGED (`1947285c`).

Current-State-Continuity (kein Fortschritt nur im Chat) steht im Operating Standard §9 und im universellen Recovery-Prompt.

**Kein Persistence-Slice und kein anderer Produkt-Folgeslice ist dadurch automatisch freigegeben.**

Der nächste Chat muss zuerst den vollständigen Live-Zustand rekonstruieren und anschließend Binding Build Order, Abhängigkeiten, Parallelität und Product-Owner-Gates neu bewerten.

AP-5-S3–S5 und AP-6a Gate 0 sind integriert. AP-6a-Runtime bleibt hinter dem PO-/Legal-Content-Gate. AP-6b/AP-7 bleiben **nicht automatisch** der nächste globale Jetnity-Slice.

Nicht automatisch starten:

- AP-6a-Runtime / AP-6b / AP-7 aus Gate 0
- AP-7
- P2-TA-04 C2
- TW-8
- TW-9
- S5-B Runtime / Provider-live
- neue globale AAL2-Arbeit
- Direction A
- Homepage-Mehrziel-Runtime / Issue #110
- ein zweiter Search-Slice neben #168
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