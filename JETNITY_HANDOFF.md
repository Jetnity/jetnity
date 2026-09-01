# Jetnity – Handoff und nächste Schritte

Stand: 1. September 2026  
Status: **CURRENT HANDOFF / REQUIREMENTS PROVIDER GATE 0 CLOSED / DRAFT #413 0..N FLIGHT ORCHESTRATION AWAITING TL REVIEW / LIVE-EVIDENCE GEWINNT**

Aktuellster vollständiger Checkpoint:

`docs/CHATGPT_TECHNICAL_LEAD_REQUIREMENTS_GATE0_CLOSED_2026-08-31.md`

Verbindlicher Precheck:

`docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`

## 1. Verifizierter Übergabestand vor diesem Continuity-PR

Requirements-Gate-0-Merge auf `main`:

`1327759d9210386ae39303c65461e2fce864b5fd`

Evidence:

- PR #290 **MERGED**.
- PR #290 Head `74e214606c9f881ce0cd19aef3ed7865eb304d3b`.
- PR-CI #1412 / `33339311538`: **SUCCESS**.
- Vercel Preview `dpl_BGFuA8WmeiWK5YKWsRq9SV1aSHVN`: **READY** auf dem PR-Head.
- Post-Merge Main-CI #1413 / `33339603883`: **SUCCESS** exakt auf `1327759d...`.
- Vercel Production `dpl_9Vgk6yeZLe6tSZvmAqypYfUDca2y`: **READY** exakt auf `1327759d...`.
- Issue #288: **CLOSED / completed**.
- Ruleset `Jetnity main protection` / ID `21875372`: active, strict required checks, bypass leer.

PR #289 ist **CLOSED / NOT MERGED / MECHANICALLY SUPERSEDED** wegen des bekannten GitHub-Connectorfehlers `Repository.fullDatabaseId` beim Draft→Ready-Wrapper. Schutzregeln wurden nicht gelockert; #290 wurde als non-draft Ersatz auf demselben Branch erneut vollständig gegatet.

Der Continuity-PR, der diesen Handoff aktualisiert, bewegt `main` nochmals. Finalen SHA live verifizieren.

## 2. Agentenstatus

Aktueller Cursor-Agent für Draft-PR #413 / Issue #412:

**`Jetnity flight multi-provider orchestration 1`**  
Generation: **1**  
Session: `bc-c294a0b2-5ed8-411e-8131-5c06a254d2b8`

Status: **IMPLEMENTATION DELIVERED / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW**. Kein Ready, kein Merge, kein Folgeslice.

Letzter abgeschlossener Requirements-Agent bleibt historische Evidence:

**`Jetnity requirements provider groundwork 1`**  
Generation: **1**  
Session: `bc-77badb21-f262-4ee2-86ce-f71a5aa1f051`

## 3. Requirements / Travel Readiness Current Truth

- `RequirementsProvider` bleibt provider-neutral.
- `requirementsProviderAus()` bleibt fail-closed `null`.
- kein echter Requirements-/Visa-/Entry-Provider aktiviert.
- keine Secrets, paid calls, Providerverträge oder Runtime-Aktivierung.
- Trip Snapshot = einzige Current Truth für die konkrete Reise.
- Account Registry = wiederverwendbare Traveller-Fakten, nicht automatische Evaluate-Authority.
- Production-Workspace erhält noch keine serverseitigen Official Evaluations und bleibt fail-closed unknown.
- vorhandener Provider Adapter Core bleibt serverseitiger Outbound-Transport; kein zweiter HTTP-Stack / UniversalProvider.

Traveller Truth:

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Kein Default-/Primary-/Preferred-/Chosen-Pass, keine Default-Citizenship, Issuer Country ≠ Citizenship, kein `documents[0]` oder `evaluations[0]` als Product Truth.

## 4. Gate-0 Findings, die vor realem Provider relevant bleiben

### P1

- Provider-`AbortSignal` / Timeout fehlt im RequirementsProvider-Vertrag.
- Readiness-Domain-Kill-Switch fehlt.
- `officialFrische()` hat keine maximale `checkedAt`-TTL; bounded fail-closed Freshness-Policy erforderlich.
- `checkedAt` und Vendor-`lastUpdatedAt` dürfen nicht vermischt werden.
- vollständiges Traveller-/Citizenship-/Document-/Credential-/Transit-Mapping ist Pflicht.
- Sherpa-Origin→Nationality-Fallback ist für Jetnity verboten.
- Sherpa max. 3 Transit-Nodes vs Jetnity bis 12: kein silent drop.
- Development-vs-Production-Supabase-Migration-History vor migrationsnaher Arbeit live reconciliieren.

### P2

- kein echter Requirements Provider, daher keine live option-spezifische Official Entry/Visa/Transit Truth.
- Workspace ohne serverseitige Official Evaluations.
- 8-KB-Requirements-Body-Cap kann große Parties begrenzen.
- keine Readiness-spezifischen Provider-Ops-Observability-Events.

### P0

Kein aktueller Production-Incident, keine Fake-Official-Truth-Aktivierung und kein Secret-Leak aus Gate 0 belegt.

## 5. Provider Selection Groundwork

**Kein Provider gewählt.**

- Timatic/IATA-Familie bleibt Kandidat; öffentliche Evidence beweist nicht Jetnitys zukünftigen REST-Vertrag, Multi-Citizenship-/Credential-Semantik, Lizenz, Preis oder Minimal-PII-Vertrag.
- Sherpa bleibt Kandidat; dokumentierte Fallback-/Transit-Limits müssen strikt fail-closed überbrückt werden. Öffentliche technische Quoten/Cache-Angaben sind keine Vertrags-/Commercial-Truth.
- undokumentierte Website-/Scraping-Pfade und reine Ranking-/Mobility-Indizes sind keine Official-Hard-Truth-Authority.

Reale Providerwahl, Vendor-Kontakt, Vertrag/DPA, Secrets/API Keys, paid calls und Live-Aktivierung bleiben besondere Product-Owner-Gates.

## 6. Supabase

Gate 0 hat Supabase nicht mutiert.

Letzter Gate-0-Precheck:

- Production `qscbgcdmivbbnzrcyegn`: `ACTIVE_HEALTHY`.
- Development `yfvbxvijcorffwxbxahl`: `ACTIVE_HEALTHY`.
- Development-Migration-History weicht von Production ab.

Vor DB-/Migration-/RLS-/Storage-/Security-Scope live neu verifizieren.

## 7. GitHub Governance

Ruleset `Jetnity main protection`, ID `21875372`, active.

Required:

- PR;
- strict up-to-date checks;
- review-thread resolution;
- `Typecheck, Lint & Build`;
- `Auth-Konfiguration gegen config.toml`;
- `Vercel`;
- merge-only;
- bypass leer.

Draft→Ready-Connectorbug niemals durch Lockerung der Branch Protection kompensieren.

## 8. FIRST NEXT ACTION

**Kein Folgeslice ist automatisch freigegeben.**

Der nächste Technical-Lead-Zyklus beginnt mit einem frischen Live-Precheck von `main`, offenen PRs/Issues, CI/Vercel und Agentenstatus. Supabase wird nur bei betroffenem Scope erneut live geprüft.

Wahrscheinlicher nächster bounded Kandidat:

**Requirements Truth-Ops S4-R1**

- provider-neutral;
- `AbortSignal` / Timeout;
- Readiness-Kill-Switch;
- Timeout/Abort/temporarily-unavailable Outcome-Semantik;
- bounded fail-closed Freshness/TTL;
- vorhandenen Provider-Core wiederverwenden;
- Factory bleibt `null`;
- kein Vendor, keine Secrets, keine paid calls, keine Production-Migration.

Das ist **nur ein Kandidat, noch nicht gestartet**. Vor Start neuer versionierter Task + frischer Live-Precheck.

**Live-Evidence gewinnt immer.**
