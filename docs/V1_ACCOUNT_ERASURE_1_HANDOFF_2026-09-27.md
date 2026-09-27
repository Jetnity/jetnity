# Jetnity – V1 Account Erasure 1 HANDOFF

Stand: 27. September 2026  
Status: **STOP FOR TECHNICAL-LEAD RE-REVIEW / KEIN PASS / KEIN READY / KEIN MERGE**

Binding task: `docs/V1_ACCOUNT_ERASURE_1_TASK_2026-09-27.md`  
Status: `docs/V1_ACCOUNT_ERASURE_1_STATUS_2026-09-27.md`  
Self-review: `docs/V1_ACCOUNT_ERASURE_1_SELF_REVIEW_2026-09-27.md`  
Technical-Lead-Kommentar: `5860625071`  
Parent vor dieser Korrektur: `823618eda90310f123ca0b345398a5a88183c524`

---

## 1. Wo die Arbeit liegt

| | |
| --- | --- |
| Issue | #588 |
| Draft PR | #590 |
| Branch | `feat/v1-account-erasure-1` |
| Base | `main@95e9da45ceeacbc8b461541f810a7c8011d2151a` (behind 0) |
| Review-Head | der Commit dieser Graph-Kaskade |
| Agent | Jetnity V1 account erasure 1, Generation 1 |
| Modell | Grok 4.7 High Fast (`originalModelName=grok-4.7-high-fast`) |
| Session | `bc-83c9d71e-a18d-49d5-8057-dfa34cfcaf9d` |

## 2. Was der Review zuerst prüfen sollte

1. `supabase/migrations/20260927230000_reise_graph_kaskade_tiefe.sql` ersetzt nur `public.reise_graph_geaendert()`. Die Funktion bleibt `SECURITY INVOKER`. Die neun Trigger bleiben. Kein `GRANT`. Kein Rollenname der Auth-Verwaltung.
2. Reihenfolge: `jetnity.graph_mutation`, dann `pg_trigger_depth() > 1`, dann die Frage, ob eine betroffene Reise noch sichtbar ist. Erst danach das `UPDATE`.
3. Auf PostgreSQL 16 ist die Tiefe bei der Fremdschlüssel-Kaskade 1. Die unsichtbare Elternzeile ist der Fall, der `42501` auf `trips` beseitigt. Der lokale Nachweis zeigt das an der alten Funktion und danach an der neuen.
4. `npm run db:graph-kaskade-tiefe-lokal` ist 6/6. Direkte Kindänderungen zählen weiter. `graph_mutation` bleibt. Eltern- und Auth-Löschung schreiben `trips` nicht an.
5. Die Migration ist nicht auf Development und nicht auf Production angewendet. Der Live-Nachweis ist nicht gelaufen. Kein 11/11.
6. Storage-Besitz, Direktmodus, Production-Sperre und `verify_jwt` aus den vorherigen Köpfen bleiben.

## 3. Nächster Schritt

Unabhängiges Technical-Lead-Re-Review dieses Heads. Danach die Migration nur auf Supabase Development anwenden, die Function nicht neu deuten müssen, und den Disposable-Nachweis erneut laufen. Nicht Ready. Nicht mergen. Production `qscbgcdmivbbnzrcyegn` bleibt unverändert.
