# Jetnity – AP-5 Gate 0 Account Security Capability Audit – Status

Stand: 28. August 2026  
Status: **AUTHOR COMPLETE / DRAFT / KEIN READY / KEIN MERGE / KEINE AP-5-RUNTIME**  
Workstream: Account / Traveller  
Cursor-Agent: **`Account plattform audit vorbereitung 8`**  
Issue: [#128](https://github.com/Jetnity/jetnity/issues/128)  
Branch: `cursor/ap5-gate0-auth-session-mfa-79f9`

> Live-Evidence gewinnt. Vorbereitungs-SHAs sind Start-Evidence.

## 1. Live-Rekonstruktion dieses Agenten

| Feld | Wert |
| --- | --- |
| Lokales `main` beim Boot | `918bf360` – hinter Remote, nicht verwendet |
| `origin/main` nach Fetch | `0bca31b5de06bcee74c5436122b1685b6d2092f6` – Merge PR #127 |
| Author-Branch-Start | exakt `0bca31b5` |
| `main` Branch Protection | `protected=false` |
| Issue #128 | OPEN |
| Offene PRs | #88, #52, #50, #40, #39, #28 – historical/fremd; nicht angefasst |
| Post-Merge CI auf `0bca31b5` | Actions Run `33135994218` **SUCCESS** |
| Post-Merge Production | GitHub Deployment `6134518159` **success** auf exakt `0bca31b5` |
| P2-TA-04 C1 / PR #126 | **integrated**; Issue #122 CLOSED / completed. Nicht neu bauen. |
| `npm run auth:pruefen` | **sauber**: 55/55 Sollwerte, 242 Schlüssel eingeordnet, kein ungenannter Provider/Hook |

Installierte Client-Wahrheit, nicht geraten:

- `@supabase/supabase-js` **2.57.2**
- `@supabase/auth-js` **2.71.1**

## 2. Was dieser Slice geliefert hat

Nur Audit / Architecture / Evidence:

1. Rekonstruktion des bestehenden Auth-/Session-/MFA-Vertrags
2. Slice-Schnitt AP-5 mit TL- vs. Product-Owner-Gate
3. ADR-0182
4. Inventory-Test `lib/auth/ap5-gate0-contract-inventory.test.ts`
5. Status, Handoff, Self-Review, Agent-Rotation, Continuity-Zeiger

Keine Runtime-, Migrations-, Config-, Schema-, Grant- oder RLS-Datei. `supabase/config.toml` unverändert.

## 3. Vertrag – Passwortänderung

| Aussage | Klasse | Evidence |
| --- | --- | --- |
| Auth verlangt kürzlich bestätigte Reauthentication, nicht das alte Passwort | **current** | `auth.email.secure_password_change = true` → API `security_update_password_require_reauthentication`. `security_update_password_require_current_password = false`. Live `auth:pruefen` 55/55. `lib/supabase/auth-erwartung.test.ts`. |
| Recovery-Pfad existiert | **current** | `LoginForm.resetPasswordForEmail` → `/auth/update-password`. `CallbackClient` leitet `type=recovery` dorthin. Seite ruft `updateUser({ password })`. |
| In-Account-Oberfläche fehlt | **current / missing** | `/account/security` zeigt nur TOTP/Passkeys. Settings-Karte erwähnt nur 2FA. |
| `reauthenticate()` ist im Client vorhanden, ungenutzt | **current** | `GoTrueClient.reauthenticate()` → `GET /reauthenticate`. Sendet OTP an die E-Mail der **bereits angemeldeten** Sitzung. `updateUser` akzeptiert `nonce`. App ruft beides nicht auf. |
| Recovery-Link **ist** die Reauthentication | **current** | `auth:fluesse` setzt das neue Passwort mit dem Recovery-Access-Token. Das ist kein Current-Password-Submit. |
| `/auth/update-password` akzeptiert jede Browser-Session | **current / residual** | Seite prüft `getSession()`, nicht `getUser()`, nicht `type=recovery`. Ein bereits eingeloggter Nutzer, der die URL kennt, sieht dieselbe Maske. |
| Altes Passwort gilt nach Änderung nicht mehr | **current** | `auth:fluesse`: Login mit altem Passwort → HTTP 400. Das ist **kein** Beweis, dass fremde Refresh-Token-Ketten sofort tot sind. |
| Current-Password-Submit wäre ein neuer Vertrag | **gated** | Würde `security_update_password_require_current_password` auf true drehen. Product-Owner-Sondergate. Recovery-Pfad würde brechen. |

**Folgerung:** AP-5 darf eine In-Account-Passwortänderung bauen, wenn sie denselben Vertrag benutzt: angemeldete Sitzung + `reauthenticate()` / Recovery-Session + `updateUser({ password, nonce? })`. Kein Feld „aktuelles Passwort“.

## 4. Vertrag – Session-/Geräte-Sichtbarkeit

| Aussage | Klasse | Evidence |
| --- | --- | --- |
| User-facing `listSessions` / `getSessions` existiert im installierten Client nicht | **current / unsupported** | Suche in `@supabase/auth-js` 2.71.1: keine Methode. JWT trägt `session_id`, das ist die **aktuelle** Sitzung. |
| Keine App-Route, keine API, keine UI | **current / missing** | Inventory-Test. `/account/security` hat keine Sitzungsliste. |
| `auth.sessions` wird von der App nicht gelesen | **current** | Kein `.from('sessions')`, kein `auth.sessions`-SELECT in App/Lib/Components. |
| Mehrere Sitzungen sind erlaubt | **current** | `sessions_single_per_user = false`. Timebox/Inactivity = 0. |
| Admin-Session-Listing wäre privileged plumbing | **gated** | `GoTrueAdminApi` in dieser Version hat `signOut(jwt, scope)`, aber kein User-Session-Listing. Service-Role / `auth.sessions`-Schema wäre neues Privilegienmodell. |

**Folgerung:** Eine echte Geräte-/Sessionliste ist mit den **heute unterstützten User-APIs nicht baubar**. Die ehrliche UI-Aussage ist `unsupported`, nicht `empty`. Eine Liste über Service Role, `auth.sessions` oder neues Schema ist Product-Owner-Sondergate.

Was ohne neue Architektur gezeigt werden darf:

- dass **diese** Sitzung existiert (`getUser()`, JWT `session_id`, AAL aus `getAuthenticatorAssuranceLevel`);
- dass andere Sitzungen **nicht aufzählbar** sind (`unsupported`);
- Logout-Aktionen über vorhandene `signOut`-Scopes.

## 5. Vertrag – Logout current / others / all

| Scope | Client-API | GoTrue | Heutige Jetnity-UI |
| --- | --- | --- | --- |
| `global` | Default von `signOut()` | `POST /logout?scope=global` | **Das ist das heutige Abmelden.** `signOutAction` / `signOutToAdminLoginAction` rufen `signOut()` ohne Option. |
| `local` | `signOut({ scope: 'local' })` | nur diese Sitzung | **fehlt** |
| `others` | `signOut({ scope: 'others' })` | alle anderen; kein `SIGNED_OUT` lokal | **fehlt** |

Weitere gemessene Semantik aus dem installierten Client:

- Access-Token bleibt bis `jwt_expiry` (3600 s) gültig. Refresh-Token-Kette wird je Scope widerrufen. Das ist kein sofortiges JWT-Kill.
- 404/401/403 vom Logout-Endpunkt werden verschluckt; die lokale Session wird trotzdem entfernt, ausser bei `others`.
- `signOutAction` prüft den Fehler nicht und redirected immer. Ein Netzfehler kann lokal eine Session hinterlassen oder das Gegenteil: Redirect trotz unvollständigem Server-Revoke. Das ist **stale / error**, nicht stilles Gelingen.
- Navbar/Footer/Unauthorized nutzen dieselbe globale Action. Admin-Login hat eine zweite Action nur wegen des Redirect-Ziels.

**Folgerung:** „Logout all“ ist **kein** neues Produkt. Es ist die heutige Semantik von „Abmelden“. Eine UI „andere Geräte“ / „nur dieses Gerät“ darf die vorhandenen Scopes nutzen. Den Default von `global` auf `local` zu drehen ändert Session-Semantik und braucht ein Product-Owner-Sondergate.

## 6. Vertrag – MFA Enroll / Unenroll / Step-up

| Fähigkeit | Stand | Authority |
| --- | --- | --- |
| TOTP enroll/verify/unenroll im Konto | **integrated, client-only** | `SecurityMFA` → Browser-`mfa.*`. Kein Server-Action-Gate. |
| Login-MFA-Dialog | **integrated, skippable** | Nach Passwort prüft `LoginForm` `nextLevel === 'aal2'`. Abbrechen schließt nur den Dialog. Die AAL1-Sitzung bleibt. Middleware lässt `/account` mit `getUser()` durch. |
| Admin-AAL2 | **integrated, server-enforced** | `currentLevel === 'aal2'`. Nicht Consumer. Nicht anfassen. |
| Consumer-AAL2 auf `/account` | **missing / gated** | Middleware prüft Auth, nicht AAL. |
| `mfa_allow_low_aal` | **false** | Konto mit Faktor darf nicht dauerhaft auf AAL1 bleiben. Das ersetzt kein App-Step-up vor Unenroll. |
| Passkeys | **gated / disabled** | `[auth.passkey] enabled = false`; WebAuthn-MFA aus. UI kann „verfügbar“ zeigen, wenn Browser-API existiert – das ist keine Server-Freigabe. |
| Erstes Enroll | **AAL1 ist der vorgesehene Weg** | Ohne Faktor gibt es kein AAL2. `auth:fluesse` legt einen Faktor an und löscht ihn wieder **ohne** Verify; das ist unverified-factor, nicht Step-up. |
| Unenroll verifizierter Faktoren | **App erzwingt kein Step-up** | `handleRemove` ruft `unenroll` direkt. Ob GoTrue AAL2 verlangt, ist **unknown** ohne Live-Unenroll eines verifizierten Faktors. Nicht als vorhanden behaupten. |

**Folgerung:** Ein UI-Step-up vor Unenroll eines **verifizierten** Faktors über vorhandenes `challenge`/`verify` ist normales TL-Gate. Consumer-AAL2 für alle Account-Routen, MFA-Config oder Passkey-Live sind Product-Owner-Sondergates.

## 7. Client-/Server-Authority, Redirects, Enumeration, Leakage

| Fläche | Authority | Befund |
| --- | --- | --- |
| `/account*` Middleware | Server `getUser()` | Auth ja, AAL nein. ENV-Fail → deny, nicht open. |
| Login/Register-Seiten | Server `getUser()` + `anmeldeSeiteZiel` | `getSession()` verboten. Tests in `anmelde-gatter.test.ts`. |
| `next` | `erlaubtesNaechstesZiel` | nur `/account*` und `/reisen*`. Fremde Hosts / Schemes fallen auf `/reisen`. |
| Recovery `redirectTo` | Client `window.location.origin` | Fremder Host fällt laut `auth:fluesse` auf `site_url`. `additional_redirect_urls` bleibt leer. Production-Origin steht nicht in der Liste; das bleibt der bekannte AUTH.md-Offenpunkt, kein AP-5-Fix. |
| Callback | Client | Hash-`error_description` und OAuth-`error` werden roh angezeigt. `getSession()` nur als Fallback. |
| Register | Client + `registerSignupOeffentlichAuswerten` | Bestandskonto → neutrale Copy. |
| Login-Fehler | Client `mapAuthError` | Invalid credentials zusammengefasst. Unbekannte Meldungen können durchfallen. |
| Forgot-password | Client | „Wenn die E-Mail existiert…“ – Enumeration entschärft. |
| SecurityMFA / MFA-Dialog | Client | Roh `err.message`. QR/URI im DOM. Kein Server-Log der Secrets im App-Code, aber Client-Fehlertexte sind Leakage. |
| update-password | Client | HIBP/Regel über `passwortAblehnung`. Sonst Rohmeldung. Session-Check über `getSession()`. |
| signOut | Server Action | Kein offenes Redirect. Fehler ignoriert. |
| Logging | Middleware `console.error` | Keine Tokens in den gelesenen Pfaden. MFA-QR darf nicht geloggt werden; der Client rendert ihn nur. |

## 8. Privacy von Session-/Geräte-Metadaten

Heute sammelt Jetnity **keine** Device-IP, User-Agent-Liste oder Session-Tabelle für Consumer.

Was die Security-UI schon zeigt: Faktor-ID-Präfix und `created_at` des TOTP-Faktors. Das ist Auth-Faktor-Metadatum, kein Marketingprofil.

Regel für spätere Slices:

- keine Session-/Geräte-Metadaten ins Marketing;
- keine Service-Role-Sessionliste ohne Product-Owner-Gate;
- wenn eine spätere offizielle User-API nur `session_id` + `created_at` + grobes `user_agent` liefert: minimieren, nicht geolocaten, nicht persistieren.

## 9. Zustände: empty / unsupported / unavailable / error

Heutige Security-UI vermischt sie.

| Lage | Heute | Soll für AP-5 |
| --- | --- | --- |
| Keine TOTP-Faktoren, API ok | Liste fehlt, Button „einrichten“ | `empty` |
| `mfa.listFactors` fehlt im Client | leere Liste, kein Hinweis | `unsupported` |
| listFactors wirft | `error` mit Rohtext | `error`, ohne Roh-GoTrue |
| Passkey-Config aus, Browser kann WebAuthn | „derzeit nicht aktiv“ oder fälschlich „verfügbar“ | `unsupported` (Server aus) |
| Browser ohne WebAuthn | „nicht aktiv“ | `unavailable` |
| Sessionliste | nicht gebaut | `unsupported`, nie `empty` |
| Logout-API 5xx | Redirect trotzdem | `error` / fail-closed ehrlich |
| Reauth nötig, OTP ausstehend | nicht gebaut | eigener Pending-Zustand, nicht `error` |

## 10. AP-5 Folgeslices

Kein Slice startet aus diesem Dokument. Reihenfolge ist Empfehlung, keine Build-Order-Änderung.

| ID | Inhalt | Gate |
| --- | --- | --- |
| **AP-5-S1** | Security-Seite ehrlich: empty ≠ unsupported ≠ unavailable ≠ error. Rohfehler raus. Passkey-Panel sagt „aus“, nicht „bald live“. Faktor-ID nicht als Geräteidentität. | **normales Technical-Lead-Gate** |
| **AP-5-S2** | In-Account-Passwortänderung auf `/account/security` über bestehenden Vertrag: `reauthenticate()` + `updateUser({ password, nonce })`. Recovery-Seite bleibt Recovery. Kein Current-Password-Feld. HIBP/Richtlinie unverändert. | **normales Technical-Lead-Gate** |
| **AP-5-S3** | Logout-UI: heutiges Abmelden als „überall“ belassen; optional „andere Sitzungen“ über `scope: 'others'`. Fehler nicht schlucken. JWT-Restlaufzeit nicht als sofort tot behaupten. | **normales Technical-Lead-Gate** |
| **AP-5-S4** | Step-up vor Unenroll eines **verifizierten** TOTP-Faktors über vorhandenes `challenge`/`verify`. Erstes Enroll bleibt AAL1. Login-Dialog-Abbrechen nicht still als AAL2 behandeln. | **normales Technical-Lead-Gate**, solange kein Consumer-AAL2-Middleware |
| **AP-5-S5** | Session-Karte: aktuelle Sitzung ja; andere Sitzungen `unsupported`. Keine Fake-Geräteliste. | **normales Technical-Lead-Gate** |
| **AP-5-P1** | Default-Logout von `global` auf `local` ändern | **Product-Owner-Sondergate** – Session-Semantik |
| **AP-5-P2** | Session-/Geräteliste über Service Role, `auth.sessions` oder neues Schema | **Product-Owner-Sondergate** – Session-Architektur + Privilegien |
| **AP-5-P3** | Consumer-AAL2-Pflicht auf `/account` oder Login-Hard-Gate | **Product-Owner-Sondergate** – MFA/AAL-Grundlogik |
| **AP-5-P4** | Auth-Config-Push, `current_password` an, Passkey/OAuth live, `sessions_single_per_user` an | **Product-Owner-Sondergate** – Production-Auth-Config / Secrets |
| **AP-5-P5** | C2, REVOKE, SECURITY DEFINER, RLS/Identity | **kein AP-5**; bleibt hinter eigenen Gates |

S1 ist der kleinste, konfliktärmste Folgeslice. S2 ist der erste nutzbare Security-Gewinn. S3/S4/S5 nur nach S1, damit Zustände nicht wieder vermischt werden.

## 11. Tests / Evidence dieses Gate 0

| Lauf | Ergebnis |
| --- | --- |
| `npm run auth:pruefen` | sauber, 55/55, 242 Schlüssel |
| Inventory-Test | lokal nach Authoring; Exact-Head danach |
| `auth:fluesse` | **nicht** in diesem Slice ausgeführt (schreibendes Wegwerfkonto). Historische Evidence 17. August 2026 in `docs/AUTH.md` |
| Browser / Real-Device | nicht gelaufen, nicht behauptet |
| Production Auth-Config | nicht gepusht, nicht als byte-identisch zu Development behauptet. `docs/AUTH.md` Abschnitt 3 bleibt Parent-Read vom 17. August 2026 |

## 12. Residuals – nicht in AP-5 mischen

- D0-P1-03 `/privacy` `/terms` 404 → AP-6a / Legal-PO
- C2 REVOKE/DEFINER → eigenes PO-Gate
- Production-Origin nicht in `additional_redirect_urls` → AUTH.md offen, Config-Gate
- Login-MFA abbrechbar → S4 darf es ehrlich machen, nicht still AAL2 erfinden
- `main` Branch Protection `protected=false`
- Develop-History-Drift bleibt Sanitation, kein AP-5

## 13. Nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review dieses Draft-PR.

Nicht Ready. Nicht mergen. Keinen AP-5-Runtime-Slice aus diesem Status starten.
