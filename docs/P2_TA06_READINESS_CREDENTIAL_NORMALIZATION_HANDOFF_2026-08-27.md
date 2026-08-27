# Jetnity – P2-TA-06 Handoff

Stand: 27. August 2026  
Status: **DRAFT-PR #113 / LOKALE GATES GRÜN / EXACT-HEAD FOLGT / KEIN READY / KEIN MERGE**  
Cursor-Agent: **`Account plattform audit vorbereitung 4`**  
Issue: [#112](https://github.com/Jetnity/jetnity/issues/112)  
Branch: `cursor/p2-ta-06-credential-normalization-3317`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/113

## Zuerst lesen

1. GitHub Issue #112
2. `docs/P2_TA06_READINESS_CREDENTIAL_NORMALIZATION_TASK_2026-08-27.md`
3. `docs/P2_TA06_READINESS_CREDENTIAL_NORMALIZATION_STATUS_2026-08-27.md`
4. `docs/P2_TA06_READINESS_CREDENTIAL_NORMALIZATION_SELF_REVIEW_2026-08-27.md`
5. ADR-0178 in `DECISIONS.md`
6. `docs/TRAVELLER_ACCOUNT_NEXT_PHASE_AUDIT.md` Abschnitt 4.1 bleibt historische Evidence des latenten Findings

## Was gebaut wurde

| Fläche | Datei |
| --- | --- |
| Runtime | `lib/readiness/engine.ts` – `travellerNormalisieren` leitet N Optionen aus N Dokumenten ab |
| Tests | `lib/readiness/engine.test.ts` – eigener `P2-TA-06`-Block |
| Continuity | Task / Status / Handoff / Self-Review / ADR-0178 |

## Vertrag

- Kein Default-Pass.
- Kein `documents[0]` als Product Truth.
- Mehrere Dokumente bleiben mehrere Credential-Optionen.
- Issuer ≠ Citizenship.
- Explizite `credentialOptions` bleiben autoritativ.
- Legacy-Singular ohne Documents bleibt eine Kompatibilitätsoption.
- Ohne Dokument und ohne Legacy bleibt `:none`.
- Official bleibt fail-closed.

## Shared Contract

Kein Shared-Contract-Konflikt. Kein neuer Identity-/Registry-/RLS-Vertrag. Kein AP-7.

## Non-Scope eingehalten

Kein AP-5, kein AP-7, keine Migration, keine RLS-/Auth-/AAL-Änderung, kein Production-Write, kein Provider-/Homepage-/Search-Scope, Issue #109/#110 unberührt.

## Nächster Schritt

Unabhängiger Technical-Lead-Finalreview auf Exact Head. Autor-Agent merged nicht.
