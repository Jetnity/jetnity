# Jetnity – V1 Account Erasure 1 STATUS

Stand: 27. September 2026  
Status: **DIREKTER DEVELOPMENT-SCHLÜSSELMODUS UMGESETZT / LIVE-NACHWEIS NICHT AUSGEFÜHRT / DRAFT / NOT PASS / NOT READY / NOT MERGED / STOP FOR TECHNICAL-LEAD RE-REVIEW**

Issue: #588  
Draft PR: #590  
Branch: `feat/v1-account-erasure-1`  
Binding task: `docs/V1_ACCOUNT_ERASURE_1_TASK_2026-09-27.md`  
Diese Korrektur: direkter Development-Zugang, ohne Management-PAT  
Parent vor dieser Korrektur: `ab0d38a4c7130a648514bd0f4b518c64e27992e6`  
Base: `main@95e9da45ceeacbc8b461541f810a7c8011d2151a` (behind 0 zum Schreibzeitpunkt des Parents)  
Review head: der Commit, der diesen Direktmodus und dieses Dokument enthält.

Cursor-Agent: **Jetnity V1 account erasure 1**, Generation 1  
Required model: **Grok 4.7 High Fast** — bestätigt (`originalModelName=grok-4.7-high-fast`)  
Session: `bc-83c9d71e-a18d-49d5-8057-dfa34cfcaf9d`

Kein Ready. Kein Merge. Keine Production-Aktivierung. Kein Folgeslice. Agent-Self-Review ist kein Technical-Lead-PASS. Der Disposable-Development-Nachweis ist **nicht** gelaufen und **nicht** 11/11.

---

## 1. Direkter Development-Zugang

`lib/account/kontoloeschung-direkt.ts` entscheidet vor jedem Netzaufruf.

Direkter Modus nur, wenn alle Bedingungen gelten:

- `SUPABASE_PROJECT_REF` ist die Development-Konstante `ENTWICKLUNGS_PROJEKT_REF`
- `NEXT_PUBLIC_SUPABASE_URL` ist exakt `https://` plus dieser Ref plus `.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` und `SUPABASE_SERVICE_ROLE_KEY` sind beide gesetzt
- Ref und URL sind nicht das Production-Projekt

Dann ruft der Nachweis `ziel()`, `projektSchluessel()` und `api.supabase.com` nicht auf und verlangt `SUPABASE_ACCESS_TOKEN` nicht. Die Schlüssel bleiben im Prozess. Sie stehen nicht im Bericht, nicht in Fehlermeldungen und nicht in Dateien. `nachweisGrund` lässt nur eine feste Allowlist durch; jeder andere Text, auch ein Schlüssel, wird `ausnahme`.

Geschlossen, bevor das Netz gefragt wird:

- nur einer der beiden Schlüssel: `direkt_unvollstaendig`
- Production-Ref oder Production-URL: `produktion`
- anderer Ref: `projekt_ref`
- andere URL: `url_abweichung`

Ohne beide Schlüssel bleibt der bisherige Management-PAT-Weg. Ein direkter Lauf prüft danach `GET /auth/v1/admin/users` gegen genau diese Development-URL. Antwort ungleich 200 ist `auth_admin`, noch bevor Fixtures entstehen.

Tabellen, Profile, Zähler und `security_events` laufen dann über REST mit dem Service-Role-Schlüssel. `schema_kaskade` ist in diesem Modus die nach der Löschung beobachtete Kaskade, nicht ein Lesezugriff auf `pg_constraint`. Der Management-Weg liest die Fremdschlüssel weiter per SQL.

## 2. Live-Nachweis

Dieser Agent hat `scripts/account/kontoloeschung-nachweis.ts` nicht ausgeführt. Es gibt keinen neuen 11/11-Beleg. Der frühere anonyme Fall bleibt der einzige ausgeführte Live-Fall. Die Function auf Development wurde hier nicht neu deployt. Production wurde nicht gelesen und nicht verändert.

Rest aus dem Direktmodus: ohne Management-SQL legt der Lauf keine Insert-Policy an. Lehnt Storage den Upload der Nutzersitzung ab, endet der Lauf mit `speicher_policy`. Das Aufräumen der bis dahin entstandenen Fixtures läuft trotzdem. Der Management-Weg erzeugt die Policy weiterhin.

## 3. R2 und R3 bleiben

Die Löschfläche hängt an der konfigurierten Projekt-URL. Production bleibt in der Fläche und in der Function geschlossen. `verify_jwt` bleibt true. Die Copy bleibt auf das Jetnity-Konto und die gespeicherten Reisen, Reisenden und Besuche begrenzt. `teilweise_entfernt` bleibt die Klasse nach einem begonnenen Remove.

## 4. Lokale Gates auf diesem Korrekturbaum

| Gate | Ergebnis |
| --- | --- |
| `npm test` | PASS – **4003** Tests, 0 fail |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS – 0 errors, **145** Warnings, keine in den Löschdateien |
| `npm run build` | PASS – `○ /konto-geloescht` |
| Hygiene `dead` / `exports` / `deps` / `api-schutz` / `schema-bezug` | PASS. Vorbestehender Hinweis `admin_account_counts_v1` bleibt außerhalb |
| Zusätzlicher `tsc` über den Nachweis und den Direktmodus | PASS |

Exact-Head-CI und Vercel Preview gelten erst für den Commit dieses Dokuments. Ältere grüne Läufe, einschließlich CI `36347549727` und Preview `dpl_9CtyPwaiHRYr4DePfCuJmpJJxpgi` auf `ab0d38a4`, sind nicht dieser Head.

## 5. Browser

Diese Korrektur ändert keine Oberfläche. Es gibt keinen neuen Browser-Lauf.
