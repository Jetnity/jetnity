# Account Reisende Premium Registry UX 1 — Self-review

Date: 1 October 2026
Issue: #696
Draft PR: #697

This is the author self-review. It is not an independent Technical-Lead PASS.

## What holds

- Default DOM has zero `<form>` elements for the two-traveller fixture. Playwright counted 0 on every required viewport.
- **Reisenden hinzufügen** is before the first card and opens the same label and residence fields. Submit copy remains **Reisenden anlegen**.
- Management exposes add/remove citizenship, add/edit/remove document by exact id, identity edit, and the existing delete confirmation.
- A second **Verwalten** leaves exactly one `[data-registry-verwaltung="offen"]`.
- New citizenship and document controls start empty. The edited document id in the audit was `33333333-3333-4333-8333-333333333331`.
- The expired fixture shows **1 Ablaufhinweis** on the summary and, inside management, “Dieses Dokument ist vor dem heutigen Kalendertag abgelaufen.”
- GB as issuer with Italian and French citizenships is displayed as stored. No association is invented.
- Sensitive-field and service-role source scans still pass.
- Registry horizontal overflow was 0, including 320×568, landscape 844×390, 200% text and 150% zoom.
- Opened inputs computed at 16px. Buttons computed at least 44px. Focus returned to **Reisenden hinzufügen** and to **Verwalten**.

## What this does not prove

- A signed-in account or a physical phone. The matrix is headless Chromium on the audit route.
- That `LandFeld` itself changed. It did not. This page forces `text-base` on descendant inputs and selects so the 16px minimum holds without editing country behaviour.
- The local full suite as a PostgreSQL proof. One pre-existing `initdb` ENOENT remains outside this diff.
- The before/after pixel comparison as a same-width measurement. Before used `max-w-3xl`. After uses `max-w-6xl` and two summary columns. Both numbers are the page a person scrolls. The form count dropped from 5 to 0 either way.

## Review notes

At 200% text on 360×800 the title and explanation consume the first viewport, so **Reisenden hinzufügen** starts at y 1330. It is still the first action and it is above the cards. The targets grow with the root font size. I did not shrink the title.

The previous 200% full-page screenshot of the old layout did not encode (empty file, removed). Its measurements remain in `vorher.json`.

No follow-up slice is opened from this review.
