# Jetnity – P2-TA-04 C1 Traveller write-contract integrity

Stand: 28. August 2026  
Issue: [#122](https://github.com/Jetnity/jetnity/issues/122)  
Typ: **IMPLEMENTATION / C1 ONLY**  
Cursor-Agent: **Account plattform audit vorbereitung 7**  
Start-Baseline: `main @ 4549846bbbc106cb0a921203e343af6e681ec055`

## 1. Ziel

Die drei Gate-0-Integritätslücken schliessen, ohne das authenticated Tabellen-DML-Modell, RLS oder SECURITY INVOKER zu ändern.

1. Kanonischer SECURITY-INVOKER-Delete-RPC.
2. DB-Party-Cap 20 je `(user_id, trip_id)`, concurrency-safe.
3. Child-Limits 8/12 auch bei UPDATE/Reparenting.

C1 ist vom Product Owner ausdrücklich freigegeben. Production-Apply bleibt ein späteres Gate nach unabhängigem Technical-Lead-PASS.

## 2. Non-Scope

Kein C2, kein Tabellen-DML-REVOKE, keine RLS-/Ownership-Änderung, kein SECURITY DEFINER, kein Auth/MFA/AAL, kein AP-5/AP-6a/AP-7, keine Passportnummern/Scans/MRZ/Biometrie, kein Provider/TW-8/Search/Homepage/Native, keine Production-Testdaten.

## 3. Akzeptanz

Siehe Issue #122. Writable DB-Tests nur gegen den rebasierten Supabase-`develop`-Branch.
