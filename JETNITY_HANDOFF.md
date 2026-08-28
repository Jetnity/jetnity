# Jetnity – Handoff und nächste Schritte

Stand: 28. August 2026  
Status: **Kanonischer Post-PR-#133-Übergabestand plus offener Sanitation-Draft. AP-5 Gate 0 und AP-5-S1 sind integriert; Issue #128 und Issue #132 sind CLOSED / completed. Offener Quality-Draft: Issue #134 / PR #135. S2–S5 und C2 sind nicht gestartet. Kein automatischer Folgeslice. Live-Evidence immer erneut verifizieren.**

> **Live-Evidence gewinnt immer.** Dieser Handoff ist Übergabe-Evidence, niemals Ersatz für Live-Rekonstruktion.

Aktuellster versionierter Post-Merge-Checkpoint für den Account-Workstream:

- `docs/CHATGPT_PR129_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-28.md`
- `docs/AP5_S1_SECURITY_UI_TRUTH_STATUS_2026-08-28.md` – aktueller Account-Implementation-Slice

Die ausführliche vorherige Fassung dieses Handoffs bleibt byte-identisch als historische Evidence erhalten unter:

- `docs/history/JETNITY_HANDOFF_PRE_PR113_2026-08-27.md`

## 1. Pflicht vor jeder neuen Arbeit

Zuerst vollständig lesen:

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
14. `docs/CHATGPT_PR129_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-28.md`
15. `docs/ACTIVE_WORK_STATUS.md`
16. `docs/CHATGPT_PR113_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-27.md`
17. `docs/P2_TA06_READINESS_CREDENTIAL_NORMALIZATION_STATUS_2026-08-27.md`
18. `docs/P2_TA06_READINESS_CREDENTIAL_NORMALIZATION_HANDOFF_2026-08-27.md`
19. danach alle für den betrachteten Workstream relevanten Slice-Tasks, Statusdateien, Handoffs, ADRs und Checkpoints.

Hinweis: Ältere Gate-0- und S1-Authoring-Blöcke in Statusdateien sind historische Evidence. AP-5-S1 / Issue #132 / PR #133 ist integriert. Der nächste Account-Schritt ist AP-5-S2 nur nach Product-Owner-Autorisierung.

Danach live prüfen: `main`, offene PRs/Drafts, Branches, Merge-Base/Ahead/Behind, tatsächliche Diffs, Review-Threads, Actions, Vercel, relevante Supabase-/Production-Grenzen und P0/P1/P2/P3-Risiken.

## 2. Letzter verifizierter Account-Übergabepunkt

AP-5 Gate 0 wurde nach unabhängigem Technical-Lead-Re-Review integriert:

- PR #129: **MERGED**
- Reviewed Exact Head: `1bf49fe3f870f00a1f228b81a4ee69c66e39307f`
- Review-Fix-Ausgangspunkt: Technical-Lead Review `5049870788`
- Exact-Head GitHub Actions Run `33160582183`: **SUCCESS**
- Exact-Head Vercel Preview `dpl_EG7RA6z95ijkxCSst4KUFHfLdJpY`: **READY**
- PR-#129 Merge: `a0eec330eac54a78c8743a72c5ef3ddc82a0cb80`
- Post-Merge GitHub Actions Run `33161197754`: **SUCCESS** auf exakt `a0eec330...`
- Post-Merge Vercel Production `dpl_Dra789nLcngJEtuQx7iHB9tYxXt9`: **READY** auf exakt `a0eec330...`
- PR #130: Post-Merge-Continuity **MERGED**
- PR-#130 Merge / verifizierter `main`: `db56ec83136808b8d2f2d39e8cbe0e2011c8e53d`
- Post-Merge GitHub Actions Run `33161605958`: **SUCCESS** auf exakt `db56ec83136808b8d2f2d39e8cbe0e2011c8e53d`
- Post-Merge Vercel Production `dpl_Gyj6iEdYnFFNUSVrA7QfwWpWNjjg`: **READY** auf exakt `db56ec83136808b8d2f2d39e8cbe0e2011c8e53d`
- Issue #128: **CLOSED / completed**
- `main` Branch Protection: weiterhin live `protected=false`

Diese Werte sind Übergabe-Evidence. Nach jedem weiteren Merge muss `main` erneut live verifiziert werden.

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
- AP-5-S1 / Issue #132 ist der aktuelle ehrliche Security-UI-Slice; S2–S5 sind nicht gestartet

AP-5-S2–S5 werden **nicht automatisch** gestartet. AP-7 / Account-Traveller-Registry bleibt separat und gated.

Der integrierte AP-5-Gate-0-Vertrag trennt insbesondere Password Recovery von signed-in Reauthentication, hält Session-/Gerätelisting ohne unterstützte User-API ehrlich auf `unsupported`, dokumentiert den heutigen globalen `signOut()`-Default und hält verified-factor `mfa.unenroll` an der serverseitigen AAL2-Anforderung. Details: `docs/AP5_GATE0_ACCOUNT_SECURITY_CAPABILITY_STATUS_2026-08-28.md`, ADR-0182 und der PR-#129-Post-Merge-Checkpoint.

### Provider / Commercial Provenance

- S1–S3 integriert
- S5-A integriert
- S5-B nicht automatisch gestartet
- keine echten Provider/Secrets/Verträge/paid calls aktiviert
- TW-8 bleibt gegated

### Admin / AAL2

- Admin Foundations A–C integriert
- zentraler Admin-AAL2 Application Guard integriert
- Production `20260827170000_admin_aal2_data_plane_alignment` ist **angewendet und verifiziert, exakt einmal**
- `aktuelles_admin_aal2()` ist live
- kein zweiter Apply
- historische Dateien `20260826090000` und Development-`20260826052735` nicht blind anwenden

### Production Gates

- Production Gate A: PASS
- Production Gate B: operativ PASS
- Vier-Datei-Vertrag `20260826220000 → 20260826230000 → 20260826240000 → 20260827010000`: bereits angewendet, **kein Re-Apply**

## 4. Truth-, Security- und Privacy-Vertrag

Keine erfundenen Preise, Verfügbarkeit, Provider-Health, Visa-/Einreise-/Safety-/Impf- oder Commercial-Truth.

Zustände sauber trennen:

- `confirmed`
- `unknown`
- `stale`
- `unavailable`
- `error`
- `insufficient_context`
- `empty`

LLM/Assistant darf harte Wahrheit erklären, priorisieren und zusammenfassen, aber nicht erzeugen oder überschreiben.

Keine neue Persistenz von Passnummern, Passscans, MRZ, Biometrie oder anderen besonders sensitiven Identitätsdaten ohne ausdrückliches Product-Owner-Gate.

## 5. Merge- und Product-Owner-Governance

> **AUTONOM MERGEN IST ERLAUBT. BLIND MERGEN IST VERBOTEN.**

Normale scope-treue PRs dürfen nach unabhängigem Exact-Head-Review Ready gesetzt und gemergt werden.

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
- aktuelle Base / Merge-Base / Drift
- offene Review-Threads
- Parallelkollisionen
- P0/P1-Blocker
- Special Gates

Besondere Product-Owner-Gates bleiben insbesondere für Production-Migrationen/destruktive Daten, große Auth/MFA/AAL/RLS/Identity-Änderungen, sensitive Dokumentdaten, reale Provider/Secrets/paid calls, Payments, Kosten > USD 100/Monat, fundamentale Produkt-/Build-Order-Änderungen, Public Launch, Domain Cutover, Provider-live und Store-Live-Aktivierungen.

## 6. Bekannte Residuals – nicht automatisch priorisieren

Nach Live-Rekonstruktion neu einordnen:

- `main` Branch Protection zuletzt `protected=false`
- Issue #109: Country-/Alias-/Intent-Relevance der Visitor Search, u. a. Peru / Schweiz / China
- Issue #110: spätere natürliche Homepage-Mehrziel-Eingabe
- Visitor Search Real-Device-Browser-Evidence bleibt separat zu prüfen
- `officialFingerprint` kann außerhalb #112 bei fehlendem `documents[]` Legacy-Singularfelder lesen; separat bewerten, nicht P2-TA-06 erneut öffnen
- Provider S5-B nicht gestartet
- TW-8 gated
- TW-9 nicht automatisch starten
- AP-5-S2–S5 nicht automatisch starten
- AP-7 gated
- weitere QS-/Supabase-Security-/Performance-Advisories
- Project-Sanitation: Issue #134 ist der aktuelle Closure-/Retention-Slice (`docs/PROJECT_SANITATION_LIVE_INVENTORY_STATUS_2026-08-28.md`). PR #88 ist historische Evidence vom 26.08.2026, nicht Current Truth; PR-Disposition `PR-CLOSE-SAFE`, Branch `HISTORICAL-EVIDENCE`. Kein Cleanup/PR-Close/Branch-/Cloud-Delete automatisch
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

Zuletzt abgeschlossene Account-Generation:

- `Cursor-Agent: Account plattform audit vorbereitung 9`
- AP-5-S1 / Issue #132 / PR #133 integriert
- Issue #132 CLOSED / completed
- Generation 9 nicht wiederverwenden

Generation 8 (AP-5 Gate 0 / PR #129) ist abgeschlossen und nicht wiederzuverwenden.
Generation 7 (P2-TA-04 C1 / PR #126) ist abgeschlossen und nicht wiederzuverwenden.
Generation 6 (P2-TA-04 Gate 0 / PR #120) ist abgeschlossen und nicht wiederzuverwenden.
Generation 5 (P2-TA-03 / PR #117) ist abgeschlossen und nicht wiederzuverwenden.
Generation 4 (P2-TA-06 / PR #113) ist abgeschlossen und nicht wiederzuverwenden.

Quality/Security-Generation 3 ist aktiv für Issue #134: `Cursor-Agent: Jetnity quality security audit 3`. Generation 2 (PR #88) ist historische Evidence und nicht wiederzuverwenden.

Account-Generation 9 (AP-5-S1 / PR #133 / Issue #132) ist abgeschlossen und nicht wiederzuverwenden. Dieser Sanitation-Handoff besitzt deren Auth-/Security-UI nicht.


## 8. Exakter nächster Technical-Lead-Schritt

**Kein Produkt-Folgeslice ist durch diesen Handoff über das integrierte S1 hinaus freigegeben.**

AP-5-S1 ist integriert (PR #133); Issue #132 ist CLOSED / completed. Offener Quality-Draft ist Issue #134 / PR #135. Das ist **kein** S2–S5- und **kein** C2-Start. AP-5 Gate 0 bleibt integriert. P2-TA-04 C1 bleibt integriert; Production C1 `20260828015304` nicht erneut anwenden.

Nicht automatisch starten:

- AP-5-S2 bis S5
- AP-7
- TW-8
- TW-9
- S5-B / Provider-live
- neue AAL2-Arbeit
- Direction A
- Homepage-Mehrziel-Runtime
- Issue #109 / #110
- neuer Search-Slice
- Public Indexing / Domain Cutover
- Native-App-Implementierung

## 9. Continuity

Kein wesentlicher Fortschritt darf nur im Chat existieren. Neue Chats und Agenten beginnen mit den kanonischen Dateien und dem neuesten Post-Merge-Checkpoint, behandeln ältere Checkpoints/PR-Bodies als zeitgebundene Evidence und verifizieren danach den Live-Zustand selbst.
