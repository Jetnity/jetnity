# Requirements Provider Groundwork Gate 0 – Audit Task – 2026-08-30

Status: **AUTHORIZED / AUDIT-ONLY / PROVIDER-NEUTRAL / NO LIVE ACTIVATION**  
Issue: #288  
Baseline: `main@60e12dd5cf0916708e0bc87219b233861b387e7d`  
Branch: `audit/requirements-provider-groundwork-g0-2026-08-30`  
Cursor-Agent: **`Jetnity requirements provider groundwork 1`**

## 1. Ziel

Jetnity besitzt bereits eine provider-neutrale Travel-Requirements-/Readiness-Engine, Multi-Citizenship-/Multi-Document-Truth und einen integrierten provider-neutralen Server-Transport-Core. Es gibt aber weiterhin **keinen echten Requirements-Provider**: `requirementsProviderAus()` ist fail-closed `null`.

Dieser Slice entscheidet oder aktiviert **keinen** Provider. Er rekonstruiert den heutigen Vertrag vollständig, revalidiert historische Readiness-/Provider-Annahmen und erstellt die belastbare Evidence, damit der Technical Lead anschließend den kleinsten verantwortbaren Implementierungs- oder Product-Owner-Gate-Schritt bestimmen kann.

## 2. Pflichtlektüre

Vor jeder Analyse vollständig lesen:

1. `JETNITY_START_HERE.md`
2. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
3. `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
4. `JETNITY_HANDOFF.md`
5. `docs/ACTIVE_WORK_STATUS.md`
6. `docs/CHATGPT_TECHNICAL_LEAD_POST_CLEANUP_CHECKPOINT_2026-08-30.md`
7. `docs/JETNITY_BINDING_BUILD_ORDER.md`
8. `ROADMAP.md`
9. `ARCHITECTURE.md`
10. `DECISIONS.md`
11. `docs/PROVIDER_READINESS_AUDIT.md`
12. `docs/PROVIDER_READINESS_MATRIX.md`
13. `docs/PROVIDER_READINESS_SHARED_CONTRACT_PROPOSAL.md`
14. `docs/PROVIDER_READINESS_IMPLEMENTATION_SLICES.md`
15. `docs/PROVIDER_S5B_PERSISTENCE_STATUS_2026-08-29.md`
16. `docs/ADR_0199_PROVIDER_ADAPTER_CORE_FOUNDATION.md`
17. aktuelle Traveller-/Multi-Citizenship-Audits vom 29./30. August, soweit für Requirements relevant.

Current code mindestens:

- `lib/readiness/provider.ts`
- `lib/readiness/engine.ts`
- `lib/readiness/official.ts`
- `lib/readiness/domain.ts`
- `lib/readiness/party.ts`
- `lib/readiness/kontext.ts`
- `lib/readiness/traveller-kontext.ts`
- relevante `*.test.ts`
- `types/trips.ts` für `OFFICIAL_REQUIREMENT_TYPES`
- `lib/server/providers/core/*`
- `lib/provider-ops/*`
- `lib/commercial-provenance/*`
- alle aktuellen Readiness API-/Workspace-Caller.

## 3. Live-Precheck vor Audit

Vor dem ersten Deliverable:

- `origin/main` / GitHub `main` live prüfen;
- offene PRs/Issues auf denselben Requirements-/Readiness-Provider-Scope prüfen;
- Branch gegen live `main`: Merge-Base + ahead/behind dokumentieren;
- falls `main` seit Task-Baseline weitergelaufen ist, **nicht blind weitermachen**: rebasen/mergen nur scope-sicher und dokumentieren, sonst STOP für TL;
- kein historisches Dokument als Current Truth übernehmen, wenn Live-Code widerspricht.

## 4. Audit-Fragen

### 4.1 Current Contract

Evidence-basiert dokumentieren:

- exakten `RequirementsProvider`-Port und alle Felder;
- welche Inputs tatsächlich serverseitig erzeugt werden;
- welche Inputs aus Trip Snapshot / Account Registry / Route Truth stammen;
- welche Informationen bewusst **nicht** persistiert oder übertragen werden;
- Requirement-Granularität über Traveller × Credential Option × Destination × Requirement Type × Transit Country;
- Missing Facts, unknown/unavailable/error/stale/insufficient_context;
- Authority, Source URL, rule reference, checkedAt, validFrom/validUntil;
- `optionEligibility` und `optionMandate`;
- Konflikt-/Duplikat-/Completeness-Verhalten;
- welche Hard Truth ausschließlich Provider-/Official-Evidence erzeugen darf.

### 4.2 Multi-Citizenship / Multi-Document

Verbindliche Invariante:

> Ein Reisender → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.

Explizit prüfen:

- kein Default-Pass;
- kein Default-Citizenship;
- Issuer Country ≠ Citizenship;
- keine `documents[0]`-/`evaluations[0]`-Wahrheit;
- Residence nicht als Citizenship umdeuten;
- Credential-Optionen separat evaluierbar;
- Transit vollständig pro relevantem Transitland;
- fehlende Facts bleiben fail-closed.

### 4.3 Historical S4 Reconciliation

Die historische S4-Idee in `PROVIDER_READINESS_IMPLEMENTATION_SLICES.md` gegen Current Truth revalidieren. Für jeden Punkt exakt klassifizieren:

- `CURRENT / STILL NEEDED`
- `ALREADY INTEGRATED`
- `SUPERSEDED`
- `NEEDS PRODUCT/PROVIDER DECISION`

Insbesondere:

- `RequirementsProvider.evaluate(..., signal?)` / Timeout;
- Kill-Switch/enablement;
- serverseitiger Party Load;
- Body-Cap / Multi-Traveller;
- Error-/Outcome-Semantik;
- Observability;
- Cache/Licensing defaults;
- Adapter-Core-Abgrenzung.

Nicht automatisch alten S4-Codeauftrag wiederholen.

### 4.4 Provider/Official-Truth Selection Groundwork

Nur öffentlich belegbare aktuelle Informationen verwenden. Jede externe Aussage mit URL + Abrufdatum + Evidence-Klasse dokumentieren.

Bewerte glaubwürdige Kandidaten entlang Jetnitys tatsächlichem Vertrag, nicht anhand Marketingnamen. Matrix mindestens für:

- Länder-/Destination-Coverage;
- Visa/Entry/Passport/Transit-Abdeckung;
- Multi-Citizenship / Document-type / issuer / residence / transit Inputs;
- strukturierte Machine-Readable Outputs;
- Source/Authority/Rule Reference;
- Freshness/validity semantics;
- Test-/Sandbox-Möglichkeiten;
- Rate limits / expected cost information, **nur soweit öffentlich belegt**;
- Lizenz-/Caching-/Display-/Attribution-Grenzen;
- Datenschutz / Datenminimierung;
- EU/CH-relevante Datenverarbeitung, soweit öffentlich belegbar;
- Commercial/contract unknowns ausdrücklich `unknown`;
- Eignung für Jetnitys server-only Adapter Core;
- Fähigkeit, keine LLM-/scraped truth nötig zu machen.

Öffentliche Marketing-/Dokumentationsaussage ist **kein** Vertrag, keine Lizenzfreigabe und keine Production-Freigabe.

### 4.5 Privacy / Sensitive Data Boundary

Dieser Gate-0-Slice darf keine neuen sensitiven Felder vorschlagen, ohne sie als besonderes PO-Gate zu markieren.

Verbotener Scope ohne separate Entscheidung:

- Passport-/Document-Nummern;
- MRZ;
- Scans/Bilder;
- Biometrie;
- DOB;
- Health-/Vaccination-Daten;
- externe Übertragung zusätzlicher sensitiver Identitätsdaten.

Wenn ein Kandidat solche Daten für bestimmte Produkte verlangt, nur als **future gated requirement** dokumentieren, nicht implementieren.

### 4.6 Architecture Boundaries

Explizit bestätigen oder als Gap markieren:

- `lib/readiness/*` bleibt fachliche Requirements Domain;
- `lib/server/providers/core/*` bleibt Outbound-Transport;
- `lib/provider-ops/*` bleibt Operations-/Inbound-Hülle;
- Commercial Provenance ist nicht Official Requirements Truth;
- kein UniversalProvider;
- keine zweite Traveller-/Route-/Commercial-Wahrheit;
- LLM/Assistant ist niemals Hard-Truth-Authority.

## 5. Pflicht-Deliverables

Der Agent darf in diesem Slice ausschließlich folgende neue task-spezifische Dateien hinzufügen/ändern:

1. `docs/REQUIREMENTS_PROVIDER_GROUNDWORK_AUDIT_2026-08-30.md`
2. `docs/REQUIREMENTS_PROVIDER_SELECTION_MATRIX_2026-08-30.md`
3. `docs/REQUIREMENTS_PROVIDER_CONTRACT_GAP_MAP_2026-08-30.md`
4. `docs/REQUIREMENTS_PROVIDER_GROUNDWORK_STATUS_2026-08-30.md`
5. `docs/REQUIREMENTS_PROVIDER_GROUNDWORK_SELF_REVIEW_2026-08-30.md`
6. `docs/REQUIREMENTS_PROVIDER_GROUNDWORK_HANDOFF_2026-08-30.md`

Dieser Task selbst ist Technical-Lead-authored und darf nicht inhaltlich umgedeutet werden.

Keine globalen Current-State-Dateien durch den Agenten ändern. Das übernimmt der Technical Lead nach unabhängigem Review/Integration.

## 6. Pflicht-Risikoklassifikation

Mindestens P0/P1/P2/P3 getrennt ausweisen. Kein künstliches Hochstufen.

Besonders prüfen:

- falsche Official Truth / falsche Visa-/Transit-Aussage;
- incompletes Multi-Credential-Ergebnis als clean;
- stale Provider-Daten als current;
- fehlende Authority/Source als belegte Official Truth;
- sensitive-data overcollection;
- Secret-/Credential-Leak;
- uncontrolled paid calls / missing cost guard;
- unklare licensing/cache/display rights;
- Development-/Production-Vertragsdrift, soweit Requirements-Slice berührt.

## 7. Definition of Review-Ready

Vor Handoff:

- `origin/main` erneut live prüfen;
- Branch Merge-Base / ahead / behind dokumentieren;
- Diff muss ausschließlich Task + sechs Audit-Deliverables enthalten;
- keine Runtime-/Config-/Migration-/Workflow-/Asset-Datei geändert;
- Links/Quellen auf Aktualität und Evidence-Klasse geprüft;
- keine Secrets/Userdaten in Deliverables;
- keine Providerwahl als bereits beschlossen darstellen;
- keine Production-/Commercial-/Privacy-Gate-Freigabe behaupten;
- Self-Review mit konkreten Gegenargumenten/Unsicherheiten;
- exakten Branch-Head und alle Changed Files im Handoff festhalten;
- **STOPP** für unabhängigen Technical-Lead-Review.

Docs-only: kein künstlicher Runtime-Testzwang. Mindestens Repository-Diff-/Link-/Markdown-/Scope-Sanity; falls vorhandene Repo-Checks durch die Docs berührt werden, diese ausführen und dokumentieren.

## 8. Harte Non-Scope-Grenzen

- keine Runtime-/Config-/Migration-/RLS-/Auth-/MFA-/AAL-Änderung;
- keine Supabase-/Vercel-/Production-Mutation;
- keine Provider-Anmeldung, Vertragsannahme, Vendor-Kommunikation;
- keine Credentials/Secrets;
- keine echten API-Calls / keine paid calls;
- keine Runtime-Factory-Aktivierung;
- kein Commercial-Provenance-Mint;
- kein `live_api`, `persisted_snapshot`, TW-8 oder TW-9;
- keine Legal-Copy;
- keine Public-/Domain-/Indexing-Aktivierung;
- keine neue recurring cost;
- kein Follow-up-Slice.

## 9. Autoritätsregeln

- Agent-Self-Review ≠ Technical-Lead-PASS.
- Cursor-Agent setzt niemals Ready.
- Cursor-Agent merged niemals.
- Jede Head-Änderung invalidiert frühere Exact-Head-Gates.
- CHANGES REQUIRED wird in derselben Agent-Session repariert.
- Ein späterer Implementierungs-Slice erhält einen neuen versionierten Auftrag und eine neue Agent-Generation.

## 10. STOP

Nach vollständigem Handoff **STOPP**.

Kein Ready. Kein Merge. Kein Provider-Start. Kein Folgeslice.
