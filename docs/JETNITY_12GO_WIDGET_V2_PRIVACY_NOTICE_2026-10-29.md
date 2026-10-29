# Jetnity 12Go widget — proposed privacy notice

Date: 29 October 2026 Europe/Zurich
Status: **PROPOSAL ONLY. Not approved. Not inserted into `/privacy`.**

`app/(public)/privacy/page.tsx` is read-only for this task. PrivacyBee remains the legal-page embed and is not a vendor CMP for 12Go. DiscoverCars #1084 also touches shared privacy work. This note stops for a separate Technical Lead decision.

## What a later notice would need to say

If Jetnity ever loads the official general 12Go form, the visitor's browser contacts at least these origins. They were observed on 29 October 2026 in one ephemeral HTTPS audit after a deliberate click. Observation is not an approved allowlist.

- `https://cdn0.trainbusferry.com` — form script, CSS, logo, icon font
- `https://agent.12go.asia` — `/tools/form/cnt.php`, a GIF requested with query names `lang`, `z`, and `sub_id`
- `https://ajax.googleapis.com` — jQuery 1.11.0, requested by the loader and not present in the partner HTML itself

On a direct insert, the page origin was sent as Referer. No trip id, account id, traveller name, or Jetnity date was added by Jetnity. `sub_id` for the general export is the fixed token `jetnity-mobility-search`. The partner id `17323861` is public.

The vendor form can show its own date. In the audit it showed November 3 even though Jetnity sent no date and the hidden date field was empty. Visitors must check or change that date. Jetnity must not copy trip dates, traveller counts, residence, or age into the form.

The generator carries a currency attribute. The audit saw a hidden field of length 3 and did not store the value. An earlier V1 check saw a CHF generator setting followed by a USD result. The notice must not say that prices are in a Jetnity currency.

No `Set-Cookie` was seen in this short load. That does not mean later search or booking is cookieless. 12Go's privacy policy describes analytics and advertising. Closing the form in Jetnity does not delete data already sent to 12Go or Google.

Results, tickets, and payment stay on 12Go.

## Proposed choice, not shipped

Before any request: explain the origins above, in plain language. Offer two equivalent actions, "Formular nicht laden" and "Allgemeines Formular nach Hinweis laden". Decline keeps the V1 links and loads nothing. After loading, "Formular schliessen" removes the form here and says that already sent requests and stored provider data remain at the provider. Reopening returns to the choice. A trip change or a new stage order drops an in-flight load. One instance only. No Bangkok prefill and no automatic route widget.

This choice is implemented only as a synthetic test view. The visitor page does not show it, because a load button would either do nothing or start the third parties before this notice is approved and before isolation is solved.

## Why execution stays closed

A load button is not consent. The shared privacy page cannot be edited here. Putting the official snippet in the Jetnity page runs third-party script in the first-party origin. An opaque sandbox still contacted the same hosts and did not show a complete form. An embed route needs an explicit Technical Lead review and was not created.
