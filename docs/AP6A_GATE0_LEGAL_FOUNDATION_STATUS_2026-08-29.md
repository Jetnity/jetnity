# Jetnity – AP-6a Gate 0 Legal Foundation / Trust Boundary Status

Stand: 29. August 2026  
Status: **IMPLEMENTIERT / AUDIT + CONTRACT + EVIDENCE ONLY / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD-REVIEW**  
Workstream: Account / Legal Foundation  
Logical Cursor-Agent: **`Cursor-Agent: Account plattform audit vorbereitung 16`**  
Draft-PR: https://github.com/Jetnity/jetnity/pull/166  
Branch: `audit/ap6a-gate0-legal-foundation-2026-08-29`  
Issue: [#165](https://github.com/Jetnity/jetnity/issues/165)  
Task: `docs/AP6A_GATE0_LEGAL_FOUNDATION_TASK_2026-08-29.md`

> Live-Evidence gewinnt. Dieses Self-Review ist kein PASS. Kein Ready. Kein Merge. Kein AP-6a-Runtime. Kein AP-6b. Kein AP-7.

## 0. Naming evidence

| Feld | Wert |
| --- | --- |
| Zugewiesener logischer Name | `Cursor-Agent: Account plattform audit vorbereitung 16` |
| Preferred visible title | `Account plattform audit vorbereitung 16` |
| Observed Cursor run title | `Account plattform audit vorbereitung` |
| Cloud-Run | https://cursor.com/agents/bc-216be067-b75a-4a2f-a186-8e38c67fb822 |
| Exact Run-ID | `bc-216be067-b75a-4a2f-a186-8e38c67fb822` |
| Rename-/Title-Fähigkeit | **keine** in den verfügbaren Cursor-Namespaces |
| Regel | `docs/JETNITY_CURSOR_VISIBLE_AGENT_NAME_GATE.md` |
| Generation | **16 bleibt 16.** Keine Generation 17 wegen UI-Titel. |

Dieser Agent behauptet nicht, die sichtbare UI sei umbenannt.

## 1. Live-Rekonstruktion

| Feld | Wert |
| --- | --- |
| Repository | `Jetnity/jetnity` |
| Task-Baseline / live `origin/main` | `765fc547c2d2ffd8460e05fec4234906103fe73c` – Merge PR #164 (AP-5-S5 integriert) |
| Branch | `audit/ap6a-gate0-legal-foundation-2026-08-29` |
| Merge-Base | `765fc547c2d2ffd8460e05fec4234906103fe73c` |
| Ahead / Behind vor Authoring | **1 / 0** (Task-Commit `668c2f17`) |
| Draft-PR | #166 OPEN / Draft |
| `main` Branch Protection | live `protected=false`; unverändert |
| Supabase | **nicht** abgefragt, **nicht** mutiert |
| Browser / Real-Device | **nein** – Docs/Contract/Inventory |
| Mutating Runtime | **keine** |

Details: `docs/AP6A_GATE0_LEGAL_FOUNDATION_LIVE_EVIDENCE_2026-08-29.md`.

### 1.1 Post-AP-5-S5 Baseline-Evidence

| Fakt | Wert | Quelle |
| --- | --- | --- |
| PR #164 | **MERGED** | dieser Run |
| Post-Merge Actions | `33242227312` SUCCESS auf exakt `765fc547` | dieser Run |
| GitHub Production | `6153740318` success auf exakt `765fc547` | dieser Run |
| Live Deployment-ID im HTML | `dpl_3PWuyGopCnjcdh44twcUUpCWXzmi` | `curl` Production-Alias |
| `/privacy` `/terms` | HTTP **404** | dieser Run |

AP-5-S1–S5 sind auf dieser Baseline **integriert**. Ältere Continuity-Zeilen „Draft-PR #162 / kein AP-6“ sind Pre-AP-6a-Evidence.

## 2. Task / Scope / Non-Scope

**Scope:** Live-/Code-Rekonstruktion der Legal-/Privacy-/Consent-Wahrheit. Runtime-Vertrag für `/privacy` und `/terms`. Legal-Input-Matrix. AP-6a/AP-6b-Grenze. Continuity nach vollständigem AP-5.

**Non-Scope (hart):** keine erfundenen AGB/Datenschutztexte; keine produktiven Legal-Seiten; keine Consent-Persistenz; keine Migration/RLS/Identity/Auth/MFA/AAL; keine Service Role; kein Export/Kontolöschung; kein AP-7; kein Provider-/Payments-Live; kein Public Indexing; kein Domain Cutover; keine Branch Protection; keine Kosten.

## 3. Current Truth

### 3.1 Trust-Boundary-Defekt D0-P1-03

Production-Alias `https://jetnity-app.vercel.app`:

- `/register` **200**, verlangt Zustimmung zu Nutzungsbedingungen und Datenschutzerklärung.
- `/privacy` **404**.
- `/terms` **404**.

Das ist der aktuelle Trust-P1. Gate 0 behebt ihn nicht mit Text.

### 3.2 Call-Sites

| Call-Site | Klasse | Befund |
| --- | --- | --- |
| `RegisterForm` Checkbox + Links | **belegt / broken link** | Pflicht-Checkbox; Submit disabled ohne `accept`; Links `/terms` `/privacy`. Consent wird **nicht** an `signUp` geschrieben. |
| `RegisterForm` OAuth | **belegt / Residual** | `handleOAuth` prüft `accept` nicht. Google/Apple in `config.toml` `enabled = false`. |
| `RegisterForm` / `LoginForm` Konformitätszeile | **belegt / unbelegte Behauptung** | „Datenschutz: DSGVO & CH-DSG konform.“ Keine Legal-Seite, keine Legal-Freigabe im Repo. |
| Footer | **belegt / Lücke** | `info@jetnity.ch`; Copyright-Zeile; **keine** Legal-Links. |
| PublicNavbar | **belegt / keine Legal-Links** | — |
| `CookieConsent` | **belegt / Orphan** | nicht gemountet; `check:dead`-Ausnahme; V1-Text Views/Likes; Link `/privacy`. |
| Consent-DB | **fehlend** | keine Migration. |
| Export / Kontolöschung | **fehlend** | AP-6b. |
| Analytics-SDK | **nicht gefunden** | kein Marketing-Tracker in App-Quellen. |
| `/impressum` `/datenschutz` | **404** | verwandt; nicht AP-6a-Pflicht. |

### 3.3 Firmen-/Kontakt-/Domain-Fakten

| Fakt | Klasse |
| --- | --- |
| Produktname Jetnity | **belegt** |
| Anzeige-Mail `info@jetnity.ch` | **belegt** als Footer-Kontakt, **nicht** als Controller |
| Intendierte Domains `jetnity.com` / `jetnity.ch` | **belegt** als Produktvertrag; live **keine** DNS-Auflösung |
| Production-Alias `jetnity-app.vercel.app` | **belegt** |
| Rechtsform, UID, Sitz, ladungsfähige Adresse | **fehlend** |
| Verantwortliche Stelle | **fehlend** |
| Gerichtsstand / anwendbares Recht | **fehlend** – nicht erfinden |

Vollständige Matrix: `docs/AP6A_GATE0_LEGAL_CONTENT_INPUT_CONTRACT_2026-08-29.md`.

### 3.4 Technisch ableitbare Verarbeitungen (keine Legal-Copy)

Nur als Inventar für Legal, nicht als Datenschutzerklärung:

- Auth: E-Mail, Passwort, optionales `name` in `user_metadata`.
- `profiles`: email, display_name, avatar_url, role, status, last_seen_at.
- Reisen und trip-scoped Traveller/Party **ohne** Passnummern/Scans/MRZ/Biometrie.
- Guest-LocalStorage `jetnity:reise:v3`.
- Gast-Cookie `jetnity_gast` (Quota, httpOnly, 30 Tage).
- Supabase-Auth-Cookies (SSR).
- `model_usage` (Hash, Kosten, keine Reiseinhalte; keine Auto-Löschung dokumentiert).
- Admin sieht Nutzer-PII über `konten-verwalten`.
- Infra-Kategorien: Vercel, Supabase, GeoNames, optional Modell-API. Keine live Search/Affiliate-Provider.

Rechtsgrundlagen, AV-Verträge, Transferinstrumente, Retention: **fehlend / PO-Legal-approval-required**.

## 4. Runtime-Vertrag und Folge-Gate

Definiert in `docs/AP6A_GATE0_LEGAL_RUNTIME_CONTRACT_2026-08-29.md` und `lib/legal/ap6a-gate0-vertrag.ts`.

Empfehlung dieses Gate 0 (keine Runtime-Freigabe):

1. Keine Legal-Seiten ohne gelieferte Texte.
2. Keine Schein-Privacy, die Konformität andeutet. 404 ist ehrlicher als erfundene AGB.
3. Nach Content-Gate: Public-Layout, eine `h1`, noindex bis Public-Indexing-Gate, Footer-Links, Register-200.
4. „DSGVO & CH-DSG konform“ entfernen oder nur nach Legal belassen.
5. `CookieConsent` nicht mit V1-Text mounten.
6. AP-6b (Consent-DB, Export, Delete) serial danach.

## 5. AP-6a / AP-6b

| Thema | AP-6a | AP-6b |
| --- | --- | --- |
| `/privacy` `/terms` Seiten | ja, nach Content-Gate | nein |
| Footer-Links | ja | nein |
| Consent-Persistenz | **nein** | ja |
| Export / Kontolöschung | **nein** | ja |
| Migration / RLS | **nein** | ja |
| Cookie-Banner ehrlich | nur Entscheidung + ggf. Copy; kein Pflicht-Mount | Persistenz, falls überhaupt |

## 6. Was dieser Slice geliefert hat

1. Live-Rekonstruktion gegen `765fc547` inkl. Production-404.
2. Vollständiges Call-Site-Inventar.
3. Legal-Input-Vertrag für PO/Legal.
4. Runtime-Vertrag ohne Rechtstext.
5. Inventory-Test `lib/legal/ap6a-gate0-legal-foundation-inventory.test.ts`.
6. ADR-0195.
7. Continuity: AP-5 vollständig integriert, AP-6a Gate 0 aktueller Slice.

Keine Datei unter `app/(public)/privacy` oder `terms`. Keine Migration. Keine Auth-Änderung.

## 7. Tests / Gates

Lokale Gates auf Authoring-Head `dce9ee8c`, persistiert in `docs/AP6A_GATE0_LOCAL_TEST_EVIDENCE_2026-08-29.md`:

- Inventory 9/9; `npm test` 2564/2564; typecheck pass; lint 0 errors / 135 warnings; hygiene pass; Production-Build Next 16.3.3 ohne `/privacy`/`/terms`-Routen.
- `auth:pruefen` nicht gelaufen (kein Auth-Slice, kein Secret).
- Dieser Stamp erzeugt einen neueren Head. Prior Task-Checks auf `668c2f17` und lokale Gates auf `dce9ee8c` gelten nicht mehr für den Review-Head. Live am PR prüfen.

## 8. Risiken / Review-Funde des Autors

- Register verlangt Zustimmung zu unsichtbaren Dokumenten. Das bleibt bis Runtime + Content-Gate.
- Unbelegte Konformitätszeile ist ein zweiter Trust-Defekt, nicht nur der 404.
- OAuth-Pfad umgeht die Checkbox; derzeit enablement-aus.
- CookieConsent-V1-Text darf nicht still live gehen.
- `main` `protected=false`.
- Agent-Self-Review ist kein PASS.
- Kein Browser-Beweis des Register-Klicks; HTTP-404 und Code-Links sind unabhängig belegt.

## 9. Offene Nutzerentscheidungen

Nur Product Owner / Legal können die Matrix in Abschnitt 2 des Input-Vertrags schließen.  
Dieser Agent löst keine dieser Lücken.

## 10. Exakter nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review von Draft-PR #166.  
Kein Ready. Kein Merge. Kein AP-6a-Runtime. Kein AP-6b. Kein AP-7.
