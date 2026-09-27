# Jetnity – V1 Account Erasure 1 HANDOFF

Stand: 27. September 2026  
Status: **STOP FOR TECHNICAL-LEAD RE-REVIEW / KEIN PASS / KEIN READY / KEIN MERGE**

Binding task: `docs/V1_ACCOUNT_ERASURE_1_TASK_2026-09-27.md`  
Status: `docs/V1_ACCOUNT_ERASURE_1_STATUS_2026-09-27.md`  
Self-review: `docs/V1_ACCOUNT_ERASURE_1_SELF_REVIEW_2026-09-27.md`  
Parent vor dieser Korrektur: `ab0d38a4c7130a648514bd0f4b518c64e27992e6`

---

## 1. Wo die Arbeit liegt

| | |
| --- | --- |
| Issue | #588 |
| Draft PR | #590 |
| Branch | `feat/v1-account-erasure-1` |
| Base | `main@95e9da45ceeacbc8b461541f810a7c8011d2151a` |
| Review-Head | der Commit dieses Direktmodus |
| Agent | Jetnity V1 account erasure 1, Generation 1 |
| Modell | Grok 4.7 High Fast (`originalModelName=grok-4.7-high-fast`) |
| Session | `bc-83c9d71e-a18d-49d5-8057-dfa34cfcaf9d` |
| Development-Projekt | Konstante `ENTWICKLUNGS_PROJEKT_REF` |
| Production-Projekt | Konstante `PRODUKTIONS_PROJEKT_REF`, geschlossen |

## 2. Was der Review zuerst prüfen sollte

1. `direktZugangPruefen` öffnet den Direktmodus nur bei Development-Ref, exakter Development-URL und beiden Schlüsseln. Ein Schlüssel, Production und eine fremde URL werfen vorher ab. Der Test sperrt `fetch` und zählt den Management-Callback.
2. Der Nachweis ruft `ziel()` und `projektSchluessel()` nur im Management-Callback auf. Schlüssel stehen nicht im JSON-Bericht. `nachweisGrund` ist eine Allowlist.
3. Der Live-Nachweis ist nicht gelaufen. Kein 11/11. Die Function wurde nicht neu deployt. Production nicht angefasst.
4. Direktmodus legt die temporäre Storage-Insert-Policy nicht an. Ein abgelehnter Nutzer-Upload ist `speicher_policy`. Der Management-Weg legt die Policy weiter per SQL an.
5. `schema_kaskade` im Direktmodus ist die beobachtete Löschkaskade, nicht `pg_constraint`.
6. R2, R3 und `verify_jwt = true` bleiben. Keine Migration, keine globale Kontinuität.

## 3. Nächster Schritt

Unabhängiges Technical-Lead-Re-Review dieses Heads. Danach kann der Nachweis lokal mit beiden Development-Branch-Schlüsseln laufen, ohne Management-PAT und ohne die Schlüssel auszugeben. Nicht Ready. Nicht mergen. Den Live-Nachweis nicht als bestanden lesen, bevor er tatsächlich gelaufen ist.
