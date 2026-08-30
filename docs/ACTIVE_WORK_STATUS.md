# Jetnity – Active Work Status

Stand: 31. August 2026  
Status: **CURRENT / REQUIREMENTS PROVIDER GATE 0 CLOSED / NO ACTIVE CURSOR SLICE / LIVE-EVIDENCE GEWINNT**

Aktuellster vollständiger Checkpoint:

`docs/CHATGPT_TECHNICAL_LEAD_REQUIREMENTS_GATE0_CLOSED_2026-08-31.md`

## 1. Aktueller verifizierter Main-Stand vor diesem Continuity-PR

`1327759d9210386ae39303c65461e2fce864b5fd`

- PR #290 **MERGED**.
- finaler PR-Head `74e214606c9f881ce0cd19aef3ed7865eb304d3b`.
- Exact-Head PR-CI #1412 / `33339311538`: **SUCCESS**.
- Vercel Preview `dpl_BGFuA8WmeiWK5YKWsRq9SV1aSHVN`: **READY** exakt auf `74e21460...`.
- Post-Merge Main-CI #1413 / `33339603883`: **SUCCESS** exakt auf `1327759d...`.
- Vercel Production `dpl_9Vgk6yeZLe6tSZvmAqypYfUDca2y`: **READY** exakt auf `1327759d...`.
- Issue #288 **CLOSED / completed**.
- Ruleset `Jetnity main protection` / ID `21875372`: active; strict checks; bypass leer.

PR #289 bleibt **CLOSED / NOT MERGED / MECHANICALLY SUPERSEDED**. Grund war ausschließlich der GitHub-Connectorfehler beim Draft→Ready-Wrapper; Schutzregeln wurden nicht gelockert oder umgangen.

**Wichtig:** Dieser TL-only Continuity-PR bewegt `main` nach dem obigen Gate-0-Merge erneut. Finalen Main-SHA nach Merge live prüfen.

## 2. Aktiver Arbeitsblock

**Kein Produkt-/Runtime-Slice aktiv. Kein Cursor-Agent aktiv.**

Gate 0 ist abgeschlossen und dient nur noch als Evidence-/Design-Basis.

Letzter Agent:

**`Jetnity requirements provider groundwork 1`**  
Generation: **1**  
Session: `bc-77badb21-f262-4ee2-86ce-f71a5aa1f051`  
Status: **STOPPED**.

Der Agent hat CR-1 bis CR-7 in derselben Session bearbeitet. Technical-Lead Exact-Head Review und Merge sind abgeschlossen.

## 3. Current Requirements / Official Truth Boundary

- `RequirementsProvider` bleibt provider-neutral.
- `requirementsProviderAus()` bleibt fail-closed `null`.
- kein echter Requirements-/Visa-/Entry-Provider aktiviert.
- keine Provider-Secrets, paid calls, Verträge oder Live-Runtime-Aktivierung.
- Trip Snapshot bleibt einzige Current Truth für die konkrete Reise.
- Account Registry bleibt Wiederverwendungsquelle und keine automatische Evaluate-Authority.
- Production-Workspace übergibt derzeit keine serverseitigen Official Evaluations und fällt fail-closed auf unknown zurück.
- bestehender serverseitiger Provider Adapter Core bleibt vorgesehener Outbound-Transport; kein zweiter HTTP-Stack.

Kanonisches Traveller-Modell:

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Kein Default-/Primary-/Preferred-/Chosen-Pass, keine Default-Citizenship, Issuer Country ≠ Citizenship, kein `documents[0]` oder `evaluations[0]` als Product Truth.

## 4. Offene Risiken aus Gate 0

### P1

- `RequirementsProvider.evaluate(...)` ohne Provider-`AbortSignal` / explizites Timeout.
- kein Readiness-Domain-Kill-Switch für einen später aktiven Provider.
- `officialFrische()` ohne maximale `checkedAt`-TTL; vor realem Adapter bounded fail-closed Freshness-Policy erforderlich.
- `checkedAt` darf nicht mit Vendor-`lastUpdatedAt` gleichgesetzt werden.
- vollständige Multi-Citizenship-/Multi-Document-/Credential-/Transit-Mapping-Pflicht.
- Sherpa-Origin→Nationality-Fallback für Jetnity verboten.
- Sherpa max. 3 Transit-Nodes vs Jetnity bis 12: niemals silent drop; nur vollständige Split/Aggregation oder fail-closed unsupported/unknown.
- Development-vs-Production-Supabase-Migration-History vor migrationsnaher Arbeit live reconciliieren.

### P2

- kein realer Requirements Provider → keine live option-spezifische Visa/Entry/Transit Official Truth.
- Workspace erhält noch keine serverseitigen Official Evaluations.
- 8-KB-Body-Cap kann große Parties begrenzen.
- keine Readiness-spezifischen Provider-Ops-Observability-Events.

### P0

Kein aktueller Production-Incident, keine Fake-Official-Truth-Aktivierung und kein Secret-Leak aus Gate 0 belegt.

## 5. Provider Selection

**Kein Provider gewählt.**

Timatic/IATA-Familie und Sherpa bleiben Research-Kandidaten. Öffentliche technische/Marketing-Evidence ist keine Vertrags-, Kosten-, Lizenz- oder DPA-Wahrheit.

Reale Providerwahl, Vertrag/DPA, Secrets/API Keys, paid calls und Live-Aktivierung bleiben besondere Product-Owner-Gates.

## 6. Supabase Boundary

Gate 0 hat Supabase nicht mutiert.

Letzter Gate-0-Precheck:

- Production `qscbgcdmivbbnzrcyegn`: `ACTIVE_HEALTHY`.
- Development `yfvbxvijcorffwxbxahl`: `ACTIVE_HEALTHY`.
- Development-Migration-History weicht von Production ab.

Vor betroffenem Scope live erneut prüfen.

## 7. Product-Owner-Gates bleiben geschlossen

- reale Providerwahl / Vertrag / Commercial Terms / DPA
- Provider Secrets / API Keys
- paid calls / Live-Aktivierung
- Production Runtime Writer / Principal / Commercial Write
- Production-Migrationen oder große RLS/Ownership-Änderungen
- fundamentale Auth/MFA/AAL-Änderungen
- sensitive Passport-/MRZ-/Biometrie-/Scan-Speicherung oder zusätzliche externe sensitive transfers
- Payments
- neue recurring cost > USD 100/Monat
- Public Launch / Indexing / Domain Cutover / Store Live

## 8. FIRST NEXT ACTION

**Kein Folgeslice automatisch starten.**

1. finalen `main` nach diesem Continuity-PR live verifizieren;
2. offene PRs/Issues/Agentenstatus live prüfen;
3. Gate-0-Findings gegen aktuellen Code revalidieren;
4. bei DB-/Migration-/Security-Scope Supabase live prüfen;
5. neuen bounded Task erst danach definieren.

Wahrscheinlicher Kandidat: provider-neutral **Requirements Truth-Ops S4-R1** mit AbortSignal/Timeout, Readiness-Kill-Switch, technischer Failure-Semantik und bounded Freshness/TTL; Factory bleibt `null`. **Noch nicht gestartet.**

**Live-Evidence gewinnt immer.**
