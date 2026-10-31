# Jetnity — PrivacyBee CMP and Widget Consent S2 — IMMUTABLE TASK V1

**Date:** 31 October 2026, Europe/Zurich.
**Document state:** Published immutable TASK V1, authorized by the Technical Lead under the existing provider-completion instruction and APPROVE_B_DEVELOPMENT. This task is not a Technical-Lead PASS or activation receipt. Later scope corrections require a new versioned amendment.
**Package:** the already requested completion of DiscoverCars V2 #1084 / #1083 and 12Go V2 #1086 / #1085. Shared decision/evidence: #1087; completed foundations: #1089 / #1088 and #1091 / #1090. Viator #1079 is a separate writer and does not consume this browser-widget gate.
**Expected baseline:** accepted main b7ebc399b92303eacda9afdaa1786f245492051f, operating mode NORMAL. This is a dated baseline, not a claim that main can never advance.
**Assigned new branch:** feat/privacybee-cmp-widget-consent-s2, from the freshly verified accepted main. The Technical Lead assigns the actual new Draft PR and seed SHA in its dispatch. Never assume #1089 is the new PR.

## 1. Authority, outcome and actual limits

The Product Owner requests completion of the existing three provider integrations, authorizes ordinary Technical-Lead merge after independent acceptance and intends to inspect the result on jetnity.com. APPROVE_B_DEVELOPMENT is already recorded at https://github.com/Jetnity/jetnity/issues/1087#issuecomment-6508391917. The owner supplied the existing Swiss PrivacyBee account's banner snippet and screenshots: Opt-In on, optional interaction barrier off, privacy link https://jetnity.com/privacy. Do not ask for those inputs again solely because an older handoff still says they are missing.

The owner cannot select DiscoverCars or 12Go in PrivacyBee's directory and can propose a service. **A catalog entry, service proposal, vendor support reply or scanner completion is not a prerequisite for this implementation.** The documented category API supports application-controlled widget loading. Do not invent a service ID, service-registration method, category or support waiting period. A scan inventories observations; it does not itself implement Jetnity's prior blocking, current provider intent or frame teardown.

S2 delivers the global official CMP integration source, a typed category adapter, the shared per-provider intent and honest bundle-consent decision contract, usable preferences access, factual disclosure requirements and meaningful offline evidence. It is necessary runtime preparation for the requested provider package, not another generic consent platform.

**This author does not run real provider scripts, enable provider execution, activate a widget host, alter an environment flag, publish DNS or deploy/promote Production.** The existing provider hard-off switches and inert host remain off. Synthetic positive evidence does not open them. S2 must not be described as a finished DiscoverCars/12Go form.

The prior binding PrivacyBee decision forbids a banner solely for appearance while no relevant optional processing exists. This task prepares the CMP for the expressly requested optional-widget integration. The Technical Lead controls publication sequencing with that package and the current owner instruction; the author must not independently release a banner-only experience or turn this sequencing requirement into another request for already supplied owner permission. No second global banner, GTM installation or Google Consent Mode migration.

## 2. Required reads and fresh pre-code reconstruction

Read JETNITY_START_HERE.md, AGENTS.md, docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md, the current linked handoff/checkpoint, docs/ACTIVE_WORK_STATUS.md, .jetnity/operating-mode.json, relevant product/design/continuity standards and the live current-state index #751. Historical startup pointers are not current writer authority. Inspect current open ownership, latest relevant reviews and newer indexed MATERIAL; do not rescan unrelated historical inboxes.

Read these specific boundaries:

- docs/JETNITY_WIDGET_CONSENT_FOUNDATION_1_TASK_V1_2026-10-29.md and its PLAN/REPORT/STATUS/HANDOFF, plus actual lib/privacy/widget-consent/** and components/privacy/WidgetConsentChoice.tsx.
- docs/JETNITY_WIDGETS_ORIGIN_FOUNDATION_1_TASK_V1_2026-10-29.md and actual apps/widgets-host/lib/origin-contract.ts and inert-contract.json, read-only.
- docs/PRIVACYBEE_PRODUCT_OWNER_BINDING_DECISION_2026-08-30.md and docs/PRIVACYBEE_INTEGRATION_CONTRACT_2026-08-29.md, reconciled with later explicit owner evidence and this finite task.
- lib/legal/privacybee-vertrag.ts, components/legal/PrivacyBeeEinbettung.tsx, lib/legal/privacybee-integration.test.ts, app/layout.tsx and the actual current stylesheet order.
- Latest exact #1084 and #1086 task amendments and handoffs, including their source-verified / runtime-blocked distinctions. At the root read for this draft, heads were #1084 729e9344f00316d0559ca8b800555a49909e58f3 and #1086 4b20d8f51b1b8301f76dd73432016bcd38030ead; re-read remotely before using them as current.

Before product code, establish actual new branch/HEAD/tree/main/merge-base/ahead/behind, operating mode, complete seed diff, competing write ownership and original Cursor identity. Post the PRE-CODE PLAN to the new Draft PR. Include the concrete loading order, exact-host approach, API normalization, policy/intent separation, offline test interception and the absence of provider execution. An ownership collision or unavailable required original session is reported to the Technical Lead before edits.

## 3. Exactly one writer and correct branch routing

**Desired continuing original logical author:** Jetnity Shared Widget Consent Foundation 1 — Cursor Generation 1.
**Original session:** bc-dc782027-b7e1-4592-a7ae-b4f709161135, https://cursor.com/agents/bc-dc782027-b7e1-4592-a7ae-b4f709161135.
**Required original model:** grok-4.7-high-fast, verified from actual cursor-cloud run-info.originalModelName, never inferred from a prompt or Auto.

The Technical Lead intends to route a follow-up through the existing merged #1089 conversation with an explicit checkout instruction for the new S2 branch and new Draft PR. The new PR itself must not receive an additional independent @cursor start that creates a second writer. A transport comment on #1089 does not reopen that completed PR or authorize writing to feat/shared-widget-consent-foundation-1.

**Two-step dispatch:** First perform only the read-only attestation, new-branch checkout and PRE-CODE PLAN, publish that plan to the new PR, then STOP. Root must verify real current run-info/session association and the author's ACK of the **new** target branch/PR. Product-source implementation starts only after Root's explicit S2 IMPLEMENT instruction in the same existing conversation. This is an engineering assignment checkpoint, not a new Product-Owner approval request. Preserve the original exact logical name and Generation 1 if the original session is genuinely continued. Do not fabricate a new generation, claim a rename that did not occur or silently substitute another agent. If continuation is unavailable, stop for a specific TL assignment; no automatic replacement writer. Immediate CHANGES REQUIRED fixes stay in the same verified S2 session.

### Multi-Agent Suitability and live precheck

**SINGLE_AGENT implementation; parallel read-only review.** The CMP adapter and common consent state share lifecycle/types, so splitting source ownership would introduce grant/race and duplicate-loader risks. Exactly one original shared writer owns this branch. Provider and host authors remain stopped until separate bounded assignments against the reviewed shared contract. Root's read-only source/primary-doc and Viator reviewers change no runtime files. Supabase/Auth/RLS, external accounts and provider execution are not part of this source task.

Root's 31 October precheck: main b7ebc399b92303eacda9afdaa1786f245492051f, mode NORMAL, main clean; 11 open PRs/38 actual open issues. #1084 729e9344f00316d0559ca8b800555a49909e58f3 (13/0), #1086 4b20d8f51b1b8301f76dd73432016bcd38030ead (15/0), #1079 4d9da4816bd09815d6a401858d77bdf8503c6af3 (30/0), all Draft/unmerged with successful native CI and READY matching Previews, no inline threads; source/functional release distinction preserved. Direct jetnity.com is READY Production dpl_DAHXXQWNkjPZ6oNrxKMYdZZNhFe8 at main b7 with aliasError null. Scope/correction receipt: https://github.com/Jetnity/jetnity/issues/1087#issuecomment-6547221208 . Re-read before code and final delivery.

## 4. Official interface and evidence contract

Use the Swiss vendor privacybee.io / app.privacybee.io, not privacybee.com. The account-bound public website ID is cmuj24t7p05512zwul6dghfhu, already defined in lib/legal/privacybee-vertrag.ts. Import the existing public ID and exact-host helpers; do not copy credentials or alter the Legal loader.

Official banner source: https://app.privacybee.io/cookie-banner.js, with website-id equal to the ID above. The supplied preferences control uses class privacybee-display-preferences. Do not inject a second banner or programmatically accept consent.

The Technical Lead's 31 October primary-source read establishes the following interface. Re-read the official API article before implementation; a later incompatible vendor change is a concrete contract finding, not a reason to invent callbacks:

https://support.privacybee.io/support/solutions/articles/103000403413-javascript-events-und-api-des-privacybee-cookie-banners

| Surface | Documented shape |
| --- | --- |
| document event privacybee:ready | CustomEvent detail: categories: string[], hasExplicitConsent: boolean |
| document event privacybee:consent-changed | CustomEvent detail: consents: Record<string, boolean>, explicitConsent: boolean |
| window.PrivacyBee | getConsent(category), getAllConsents(), hasExplicitConsent(), onConsentChange(callback) |
| Required known category names | SECURITY_STORAGE, FUNCTIONALITY_STORAGE, ANALYTICS_STORAGE, AD_STORAGE, AD_USER_DATA, AD_PERSONALIZATION, PERSONALIZATION_STORAGE |

SECURITY_STORAGE and FUNCTIONALITY_STORAGE remain true after rejection. They cannot authorize optional widgets. A consent-changed event with explicitConsent false represents restored state, not necessarily refusal. Its true value can also result from a programmatic change and does not establish a current widget click. The API is ready after privacybee:ready. The documented onConsentChange callback has no promised unsubscribe return; prefer removable document listeners. These are programmatic CustomEvents: do not require event.isTrusted. No vendor timestamp, provider ID, policy version or cryptographic proof is documented; do not invent them.

Other primary references for the inventory/API distinction:

- https://support.privacybee.io/support/solutions/articles/103000405988-diensterkennung
- https://support.privacybee.io/support/solutions/articles/103000358473-kann-ich-dienste-manuell-hinzuf%C3%BCgen-

No callback name, event detail field, category, service ID or stored-consent encoding may be guessed. No acceptAll(), setAllConsents(), cookie editing or localStorage editing to manufacture permission. Preferences are changed by the visitor through the official control. Do not treat a DOM event as authenticated proof: re-read and validate the current official API snapshot instead of trusting a supplied event payload as the grant.

## 5. Runtime work permitted in S2

### A. One global, early, exact-host CMP boundary

**Publication safeguard:** S2 prepares the complete integration with a dedicated source-owned CMP release constant defaulting to false. With that constant false, root rendering creates no vendor script/request and no dead public preferences control. The Legal integration's existing reviewed true constant is not banner authority. A local fixture can exercise the implementation with controlled inputs, but no query/storage/public-environment override may enable the production path. Root may later change the source-owned release decision in the reviewed completion package, with fresh exact-head gates; this does not require another generic Owner approval.
Respect the existing server-side PRIVACYBEE_KILL_SWITCH=aus as an additional denial for the new CMP loader, without changing any environment values or weakening the existing Legal meaning. A missing kill switch cannot override S2's false release constant. Reading the server value must not expose secrets or force request-header/dynamic rendering.

1. Add the minimal root integration for the official banner and a single reusable bridge. Arrange the earliest supported head/bootstrap placement before optional integrations can start; do not wait for a trip panel click, an ordinary late useEffect or idle callback before establishing the boundary. Listeners/initial deny state must exist before optional work and must recover when the ready event occurred before React subscription. Derive readiness from the documented API, not script onload alone.
2. Execute the real CMP only when the browser's actual hostname is exactly jetnity.com. No www, wildcard subdomain, Preview, localhost, widgets.jetnity.com, query override, forged storage switch or NEXT_PUBLIC_ bypass. A non-licensed browser must not issue even the initial banner request. Keep Preview and offline tests provider-free. Use the public ID/host helpers without broadening the legal integration's license scope.
3. A browser-gated early bootstrap is acceptable if it proves ordering and prevents unlicensed requests. Do not make the entire application dynamic by adding root request-header dependence without first demonstrating the concrete requirement to the Technical Lead. Preserve metadata, canonical/noindex, styles, Toaster, portal and application hydration.
4. One script and one bridge lifecycle across route navigation, remount and development double-effect behavior. Keep missing/loading/error/ready distinct. On missing API, malformed snapshot, throw, timeout or unavailable preferences, report an honest non-grant state and retain existing first-party functionality. A CMP failure must never open a provider gate or block essential account/guest flows through Jetnity code.
5. Provide keyboard-accessible, continuously reachable official preferences access, including at least a viable entry in the provider-choice component when later mounted. Use the official class/control rather than an invented modal API. It must not become a dead button on unlicensed Preview. If the global entry requires Footer.tsx, the bounded permission below applies; no layout redesign.
6. Do not replace, duplicate, alter or reinterpret the existing Legal-page widget scripts, legal readiness checks, generated text or fallback. Do not install GTM or manipulate PrivacyBee account settings.

### B. Typed, current CMP state

1. Normalize only the seven documented categories and actual booleans. Reject an unknown category name, malformed value, missing required category, invalid API object or inconsistent required-category read as not usable for execution. Do not convert strings/numbers with Boolean(...), infer approval from absence or treat an empty category list as all accepted. categories on ready is not a list of granted permissions.
2. A usable snapshot needs an initialized API, valid required category values and hasExplicitConsent() equal to true. A restored decision may satisfy this CMP layer; it never creates a provider intent. A freshly rejected decision also has an explicit decision but fails the required optional categories. If the API has no explicit decision, optional execution stays denied even when a stub returns true values.
3. Register removable document listeners for ready and change, re-read the current API when notified and reconcile readiness on mount. Source-generation and lifecycle checks prevent a stale read/notification from restoring previously revoked permission. Recheck the official snapshot immediately before any future start decision. Focus/pageshow revalidation may be used to invalidate stale local state; do not claim cross-tab behavior the vendor did not document.
4. Keep the normalized state in memory. Do not introduce a second consent cookie, browser-storage ledger, database, tracking identifier or IP/UA log. The vendor's own behavior remains vendor behavior; Jetnity must not claim it stores no data merely because the adapter has no persistence.

### C. Per-provider intent and honest atomic bundle contract

1. Keep provider IDs strictly discovercars and twelvego. One provider's choice cannot enable the other. A current explicit widget selection is independent of a restored CMP grant, login, route, existing trip, scanned service, URL input or another button click. Defaults remain no intent / no execution.
2. Preserve the meaning of existing grant_informative: it is not an effective processing grant. Introduce explicit typed current intent and a common decision result with bounded denial reasons. Do not silently reinterpret S1 state or migrate historical informative approvals into real permission.
3. Model inseparable third-party processing honestly. The existing purposeSeparationVerified=false facts remain false unless a separate actual provider proof changes them in its owned lane. Do not expose fake individual purpose switches or describe bundled tracking as strictly necessary. A reviewed bundle policy may require all its documented optional categories together; refusing any required purpose keeps the entire provider context absent and leaves V1 linkout usable. Do not map GTM's presence to unobserved ad tags or invent a provider purpose inventory.
4. **Production provider policy is still unreviewed/blocked in this task.** A source-owned reviewed policy, correct current CMP state, current provider intent, correct generation, approved host/isolation and provider execution capability are separate requirements. No caller-supplied enabled, policy object, query, localStorage key or loose Boolean can mint a production execution capability.
5. Local fixtures may prove a positive decision under an explicitly synthetic reviewed policy, but must remain test-only. They must not be imported as a production policy, bundled as a live allowlist or exposed through a public route/environment switch. The actual production registry stays blocked for both providers; existing vendorScriptMayExecute behavior cannot become an unqualified true merely because the pure algorithm has positive test cases. Make production and synthetic entry boundaries obvious and verify them.
6. No empty required-category set and no necessary-only policy can approve an optional provider. Unknown/unreviewed policy denies with its real reason. Catalog absence itself is not a denial reason. The future provider purpose/category mapping is separately reviewed source policy, not an inference from scanner labels.

### D. Withdrawal, generations and lifecycle

An explicit provider refusal/removal, loss of any required optional category, invalidated CMP snapshot, trip/scope switch, stage reorder or unmount invalidates the current provider generation and any pending start. Removal means a future consumer destroys the whole frame/execution context; hiding it is insufficient. S2's actual local fake-frame consumer must prove this contract without introducing a real production embed.

After withdrawal, a later stale ready event, delayed loader completion, old message, remount or unrelated provider grant must not recreate the context. Re-granting CMP categories alone must not silently resurrect an explicitly withdrawn or invalidated provider intent. A fresh applicable provider choice is required. One live instance at a time; repeated clicks do not duplicate it.

Do not promise to undo past transmissions, erase inaccessible third-party cookies or stop provider tabs the visitor has separately opened. The factual UI contract is that Jetnity stops the active embed and prevents new initialization under the withdrawn permission.

### E. Factual disclosure contract for the later provider writers

Document a small reusable notice contract in the S2-owned DISCLOSURE_CONTRACT file: provider identity and official privacy link; what the widget does; observed external origins and bounded processing/purpose facts; whether the bundle can actually be separated; the categories required by the reviewed policy; when loading begins; withdrawal and V1 alternative; no automatic transfer of private Jetnity trip/account data. Known observations and unknowns stay distinguishable.

Record the already observed DiscoverCars hosts (www.discovercars.com, widget.discovercars.com, www.googletagmanager.com, fonts.gstatic.com) and 12Go hosts (12go.asia, cdn0.trainbusferry.com, ajax.googleapis.com, agent.12go.asia) as **observed, not a complete approved allowlist**. The unchanged source contracts are evidence, not permission. Do not publish a claim that vendor-generated privacy text already covers these providers or guarantees legal compliance. No copy of the vendor declaration, new terms, legal-basis conclusion or hand-edit to /privacy. Exact factual publication and policy disposition remain explicit TL/owner-bound evidence within the current package, not a mandatory support wait.

## 6. Exclusive write ownership

Allowed source paths only:

- app/layout.tsx, for the bounded global root integration.
- NEW lib/privacy/privacybee-cmp/** and focused tests.
- NEW components/privacy/PrivacyBeeCmp*.tsx and focused tests.
- Existing lib/privacy/widget-consent/** and components/privacy/WidgetConsentChoice*.tsx, only for the shared S2 contract and tests above.
- components/layout/Footer.tsx, only if needed for the official preferences entry; no other footer/copy/navigation redesign.
- lib/legal/privacybee-integration.test.ts, **only** to update its obsolete whole-repository vendor-URL allowlist to the exact new CMP source owner and strengthen the separation. Its existing assertions that the Legal loader/pages do not insert a banner, host/license checks, ready/error behavior, generated-text boundary and links must stay. Do not delete or broadly weaken the test because the new deliberate CMP owner is outside Legal.
- NEW scripts/privacybee-cmp-widget-consent-s2/**, local evidence/fixtures only.
- OWN docs/JETNITY_PRIVACYBEE_CMP_WIDGET_CONSENT_S2_{PLAN,STATUS,REPORT,SELF_REVIEW,HANDOFF,DISCLOSURE_CONTRACT}_2026-10-31.md and finite scrubbed evidence under an owned docs/evidence/privacybee-cmp-widget-consent-s2/ directory if needed.

TASK V1, S1 immutable tasks and historical evidence remain unchanged. Any published task amendment is Technical-Lead-owned. Do not write to the original completed S1 branch.

Everything else is read-only: components/trips/**, lib/providers/**, apps/widgets-host/**, Legal runtime modules and /privacy/impressum/terms content, GYG, Viator, root global CSS, styles/white-mint.css, TripWorkspace, package/lock/workflows, route tests, Auth/Supabase/RLS/DB/migrations, .jetnity mode/guards, Vercel/env/protection, DNS, provider ops and shared ACTIVE_WORK_STATUS/architecture/roadmap/decision files. Record any necessary shared-document delta in the own handoff for the TL's continuity update. Import accepted main normally; no rebase/force and no unassigned shared-conflict resolution.

This task explicitly grants the bounded root/CMP/shared-contract edits that the S1 task forbade. It grants no provider/host/Legal-runtime ownership and no automatic expansion when a test reveals unrelated problems. State the exact minimum need to the Technical Lead if additional ownership is unavoidable.

## 7. Required meaningful evidence

All functional/browser tests in this author run use local deterministic fixtures. Intercept the exact official banner request with a local fake API before navigation; no request may escape to PrivacyBee, DiscoverCars, 12Go, GTM, analytics, fonts or any provider host. Unexpected external requests fail the run even when intercepted/blocked. An offline fixture is labelled synthetic and is not a vendor runtime PASS. Do not use a personal signed-in browser, credentials, real cookies or provider account.

Required cases:

1. Early initial deny and listener registration; supported head ordering before an optional-load canary; one CMP instance across root/client navigation/remount; ready already occurred before subscription; late ready and failed/missing/throwing API.
2. Exact-host boundary: jetnity.com positive fixture; www.jetnity.com, widgets.jetnity.com, Preview, localhost, suffix lookalikes, missing host and query/storage attempts negative. Prove zero banner request on every unlicensed browser and zero provider requests everywhere in S2.
3. Actual seven-category shapes, missing/unknown keys, non-boolean values, inconsistent reads, no explicit decision, rejected state with both necessary categories true, and restored consent with event explicitConsent false. Restored CMP consent alone never creates an embed.
4. Separate DiscoverCars/12Go intents; informational grant remains non-executing; required optional-category refusal; no empty/necessary-only/unknown policy; all CMP values plus intent still denied by the actual production policy/capability. A separate local fixture demonstrates the positive pure-contract path without a production override.
5. Real mounted local fake-frame lifecycle: grant creates exactly one context; denial prevents it; withdrawal/category loss/context reset removes it, invalidates pending work and defeats delayed ready/message/completion. Repeated choices, provider switching, scope change, reorder, unmount, re-open and re-grant cannot resurrect stale intent.
6. The official preferences control remains reachable and usable with keyboard; unavailable CMP produces honest recovery, not a dead action. No second global banner or consent persistence. Existing legal loaders and first-party auth/guest boot contracts regressions stay unchanged.
7. Actual delivered components with current application stylesheet imports/order/Tailwind configuration and light-workspace ancestors where relevant: 320/390/768/1440 px, 200% root font, focus restoration, close/Escape, no clipped actions or horizontal overflow. Do not label root-font scaling as browser-chrome zoom; physical device and screen reader claims require actual runs.

Run focused new and affected shared/Legal regression tests; typecheck; ESLint; build; applicable existing check:operating-mode/check:api-schutz/check:schema-bezug/check:dead/check:exports/check:deps gates. Do not add test-only public activation paths or broaden unrelated suites merely to create a larger test count. Required repository/native CI gates still apply. Native App/Auth CI and matching root Vercel Preview must be reported on the exact final head; missing credentials/skipped checks are not passes. A root Preview PASS does not prove a separately deployed widget host, actual vendor network behavior or Production consent.

Record P0/P1/P2/P3 dispositions. Particularly assess early-request races, malformed/stale grant, essential-category bypass, duplicate listeners/frames, privacy-copy overclaims, production import of fixture policy, and the still-open actual provider origin/purpose/redirect boundaries. No unsupported claim of globally safe or legally compliant processing.

## 8. Finite remaining dependencies of this requested package

These are completion dependencies of the existing requested widgets, not authorization for this author to start extra product work:

| Dependency / existing owner | Finite next deliverable after shared review |
| --- | --- |
| Host — Jetnity Widgets Origin Isolation Foundation 1 — Cursor Generation 1; bc-fd77a5a3-17dd-4479-9594-f6238f61583f | Review actual parent-domain cookie attributes without private values, including CMP behavior; isolate app credentials; define exact parent/source message checks and no direct-URL autoload; narrow CSP/frame/sandbox contract; no inherited app env. Root handles any authorized Git linkage/deployment/DNS steps and verifies HTTPS. Current host remains 404 throughout S2. |
| DiscoverCars — Jetnity DiscoverCars Official Search Widget V2 Opt-In 1 — Cursor Generation 1; bc-1885a130-36a8-4dcf-86bc-48aa6121c24e | Reuse exact bound general export, define reviewed observed-processing/category policy, consume S2 without a second consent flag, mount one isolated frame only after all gates, remove it on revoke, preserve general-location/V1 behavior, verify official form/search/redirect/attribution under the specifically authorized runtime test. |
| 12Go — Jetnity 12Go Official Search Widget V2 Opt-In 1 — Cursor Generation 1; bc-2a335d8e-9108-4c0e-a2f2-8d7d499fd49c | Reuse exact general export, establish reviewed category policy and actual frame/search capability, bind S2 and one current frame in the real trip flow, preserve opaque isolation unless a separately reviewed observed requirement justifies a bounded change, prove search/redirect and V1 fallback. Existing field visibility is not completed search evidence. |
| Technical Lead | Decide exact factual disclosure/policy disposition, fresh source/security/privacy review, final unchanged-head CI/Preview/threads, Ready and merge only when the deliverable genuinely meets its scope; independently verify actual main/Production/jetnity.com and persist current completion/unfinished state. Owner's later visual test supplements this review. |

The Technical Lead may sequence these bounded dependencies under existing authorization and keeps their write scopes disjoint. A missing Katalog entry does not silently reappear as a gate. Unknown actual processing, unproved host isolation or broken search remain concrete findings to resolve; the requested result is not completed by merging informational placeholders.

## 9. Delivery and STOP

Return actual original session/model/stored name and new branch/PR ACK; immutable Task link/blob; exact HEAD/tree/current main/merge-base/ahead/behind; changed-file list; meaningful original logs/screenshots; local versus native versus external evidence; current policy/capability status; risk matrix; finite remaining dependencies and the exact first unfinished step. Re-fetch origin/main before final handoff. Reconcile outdated own summaries without rewriting immutable/history evidence.

Source facts, author self-review and green automation are not Technical-Lead PASS. Any changed head invalidates previous exact-head gates. Do not claim native CI/Preview/Production acceptance that has not been freshly read.

**Keep the new PR Draft. Do not mark Ready. Do not merge. Do not deploy, alter DNS/env/flags, execute real provider code, contact vendors, propose services, accept terms/payments or start a follow-up slice. STOP for independent Technical-Lead review.**
