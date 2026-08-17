# Jetnity – Auth-Konfiguration

**Stand:** 17. August 2026 · Phase 1.4c
**Gilt für:** den Supabase-**Development-Branch**. Production wird von hier aus nicht verwaltet.

Diese Datei beantwortet drei Fragen: Wie ist die Anmeldung des Branches eingestellt, woher stammt jeder dieser Werte, und woran würde auffallen, wenn er sich ändert.

Für Rollen, Policies und Datenzugriff gilt [docs/DATENBANK.md](DATENBANK.md); für den Aufbau der Zugriffsschichten [ARCHITECTURE.md](../ARCHITECTURE.md) Abschnitt 4.

---

## 1. Grundsatz

Die Auth-Konfiguration liegt nicht in der Datenbank. Sie liegt beim Auth-Server des Projekts und lässt sich mit einem Klick im Dashboard ändern – ohne Migration, ohne Commit, ohne Spur im Repository.

Genau das war der Zustand vor dieser Phase. `supabase/config.toml` war der unveränderte Vorlagenstand der CLI: Er beschrieb weder Development noch Production und widersprach dem laufenden Branch an neun Stellen, unter anderem bei der Passwortlänge (6 statt 12) und der E-Mail-Bestätigung (aus statt an). Wer die Datei gelesen hätte, um zu erfahren, wie sich ein Konto anmeldet, hätte sich getäuscht.

Seit Phase 1.4c gilt:

1. **`supabase/config.toml` beschreibt den Branch.** Jeder Auth-Wert darin ist gegen `GET /v1/projects/{ref}/config/auth` abgeglichen, nicht geraten.
2. **Was die Datei nicht ausdrücken kann, steht mit Begründung im Code** – in `OHNE_TOML_SCHLUESSEL` in `lib/supabase/auth-erwartung.ts`.
3. **Jeder Schlüssel der API ist eingeordnet.** Erwartet, begründet nicht geprüft, oder von einer Musterregel gedeckt. Ein neuer Schalter fällt auf.
4. **Kein Secret im Repository.** Anbieter-Secrets stehen als `env(...)`-Verweis; die Schlüssel des Projekts holen die Skripte zur Laufzeit über die Management API.

---

## 2. Werkzeuge

| Befehl | Wirkung | braucht Zugang |
| --- | --- | --- |
| `npm run auth:pruefen` | vergleicht `config.toml` und die API-Erwartungen mit dem laufenden Branch. Endet mit Code 1 bei jeder Abweichung | ja, nur lesend |
| `npm run auth:anwenden -- --zeigen` | sagt, was sich ändern würde | ja, nur lesend |
| `npm run auth:anwenden` | überträgt `config.toml` mit `supabase config push` und setzt die Schlüssel ohne CLI-Entsprechung per PATCH | ja, schreibend |
| `npm run auth:fluesse` | prüft die Anmeldewege an ihnen selbst: Registrierung, Bestätigung, Anmeldung, Rücksetzung, zweiter Faktor, Anbieter | ja, schreibend (ein Wegwerfkonto) |
| `npm run auth:testkonto -- anlegen <mail> <passwort> [rolle]` | legt ein anmeldbares Konto mit Rolle an, für die Prüfung der Admin-Oberflächen von Hand. `entfernen <mail>` nimmt es zurück | ja, schreibend |
| `npm test` | vergleicht die Abbildung und die Passwortregel der Formulare mit `config.toml` | nein |

Das Testkonto entsteht über den Admin-Endpunkt von Auth und nicht über rohes SQL. Der Grund ist gemessen: Ein direkt in `auth.users` geschriebenes Konto lässt die Token-Spalten auf `NULL`, und GoTrue bricht danach mit „Database error finding user" ab – `sql: Scan error on column index 3, name "confirmation_token": converting NULL to string is unsupported`.

**Der Schutz vor dem falschen Ziel steht vor jedem Zugriff.** `scripts/auth/ziel.ts` fragt bei Supabase, ob `SUPABASE_PROJECT_REF` ein Branch ist oder ein eigenständiges Projekt, und bricht im zweiten Fall ab. Die Unterscheidung ist eindeutig: Ein Branch antwortet unter `/v1/projects/{ref}` mit 404 und unter `/v1/branches/{ref}` mit 200, ein Elternprojekt umgekehrt. Ein hart eingetragener Production-Ref wäre schwächer – er müsste gepflegt werden und würde ein zweites Produktionsprojekt nicht erkennen.

`npm run auth:pruefen` läuft in der CI in einem eigenen Job. Er überspringt sich selbst, solange die Secrets `SUPABASE_ACCESS_TOKEN` und `SUPABASE_PROJECT_REF` im Repository fehlen, und sagt das im Protokoll – eine Prüfung, die nicht gelaufen ist, darf nicht grün aussehen.

---

## 3. Der Stand des Branches

Erhoben am 17. August 2026 über die Management API. Die Spalte „Parent" ist der Stand des Elternprojekts (Production) und wurde **nur gelesen**.

### Anmeldewege

| Einstellung | Development | Parent | Quelle |
| --- | --- | --- | --- |
| E-Mail und Passwort | an | an | `auth.email.enable_signup` |
| Registrierung offen | ja | ja | `auth.enable_signup` |
| E-Mail-Bestätigung verlangt | ja | ja | `auth.email.enable_confirmations` |
| Anmeldung ohne Bestätigung möglich | nein | nein | API `mailer_allow_unverified_email_sign_ins` |
| anonyme Anmeldung | aus | aus | `auth.enable_anonymous_sign_ins` |
| Google | aus | aus | `auth.external.google.enabled` |
| Apple | aus | aus | `auth.external.apple.enabled` |
| Telefon / SMS | aus | aus | `auth.sms.enable_signup` |
| Passkey | aus | aus | `auth.passkey.enabled` |
| Web3 (Solana, Ethereum) | aus | aus | `auth.web3.*.enabled` |
| SAML | aus | aus | API `saml_enabled` |
| Jetnity als OAuth-Anbieter | aus | aus | API `oauth_server_enabled` |
| Konten manuell verknüpfen | aus | aus | `auth.enable_manual_linking` |

### Passwörter

| Einstellung | Development | Parent | Quelle |
| --- | --- | --- | --- |
| Mindestlänge | 12 | 12 | `auth.minimum_password_length` |
| geforderte Zeichengruppen | 4 (klein, groß, Ziffer, Symbol) | 4 | `auth.password_requirements` |
| Abgleich mit HaveIBeenPwned | **an, seit dieser Phase** | an | API `password_hibp_enabled` |
| erneute Anmeldung vor Passwortänderung | an | an | `auth.email.secure_password_change` |
| altes Passwort mitsenden | aus | aus | API `security_update_password_require_current_password` |

Die Regel steht einmal im Code: `lib/auth/passwort-richtlinie.ts`. Beide Formulare – Registrierung und die Seite nach dem Rücksetzlink – zeigen und prüfen sie von dort, und `lib/supabase/auth-erwartung.test.ts` vergleicht sie bei jedem `npm test` mit `config.toml`.

### Sitzungen und Token

| Einstellung | Development | Parent | Quelle |
| --- | --- | --- | --- |
| Gültigkeit des Access-Tokens | 3600 s | 3600 s | `auth.jwt_expiry` |
| Rotation der Refresh-Token | an | an | `auth.enable_refresh_token_rotation` |
| Spielraum für Wiederverwendung | 10 s | 10 s | `auth.refresh_token_reuse_interval` |
| Zwangsabmeldung nach Zeit | aus | aus | `auth.sessions.timebox` |
| Abmeldung bei Untätigkeit | aus | aus | `auth.sessions.inactivity_timeout` |
| eine Sitzung je Konto | aus | aus | API `sessions_single_per_user` |

Rotation mit Wiederverwendungsspielraum ist die Kombination, die Supabase empfiehlt: Ein benutztes Refresh-Token wird ersetzt, ein zweiter Gebrauch entwertet die ganze Kette – die zehn Sekunden fangen die parallelen Anfragen desselben Browsers ab, ohne den Diebstahlschutz aufzugeben.

Eine Sitzung je Konto bleibt aus: Reisen werden auf dem Telefon und am Rechner geplant, und die Einstellung würde die zweite Sitzung unangekündigt beenden.

### E-Mail und zweiter Faktor

| Einstellung | Development | Parent | Quelle |
| --- | --- | --- | --- |
| Adressänderung doppelt bestätigen | an | an | `auth.email.double_confirm_changes` |
| Länge des Einmalcodes | 6 | 6 | `auth.email.otp_length` |
| Gültigkeit des Einmalcodes | 3600 s | 3600 s | `auth.email.otp_expiry` |
| Mindestabstand zweier E-Mails | 60 s | 60 s | `auth.email.max_frequency` |
| eigener SMTP-Server | nein | nein | `[auth.email.smtp]` auskommentiert |
| TOTP einrichten und prüfen | an | an | `auth.mfa.totp.*` |
| Faktoren je Konto | 5 | 5 | `auth.mfa.max_enrolled_factors` |
| zweiter Faktor per SMS | aus | aus | `auth.mfa.phone.*` |
| WebAuthn | aus | aus | `auth.mfa.web_authn.*` |
| AAL1 trotz eingerichtetem Faktor | nein | nein | API `mfa_allow_low_aal` |

TOTP war in der Vorlage aus, auf dem Branch an – und die Anwendung führt den Weg zu Ende: `components/auth/MFATotpDialog.tsx` fordert den Code an, sobald Supabase AAL2 verlangt. Der Widerspruch lag allein in der Datei.

### Missbrauchsschutz

| Einstellung | Development | Parent | Quelle |
| --- | --- | --- | --- |
| E-Mails je Stunde | 2 | 2 | `auth.rate_limit.email_sent` |
| An- und Registrierungsversuche je IP / 5 min | 30 | 30 | `auth.rate_limit.sign_in_sign_ups` |
| Einlösungen von OTP und Link je IP / 5 min | 30 | 30 | `auth.rate_limit.token_verifications` |
| Token-Aktualisierungen je IP / 5 min | 150 | 150 | `auth.rate_limit.token_refresh` |
| Captcha | aus | aus | `auth.captcha.enabled` |
| eigene IP behaupten dürfen | nein | nein | API `security_sb_forwarded_for_enabled` |

Kein Captcha: Es verlangt einen Anbieter samt Secret und würde jede Anmeldung von einem Dritten abhängig machen. Die Ratenbegrenzung deckt den Missbrauchsfall, den Jetnity heute hat.

---

## 4. Redirect-Ziele

`site_url = "http://localhost:3000"`, `additional_redirect_urls = []`.

Die leere Liste sieht nach einem Versehen aus. Die offizielle Musterregel für Redirect-URLs legt nahe, dass `site_url` ohne `/**` keinen Unterpfad abdeckt – der Rücksetzlink auf `/auth/update-password` müsste dann auf der Startseite landen. **Nachgestellt an echten Links des Branches trifft das nicht zu:**

| angefordertes Ziel | Ergebnis |
| --- | --- |
| `http://localhost:3000/auth/update-password` | wird übernommen |
| `http://localhost:3000/reisen` | wird übernommen |
| `http://127.0.0.1:3000/auth/update-password` | wird übernommen |
| `https://beispiel-fremd.example.com/abgriff` | fällt auf `site_url` zurück |

Der letzte Fall ist der wichtige: Ein fremder Host bekommt das Token nicht. Deshalb bleibt die Liste leer – sie zu füllen würde den Kreis erlaubter Ziele erweitern, ohne einen Weg zu öffnen, der heute fehlt, und ein Muster wie `https://*.vercel.app/**` würde Hosts einschliessen, die Jetnity nicht besitzt.

Der Fall „fremder Host fällt zurück" ist einer der 18 Fälle in `npm run auth:fluesse` und läuft damit bei jeder Prüfung mit.

**Offen:** Sobald ein ausgelieferter Ursprung existiert, muss er hier stehen. Bis dahin ist er nicht erfunden ([ROADMAP.md](../ROADMAP.md)).

---

## 5. Der Schutz vor kompromittierten Passwörtern

Der Advisor `auth_leaked_password_protection` war der letzte offene Befund aus Phase 1.4. Er ist jetzt weg, und zwar nachweisbar.

**Der Wert vorher.** `password_hibp_enabled` stand auf dem Branch auf `false`, im Elternprojekt auf `true`. Es war der einzige Unterschied zwischen beiden in den 35 sicherheitsrelevanten Schlüsseln – der Branch lag hinter Production zurück.

**Warum der Advisor kam und ging.** Er erschien im Abschlusslauf der Phase 1.4, in zwei Läufen davor nicht und nach Phase 1.4b wieder nicht. Geschrieben hatte die Einstellung keine der Phasen. Die Erklärung ist gemessen, nicht vermutet: **Der Advisor meldet den Befund nur, solange passwortgestützte Konten existieren.** Ein Lauf ohne solches Konto ergab 13 Security-Befunde; nach dem Anlegen genau eines Kontos mit Passwort waren es 14, der zusätzliche war `auth_leaked_password_protection`. Die Testkonten der RLS-Nachweise entstehen in zurückgerollten Transaktionen und existieren beim Advisor-Lauf nicht mehr – daher das Kommen und Gehen.

**Aktiviert und geprüft.** `password_hibp_enabled` steht jetzt auf `true`. Der Advisor-Lauf danach ergibt 13 Security-Befunde, obwohl das Konto mit Passwort weiterhin existiert. Wirksam ist die Einstellung ebenfalls nachgewiesen:

```
bekannt geleakt  → HTTP 422  Password is known to be weak and easy to guess, please choose a different one.
nicht geleakt    → HTTP 200  angenommen
```

**Gegengeprobt am Ende der Phase.** Der entscheidende Lauf ist der mit einem Konto, das ein Passwort hat – ohne ein solches meldet der Advisor ohnehin nichts. Er ergibt jetzt 13 Security-Befunde und **null** Treffer auf `auth_leaked_password_protection`, wo derselbe Aufbau vor der Umstellung 14 und einen ergab. Das Konto wird danach wieder entfernt.

**Keine Kosten, kein Plan-Wechsel.** Der Abgleich mit HaveIBeenPwned ist in Supabase Auth enthalten und in allen Plänen verfügbar; das Elternprojekt führt ihn im selben Plan. `PATCH /config/auth` hat den Wert ohne Rückfrage und ohne Hinweis auf ein kostenpflichtiges Zusatzprodukt übernommen.

**Der Wortlaut ist übersetzt.** GoTrue antwortet mit „Password is known to be weak and easy to guess" – ohne „leaked", „pwned" oder „breach". Vorher fiel diese Meldung im Formular auf „Passwortanforderungen nicht erfüllt" durch. Das ist die schlechtestmögliche Antwort: Die angezeigte Liste ist ja erfüllt, und Reisende probieren Varianten, die genauso scheitern. `passwortAblehnung()` in `lib/auth/passwort-richtlinie.ts` trennt beide Fälle, mit dem gemessenen Wortlaut als Test.

---

## 6. Was `config.toml` nicht ausdrücken kann

Zehn sicherheitsrelevante Schlüssel kennt die CLI-Konfiguration nicht – geprüft an `pkg/config/auth.go` der Supabase CLI 2.114, derselben Stelle, die `supabase config push` benutzt. Sie stehen in `OHNE_TOML_SCHLUESSEL` in `lib/supabase/auth-erwartung.ts`, jeder mit dem Grund, warum er geprüft wird, und werden von `npm run auth:anwenden` per PATCH gesetzt.

| Schlüssel | Soll | warum überhaupt geprüft |
| --- | --- | --- |
| `password_hibp_enabled` | `true` | Abschnitt 5 |
| `mailer_allow_unverified_email_sign_ins` | `false` | würde die E-Mail-Bestätigung aushebeln |
| `security_update_password_require_current_password` | `false` | wer sein Passwort vergessen hat, kann das alte nicht mitsenden |
| `mfa_allow_low_aal` | `false` | sonst wäre die Einrichtung eines Faktors folgenlos |
| `sessions_single_per_user` | `false` | Telefon und Rechner gleichzeitig |
| `security_sb_forwarded_for_enabled` | `false` | liesse die Ratenbegrenzung umgehen |
| `saml_enabled` | `false` | kein Unternehmens-Login vorgesehen |
| `oauth_server_enabled` | `false` | Jetnity ist kein OAuth-Anbieter für fremde Anwendungen |
| `custom_oauth_enabled` | `false` | gehört zum OAuth-Anbieter-Betrieb |
| `oauth_server_allow_dynamic_registration` | `false` | liesse fremde Anwendungen sich selbst registrieren |

Der Abschnitt `[auth.oauth_server]` existiert in der CLI, überträgt aber nichts – `auth.go` führt dort „implement me". Deshalb steht `oauth_server_enabled` bei den API-Schlüsseln und nicht in der Datei.

---

## 7. Wie der Abgleich vollständig bleibt

Der Branch führt 242 Auth-Schlüssel. 55 davon sind Sollwerte. Für die übrigen 187 stellt `npm run auth:pruefen` die Frage, die eine Aufzählung nicht stellt: **Sagt das Repository überhaupt etwas über diesen Schlüssel?**

Vier Antworten sind zulässig:

1. **Abgebildet** – `AUTH_ABBILDUNG` verbindet ihn mit einem Pfad in `config.toml`.
2. **API-Erwartung** – `OHNE_TOML_SCHLUESSEL`, Abschnitt 6.
3. **Begründet nicht geprüft** – `NICHT_GEPRUEFT`, ein Satz je Schlüssel. „Unwichtig" genügt nicht.
4. **Von einem Muster gedeckt** – etwa die Zugangsdaten eines abgeschalteten Anmeldedienstes oder der Wortlaut einer E-Mail.

Alles andere wird gemeldet. Dazu kommen zwei Musterregeln, die nicht auf Werte, sondern auf Familien schauen: **Jedes `external_*_enabled` und jedes `hook_*_enabled` muss aus sein, das `config.toml` nicht nennt.** Beides sind Wege in die Anwendung hinein – ein neuer Anmeldedienst oder ein Hook, der fremden Code in die Anmeldung ruft. Sie fangen genau das, was eine Liste nicht fängt: einen Schalter, den es beim Schreiben der Liste noch nicht gab.

Drei Umrechnungen sind dabei nicht offensichtlich und deshalb einzeln getestet:

- `auth.sessions.*` rechnet in **Stunden**, nicht in Sekunden (die CLI schickt `.Hours()`).
- `auth.rate_limit.sign_in_sign_ups` heisst auf der API-Seite `rate_limit_otp`, nicht `rate_limit_verify`.
- `password_required_characters` ist keine Aufzählung, sondern die Liste erlaubter Zeichen je Gruppe, getrennt durch `:` – und die Symbolgruppe enthält selbst einen Doppelpunkt. Wer die Gruppen mit `split(':')` zählt, zählt fünf statt vier.

Aus demselben Grund liest `lib/supabase/config-toml.ts` die Datei selbst, statt ein Paket zu holen: Ein Leser, der am ersten `#` abschneidet, zerstört den Wert von `password_requirements`, weil `#` dort ein erlaubtes Sonderzeichen ist.

---

## 8. Was die Anmeldewege selbst sagen

`npm run auth:fluesse` prüft nicht Werte, sondern Wirkung – 18 Fälle, alle am 17. August 2026 grün:

| Bereich | geprüft |
| --- | --- |
| Registrierung | zu kurzes Passwort, fehlende Zeichengruppe, Passwort aus einem Datenleck, anonyme Anmeldung – jeweils abgelehnt |
| E-Mail-Bestätigung | Anmeldung vor der Bestätigung abgelehnt; der Link führt mit Sitzung nach `/auth/callback`; danach gelingt die Anmeldung |
| zweiter Faktor | TOTP lässt sich einrichten und wieder entfernen |
| Rücksetzung | der Link führt auf `/auth/update-password`; ein fremder Host fällt auf `site_url` zurück |
| Passwortänderung | Datenleck und Regelverstoss abgelehnt, gültiges Passwort gesetzt, alte Anmeldung gilt nicht mehr |
| Anbieter | Google und Apple antworten „provider is not enabled" |

Das Wegwerfkonto entsteht über die Admin-API und wird am Ende entfernt, auch wenn ein Fall scheitert.

### Was nicht geprüft ist

**Die angenommene Registrierung über `POST /signup`.** Zwei gemessene Gründe:

- Sie verschickt eine Bestätigungs-E-Mail und zählt gegen `rate_limit_email_sent = 2` je Stunde. Ein Fall, der davon abhängt, wäre beim zweiten Lauf rot, ohne dass sich etwas geändert hat.
- Supabase lehnt Adressen auf der reservierten Endung `.test` mit `email_address_invalid` ab. Mit einer Wegwerfadresse geht der öffentliche Weg also gar nicht zu Ende; die Admin-API prüft die Endung nicht.

Geprüft ist stattdessen alles, was die Registrierung ablehnt, und der gesamte Weg danach – mit einem Konto im gleichen Zustand, den `POST /signup` erzeugt: angelegt, unbestätigt, mit Passwort.

**Der TOTP-Code selbst.** Die Einrichtung ist geprüft, die Eingabe eines gültigen Codes nicht – dafür bräuchte der Lauf den geteilten Schlüssel und eine Uhr.

**Magic Link.** Die Formulare bieten ihn nicht an; es gibt keinen Weg in der Anwendung, der ihn benutzt. Der Endpunkt ist auf dem Branch erreichbar, aber ohne Oberfläche dahinter. Nichts zu prüfen, solange das so bleibt.

**Der tatsächliche E-Mail-Versand.** Es gibt keinen eigenen SMTP-Server; Supabase versendet selbst und begrenzt hart auf zwei E-Mails je Stunde. Für den Launch reicht das nicht ([ROADMAP.md](../ROADMAP.md)).

---

## 9. Warum kein `[remotes.*]`-Block

Die offizielle Branch-Konfiguration von Supabase läuft über `[remotes.<name>]` in `config.toml`: Ein solcher Block überschreibt einzelne Werte für ein bestimmtes Projekt, erkannt am `project_id`. Jetnity führt keinen. Zwei Gründe:

1. **Er verlangt den Projekt-Ref im Klartext.** Der Ref eines Branches ist kein Geheimnis, aber er ist auch kein Wert, der in ein öffentliches Repository gehört – er benennt das Projekt, gegen das jeder Angriff dann zielen kann.
2. **Es gibt nur ein Ziel.** Ein `[remotes]`-Block trennt zwei Umgebungen. Solange von hier aus ausschliesslich Development verwaltet wird, würde er eine Unterscheidung einführen, die keine Wirkung hat – und nach [AGENTS.md](../AGENTS.md) Regel 12 eine Abstraktion ohne realen Bedarf.

Die Folge ist bekannt und in Kauf genommen: Die Supabase-GitHub-Integration wendet Konfiguration nur auf persistente Ziele an, für die ein `[remotes]`-Block existiert. Ohne ihn überträgt sie nichts, und `npm run auth:anwenden` bleibt der Weg. Sobald ein zweites Ziel dazukommt, dockt es genau hier an: `erwarteteAuthKonfiguration()` nimmt den Namen eines Remotes bereits als Parameter.

---

## 10. Offene Punkte

| Punkt | Stand |
| --- | --- |
| Google und Apple sind in beiden Formularen als Schaltfläche sichtbar, auf dem Branch aber aus. Ein Klick endet in einer Fehlermeldung von Supabase | festgehalten, nicht behoben – Einschalten braucht Client-ID und Secret beider Anbieter, also eine Handlung ausserhalb dieses Repositories |
| kein ausgelieferter Ursprung in `additional_redirect_urls` | offen, bis es einen gibt. Abschnitt 4 |
| kein eigener SMTP-Server; zwei E-Mails je Stunde | offen. Vor dem Launch nötig |
| `auth_db_connections_absolute` (Performance-Advisor) | Kapazitätsplanung vor dem Launch, kein Sicherheitsbefund |
| Production ist nicht abgeglichen | Absicht. Der Vergleich in Abschnitt 3 ist nur gelesen; ein Abgleich gehört zum ersten Production-Deploy nach Phase 1.5 |
| Die CI-Prüfung braucht `SUPABASE_ACCESS_TOKEN` und `SUPABASE_PROJECT_REF` als Repository-Secrets | solange sie fehlen, überspringt der Job sich selbst und protokolliert das |
