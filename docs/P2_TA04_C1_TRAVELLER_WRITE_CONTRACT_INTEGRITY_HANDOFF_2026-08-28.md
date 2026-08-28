# Jetnity – P2-TA-04 C1 Traveller write-contract integrity – Handoff

Stand: 28. August 2026  
Status: **AUTHORING / DRAFT / STOPP FÜR UNABHÄNGIGEN TECHNICAL-LEAD-REVIEW**  
Cursor-Agent: **`Account plattform audit vorbereitung 7`**  
Issue: [#122](https://github.com/Jetnity/jetnity/issues/122)

## Zuerst lesen

1. Issue #122
2. `docs/P2_TA04_C1_TRAVELLER_WRITE_CONTRACT_INTEGRITY_TASK_2026-08-28.md`
3. `docs/P2_TA04_C1_TRAVELLER_WRITE_CONTRACT_INTEGRITY_STATUS_2026-08-28.md`
4. ADR-0181 in `DECISIONS.md`
5. ADR-0180 (Gate 0, jetzt mit C1-Nachtrag)
6. `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` – bleibt der AP-5–AP-12-Plan; dieser Slice startet ihn nicht

## Was ein neuer Chat wissen muss

C1 härtet den trip-scoped Write-Contract. Es gibt weiterhin kein bewiesenes Cross-User-P0.

`travellerEntfernen` ruft `party_loeschen` auf. Setzen und Guest→Account bleiben auf `party_schreiben`. Die Datenbank erzwingt 20 Traveller je Reise und Child-Limits 8/12 auch bei UPDATE. Direct DML bleibt bis C2 möglich, trägt aber jetzt diese Caps.

Kein REVOKE. Kein SECURITY DEFINER. Production nicht durch den Author anwenden.

## Nächster Schritt

Unabhängiger Technical-Lead-Review. Nicht Ready. Nicht mergen. Kein C2. Kein AP-5.
