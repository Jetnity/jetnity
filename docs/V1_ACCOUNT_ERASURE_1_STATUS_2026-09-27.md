# Jetnity – V1 Account Erasure 1 STATUS

Stand: 27. September 2026  
Status: **IMPLEMENTIERT / DEVELOPMENT-NACHWEIS BLOCKIERT / DRAFT / NOT READY / NOT MERGED / STOP FOR TECHNICAL-LEAD REVIEW**

Issue: #588  
Draft PR: #590  
Branch: `feat/v1-account-erasure-1`  
Binding task: `docs/V1_ACCOUNT_ERASURE_1_TASK_2026-09-27.md`  
Base: `main@95e9da45ceeacbc8b461541f810a7c8011d2151a`  
Parent before this evidence commit: `76e6bf9c153f94f3478cd11bcdbd26fd1794c2f0`  
Ahead / behind gegen `origin/main`: **3 / 0** vor diesem Dokument; dieses Dokument verschiebt den Head.

Cursor-Agent: **Jetnity V1 account erasure 1**, Generation 1  
Required model: **Grok 4.7 High Fast** — bestätigt (`originalModelName=grok-4.7-high-fast`)  
Session: `bc-83c9d71e-a18d-49d5-8057-dfa34cfcaf9d`

Dieses Dokument ist eine Momentaufnahme. Jeder neue Head entwertet ältere Exact-Head-Gates. Agent-Self-Review ist kein Technical-Lead-PASS. Kein Ready. Kein Merge. Kein Folgeslice.

---

## 1. Umgesetzt

Sofortige Hard-Delete-Semantik für das angemeldete Konto, nur im Development-Projekt:

- Einstellungen unter `/account/settings`: Abschnitt `Konto löschen`, Export zuerst (`/api/account/export`, „Daten zuerst exportieren“), exakte Eingabe `KONTO LÖSCHEN`, aktuelles Passwort, TOTP-Step-up wenn ein verifizierter TOTP-Faktor die Sitzung noch nicht auf AAL2 gehoben hat.
- Bestätigungsseite `/konto-geloescht`, `noindex`, in `ROBOTS_DISALLOW_ALLOW_MODUS`, nicht in `SITEMAP_OEFFENTLICHE_PFADE`.
- Schmale Edge Function `account-delete-v1` mit `verify_jwt = true`. Zielperson nur aus `getUser(jwt)`. Kein `user_id` im Request.
- Reihenfolge: Identität, frisches Passwort-AMR, bei verifiziertem Faktor AAL2 plus frisches TOTP/Phone-AMR, Storage-API, `security_events` derselben `user_id`, `deleteUser(userId, false)`.
- Production-Host und jedes andere gehostete Projekt werden abgelehnt, bevor Storage, Ereignisse oder Auth angefasst werden.
- OAuth-only bleibt geschlossen. Die bestehende Passwortänderung über `reauthenticate()` ist unverändert.
- Keine Migration, kein RLS-Umbau, kein Production-Schreiben, kein GDPR-/CH-DSG-Versprechen, keine Wiederherstellung.

## 2. Development-Nachweis

`node --import tsx scripts/account/kontoloeschung-nachweis.ts` am 27. September 2026:

```json
{"status":"blockiert","grund":"management_401","entwicklung":true,"schema_kaskade":false,"security_events_spalte":false,"bestaetigung_abgelehnt":false,"sitzung_fehlt":false,"passwort_falsch":false,"mfa_umgehung_verweigert":false,"mfa_step_up_geloescht":false,"speicher_entfernt":false,"security_event_entfernt":false,"graph_kaskade":false,"veraltetes_token_ohne_autoritaet":false,"zweite_loeschung_kein_erfolg":false,"fremde_daten_unberuehrt":false}
```

Exit-Code des Skripts: 1. Es wurde kein Disposable-User angelegt, nichts gelöscht und Production nicht berührt. Die Management API antwortet für diesen Agent-Token mit 401, bevor Schema, Schlüssel oder Konten gelesen werden.

Zusätzlicher Leseprobe gegen die Function-URL des Development-Projekts, ohne Bearer-Token: HTTP **404**, Body `{"code":"NOT_FOUND","message":"Requested function was not found"}`. `account-delete-v1` ist in dieser Umgebung nicht deployt.

Der Disposable-Nachweis ist damit **nicht** bestanden. Er ist blockiert.

## 3. Lokale Gates

Auf dem Arbeitsbaum dieser Evidence, einschließlich der `management_401`-Zuordnung:

| Gate | Ergebnis |
| --- | --- |
| Fokussierte Kontolöschungs-Tests | PASS – 17/17 |
| `npm test` | PASS – **3996** Tests, 0 fail |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS – 0 errors, **145** Warnings, keine in den neuen Dateien |
| `npm run build` | PASS – `○ /konto-geloescht`, `○ /account/settings` |
| `check:dead` | PASS – 0 verwaist |
| `check:exports` | PASS – 0 ohne Aufrufer |
| `check:deps` | PASS |
| `check:api-schutz` | PASS – 12 Admin-Routen |
| `check:schema-bezug` | PASS (Exit 0). Vorbestehender Hinweis `admin_account_counts_v1` bleibt außerhalb dieses Slices |

Ein früherer voller Testlauf sah `supabase/.temp/cli-latest`, weil die Supabase-CLI lokal ein Tempfile angelegt hatte. Die Datei ist gitignored und wurde entfernt. Der wiederholte Lauf ist der oben genannte PASS. Das Tempfile gehört nicht zum Commit.

## 4. Browser

Lokal gegen den laufenden Server auf `127.0.0.1:3000`:

- `/konto-geloescht` zeigt „Konto gelöscht“, die dauerhafte Löschung und „Eine Wiederherstellung ist nicht möglich.“ Der Link „Zur Startseite“ öffnet `/`. Kein DSGVO-, CH-DSG- oder 30-Tage-Text. Schmale Ansicht bleibt lesbar.
- `/account/settings` ohne Sitzung antwortet **307** nach `/login?next=%2Faccount%2Fsettings`. Die Login-Seite zeigt keinen Löschabschnitt.

Die angemeldete Löschmaske wurde nicht im Browser bedient. Dafür wäre ein Disposable-Development-Konto nötig, und genau dessen Anlage ist durch `management_401` blockiert. Falsche Bestätigung, falsches Passwort, MFA-Schritt und Erfolg ohne Sitzungsräumung sind durch die Vertragstests belegt, nicht durch eine Live-Sitzung.

## 5. Exact-Head CI und Preview

Für den Head dieses Dokuments noch nicht belegt. Ältere Vercel-Builds auf `f521a3b3` gelten nicht für die Implementierung. Nach dem Push muss der Technical Lead die Checks dieses Heads selbst lesen. Ein grüner Lauf wäre keine Merge-Begründung.

## 6. Bewusst nicht angefasst

`docs/ACTIVE_WORK_STATUS.md`, `ROADMAP.md`, `DECISIONS.md`, `ARCHITECTURE.md`, `JETNITY_VISION.md`, `docs/CONTINUITY_STANDARD.md` und `lib/legal/ap6a-gate0-vertrag.ts`. `kontoloeschung` bleibt dort als historisch zurückgestellter AP-6a-Eintrag stehen. Das ist kein Widerspruch zur Umsetzung, sondern die geforderte Grenze gegen globale Kontinuitätsedits.
