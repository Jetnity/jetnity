# Jetnity – Handoff und nächste Schritte

Stand: 28. August 2026  
Status: **Kanonischer Post-PR-#126/#127-Übergabestand plus AP-5 Gate 0 auf Issue #128. C1 ist integriert. C2 ist nicht gestartet. AP-5-Runtime ist nicht gestartet. Live-Evidence immer erneut verifizieren.**

> **Live-Evidence gewinnt immer.** Dieser Handoff ist Übergabe-Evidence, niemals Ersatz für Live-Rekonstruktion.

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
14. `docs/ACTIVE_WORK_STATUS.md`
15. `docs/CHATGPT_PR113_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-27.md`
16. `docs/P2_TA06_READINESS_CREDENTIAL_NORMALIZATION_STATUS_2026-08-27.md`
17. `docs/P2_TA06_READINESS_CREDENTIAL_NORMALIZATION_HANDOFF_2026-08-27.md`
18. danach alle für den betrachteten Workstream relevanten Slice-Tasks, Statusdateien, Handoffs, ADRs und Checkpoints.

Danach live prüfen: `main`, offene PRs/Drafts, Branches, Merge-Base/Ahead/Behind, tatsächliche Diffs, Review-Threads, Actions, Vercel, relevante Supabase-/Production-Grenzen und P0/P1/P2/P3-Risiken.

## 2. Letzter verifizierter Übergabepunkt vor diesem Continuity-PR

Unmittelbar vor Erstellung dieses docs-only Continuity-Branches wurde live verifiziert:

- `main`: `0d8842af99e5645dc3a6c903e19000458122f440`
- PR #113: **MERGED**
- PR-#113 reviewed Exact Head: `928215a2c6c4d4ce914f12ba1bd88dbcab8f548b`
- PR-#113 Merge: `286d26fec2eed87e1227ebb2cf7327f50e8f5f1a`
- Issue #112: **CLOSED / completed**
- PR #114: **MERGED**, docs-only Post-Merge-Continuity
- PR-#114 Merge / damaliger `main`: `0d8842af99e5645dc3a6c903e19000458122f440`
- Post-Merge GitHub Actions Run `33121881986`: **SUCCESS**
- Post-Merge Vercel Production Deployment `dpl_5zb67qYv6i5jT23AToSfuEA5sA4c`: **READY** auf exakt `0d8842af99e5645dc3a6c903e19000458122f440`
- `main` Branch Protection: zuletzt live `protected=false`

Diese Werte sind Start-Evidence. Nach diesem Continuity-PR wird `main` naturgemäß einen neueren Merge-SHA erhalten; deshalb immer live verifizieren.

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

AP-5 wird **nicht automatisch** gestartet. AP-7 / Account-Traveller-Registry bleibt separat und gated.

P2-TA-03 rekonstruiert den kanonischen Plan `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` auf Draft-PR #117 / Issue #116. Die historische Datei auf PR #39 ist keine Current Truth. P2-TA-03 ist Audit/Architecture/Continuity only.

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
- AP-5+ nicht automatisch starten
- AP-7 gated
- weitere QS-/Supabase-Security-/Performance-Advisories
- Project-Sanitation PR #88 bleibt non-destructive Evidence; kein Cleanup/Branch-/Cloud-Delete automatisch
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

Zuletzt abgeschlossene Account-/Traveller-Generation:

- `Cursor-Agent: Account plattform audit vorbereitung 4`
- P2-TA-06 / Issue #112 / PR #113 abgeschlossen
- nicht automatisch weiterführen

Aktuelle Account-Generation:

- `Cursor-Agent: Account plattform audit vorbereitung 8`
- AP-5 Gate 0 / Issue #128
- Audit/Architecture only
- Draft; kein Ready, kein Merge, keine AP-5-Runtime

Generation 7 (P2-TA-04 C1 / PR #126) ist abgeschlossen und nicht wiederzuverwenden.
Generation 6 (P2-TA-04 Gate 0 / PR #120) ist abgeschlossen und nicht wiederzuverwenden.
Generation 5 (P2-TA-03 / PR #117) ist abgeschlossen und nicht wiederzuverwenden.

Neue logische Arbeitseinheit → Rotation Standard live prüfen und frische Session verwenden, wenn vorgeschrieben.

## 8. Exakter nächster Technical-Lead-Schritt

**Kein Produkt-Folgeslice ist durch diesen Handoff freigegeben.**

AP-5 Gate 0 liegt als Audit/Architecture-Slice auf Issue #128 und wartet auf unabhängigen Technical-Lead-Finalreview. Das ist **kein** AP-5-Runtime- und **kein** C2-Start. P2-TA-04 C1 ist integriert (PR #126). Production C1 ist als `20260828015304` angewendet und live verifiziert. Nicht erneut anwenden.

Der nächste Chat / Technical Lead muss zuerst live rekonstruieren und erst danach entscheiden, welcher Slice nach Binding Build Order tatsächlich sinnvoll und zulässig ist.

Nicht automatisch starten:

- AP-5
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

Kein wesentlicher Fortschritt darf nur im Chat existieren. Neue Chats und Agenten beginnen mit den kanonischen Dateien, behandeln ältere Checkpoints/PR-Bodies als zeitgebundene Evidence und verifizieren danach den Live-Zustand selbst.
