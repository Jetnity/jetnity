# Jetnity – Technical Lead Requirements Gate 0 Closure Checkpoint

Stand: 31. August 2026  
Status: **CURRENT / REQUIREMENTS PROVIDER GATE 0 CLOSED / NO ACTIVE CURSOR SLICE / LIVE-EVIDENCE GEWINNT**

Dieser Checkpoint ersetzt für den aktuellen Übergabestand den vorherigen Post-Cleanup-Checkpoint als erste Continuity-Quelle. Alte Dokumente bleiben historische Evidence; Live-Evidence gewinnt immer.

## 1. Verifizierter Main-Stand nach Gate 0

Gate-0-Merge auf `main`:

`1327759d9210386ae39303c65461e2fce864b5fd`

Evidence:

- PR #290 **MERGED**; Merge-Commit `1327759d9210386ae39303c65461e2fce864b5fd`.
- PR #290 finaler Head `74e214606c9f881ce0cd19aef3ed7865eb304d3b`.
- PR #290 Exact-Head CI #1412 / Run `33339311538`: **SUCCESS**.
- PR #290 Vercel Preview `dpl_BGFuA8WmeiWK5YKWsRq9SV1aSHVN`: **READY** exakt auf `74e21460...`.
- Post-Merge Main-CI #1413 / Run `33339603883`: **SUCCESS** exakt auf `1327759d...`.
- Vercel Production `dpl_9Vgk6yeZLe6tSZvmAqypYfUDca2y`: **READY** exakt auf `1327759d...`.
- Issue #288: **CLOSED / completed**.
- Ruleset `Jetnity main protection` / ID `21875372`: **active**, PR erforderlich, strict required checks, Conversation Resolution, Merge-only, bypass leer.

PR #289 ist **CLOSED / NOT MERGED / MECHANICALLY SUPERSEDED**. Grund war ausschließlich der bekannte GitHub-Connector-Fehler beim Draft→Ready-Wrapper (`Repository.fullDatabaseId`). Die Schutzregeln wurden nicht gelockert oder umgangen; derselbe geprüfte Branch wurde als non-draft PR #290 erneut vollständig gegatet und anschließend normal gemergt.

## 2. Cursor-Agent

Letzter Gate-0-Agent:

**`Jetnity requirements provider groundwork 1`**  
Generation: **1**  
Session: `bc-77badb21-f262-4ee2-86ce-f71a5aa1f051`

Status: **STOPPED**.

Der Agent hat CR-1 bis CR-7 in derselben Session bearbeitet. Der Technical Lead hat die finalen Heads unabhängig geprüft. Es läuft **kein** Cursor-Agent und es wurde **kein** Folgeslice gestartet.

## 3. Gate-0-Ergebnis – Current Requirements Truth

Bestätigt:

- `RequirementsProvider` bleibt provider-neutral.
- `requirementsProviderAus()` bleibt fail-closed `null`.
- kein echter Requirements-/Visa-/Entry-Provider ist aktiviert.
- keine Provider-Secrets, keine paid calls, kein Vertrag und keine Runtime-Aktivierung.
- Trip Snapshot bleibt einzige Current Truth für die konkrete Reise; Account Registry bleibt Wiederverwendungsquelle.
- Production-Workspace erhält aktuell keine serverseitigen Official Evaluations und fällt fail-closed auf unknown zurück.
- vorhandener Provider Adapter Core bleibt der vorgesehene serverseitige Outbound-Transport; kein zweiter HTTP-Stack / kein UniversalProvider.
- aktueller Provider-Ops-Cost-Guard für Readiness ist in-memory; persistente Paid-Call-/S6-Grenzen bleiben vor echten Calls notwendig.

Kanonisches Traveller-Modell bleibt verbindlich:

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Kein Default-/Primary-/Preferred-/Chosen-Pass, keine Default-Citizenship, Issuer Country ≠ Citizenship, kein `documents[0]` oder `evaluations[0]` als Product Truth.

## 4. Wesentliche Risiken / Aktivierungs-Gates

### P1 – vor realem Adapter / Provider-Aktivierung

1. `RequirementsProvider.evaluate(...)` hat aktuell kein Provider-`AbortSignal` / explizites Timeout.
2. Es fehlt ein Readiness-Domain-Kill-Switch für einen später nicht-null Provider.
3. `lib/readiness/official.ts::officialFrische()` besitzt kein maximales Alter / TTL für `checkedAt`. Alter unveränderter Evidence kann bei fehlendem `validUntil` zu lange als `current` gelten. Vor realem Adapter ist eine bounded, fail-closed Freshness-/TTL-Policy Pflicht.
4. Jetnity-`checkedAt` (Retrieval/Evaluation) darf nicht still mit Vendor-`lastUpdatedAt` / Source-Update-Time gleichgesetzt werden.
5. Vendor-Mapping muss alle Traveller-/Citizenship-/Document-/Credential-Optionen und den vollständigen Transit-Kontext erhalten.
6. Sherpas öffentlich dokumentierte Empfehlung, bei unbekanntem Pass die Nationalität aus dem Origin abzuleiten, ist für Jetnity **verboten**. Missing nationality bleibt `unknown` / `insufficient_context`.
7. Sherpa dokumentiert öffentlich maximal 3 Transit-Nodes, Jetnity akzeptiert bis zu 12 `transitCountryCodes`. Ein späterer Adapter darf niemals Transitländer still verwerfen; nur nachweisbar vollständige Split/Aggregation oder fail-closed unsupported/unknown.
8. Development-vs-Production-Supabase-Migration-History bleibt vor jedem migrationsnahen Slice live zu reconciliieren.

### P2

- kein realer Requirements Provider → keine live option-spezifische Visa/Entry/Transit Official Truth.
- Workspace erhält noch keine serverseitigen Official Evaluations.
- 8-KB-Body-Cap der öffentlichen Requirements-API kann große Multi-Traveller-/Multi-Document-Parties begrenzen.
- keine Readiness-spezifischen Provider-Ops-Observability-Events.

### P0

Kein aktueller Production-Incident, keine Fake-Official-Truth-Aktivierung und kein Secret-Leak im Gate-0-Scope belegt.

## 5. Provider Selection Groundwork

**Kein Provider wurde gewählt.**

- Timatic/IATA-Familie bleibt Kandidat. Öffentliche Evidence bestätigt relevante Reise-/Planungsflächen und dieselbe Timatic-Datenbasis, beweist aber nicht Jetnitys späteren AutoCheck-REST-Vertrag, Multi-Citizenship-/Credential-Option-Semantik, Preis, Lizenz oder Minimal-PII-Vertrag.
- Sherpa bleibt Kandidat mit klarer öffentlich dokumentierter Travel-API-Form. Jetnity muss Origin→Nationality-Fallback und Transit-Limits strikt fail-closed überbrücken. Öffentliche Quota-/Cache-Angaben sind keine Vertrags-/Preis-/Lizenz-Wahrheit.
- Scraping-/undokumentierte Website-Wege sowie reine Ranking-/Mobility-Indizes sind keine Official-Hard-Truth-Authority.

Reale Providerwahl, Vendor-Kontakt, Vertrag/DPA, API-Key/Secret, paid calls oder Live-Aktivierung bleiben besondere **Product-Owner-Gates**.

## 6. Supabase Boundary

Gate 0 hat Supabase **nicht** mutiert.

Letzter verifizierter Stand aus dem Gate-0-Precheck:

- Production `qscbgcdmivbbnzrcyegn`: `ACTIVE_HEALTHY`.
- Development `yfvbxvijcorffwxbxahl`: `ACTIVE_HEALTHY`.
- Production enthält die relevanten Persistence-Migrationen, darunter `20260829140000_trip_item_commercial_provenance` und `20260829210052_account_traveller_registry_persistence`.
- Development-Migration-History weicht nach Reset/Reconciliation von Production ab.

Vor jedem migrationsnahen Folgeslice erneut live prüfen; nicht aus diesem Checkpoint ableiten, dass die History inzwischen identisch ist.

## 7. Product-Owner-Gates bleiben geschlossen

Keine automatische Freigabe für:

- reale Providerwahl / Vertrag / Commercial Terms / DPA;
- Provider-Secrets / API Keys;
- paid calls / Live-Aktivierung;
- Production Runtime Writer / Principal / Commercial Write;
- Production-Migrationen oder große RLS/Ownership-Änderungen;
- fundamentale Auth/MFA/AAL-Änderungen;
- sensitive Passport-/MRZ-/Biometrie-/Scan-Speicherung oder zusätzliche externe sensitive transfers;
- Payments;
- neue recurring cost > USD 100/Monat;
- Public Launch / Indexing / Domain Cutover / Store Live.

## 8. FIRST NEXT ACTION

**Kein Folgeslice ist automatisch aktiv oder freigegeben.**

Vor neuer Arbeit:

1. `main`, offene PRs/Issues und aktuellen Agentenstatus live prüfen;
2. CI/Vercel live prüfen;
3. Supabase nur dann live prüfen, wenn der neue Scope DB/Security/Storage/Migration betrifft;
4. Gate-0-Findings gegen aktuellen Code revalidieren;
5. erst danach einen neuen bounded Slice definieren.

Wahrscheinlicher nächster technischer Kandidat ist provider-neutral **Requirements Truth-Ops S4-R1**:

- `AbortSignal` / Timeout-Vertrag;
- Readiness-Domain-Kill-Switch;
- technische Timeout/Abort/temporarily-unavailable Outcome-Semantik;
- bounded fail-closed Freshness-/TTL-Policy;
- vorhandenen Provider-Core wiederverwenden;
- Factory bleibt `null`;
- kein Vendor, keine Secrets, keine paid calls, keine Production-Migration.

Das ist **nur ein Kandidat und noch nicht gestartet**. Vor Start ist ein frischer Live-Precheck und ein neuer versionierter Task erforderlich.

**Live-Evidence gewinnt immer.**
