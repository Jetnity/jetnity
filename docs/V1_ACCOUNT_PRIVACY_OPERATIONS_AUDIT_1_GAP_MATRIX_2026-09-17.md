# Jetnity V1 – Account / Privacy / Operations Minimum: Live Gap Matrix 1

Stand: 17. September 2026
Status: **AUDIT-ONLY / DOCS-ONLY / KEINE RUNTIME-ÄNDERUNG / KEIN SLICE AUTORISIERT**

Cursor-Agent: `Jetnity V1 account privacy operations audit 1`
Generation: 2
Binding task: `docs/V1_ACCOUNT_PRIVACY_OPERATIONS_AUDIT_1_TASK_2026-09-17.md`
Issue: #438 · Draft PR: #439 · Branch: `audit/v1-account-privacy-ops-1`

Binding Quelle des Auftrags: `docs/JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md` §9.

---

## 0. Evidence-Basis

| Fakt | Wert |
| --- | --- |
| Kanonische Basis (Task) | `main@15aa125addf39b15dcb50a1cdf8dece661796fc5` |
| Live `origin/main` bei Auditabschluss | `69f3b206fc87bf4a3ff9e3c275cf55d244c0a9a6` |
| Merge-Base Branch ↔ `origin/main` | `15aa125addf39b15dcb50a1cdf8dece661796fc5` |
| Drift seit Task-Dispatch | `main` +20 Commits (World Map Polish 2 #437, Realistic World Cartography 1 #443/#444) |
| Drift-Relevanz für dieses Audit | **keine** – alle 20 Commits betreffen ausschließlich World-Map-/Kartografie-Dateien und Slice-Dokumente |
| Runtime-Zeilennachweise | erhoben gegen `d2ec8cad`, **nachverifiziert gegen `69f3b206`**; Zeilennummern identisch |

Alle Zeilenangaben in dieser Datei sind gegen `69f3b206` geprüft, sofern nicht anders vermerkt.

### Was dieses Audit ausdrücklich **nicht** verifiziert hat

- **Kein Production-Probe.** Es wurde kein Zugriff auf Vercel Production, Supabase Production oder externe Systeme genommen (audit-only, keine externe Mutation). Aussagen über „live" bedeuten: **im ausgelieferten Code auf `main` vorhanden**. Production-Parität ist aus `docs/ACTIVE_WORK_STATUS.md` abgeleitet, nicht unabhängig gemessen.
- **Keine Rechtsprüfung.** Der Agent ist keine Rechtsberatung. Wo unten „rechtlich erforderlich" steht, ist das ein **zu bestätigender Kandidat**, kein festgestelltes Rechtsergebnis. Schweizer DSG/revDSG- und DSGVO-Pflichten müssen von Legal bestätigt werden.
- **Keine Migrations-Live-Prüfung.** Ob Production-Migrationen (u. a. Admin-AAL2-Alignment, S6-A) tatsächlich angewendet sind, ist aus Code nicht feststellbar.

---

## 1. Severity-Taxonomie (übernommen, nicht neu erfunden)

Dieses Audit verwendet die **bereits verbindliche Technical-Lead-Korrektur** aus
`docs/PROVIDER_S4_S8_PROVENANCE_AUDIT.md` §4:

> **P0 ist ein akuter Production-Incident.** Eine fehlende spätere Fähigkeit ist kein P0 – und nicht automatisch ein heutiger P1.

| Klasse | Bedeutung in dieser Matrix |
| --- | --- |
| **P0** | Akuter Incident: live Fake-Truth, live Datenverlust, live bezahlter Missbrauch **jetzt** |
| **PRODUKTDEFEKT** | Heute belegtes, user-sichtbares, ausgeliefertes Fehlverhalten – kein Zukunfts-Adapter |
| **P1** | Blockiert den **V1 Public Launch** gemäß `docs/JETNITY_V1_RELEASE_READINESS_GATE_2026-09-01.md`; kein heutiger Incident |
| **P2** | Releasekritisch, braucht ausdrückliche Entscheidung oder dokumentierte Risk Acceptance |
| **P3** | Residual, Continuity, bewusste Nicht-Arbeit |

Zustände: **BUILT / PARTIAL / MISSING / BLOCKED / DEFERRED / PO-GATED**.

Gates: **LEGAL-CONTENT-GATE**, **PO-GATE**, **PRODUCTION-MIGRATION-GATE**, **COST-GATE**, **PROVIDER-ACTIVATION-GATE**.

---

## 2. Kernaussage des Audits

Drei Sätze, wenn sonst nichts gelesen wird:

1. **Es gibt genau einen heutigen P0.** Die ausgelieferten Anmelde-/Registrierformulare behaupten „Datenschutz: DSGVO & CH-DSG konform" (`components/auth/RegisterForm.tsx:386`, `components/auth/LoginForm.tsx:288`), während es keine Datenschutzerklärung, keine AGB, kein Impressum und keine Consent-Persistenz gibt. Das ist **live Fake-Truth auf einer ausgelieferten Fläche** und war bereits am 29. August 2026 in ADR-0195 als unbelegte Behauptung erkannt – und ist 19 Tage später unverändert.
2. **Der härteste Launch-Blocker ist nicht Legal, sondern E-Mail.** Ohne eigenen SMTP-Server begrenzt Supabase den Versand auf **zwei E-Mails pro Stunde projektweit** (`supabase/config.toml:179`), bei gleichzeitig erzwungener E-Mail-Bestätigung. Damit ist Registrierung, Passwort-Reset und jeder künftige Export-/Löschbestätigungsweg mengenmäßig nicht launchfähig. Das ist in `docs/AUTH.md:314` korrekt als offen dokumentiert.
3. **Das Account-Datenmodell ist besser als erwartet, die Ops-Rückverfolgbarkeit schlechter.** Datenminimierung ist real umgesetzt (keine Pass-Nummern, keine MRZ, kein Geburtsdatum im Schema, RLS überall). Dagegen fehlen Admin-Audit-Trail, Incident-Observability und ein Schreiber für `security_events` vollständig – die Security-Fläche kann strukturell nur leer sein.

---

## 3. Gap Matrix – Domäne 1: Privacy / Terms / Consent

### APO-01 · Rechtsseiten `/privacy`, `/terms`, Impressum · **MISSING** · **PRODUKTDEFEKT (live) / P1** · LEGAL-CONTENT-GATE

**Evidence.** Es existiert keine einzige App-Route für Rechtstexte: `git ls-tree` auf `69f3b206` findet unter `app/**` nichts zu privacy/terms/datenschutz/impressum/agb. Das Registrierformular verlinkt sie trotzdem:
`components/auth/RegisterForm.tsx:354` → `/terms`, `:356` → `/privacy`.
Die Abwesenheit ist zusätzlich durch einen **eigenen Repository-Vertragstest** abgesichert: `lib/legal/ap6a-gate0-legal-foundation-inventory.test.ts` behauptet aktiv, dass `/privacy` und `/terms` keine Page haben (9/9 Tests grün bei Auditlauf). `lib/legal/ap6a-gate0-vertrag.ts:6` führt beide als Pflichtroute, `:11` Impressum/Datenschutz als verwandte fehlende Routen.

**Exakte Lücke.** Ein Nutzer muss zur Registrierung Dokumente akzeptieren, die er nicht lesen kann; beide Links laufen in 404. Das ist ein heute ausgelieferter Produktdefekt, kein fehlendes Zukunftsfeature.

**V1-Notwendigkeit.** Release Gate §C verlangt Datenschutzerklärung und AGB entsprechend realer V1-Funktion sowie „keine erfundenen Legal-Texte als Production-Lösung".

**Gate.** Inhalt ist **LEGAL-CONTENT-GATE + PO-GATE**. `docs/PRIVACYBEE_PRODUCT_OWNER_BINDING_DECISION_2026-08-30.md` sieht PrivacyBee AG für eine künftige website-sichtbare DSE vor, deckt aber ausdrücklich **nicht** `/terms` und nicht die Consent-Persistenz.

**Kleinster verantwortbarer Schritt.** Zweiteilig – siehe FU-1a/FU-1b in §9. Wichtig: eine Runtime-Seite mit Platzhaltertext ist **keine** Lösung; ADR-0195 hat das bereits abgelehnt.

### APO-02 · Behauptung „DSGVO & CH-DSG konform" · **PRODUKTDEFEKT** · **P0** · kein Gate für die Entfernung

**Evidence.** `components/auth/RegisterForm.tsx:386` und `components/auth/LoginForm.tsx:288`:
„Mit der Registrierung/Anmeldung stimmst du unseren Richtlinien zu. Datenschutz: DSGVO & CH-DSG konform."
`DECISIONS.md` ADR-0195 (29. August 2026) klassifiziert genau diesen Satz als **unbelegte Behauptung**.

**Warum P0 und nicht P1.** Nach der verbindlichen Taxonomie ist P0 „live Fake-Truth … jetzt". Dies ist keine fehlende künftige Fähigkeit, sondern eine **heute ausgelieferte Konformitätsaussage ohne jede Grundlage** – ohne Datenschutzerklärung, ohne AGB, ohne Consent-Record, ohne Rechtsprüfung. Mildernd: die Fläche ist `robots: index:false` (`app/(public)/register/page.tsx:12`) und es gibt keinen Public Launch; die Aussage ist aber trotzdem live erreichbar.

**Exakte Lücke.** Zwei Sätze, die etwas behaupten, was das Repository selbst als unbelegt führt.

**Kleinster verantwortbarer Schritt.** Ersatzlose Entfernung der Konformitätsbehauptung (FU-1a). Das ist ein Defektfix ohne Legal-Gate und ohne neue Abhängigkeit; es braucht kein PrivacyBee, keine Migration und keine Kosten.

### APO-03 · Consent-/Terms-Acceptance-Persistenz · **MISSING** · **P1** · PRODUCTION-MIGRATION-GATE

**Evidence.** Keine Tabelle, keine Spalte, kein Typ: Suche nach `consent`, `terms_accepted`, `privacy_accepted`, `accepted_at`, `einwilligung`, `zustimmung` in `supabase/migrations/**` und `types/supabase.ts` ist leer. `profiles` (`types/supabase.ts:331-342`) hat keine Acceptance-Felder. Die Checkbox ist rein clientseitig: `components/auth/RegisterForm.tsx:77` State, `:107` Validierung, `:368` Button-Disable – der `signUp`-Payload `:127-133` überträgt ausschließlich `name`. `lib/legal/ap6a-gate0-vertrag.ts:32` hält `keineConsentPersistenz: true` als bewussten Vertragszustand fest.

**Exakte Lücke.** Es gibt keinen Nachweis, dass, wann und welcher Fassung ein Nutzer zugestimmt hat. Eine Zustimmung, die nicht persistiert ist, ist als Nachweis wertlos.

**Abhängigkeit.** Sinnvoll erst **nach** APO-01: man kann keine Zustimmung zu einem Dokument protokollieren, das nicht existiert und keine Version hat.

### APO-04 · OAuth-Registrierung umgeht die Legal-Checkbox · **MISSING (latent)** · **P2** (→ P1 bei OAuth-Aktivierung)

**Evidence.** Der OAuth-Startpfad in `components/auth/RegisterForm.tsx` prüft `accept` nicht; festgehalten im Vertragstest `lib/legal/ap6a-gate0-legal-foundation-inventory.test.ts:87-91`. Heute latent, weil beide Anbieter deaktiviert sind: `supabase/config.toml:306` (`google.enabled = false`), `:312` (`apple.enabled = false`), und die Buttons sind fail-closed unsichtbar (`lib/auth/oauth-anbieter.ts:27-29`, `components/auth/OauthAnbieter.tsx:21`).

**Trigger.** Wird Google oder Apple aktiviert, entsteht sofort ein Registrierweg ohne jede Legal-Bestätigung. Muss als Vorbedingung an die OAuth-Aktivierung gebunden werden.

### APO-05 · Cookie-/Consent-Banner · **MISSING (bewusst)** · **P2 heute** · Trigger-abhängig P0-fähig

**Evidence.** `components/layout/CookieConsent.tsx` existiert, ist aber **Orphan** – kein Layout importiert es; `app/layout.tsx:50-61` und `app/(public)/layout.tsx:47-60` mounten es nicht, und `scripts/erreichbarkeit.mjs:28-32` führt die Datei als absichtliche Ausnahme („wartet auf die Rechts-/Produktentscheidung"). Der Text ist veraltete V1-Copy („Views/Likes", `:35-36`); ADR-0195 stellt fest, dass dies keine V2-Wahrheit ist.

**Warum heute nur P2 – und das ist der wichtigste Befund dieser Domäne.** Es gibt **keinerlei zustimmungspflichtiges Tracking**: kein Analytics-SDK in `package.json`, kein PostHog/GA/Sentry/Plausible/Vercel-Analytics im Code. Vorhanden sind nur funktional notwendige Speicher: Supabase-Auth-Cookies, das Gast-Kontingent-Cookie (`lib/modell/gast-cookie.ts:7-14`) und Gast-Trip-`localStorage`. Ein fehlender Banner ist deshalb heute **kein** Blocker.

**Trigger.** In der Sekunde, in der Release Gate §I („Conversion und Revenue Attribution … messbar") umgesetzt wird, wird das fehlende Consent-Verhalten **launchblockend**. Siehe Sequenzierungsbefund §8.1. Der Banner darf außerdem **nicht** mit dem aktuellen Text gemountet werden – das wäre eine unwahre Messbehauptung, also selbst erzeugte Fake-Truth.

---

## 4. Gap Matrix – Domäne 2: Account Data Lifecycle

### APO-06 · Datenexport / Auskunft / Portabilität · **MISSING** · **P1** · Legal-Bestätigung offen

**Evidence.** Kein Export in Runtime: keine Route `app/account/export`, kein API-Endpunkt, keine Server Action; Suche nach `export`, `download`, `datenexport`, `portability`, `auskunft` ohne Treffer außer TypeScript-Schlüsselwörtern. `lib/legal/ap6a-gate0-legal-foundation-inventory.test.ts:149-150` behauptet aktiv, dass `app/account/export/page.tsx` und `app/account/delete/page.tsx` **nicht** existieren. `app/account/settings/page.tsx:3-4` schließt Privacy ausdrücklich aus. `lib/legal/ap6a-gate0-vertrag.ts:53-57` ordnet `datenexport` AP-6b zu.

**Exakte Lücke.** Ein Nutzer kann seine eigenen Daten weder einsehen noch mitnehmen; es existiert auch kein dokumentierter manueller Ersatzprozess.

**Bewertung.** Release Gate §C verlangt Export „soweit rechtlich/produktseitig erforderlich". Für eine Private Alpha kann ein dokumentierter manueller Prozess genügen; für Closed Beta / Public Launch ist ein Self-Service-Export der belastbare Weg. Der Aufwand ist gering, weil die Datenmenge pro Nutzer klein und RLS-scoped ist (`trips` + Kinder, `account_travellers` + Kinder, `profiles`).

### APO-07 · Kontolöschung · **MISSING** · **P1** · PO-GATE (destruktiv)

**Evidence.** Kein `deleteUser`, kein `auth.admin`-Aufruf, keine Löschseite, keine Anonymisierung – repository-weit ohne Treffer in `app/**`, `lib/**`, `components/**` (auf `69f3b206` erneut geprüft). Admin kann ausschließlich `profiles.status` setzen (`app/(admin)/admin/users/actions.ts:114-149`), also `active`/`disabled`/`banned` – das ist **keine** Löschung.

**Was es stattdessen gibt.** Granulare Löschungen funktionieren: Reise (`lib/trips/aktionen.ts:286-298`), Trip-Reisender via RPC `party_loeschen` (`supabase/migrations/20260828015304_traveller_write_contract_integrity.sql:99-158`), Registry-Reisender (`lib/traveller/account-registry-aktionen.ts:130-146`).

**Günstiger Umstand.** Das Schema würde bei einer Auth-User-Löschung weitgehend korrekt kaskadieren: `profiles` (baseline `:1375`), `trips` (`20260817120000_reiseschema.sql:123-124`), `account_travellers` (`20260829201500_...:19-22`) hängen mit `ON DELETE CASCADE` an `auth.users`; Kinder (Stages, Days, Items, Travellers, Citizenships, Documents, Readiness, Provenance) kaskadieren weiter. Eine Löschimplementierung ist deshalb **kleiner als sie klingt** – der Aufwand liegt in Bestätigung, Protokollierung und Irreversibilität, nicht im Schema.

**Rest-Lücke bei Löschung.** `model_usage` hängt an keinem FK und behält einen pseudonymen `kennung_hash` (`20260818040000_modellnutzung.sql:93-98`, dort ausdrücklich kommentiert). Das ist vertretbar, muss aber in der Datenschutzerklärung stehen, statt stillschweigend zu bleiben.

### APO-08 · Retention / automatisches Purge · **MISSING** · **P2**

**Evidence.** Keine `deleted_at`/`archived_at`-Spalten im V2-Trip-/Account-Schema, keine `pg_cron`-Jobs (`docs/DATENBANK.md:115`: Extension vorhanden, leer), kein Purge-Skript. Für `model_usage` ist Retention nur als **manuelles SQL** dokumentiert (`20260818040000_modellnutzung.sql:424-436`, `docs/MODELL.md:260`) – also faktisch unbegrenzte Aufbewahrung.

**Exakte Lücke.** Es gibt keine Aussage darüber, wie lange Jetnity irgendetwas behält – und keinen Mechanismus, der eine solche Aussage einhalten würde.

### APO-09 · Archiv wird als Lebenszyklus missverstanden · **BUILT (aber nicht Löschung)** · **P3 / Klarstellung**

**Evidence.** Trip-Archiv ist real: `lib/account/reise-archiv.ts:5-8` (Status `archived` + `metadata.account_archive.previous_status`), `lib/trips/archiv-aktionen.ts:48-89`, Gast hat bewusst kein Archiv (`lib/trips/archiv-aktionen.test.ts:75-81`).

**Warum es hier steht.** Archiv ist ein reversibler Statuswechsel; **alle Daten bleiben**. Es darf in keiner Privacy-Kommunikation als Löschung oder Retention-Mechanismus geführt werden. Reine Klarstellung, kein Bauauftrag.

### APO-10 · Datenminimierung Traveller/Dokumente · **BUILT** · **kein Gap – Regressionsschutz**

**Evidence.** Das Schema speichert bewusst **keine** Passnummern, keine MRZ, keine Biometrie, kein Geburtsdatum, keine Scans. Gespeichert werden nur ISO-2-Staatsangehörigkeit (`20260822160000_traveller_context_intelligence.sql`), Dokument-Typ/Ausstellerland/Ablaufdatum und Labels; Registry-Dokumente schließen mehr ausdrücklich aus (`20260829201500_...:8`). Eingabeschranken weisen passnummer-/MRZ-artige Muster zurück (`lib/traveller/account-registry-eingabe.ts:24-34`, `lib/readiness/traveller-anfrage.ts:69-70`). RLS deckt alle Traveller-Tabellen owner-only ab.

**Warum das hier steht.** Dies ist der Bereich, in dem ein späterer Slice am ehesten versehentlich Schaden anrichtet. Release Gate §C verlangt „kein Passscan/MRZ/Biometric/Health-Speicher ohne eigenes genehmigtes Gate". Der aktuelle Zustand erfüllt das. **Nicht „verbessern".**

### APO-11 · Guest → Account Migration · **BUILT** · **kein Gap**

**Evidence.** `lib/trips/gastspeicher.ts:3-7` (einziges Modul mit `localStorage`-Zugriff), `lib/trips/uebernahme.ts:65-76` (Browser wird erst geleert, nachdem der Server bestätigt hat), `lib/trips/aktionen.ts:154-161`, `components/trips/GastreiseBruecke.tsx:37-60`. Entspricht AGENTS.md §13 (Gastmodus darf Local Storage nutzen, wenn saubere Migration existiert).

---

## 5. Gap Matrix – Domäne 3: Session / MFA / AAL / Recovery

### APO-12 · Auth-E-Mail-Zustellung: 2 E-Mails pro Stunde · **MISSING (eigener Versandweg)** · **P1** · COST-GATE

**Evidence.** Kein eigener SMTP-Server; `[auth.email.smtp]` ist auskommentiert (`supabase/config.toml:217-223`). Der Kommentar im Repository benennt die Folge selbst: „Ohne eigenen SMTP-Server versendet Supabase selbst und begrenzt hart auf zwei E-Mails pro Stunde" (`:175-179`, Wert `email_sent = 2`). Gleichzeitig ist Bestätigung erzwungen: `enable_confirmations = true` (`:204`). `docs/AUTH.md:265` und `:314` führen das korrekt als offen: „Für den Launch reicht das nicht."

**Warum das der härteste Blocker der Domäne ist.** Die Kette bricht kaskadierend: Registrierung verlangt Bestätigungs-E-Mail → Limit greift projektweit bei zwei Mails/Stunde → Nutzer kann sich nicht anmelden → Passwort-Reset läuft über denselben Kanal und denselben Zähler → und es gibt keinen Support-Eingang außer einer `mailto`-Adresse (APO-15). Ein Nutzer kann heute in einem Zustand landen, aus dem ihn **nichts im Produkt** herausholt.

**Abhängigkeit nach vorn.** Export-Bestätigung (APO-06), Löschbestätigung (APO-07), MFA-Recovery-Kommunikation (APO-13) und jede Support-Antwort setzen einen belastbaren Versandweg voraus. **APO-12 ist die Vorbedingung für die halbe Domäne.**

**Gate.** Ein SMTP-/E-Mail-Anbieter ist ein **COST-GATE** (kleine laufende Kosten, weit unter der USD-100-Grenze aus AGENTS.md §18) und eine Anbieterwahl, also PO-Entscheidung.

### APO-13 · MFA-Lockout-Recovery · **MISSING** · **P1** (Nutzer) / **P1 + operativer SPOF** (Admin)

**Evidence.** Keine Backup-/Recovery-Codes: Suche nach `backup_code`, `recovery_code`, `wiederherstell`, `lockout` in `app/**`, `lib/**`, `components/**` ohne Treffer (auf `69f3b206` erneut geprüft). Kein Admin-Endpunkt zum Zurücksetzen eines fremden Faktors (`app/api/admin/**` enthält keine MFA-Route). Supabase steht auf `mfa_allow_low_aal = false`, d. h. ein eingerichteter Faktor ist nach Login verbindlich.

**Nutzerfall.** Verliert ein Nutzer sein TOTP-Gerät, hilft der Passwort-Reset nicht: der Login verlangt weiterhin den Code (`components/auth/LoginForm.tsx:110-118`). Es gibt keinen Self-Service-Weg und keinen dokumentierten Support-Weg.

**Adminfall – schwerwiegender.** Admin-AAL2 wird **doppelt** erzwungen: Route (`lib/auth/admin-guard.ts:224-225`, `lib/auth/admin-aal.ts:57-61`) **und** Datenbank (`supabase/migrations/20260826090000_admin_aal2_data_plane.sql:17-25` + `darf_*()`-Capabilities `:41-94`). Das ist architektonisch richtig, erzeugt aber einen Single Point of Failure: verliert der einzige Admin seinen Faktor, ist die Admin-Ebene **inklusive Datenebene** nur noch über die Supabase-Plattform erreichbar. Der Break-Glass-Allowlist `ADMIN_ALLOWED_EMAILS` hilft nicht – er ist ausdrücklich UI-only ohne DB-Rechte (`lib/auth/admin-access.ts:130-131`, `lib/auth/admin-write-gate.ts:13-17`).

**Kleinster verantwortbarer Schritt.** Zuerst **null Runtime**: eine dokumentierte Recovery-Prozedur (FU-2). Backup-Codes sind ein späterer, größerer Schritt und dürfen die AAL2-Grenze nicht aufweichen.

### APO-14 · E-Mail-Adresse im Konto ändern · **MISSING (in-App)** · **P2**

**Evidence.** `double_confirm_changes = true` ist konfiguriert (`supabase/config.toml:199-201`), aber es gibt keinen `updateUser({ email })`-Pfad und keine UI unter `app/account/**`. Ebenso fehlt ein „Bestätigungsmail erneut senden".

**Relevanz.** Ein Tippfehler in der Adresse bei der Registrierung ist heute unreparierbar und – zusammen mit APO-12 und dem fehlenden Support-Eingang – endgültig.

### APO-15 · Session-Liste / Geräteliste · **MISSING (ehrlich benannt)** · **P3**

**Evidence.** `lib/auth/account-session-view.ts:12-14` und `:92-93` benennen ausdrücklich, dass andere Sitzungen nicht auflistbar sind – und liefern dafür weder `empty` noch eine erfundene Zahl. Das Wichtigere ist gebaut: scoped Logout `local`/`others`/`global` (`lib/auth/account-logout-scopes.ts:12`, `:81-103`, `components/account/SecurityLogout.tsx:57-66`).

**Warum P3.** „Überall abmelden" existiert; die Geräteliste ist Komfort. Dies ist ein Fall, in dem eine Lücke bewusst und ehrlich offen ist – **kein** V1-Blocker.

### APO-16 · App-seitiges Rate Limiting auf Auth · **PARTIAL** · **P2**

**Evidence.** Plattformlimits sind konfiguriert (`supabase/config.toml:174-187`: `sign_in_sign_ups = 30`, `token_verifications = 30` je IP/5 min), Captcha ist mit Begründung aus (`:193-196`). Eigene App-Middleware für `/login`/`/register` existiert nicht; die Formulare übersetzen lediglich Supabase-Rate-Limit-Fehler.

**Bewertung.** Für V1 vertretbar, aber als bewusste Risk Acceptance zu dokumentieren, nicht als „vorhanden" zu führen.

### APO-17 · Admin-AAL2, Rollenmodell, Passwortschutz · **BUILT** · **kein Gap**

**Evidence.** Rollenquelle ist serverseitig `profiles.role` (`lib/auth/admin-guard.ts:47`, `:98-108`); Eskalationsschutz `canAssignRole` verhindert Selbstbeförderung (`lib/auth/roles.ts:136-151`). Der Edge-Proxy prüft bewusst nur Identität, nicht Rolle/AAL (`proxy.ts:9-19`), Entscheidung fällt zentral im Guard. HaveIBeenPwned-Abgleich ist aktiv (`docs/AUTH.md:76`, `:162`) – mit benannter Plan-Abhängigkeit: fällt die Organisation auf Free zurück, fällt der Schutz mit (`:187`). Kein Gap; die Plan-Abhängigkeit ist ein **P3-Watch-Item**.

### APO-18 · Globales Consumer-AAL2 · **bewusst nicht vorhanden** · **kein Gap**

**Evidence.** `lib/auth/account-mfa-step-up.ts:3-4`: „Kein globales Consumer-AAL2." TOTP ist für Endnutzer optional verfügbar (`components/account/SecurityMFA.tsx:201-287`), Step-up wird vor dem Unenroll eines verifizierten Faktors verlangt (`:350-365`).

**Warum das hier steht.** Damit ein Folgeslice das nicht als Lücke „behebt". Es ist eine dokumentierte Produktentscheidung, und AGENTS.md §5 verbietet deren eigenmächtige Änderung.
