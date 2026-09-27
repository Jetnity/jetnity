# Jetnity – V1 Account Erasure 1 STATUS

Stand: 27. September 2026  
Status: **NACHWEIS WARTET KURZ AUF STORAGE-ABWESENHEIT / LIVE-NACHWEIS NICHT AUSGEFÜHRT / DRAFT / NOT PASS / NOT READY / NOT MERGED / STOP FOR TECHNICAL-LEAD RE-REVIEW**

Issue: #588  
Draft PR: #590  
Branch: `feat/v1-account-erasure-1`  
Binding task: `docs/V1_ACCOUNT_ERASURE_1_TASK_2026-09-27.md`  
Diese Korrektur: nur der Disposable-Nachweis pollt `speicher_entfernt`  
Parent vor dieser Korrektur: `be92f8fdeb25f4bb57030b2f3b862ea11fce7025`  
Base: `main@95e9da45ceeacbc8b461541f810a7c8011d2151a` (behind 0 nach `git fetch origin main`)  
Review head: der Commit, der diese Nachweis-Warte und dieses Dokument enthält.

Cursor-Agent: **Jetnity V1 account erasure 1**, Generation 1  
Required model: **Grok 4.7 High Fast** — bestätigt (`originalModelName=grok-4.7-high-fast`)  
Session: `bc-83c9d71e-a18d-49d5-8057-dfa34cfcaf9d`

Kein Ready. Kein Merge. Keine Production-Änderung. Keine neue Migration. Kein Folgeslice. Der Disposable-Nachweis ist in dieser Sitzung **nicht** gelaufen und **nicht** 11/11.

---

## 1. Warum `speicher_entfernt` falsch blieb

Der letzte Development-Lauf hat das eigene Storage-Objekt entfernt. Das GET direkt danach kam etwa 17 ms, bevor Storage `ObjectRemoved` schrieb, und sah noch 200. Der Nachweis hat das als nicht entfernt gewertet.

`speicher_entfernt` prüft die eigene Fixture jetzt sofort und, solange sie noch da ist, alle 50 ms, höchstens 1000 ms. Weg bei 400 oder 404 ist Erfolg und beendet das Warten. Ein anderer Status bleibt `speicher` und zählt nicht als entfernt. Bleibt das Objekt über die Frist sichtbar, bleibt `speicher_entfernt` falsch.

Das fremde Objekt wird weiter mit einem einzigen GET gelesen. Die Aufräum-Löschung pollt nicht. Laufzeit, Edge Function, Storage-Besitz und die Graph-Migration sind unverändert.

## 2. Tests der Warte

Sofort weg: ein Blick, keine Pause. Verzögert weg: zwei Pausen à 50 ms, dann Ende, Summe unter der Frist. Bleibt vorhanden: die Summe der Pausen ist genau 1000 ms und das Ergebnis ist nicht entfernt. Eine Uhr, die nicht vorrückt, beendet die Schleife. Ein Lesefehler wirft `speicher`.

## 3. Was unverändert bleibt

Die Migration `20260927230000_reise_graph_kaskade_tiefe.sql` bleibt die Fassung von `be92f8fd`. Sie ist hier nicht erneut angewendet, nicht auf Development und nicht auf Production. Besitz bleibt `owner_id = $1` und Löschen nur über die Storage-API. Der Direktmodus bleibt. Production bleibt geschlossen. `verify_jwt` bleibt true.

## 4. Lokale Gates

| Gate | Ergebnis |
| --- | --- |
| `npm test` | PASS – **4011** Tests, 0 fail |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS – 0 errors, **145** Warnings, keine in dieser Korrektur |
| `npm run build` | PASS – `○ /konto-geloescht` |
| Hygiene `dead` / `exports` / `deps` / `api-schutz` / `schema-bezug` | PASS. Vorbestehender Hinweis `admin_account_counts_v1` bleibt außerhalb |
| `deno bundle` der Function | PASS – Exit 0, 81 Module. Die Function-Quelle ist unverändert |

Exact-Head-CI und Vercel Preview gelten erst für den Commit dieses Dokuments. Der grüne Lauf auf `be92f8fd` ist nicht dieser Head.

## 5. Browser

Diese Korrektur ändert keine Oberfläche. Es gibt keinen neuen Browser-Lauf.
