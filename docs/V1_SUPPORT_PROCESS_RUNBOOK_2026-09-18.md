# Jetnity – V1 Support Process Runbook

Stand: 18. September 2026  
Status: **DOCS-ONLY SUPPORT OPERATIONS / NO TICKET SYSTEM / NO SLA / NO PRODUCTION SUPPORT TOOLING**

Issue: #467  
Draft PR: #470  
Source audit: #438 / merged PR #449 / finding 4.1 **process half**  
Binding task: `docs/V1_SUPPORT_PROCESS_1_TASK_2026-09-18.md`  
Release gate: `docs/JETNITY_V1_RELEASE_READINESS_GATE_2026-09-01.md` §M  
Escalation dependency: `docs/V1_INCIDENT_PROCESS_RUNBOOK_2026-09-18.md` (merged PR #464)

This document is the canonical support-operations runbook for **today**. It describes how an authorized operator handles mail that already reaches the public `info@jetnity.ch` address, using mechanisms Jetnity already has.

It does **not** create a ticket system. It does **not** configure a mailbox provider. It does **not** authorize user contact beyond answering mail that a person already sent. It does **not** invent 24/7 coverage, an SLA, dedicated support staff, a legal desk, automated error correlation or Production support tooling.

---

## 0. What this document is and is not

### 0.1 This slice closes

The **process half** of audit finding 4.1 and the “Support-Kanal und Zuständigkeit definiert” / “keine Support-Funktion benötigt unkontrollierten direkten Production-DB-Zugriff” part of release-gate §M.

An authorized operator should be able to answer:

- what the current public contact channel actually is;
- what it cannot do today;
- how incoming mail is classified;
- what minimum facts may be requested;
- which secrets and sensitive data must never be requested or stored in ordinary email;
- who owns triage versus externally binding replies;
- when to escalate into the merged incident runbook;
- how to close a request without inventing a resolution that Jetnity cannot perform.

### 0.2 This slice does not close

- mailbox / SMTP / provider configuration or a proven live monitoring rota;
- a ticket queue, helpdesk vendor, chatbot or in-product support form;
- a runtime support, help, FAQ or contact page;
- surfacing `info@jetnity.ch` on auth forms (error surfaces now include the factual mailto);
- operator-side `Fehler-ID` correlation (finding 4.3 correlation/tooling half, still open under 5.5);
- user-facing incident / status communication (finding 4.5);
- data export / DSAR fulfillment (finding 2.1);
- account erasure (finding 2.2);
- consumer MFA recovery (finding 3.4 consumer half);
- legal text, privacy notice, terms, controller identity or statutory deadlines;
- Production Auth / RLS / data mutation as a support action;
- any invented response time.

Unknown or unavailable remains unknown or unavailable. It is never PASS.

### 0.3 Related procedures, not substitutes

| Situation | Canonical document |
| --- | --- |
| Production outage, security/privacy leak, Auth/AAL/RLS doubt, data-loss, paid-path anomaly, provider/official-truth degradation | `docs/V1_INCIDENT_PROCESS_RUNBOOK_2026-09-18.md` |
| Jetnity **application admin** lost a verified TOTP factor, no compromise suspected | `docs/V1_ADMIN_MFA_LOSS_RECOVERY_RUNBOOK_2026-09-18.md` |
| Legal-content inputs, controller identity, data-rights wording | `docs/AP6A_GATE0_LEGAL_CONTENT_INPUT_CONTRACT_2026-08-29.md` — Product Owner + Legal. This runbook must not write legal text. |

Admin MFA recovery does **not** recover consumer MFA. The incident runbook does **not** become a support SLA by being named here.

---

## 1. Current support entry point

Verified against current `main` / this branch at implementation. Stale audit line numbers were not copied as current evidence.

### 1.1 VERIFIED CURRENT CHANNEL

| Fact | Current truth |
| --- | --- |
| Public address | `info@jetnity.ch` |
| Product surface | Footer `mailto:info@jetnity.ch` in `components/layout/Footer.tsx`, plus the same factual mailto on the public, account and admin error boundaries. Current Footer has **no** “Kontakt” heading; the address sits under the product sentence. |
| Where the Footer renders | Public layout `app/(public)/layout.tsx` and account layout `app/account/layout.tsx`. |
| Where it does not render | Admin layouts outside the admin error boundary. Auth forms. |
| Other product entry points | None. No `app/support`, `help`, `hilfe`, `kontakt`, `contact` or `faq` route. Public navigation (`lib/auth/oeffentliche-navigation.ts`) is only Entdecken / Meine Reisen / Jetnity Pro. |
| In-product ticket / form / chat | None. |
| Helpdesk / Freshdesk / Intercom / Zendesk SDK | Absent from `package.json`. |
| Legal / privacy / terms pages | No `app/(public)/privacy` or `app/(public)/terms` runtime page. `/impressum` and `/datenschutz` are also absent. Register may still link those routes; the pages 404. |
| What the address is proven to be | A displayed footer contact. |
| What the address is **not** proven to be | A responsible controller, a Datenschutzkontakt, a contractual business mailbox, or a monitored inbox with a known owner. See `docs/AP6A_GATE0_LEGAL_CONTENT_INPUT_CONTRACT_2026-08-29.md` row 4 and DECISIONS.md ADR-style legal-input rule. |

`lib/legal/ap6a-gate0-legal-foundation-inventory.test.ts` only locks that the Footer source contains `mailto:info@jetnity.ch`. It does not prove mailbox ownership, delivery or reply.

### 1.2 CURRENT LIMITATION / UNKNOWN

The following are **absent**. Do not imply them in a reply, chat, status or later continuity note:

- dedicated support staff or a support rota;
- 24/7 coverage or a promised first-response / resolution window;
- a ticket identifier, queue, priority engine or customer portal;
- automatic mailbox monitoring or paging when mail arrives;
- a documented named human who currently reads `info@jetnity.ch` (repository evidence: **unknown**);
- operator-side search of `Fehler-ID` / Next.js `digest` against host logs;
- a status page or in-product incident banner;
- self-service data export or account deletion;
- consumer MFA backup codes, phone MFA, WebAuthn or lockout recovery;
- Jetnity-taken payments or a live payment provider;
- a legal desk or approved privacy/terms text.

A mailbox that was not opened is **unknown**, not “no requests”. A request that was not answered is **unanswered**, not “resolved by silence”.

---

## 2. Roles and ownership

These are responsibilities, not a staffing plan. Jetnity has no dedicated support team.

| Role | Responsibility for support |
| --- | --- |
| **Product Owner** | Owns the public contact channel as a product fact. Decides who may read or send from `info@jetnity.ch`. Owns every externally binding reply, user-facing promise, legal/data-rights classification, vendor/user outreach beyond answering incoming mail, and every special gate listed in §10. This document does **not** prove that the Product Owner currently monitors the inbox on any cadence. |
| **Technical Lead** | Owns technical triage once mail is seen: category, known vs unknown, whether the case is an incident, and whether a later bounded engineering slice is needed. ChatGPT / Technical Lead is this role under `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`. |
| **Mailbox operator** | The human who already has authorized access to the `info@jetnity.ch` mailbox. Opening mail is a live action. This document does not grant that access and does not name a person. |
| **Bounded implementation agent** | Only if explicitly dispatched on a versioned task. Never Ready. Never merge. Never replies to users. Never mutates Production/Auth/secrets unless that later slice is separately gated. |
| **Guardian / read-only challenger** | Challenge and evidence only, when risk warrants. Not a support agent. Not Ready/Merge. |

If the only available person is the Product Owner, that person may read mail **and** still must not skip a special gate that applies to the next action.

Cursor agents, Guardian and this runbook **do not** become an on-call or support rota by being named here.

### 2.1 What “ownership” means today

1. **Channel ownership** — Product Owner: whether this address remains the public contact, who may use it, and whether a later vendor/mailbox change is approved.
2. **Case ownership after intake** — Technical Lead for product/technical truth; Product Owner for legal, commercial, user-promise and special-gate actions.
3. **Inbox monitoring** — **unknown** until the Product Owner records a named operator. Do not invent “we read this daily”.
4. **Response time** — no SLA. Best-effort only after a human actually opens the mail. If a user asks when they will hear back, say that Jetnity has no promised response time.

---

## 3. Intake categories

Classify every inbound message into **one primary** category. Add a secondary only when evidence requires it. If unclear, keep **unknown** and ask the minimum next fact.

| Category | Typical user wording | What Jetnity can do today | Default owner after intake |
| --- | --- | --- | --- |
| **account/auth** | Cannot sign in, confirm email, reset password, MFA prompt, session/logout | Point to existing self-service where it exists (`LoginForm` `resetPasswordForEmail` → `/auth/update-password`; `/account/security` for signed-in password/MFA). Do not reset credentials by support email. Consumer MFA loss has **no** recovery runbook. Admin TOTP loss uses the admin MFA runbook, not this process. Finding 3.8 (project-wide mail ceiling) may make confirmation/reset mail fail; that is a launch blocker, not a support workaround. | Technical Lead; Product Owner if any Auth/MFA/AAL change is requested |
| **trip/traveller** | Missing trip, cannot edit, traveller/document confusion, readiness/visa question | Help the user find `/reisen` or the account trip list if the session works. Distinguish empty, denied and error. Do not invent visa, transit, health, carrier or document rules. Do not collapse multiple citizenships/documents to one passport. Guest localStorage is not account truth. | Technical Lead |
| **product/UX** | Layout, copy, “how do I plan a trip”, navigation | Product clarification only. No promise of a fix date. File a later bounded issue if a real defect is confirmed. | Technical Lead; Product Owner for product-direction changes |
| **provider/commercial truth** | Flight/hotel/activity price, “book this”, affiliate link, official entry result | Production provider search is hard-off (`VERCEL_ENV=production`). Factories for hotel/activity/mobility/rental/requirements/safety/seasonal are `null`. `booking_url` is forced null. User-marked bookings are `bookingSource: 'user'`, not provider confirmation. Official Truth stays `unknown` when evidence is missing. Do not invent availability, price or `not_required`. | Technical Lead; escalate to incident runbook if official-truth or live-provider harm is possible |
| **security/privacy** | Stolen account, leaked data, unexpected disclosure, suspicious admin | Treat as an incident immediately. Do not request secrets to “verify”. Do not paste payloads into the mailbox thread. | Technical Lead coordinates via incident runbook; Product Owner before any external notice |
| **data-rights/legal request** | Access, export, deletion, rectification, objection, “GDPR/DSG request”, press/authority | Jetnity has **no** consumer export or identity-deletion path. Sub-object delete (trip / trip-traveller / registry traveller) is not account erasure. Archive is not deletion. Do not fulfill from Production by ad-hoc dump. Do not write legal text or a statutory deadline. | Product Owner + Legal. Technical Lead may record **internal** facts only: request class, environment, whether trips/travellers are involved (yes/no/unknown — no raw values) |
| **billing/payment confusion** | Charge, invoice, refund, “I paid Jetnity” | No payment-provider SDK, no checkout, no webhook receiver. Admin `/admin/payments` is a local ledger of leftover/test rows, not user billing. Honest reply: Jetnity does not currently take card/provider payments. If the user paid a **third party** (airline, hotel, OTA), that party is the merchant — Jetnity cannot refund them. | Technical Lead for product truth; Product Owner if any money-movement or refund promise is requested |
| **outage/incident** | Site down, 5xx, “nothing loads”, quoted `Fehler-ID` during a wider failure | Escalate to the incident runbook. Support does not declare Production healthy from a single READY badge or from “no other mails”. | Technical Lead via incident runbook |

When a message spans categories, do not hide the higher-risk one. Security / data-rights / outage outrank UX.

---

## 4. Minimum information to request

Ask only what is needed to classify and to avoid acting on the wrong account or trip. Prefer facts the user already volunteered.

### 4.1 Always allowed, if missing

- the user’s own contact email, if different from the From: header;
- whether they are signed in, and whether they can still open `/reisen` or `/account`;
- UTC date/time and timezone of the problem, plus browser / device / OS **class** (for example “iPhone Safari”), not a full fingerprint;
- the URL path they were on (`/`, `/reisen`, `/account/security`, …);
- a short description of what they tried and what they saw;
- whether this is about one trip or the whole account.

### 4.2 Allowed only when the category needs it

| Category | Extra minimum |
| --- | --- |
| account/auth | Whether confirmation or reset mail arrived; whether MFA is enrolled; **not** the code. |
| trip/traveller | Trip title or trip URL if they can see it; number of travellers **as a count**, not document data; which fact is missing (dates, destination, traveller list). |
| product/UX | Viewport class (phone/desktop) and the control they could not use. |
| provider/commercial | Which domain (flight/hotel/activity/readiness) and that Production search is expected to be unavailable today. |
| security/privacy | Environment if known; whether secrets were pasted anywhere. Then stop collecting and escalate. |
| data-rights/legal | Request class (access / deletion / other) and whether they can sign in. No extra identity documents by email. |
| billing/payment | Merchant name and last four of a statement **only if the user already offered them**; Jetnity still cannot refund a third party. |
| outage/incident | Approximate start time; whether more than one person/device is affected; `Fehler-ID` if already shown. |

### 4.3 Do not collect “to be complete”

- extra citizenships, passport numbers, MRZ, scans, visas, health or biometric data;
- full trip graphs, passenger lists, or other travellers’ emails;
- session tokens, cookies, passwords, OTP/TOTP, recovery codes (none exist in-product);
- service-role keys, connection strings, Vercel/Supabase dashboard secrets;
- raw mailbox exports or other users’ mail;
- screenshots that contain any of the above.

Traveller-context rule: if the question depends on citizenship, document, residence or route, do **not** ask for a “primary” passport. Ask which **option** they want evaluated, or record `unknown`. Do not invent official results to close the ticket.

Do **not** collect government ID, passport, OTP, password or other secrets “to verify” that the sender controls a Jetnity account. Ordinary email is not an identity-proofing channel (§11.1).

---

## 5. Forbidden requests and redaction

Never request, accept as a required field, or store in the support record:

- password;
- OTP / email code / SMS code;
- TOTP seed, authenticator QR, secret URI or backup/recovery codes;
- access token, refresh token, session cookie, `sb-` cookie dump;
- service-role key, anon key from a private env, database URL, webhook secret;
- passport / ID number / government ID, MRZ, biometric template, health or vaccination data;
- payment-card PAN, CVV, full statement, or any of the above “for verification” by ordinary email.

If the user sends any of those anyway:

1. Do not copy them into GitHub, chat, STATUS, incident records or another mailbox.
2. Redact the working copy immediately.
3. Tell the user to rotate the credential if a secret was exposed, without repeating the secret.
4. If a Jetnity secret or session may have leaked, escalate to the incident runbook §8.1.
5. Do not ask them to resend the same secret “so we have a clean copy”.

Ordinary email is not a safe channel for those classes. There is no Jetnity secure-upload support tool.

---

## 6. Screenshots and Fehler-ID

### 6.1 Screenshots

Request a screenshot only when the words cannot distinguish empty vs error vs a specific control.

Rules:

- ask the user to hide emails of other people, tokens, cookies, MFA QR, document photos and payment details first;
- if a screenshot still contains secrets or document data, do not file it; ask for a redacted crop;
- store only what is needed to understand the symptom;
- a screenshot is not Production evidence of Auth, RLS or provider truth.

### 6.2 Fehler-ID

Public, account and admin error boundaries show `Fehler-ID` via `oeffentlicheFehlerId` (`lib/next/oeffentliche-fehler-id.ts`: Next.js `digest` if present, otherwise a render-stable `useId` fallback). They also include a factual `mailto:info@jetnity.ch` and tell the user they may include the shown ID. The mailto is not prefilled with user, account, URL or error details.

The identifier **may** be supplied as context. Current Jetnity has **no** operator-side automatic Fehler-ID correlation (no error-tracking vendor; public errors log only `console.error('[PublicRouteError]', error)` in the **user browser**).

Therefore:

- do not tell the user “we can look this ID up”;
- do not treat a quoted ID as proof of a server incident;
- do not treat a missing ID as proof that nothing happened;
- if the ID is quoted during a possible outage, pass it into the incident record as an unresolvable user-visible reference.

Finding 4.3 is **user-facing/process half closed**. The correlation/tooling half remains **open under 5.5**. Do not mark 5.5 tooling PASS.

---

## 7. First-response triage

Fail closed. Work this order when mail is actually opened.

1. **Safety / security / sensitive data** — if the mail contains secrets or sensitive traveller/document data, redact first (§5). If compromise or disclosure is alleged, go to the incident runbook. Do not continue as normal product support.
2. **Legal / data-rights** — do not answer with invented law. Hand to Product Owner + Legal. Technical Lead records the class only.
3. **Outage / class failure** — more than one user, Production unusable, Auth down, or official-truth harm → incident runbook. Do not “reassure” from a Preview badge.
4. **Auth / account lockout** — point to existing self-service. Do not offer to change password, delete factors, or disable MFA by email. Admin TOTP loss: admin MFA runbook, Product-Owner Auth gate still required for live `deleteFactor`.
5. **Trip / traveller / official truth** — preserve `unknown`. No visa/carrier invention. No single-passport shortcut.
6. **Billing confusion** — state that Jetnity does not take payments today. Do not issue refunds.
7. **Product / UX** — explain current product behaviour. No invented roadmap date.

If the mailbox was not opened for an unknown period, record **detection delay unknown**. Do not claim instant awareness.

---

## 8. Category playbooks

Every branch starts with §7. Record known vs unknown. STOP if the next step crosses §10 without approval.

### 8.1 account/auth

1. Confirm they are talking about a Jetnity **application** login, not a Supabase platform login. That is a product-domain check, not an account-existence disclosure.
2. Existing self-service — describe it **generically**. Do not confirm or deny that a Jetnity account exists for the From: address or any other address (§11.1):
   - registration confirmation and password reset are email-only (`enable_confirmations = true`; `resetPasswordForEmail` on the login form);
   - signed-in password change is on `/account/security` with reauthentication;
   - scoped logout exists on `/account/security`; other sessions are `unsupported` to list;
   - verified MFA unenroll requires AAL2 step-up. A user without the authenticator cannot self-clear.
3. Do **not**: send them a new password; ask for the current password, OTP, government ID or passport “to verify”; enroll or delete factors; change `profiles.status` / role as a “support unlock”; use `ADMIN_ALLOWED_EMAILS` break-glass for a consumer; tell them that an account exists, does not exist, is locked, banned, pending or MFA-enrolled.
4. Honest limits: transactional mail may fail because Jetnity has no own SMTP and the Auth project is documented with a low built-in mail ceiling (finding 3.8). If they never received confirmation/reset mail, say that this path is currently fragile and is a known launch blocker — not that support can bypass Auth.
5. Consumer MFA loss: no in-product recovery. Do not apply the admin MFA runbook. A later Product-Owner-gated Auth slice would be required to add backup codes or a second factor. Until then the truthful answer is that Jetnity cannot restore that factor by email.

### 8.2 trip/traveller

1. If they can sign in, ask them to open `/reisen` and the specific trip. Empty list after a successful read is “no trips visible”, not “the database is empty”. A failed read is an error (`lese()` / `problemAus()`). Do not collapse those states.
2. Guest trips live in localStorage (`jetnity:reise:v3`). They are not account rows. Do not “restore” them by writing Production data from a screenshot.
3. Traveller / readiness questions: Route Truth stays traveller-neutral. Evaluate per traveller and per credential option. Missing official evidence → `unknown`. Do not ask for passport images.
4. Trip delete / archive: owner-scoped trip delete and archive exist; archive is not erasure. Account deletion does not exist.

### 8.3 product/UX

1. Explain the current product: trip idea → structured trip → workspace. Do not promise Creator Hub, social, or live booking.
2. Confirmed defects become a later bounded issue. This runbook does not start that slice.

### 8.4 provider/commercial truth

1. Tell the user the current product truth: Production commercial search is off; no live booking handover; user-marked booked items are not provider confirmation.
2. Do not quote or invent prices, seats, visa results or affiliate links.
3. If a Preview/Development test provider path may have shown a real offer, still do not book or contact the vendor from support.
4. Official-truth or leaked live-token suspicion → incident runbook §8.5.

### 8.5 security/privacy

1. Stop ordinary support collection.
2. Open an incident. Use incident runbook §8.1 / §8.2.
3. Product Owner decides any user-facing or authority-facing statement. This runbook contains no breach-notification language.

### 8.6 data-rights/legal request

1. Classify: access / export / deletion / rectification / other / unknown.
2. Do not promise fulfillment, a deadline, or that `info@jetnity.ch` is the proven controller contact.
3. Do not run ad-hoc Production SELECT dumps into email. That is uncontrolled Production data access (§11).
4. Do **not** verify the requester’s identity by ordinary email, government ID, passport, OTP or password. Identity verification for data-rights / deletion / export remains Product Owner + Legal, or a later approved secure process. This runbook has no such process.
5. Persist an **internal** note only: UTC received, request class, known/unknown, **no** raw documents, **no** user-facing existence/status statement.
6. Product Owner + Legal decide the response. Technical Lead may later scope a gated export or deletion slice; this process does not start it.

### 8.7 billing/payment confusion

1. Current truth: no Stripe/PayPal/Adyen (or equivalent) in `package.json`; no checkout; admin refund writes only a local `refunds` row and must not be described as a provider refund (`ADMIN_EHRLICHE_TEXTE` on the payments page).
2. If they were charged by an airline, hotel or OTA, they must contact that merchant.
3. Do not change leftover `payments` rows to “help” a consumer.

### 8.8 outage/incident

1. Escalate. Do not run a parallel amateur incident process in the mailbox.
2. Internal support handoff to the incident coordinator: environment if known, user-visible symptom, what may be said (`unknown` if unknown), quoted `Fehler-ID` if any, and that the ID is not operator-resolvable.
3. User-facing outage copy is a Product-Owner decision. There is no status page (finding 4.5).

---

## 9. Escalation to the incident runbook

Escalate **immediately** when the mail is, or may be:

- Production unusable for the core trip/account journey;
- security, privacy, secret or session exposure;
- Auth / MFA / AAL / RLS / ownership failure beyond a single confused user;
- data loss or integrity doubt;
- paid-path / quota anomaly;
- official-truth invention or live-provider harm;
- a single-user report that is a plausible class risk.

How:

1. Keep the mailbox thread free of secrets.
2. Open or update an incident record as required by `docs/V1_INCIDENT_PROCESS_RUNBOOK_2026-09-18.md` §11.
3. Technical Lead coordinates severity and containment with **existing** controls only.
4. Support does not invent containment, enable flags, or contact vendors.
5. After incident closure, any user reply still follows §12 of this runbook: known / unknown, no invented SLA.

Do **not** escalate ordinary UX copy, a single guest-trip misunderstanding, or a billing question that is already answered by “Jetnity does not take payments”.

---

## 10. Product Owner / Technical Lead boundaries

| Action | Who |
| --- | --- |
| Classify product/technical symptom; say what the current code does | Technical Lead |
| Say `unknown` when evidence is missing | Technical Lead (mandatory) |
| Escalate to incident process | Technical Lead |
| Dispatch a later bounded engineering slice | Technical Lead, new versioned task |
| Ready / merge | Technical Lead only. Agents never. |
| Who may read or send as `info@jetnity.ch` | Product Owner |
| Any reply that promises a date, refund, legal outcome, deletion, export, or compliance | Product Owner |
| Legal / data-rights wording; controller; statutory notice | Product Owner + Legal |
| Production migration, restore, destructive data change | Product Owner special gate |
| Auth / Session / MFA / AAL / factor deletion | Product Owner special gate (admin MFA runbook describes, does not execute) |
| Large RLS / ownership / identity change | Product Owner special gate |
| Store or export passport / MRZ / biometric / health data | Product Owner special gate |
| Provider contract, Production secret, paid call, live provider activation | Product Owner special gate |
| Payments / money movement | Product Owner special gate |
| New recurring cost (helpdesk, mailbox vendor, error tracking) | Product Owner special gate |
| Public launch, indexing, user-facing status page | Product Owner special gate |

Technical-Lead merge autonomy does **not** lift these gates. Answering support mail does not lift them either.

---

## 11. No uncontrolled Production database access

Support is not a reason to open the Production SQL editor, service-role client, or Auth Admin API.

| Allowed today | Forbidden as “support” |
| --- | --- |
| Read the user’s words and any redacted screenshot they sent | Production `SELECT` of trips, travellers, documents, `auth.users`, or `profiles` into email |
| If already an authorized admin **and** AAL2 **and** `konten-verwalten`: look at `/admin/users` for `user_id`, email, display_name, role, status, created_at, last_seen_at — **internal technical triage only**. Never paste the row, and never turn the lookup into a user-facing existence or status statement (§11.1) | Dumping the admin table, changing role/status to “unblock”, using break-glass as support, or confirming/denying that an account exists |
| Existing owner-scoped self-service the signed-in user can run themselves | Service-role writes, RLS bypass, factor delete, password set, identity delete |
| Read-only host logs **after** incident escalation, by an operator who already has that access | New Production query “to be helpful” |

`/admin/users` is a datensparse admin surface, not a support console and not a disclosure source. Empty vs error must stay distinct. Break-glass does not reach the database.

If a next step would require a Production dump to “identify” the sender, record **unknown**, do not disclose existence/status, and STOP for Product Owner.

### 11.1 Ordinary email is not an account-existence oracle

A normal email to `info@jetnity.ch` does **not** prove that the sender controls the Jetnity account whose address they mention. Jetnity currently has **no** approved secure support identity-verification channel.

Therefore:

- support may **not confirm or deny** whether a Jetnity account exists based only on a normal email request;
- support may **not disclose** account status (active / pending / disabled / banned / MFA-enrolled / last-seen) to the sender from `/admin/users` or any other lookup;
- `/admin/users` remains **internal technical triage only** for an already-authorized AAL2 admin with `konten-verwalten`;
- any user-facing reply about existence or status must stay generic unless identity has been independently established through an **approved secure mechanism**;
- because no such dedicated mechanism exists today, the default is **do not disclose account existence or status**;
- do not invent an email challenge, magic link, or “reply from the account address” as proof — From: headers are forgeable and mailbox compromise is out of band;
- do not ask for government ID, passport, OTP, password or other secrets to “verify” the person;
- data-rights / deletion / export identity verification remains Product Owner + Legal, or a later approved process — not ad-hoc email verification.

Generic, existence-neutral replies remain allowed: how the public login reset path works, that Jetnity does not take payments, that export/deletion are not built, that a `Fehler-ID` cannot be looked up. Those statements do not say whether **this** sender has an account.

---

## 12. Known / unknown and honest replies

Honesty rules:

1. State what is **known** from current repository or independently verified live evidence.
2. State what is **unknown** (inbox not monitored, ID not correlatable, Production Auth config not re-read, legal role of the address not approved).
3. Do not fill gaps with reassurance, invented policy, or “we are looking it up in the system”.
4. Do not claim DSGVO/CH-DSG conformity, a privacy notice, or that a request has been fulfilled when no fulfillment path exists.
5. Do not claim a response SLA, 24/7, or dedicated staff.
6. Do not confirm or deny account existence or status from ordinary email (§11.1).
7. German product UI may receive a German reply; that is language matching, not a legal translation.

Suggested internal shape of a user reply (Product Owner sends anything externally binding):

- thank them for writing to `info@jetnity.ch`;
- restate the understood category in one sentence;
- say what Jetnity can do **today**, in generic product language;
- say what is unknown or not built;
- do not attach a ticket number (none exists);
- do not quote secrets, document data, or `/admin/users` facts back;
- do not say “we found / did not find your account”.

If nobody can answer yet, it is better that the thread stay unanswered than that an agent invents a closing.

---

## 13. Closure and evidence

A support case may close only when **all** of the following are true:

1. The category is recorded (or explicitly `unknown` and no further safe question exists).
2. Secrets/sensitive data were redacted if they appeared.
3. Any incident/legal/special-gate path was opened or explicitly recorded as not applicable.
4. The user-facing statement, if any, stayed inside known current product truth and did **not** confirm or deny account existence or status (§11.1).
5. Residual gaps are written (for example: “consumer MFA still unrestorable”; “export still missing”).

Minimum internal evidence (GitHub issue comment or a slice note — **not** the global continuity files from this branch):

- UTC received / first opened / closed;
- From: domain or hashed/local identifier, not a mailing list of users;
- category;
- known / unknown;
- escalation (none / incident # / PO-Legal);
- what was said, in substance, without raw mail;
- operator role (PO / TL / mailbox operator).

Never paste the full mailbox body into the repository if it contains personal data beyond the minimum above.

This process does **not** create a durable support-ticket table. Absence of a ticket ID is expected.

---

## 14. Remaining support-tooling gaps

This document satisfies the **process / ownership / no-uncontrolled-DB** part of finding 4.1 and release-gate §M.

It does **not** satisfy, and must not be cited as satisfying:

| Gap | Why it remains |
| --- | --- |
| Named inbox monitor and actual coverage | Repository still cannot prove who reads `info@jetnity.ch` or how often |
| Response window | Intentionally not invented |
| Ticket system / helpdesk vendor | New provider + possible recurring cost = Product-Owner gate |
| Runtime help/contact page or mailto on auth forms | Error boundaries now include the factual mailto. Auth forms still have no dedicated contact path. |
| Operator-side `Fehler-ID` correlation | Finding 4.3 user-facing/process half is closed. Correlation/tooling half remains open under 5.5 (hosted error tracking / log aggregation), Product-Owner-gated |
| Account error boundary | Finding 4.2 closed via merged PR #471. This runbook must not claim the account boundary is missing. |
| Status / incident user communication | Finding 4.5 |
| DSAR export and account deletion | Findings 2.1 / 2.2; Legal + Product-Owner gates |
| Consumer MFA recovery | Finding 3.4 consumer half; Auth special gate |
| Own SMTP / reliable Auth mail | Finding 3.8; provider + secret |
| Legal desk, privacy/terms, proven controller contact | AP-6a Legal inputs still required |
| Payments support | No money movement exists |
| Secure support identity verification | No approved channel. Default: do not disclose account existence/status. Product-Owner + Legal for data-rights identity. |

Selecting Freshdesk, Intercom, Zendesk, Sentry or any equivalent remains a **Product-Owner-gated** new-provider / data-processor / possible-cost decision. Until later slices exist, Public V1 Launch remains blocked on the operational gaps above by the repository’s own release gate.

---

## 15. STOP conditions and forbidden shortcuts

STOP and escalate to Technical Lead (and Product Owner if a special gate is in play) when:

- the next step needs Production SQL, service-role, Auth Admin, RLS change or a new secret;
- the user sent passport/MRZ/health/payment secrets and someone wants them filed “for the record”;
- someone wants to confirm or deny that a Jetnity account exists from ordinary email, or to “verify” the sender with government ID, passport, OTP or password;
- the user asks for account deletion, export, refund or a legal letter;
- compromise is suspected;
- someone asks to promise a response time or 24/7;
- someone asks to install a helpdesk or error-tracking vendor “so we can answer this mail”;
- environment, Auth project or identity is uncertain;
- the only “fix” is an unreviewed destructive write.

Forbidden shortcuts:

- marking Ready or merging from this runbook;
- starting a legal-text, export, deletion, helpdesk or error-tracking tooling slice from this runbook;
- inventing a ticket ID, SLA or dedicated support hire;
- claiming `Fehler-ID` is resolvable;
- treating `/admin/users` as a disclosure source or using role/status writes as support;
- confirming or denying account existence/status from ordinary email;
- using break-glass as account recovery;
- writing legal or breach-notification text;
- contacting users who did not write in;
- editing global continuity documents from this slice;
- treating this runbook as a 5.5 tooling, helpdesk or error-tracking vendor approval.

---

## 16. Traveller-context check

This is an operations process, not a traveller-data feature. It does not add credential collection.

If a request **involves** trip or traveller facts, the operator still follows `docs/TRAVELLER_CONTEXT_INTELLIGENCE_POLICY.md`:

- no default/primary passport inference;
- per-traveller and per-credential-option evaluation when the question is legally option-dependent;
- Route Truth remains reusable and traveller-neutral;
- legal/regulatory facts stay official or `unknown`;
- evidence stays minimized;
- stale/recheck only for domains actually affected.

If the request is only account/auth, UX, billing-confusion or a generic outage report, do not ask for traveller credentials.
