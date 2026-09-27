# Legal content preparation 1 — Drafts

Date: 27 September 2026
Status: **NOT APPROVED FOR PUBLICATION**
Logical agent: **Jetnity legal content preparation 1**, Generation **1**
Session: `bc-efbd2a0c-d64b-4e37-b054-b7c583cabdac`

This file contains drafts for review. It is not the live privacy policy and not the live imprint. Do not paste it into Production, and do not treat it as legal certification.

Evidence for the facts below is in `docs/LEGAL_CONTENT_PREPARATION_1_REPORT_2026-09-27.md`. Editorial notes and the decision list are separate from the visitor text.

---

## A. Impressum — visitor draft

**NOT APPROVED FOR PUBLICATION**

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
- info@jetnity.ch is the general contact. admin@jetnity.com is the data-protection contact the Product Owner confirmed. Both are included because they were confirmed inputs, not because a template added them.

---

## B. Datenschutzerklärung — Jetnity supplement

**NOT APPROVED FOR PUBLICATION.** This label stays outside the visitor article. Do not publish it as part of the page.

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

Eine Reise ohne Konto beginnt im Speicher deines Browsers. Dort liegt eine aktive Reise. Ältere Entwürfe können in einer Warteschlange liegen. Wenn du dich anmeldest, übernimmt Jetnity die Reise in dein Konto. Der Entwurf im Browser wird gelöscht, sobald das Speichern bestätigt ist. Eine Änderung, die du an der Reise auslöst, sendet sie an Jetnity. Sie bleibt nicht allein dadurch auf deinem Gerät, dass sie dort begonnen hat.

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

- The article above is the default visitor text. It names Supabase and Vercel because those are the operating account store and the recorded host of jetnity.com. It does not state regions, legal bases, or retention periods.
- Google and Apple sign-in exist as buttons. Local `supabase/config.toml` has both providers disabled. Hosted Production flags were not read. That fact stays here, not in the article.
- The registration checkbox is only component state. It is not a stored consent record. That fact stays here.
- Supabase cookie names and lifetimes are not hardcoded in Jetnity. The article therefore does not list them.
- Visit history is described because Production application of `20260917120000_account_visits` is last recorded as applied, including the 27 September 2026 migration-tail note. This preparation did not re-query the catalog.
- There is no analytics package and no mounted cookie banner in the repository. The article states the absence. It does not discuss vendor-template repair.

## B2. Conditional visitor variant — model functions

**NOT APPROVED FOR PUBLICATION.** This label stays outside the variant. The variant is not part of the default article in section B. Publish it only after a fresh Production read shows the model path is on. The last recorded Production state after #435 is not activated. That observation was not repeated here.

# Intelligente Planung und Reisebegleiter

Wenn du die intelligente Planung oder den Reisebegleiter nutzt, sendet Jetnity den Inhalt an OpenAI. Daraus soll ein Reisevorschlag, eine vorgeschlagene Änderung oder eine Antwort auf deine Frage werden.

Für einen Reisevorschlag ist das der Text, den du eingibst, zusammen mit den Planungsregeln von Jetnity.

Eine Änderung kann aus einem Konto oder aus einer Reise im Browser kommen. Zusätzlich zum Änderungstext sendet Jetnity eine gekürzte Reise. Dazu gehören unter anderem Titel, Abreiseort, Daten, Tempo, Interessen, Budgetziel, Währung, Anzahl der Reisenden, der Reisewunsch und die Einträge der Tage mit Titel, Notiz und Uhrzeit. Preise, Anbieter und Buchungslinks gehen nicht mit.

Der Reisebegleiter gilt für eine Reise in deinem Konto. Jetnity sendet deine Frage sowie Namen, Länder und Daten der Etappen. Zu den Reisenden können Wohnsitz, Staatsangehörigkeiten sowie Art, Ausstellungsland und Ablauf eines Dokuments mitgehen. Eine Dokumentnummer geht nicht mit.

Die Anfrage an OpenAI enthält die Einstellung, die Antwort nicht zu speichern. Diese Einstellung beweist nicht, dass bei OpenAI nichts liegen bleibt.

Jetnity speichert in seinem Nutzungsprotokoll keine Kopie deines Textes und keine Kopie der Antwort. Dort stehen die Art des Aufrufs, das Modell, ob es ein Konto oder ein Gast war, ein Hash, Tokenzahlen, Dauer und Kosten. Bei einem Konto entsteht der Hash aus der Kontokennung. Bei einem Gast entsteht er aus dem Cookie `jetnity_gast`.

Dieses Cookie liest oder setzt Jetnity, wenn der Nutzungsrahmen geprüft wird, noch bevor das Ergebnis dieser Prüfung feststeht. Das gilt auch, wenn du angemeldet bist, und auch wenn noch keine Antwort vorliegt. Es enthält eine zufällige Kennung, ist für Skripte im Browser nicht lesbar und gilt 30 Tage. Es dient der Begrenzung der Nutzung, nicht der Reichweitenmessung. Ist die Funktion ausgeschaltet, setzt dieser Weg das Cookie nicht und sendet den Text nicht an OpenAI.

### Editorial notes for section B2 — not visitor text

- The save-setting sentence refers to the request field `store: false` in `lib/modell/anfrage.ts`. It is a request setting, not proof of zero provider retention.
- The cookie step runs only when the quota client exists. A missing client returns before the cookie is written. That detail stays here.
- Section B does not mention OpenAI or this cookie, because the last recorded Production state is not activated. Putting this variant into the default article would promote a repository path to a current Production claim.

---

## C. Vendor correction brief

Audience: Product Owner and Technical Lead. Not visitor copy. No support ticket and no account change was made while writing this brief.

### C.1 What was actually seen

This writer did **not** read the original screenshots and does **not** have a full export of the generated policy. The findings below are the Technical Lead’s written observations in #577 comment [5851278348](https://github.com/Jetnity/jetnity/issues/577#issuecomment-5851278348), dated 27 September 2026:

- Named services in the preview: Vercel (necessary) and PrivacyBee.
- Section 8.2 asserts a cookie banner and analysis/statistics cookies.
- Section 8.3 includes tracking-pixel and email-tracking boilerplate.
- Section 8.1 asserts logs are deleted after each session and cannot be assigned to a person.
- The Vercel section describes the platform in general. It is not a Jetnity processing inventory.

Those four assertions are **not** true of the Jetnity repository and are **not** established for Jetnity hosting. Do not install a banner or a tracker to make them true. Do not hide the paragraphs with CSS or by rewriting the DOM.

Imprint preview notes in comments 5851322020 and 5851342372: the vendor rendering appended “EIU” to the company name, and “Schweiz” appeared twice. The visitor draft in section A is the correction to compare against. It is not yet entered in the vendor account.

### C.2 What public vendor documentation says can be changed

Fetched read-only on 27 September 2026:

| Need | Public vendor statement | URL |
| --- | --- | --- |
| Edit the generated sentences | Not provided in the dashboard. Manual edits could be overwritten. | https://support.privacybee.io/support/solutions/articles/103000348697-kann-ich-den-generierten-datenschutztext-selbst-bearbeiten-oder-eigene-passagen-hinzuf%C3%BCgen- |
| Same point, shorter table | “Der Datenschutztext selbst — Nein.” Services, contact details, and colors can be changed. CSS is described as appearance, not content. | https://support.privacybee.io/support/solutions/articles/103000397885-anpassungen-datenschutzerkl%C3%A4rung |
| Service list | Services can be added or removed in the service directory. A website scan, the cookie banner, and manual entry are three recognition paths. | https://support.privacybee.io/support/solutions/articles/103000405988-diensterkennung |
| Embed | JavaScript, iFrame, or a link. Static paste is described as not allowed. | https://support.privacybee.io/support/solutions/articles/103000348691-wie-kann-ich-die-datenschutzerkl%C3%A4rung-von-privacybee-in-meine-website-einbinden- and article 103000348698 |
| Cookie banner | Separate script `cookie-banner.js`, documented as the first head script when used. | https://support.privacybee.io/support/solutions/articles/103000392568-wie-kann-ich-privacybee-auf-meiner-website-einbinden- |
| License scope | Generated DSE, imprint, and banner are for the named target domain. Unusual and server-side processing is outside the crawler. The public text does not warrant completeness. | https://www.privacybee.io/lizenzbedingungen/ sections 2.2, 4.1–4.4, 5.2, 8.7.1. Page last updated 10 June 2026. |

Practical correction that stays inside the documented dashboard, still **not performed** here. Add, keep, or remove a service from actual usage evidence. A scan miss is not evidence of non-use.

1. Keep Vercel. It is the recorded host of jetnity.com. The recorded preview named only Vercel and PrivacyBee. PrivacyBee’s own listing is the vendor that generated the preview. It is not proof that the widget runs on the site. Do not add an analytics, statistics, or pixel service. None is evidenced in that preview or in the repository inventory.
2. Do not remove a manual service entry only because a scan missed it. Public Diensterkennung, article 103000405988, fetched 27 September 2026, says manual entries can persist despite a scan miss. Remove a service only when usage evidence says Jetnity does not use it.
3. Do not enable the cookie banner, and do not add a banner as a service to make sections 8.2 or 8.3 true.
4. If sections 8.2 and 8.3 remain while the evidenced service list has no analytics or pixel, they are boilerplate the service list does not control. Do not invent a service to match them, and do not install analytics to make them true.
5. Keep contact details aligned with section A. Do not let the imprint renderer rename the company to include “EIU” or duplicate the country if the dashboard has fields that can prevent it. If the fields cannot prevent it, that is a vendor-clarification item, not a CSS fix.

### C.3 What needs vendor clarification before publication

Ask only in a later, authorized step. This task forbids sending support mail or changing the account.

1. Can sections 8.1, 8.2, and 8.3 be changed through a supported vendor control when Jetnity has no banner, no evidenced analytics cookies, and no verified log-deletion policy? If that control does not change the sentence, keep the widget off. Placing Jetnity text beside the widget does not repair those paragraphs. Report §4.2 is the same rule.
2. ALB 4.4 governs the generated vendor content. The quoted text does not itself forbid independently written Jetnity text next to the widget. Whether the vendor objects to that layout is an inference and needs clarification before a live widget. It is not an established prohibition, and it is not a blocker for a static, widget-off Preview specification. Licensed-widget testing and local fixture testing stay separate. Report §4.6.
3. Does the widget execute only on the licensed host `jetnity.com`, or also on any site that copies the snippet? Preview hosts must not be added as domains until that answer exists.
4. Account-specific AVV, TOM, and TIA were not in the evidence read here. Public ALB says server locations are in the processor agreement. That agreement was not fetched from the account.
5. The public license page title says “PrivacyBee Deutschland” while the body says PrivacyBee AG. The Swiss account choice stays the Product Owner decision of 30 August 2026. This page does not prove which contracting entity the jetnity.com subscription uses.

### C.4 What Jetnity will not do to “fix” the template

- No cookie banner.
- No analytics or pixel.
- No CSS hide.
- No static copy of the vendor policy into the repository as if it were Jetnity’s text.
- No support message from this writer.

The Jetnity supplement in section B states account, trip, guest, and admin processing the crawler cannot see. That supplement does not correct a false vendor paragraph. If sections 8.1–8.3 stay false, the widget stays off. ALB 8.7.1 says unrecognized server-side processing is not a vendor error under the guarantee. That clause is not a reason to publish the contradictory paragraphs.

---

## D. Decision list

Owners below are proposals for the next review, not assignments this writer can make.

### Recorded, and not reopened here

- Production application of `20260917120000_account_visits` is last recorded as applied: `docs/ACTIVE_WORK_STATUS.md` §3 after #435, the 18 September 2026 checkpoint, and the 27 September 2026 migration-tail note. Class: last recorded as applied; not re-verified by a catalog read in this preparation. The migration header is not proof of non-application.
- `trip_travellers` and the account-registry tables are in the merged V1 export closure, PR #476, recorded in `docs/ACTIVE_WORK_STATUS.md` §4e. That is not a fresh catalog read.
- PrivacyBee continuation at CHF 59.35/year is already approved. This list does not ask for that approval again.
- Assistant migration `20260917090000_modell_reisebegleiter` is last recorded as not applied on Production, with no Production model activation. A fresh flag read is still decision 7. The recorded closure itself is not rewritten as unknown.

### Unresolved

Rows 1–7 and 9–13 are unresolved. Row 8 keeps the reviewed number and records a closure. It is not an open question.

| # | Question | Evidence needed | Proposed owner |
| --- | --- | --- | --- |
| 1 | Legal basis for account, trip, guest storage, and admin access | Legal review of the matrix | Legal, with Product Owner |
| 2 | Retention for Auth, profiles, trips, `model_usage`, and host logs | Decision plus, for logs, vendor documentation. The 90-day SQL comment is not a schedule. | Product Owner and Legal |
| 3 | Supabase and Vercel regions and transfer tool | Account DPA / region settings, read without copying secrets | Product Owner, then Legal |
| 4 | PrivacyBee AVV, TOM, TIA, contracting entity | Account copies. Public ALB is not that copy. | Product Owner |
| 5 | Whether the vendor widget may ship before sections 8.1–8.3 are gone or corrected | Vendor answer in C.3, then Legal | Product Owner and Legal |
| 6 | Whether the vendor objects to independent Jetnity text beside a live widget | Clarification only if a live widget is proposed. ALB 4.4’s quoted text is not itself that prohibition. Not a blocker for a static, widget-off Preview specification. | Legal |
| 7 | Production model flag | Read of `JETNITY_MODELL_AKTIV` without printing the API key. Last recorded state is not activated. This read is still required before a published sentence says the path is currently on or off. | Technical Lead |
| 8 | Hosted presence of `trip_travellers`, the account registry, and `account_visits` | Not an open presence question. See “Recorded, and not reopened here.” A newer catalog observation is required only if a later slice needs a date after 27 September 2026. | — |
| 9 | VAT / MWST suffix | Current official extract. SHAB 2020 is not enough. | Product Owner |
| 10 | `/terms` | Separate approved text. PrivacyBee does not supply it. | Product Owner and Legal |
| 11 | Cookie classification of `jetnity_gast` and Auth cookies | Legal classification after the model flag is known | Legal |
| 12 | Language | German only, unless Legal asks for more | Product Owner |
| 13 | Indexing of legal pages | Existing indexing gate. Default remains noindex. | Product Owner, later |

Rows 1–7 and 9–13 are not answered by silence. Row 8 records a closure. It does not ask for a new catalog read.
