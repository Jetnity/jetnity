# Jetnity – V1 Account Erasure 1 STATUS

Stand: 27. September 2026  
Status: **GRAPH-KASKADE LOKAL BEWIESEN / MIGRATION NICHT ANGEWENDET / LIVE-NACHWEIS NICHT AUSGEFÜHRT / DRAFT / NOT PASS / NOT READY / NOT MERGED / STOP FOR TECHNICAL-LEAD RE-REVIEW**

Issue: #588  
Draft PR: #590  
Branch: `feat/v1-account-erasure-1`  
Binding task: `docs/V1_ACCOUNT_ERASURE_1_TASK_2026-09-27.md`  
Technical-Lead-Kommentar: `5860625071`  
Diese Korrektur: `public.reise_graph_geaendert()` kehrt vor dem `UPDATE` auf `public.trips` zurück, wenn die Elternreise in der Löschkaskade schon weg ist  
Parent vor dieser Korrektur: `823618eda90310f123ca0b345398a5a88183c524`  
Base: `main@95e9da45ceeacbc8b461541f810a7c8011d2151a` (behind 0 nach `git fetch origin main`)  
Review head: der Commit, der diese Migration, den lokalen Nachweis und dieses Dokument enthält.

Cursor-Agent: **Jetnity V1 account erasure 1**, Generation 1  
Required model: **Grok 4.7 High Fast** — bestätigt (`originalModelName=grok-4.7-high-fast`)  
Session: `bc-83c9d71e-a18d-49d5-8057-dfa34cfcaf9d`

Kein Ready. Kein Merge. Keine Production-Migration. Keine Development-Migration durch diesen Agenten. Kein Folgeslice. Der Disposable-Nachweis ist **nicht** gelaufen und **nicht** 11/11.

---

## 1. Warum die Auth-Löschung abbrach

Der letzte Development-Lauf löschte Storage und `security_events`, dann kam `klasse=teilweise_entfernt`, `schritt=konto`. Das Auth-Log sagte `permission denied for table trips (SQLSTATE 42501)`.

`public.reise_graph_geaendert()` ist `SECURITY INVOKER`. Die Statement-Trigger auf `trip_stages`, `trip_days` und `trip_items` erhöhen `public.trips.revision`. Beim harten Löschen kaskadiert `auth.users` auf `public.trips` und von dort auf die Kindzeilen. Die Kind-Trigger laufen danach noch und schreiben die verschwindende Reise. Die Auth-Rolle darf `public.trips` nicht ändern. Die Löschung bricht ab.

Auf PostgreSQL 16 feuern Statement-Trigger mit Übergangstabelle bei einer Fremdschlüssel-Kaskade erst am Ende der äusseren Anweisung und mit `pg_trigger_depth() = 1`. Die Tiefe allein trifft diesen Fall nicht. Die Elternzeile ist dann nicht mehr sichtbar. Die Funktion kehrt deshalb vor dem `UPDATE` zurück, wenn keine betroffene Reise mehr sichtbar ist oder das Lesen mit `42501` scheitert. `pg_trigger_depth() > 1` bleibt die Abkürzung für normale verschachtelte Trigger. `jetnity.graph_mutation = '1'` bleibt die erste Abkürzung.

Die Funktion bleibt `SECURITY INVOKER`. Die neun Trigger bleiben. Es gibt kein `GRANT` und keinen Rollennamen der Auth-Verwaltung.

## 2. Lokaler Nachweis

`npm run db:graph-kaskade-tiefe-lokal` legt eine frische lokale PostgreSQL an. Supabase und Production werden nicht berührt.

Zuerst die alte Funktion: Löschen von `auth.users` mit Kindzeilen als Rolle ohne Recht auf `public.trips` endet mit `42501`, das Konto bleibt.

Nach `supabase/migrations/20260927230000_reise_graph_kaskade_tiefe.sql`:

- direktes Einfügen, Ändern und Löschen von Etappe, Tag und Planpunkt erhöht die Fassung um genau 1 je Anweisung (9 Schreibversuche, Fassung 1 → 10)
- `jetnity.graph_mutation = '1'` lässt Fassung und Schreibversuch unverändert
- Löschen der Elternreise mit Kindkaskade schreibt `public.trips` nicht an
- ein normal verschachtelter Trigger (`pg_trigger_depth() > 1`) kehrt vor dem `UPDATE` zurück
- dieselbe Auth-Löschung gelingt, die Geschwisterreise bleibt auf Fassung 4, kein Schreibversuch auf `trips`
- `prosecdef` bleibt falsch; `SELECT`/`INSERT`/`UPDATE`/`DELETE` auf `trips` für die Auth-Rolle bleiben falsch

Ergebnis: **6/6**. Die Migration ist nur in dieser lokalen Datenbank angewendet.

## 3. Was unverändert bleibt

Besitz an Storage-Objekten bleibt die parametrisierte Lesung `owner_id = $1` und das Löschen nur über die Storage-API. Der Direktmodus für den Development-Nachweis bleibt. Production bleibt in `loeschUmgebungErlaubt` geschlossen. `verify_jwt` bleibt true. Die Reise-Graph-Änderung liest keine Reisenden- oder Dokumentdaten.

## 4. Lokale Gates

| Gate | Ergebnis |
| --- | --- |
| `npm run db:graph-kaskade-tiefe-lokal` | PASS – 6/6, alte Funktion 42501, neue Funktion löscht ohne Schreibversuch |
| `deno bundle` der Function | PASS – Exit 0, 81 Module. Die Function-Quelle ist unverändert |
| `npm test` | PASS – **4005** Tests, 0 fail |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS – 0 errors, **145** Warnings, keine in dieser Korrektur |
| `npm run build` | PASS – `○ /konto-geloescht` |
| Hygiene `dead` / `exports` / `deps` / `api-schutz` / `schema-bezug` | PASS. Vorbestehender Hinweis `admin_account_counts_v1` bleibt außerhalb |

`db:rechte`, `db:rls`, `db:sicherheit` und `db:anwenden` laufen über die Management-API gegen das Projekt der Umgebung. Sie sind nicht gelaufen. Diese Korrektur darf Development und Production nicht anwenden.

Exact-Head-CI und Vercel Preview gelten erst für den Commit dieses Dokuments. Der grüne Lauf auf `823618ed` ist nicht dieser Head.

## 5. Browser

Diese Korrektur ändert keine Oberfläche. Es gibt keinen neuen Browser-Lauf.
