# Jetnity – V1 Account Erasure 1 STATUS

Stand: 27. September 2026  
Status: **TL CHANGES REQUIRED 5859179668 TEILWEISE UMGESETZT / DEVELOPMENT-DEPLOY WEITER BLOCKIERT / DRAFT / NOT PASS / NOT READY / NOT MERGED / STOP FOR TECHNICAL-LEAD RE-REVIEW**

Issue: #588  
Draft PR: #590  
Branch: `feat/v1-account-erasure-1`  
Binding task: `docs/V1_ACCOUNT_ERASURE_1_TASK_2026-09-27.md`  
TL comment: `5859179668` on rejected head `76e6bf9c153f94f3478cd11bcdbd26fd1794c2f0`  
Parent before this correction: `efbdc7acab51fe87a630a0dd867b25ade70fde6a`  
Base: `main@95e9da45ceeacbc8b461541f810a7c8011d2151a` (behind 0)  
Review head: der Commit, der diese Korrektur und dieses Dokument enthält.

Cursor-Agent: **Jetnity V1 account erasure 1**, Generation 1  
Required model: **Grok 4.7 High Fast** — bestätigt (`originalModelName=grok-4.7-high-fast`)  
Session: `bc-83c9d71e-a18d-49d5-8057-dfa34cfcaf9d`

Kein Ready. Kein Merge. Keine Production-Aktivierung. Kein Folgeslice. Agent-Self-Review ist kein Technical-Lead-PASS.

---

## 1. R1 — Development-Deploy und Nachweis: nicht ausgeführt

Frischer Versuch am 27. September 2026, nur gegen das in `ENTWICKLUNGS_PROJEKT_REF` gepinnte Development-Projekt:

- Management API `GET /projects/{ref}`, `/branches/{ref}` und `/projects/{ref}/functions`: jeweils **401**.
- `supabase functions deploy account-delete-v1 --project-ref` lud die vier Quelldateien hoch und endete mit `unexpected deploy status 401` / `Unauthorized`. Exit 1. Docker war nicht gestartet; das ist nicht die Ablehnung.
- Danach POST auf die Function-URL ohne Bearer: **404** `NOT_FOUND`.
- `scripts/account/kontoloeschung-nachweis.ts` bleibt bei `status=blockiert`, `grund=management_401`. Es wurde kein Disposable-User, kein Bucket und keine Policy angelegt. Cleanup ist deshalb leer und nicht als Erfolg zu lesen.
- Production wurde nicht deployt, nicht migriert und nicht gelöscht.

R1 ist **nicht** bestanden. Dieses Dokument meldet keinen PASS.

## 2. R2 — Production zeigt die Löschung nicht an

`loeschUmgebungErlaubt` entscheidet anhand der konfigurierten `NEXT_PUBLIC_SUPABASE_URL`, nicht anhand des Anfrage-Hosts.

- Development-Projekt und Loopback (`localhost`, `127.0.0.1`, `::1`, `kong`): Abschnitt wird gerendert.
- Production-Projekt, fremdes Hosted-Projekt, fehlende URL: kein Abschnitt, Funktions-URL ist `null`.
- Die Edge Function bleibt für Production geschlossen. Sie wurde nicht production-fähig gemacht.
- Der Development-Build dieses Agenten enthält den Abschnitt, weil die konfigurierte Projekt-URL Development ist. Ohne Sitzung antwortet `/account/settings` weiter **307** nach `/login`.

## 3. R3 — engere Copy und nicht-atomare Grenze

Die Oberfläche spricht nur noch vom Jetnity-Konto und den dazu gespeicherten Reisen, Reisenden und Besuchen. Kein „übrige Kontodaten“, kein „unwiderruflich“, keine DSGVO-/CH-DSG-Aussage.

Storage muss vor dem Auth-Nutzer weg. Ein Remove, das versucht wurde, aber nicht sauber zu Ende geht, und jeder Fehlschlag nach erfolgreichem Storage, ist die Klasse `teilweise_entfernt`. Die Meldung sagt, dass das Konto nicht als gelöscht bestätigt ist und ein Teil der Jetnity-Daten bereits entfernt sein kann, und verweist auf einen erneuten Versuch oder den Support. Sie nennt keinen Schritt, keinen Pfad und keinen Schlüssel. Ein Fehler vor dem ersten Remove bleibt `aufraeumen_fehlgeschlagen` und behauptet keine Datenänderung.

## 4. Lokale Gates auf diesem Korrekturbaum

| Gate | Ergebnis |
| --- | --- |
| `npm test` | PASS – **3999** Tests, 0 fail |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS – 0 errors, **145** Warnings, keine in den Löschdateien |
| `npm run build` | PASS – `○ /konto-geloescht` |
| Hygiene `dead` / `exports` / `deps` / `api-schutz` / `schema-bezug` | PASS. Vorbestehender Hinweis `admin_account_counts_v1` bleibt außerhalb |

Exact-Head-CI und Vercel Preview gelten erst für den Commit dieses Dokuments. Ältere Ready-Previews, einschließlich des Builds auf einem früheren Head, sind nicht dieser Head. Grün wäre keine Merge-Begründung.

## 5. Browser

Lokal `127.0.0.1:3001` nach diesem Build: `/konto-geloescht` zeigt die engere Copy und „Eine Wiederherstellung dieses Kontos ist nicht vorgesehen.“ „Zur Startseite“ öffnet `/`. `/account/settings` ohne Sitzung landet auf `/login` und zeigt den Löschabschnitt nicht. Die angemeldete Maske wurde nicht bedient, weil kein Disposable-Konto angelegt werden konnte.
