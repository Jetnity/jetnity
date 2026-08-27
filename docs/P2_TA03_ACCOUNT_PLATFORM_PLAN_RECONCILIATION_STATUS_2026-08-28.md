# Jetnity – P2-TA-03 Account Platform Plan Reconciliation – Status

Stand: 28. August 2026  
Status: **AUTHOR COMPLETE / DRAFT-PR / KEIN READY / KEIN MERGE / KEINE AP-5-RUNTIME**  
Workstream: Account / Traveller  
Cursor-Agent: **`Account plattform audit vorbereitung 5`**  
Issue: [#116](https://github.com/Jetnity/jetnity/issues/116)  
Branch: `docs/p2-ta-03-account-plan-reconciliation`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/117

> Live-Evidence gewinnt. Vorbereitungs-SHAs und „reserviert / noch nicht gestartet“ sind historische Start-Evidence.

## 1. Live-Start dieses Agenten

| Feld | Wert |
| --- | --- |
| `origin/main` bei Start | `43aef6431aeea619ea896d456e16579b1034b9dd` – Merge PR #115 |
| Übergebener Branch-Head | `9d09000fdc8119cfad9a95e00f616c311e48102f` |
| Merge-Base gegen `origin/main` | `43aef6431aeea619ea896d456e16579b1034b9dd` |
| Ahead / Behind bei Start | **4 ahead / 0 behind** |
| Issue #116 | OPEN |
| Draft-PR #117 | OPEN / Draft / MERGEABLE |
| Historischer PR #39 | OPEN / Draft / **historical only** |
| Parallel offene PRs | #88, #52, #50, #40, #39, #28 – historical/fremd; nicht angefasst |
| Supabase | default `main` `qscbgcdmivbbnzrcyegn` ACTIVE_HEALTHY; non-default `develop` ACTIVE_HEALTHY; **keine Mutation** |

Vorbereitungs-CI auf Head `9d09000f` (historisch vor diesem Authoring):

- GitHub Actions Run `33126691658` SUCCESS
- Vercel Preview Inspector `3ewbdr2mJjeotVf23k769dhakmvj` READY

Diese Werte sind **Start-Evidence**. Der finale Agent-Head muss live neu geprüft werden.

## 2. Was dieser Slice geliefert hat

Nur Dokumentation / Architektur / Continuity:

1. Kanonischer Plan `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`
2. ADR-0179 in `DECISIONS.md`
3. ADR-0178-Nachtrag: P2-TA-06 ist integriert (pre-merge-Sätze markiert)
4. Status, Handoff, Self-Review
5. Continuity-Zeiger in Start/Handoff/Roadmap/Active Work/Build Order/Architecture
6. Agent-Rotation auf Generation 5 aktualisiert

Keine Runtime-, Migrations-, Config- oder Schema-Datei.

## 3. Fachliche Kerngebnisse

| Aussage | Klasse | Evidence |
| --- | --- | --- |
| AP-1–AP-4 sind integriert | **integrated** | ROADMAP, ADR-0152/0153/0160/0177, PR #108 |
| P2-TA-06 ist integriert | **integrated** | PR #113, Issue #112 CLOSED, ADR-0178-Nachtrag |
| Historischer Plan nur auf PR #39 | **historical** | Branch 11/513 vs `main` |
| Kanonischer Plan jetzt rekonstruiert | **current auf diesem Branch** | ADR-0179 |
| Current Traveller Truth bleibt trip-scoped | **current** | ADR-0102, ADR-0117, `types/trips.ts` |
| AP-7 ohne Vertrag | **gated** | kein Registry-Schema auf `main` |
| `/privacy` `/terms` 404 | **current residual** | D0-P1-03; keine Pages |
| Consumer-AAL2 nicht Pflicht | **current** | Middleware Auth-only; Admin-AAL2 getrennt |
| Marketing hat keine zweite Consent-Wahrheit | **current** | kein CRM-Consent; CookieConsent orphan |
| Dieser Slice startet AP-5 nicht | **current** | Non-Scope eingehalten |

## 4. AP-5–AP-12 neue Einordnung

| Slice | Einordnung | Nächster sinnvoller Schnitt | Gate |
| --- | --- | --- | --- |
| AP-5 Sicherheit | **not started** | In-Account-Passwort, Sessions, Logout-all ohne Schema, wenn API reicht | Auth-Shared; PO nur bei MFA/AAL-Grundlogik |
| AP-6a Legal | **not started** | echte `/privacy` `/terms` mit PO-/Legal-Text | Legal-/PO-Inhalt; kein Text erfinden |
| AP-6b Privacy-DB | **gated** | Consent, Export, Delete | PO + Migration + Admin-Overlap |
| AP-7 Registry | **gated / Shared-Contract-Blocker** | zuerst ADR-Nachfolger + PO | Identity/RLS/Traveller/Guest→Account |
| AP-8 Reiseprofil | **gated** | Prefs ≠ Traveller | Identity/Profil |
| AP-9 Favoriten | **not started** | nach Nutzenfrage | neue Persistenz isolierbar |
| AP-10 Buchungsübersicht | **not started** | read-only Aggregation | keine Fake-Commercial-Truth |
| AP-11 Notifications | **not started** | nach Consent-Naht | keine Identity-Payloads |
| AP-12 Entitlement | **gated** | Platzhalter/Port, nicht `payments` | Payments-live = PO |

Default-Reihenfolge bleibt AP-5 → AP-6a → Shared serial. Dokumentierte Parallelität: AP-6a darf wegen D0-P1-03 unabhängig assigned werden. Das ist keine Build-Order-Änderung.

## 5. Shared-Contract- und Product-Owner-Blocker

**Für P2-TA-03 selbst:** keiner.

**Für spätere Runtime:**

- **Shared-Contract-Blocker:** AP-7. Current Truth würde sich verschieben. Kein Contract in diesem PR.
- **Product-Owner-Blocker später:** AP-6a Inhalt; AP-6b Persistenz/Delete; AP-5 nur bei fundamentaler Auth/MFA/AAL-Änderung; AP-7; AP-8 Identity; AP-12 live; Pass/MRZ/Biometrie immer.

Kein stiller Shared-Contract wurde geändert.

## 6. Self-Review (kurz)

Geprüft:

- Scope nur Docs/Architecture/Continuity;
- keine Runtime-/Migration-/Config-Datei;
- AP-1–AP-4 nicht neu geplant;
- PR #39 nicht als Current Truth importiert;
- Traveller-Invariante unverändert;
- Agent-Rotation und Merge-Autonomie nicht auf den historischen Plan zurückgesetzt;
- Supabase nicht mutiert;
- Parallel-PRs nicht angefasst;
- Links auf Task/Issue/PR/ADRs gesetzt.

Offen bis Finalreview: Exact-Head Actions/Vercel auf dem **finalen** Author-Head; unabhängiger Technical-Lead-Review.

## 7. Nächster Schritt

Kein Folgeslice. Nicht Ready. Nicht mergen. Technical Lead reviewed Draft-PR #117 unabhängig.
