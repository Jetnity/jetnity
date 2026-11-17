# Austria Official Truth – Production release gate, 17.11.2026

**Status: STOP / not eligible for release.** This is a Technical-Lead safety handoff, NOT an Owner approval and NOT a production installer. Production was read-only verified on the current main: BG1 `current`, AT HRS2 source custody **absent**, AT accepted store **absent**, AT method head **0**; Jetnity Production is unaffected. PR #1227 is a Draft on its own branch.

## 1. Legal validity vs technical TTL

- **An official visa fact has the validity stated by the competent authority, not automatically one hour.** The source can change. It must be checked for source revision and effective legal dates; on a material change or contradiction the affected rule is immediately unavailable until requalified.
- **The existing CH→AT Dev implementation has a genuine one-hour positive display/cache TTL**, `verified_visas_v3.expires_at=verified_at+interval '1 hour'`. The positive fact from 17.11.2026 expired at 12:31 Swiss time. This was NOT a special test-only flag, nor permission to treat official legal requirements as valid for only an hour.
- The already code-owned `operatingProposal` sets `checkIntervalSeconds=3600` (hourly source check) and `primaryMaxAgeSeconds=86400` (maximum 24 h between successful full source qualifications). **The hourly official-source refresh is NOT installed/scheduled**. Dev source identity is pinned to complete 06.11.2026 BMI and 16.11.2026 fetch: `official_v3_at_private.source_current_v3()` fails after 24 h without an independently checked replacement.
- The independent tamper/alarm/background BG1 proof is on the **five-minute cadence**; it checks protected catalog integrity and does not refresh official government legal texts.
- Intended genuine operation: schedule official source monitoring **every 60 minutes**, detect changes with pinned response/hash and per-rule requalification before any positive update; keep `1 h` maximum positive display validity and `24 h` hard upper bound on source verification, with fail-closed outage/ambiguity. Do not re-issue an identical positive fact merely to extend the deadline without the actual source readback. The legal effective-date bounds additionally apply. No existing scheduler may be described as active unless actual deployment/cron/readback prove it.
- Changing cache TTL is not a substitute for monitoring, current source checks or legally valid facts. Do not deploy stale source claims into Production.

## 2. Austria's 50 passports

The complete Austrian BMI visa source is the **06.11.2026** edition with full 498415 original bytes, backed by independent BMI entry guidance and the Austrian Embassy Bern where applicable. The exact user priority file contains **50 passports**. The private Dev research staging is installed and read back: 50 passport records, 49 exact BMI matrix nationality entries plus the Austrian home-country exception, 26 topic/source-research records and 1300 topic × passport cells. All new research cells are `RESEARCH_ONLY` / `derzeit nicht verfügbar` with **0 new authorized/published facts**, forced RLS and no public/anon/service-role access. `XK` is a research code, not ISO3166 and is not selectable by the present public country widget without a separately reviewed UI policy.

The existing AT HRS2/MA1 writer/visitor is deliberately CH-specific. It cannot publish the other 49 passports. Future positive national-passport rules require a separately reviewed native PG17 source-issuer/MA1/BG1/accepted-projection method, exact original-source reference, document category, purpose/stay/transit qualifiers, independent official counter-check when available and Owner-gated approval. Do not infer visa freedom from a `Ja`/other raw matrix cell or automatically apply Swiss/Bern-specific authority to other nationalities.

## 3. Other topics and forms

Austria's non-positive reference UI is provided for visa, passport validity, ETIAS (not yet accepting applications), health and vaccinations, entry/visa forms and fees, transit, minors and parental consent, customs, fraud warnings and special cases. References are guidance **only**; individual obligations stay unavailable until method-bound qualification. On each actually applicable form show the precise source-office name, **direct official URL**, **known price or 'derzeit nicht verfügbar'**, and an explicit third-party/fraud warning. Do not claim a mandatory ETIAS application before EU activation. In particular, the EU official ETIAS FAQ says applications are not collected yet and future fee will be €20. BMEIA Visa-C original form is free but visa-processing fees depend on the applicant and consulate.

## 4. Required Production engineering before the Owner decision

1. Author an exact, reviewed Production installation package (AT original custody, qualified V3 source issuer, 50-pass method/accepted store/public projection, append-only history, private RLS/permissions, BG1 successor), with **one real native PostgreSQL 17 full-proof and rollback case**. Do not copy the Dev Owner receipt or modify CH→DE original-byte limit.
2. Install and prove an **independent hourly official-source monitor**, content-change detection, source-date/version readback, escalation on inconsistencies and fail-closed next-BG1 guard (every five minutes) without new roles or unapproved cost. Prove no database writes from RESEARCH_ONLY inputs or anonymous callers. Verify critical source links and costs against current official portals.
3. Publish a dedicated Production selector/release code path AFTER its own review. Current `selectedAustriaDev()` expressly refuses Production; no Preview environment metadata or Dev credentials can be used there.
4. Obtain the Owner's **separate** Production merge/release permission and perform the production AAL2/MA1 approval on the actual Production instance, followed by the reviewed one-command importer. No production migration, merger, auto-scheduling or money action is pre-authorized by this document.
5. After one full green CI on exact final head, one genuine Dev visitor test and fresh official source recheck, run real Production readback/visitor end-to-end, independent negative tests (unapproved/expired/different passport) and controlled rollback if any check fails. `derzeit nicht verfügbar` is the only safe fallback.

The provided `scripts/db/official-truth-at-production-readiness-1/read-only-preflight.sql` is strictly read-only, intentionally emits `STOP_BEFORE_PRODUCTION_OWNER_RELEASE`, and cannot install anything. **Do not request the Owner's Production button before all P0 gates are verified.**

## 5. Next destinations

Only after storing this AT release-gate plan, begin IT→FR→ES→PT research-only source and 50-pass package intake, on separate reviewed source facts. Reuse the same 50-pass priority, no mass data in comments, no authorized visitor positives without the destination's official primary evidence and independent method gate.
