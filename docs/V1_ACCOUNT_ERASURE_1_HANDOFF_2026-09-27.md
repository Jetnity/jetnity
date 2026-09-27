# Jetnity – V1 Account Erasure 1 HANDOFF

Stand: 27. September 2026  
Status: **STOP FOR TECHNICAL-LEAD RE-REVIEW / KEIN PASS / KEIN READY / KEIN MERGE**

Binding task: `docs/V1_ACCOUNT_ERASURE_1_TASK_2026-09-27.md`  
Status: `docs/V1_ACCOUNT_ERASURE_1_STATUS_2026-09-27.md`  
Self-review: `docs/V1_ACCOUNT_ERASURE_1_SELF_REVIEW_2026-09-27.md`  
Parent vor dieser Korrektur: `be92f8fdeb25f4bb57030b2f3b862ea11fce7025`

---

## 1. Wo die Arbeit liegt

| | |
| --- | --- |
| Issue | #588 |
| Draft PR | #590 |
| Branch | `feat/v1-account-erasure-1` |
| Base | `main@95e9da45ceeacbc8b461541f810a7c8011d2151a` (behind 0) |
| Review-Head | der Commit dieser Nachweis-Warte |
| Agent | Jetnity V1 account erasure 1, Generation 1 |
| Modell | Grok 4.7 High Fast (`originalModelName=grok-4.7-high-fast`) |
| Session | `bc-83c9d71e-a18d-49d5-8057-dfa34cfcaf9d` |

## 2. Was der Review zuerst prüfen sollte

1. `speicher_entfernt` benutzt `objektAbwesenheitWarten` nur für `zielNutzer`. Intervall 50 ms, Frist 1000 ms.
2. Das fremde Objekt bleibt ein einzelnes `objektDa`. `speicherEntfernen` löscht weiter ohne Poll.
3. Edge Function, `kontoloeschung-speicher`, `kontoloeschung-ausfuehrung` und die Migration sind in diesem Commit nicht geändert.
4. Die Tests decken sofort weg, verzögert weg, Frist ohne Erfolg, stehenbleibende Uhr und Lesefehler. 4011/4011.
5. Der Live-Nachweis ist nicht gelaufen. Kein 11/11. Production unverändert.

## 3. Nächster Schritt

Unabhängiges Technical-Lead-Re-Review dieses Heads. Danach den Disposable-Nachweis auf Development erneut laufen. Nicht Ready. Nicht mergen. Production bleibt zu.
