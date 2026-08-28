# Jetnity – P2-TA-04 C1 Traveller write-contract integrity – Handoff

Stand: 28. August 2026  
Status: **AUTHOR COMPLETE / DRAFT / STOPP FÜR UNABHÄNGIGEN TECHNICAL-LEAD-REVIEW**  
Cursor-Agent: **`Account plattform audit vorbereitung 7`**  
Issue: [#122](https://github.com/Jetnity/jetnity/issues/122)  
PR: https://github.com/Jetnity/jetnity/pull/126

## Zuerst lesen

1. Issue #122
2. `docs/P2_TA04_C1_TRAVELLER_WRITE_CONTRACT_INTEGRITY_TASK_2026-08-28.md`
3. `docs/P2_TA04_C1_TRAVELLER_WRITE_CONTRACT_INTEGRITY_STATUS_2026-08-28.md`
4. ADR-0181 in `DECISIONS.md`
5. ADR-0180 (Gate 0, mit C1-Nachtrag)
6. `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` – bleibt der AP-5–AP-12-Plan; dieser Slice startet ihn nicht

## Was ein neuer Chat wissen muss

C1 härtet den trip-scoped Write-Contract. Es gibt weiterhin kein bewiesenes Cross-User-P0.

`travellerEntfernen` ruft `party_loeschen` auf. Setzen und Guest→Account bleiben auf `party_schreiben`. Die Datenbank erzwingt 20 Traveller je Reise und Child-Limits 8/12 auch bei UPDATE. Direct DML bleibt bis C2 möglich, trägt aber jetzt diese Caps.

Kein REVOKE. Kein SECURITY DEFINER. Production nicht durch den Author anwenden.

`20260828120000` ist auf rebased Supabase `develop` angewendet. Production bleibt unangewendet.

## Residuals

- C2 (DEFINER + Tabellen-DML-REVOKE) ist nicht gestartet und braucht ein neues Product-Owner-Gate
- `db:sicherheit` gesamt 217/248 wegen vorbestehender Admin-AAL2-JWT-Fixtures; alle C1-Fälle grün
- Develop-History hat AAL2-Versionsdrift `20260826052735` vs. Repo `20260826090000`; C1 deshalb nur gezielt angewendet
- `main` Branch Protection `protected=false`
- Author-Head vor Continuity-Stamp: `f46fae174d27d4ac9f71b3ee9a6434be42bc3954`
- Actions `33133248112` SUCCESS; Vercel `D6onnex5Amwn9x1JLp9PPi7L3hXZ` SUCCESS auf genau diesem SHA
- Ein Stamp danach braucht erneute Exact-Head-Gates

## Nächster Schritt

Unabhängiger Technical-Lead-Review. Nicht Ready. Nicht mergen. Kein C2. Kein AP-5.
