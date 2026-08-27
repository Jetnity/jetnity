# Jetnity – Account / Traveller Next Slice Reconciliation – Handoff

Stand: 27. August 2026  
Issue: #105  
Cursor-Anzeigename: **Account plattform audit vorbereitung 2**  
Für: neuen Chat / Technical Lead / späteren Account-Agenten

> Live-Evidence gewinnt. Die historische Audit-Baseline `963186f4` ist keine zukünftige Live-Wahrheit. Zentrale Continuity-Dateien auf `main` können hinter dem Live-Stand liegen.

## Zuerst lesen

1. Issue #105
2. `docs/ACCOUNT_TRAVELLER_NEXT_SLICE_RECONCILIATION_TASK_2026-08-27.md`
3. `docs/ACCOUNT_TRAVELLER_NEXT_SLICE_RECONCILIATION_2026-08-27.md`
4. `docs/ACCOUNT_TRAVELLER_NEXT_SLICE_RECONCILIATION_STATUS_2026-08-27.md`
5. danach erst historische Evidence: AP-3-Status, Next-Phase-Audit PR #76, P1-TA-02-Status PR #84, PR #39-Plan

## Historische Audit-Baseline

`origin/main` `963186f4ec75501efd253a287131f464a5fd0fdb` (PR #102) war die Baseline dieses Audits. Vor jeder Fortsetzung `main` und offene PRs neu prüfen.

## Was wahr ist

- AP-1 / AP-2 / AP-3 sind auf `main`.
- P1-TA-02 ist durch PR #84 geschlossen.
- Production-AAL2 ist angewendet; kein zweiter Apply.
- Traveller Truth bleibt trip-scoped: mehrere Citizenships, mehrere Dokumente, kontextabhängige Optionen.
- Kein Default-Pass. Issuer ≠ Citizenship.
- P2-TA-06 (`documents[0]` in `travellerNormalisieren`) ist latent, kein aktueller App-Pfad.
- AP-4 schreibt noch nicht; gespeichertes `archived` bleibt in `/reisen`-Gruppen sichtbar.
- AP-7 existiert nicht und bleibt gated (ADR-Nachfolger + PO + sensible Identity-/RLS-Gates).
- **Zum Audit-Zeitpunkt** waren TW7-A-Drafts #104 und #106 beide offen. Das ist historische Evidence.
- **Aktuell:** #104 ist CLOSED / superseded / nicht gemergt. **#106 ist die einzige aktive TW7-A-Linie** und nicht auf `main`. Deren Dateien nicht anfassen.

## Was dieser Audit entschieden hat

**`NO ACCOUNT RUNTIME`, solange #106 nicht integriert ist.**

Nach verifizierter TW7-A-Landung: AP-4 als wahrscheinlichen nächsten Account-Lifecycle-Kandidaten unter einem frischen engen TL-Task/Spec neu bewerten. AP-4 ist nicht jetzt freigegeben.

P2-TA-06 nicht über AP-4 heben ohne eigene TL-Spec. Kein AP-7-Contract. Kein Ready. Kein Merge.

## Was ein neuer Agent nicht tun darf

- diesen Audit als Runtime- oder AP-4-Freigabe lesen
- `audit/account-platform` oder `audit/traveller-account-next-phase` als Basis verwenden
- TW7-A-Dateien von #106 ändern
- zwischen #104 und #106 wählen – die Wahl ist entschieden
- einen Account-Traveller-Registry-Contract erfinden
- Production / AAL2 / RLS / Auth ändern
- zentrale Continuity-Dateien nur deshalb umschreiben, weil sie stale sind – das konkurriert mit #106
- den fehlenden PR-#39-Plan als dauerhaften AP-4-Blocker behandeln

## Empfohlene nächste menschliche Entscheidung

Technical Lead nach Re-Review dieses Continuity-Fixes:

1. #106 unabhängig reviewen/landen oder bewusst offen lassen;
2. nach verifizierter #106-Landung einen frischen engen AP-4-Task versionieren, falls Account-Lifecycle als Nächstes gewollt ist;
3. P2-TA-06 nur mit eigener Spec und nicht still vor AP-4;
4. AP-7 erst nach ADR-Nachfolger zu ADR-0117, Product-Owner-Gate und sensiblen Identity-/RLS-Gates.

Kein Folgeslice aus diesem Handoff automatisch starten.
