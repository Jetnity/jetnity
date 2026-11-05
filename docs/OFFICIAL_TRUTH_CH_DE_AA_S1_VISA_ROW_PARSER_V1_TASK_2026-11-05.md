# Official Truth CH→DE – Federal Foreign Office S1 visa table parser V1

Date: 2026-11-05 (Europe/Zurich)  
Task: [#1127](https://github.com/Jetnity/jetnity/issues/1127)  
Product parent: [#917](https://github.com/Jetnity/jetnity/issues/917)  
Base main: `ed7fbc01c7b3b14cddc79f0361749db32b7dfded`  
Mode: `NORMAL`. Direct Technical Lead implementation; other coding agents currently not available.

## Intent: complete a missing legal-source-specific CODE piece, not another generic inventory

The **actual** CH→DE Application Pilot already contains a synthetic end-to-end Trip→Evidence→Rule→Requirements→`OfficialEvaluation[]` proof, but no qualified German source contract or production extractor definition. `applicationContract()` references an empty registry; `applicationPilotEnabled()=false`; `OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY` is empty; `requirementsProviderAus()=null`. This module implements the previously absent **exact S1 visa-country table semantic decoder** for the German Federal Foreign Office's publicly documented `Schweiz | Nein` visa-obligation row.

Official research URL: `https://www.auswaertiges-amt.de/de/service/visa-und-aufenthalt/staatenliste-zur-visumpflicht-207820`  
Page heading: `Übersicht zur Visumpflicht bzw. -freiheit bei Einreise in die Bundesrepublik Deutschland`  
Published date: 03 June 2026, **not** the legal effective date.  
The row is **not** proof of ordinary-passport subtype, tourism/long-stay/work validity, 90/180 days, every border/exception, vaccine/health rules, legal time interval or automatic permission to enter.

### Code implemented

- `lib/readiness/official-truth-ch-de-aa-s1-visa-row-research-server.ts`: server-only pure parse5 decoding of a supplied **complete candidate HTML representation**, with bounded research-parser byte length and DOM node count, one exact page heading, one structurally matching exact visa duty table, one unique unfootnoted Swiss row with exact `Nein`.
- Any malformed/missing/conflicting/duplicated/footnoted/hidden/active HTML row blocks: no first-row-wins or material truncation.
- Returns ONLY an immutable, explicit `research_visa_table_observation` with `researchStatus=RESEARCH_ONLY`, `sourceCustody=not_verified`, `legalApplicability=not_verified`, `checkedAt/validFrom/validUntil=null`, `acceptedEvidence=0`, `acceptedRules=0`, `databaseWrites=0`. The untrusted text itself never returns.
- `lib/readiness/official-truth-ch-de-aa-s1-visa-row-research-server.test.ts`: synthetic HTML structure, positive research-only recognition, adversarial row duplicates/footnotes/active or hidden markup/oversize/missing heading, and structural assertions verifying existing production extractor, pilot and provider remain hard-off.

### Important distinction: 128KiB parser input is NOT an authorized retrieval budget

The local structural parser refuses inputs beyond 131072 UTF-8 bytes for resource control. It does **not** raise or authorize the real default `BODY_MAX=65536` in the server-owned HTTPS retrieval stack and does **not** grant AA/S1 the separate source-specific S3 128KiB transport pin. Historic S1 guarded read from 09 Oct 2026 returned `response_too_large`; page exact final URL, full bytes and verified representation/identity, privacy and legal scope have never been admitted. No real source GET/download, original-body retention or authenticated custody occurs in this code.

The separate dormant 384KiB Protocol3 proposal #985 remains HOLD, not touched. No changed `OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY`, live trusted extractor registry, source catalog, ApplicationContract registry, source-side HTTP policy, `applicationPilotEnabled()`, `requirementsProviderAus()`, Trip Workspace runtime or official accepted store.

### Outstanding operational gates

1. S1 official-source canonical identity, complete exact bytes, competent publisher, stable original, permitted lawful use/egress and exact legal/document scope must be independently qualified via the protected existing source flow.
2. The once successful Development Stage1 migration from 14 October has unverified ledger/RLS/ACL/definition readback because of the OpenAI safety-status platform refusal #917; support case already **SENT by Owner** with reply pending. Do not resend, re-run, reword, re-route or delegate a bypass. Stage2 NOT_ATTEMPTED.
3. Once cleared, exact code-owned protected source/extractor/application contract and reviewer grant may be assessed as a **separate controlled acceptance/activation**. Successful research parser or a successful synthetic test alone never publishes a visa fact.

**STOP:** Draft PR until full exact-head native CI, relevant local tests and independent Technical Lead review. No Ready/Merge solely because of a green check; preserve #917/#985/#937 and current Production hard-off. No additional generic source-audit loop.

This is a targeted implementation milestone towards the real CH→DE visa cell; it is NOT the already complete end-to-end regulatory service.
