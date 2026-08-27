# Jetnity – Account / Traveller Next Slice Reconciliation – Handoff

Stand: 27. August 2026  
Issue: #105  
Cursor-Anzeigename: **Account plattform audit vorbereitung 2**  
Für: neuen Chat / Technical Lead / späteren Account-Agenten

> Live-Evidence gewinnt. Zentrale Continuity-Dateien auf `main` können hinter diesem Stand liegen.

## Zuerst lesen

1. Issue #105
2. `docs/ACCOUNT_TRAVELLER_NEXT_SLICE_RECONCILIATION_TASK_2026-08-27.md`
3. `docs/ACCOUNT_TRAVELLER_NEXT_SLICE_RECONCILIATION_2026-08-27.md`
4. `docs/ACCOUNT_TRAVELLER_NEXT_SLICE_RECONCILIATION_STATUS_2026-08-27.md`
5. danach erst historische Evidence: AP-3-Status, Next-Phase-Audit PR #76, P1-TA-02-Status PR #84, PR #39-Plan

## Live-Baseline dieses Audits

`origin/main` `963186f4ec75501efd253a287131f464a5fd0fdb` (PR #102). Vor jeder Fortsetzung neu prüfen.

## Was wahr ist

- AP-1 / AP-2 / AP-3 sind auf `main`.
- P1-TA-02 ist durch PR #84 geschlossen.
- Production-AAL2 ist angewendet; kein zweiter Apply.
- Traveller Truth bleibt trip-scoped: mehrere Citizenships, mehrere Dokumente, kontextabhängige Optionen.
- Kein Default-Pass. Issuer ≠ Citizenship.
- P2-TA-06 (`documents[0]` in `travellerNormalisieren`) ist latent, kein aktueller App-Pfad.
- AP-4 schreibt noch nicht; gespeichertes `archived` bleibt in `/reisen`-Gruppen sichtbar.
- AP-7 existiert nicht und bleibt gated.
- Parallel laufen TW7-A-Drafts **#104 und #106**. Deren Dateien nicht anfassen.

## Was dieser Audit entschieden hat

**`NO RUNTIME YET`**

Kein AP-4-Start. Kein P2-TA-06-Start. Kein AP-7-Contract. Kein Ready. Kein Merge.

## Was ein neuer Agent nicht tun darf

- diesen Audit als Runtime-Freigabe lesen
- `audit/account-platform` oder `audit/traveller-account-next-phase` als Basis verwenden
- TW7-A-Dateien ändern
- einen Account-Traveller-Registry-Contract erfinden
- Production / AAL2 / RLS / Auth ändern
- zentrale Continuity-Dateien nur deshalb umschreiben, weil sie stale sind – das konkurriert mit TW7-A

## Empfohlene nächste menschliche Entscheidung

Technical Lead entscheidet nach Finalreview:

1. welche TW7-A-Linie (#104 oder #106) gilt;
2. ob später ein latenter P2-TA-06-Hardening-Slice mit eigener Spec kommt;
3. ob AP-4 nach TW7-A-Landung einen eigenen Task bekommt;
4. AP-7 erst nach ADR-Nachfolger zu ADR-0117 und Product-Owner-Gate.

Kein Folgeslice aus diesem Handoff automatisch starten.
