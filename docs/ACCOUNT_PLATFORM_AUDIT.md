# Jetnity Account Platform – Ist-Audit

Stand: 23. August 2026  
Status: **Audit abgeschlossen – keine Kernimplementierung**  
Workstream: Jetnity Account Platform – Benutzerkonto Audit & Vorbereitung  
Cursor-Anzeigename: **Account plattform audit vorbereitung**  
Branch: `audit/account-platform`  
Agent: https://cursor.com/agents/bc-01a030a0-d97f-782b-8bd0-acb906563518

Dieses Dokument beschreibt den **tatsächlich vorhandenen Code**, nicht die Wunscharchitektur. Zielmodell: `docs/ACCOUNT_TRIP_WORKSPACE_PRODUCT_MODEL.md`.

---

## 1. Methode

Geprüft wurden unabhängig voneinander:

- alle 22 `app/**/page.tsx`-Routen
- Account-/Auth-/Trip-Komponenten, Server Actions, Middleware
- Traveller-/Guest→Account-/Readiness-Pfade
- relevante Migrationen (`profiles`, `trips`, `trip_travellers`, Foundation E)
- `docs/AUTH.md`, `docs/REISEN.md`, `docs/DATENBANK.md`, `docs/TRAVELLER_CONTEXT.md`, ADR-0102
- bestehende Tests in `lib/trips/uebernahme.test.ts`, `lib/auth/oeffentliche-navigation.test.ts`, `lib/supabase/auth-erwartung.test.ts`, `lib/readiness/uebernahme.test.ts`

Nicht als Beweis verwendet:

- ältere Abschlussberichte
- grüne CI anderer PRs
- Marketingcopy auf Login/Register

Nicht runtime-verifiziert in dieser Session:

- `npm run auth:pruefen` gegen den Development-Branch (Secrets/Management-API)
- `db:rls` / `db:sicherheit` gegen eine Live-DB
- Browser-/Device-UX
- Production-Auth-URLs und Production-Schema

Auth-Konfigurationswerte in diesem Audit stammen aus `supabase/config.toml` plus `docs/AUTH.md` (erhoben 17. August 2026). Sie können seitdem im Dashboard gedriftet sein; der Repository-Sollwert ist trotzdem die verbindliche Erwartung.

`docs/MULTI_AGENT_DEVELOPMENT_TEAM_POLICY.md` wird vom Auftrag referenziert, existiert im Repository aber **nicht**. Koordination erfolgte nach `docs/MULTI_AGENT_WORKSTREAMS.md`.

---

## 2. Kernurteil

Jetnity hat heute **kein Benutzerkonto als Produkt**, sondern eine **starke Auth- und Reise-Persistenz-Foundation**.

Der reale Nutzerweg ist:

> Login / Register → `/reisen` (Reiseliste) → `/reisen/[tripId]` (Trip Workspace)

Das ist fachlich nah an „Meine Reisen bleibt zentraler Hub“, aber weit entfernt vom verbindlichen Account-Zuhause.

Es gibt **kein zweites Workspace-Dashboard**. Das Risiko ist das Gegenteil: der Trip Workspace ist die einzige reiche Oberfläche; das Konto fehlt als eigene Informationsarchitektur.

Wiederverwendbar und schützenswert:

- RLS-first Trip-Ownership
- Guest→Account-Übernahme mit Idempotenz und fail-closed Cleanup
- Foundation-E-Traveller-Modell (1:n Citizenships/Dokumente, explizite Zuordnung)
- Auth-Konfiguration versioniert und CI-prüfbar
- Empty ≠ Error auf `/reisen`

Nicht gut genug für eine professionelle Account Platform:

- fehlende Account-IA und Navigation
- Traveller nur trip-scoped (ADR-0102) trotz neuer Produktregel „stabile Account-Profile“
- keine Privacy-Selbstbedienung
- Security-Seite verwaist
- keine reiseübergreifende Buchungs-/Favoriten-/Abo-/Profilschicht

---

## 3. Inventar der vorhandenen Oberflächen

| Route | Datei | Rolle | Gast | Konto |
| --- | --- | --- | --- | --- |
| `/login` | `app/(public)/login/page.tsx` | Anmeldung | ja | Redirect `/reisen` |
| `/register` | `app/(public)/register/page.tsx` | Registrierung | ja | Redirect `/reisen` |
| `/auth/callback` | `app/auth/callback/CallbackClient.tsx` | Confirm / OAuth / Recovery | ja | → `/reisen` oder `/auth/update-password` |
| `/auth/update-password` | `app/auth/update-password/page.tsx` | Passwort nach Reset | Sitzung | → `/reisen` |
| `/account/security` | `app/account/security/page.tsx` | TOTP + Passkey-Panel | Middleware → Login | ja, **nirgends verlinkt** |
| `/reisen` | `app/(public)/reisen/page.tsx` | Meine Reisen / De-facto-Landing | 1 Entwurf | flache Liste, max. 200 |
| `/reisen/[tripId]` | `app/(public)/reisen/[tripId]/page.tsx` | Trip Workspace | `GastArbeitsbereich` | `KontoArbeitsbereich` |
| `/planen` | `app/(public)/planen/page.tsx` | Reise anlegen | localStorage | `reiseAnlegen()` |

Nicht vorhanden (keine Route, keine Tabelle, keine UI):

- `/account` Übersicht
- Reisende / Familie
- persönliches Reiseprofil / Präferenzen
- Favoriten / Wunschlisten / Weltkarte
- reiseübergreifende Buchungen
- Benachrichtigungseinstellungen
- Abonnement / Rechnungen / Zahlungsmethoden
- Passwortänderung im eingeloggten Konto
- Sessions/Geräte
- Datenexport
- Kontolöschung
- `/terms`, `/privacy`
- Support / Kontoaktivität

`CookieConsent` existiert in `components/layout/CookieConsent.tsx` und wird **nirgends importiert**.

---

## 4. Abweichung zur verbindlichen Zielarchitektur

| Zielbereich | Ist | Abweichung |
| --- | --- | --- |
| Übersicht | fehlt; `/reisen` trägt die Überschrift „Dein Jetnity“ | keine Begrüßung, keine nächste/aktive Reise, kein „Reise fortsetzen“, keine reiseübergreifenden Hinweise |
| Meine Reisen | flache Kartenliste nach `updated_at` | keine kommenden/aktiven/vergangenen/archivierten Gruppen; `archived` ist nur ein DB-Status ohne Schreibweg |
| Reisende | nur `Trip.party` / `trip_travellers` | Accountbesitzer ≠ Traveller ist korrekt **nicht** vermischt; es gibt aber keine dauerhaften Profile |
| Reiseprofil | trip-level `currency`, `pace`, `interests`, `travel_wish` | keine accountweiten Sprache/Währung/Zeitzone/Präferenzen |
| Favoriten | fehlt | vollständig |
| Buchungen übergreifend | `trip_items.booking_status` je Reise | keine Account-Aggregation |
| Benachrichtigungen | fehlt | vollständig |
| Abo / Zahlung | Marketing `#pro`; Admin-`payments` ohne `user_id` | keine Entitlement-Schicht, korrekt noch nicht live |
| Sicherheit | TOTP-Enroll auf verwaister Seite; Login-Step-up existiert | kein Passwortwechsel, keine Sessions, Passkeys aus, kein Step-up vor Enroll |
| Datenschutz | Checkbox ohne Persistenz; Legal-Links 404 | kein Export, keine Löschung, kein Consent-Register |
| Dokumente | Foundation E: Typ, Aussteller, Ablauf, Citizenship-Link | korrekt keine Nummern/Scans/MRZ/Biometrie |
| Support / Aktivität | `mailto:info@jetnity.ch` | keine Kontoaktivität |

---

## 5. Konkrete Defekte

Jeder Eintrag: Datei/Contract, reproduzierbares Problem, Auswirkung, Risiko, Empfehlung, Abhängigkeit.

### A1 – Keine Account-Informationsarchitektur

- **Pfad:** keine `app/account/layout.tsx`; Navbar in `lib/auth/oeffentliche-navigation.ts` kennt nur Anmelden/Abmelden
- **Problem:** Ein angemeldetes Konto hat keinen Ort „Zuhause“. Sicherheit, Reisen, später Reisende/Abo sind nicht als Konto navigierbar.
- **Auswirkung:** Nutzer verstehen Jetnity als Reiseliste + Workspace, nicht als persönliches Konto.
- **Risiko:** mittel (Produkt/UX); hoch, wenn später Funktionen ad hoc an `/reisen` oder in den Workspace gehängt werden
- **Empfehlung:** eigenes Account-Shell mit kompakter Navigation Übersicht / Reisen / Reisende / Favoriten / Abonnement / Einstellungen. Workspace nicht kopieren.
- **Abhängigkeit:** keine Shared-Contract-Änderung

### A2 – `/account/security` ist unauffindbar und visuell isoliert

- **Pfad:** `app/account/security/page.tsx`, `components/account/SecurityMFA.tsx`
- **Problem:** Kein Link in Navbar, Footer oder `/reisen`. Seite liegt außerhalb des Public-Layouts (keine Navbar/Footer/Skip-Link). Tokens (`text-muted-foreground`, generisches `container`) weichen vom V2-System ab.
- **Auswirkung:** MFA existiert technisch, ist für Nutzer nicht erreichbar.
- **Risiko:** mittel (Security-Adoption)
- **Empfehlung:** in Einstellungen/Sicherheit einhängen; Jetnity-Tokens; Public- oder Account-Chrome.
- **Abhängigkeit:** keine

### A3 – Middleware-`next` wird ignoriert

- **Pfad:** `middleware.ts` setzt `?next=`; `LoginForm.tsx` / `CallbackClient.tsx` hardcoden `/reisen`
- **Problem:** Aufruf von `/account/security` ohne Sitzung → Login → trotzdem `/reisen`.
- **Auswirkung:** Deep Links ins Konto funktionieren nicht.
- **Risiko:** niedrig (kein Open Redirect, weil `next` ungenutzt); UX-Defekt
- **Empfehlung:** nur gleiche-Origin-Relative-Pfade unter `/account` und `/reisen` erlauben; fremde Hosts verwerfen.
- **Abhängigkeit:** keine, sofern Allowlist eng bleibt

### A4 – OAuth-Buttons trotz deaktivierter Provider

- **Pfad:** `LoginForm.tsx`, `RegisterForm.tsx`; `supabase/config.toml` `auth.external.google/apple.enabled = false`; `docs/AUTH.md` §11
- **Problem:** „Weiter mit Google/Apple“ ist immer sichtbar. Klick endet in Supabase-Fehler.
- **Auswirkung:** Login wirkt kaputt.
- **Risiko:** niedrig
- **Empfehlung:** Buttons nur rendern, wenn ein öffentliches Enablement-Flag wahr ist. Kein Secret ins Frontend.
- **Abhängigkeit:** keine Live-Provider-Aktivierung in diesem Workstream

### A5 – Legal-Seiten fehlen, Consent wird nicht gespeichert

- **Pfad:** `RegisterForm.tsx` Links `/terms`, `/privacy`; keine entsprechenden App-Routen
- **Problem:** Registrierung verlangt Zustimmung zu nicht existierenden Dokumenten. `data: { name }` landet in `user_metadata`; die Checkbox selbst wird nicht persistiert.
- **Auswirkung:** DSGVO-/DSG-Behauptung auf Login/Register ist nicht belegbar.
- **Risiko:** hoch (Compliance/Trust)
- **Empfehlung:** verbindliche Legal-Seiten; Consent mit Version + Zeitstempel serverseitig speichern.
- **Abhängigkeit:** Consent-Tabelle/Spalte ist **Shared Contract** (DB). Seiten allein sind es nicht.

### A6 – Registrierung enumeriert E-Mail-Adressen

- **Pfad:** `RegisterForm.tsx` `mapAuthError` → „Diese E-Mail ist bereits registriert.“
- **Problem:** Login/Reset sind enumeration-arm; Register nicht.
- **Auswirkung:** Nachweis, ob eine Adresse ein Konto hat.
- **Risiko:** mittel
- **Empfehlung:** dieselbe neutrale Formulierung wie Reset; Bestätigungsmail nur bei neuem Konto.
- **Abhängigkeit:** UX-only möglich; vollständige Harmonie hängt an Supabase-Fehlertexten

### A7 – MFA-Enrollment ohne Step-up

- **Pfad:** `SecurityMFA.tsx`; Middleware prüft nur Sitzung, nicht AAL2
- **Problem:** Wer eine gültige Session hat, kann TOTP anlegen oder entfernen ohne Passwort/MFA erneut.
- **Auswirkung:** gestohlene Session kann den zweiten Faktor übernehmen oder entfernen.
- **Risiko:** mittel–hoch
- **Empfehlung:** Re-Auth / AAL2 vor Enroll/Unenroll; `mfa_allow_low_aal` bleibt `false`.
- **Abhängigkeit:** Auth-Kernvertrag – dokumentieren, nicht in dieser Phase umbauen

### A8 – Kein Selbstbedienungs-Export und keine Kontolöschung

- **Pfad:** keine Consumer-UI; DB: `profiles.user_id` und `trips.user_id` `ON DELETE CASCADE` (`docs/DATENBANK.md`)
- **Problem:** Ein Nutzer kann sein Konto und seine Daten nicht selbst ausleiten oder löschen. CASCADE existiert nur, wenn `auth.users` gelöscht wird – das tut die App nicht.
- **Auswirkung:** Privacy-Rechte nicht erfüllbar.
- **Risiko:** hoch vor Launch
- **Empfehlung:** Export- und Löschfluss mit Bestätigung, Frist, Audit. Traveller-/Readiness-Daten gehören dazu.
- **Abhängigkeit:** **Shared Contract** (Auth-User-Delete, RLS, evtl. Admin-Support-Sicht)

### A9 – `profiles` wird für Endnutzer nie geschrieben

- **Pfad:** `supabase/migrations/20260817120300_generisches_profil.sql`; Inserts nur `app/(admin)/admin/users/*`; Register schreibt `user_metadata.name`
- **Problem:** Kein Trigger auf `auth.users`. Die meisten Konten haben keine `profiles`-Zeile. `display_name` / `avatar_url` sind tot.
- **Auswirkung:** Account-Übersicht kann den Namen nicht zuverlässig aus der DB lesen. Admin-Userliste sieht normale Konten nicht.
- **Risiko:** mittel
- **Empfehlung:** bewusstes Profil-Anlegen beim ersten Login **oder** Lesen aus `auth.users` + späteres Profil. Kein stilles Rollen-Insert.
- **Abhängigkeit:** **Shared Contract** (Auth/Identity). Kein Trigger ohne Technical-Lead-Schnitt.

### A10 – Meine Reisen kennt keinen Lebenszyklus

- **Pfad:** `lib/trips/daten.ts` `reisenLaden()`; `Reisekarte.tsx`; Statuswerte in `types/trips.ts`
- **Problem:** Eine flache Liste, sortiert nach `updated_at`, Limit 200. Keine Gruppen kommende / aktive / vergangene / archivierte. `trips.status` erlaubt `archived`, aber kein Consumer-Schreibweg setzt ihn. Neue Reisen sind immer `draft` (`reiseNutzlastSchema` ohne `status`).
- **Auswirkung:** Ziel-Hub „Meine Reisen“ ist eine Recency-Galerie.
- **Risiko:** mittel (UX)
- **Empfehlung:** kommende/aktive/vergangene **aus Start-/Enddatum ableiten** (kein Schemawechsel). Archivieren erst mit kontrolliertem Status-Write.
- **Abhängigkeit:** Datumsgruppen keine; `status=archived` Write ist Trip-Graph-Contract

### A11 – Gast-CTA „Neue Reise“ trotz One-Trip-Regel

- **Pfad:** `app/(public)/reisen/page.tsx` zeigt immer `/planen`; `GastreiseBestehtFehler` in `lib/trips/gastspeicher.ts`
- **Problem:** Gast mit bestehendem Entwurf sieht primär „Neue Reise“. Der Konflikt erscheint erst im Formular.
- **Auswirkung:** widerspricht der Product-Owner-Regel: bei aktiver Gastreise primär „Reise fortsetzen“.
- **Risiko:** mittel (Produktverständnis, versehentliches Verwerfen)
- **Empfehlung:** Gast-Liste: primär Fortsetzen; zweite Reise nur über Konto oder ausdrückliches Ersetzen.
- **Abhängigkeit:** keine

### A12 – Footer ist sitzungsblind

- **Pfad:** `components/layout/Footer.tsx`
- **Problem:** Immer „Anmelden / Registrieren“, auch mit Sitzung.
- **Auswirkung:** widerspricht der Navbar-Logik; auf geteiltem Gerät verwirrend.
- **Risiko:** niedrig
- **Empfehlung:** dieselben `sitzungseintraege()` wie die Navbar; Konto-Link statt Register.
- **Abhängigkeit:** keine

### A13 – Guest→Account: Trip kann ohne Party/Readiness „übernommen“ wirken

- **Pfad:** `lib/trips/uebernahme.ts`
- **Problem:** `reise_anlegen` kann gelingen, `party_schreiben` oder Readiness danach scheitern. Der Entwurf bleibt im Browser (`uebernommen` wird nicht erhöht), die Reise liegt aber schon im Konto. `/reisen` zeigt die Konto-Reise; die Brücke zeigt Fehler.
- **Auswirkung:** Retry ist dank `client_ref` möglich und richtig. Die UI erklärt den Teilerfolg nicht. Party/Readiness können hinter dem Graph zurückbleiben, bis Retry klappt.
- **Risiko:** mittel (Truth-Lücke bis Retry)
- **Empfehlung:** Teilerfolg in der Brücke benennen; Regressionstest für party/readiness-Fail nach erfolgreichem Graph. Contract von `party_schreiben` nicht still ändern.
- **Abhängigkeit:** Test/UX frei; RPC-Änderung **Shared**

### A14 – `party_schreiben` löscht weggelassene Traveller nicht

- **Pfad:** `supabase/migrations/20260822160000_traveller_context_intelligence.sql` Funktion `party_schreiben`
- **Problem:** Upsert je `client_ref` in der Payload. Traveller, die nicht mitgeschickt werden, bleiben. Kinder der mitgeschickten Traveller werden ersetzt.
- **Auswirkung:** Bei Konflikt/Retry/Teilpayload können verwaiste Traveller auf der Reise bleiben. Readiness kann extra Slots als `applicable: false` zeigen.
- **Risiko:** mittel (Stale Traveller-Truth)
- **Empfehlung:** später explizite Replace-Semantik oder dokumentiertes Merge plus UI. **Nicht** in dieser Auditphase ändern.
- **Abhängigkeit:** **Shared Traveller-Contract**

### A15 – Account-Traveller fehlen; ADR-0102 widerspricht dem neuen Produktmodell

- **Pfad:** ADR-0102 in `DECISIONS.md`; `types/trips.ts` „Keine accountweiten Profile“; Zielmodell §2.3 / §5
- **Problem:** Umgesetzt ist trip-scoped Party. Das verbindliche Produktmodell vom 23.08. verlangt stabile Account-Traveller, die Reisen nur referenzieren.
- **Auswirkung:** Partner/Kinder müssen je Reise neu erfasst werden. Cross-Trip-Leaks sind heute vermieden, Wiederverwendung fehlt.
- **Risiko:** hoch, wenn jemand parallel ein zweites Traveller-Modell baut
- **Empfehlung:** Registry-über-Referenz (siehe Zielarchitektur). Guest bleibt trip-scoped. Keine Implementation vor Technical-Lead-Slicing.
- **Abhängigkeit:** **Shared** Traveller / Readiness / Guest→Account / Entry

### A16 – Keine Passport-/Citizenship-Erfindung im geprüften Code

- **Pfad:** `lib/readiness/traveller-kontext.ts`, Citizenship-Policy, Foundation-E-Migration
- **Problem:** keines im Ist-Code. Residenz, Origin, Sprache, Domain werden nicht zu Citizenship. Document↔Citizenship nur bei explizitem `citizenshipClientRef`.
- **Auswirkung:** positiv; muss bei Account-Travellern erhalten bleiben.
- **Risiko:** Regression, falls Account-Defaults „Wohnsitzland = Passland“ einführen
- **Empfehlung:** Account-Profil darf Defaults für Währung/Sprache haben, nie für Citizenship/Credential.
- **Abhängigkeit:** spätere Traveller-Registry

### A17 – MFA-Dialog ohne Focus-Trap / `aria-labelledby`

- **Pfad:** `components/auth/MFATotpDialog.tsx`
- **Problem:** `role="dialog"` + `aria-modal`, aber kein `aria-labelledby`, kein Focus-Trap, kein initialer Fokus.
- **Auswirkung:** Tastatur/Screenreader-Lücke genau im Security-Schritt.
- **Risiko:** mittel (a11y)
- **Empfehlung:** Dialog-Primitive des Design-Systems; Fokus auf Code-Feld.
- **Abhängigkeit:** keine

### A18 – Login/Register-Servergate nutzt `getSession()`

- **Pfad:** `app/(public)/login/page.tsx`, `register/page.tsx`, `update-password/page.tsx`
- **Problem:** Redirect „schon angemeldet“ liest Cookie ohne Signaturprüfung. Schreibende Trip-Pfade nutzen korrekt `getUser()`.
- **Auswirkung:** theoretisch falscher Redirect; kein Datenleck allein dadurch.
- **Risiko:** niedrig
- **Empfehlung:** `getUser()` auch für Server-Gates.
- **Abhängigkeit:** keine

### A19 – Production-Redirect-URLs noch localhost

- **Pfad:** `supabase/config.toml` `site_url`; `docs/AUTH.md` §4
- **Problem:** `additional_redirect_urls = []`, `site_url = http://localhost:3000`. Für Preview/Production muss der echte Origin stehen, sonst Reset/Confirm falsch.
- **Auswirkung:** Launch-Blocker für E-Mail-Flows.
- **Risiko:** hoch zum Launch; heute bewusst offen
- **Empfehlung:** eigenes Production-Auth-Gate; kein `*.vercel.app/**`.
- **Abhängigkeit:** Auth-Ops, nicht dieser Audit-PR

### A20 – Abo-/Payment-Wahrheit darf nicht aus Admin-`payments` wachsen

- **Pfad:** `payments` ohne `user_id`; `docs/MONETARISIERUNG.md`
- **Problem:** Es gibt keine Subscription-Tabelle. Admin-Payments sind kein Consumer-Billing.
- **Auswirkung:** Ein naiver „Abo“-Screen auf `payments` wäre falsch.
- **Risiko:** hoch bei Eigenbau
- **Empfehlung:** Platzhalter-UI + zentrale Entitlement-Schicht **vor** Stripe-Live. Shared mit Admin/Finance.
- **Abhängigkeit:** **Shared** Payment/Subscription

### A21 – Passkeys-UI bei deaktiviertem Backend

- **Pfad:** `SecurityMFA.tsx`, `app/account/security/page.tsx` Metadata; `auth.passkey.enabled = false`
- **Problem:** Seite und Meta sprechen Passkeys an; Config ist aus.
- **Auswirkung:** „Verwalten (bald)“ ohne Erklärung.
- **Risiko:** niedrig
- **Empfehlung:** Readiness-Copy, keine Enrollment-Illusion.
- **Abhängigkeit:** späteres Passkey-Gate

### A22 – Keine Session-/Geräteliste, kein Logout-all

- **Pfad:** `app/auth/sign-out.ts` nur aktuelle Session; Config `sessions_single_per_user = false`
- **Problem:** Multi-Device ist gewollt; Nutzer kann fremde Geräte nicht sehen oder kappen.
- **Auswirkung:** fehlende Kontrolle nach Geräteverlust.
- **Risiko:** mittel
- **Empfehlung:** Supabase-Session-APIs in Sicherheitseinstellungen; globales Sign-out.
- **Abhängigkeit:** Auth-API, kein neues Identitätsmodell

### A23 – Cookie-Banner behauptet Analytics, die nicht existieren

- **Pfad:** `CookieConsent.tsx` (unverbunden)
- **Problem:** Text zu „Views/Likes“; kein Analytics-SDK in Consumer-Pfaden gefunden.
- **Auswirkung:** irreführend, sobald der Banner eingehängt wird.
- **Risiko:** niedrig heute; mittel wenn eingehängt
- **Empfehlung:** Banner erst mit echten Kategorien und ehrlichem Text.
- **Abhängigkeit:** Privacy

### A24 – Workspace-Übersicht darf nicht zur Account-Übersicht werden

- **Pfad:** `components/trips/TripWorkspaceUebersicht.tsx`
- **Problem:** Kein heutiger Duplikat-Bug. Die mobile Workspace-Übersicht ist bereits ein Mini-Dashboard einer Reise.
- **Auswirkung:** Eine Account-Übersicht mit Flug-/Hotel-Karten wäre das verbotene Zwillingsdashboard.
- **Risiko:** hoch bei unkontrollierter Implementierung
- **Empfehlung:** Account-Übersicht nur reiseübergreifend (nächste Reise, offene Punkte, letzte Aktivität).
- **Abhängigkeit:** Workspace-Umbau bleibt späterer Block; nicht vorziehen

---

## 6. Auth- und Session-Lebenszyklus

Vorhanden und überwiegend solide:

| Schritt | Ist |
| --- | --- |
| Register | E-Mail+Passwort, Policy 12/4, HIBP erwartet, Confirm an |
| Login | Passwort, AAL2-Step-up, generische Fehler |
| Logout | POST-Server-Action, kein prefetchbares GET |
| Reset | enumeration-arm; Update-Seite teilt Policy |
| MFA Login | `lib/auth/mfa.ts` + Dialog |
| MFA Manage | existiert, verwaist |
| OAuth | Code fertig, Provider aus |
| Passkeys | Config aus, UI-Stub |
| Guest→Account | nach jedem Weg auf `/reisen` via Brücke |

Lücken: `next`, Legal, Enumeration, Step-up, Sessions, Production-URLs, Captcha bewusst aus, SMTP-Limit 2 E-Mails/h.

---

## 7. Guest → Account

`lib/trips/uebernahme.ts` bleibt die richtige Orchestrierung:

1. Graph via `reise_anlegen` / `client_ref`
2. Party via `party_schreiben`
3. Readiness-Items
4. Browser-Cleanup erst nach Erfolg dieses Entwurfs

Stärken: kein Bulk-Delete vor ACK; Idempotenz; parallele Läufe per `laeuft` gesperrt; Manipulation (user_id/status) verlassen den Browser nicht (77 Tests in `uebernahme.test.ts` in dieser Session grün).

Lücken:

- kein dedizierter Party/Readiness-Fail-Test in `uebernahme.test.ts`
- Teilerfolgs-UX
- `party_schreiben`-Merge (A14)
- Account-Traveller-Registry existiert nicht, daher kopiert Übernahme Fakten in die Reise, verknüpft sie nicht mit einem Konto-Profil

Route-Truth überlebt im Graph. Official/Safety/Seasonal sind compute-on-read und werden nicht persistiert – fachlich korrekt, solange nach Übernahme neu bewertet wird.

---

## 8. Traveller, Citizenship, Dokumente

Ist (Foundation E, Production-Migrationen vorhanden laut Handoff):

- stabiler `trip_travellers`-Parent
- 1:n Citizenships, 1:n Documents
- explizites `citizenship_id`
- keine Passnummern; Label-CHECKs gegen pass-ähnliche Muster
- Guest und Account dieselbe `TripTraveller`-Form
- Accountbesitzer wird nicht automatisch Traveller

Nicht vorhanden:

- Beziehungstypen Partner/Kind
- Account-weite Wiederverwendung
- Dokumententresor (bewusst verboten)

Citizenship-Pflicht folgt `docs/TRAVELLER_CITIZENSHIP_REQUIREMENT_POLICY.md`: nicht global beim Start, hart sobald Official/Regulatory es braucht. Account-UI darf das nicht zu einem Pflichtfeld „Nationalität im Profil“ machen.

---

## 9. Cross-Domain

| Domäne | Account-Bezug heute | Risiko bei Account-Ausbau |
| --- | --- | --- |
| Trip Workspace | Einstieg nur über `/reisen` | Account-Übersicht darf Workspace-Karten nicht kopieren |
| Traveller / Readiness / Entry | Party je Reise in `Reisevorbereitung.tsx` | Registry muss Slots referenzieren, nicht duplizieren |
| Route | traveller-neutral im Graph | Account darf keine Route-Truth aus Wohnsitz erfinden |
| Safety / Seasonal | nicht persistiert; PR #38 fremder Workstream | Notifications später abonnieren, Aussagen nicht mischen |
| Booking | item-level je Reise | Account-Buchungsliste ist Sicht, keine zweite Truth |
| Guest-Parität | gleiche Trip-Form | Account-only Features (Abo, Sessions) dürfen Guest nicht fälschen |

PR #38 (`feat/travel-timing-seasonal-intelligence`, Draft) wurde nur als Existenz/Head verifiziert. Dieser Workstream ändert daran nichts.

---

## 10. UX / Geräte / Accessibility

Stärken: `/reisen` und Auth-Formulare sind mobile-tauglich; Touch-Höhen; Feldfehler-Verkabelung; Empty≠Error.

Schwächen:

- kein Account-Chrome auf Smartphone
- Security-Seite ohne App-Navigation
- MFA-Dialog a11y
- Footer/Navbar-Asymmetrie
- Gast ohne primäres „Fortsetzen“
- keine Tablet-spezifische Account-IA (fällt mit fehlendem Shell zusammen)

---

## 11. Must / Should / Later

### Must fix (vor einer Account-Implementierungsfreigabe bzw. vor Launch der Plattform)

1. Account-IA-Shell + Übersicht, die kein Workspace-Klon ist
2. Meine Reisen: Fortsetzen + abgeleitete Lebenszyklus-Gruppen
3. Legal-Seiten; Consent-Persistenz planen
4. Security auffindbar; MFA-Dialog a11y
5. OAuth-Buttons an Config koppeln
6. `next`-Allowlist
7. Export/Löschung als Launch-Gate planen (Shared)
8. Guest-CTA an One-Trip-Regel anpassen

### Should improve

- Register-Enumeration
- Footer-Session
- `getUser()` auf Auth-Gates
- Profilzeile bewusst erzeugen (Shared)
- Sessions/Geräte
- MFA Step-up (Shared/Auth)
- Party/Readiness-Takeover-Tests
- Passkey-Copy

### Later

- Account-Traveller-Registry (Shared, nach Lead-Schnitt)
- Favoriten / Weltkarte
- Notifications inkl. Safety/Seasonal-Themen
- Entitlement + Billing-UI
- Dokumententresor
- Passkeys live
- Support-Aktivitätslog

---

## 12. Was bewusst nicht gebaut oder geändert wurde

Keine Auth-/RLS-/DB-/Traveller-/Guest-Persistenz-/Payment-Änderung. Kein Mark Ready. Kein Merge. Kein Eingriff in PR #38.

---

## 13. Adversarial Self-Review

Versuche, dieses Audit zu widerlegen:

1. **„Meine Reisen ist bereits das Konto.“** Teilweise wahr als Hub für Reisen. Das Produktmodell trennt Übersicht, Reisende, Einstellungen und Abo. `/reisen` erfüllt das nicht. Der Befund bleibt.
2. **„Traveller accountweit zu machen widerspricht ADR-0102.“** Ja – ADR-0102 ist der **implementierte** Vertrag. Das Produktmodell vom 23.08. ist die **neuere verbindliche Zielentscheidung**. Das ist ein Konflikt, kein Freibrief zum Umbau. Deshalb Shared/serial.
3. **„Guest-Takeover ist unsicher.“** Graph-Idempotenz und Cleanup sind stark. Die Lücke ist Party/Readiness-Teilerfolg und Merge-Semantik, nicht Datenverlust des Graphen.
4. **„Security ist fertig, weil TOTP existiert.“** Enrollment ohne Auffindbarkeit und ohne Step-up ist keine fertige Security-Area.
5. **„DSGVO-Copy auf Login reicht.“** Nein. 404-Legal-Seiten und fehlende Export/Lösch-Pfade widerlegen die Behauptung.
6. **„Ich habe Live-Auth nicht geprüft.“** Korrekt. Drift von `config.toml` bleibt ein offenes Risiko und ist als solches benannt.
7. **„Versteckte Account-Seiten?“** `app/**/page.tsx` hat 22 Seiten; außer `/account/security` keine Consumer-Account-Route.

Keine dieser Gegenproben hebt die Must-fix-Liste auf.
