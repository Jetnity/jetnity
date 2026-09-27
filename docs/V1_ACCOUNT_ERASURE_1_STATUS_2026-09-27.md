# Jetnity – V1 Account Erasure 1 STATUS

Stand: 27. September 2026  
Status: **STORAGE-BESITZ ÜBER owner_id / LIVE-NACHWEIS NICHT AUSGEFÜHRT / DRAFT / NOT PASS / NOT READY / NOT MERGED / STOP FOR TECHNICAL-LEAD RE-REVIEW**

Issue: #588  
Draft PR: #590  
Branch: `feat/v1-account-erasure-1`  
Binding task: `docs/V1_ACCOUNT_ERASURE_1_TASK_2026-09-27.md`  
Diese Korrektur: Besitz an Storage-Objekten nicht mehr aus der List-Antwort  
Parent vor dieser Korrektur: `0119f9c2a8e8440373ac8f224c7d6c57b64c423f`  
Base: `main@95e9da45ceeacbc8b461541f810a7c8011d2151a` (behind 0 zum Schreibzeitpunkt des Parents)  
Review head: der Commit, der diese Besitzgrenze und dieses Dokument enthält.

Cursor-Agent: **Jetnity V1 account erasure 1**, Generation 1  
Required model: **Grok 4.7 High Fast** — bestätigt (`originalModelName=grok-4.7-high-fast`)  
Session: `bc-83c9d71e-a18d-49d5-8057-dfa34cfcaf9d`

Kein Ready. Kein Merge. Keine Production-Aktivierung. Kein Folgeslice. Der Disposable-Nachweis ist **nicht** gelaufen und **nicht** 11/11. Der angenommene Direktmodus von `0119f9c2` bleibt.

---

## 1. Besitzgrenze

`storage.from(bucket).list()` liefert `owner` und `owner_id` nicht. Die Function liest deshalb nur `bucket_id` und `name` mit der festen Abfrage `select bucket_id, name from storage.objects where owner_id = $1`. Die verifizierte Nutzer-ID steht ausschließlich im Parameter. Die Abfrage kommt aus `besitzAbfrage`, nicht aus dem Browser.

Gelöscht wird nur über `storage.from(bucket).remove` mit den geprüften Pfaden dieser Abfrage. Es gibt kein SQL-`DELETE` und kein SQL-`UPDATE` auf `storage.objects`. Nach dem Remove liest die Function dieselben Zeilen erneut. Bleibt eine eigene Zeile, ist das Ergebnis `teilweise`, nicht Erfolg. Ein Lesefehler vor dem ersten Remove ist `fehler`. Ein kaputter Bucket oder Pfad wird nicht an die Storage-API gegeben.

Die Verbindung ist `SUPABASE_DB_URL` der gehosteten Function. Fehlt sie, endet der Schritt mit `fehler`. Die URL, die Nutzer-ID und der Pfad werden nicht protokolliert. Production bleibt in `loeschUmgebungErlaubt` geschlossen, bevor dieser Schritt läuft. `verify_jwt` bleibt true.

## 2. Nachweis

Der Nachweis prüft die bekannte Fixture `jetnity-erasure-proof/{nutzer}/proof.bin` über den Objektstatus, nicht über Besitzfelder einer List-Antwort. Das fremde Objekt bleibt ein zweiter, eigener Pfad. Dieser Agent hat den Nachweis nicht ausgeführt.

## 3. Lokale Gates

| Gate | Ergebnis |
| --- | --- |
| `deno bundle` der Function | PASS – Exit 0, 81 Module |
| `npm test` | PASS – **4005** Tests, 0 fail |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS – 0 errors, **145** Warnings, keine in den Löschdateien |
| `npm run build` | PASS – `○ /konto-geloescht` |
| Hygiene `dead` / `exports` / `deps` / `api-schutz` / `schema-bezug` | PASS. Vorbestehender Hinweis `admin_account_counts_v1` bleibt außerhalb |

Exact-Head-CI und Vercel Preview gelten erst für den Commit dieses Dokuments. Der grüne Lauf auf `0119f9c2` ist nicht dieser Head.

## 4. Browser

Diese Korrektur ändert keine Oberfläche. Es gibt keinen neuen Browser-Lauf.
