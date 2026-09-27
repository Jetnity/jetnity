# Jetnity – V1 Account Erasure 1 HANDOFF

Stand: 27. September 2026  
Status: **STOP FOR TECHNICAL-LEAD RE-REVIEW / KEIN PASS / KEIN READY / KEIN MERGE**

Binding task: `docs/V1_ACCOUNT_ERASURE_1_TASK_2026-09-27.md`  
Status: `docs/V1_ACCOUNT_ERASURE_1_STATUS_2026-09-27.md`  
Self-review: `docs/V1_ACCOUNT_ERASURE_1_SELF_REVIEW_2026-09-27.md`  
Parent vor dieser Korrektur: `0119f9c2a8e8440373ac8f224c7d6c57b64c423f`

---

## 1. Wo die Arbeit liegt

| | |
| --- | --- |
| Issue | #588 |
| Draft PR | #590 |
| Branch | `feat/v1-account-erasure-1` |
| Base | `main@95e9da45ceeacbc8b461541f810a7c8011d2151a` |
| Review-Head | der Commit dieser Besitzgrenze |
| Agent | Jetnity V1 account erasure 1, Generation 1 |
| Modell | Grok 4.7 High Fast (`originalModelName=grok-4.7-high-fast`) |
| Session | `bc-83c9d71e-a18d-49d5-8057-dfa34cfcaf9d` |

## 2. Was der Review zuerst prüfen sollte

1. `BESITZ_SQL` ist nur `select bucket_id, name from storage.objects where owner_id = $1`. Die Nutzer-ID steht nicht im SQL-Text. `delete`/`update` auf `storage.objects` kommen in der Function und im Modul nicht vor.
2. `remove` erhält nur Pfade, die der Leser für genau diese Nutzer-ID geliefert hat. Fremde Pfade, kaputte Buckets und kaputte Pfade gehen nicht an die Storage-API.
3. Eine zweite Besitzlesung nach dem Remove entscheidet `teilweise`, wenn noch eigene Zeilen da sind.
4. Die Function ruft `storage.list` nicht mehr auf. Der Nachweis ebenfalls nicht, und er liest `owner_id` nicht aus einer List-Antwort.
5. `SUPABASE_DB_URL` wird nicht protokolliert. Production und `verify_jwt` bleiben geschlossen beziehungsweise wahr.
6. Der Live-Nachweis ist nicht gelaufen. Kein 11/11. Keine Production-Änderung. Der Direktmodus von `0119f9c2` bleibt.

## 3. Nächster Schritt

Unabhängiges Technical-Lead-Re-Review dieses Heads. Danach kann der Development-Nachweis erneut laufen. Nicht Ready. Nicht mergen.
