# Legal content preparation 1 — Drafts

Date: 27 September 2026
Status: **NOT APPROVED FOR PUBLICATION**
Logical agent: **Jetnity legal content preparation 1**, Generation **1**
Session: `bc-efbd2a0c-d64b-4e37-b054-b7c583cabdac`

PrivacyBee generates and maintains the privacy policy. This file is not that policy and not a replacement for it. Sections A, B, and B2 are superseded proposals. They are not approved fallback text if the vendor embed fails. The selected installation is Report §4.

Evidence is in `docs/LEGAL_CONTENT_PREPARATION_1_REPORT_2026-09-27.md`. Editorial notes and the decision list are separate from any retained proposal.

---

## A. Impressum — superseded proposal

**SUPERSEDED PROPOSAL. NOT THE SELECTED PAGE. NOT APPROVED FALLBACK TEXT.**

The selected `/impressum` implementation is the PrivacyBee imprint widget on `https://jetnity.com`, specified in Report §4.2. No hosted imprint URL was supplied. Do not use the text below when the widget fails.

# Impressum

Feirov Global Trading
Einzelunternehmen
Inhaber: Sasa Feirov

Meilipromenade 14
6032 Emmen
Schweiz

Website: https://jetnity.com
E-Mail: info@jetnity.ch
Datenschutz: admin@jetnity.com

Unternehmens-Identifikationsnummer (UID): CHE-432.441.385

Entwurfsdatum: 27. September 2026

### Editorial notes for the imprint — not visitor text

- The company name is Feirov Global Trading. Do not append “EIU”. Rechtsform and Inhaber are separate lines.
- The country appears once.
- No phone number, no MWST suffix, no commercial-register excerpt number beyond the SHAB notice already cited, and no claim that an authority currently lists the business as active.
- UID and the 2020 SHAB notice are historical primary evidence recorded in #577 comment 5851322020. The Product Owner confirmed on 27 September 2026 that this operator and this address are current (comment 5851390009). That confirmation is not a new UID extract and not a mailbox delivery test.
- info@jetnity.ch is the general contact. admin@jetnity.com is the data-protection contact the Product Owner confirmed. The public PrivacyBee configuration also shows that contact and the operator name (comment 5854846134). Those facts are not a new mailbox test.
- Do not let the imprint widget rename the company to include “EIU” or print the country twice if the dashboard fields can prevent it. If they cannot, that stays a narrow vendor-configuration question, not a reason to publish this proposal instead.

---

## B. Datenschutzerklärung — superseded proposal

**SUPERSEDED PROPOSAL. NOT THE SELECTED PRIVACY POLICY. NOT APPROVED FALLBACK TEXT.**

PrivacyBee generates and maintains the Datenschutzerklärung. Do not publish the article below as `/privacy`, beside the widget, or when the widget fails. The failure behavior is the hosted link in Report §4.4.

# Datenschutzerklärung — Ergänzung von Jetnity

Verantwortlicher: Feirov Global Trading, Einzelunternehmen, Inhaber Sasa Feirov, Meilipromenade 14, 6032 Emmen, Schweiz.
Kontakt: info@jetnity.ch
Datenschutz: admin@jetnity.com
Website: https://jetnity.com

### Konto

Wenn du ein Konto erstellst, speichert Jetnity deine E-Mail-Adresse und dein Passwort bei Supabase. Du kannst einen Anzeigenamen angeben. Fehlt er, verwendet Jetnity den Teil der E-Mail-Adresse vor dem @-Zeichen. Zum Konto gehören ausserdem Rolle, Status, der Zeitpunkt der Erstellung und der zuletzt gesehene Zeitpunkt.

Supabase setzt Cookies, damit du angemeldet bleibst.

### Reisen und Reisende

Mit einem Konto speichert Jetnity deine Reise bei Supabase: Ziele, Zeiten und die Bausteine deiner Planung. Reisende können einen kurzen Namen, ein Wohnsitzland und Staatsangehörigkeiten als Ländercode tragen. Zu einem Reisedokument können Art, Ausstellungsland und Ablaufdatum gespeichert werden. Pass- oder Ausweisnummern, MRZ, Scans und biometrische Daten speichert Jetnity dafür nicht.

Eine Gastreise wird zunächst im Speicher deines Browsers abgelegt. Dort liegt eine aktive Reise. Ältere Entwürfe können in einer Warteschlange liegen. Wenn du sie in dein Konto übernimmst, wird sie auf unseren Servern gespeichert. Der Entwurf im Browser wird gelöscht, sobald das Speichern bestätigt ist. Wenn du einen Änderungswunsch an Jetnity sendest, wird auch die zugehörige Reise an unseren Server übertragen. Solange du nur lokal weiterplanst, bleibt diese Reise im Browser.

Wenn du einen Besuch ausdrücklich bestätigst, speichert Jetnity den Ort, das Land und die Koordinaten aus der Ortsliste. Jetnity leitet einen Besuch nicht aus einer Reise ab.

### Verwaltung

Personen mit einer Verwaltungsrolle können E-Mail-Adresse, Anzeigename, Rolle und Status sehen. Der Zugang verlangt eine zusätzliche Anmeldebestätigung.

### Hosting und Ortsdaten

Die Website wird über Vercel ausgeliefert. Die Ortsauswahl nutzt eine Ortsliste, die Jetnity bei Supabase speichert. Die Liste geht auf GeoNames zurück und ist im Footer genannt. Deine Suche geht nicht bei jedem Tastendruck an GeoNames.

### Reichweite

Jetnity setzt auf dieser Website keine Reichweiten- oder Werbe-Werkzeuge ein.

### Deine Angaben mitnehmen oder löschen

Angemeldete Personen können eine JSON-Datei ihrer bei Jetnity gespeicherten Konto- und Reisedaten herunterladen. Dieser Download ist kein vollständiger gesetzlicher Auskunftsbericht. Eine Selbstbedienung zum Löschen des Kontos gibt es noch nicht.

### Editorial notes for section B — not visitor text

- The article above is a superseded proposal, not the default page. Useful processing facts stay here so they are not lost. They are not a second privacy policy.
- Supabase’s recorded database region is Zurich (`eu-central-2`). Vercel’s recorded deployment region is Washington, D.C. (`iad1`). This proposal does not say that all processing stays in Switzerland. Report §2.6.
- Google and Apple sign-in exist as buttons. Local `supabase/config.toml` has both providers disabled. Hosted Production flags were not read. That fact stays here, not in the article.
- The registration checkbox is only component state. It is not a stored consent record. That fact stays here.
- Supabase cookie names and lifetimes are not hardcoded in Jetnity. The article therefore does not list them.
- Visit history is described because Production application of `20260917120000_account_visits` is last recorded as applied, including the 27 September 2026 migration-tail note. This preparation did not re-query the catalog.
- There is no analytics package and no mounted cookie banner in the repository. The article states the absence. It does not discuss vendor-template repair.

## B2. Conditional model proposal — superseded

**SUPERSEDED PROPOSAL. NOT PART OF THE SELECTED PRIVACY POLICY.**

Do not add this variant to the PrivacyBee page and do not publish it as Jetnity’s policy. A 27 September 2026 dashboard search found no Production entry for `JETNITY_MODELL_AKTIV` (comment 5854401589). Values were not printed.

# Intelligente Planung und Reisebegleiter

Wenn du die intelligente Planung oder den Reisebegleiter nutzt, sendet Jetnity den Inhalt an OpenAI. Daraus soll ein Reisevorschlag, eine vorgeschlagene Änderung oder eine Antwort auf deine Frage werden.

Für einen Reisevorschlag ist das der Text, den du eingibst, zusammen mit den Planungsregeln von Jetnity.

Eine Änderung kann aus einem Konto oder aus einer Reise im Browser kommen. Zusätzlich zum Änderungstext sendet Jetnity eine gekürzte Reise. Dazu gehören unter anderem Titel, Abreiseort, Daten, Tempo, Interessen, Budgetziel, Währung, Anzahl der Reisenden, der Reisewunsch und die Einträge der Tage mit Titel, Notiz und Uhrzeit. Die gekürzte Reise trägt auch die Kennungen der Reise, der Etappen, der Tage und der Einträge sowie die Revision, damit ein Vorschlag der richtigen Fassung zugeordnet werden kann. Preise, Anbieter und Buchungslinks gehen nicht mit.

Der Reisebegleiter gilt für eine Reise in deinem Konto. Jetnity sendet deine Frage sowie Namen, Länder und Daten der Etappen. Zu den Reisenden können Wohnsitz, Staatsangehörigkeiten sowie Art, Ausstellungsland und Ablauf eines Dokuments mitgehen. Eine Dokumentnummer geht nicht mit.

Die Anfrage an OpenAI enthält die Einstellung, die Antwort nicht zu speichern. Diese Einstellung beweist nicht, dass bei OpenAI nichts liegen bleibt.

Jetnity speichert in seinem Nutzungsprotokoll keine Kopie deines Textes und keine Kopie der Antwort. Dort stehen die Art des Aufrufs, das Modell, ob es ein Konto oder ein Gast war, ein Hash, Tokenzahlen, Dauer und Kosten. Bei einem Konto entsteht der Hash aus der Kontokennung. Bei einem Gast entsteht er aus dem Cookie `jetnity_gast`.

Dieses Cookie liest oder setzt Jetnity, wenn der Nutzungsrahmen geprüft wird, noch bevor das Ergebnis dieser Prüfung feststeht. Das gilt auch, wenn du angemeldet bist, und auch wenn noch keine Antwort vorliegt. Es enthält eine zufällige Kennung, ist für Skripte im Browser nicht lesbar und gilt 30 Tage. Es dient der Begrenzung der Nutzung, nicht der Reichweitenmessung. Ist die Funktion ausgeschaltet, setzt dieser Weg das Cookie nicht und sendet den Text nicht an OpenAI.

### Editorial notes for section B2 — not visitor text

- The save-setting sentence refers to the request field `store: false` in `lib/modell/anfrage.ts`. It is a request setting, not proof of zero provider retention.
- The cookie step runs only when the quota client exists. A missing client returns before the cookie is written. That detail stays here.
- Section B does not mention OpenAI or this cookie. Putting this variant into a visitor page would promote a repository path. The dashboard search found no Production flag entry. That is not a printed value of a secret.

---

## C. Vendor correction brief

Audience: Product Owner and Technical Lead. Not visitor copy. No support ticket and no account change was made while writing this brief.

### C.1 What was actually seen

This writer did **not** read the original screenshots and did **not** fetch the hosted policy again. Later Technical-Lead receipts supersede the early service list:

- Comment [5851278348](https://github.com/Jetnity/jetnity/issues/577#issuecomment-5851278348) recorded a preview that named Vercel (necessary) and PrivacyBee, plus template assertions: a cookie banner and analysis/statistics cookies, tracking-pixel and email-tracking boilerplate, and logs deleted after each session.
- Comment [5854791796](https://github.com/Jetnity/jetnity/issues/577#issuecomment-5854791796): Supabase was added manually on 27 September 2026 (Hosting). The refreshed preview lists Supabase, Vercel, and PrivacyBee. Those images are the service summary, not a full re-read of the legal body.
- Comment [5854846134](https://github.com/Jetnity/jetnity/issues/577#issuecomment-5854846134): hosted URL https://app.privacybee.io/v/cmuj24t7p05512zwul6dghfhu?lang=de&type=dsgvo . Public configuration `lastUpdated` `2026-09-27T09:42:13.297Z` has the banner disabled and marketing/product-development false. The German DSGVO template still asserts a displayed banner, session-end logfile deletion, and generic analytics/pixel wording. Supabase’s card is the generic database/authentication description.

Do not turn those template assertions into implementation requirements. Do not install a banner or a tracker to make them true. Do not hide the paragraphs with CSS or by rewriting the DOM. Do not replace the generated policy with section B.

Imprint preview notes in comments 5851322020 and 5851342372: the vendor rendering appended “EIU” to the company name, and “Schweiz” appeared twice. Section A is a superseded comparison text, not the selected page.

### C.2 What public vendor documentation says can be changed

Fetched read-only on 27 September 2026:

| Need | Public vendor statement | URL |
| --- | --- | --- |
| Edit the generated sentences | Not provided in the dashboard. Manual edits could be overwritten. | https://support.privacybee.io/support/solutions/articles/103000348697-kann-ich-den-generierten-datenschutztext-selbst-bearbeiten-oder-eigene-passagen-hinzuf%C3%BCgen- |
| Same point, shorter table | “Der Datenschutztext selbst — Nein.” Services, contact details, and colors can be changed. CSS is described as appearance, not content. | https://support.privacybee.io/support/solutions/articles/103000397885-anpassungen-datenschutzerkl%C3%A4rung |
| Service list | Services can be added or removed in the service directory. A website scan, the cookie banner, and manual entry are three recognition paths. | https://support.privacybee.io/support/solutions/articles/103000405988-diensterkennung |
| Embed | JavaScript, iFrame, or a link. Static paste is described as not allowed. | https://support.privacybee.io/support/solutions/articles/103000348691-wie-kann-ich-die-datenschutzerkl%C3%A4rung-von-privacybee-in-meine-website-einbinden- and article 103000348698 |
| Cookie banner | Separate script `cookie-banner.js`, documented as the first head script when used. | https://support.privacybee.io/support/solutions/articles/103000392568-wie-kann-ich-privacybee-auf-meiner-website-einbinden- |
| License scope | Generated DSE, imprint, and banner are for the named target domain. The Swiss public page names PrivacyBee AG and incorporates an AVV. | https://www.privacybee.io/de-ch/lizenzbedingungen/ updated 10 June 2026, recorded in comment 5854336548. The earlier non-Swiss URL remains a historical fetch. |

Practical correction that stays inside the documented dashboard, still **not performed** here. Add, keep, or remove a service from actual usage evidence. A scan miss is not evidence of non-use.

1. Keep Vercel and the manually added Supabase entry. PrivacyBee remains the generator’s own listing. Do not add an analytics, statistics, or pixel service. None is evidenced in the repository inventory or in the disabled marketing/product-development flags.
2. Do not remove a manual service entry only because a scan missed it. Public Diensterkennung, article 103000405988, fetched 27 September 2026, says manual entries can persist despite a scan miss. Remove a service only when usage evidence says Jetnity does not use it.
3. Do not enable the cookie banner, and do not add a banner as a service to make sections 8.2 or 8.3 true.
4. If sections 8.2 and 8.3 remain while the evidenced service list has no analytics or pixel, they are boilerplate the service list does not control. Do not invent a service to match them, and do not install analytics to make them true.
5. Keep contact details aligned with section A. Do not let the imprint renderer rename the company to include “EIU” or duplicate the country if the dashboard has fields that can prevent it. If the fields cannot prevent it, that is a vendor-clarification item, not a CSS fix.

### C.3 Narrow vendor question still open

No support message is sent from this preparation.

One question, tied to the observed template: how the supplied German DSGVO text can match a disabled banner, disabled marketing/product-development flags, no Jetnity analytics package, and log evidence that does not support deletion after each session. Adding Supabase did not change those sentences (comment 5854846134).

Do not widen this into a general support checklist. Preview hosts are not added as PrivacyBee domains. The embed spec refuses to load the script off `jetnity.com` without waiting for a vendor answer on that point.

### C.4 What Jetnity will not do to “fix” the template

- No cookie banner.
- No analytics or pixel.
- No CSS hide.
- No static copy of the vendor policy into the repository.
- No Jetnity replacement privacy policy. Section B is not that fix.
- No support message from this writer.

ALB 8.7.1 says unrecognized server-side processing is not a vendor error under the guarantee. That clause is not a reason to publish the contradictory banner and log sentences, and it is not a reason to write a second policy.

---

## D. Decision list

Owners below are proposals for the next review, not assignments this writer can make.

### Recorded, and not reopened here

- Production application of `20260917120000_account_visits` is last recorded as applied: `docs/ACTIVE_WORK_STATUS.md` §3 after #435, the 18 September 2026 checkpoint, and the 27 September 2026 migration-tail note. Class: last recorded as applied; not re-verified by a catalog read in this preparation. The migration header is not proof of non-application.
- `trip_travellers` and the account-registry tables are in the merged V1 export closure, PR #476, recorded in `docs/ACTIVE_WORK_STATUS.md` §4e. That is not a fresh catalog read.
- PrivacyBee continuation at CHF 59.35/year is already approved. This list does not ask for that approval again.
- Supabase service entry, the hosted privacy URL, primary regions, the Vercel Pro plan, and the public Supabase DPA are recorded in Report §2.6. They are not reopened as unknown.
- Operator, address, and both mailboxes stay the Product Owner confirmation in comment 5851390009. The public widget configuration repeats the operator and admin@jetnity.com.
- Dashboard search on 27 September 2026 found no Production `JETNITY_MODELL_AKTIV` entry and no `NEXT_PUBLIC_ALLOW_INDEXING` entry (comment 5854401589). Values were not printed.

### Unresolved

Rows 1, 2, 5, 9, 10, and 11 stay open. Rows 3, 4, 6, 7, 8, 12, and 13 are recorded below and are not the same open questions as before.

| # | Question | Evidence needed | Proposed owner |
| --- | --- | --- | --- |
| 1 | Legal basis for account, trip, guest storage, and admin access, if a Jetnity sentence ever states it | Legal review of the matrix. The selected page does not add that sentence. | Legal, with Product Owner |
| 2 | Retention for Auth, profiles, trips, and `model_usage` | A decision. Log visibility is now bounded in Report §2.7 and is not that decision. The 90-day SQL comment is not a schedule. | Product Owner and Legal |
| 3 | Supabase and Vercel primary regions, public DPAs, and the Vercel Pro plan | Closed at that scope. See “Recorded”. Not all processing locations, and not the exact account-bound DPA version. | — |
| 4 | PrivacyBee public AVV | The Swiss public AVV was retrieved and has a second dialect rendition. That quality issue stays visible. It is not a new broad contract checklist and not an account-bound copy. | — |
| 5 | Template mismatches in C.3 | The narrow vendor question. Not a request to write a replacement policy or to install a banner. | Product Owner and Legal, only if they choose to ask it |
| 6 | Jetnity text beside the widget | Not the selected design. No adjacent replacement policy. | — |
| 7 | Production model flag | Dashboard search found no Production entry. Not a printed value. Do not describe the path as active in Production. | — |
| 8 | Hosted presence of `trip_travellers`, the account registry, and `account_visits` | Not an open presence question. See “Recorded, and not reopened here.” | — |
| 9 | VAT / MWST suffix | Current official extract. SHAB 2020 is not enough. | Product Owner |
| 10 | `/terms` | Separate approved text. PrivacyBee does not supply it. | Product Owner and Legal |
| 11 | Cookie classification of `jetnity_gast` and Auth cookies | Legal classification. The path is not described as active in Production. | Legal |
| 12 | Language | German, as in the secured snippets (`lang="de"`). | — |
| 13 | Indexing of legal pages | Existing indexing gate. Dashboard has no indexing opt-in. Default remains noindex. | — |

Rows 1, 2, 5, 9, 10, and 11 are not answered by silence.
