# Jetnity – V1 Account Erasure 1 STATUS
Stand: 28. September 2026  
Status: **CLOSED / DEVELOPMENT 11/11 PASS / PR #590 MERGED / PRODUCTION ACTIVATION SEPARATELY GATED**

- Accepted exact head: `8d1755e926756776bd6f62e0e042bfb3169844e3`.
- Merge/main: `84356ba1830adf1d1ebd5c84a29df355ff8f2b30`.
- Final exact-head CI `36359427168`: **SUCCESS**.
- Preview `dpl_8o4EHxvjFutr2ZFLbbypsTZC2afV`: **READY**.
- Production deployment of merged app code `dpl_A5kkmrKWwztUF6PwLvD5Su1Yxpv2`: **READY**.
- Final disposable Development proof: **11/11 PASS**, `status=pass`, `grund=pass`, `Proof exit=0`.
- Development cleanup: 0 proof users/events/buckets/objects/policies; temporary grant removed.
- Development Function: `account-delete-v1` ACTIVE v2, JWT verification enabled.
- Development migration `reise_graph_kaskade_tiefe` applied.
- Production Supabase: 0 Edge Functions; graph-cascade migration unapplied; no real account deletion.
- Production activation remains a separate Product-Owner gate.
---

## Historical pre-closure evidence

Stand: 27. September 2026  
Status: **NACHWEIS LIEST OBJECT INFO / LIVE-NACHWEIS NICHT AUSGEFÜHRT / DRAFT / NOT PASS / NOT READY / NOT MERGED / STOP FOR TECHNICAL-LEAD RE-REVIEW**

Issue: #588  
Draft PR: #590  
Branch: `feat/v1-account-erasure-1`  
Binding task: `docs/V1_ACCOUNT_ERASURE_1_TASK_2026-09-27.md`  
Diese Korrektur: der Disposable-Nachweis prüft die Fixture über Storage Object Info  
Parent vor dieser Korrektur: `fbd6d50f160106a796b8f86530f219bd973dd22b`  
Base: `main@95e9da45ceeacbc8b461541f810a7c8011d2151a` (behind 0 nach `git fetch origin main`)  
Review head: der Commit, der diese Info-Prüfung und dieses Dokument enthält.

Cursor-Agent: **Jetnity V1 account erasure 1**, Generation 1  
Required model: **Grok 4.7 High Fast** — bestätigt (`originalModelName=grok-4.7-high-fast`)  
Session: `bc-83c9d71e-a18d-49d5-8057-dfa34cfcaf9d`

Kein Ready. Kein Merge. Keine Production-Änderung. Keine neue Migration. Kein Folgeslice. Der Disposable-Nachweis ist in dieser Sitzung **nicht** gelaufen und **nicht** 11/11.

---

## 1. Warum `speicher_entfernt` falsch blieb

Der Development-Lauf auf `fbd6d50f` hatte 10 von 11 Feldern wahr. `speicher_entfernt` blieb falsch, obwohl die Function `geloescht` lieferte, das Storage-DELETE 200 war und der Lebenszyklus `ObjectRemoved` schrieb. Der Nachweis hatte den Objektinhalt gelesen. Dieser GET kann nach dem Löschen noch 200 liefern.

Die Existenz der eigenen und der fremden Fixture ist jetzt `GET /storage/v1/object/info/{bucket}/{id}/proof.bin`. Status 200 heißt vorhanden. 400 und 404 heißen weg. Jeder andere Status bleibt `speicher` und zählt nicht als entfernt. Der Körper wird verworfen und nicht protokolliert. Der Dienstschlüssel bleibt nur im Prozess.

`speicher_entfernt` wartet weiter sofort und dann alle 50 ms, höchstens 1000 ms. Das fremde Objekt nutzt dieselbe Info-Regel, aber einen einzigen Blick. Die Aufräum-Löschung pollt nicht.

## 2. Tests

Info 200 ist vorhanden. 404 und 400 sind weg, 404 ohne Pause. Zwei Info-200 und dann 404 enden innerhalb der Frist. Status 500 und 401 werfen `speicher`. Bleibendes 200 endet nach genau 1000 ms ohne Entfernt-Meldung.

## 3. Was unverändert bleibt

Edge Function, Storage-Besitz, Ausführung und die Migration `20260927230000` sind nicht geändert. Die Migration ist hier nicht angewendet. Production bleibt geschlossen. `verify_jwt` bleibt true.

## 4. Lokale Gates

| Gate | Ergebnis |
| --- | --- |
| `npm test` | PASS – **4015** Tests, 0 fail |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS – 0 errors, **145** Warnings, keine in dieser Korrektur |
| `npm run build` | PASS – `○ /konto-geloescht` |
| Hygiene `dead` / `exports` / `deps` / `api-schutz` / `schema-bezug` | PASS. Vorbestehender Hinweis `admin_account_counts_v1` bleibt außerhalb |
| `deno bundle` der Function | PASS – Exit 0, 81 Module. Die Function-Quelle ist unverändert |

Exact-Head-CI und Vercel Preview gelten erst für den Commit dieses Dokuments. Der grüne Lauf auf `fbd6d50f` ist nicht dieser Head.

## 5. Browser

Diese Korrektur ändert keine Oberfläche. Es gibt keinen neuen Browser-Lauf.
