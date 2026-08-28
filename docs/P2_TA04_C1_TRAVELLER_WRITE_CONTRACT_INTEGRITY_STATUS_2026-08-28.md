# Jetnity – P2-TA-04 C1 Traveller write-contract integrity – Status

Stand: 28. August 2026  
Status: **AUTHOR COMPLETE / DRAFT / KEIN READY / KEIN MERGE / KEIN C2 / KEIN PRODUCTION-APPLY**  
Workstream: Account / Traveller  
Cursor-Agent: **`Account plattform audit vorbereitung 7`**  
Issue: [#122](https://github.com/Jetnity/jetnity/issues/122)  
Branch: `cursor/p2-ta-04-c1-integrity-hardening-6fc0`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/126

> Live-Evidence gewinnt. Ein Continuity-Stamp nach dem geprüften Head erzeugt einen neueren SHA und muss live neu gegatet werden.

## 1. Live-Rekonstruktion dieses Agenten

| Feld | Wert |
| --- | --- |
| `origin/main` | `4549846bbbc106cb0a921203e343af6e681ec055` – Merge PR #121 |
| Author-Head vor diesem Stamp | `f46fae174d27d4ac9f71b3ee9a6434be42bc3954` |
| Merge-Base gegen `origin/main` | `4549846bbbc106cb0a921203e343af6e681ec055` |
| Ahead / Behind vor Stamp | **2 ahead / 0 behind** |
| Issue #122 | OPEN / PRODUCT-OWNER APPROVED / C1 ONLY |
| Draft-PR #126 | OPEN / Draft / MERGEABLE |
| Offene parallele PRs | #88, #52, #50, #40, #39, #28 – historical/fremd; nicht angefasst |
| P2-TA-04 Gate 0 / PR #120 | **integrated** |
| `main` Branch Protection | `protected=false` |
| Supabase-Ziel für Writable Tests | non-default `develop` `[REDACTED]` / `ACTIVE_HEALTHY` |
| Production | `qscbgcdmivbbnzrcyegn` – nicht angefasst |

Develop trug vor C1 alle Repo-Versionen durch `20260827170000`. Historische AAL2-Drift bleibt: Develop hat `20260826052735`, das Repo hat `20260826090000`. C1 wurde deshalb **nur** als `20260828120000` angewendet, nicht über ein blindes volles `db:anwenden`.

## 2. Was dieser Slice geliefert hat

1. `public.party_loeschen(jsonb)` – SECURITY INVOKER, trip-ownership fail-closed, idempotent bei fehlender Ref
2. `travellerEntfernen` nutzt nur noch diesen RPC
3. `trip_traveller_party_limit_pruefen()` – max. 20 je `(user_id, trip_id)`, `FOR NO KEY UPDATE` auf der Reise
4. Child-Limit-Trigger jetzt `AFTER INSERT OR UPDATE`
5. `partyUebernehmen` prüft Bestand+neue Refs gegen 20
6. Unit-/Regression-/DB-Security-/Concurrency-Tests
7. ADR-0181 plus Continuity/Rotation/Status/Handoff

Keine RLS-Policy geändert. Kein Tabellen-REVOKE. Kein SECURITY DEFINER. Kein Auth/MFA/AAL. Kein AP-5. Kein Production-Apply.

## 3. Develop-Apply

`20260828120000_traveller_write_contract_integrity` ist auf `develop` angewendet und in `supabase_migrations.schema_migrations` eingetragen.

Live-Katalog nach Apply:

- `party_loeschen`, `trip_traveller_party_limit_pruefen`, `trip_traveller_kinder_limit_pruefen`: `prosecdef=false`, `search_path=public, pg_temp`
- Trigger `trip_travellers_party_limit`, `trip_traveller_citizenships_limit`, `trip_traveller_documents_limit`: INSERT **und** UPDATE

## 4. Lokale Tests

| Check | Ergebnis |
| --- | --- |
| Focused unit (`inventory`, `party`, `reisende`, `foundation-e-select`) | **15/15 pass** |
| `npm test` | **2387/2387 pass** |
| `npm run typecheck` | **pass** |
| `npm run lint` | **pass** |
| `npm run build` | **pass** |
| `check:dead` / `check:exports` / `check:deps` / `check:api-schutz` / `check:schema-bezug` | **pass** |
| `db:rechte` | **pass** |
| `db:rls` | Snapshot **ok** (exit 0) |
| `db:parallelitaet` | **11/11 pass**, inkl. Party-Cap Insert/RPC/Reparent |
| C1-Fälle in `db:sicherheit` | **13/13 pass** |
| `db:sicherheit` gesamt | **217/248** – die 31 FEHL sind vorbestehende Admin-AAL2-JWT-Fixture-Lücken (leer/42501 auf Admin-Capabilities). Kein C1-Fall betroffen. |

## 5. Exact-Head vor diesem Stamp

| Feld | Wert |
| --- | --- |
| Author-Head | `f46fae174d27d4ac9f71b3ee9a6434be42bc3954` |
| GitHub Actions | Run `33133248112` **SUCCESS** auf exakt `f46fae17` |
| Vercel Preview | Inspector `D6onnex5Amwn9x1JLp9PPi7L3hXZ` **SUCCESS** auf exakt `f46fae17` |
| Preview-Deployment | `6134011103` success |
| Review-Threads | 0 |
| Draft | ja |

Ein Continuity-Stamp nach diesem Abschnitt erzeugt einen neueren Head und muss live neu geprüft werden.

## 6. Nächster Schritt

Unabhängiger Technical-Lead-Review von Draft-PR #126.

Nicht Ready. Nicht mergen. Kein C2. Kein AP-5. Kein Production-Apply durch den Author.
