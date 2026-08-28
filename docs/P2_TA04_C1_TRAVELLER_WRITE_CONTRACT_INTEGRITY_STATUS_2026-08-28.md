# Jetnity – P2-TA-04 C1 Traveller write-contract integrity – Status

Stand: 28. August 2026  
Status: **AUTHORING / DRAFT / KEIN READY / KEIN MERGE / KEIN C2 / KEIN PRODUCTION-APPLY**  
Workstream: Account / Traveller  
Cursor-Agent: **`Account plattform audit vorbereitung 7`**  
Issue: [#122](https://github.com/Jetnity/jetnity/issues/122)  
Branch: `cursor/p2-ta-04-c1-integrity-hardening-6fc0`

> Live-Evidence gewinnt. Exact-Head Actions/Vercel und Develop-Apply werden nach dem ersten Author-Commit gestempelt.

## 1. Live-Rekonstruktion dieses Agenten

| Feld | Wert |
| --- | --- |
| `origin/main` | `4549846bbbc106cb0a921203e343af6e681ec055` – Merge PR #121 |
| Issue #122 | OPEN / PRODUCT-OWNER APPROVED / C1 ONLY |
| Offene parallele PRs | #88, #52, #50, #40, #39, #28 – historical/fremd; nicht angefasst |
| P2-TA-04 Gate 0 / PR #120 | **integrated** |
| Supabase-Ziel für Writable Tests | non-default `develop` `[REDACTED]` / `ACTIVE_HEALTHY` |
| Production | `qscbgcdmivbbnzrcyegn` – nicht angefasst |

Develop trägt alle Repo-Versionen durch `20260827170000`. Historische AAL2-Drift bleibt: Develop hat `20260826052735`, das Repo hat `20260826090000`. C1 wird deshalb **nur** als `20260828120000` angewendet, nicht über ein blindes volles `db:anwenden`.

## 2. Was dieser Slice liefert

1. `public.party_loeschen(jsonb)` – SECURITY INVOKER, trip-ownership fail-closed, idempotent bei fehlender Ref
2. `travellerEntfernen` nutzt nur noch diesen RPC
3. `trip_traveller_party_limit_pruefen()` – max. 20 je `(user_id, trip_id)`, `FOR NO KEY UPDATE` auf der Reise
4. Child-Limit-Trigger jetzt `AFTER INSERT OR UPDATE`
5. `partyUebernehmen` prüft Bestand+neue Refs gegen 20
6. Unit-/Regression-/DB-Security-/Concurrency-Tests
7. ADR-0181 plus Continuity/Rotation/Status/Handoff

## 3. Bewusst nicht geliefert

C2, Tabellen-REVOKE, RLS, DEFINER, Auth/MFA/AAL, AP-5/AP-6a/AP-7, Passnummern/Scans/MRZ/Biometrie, Production-Apply, Production-Testdaten.

## 4. Nächster Schritt

Unabhängiger Technical-Lead-Review. Nicht Ready. Nicht mergen.
