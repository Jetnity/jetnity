# Jetnity – V1 Account Erasure 1 STATUS

Stand: 27. September 2026  
Status: **DENO-BUNDLER-KORREKTUR UMGESETZT / DEVELOPMENT-DEPLOY UND NACHWEIS WEITER OFFEN / DRAFT / NOT PASS / NOT READY / NOT MERGED / STOP FOR TECHNICAL-LEAD RE-REVIEW**

Issue: #588  
Draft PR: #590  
Branch: `feat/v1-account-erasure-1`  
Binding task: `docs/V1_ACCOUNT_ERASURE_1_TASK_2026-09-27.md`  
Vorheriger TL-Kommentar: `5859179668` auf abgelehntem Head `76e6bf9c153f94f3478cd11bcdbd26fd1794c2f0`  
Diese Korrektur: Deno-Bundler auf abgelehntem Head `b9cd6b1fd86591bcc0bcccf71c2c52ac2ff89d6c`  
Parent vor dieser Korrektur: `b9cd6b1fd86591bcc0bcccf71c2c52ac2ff89d6c`  
Base: `main@95e9da45ceeacbc8b461541f810a7c8011d2151a` (behind 0)  
Review head: der Commit, der diese Bundler-Korrektur und dieses Dokument enthält.

Cursor-Agent: **Jetnity V1 account erasure 1**, Generation 1  
Required model: **Grok 4.7 High Fast** — bestätigt (`originalModelName=grok-4.7-high-fast`)  
Session: `bc-83c9d71e-a18d-49d5-8057-dfa34cfcaf9d`

Kein Ready. Kein Merge. Keine Production-Aktivierung. Kein Folgeslice. Agent-Self-Review ist kein Technical-Lead-PASS. Der Disposable-Development-Nachweis ist **nicht** bestanden.

---

## 1. Bundler-Korrektur

Der unabhängige Development-Deploy des Heads `b9cd6b1f` ist vor der Aktivierung am Deno-Bundler gescheitert:

`Module not found ".../lib/account/kontoloeschung-vertrag". Maybe add a '.ts' extension at lib/account/kontoloeschung-ausfuehrung.ts`

Live-Readback danach: Development Edge Functions leer, keine Function-Version, keine Production-Mutation.

Korrektur, ohne die Sicherheitslogik zu kopieren:

- `lib/account/kontoloeschung-ausfuehrung.ts` importiert `./kontoloeschung-vertrag.ts`.
- Die Function-Einstiege importierten die gemeinsamen Dateien bereits mit `.ts`.
- `kontoloeschung-speicher.ts` und `kontoloeschung-vertrag.ts` haben keine relativen Importe.
- `tsconfig.json` setzt `allowImportingTsExtensions` neben dem bestehenden `noEmit`. `npm run typecheck` bleibt grün. Next importiert die Ausführungsdatei nicht.
- `supabase/config.toml` bleibt `[functions.account-delete-v1] verify_jwt = true`.
- Production bleibt in `loeschUmgebungErlaubt` und in der Function geschlossen.

Lokaler Nachweis des Graphen: `deno bundle --node-modules-dir=none` auf `supabase/functions/account-delete-v1/index.ts` endet mit Exit 0, 71 Module. Das ist kein Deploy und kein Disposable-Nachweis.

`deno check` derselben Datei meldet weiterhin fünf `TS2345` auf den Supabase-Client-Generics in `index.ts`. Das ist nicht der gemeldete Module-not-found-Fehler. Dieser Slice ändert die Client-Signaturen nicht.

Dieser Agent hat die Function nicht deployt. Der Management-Zugriff dieses Laufs bleibt 401. Die Function-URL wurde in diesem Korrekturlauf nicht erneut aufgerufen.

## 2. R1 — Development-Nachweis: nicht ausgeführt

Der frühere Deploy-Versuch dieses Agenten endete mit HTTP 401, die Function-URL mit 404, der Nachweis mit `management_401`. Es wurde kein Disposable-User, kein Bucket und keine Policy angelegt. Der spätere authentifizierte Deploy ist am Bundler gescheitert, bevor eine Version existierte.

R1 ist **nicht** bestanden. Dieses Dokument meldet keinen PASS.

## 3. R2 und R3 bleiben

`loeschUmgebungErlaubt` entscheidet anhand der konfigurierten `NEXT_PUBLIC_SUPABASE_URL`. Production, ein fremdes Hosted-Projekt und eine fehlende URL rendern den Löschabschnitt nicht. Die Function wurde nicht production-fähig gemacht.

Die Oberfläche spricht nur vom Jetnity-Konto und den dazu gespeicherten Reisen, Reisenden und Besuchen. Nach einem begonnenen Remove oder einem Fehlschlag nach erfolgreichem Storage bleibt die Klasse `teilweise_entfernt`. Ein Fehler vor dem ersten Remove bleibt `aufraeumen_fehlgeschlagen`.

## 4. Lokale Gates auf diesem Korrekturbaum

| Gate | Ergebnis |
| --- | --- |
| `deno bundle` der Function | PASS – Exit 0, 71 Module |
| `npm test` | PASS – **4000** Tests, 0 fail. Ein früherer Lauf scheiterte nur an `supabase/.temp/cli-latest`; das Verzeichnis wurde entfernt, der Lauf danach war grün |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS – 0 errors, **145** Warnings, keine in den Löschdateien |
| `npm run build` | PASS – `○ /konto-geloescht` |
| Hygiene `dead` / `exports` / `deps` / `api-schutz` / `schema-bezug` | PASS. Vorbestehender Hinweis `admin_account_counts_v1` bleibt außerhalb |

Exact-Head-CI und Vercel Preview gelten erst für den Commit dieses Dokuments. Ältere Ready-Previews sind nicht dieser Head. Grün wäre keine Merge-Begründung.

## 5. Browser

Diese Korrektur ändert keine Oberfläche. Die engere Copy und das Ausblenden auf Production bleiben die bereits reviewten Stände. Es gibt keinen neuen Browser-Lauf.
