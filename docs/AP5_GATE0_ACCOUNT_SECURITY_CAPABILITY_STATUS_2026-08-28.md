# Jetnity – AP-5 Gate 0 Account Security Capability Audit – Status

Stand: 28. August 2026  
Status: **REVIEW-FIX FÜR 5049870788 / DRAFT / KEIN READY / KEIN MERGE / KEINE AP-5-RUNTIME**  
Workstream: Account / Traveller  
Cursor-Agent: **`Account plattform audit vorbereitung 8`**  
Issue: [#128](https://github.com/Jetnity/jetnity/issues/128)  
Branch: `cursor/ap5-gate0-auth-session-mfa-79f9`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/129

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

### 1.1 Exact-Head auf Stamp-Head `8ead1a8f`

| Feld | Wert |
| --- | --- |
| Gegateter Stamp-Head | `8ead1a8f7e34c7d1745e358faed9705779ebe1fb` |
| Merge-Base / `origin/main` | `0bca31b5de06bcee74c5436122b1685b6d2092f6` |
| GitHub Actions | Run `33137160070` **SUCCESS** auf exakt `8ead1a8f` |
| Jobs | Typecheck/Lint/Build SUCCESS; Auth-Konfiguration gegen config.toml SUCCESS |
| Vercel Preview | Inspector `8h2J9vfjaCWSJVS6W4RcvLEHVowz` **SUCCESS** auf exakt `8ead1a8f` |
| GitHub Preview-Deployment | `6134729753` success |
| Review-Threads | 0 |
| Draft | ja; kein Ready |

Historisch: `5fff38bf` war der Head vor dem ersten Evidence-Stamp (Actions `33136978825`, Vercel `DUGxaYrrx1NDjVLt5r1DahTEyacE`). Dieser Abschnitt dokumentiert die erfolgreiche Re-Gate von `8ead1a8f`. Der vorliegende Continuity-Stamp erzeugt einen neueren Head; dessen CI muss live gelesen werden. **Kein dritter Evidence-Stamp**, außer diese Stamp-CI fehlschlägt.

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
| Password-Recovery und signed-in Reauthentication sind **zwei Authorities** | **current** | Recovery-Flow (`resetPasswordForEmail` → Recovery-Session / `type=recovery` → `/auth/update-password` → `updateUser({ password })`) autorisiert eine Passwortwiederherstellung. Signed-in Change unter `secure_password_change` braucht `reauthenticate()` → Nonce → `updateUser({ password, nonce })`. Der Recovery-Link ist **nicht** die Reauthentication. |
| `/auth/update-password` akzeptiert jede Browser-Session | **current / residual** | Seite prüft `getSession()`, nicht `getUser()`, nicht `type=recovery`. Ein bereits eingeloggter Nutzer, der die URL kennt, sieht dieselbe Maske. Das vermischt Recovery-UI und eingeloggte Session, ändert aber nicht die zwei Authorities. |
| Altes Passwort gilt nach Änderung nicht mehr | **current** | Historische `auth:fluesse`-Evidence: Login mit altem Passwort → HTTP 400. Das ist **kein** Beweis, dass fremde Refresh-Token-Ketten sofort tot sind. |
| `security_update_password_require_current_password = true` | **gated** | Ändert den Auth-Vertrag und bleibt Product-Owner-Sondergate. Recovery-Kompatibilität muss vor einer solchen Config-Änderung separat live/referenzbasiert verifiziert werden. Ohne diese Evidence wird kein sicherer Bruch des Recovery-Pfads behauptet. |

**Folgerung:** AP-5-S2 darf eine In-Account-Passwortänderung nur über den signed-in Vertrag bauen: angemeldete Sitzung + `reauthenticate()` → Nonce → `updateUser({ password, nonce })`. Der Recovery-Pfad bleibt eine eigene Recovery-Authority und wird nicht als Reauthentication wiederverwendet. Kein Feld „aktuelles Passwort“.

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
| Unenroll verifizierter Faktoren | **GoTrue verlangt aal2; UI steppt nicht hoch** | Aktuelle Supabase-Referenz für `auth.mfa.unenroll`: ein Nutzer muss `aal2` haben, um einen **verified** factor zu unenrollen. Jetnitys UI macht heute keinen proaktiven Step-up (`handleRemove` ruft `unenroll` direkt). GoTrue erzwingt die AAL2-Anforderung serverseitig. Unverified-factor-Unenroll (z. B. Enroll abbrechen) bleibt ohne AAL2 vorgesehen. |

**Folgerung:** AP-5-S4 darf später einen nutzerfreundlichen `challenge`/`verify`-Step-up vor Unenroll eines **verifizierten** Faktors setzen, damit die bereits serverseitige AAL2-Anforderung erfüllbar ist. Das führt kein Consumer-AAL2 global ein. Consumer-AAL2 für alle Account-Routen, MFA-Config oder Passkey-Live bleiben Product-Owner-Sondergates.

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
| **AP-5-S2** | In-Account-Passwortänderung auf `/account/security` nur über den signed-in Vertrag: `reauthenticate()` → Nonce → `updateUser({ password, nonce })`. Recovery-Seite bleibt Recovery-Authority und wird nicht als Reauthentication wiederverwendet. Kein Current-Password-Feld. HIBP/Richtlinie unverändert. | **normales Technical-Lead-Gate** |
| **AP-5-S3** | Logout-UI: heutiges Abmelden als „überall“ belassen; optional „andere Sitzungen“ über `scope: 'others'`. Fehler nicht schlucken. JWT-Restlaufzeit nicht als sofort tot behaupten. | **normales Technical-Lead-Gate** |
| **AP-5-S4** | Nutzerfreundlicher `challenge`/`verify`-Step-up vor Unenroll eines **verifizierten** TOTP-Faktors, weil GoTrue dafür bereits serverseitig `aal2` verlangt. Jetnitys UI steppt heute nicht hoch. Erstes Enroll und unverified Unenroll bleiben AAL1. Login-Dialog-Abbrechen nicht still als AAL2 behandeln. Kein globales Consumer-AAL2. | **normales Technical-Lead-Gate**, solange kein Consumer-AAL2-Middleware |
| **AP-5-S5** | Session-Karte: aktuelle Sitzung ja; andere Sitzungen `unsupported`. Keine Fake-Geräteliste. | **normales Technical-Lead-Gate** |
| **AP-5-P1** | Default-Logout von `global` auf `local` ändern | **Product-Owner-Sondergate** – Session-Semantik |
| **AP-5-P2** | Session-/Geräteliste über Service Role, `auth.sessions` oder neues Schema | **Product-Owner-Sondergate** – Session-Architektur + Privilegien |
| **AP-5-P3** | Consumer-AAL2-Pflicht auf `/account` oder Login-Hard-Gate | **Product-Owner-Sondergate** – MFA/AAL-Grundlogik |
| **AP-5-P4** | Auth-Config-Push, `current_password` an (Recovery-Kompatibilität vorher separat live/referenzbasiert verifizieren; kein unbelegter Bruch), Passkey/OAuth live, `sessions_single_per_user` an | **Product-Owner-Sondergate** – Production-Auth-Config / Secrets |
| **AP-5-P5** | C2, REVOKE, SECURITY DEFINER, RLS/Identity | **kein AP-5**; bleibt hinter eigenen Gates |

S1 ist der kleinste, konfliktärmste Folgeslice. S2 ist der erste nutzbare Security-Gewinn. S3/S4/S5 nur nach S1, damit Zustände nicht wieder vermischt werden.

## 11. Tests / Evidence dieses Gate 0

| Lauf | Ergebnis |
| --- | --- |
| `npm run auth:pruefen` | sauber, 55/55, 242 Schlüssel |
| Inventory-Test | **8/8 pass** `lib/auth/ap5-gate0-contract-inventory.test.ts` |
| Focused Auth/Account-Unit | **84/84 pass** (Inventory, `auth-erwartung`, Passwort, `next`-Allowlist, Register-Enumeration, MFA-Dialog-A11y, Account-Nav) |
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

Review-Fix für Technical-Lead-Review `5049870788` (verified-factor unenroll `aal2`, Recovery ≠ Reauthentication, Current-Password-Breakage nicht unbelegt behaupten). Danach STOPP für erneuten Technical-Lead-Re-Review.

Nicht Ready. Nicht mergen. Keinen AP-5-Runtime-Slice aus diesem Status starten.
