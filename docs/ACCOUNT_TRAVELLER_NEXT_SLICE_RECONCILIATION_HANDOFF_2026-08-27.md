# Jetnity – Account / Traveller Next Slice Reconciliation – Handoff

Stand: 27. August 2026  
Issue: #105  
Cursor-Anzeigename: **Account plattform audit vorbereitung 2**  
Für: neuen Chat / Technical Lead / späteren Account-Agenten

> Live-Evidence gewinnt. `963186f4` ist nur die historische Audit-Startbaseline.

## Zuerst lesen

1. Issue #105
2. `docs/ACCOUNT_TRAVELLER_NEXT_SLICE_RECONCILIATION_TASK_2026-08-27.md`
3. `docs/ACCOUNT_TRAVELLER_NEXT_SLICE_RECONCILIATION_2026-08-27.md`
4. `docs/ACCOUNT_TRAVELLER_NEXT_SLICE_RECONCILIATION_STATUS_2026-08-27.md`
5. danach erst historische Evidence: AP-3-Status, Next-Phase-Audit PR #76, P1-TA-02-Status PR #84, PR #39-Plan

## Baselines

| Art | SHA |
| --- | --- |
| Historische Audit-Startbaseline | `963186f4ec75501efd253a287131f464a5fd0fdb` (PR #102) |
| Aktueller Sync-`main` | `1c88b7e49453bb60cf9962d1dfa5bb3b652058ca` (Merge PR #106) |

Vor jeder Fortsetzung `main` und offene PRs neu prüfen.

## Was wahr ist

- AP-1 / AP-2 / AP-3 sind auf `main`.
- P1-TA-02 ist durch PR #84 geschlossen.
- Production-AAL2 ist angewendet; kein zweiter Apply.
- Traveller Truth bleibt trip-scoped: mehrere Citizenships, mehrere Dokumente, kontextabhängige Optionen.
- Kein Default-Pass. Issuer ≠ Citizenship.
- P2-TA-06 bleibt latent.
- AP-4 schreibt noch nicht; gespeichertes `archived` bleibt in `/reisen`-Gruppen sichtbar; Übersicht filtert `archived` nur lesend.
- AP-7 existiert nicht und bleibt gated.
- **Zum ersten Audit-Lauf** waren TW7-A-Drafts #104 und #106 beide offen. Historische Evidence.
- **Aktuell:** #104 CLOSED / superseded / nicht gemergt. **#106 integriert.** Issue #103 closed. Das frühere TW7-A-Parallelitätsgate ist **erfüllt**.

## Audit-Empfehlung

**`AP-4 IS NEXT ACCOUNT RUNTIME CANDIDATE`**

Keine Runtime-Freigabe durch diesen PR. AP-4 startet erst über einen eigenen neuen Technical-Lead-Task/Spec.

P2-TA-06 nicht automatisch vor AP-4. AP-7 erst nach ADR-Nachfolger + Product-Owner-Gate + Identity/RLS/Sensitive-Data-Gates.

Der fehlende historische Plan auf PR #39 ist kein dauerhafter Blocker.

## Was ein neuer Agent nicht tun darf

- diesen Audit als AP-4-Runtime-Start lesen
- `audit/account-platform` oder `audit/traveller-account-next-phase` als Basis verwenden
- TW7-A-Runtime von #106 zurückdrehen
- zwischen #104 und #106 wählen
- einen Registry-Contract erfinden
- Production / AAL2 / RLS / Auth ändern
- `NO ACCOUNT RUNTIME because #106` als aktuelle Endentscheidung wiederherstellen

## Nächster logischer Slice

Falls Technical Lead AP-4 freigibt: **neuer** nummerierter Account-Agent, eigener Branch von dann aktuellem `main`, eigener enger Task/Spec. Nicht dieser Agent, nicht dieser PR.
