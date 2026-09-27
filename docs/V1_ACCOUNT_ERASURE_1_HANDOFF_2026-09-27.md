# Jetnity – V1 Account Erasure 1 HANDOFF

Stand: 27. September 2026  
Status: **STOP FOR TECHNICAL-LEAD REVIEW / KEIN READY / KEIN MERGE / KEIN FOLGESLICE**

Binding task: `docs/V1_ACCOUNT_ERASURE_1_TASK_2026-09-27.md`  
Status: `docs/V1_ACCOUNT_ERASURE_1_STATUS_2026-09-27.md`  
Self-review: `docs/V1_ACCOUNT_ERASURE_1_SELF_REVIEW_2026-09-27.md`

---

## 1. Wo die Arbeit liegt

| | |
| --- | --- |
| Issue | #588, Product-Owner-Freigabe im Issue-Kommentar |
| Draft PR | #590 |
| Branch | `feat/v1-account-erasure-1` |
| Base | `main@95e9da45ceeacbc8b461541f810a7c8011d2151a` |
| Implementierung | `65f8f936`, `76e6bf9c`, Nachweis-Zuordnung `f8a1470b` |
| Erster Evidence-Commit | `d09acc247acf4299e4d1595b6644faf6f7f07cce` |
| Ahead / behind auf `d09acc24` | **5 / 0** gegen `origin/main` |
| Agent | Jetnity V1 account erasure 1, Generation 1 |
| Modell | Grok 4.7 High Fast (`originalModelName=grok-4.7-high-fast`) |
| Session | `bc-83c9d71e-a18d-49d5-8057-dfa34cfcaf9d` |

Der Review-Head ist der Commit, der die Ahead/Behind-Korrektur enthält. `d09acc24` ist der erste Evidence-Stand und durch diese Korrektur entwertet. Ein weiterer Commit entwertet den neuen Head erneut.

## 2. Was der Review zuerst prüfen sollte

1. Merge-base bleibt `95e9da45`. Behind ist 0, solange `main` sich nicht bewegt.
2. Der Browser sendet nie eine `user_id`. Die Function leitet die Person aus `getUser(jwt)` ab.
3. `loeschUmgebungErlaubt` lässt nur das Development-Projekt per HTTPS und Loopback (`localhost`, `127.0.0.1`, `::1`, `kong`) zu. Der Production-Host ist geschlossen, bevor Abhängigkeiten laufen.
4. Löschreihenfolge in `kontoLoeschungAusfuehren`: Speicher, dann `security_events`, dann `deleteUser(id, false)`. Ein Speicherfehler löscht den Auth-Nutzer nicht.
5. Storage läuft über die Storage-API. Es gibt kein `delete from storage.objects`.
6. Frisches Passwort-AMR (300 Sekunden, 30 Sekunden Skew). Verifizierte Faktoren verlangen AAL2 und frisches `totp` oder `phone`.
7. `[functions.account-delete-v1] verify_jwt = true`.
8. Der Live-Nachweis ist **blockiert** (`management_401`). Die Function antwortet auf dem Development-Host mit **404 NOT_FOUND**. Das ist kein PASS.
9. Keine Production-Löschung, keine Migration, keine globalen Kontinuitätsdateien.

## 3. Nächster Schritt

Unabhängiger Technical-Lead-Review dieses Heads. Nicht Ready setzen. Nicht mergen.

Ein gültiger Development-Management-Token kann danach `account-delete-v1` nur auf das Development-Projekt deployen (`verify_jwt` bleibt true) und `scripts/account/kontoloeschung-nachweis.ts` ausführen. Das ist kein Auftrag dieses Agenten und kein Folgeslice. Production-Aktivierung bleibt ein eigenes Product-Owner-Gate.
