# Admin Platform – Permission- und Security-Matrix

Stand: 24. August 2026  
Status: **Ist + Zielvorschlag; keine Production-Rollenänderung in dieser Phase**  
Cursor-Anzeigename: `Admin platform audit`

## 1. Zugang heute

| Prüfstelle | Was geprüft wird | Ergebnis bei Fehlschlag |
| --- | --- | --- |
| `middleware.ts` | Session via `auth.getUser()` | Redirect `/admin/login` oder API 401/503 |
| `app/(admin)/layout.tsx` | Rolle ≥ `moderator` oder Break-Glass | Redirect `/unauthorized` |
| `requireAdminPage(capability)` | zusätzliche Fähigkeit | Redirect |
| `requireAdminApi(capability)` | zusätzliche Fähigkeit | 401 / 403 / 503 |
| RLS `darf_*()` | dieselbe Fähigkeit in der DB | leere Menge oder Write-Ablehnung |
| Trigger `profiles_rollenwechsel` | Rang, kein Selbst-Edit | SQL-Fehler |

Break-Glass (`ADMIN_ALLOWED_EMAILS`): nur exakte Adressen. Öffnet UI, nicht RLS. Banner `NotzugangHinweis`.

## 2. Rollen × Fähigkeiten (Ist, Code = DB)

Quelle: `lib/auth/roles.ts` ↔ `public.darf_*()`.

| | user | creator | moderator | operator | admin | owner |
| --- | --- | --- | --- | --- | --- | --- |
| Admin-Bereich betreten | nein | nein | ja | ja | ja | ja |
| `betrieb-lesen` | nein | nein | ja | ja | ja | ja |
| `betrieb-eingreifen` | nein | nein | nein | ja | ja | ja |
| `konten-verwalten` | nein | nein | ja | ja | ja | ja |
| `inhalte-moderieren` | nein | nein | ja | ja | ja | ja |
| `konfiguration-verwalten` | nein | nein | nein | nein | ja | ja |

`creator` liegt unter `moderator` und hat keinen Admin-Zugang. Die Rolle ist trotzdem vergebbar (Owner).

Rollenvergabe: niemand ändert sich selbst; nur höherer Rang setzt niedrigere Rollen; nur `owner` setzt jede fremde Rolle inkl. `owner`.

## 3. Oberflächen × Gate (Ist)

| Oberfläche | Page-Gate | API/Action-Gate | RLS |
| --- | --- | --- | --- |
| `/admin` Layout | Bereich | — | RPCs prüfen `betrieb-lesen` |
| `/admin/users` | `konten-verwalten` | dieselben Actions | `profiles_*` |
| `/admin/payments` | nur Bereich | APIs `betrieb-lesen` / Refund `betrieb-eingreifen` | payments/refunds/webhooks |
| `/admin/security` | nur Bereich | list `lesen`, block `eingreifen` | events/blocked_ips |
| Stub-Seiten | nur Bereich | keine API | — |
| `/admin/login` | öffentlich | Login-Actions | — |

Lücke: Page ohne Capability + API mit Capability → leere 200-Flächen für Break-Glass und zu niedrige Rollen, die trotzdem die Seite sehen.

## 4. Tabellenrechte (Ist, nach Fähigkeiten-Migration)

| Tabelle | SELECT | INSERT | UPDATE | DELETE | Admin-Sonderweg |
| --- | --- | --- | --- | --- | --- |
| `profiles` | eigen oder `konten-verwalten` | eigen | eigen oder `konten-verwalten` | eigen oder `konten-verwalten` | Trigger blockt Selbst-Rollenwechsel |
| `trips` + Kinder | nur `user_id = auth.uid()` | nur eigen | nur eigen | nur eigen | **kein Admin-Read** |
| `payments` | `betrieb-lesen` | service_role only | `betrieb-eingreifen` | — | Refund setzt Status |
| `refunds` | `betrieb-lesen` | `betrieb-eingreifen` | — | — | kein Akteur |
| `stripe_webhooks` | `betrieb-lesen` | service_role only | — | — | kein Handler |
| `security_events` | `betrieb-lesen` | — | — | — | kein Produzent |
| `blocked_ips` | `betrieb-lesen` | `betrieb-eingreifen` | `betrieb-eingreifen` | `betrieb-eingreifen` | nicht enforced |
| `model_usage` | `betrieb-lesen` | RPC service_role | — | — | nicht im Admin-UI |

## 5. DEFINER-Funktionen

| Funktion | DEFINER | Selbstprüfung | Risiko |
| --- | --- | --- | --- |
| `admin_security_overview()` | ja | `darf_betrieb_lesen` | search_path gehärtet |
| `admin_payments_summary_30d()` | ja | `darf_betrieb_lesen` | search_path `public, pg_temp` schwächer |
| `admin_reisen_kennzahlen()` | ja | `darf_betrieb_lesen` | nur Aggregate, korrekt |
| `admin_reisen_zeitreihe()` | ja | `darf_betrieb_lesen` | nur Aggregate, korrekt |
| `aktuelle_rolle()` / `hat_rolle_mindestens()` | ja | liest `profiles` | zentrale Autorität |
| `darf_*()` | invoker | ruft `hat_rolle_mindestens` | korrekt |

Unberechtigt: leere Menge, kein Fehler. UI muss das von „keine Ereignisse“ unterscheiden – Break-Glass-Banner tut das nur global.

## 6. Kritische Aktionen – Ist vs Ziel

| Aktion | Heute | Bestätigung | Audit | Step-up | Ziel |
| --- | --- | --- | --- | --- | --- |
| Rolle setzen | Action + Trigger | nein | console only | nein | Confirm + Audit + kein Selbst-Edit (bleibt) |
| Status/Ban | Action + Rang | nein | console only | nein | Confirm + Audit |
| Refund lokal | POST | nein | nein | nein | ehrliches Label; später Provider + Gate |
| IP block/unblock | POST | nein | nein | nein | Validierung; Enforcement nur nach Gate |
| Copilot Auto | toter POST | — | — | — | entfernen |
| Kill Switch | ENV, nicht UI | — | — | — | sichtbar; Schreiben nur Owner-Gate |
| Domain/DNS/Mail write | nicht vorhanden | — | — | — | Manager oder einzelnes Gate |
| Trip-Truth ändern | RLS verhindert | — | — | — | weiterhin verhindert |
| Service-Role-Admin | nicht genutzt | — | — | — | so belassen |

## 7. Ziel-Capabilities (Vorschlag, nicht anlegen)

Nur nach Slice 0:

- `reisen-support-lesen`
- `infra-lesen`
- `audit-lesen`
- `provider-lesen`
- `finance-lesen` / `finance-eingreifen`
- `domain-lesen` / `domain-eingreifen`
- `copilot-nutzen`

UI-Hiding folgt diesen Capabilities. Server und RLS bleiben maßgeblich.

## 8. Session- und Transportziel

| Kontrolle | Ist | Ziel |
| --- | --- | --- |
| Admin MFA | optional Account-TOTP | AAL2 für Bereich oder mindestens für Writes |
| CSRF auf JSON-POST | SameSite | Origin-Check oder Token auf Writes |
| Rate-Limit Admin-Write | nein | analog Travel-APIs |
| Cache | `no-store` auf API-Denials | auch auf Health-APIs mit kurzem Server-Cache |
| Secrets im UI | nicht beobachtet | Presence only |
| Logging | Warn/Info mit user id | keine Tokens, keine Mailinhalte, keine Credentials |
