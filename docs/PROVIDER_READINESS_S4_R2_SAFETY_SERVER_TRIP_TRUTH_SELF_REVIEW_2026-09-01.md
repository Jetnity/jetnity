# Provider Readiness S4-R2 – Adversarial Self-Review

Stand: 1. September 2026  
Autor-Agent: **`Jetnity provider readiness S4-R2 safety server trip truth 1`**  
Generation: **1**  
Cursor-Session/Run-ID: `bc-e57d5eb1-d8c3-4e78-acdc-b26b6fed8f00`  
Typ: adversarial Self-Review, **kein** unabhängiger Technical-Lead-PASS

## 1. Auftrag gegen Diff

Auftrag: Issue #365 / S4-R2 Agent A only. Binding task `docs/PROVIDER_READINESS_S4_R2_SAFETY_SERVER_TRIP_TRUTH_TASK_2026-09-01.md`.

Baseline-Re-Fetch: `origin/main` = `17ee633ea89567761297c8f07c023953ec98bbf2` (0 behind). Exact pre-agent head `36ec41daac0d0812d89d5bf3e30edd6847101de3`.

Geprüft gegen den tatsächlichen Dateisatz, nicht gegen Chat-Absicht.

## 2. Geänderte Dateien

Runtime / Tests:

- `app/api/safety/evaluate/route.ts`
- `lib/safety/auswerten.ts`
- `lib/safety/schema.ts`
- `lib/safety/anfrage.test.ts`
- `lib/safety/s4-r2-server-trip-truth.test.ts`

Versionierte Agent-A-Docs:

- `docs/PROVIDER_READINESS_S4_R2_SAFETY_SERVER_TRIP_TRUTH_STATUS_2026-09-01.md`
- `docs/PROVIDER_READINESS_S4_R2_SAFETY_SERVER_TRIP_TRUTH_SELF_REVIEW_2026-09-01.md`
- `docs/PROVIDER_READINESS_S4_R2_SAFETY_SERVER_TRIP_TRUTH_HANDOFF_2026-09-01.md`

Task-Datei war bereits auf dem pre-agent Head vorhanden.

## 3. Explizit nicht angefasst (Agent-B / Non-Scope)

- `lib/readiness/*` (kein Edit; Engine behält bestehende Imports)
- `lib/seasonal/*`
- `lib/provider-ops/*`
- `supabase/**`, `types/supabase.ts`
- `docs/ACTIVE_WORK_STATUS.md`
- `JETNITY_START_HERE.md`
- Agent-B-Auditdateien
- S6/S7/S8, TW-8/TW-9, Auth/MFA/AAL, Provider-Activation

## 4. Acceptance gegen Code

| Pflicht | Nachweis |
| --- | --- |
| Account-Trip nutzt Server-Route/Stages/Items | `safetyReiseAufloesen` + Test 1: Client-Bangkok wird verworfen, Server-Florenz bleibt |
| Server-`party` erreicht Evaluation | Test 2: CH-Party + travellerabhängiger Fact → `affected` |
| Client-Party/Citizenship kann nicht überschreiben | Schema lehnt `party`/`citizenships` ab; Resolver nutzt nur geladene Reise (Test 3) |
| Fremd/unbekannt fail-closed ohne Orakel | Leere RLS-Menge und andere UUID: identische `404`/`nicht-gefunden` (Test 4) |
| DB/Read-Fehler ≠ leer/unavailable | `500`/`503` `lesen-fehlgeschlagen`, andere `art`/`status` als leer (Test 5); DB-Text nicht an Client |
| Gast erzeugt keine travellerabhängige Truth | Schema lehnt Citizenships ab; Gast-`party: []`; Fact bleibt `insufficient_context` (Test 6) |
| No-Provider ehrlich | `provider_unavailable` / API `unavailable`, nicht `checked_clean` (Test 7) |
| Kein Service-Role-Trip-Read | Source-Test 8; Route injiziert `reiseLaden`; `auswerten.ts` importiert `daten.ts` nicht |
| Keine Provider-Aktivierung | Factory `return null` (Test 9); kein Safety-Flag |
| Bestehende Safety-Tests grün | Engine 114 + Anzeige 6 + Anfrage 8 + S4-R2 12; `npm test` 3061/3061 |

## 5. Adversarial Fragen

| Frage | Ergebnis |
| --- | --- |
| Wird ein Provider aktiviert oder die Factory non-null? | Nein. |
| Gibt es Service-Role oder privilegierten Trip-Bypass? | Nein. |
| Kann der Browser `user_id` als Ownership setzen? | Nein. Feld wird abgelehnt; Ownership bleibt RLS. |
| Kann Gast-`trip-<uuid>` eine DB-UUID-Abfrage auslösen? | Nein. Nur Konto-UUID ruft `reiseLesen` auf. |
| Wird eine fehlende Injektion still zum Gastpfad? | Nein. Konto-UUID ohne Loader → `lesen-fehlgeschlagen` 500. |
| Wird ein Lese-Fehler als leere/sichere Reise dargestellt? | Nein. |
| Wird Official/LLM-Evidence als Truth akzeptiert? | Nein. Unverändert verworfen. |
| Wurde Readiness/Seasonal/provider-ops/DB editiert? | Nein. |
| Wurde Active Work / Start Here / Agent B angefasst? | Nein. |
| Ready/Merge/Folgeslice? | Nein. STOPP für unabhängigen TL-Review. |

## 6. Traveller-Context

Safety bleibt traveller-spezifisch, sobald Facts `travellerDependent` sind. Mehrere Citizenships einer Server-`party` werden über die bestehende Engine (`citizenshipCodesAus` / Slots) ausgewertet. Dieser Slice erfindet keine Visa-/Safety-Regel und setzt keine Default-Citizenship. Gast bleibt ohne server-eigene Reisendenwahrheit und damit fail-closed.

## 7. Bewusste Schwächen, die bleiben

- Workspace verdrahtet `/api/safety/evaluate` weiterhin nicht.
- `ARCHITECTURE.md` ist gegenüber dem neuen Vertrag veraltet; nicht in diesem Slice geändert.
- Seasonal hat denselben historischen Client-Kontext-Vertrag; nicht Agent-A-Ownership.
- `reiseLaden` bleibt der RSC-Cookie-Client. Für reines Lesen ausreichend; kein zweiter Loader.
- Dieses Self-Review ersetzt keinen unabhängigen Technical-Lead-Review.

## 8. Urteil des Autors

Während der lokalen Gates zwei Author-Fixes: TypeScript-Vergleich `checkState === 'checked_clean'` nach Narrowing; `SAFETY_VERBOTENE_CLIENT_WAHRHEIT` nicht mehr exportiert (`check:exports`); ungenutzter `SAFETY_NOW_MS`-Import entfernt. Beide gehören zum Slice-Diff.

**CHANGES REQUIRED durch den Autor:** keine weiteren in diesem Slice. Live Exact-Head CI/Vercel auf `92d12091` sind SUCCESS; der Typecheck-Fail auf `2d1d1084` ist ersetzt.

**Unabhängiger Technical-Lead-Review:** ausstehend.
