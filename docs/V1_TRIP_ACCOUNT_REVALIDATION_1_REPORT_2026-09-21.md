# Jetnity – V1 Trip Workspace & Account Revalidation 1 – Report

Stand: 21. September 2026  
Status: **FUNCTIONAL REVALIDATION COMPLETE / DOCS-EVIDENCE ONLY / DRAFT / NOT READY / NOT MERGED / NO FINDING IMPLEMENTED / STOP FOR TECHNICAL-LEAD FUNCTIONAL REVIEW**

Issue: #507  
Draft PR: #509  
Branch: `audit/v1-trip-account-revalidation-1`  
Verified product baseline: `main@c7fb9f0f693ba9f020add7b26a041263aa7e3b07`  
Dispatch head: `ef8df8a502b37d43a1b34666ca3caf9b356eeb6b`  
Binding task: `docs/V1_TRIP_ACCOUNT_REVALIDATION_1_TASK_2026-09-21.md`

Cursor-Agent: **Jetnity V1 trip account revalidation 1**, Generation 1  
Required model: **Cursor Grok 4.6 High Fast** — confirmed (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-18cfea6b-09d5-4bb8-ac73-10332a6079eb`

This is a current-state functional revalidation of Trip Workspace / Account integration. It reuses merged #497 / #498 and the accepted closures #500 / #502 / #504. It does **not** implement findings, start TW-8/TW-9, or replace the visual audit.

---

## 0. How to read this report

Statuses are review classifications, not a new product state model:

| Status | Meaning here |
| --- | --- |
| `IMPLEMENTED_VERIFIED_LOCALLY` | Source present and the named local unit tests passed in this session |
| `IMPLEMENTED_SOURCE_ONLY` | Source present; not executed beyond reading / not a live DB/browser proof |
| `PARTIAL` | A real bounded half exists; the residual is named |
| `BLOCKED_ACCESS` | Would need unauthorized remote/auth/DB/browser access |
| `PO_GATED` | Still open and blocked on a reserved Product-Owner decision |
| `PHASE_2_3` | Later-phase by the binding V1 build order |
| `NOT_IMPLEMENTED` | No matching route/table/product path on this head |

Evidence classes:

- **Executed** — named local tests ran in this session (479 pass / 0 fail).
- **Source-traced** — current files/symbols/lines on the product SHA.
- **Not proven** — authenticated E2E, real RLS, Production SQL, Preview click-through.

A stub, self-review or old merge is not a current behavior PASS. Source-only reasoning is not executed browser/DB/Production proof. A Vercel READY deployment is not a database apply.

Parallel ownership (do not cross):

| PR / Issue | Owns | Must not be treated as this slice |
| --- | --- | --- |
| #506 / #505 | Visual screenshots / sizing / navigation evidence | Unaccepted visual findings; not copied or re-owned |
| #509 / #507 | These functional docs + `docs/evidence/v1-trip-account-revalidation-1/` | This report |
| #510 / #508 | Intelligent Admin source/analysis specification | Not written here |
| #494 | Merged local producer-contract proof | Not restarted; 5.2 ingestion remains open |

---

## 1. Live reconstruction

Re-fetched `origin/main` before writing.

| Item | Value |
| --- | --- |
| Task / live `origin/main` | `c7fb9f0f693ba9f020add7b26a041263aa7e3b07` — Close V1 Security Event Mutation-Derived Producer Contract 1 (#494) |
| Merge-base `HEAD`…`origin/main` | `c7fb9f0f693ba9f020add7b26a041263aa7e3b07` |
| Ahead / behind | **1 / 0** (task commit only, before this persist) |
| Main drift vs task baseline | **None.** Do not rebase. |
| Local `main` on this VM | stale at `9f386d10` (#504); ignored in favor of `origin/main` |
| Operating-mode file | `.jetnity/operating-mode.json` `mode: NORMAL` |
| Draft PR #509 | open, draft, not Ready, not merged |
| Review threads on #509 at write | **0** besides Vercel bot + dispatch |
| Dispatch-head Preview (presence only) | READY `dpl_FrQvCewaXAKS7tdTNVbSr4guqNMC` — not functional proof |

### 1.1 Stale continuity that this slice must not edit

`JETNITY_START_HERE.md` and `docs/ACTIVE_WORK_STATUS.md` on the same main still describe live `main` as `AI_OS_BUILD_HOLD` and #487 as parked. Live GitHub/Git and the operating-mode file contradict that. #492 HOLD closure, #487 architecture and #494 local proof are on this main line.

This slice **does not** edit those global files. Technical Lead owns any continuity refresh. Until then: **live GitHub/Git wins**.

### 1.2 Closed work that must not be reopened

| Finding | Closure | Current revalidation |
| --- | --- | --- |
| RH-1.1 HTML Auth lookup-failure → login | #500 | **Still closed.** `proxy.ts` `authLookupFehlerIstSitzungFehlend` / HTML 503. Tests passed. |
| RH-3.1 mobility array order | #502 | **Still closed.** `benoetigteKanten` sorts by `position` then `id`. Tests passed. |
| RH-10.1 / RH-10.2 KPI taxonomy | #504 | **Still closed.** Shared `lib/admin/security-event-taxonomy.ts`. Tests passed. |
| #497 CLOSED rows | listed in that report | Unchanged on spot-check; see §2.8. |

---

## 2. Capability matrix — current behavior

### 2.1 Trip create, guest local state, guest-to-account adoption

**Status: `IMPLEMENTED_VERIFIED_LOCALLY`** with a named UX residual.

| Seam | Symbol | Contract | Evidence |
| --- | --- | --- | --- |
| Shared create graph | `createZieleGraph` `lib/trips/create-stages.ts` L33–61 | Confirmed `Ort[]` → stages `position` 1..n; repeats stay separate stages | `create-stages.test.ts` Paris→Rom→Paris **executed** |
| Guest storage | `gastspeicherLaden` / `gastreiseAnlegen` `lib/trips/gastspeicher.ts` | One editable guest trip; write-verify; revision/mutationId | `gastspeicher.test.ts` **executed** |
| Guest create gate | `gastCreateGate` `lib/trips/create-entry.ts` | Second guest create blocked | `create-entry.test.ts` **executed** |
| Account create | `reiseAnlegen` → `reise_anlegen` | Idempotent `client_ref` | **SOURCE_ONLY** (needs Supabase) |
| Adoption | `gastreisenUebernehmen` `lib/trips/uebernahme.ts` L65–153 | Abort on first error; retry same `client_ref`; retain draft on failure | `uebernahme.test.ts` **executed** (54 tests in that file) |
| Bridge UI | `GastreiseBruecke` | Auto-run on `/reisen`; retry control on `fehler` | **SOURCE_ONLY** |

**Residual RH-2.1 (still current):** invalid schema bytes become `aktiv: null` → `zurUebernahme() === []` → `{ art: 'nichts' }` (`uebernahme.ts` L79–80). `GastreiseBruecke` maps `nichts` to `ruht` and renders nothing (L73–75). Raw `localStorage` may remain. This is the accepted schema filter, not a happy-path overwrite. The honesty gap is UX: the user is not told.

### 2.2 Ordered stages, repeats, day/stage, timeline, mobility

**Status: `IMPLEMENTED_VERIFIED_LOCALLY`** for order/repeats/mobility; day association after multi-destination create is an accepted TW6 `unassigned` mode.

| Seam | Current behavior | Evidence |
| --- | --- | --- |
| Repeated destinations | Same city twice = two stages, distinct `position` | `create-stages.test.ts` **executed** |
| Read-path order | `reiseAus`, timeline, `reiseOrte` sort by `position` | Source + #498 non-finding 3.A |
| Mobility | `#502` `etappenSortieren` then walk (`kanten.ts` L77–81, L181–183) | `kanten.test.ts` “Etappen in falscher Array-Reihenfolge folgen position” **executed** |
| Multi-destination create | `assignmentMode: 'unassigned'`, `dayStagePosition: null`, stage dates null | `create-stages.ts` L49–60 **executed** |
| Timeline | Unassigned days go to a synthetic “ohne Etappe” bucket | `timeline.ts` L57–80; `timeline.test.ts` **executed** |
| Post-create day→stage editor | No `components/` control to assign an existing `unassigned` day | **SOURCE_ONLY** absence. TW6 treated this as a later provenance contract, not a silent defect. Activities/hotels that require `tag.stageId` stay unavailable on those days. |
| NL change reorder | No `etappe_verschieben` op; add/remove rewrites `position`; `reindex` sorts by position (`anwenden.ts` L96–98) | `anwenden.test.ts` **executed** |

Do not start a day-stage editor from this report unless Technical Lead wants a new provenance contract. That is not a reopen of #502.

### 2.3 Account traveller registry → trip snapshot

**Status: `IMPLEMENTED_VERIFIED_LOCALLY`** for S1/S4 contracts; S2/S3 persistence/UI `IMPLEMENTED_SOURCE_ONLY`.

AP-7 S1–S4 are integrated. Do not rebuild them. Current truth: `docs/AP7_S4_ACCOUNT_PLAN_RECONCILIATION_2026-08-30.md`.

| Seam | Current behavior | Evidence |
| --- | --- | --- |
| Dual authority | Registry ≠ `TripTraveller`; forbidden preferred/default keys | `account-registry.ts` `VERBOTENE_WAHL_SCHLUESSEL`; tests **executed** |
| Explicit adoption | `registryTripUebernahmeOrchestrieren` → fresh UUIDs → `party_schreiben` | `account-registry-trip.ts` L127–174, L252+; tests **executed** |
| No live FK | DB comment + no registry id reuse | Migration comment; `snapshotIdentitaetFremd` |
| Later registry edit | Writes `account_travellers*` only (`registryTravellerAendern`) | **SOURCE-TRACED.** Not a silent trip mutation. |
| Re-adopt same person | Appends another trip traveller with new ids; no in-place refresh | Accepted Dual-Authority copy. Not a defect. |
| RH-4.1 fallback | Legacy select + singular columns if child relations missing | `foundation-e-select.ts`, `daten.ts` L189–196, `reisende.ts` L81–102 **still present** |
| RH-12.2 comment | Header still says Foundation-E children are absent on Production | Stale vs `docs/FOUNDATION_E_PRODUCTION_ACCEPTANCE.md`. Fallback code may remain. |

Guest workspace has no Registry→Trip control (accepted).

### 2.4 Route / date / traveller / credential change → readiness and selected items

**Status: `PARTIAL`.**

| Seam | Current behavior | Evidence |
| --- | --- | --- |
| Readiness fingerprint | Includes origin, transit, dates, all peer citizenships/documents | `fingerprint.ts`; tests **executed** |
| User checks | Persist `done` becomes `stale` when fingerprint drifts | `status.ts` L50–70; tests **executed** |
| Official evaluations | Per traveller × credential option × destination × type | Engine source + #498 non-finding 5.B |
| Official provider | `requirementsProviderAus()` returns `null` (`provider.ts` L99–100) | Empty rows `unknown` / `provider_unavailable` (`official.ts` L369–371) |
| RH-5.1 | `officialTravellerErgebnisText` any current `not_required` wins; unused in `components/` | `bezeichnungen.ts` L107–112; tests **executed** (single-option only) |
| RH-6.1 | `officialPruefungAusLage` any `freshness === 'current'` claims “geprüft”; dormant while provider is null | `bezeichnungen.ts` L86–88; used by `Reisevorbereitung` and readiness API |
| Date shift vs commercial items | `zeitraumVerschieben` skips `istKommerziell` dates (`anwenden.ts` L172–175). Tests expect `startsOn` to stay. Attention has no item-date-mismatch signal. | `anwenden.test.ts` **executed**. **New residual TA-N1.** |
| TW-8 selected commercial truth | Workspace still has no provenance join / real provider snapshot | Known blocked; do not start. |

### 2.5 Account home, groups, archive / restore

**Status: `IMPLEMENTED_VERIFIED_LOCALLY`.**

| Seam | Current behavior | Evidence |
| --- | --- | --- |
| AP-3 groups | Date-only derived; archived still classified, filtered separately | `reise-lage.test.ts` **executed** |
| Account home | `reisenLaden` + empty-vs-error + `GastreiseBruecke` | **SOURCE_ONLY** for the page |
| AP-4 archive | Provenance in `metadata.account_archive.previous_status`; never invent restore status | `reise-archiv.ts` L116–147; tests **executed** |
| Optimistic concurrency | `eq(status)` + `eq(updated_at)` | `archiv-aktionen.test.ts` **executed** |
| Guest archive | Untouched | Same tests |

Live two-tab archive against RLS: `BLOCKED_ACCESS`.

### 2.6 Security, session, password, recovery, settings, export

**Status: `IMPLEMENTED_VERIFIED_LOCALLY`** for the shipped AP-5 / export surfaces.

Exists: `/account/security` (password change, current-session view, logout scopes `local|others|global`, MFA step-up before TOTP unenroll), `/account/settings` + scoped JSON export (13 tables), `#500` HTML lookup-failure page, `app/account/error.tsx`.

Honest residuals: other-device list is `unsupported`; no `/account/delete`; no backup codes / WebAuthn (`PO_GATED`).

### 2.7 Preferences / favourites / bookings / notifications / entitlements

Find what exists; do not label all AP-8–AP-12 missing from memory.

| AP | Current | Status |
| --- | --- | --- |
| Account nav | Übersicht, Reisen, Deine Welt, Reisende, Einstellungen. Comment: favourites and subscription stay out. Bookings omitted by contract. | `lib/account/navigation.ts` L4–12 |
| AP-7 travellers | `/account/travellers` | `IMPLEMENTED_SOURCE_ONLY` |
| Visit history / world map | `/account/welt`, `account_visits` | `IMPLEMENTED_SOURCE_ONLY` (closed #441) |
| AP-10-S1 bookings | `/account/bookings` reads existing `trip_items` / trips; overview CTA; not a nav tab | `IMPLEMENTED_SOURCE_ONLY` |
| AP-8 prefs | No preferences route/table | `NOT_IMPLEMENTED` / later unless PO asks. Not a V1 build-order prerequisite. |
| AP-9 favourites | No table/UI | `NOT_IMPLEMENTED` / Nutzenfrage first |
| AP-11 notifications | No settings route/table | `NOT_IMPLEMENTED` / `PHASE_2_3` for push/email companion |
| AP-12 entitlements | No consumer module | `NOT_IMPLEMENTED` / gated |
| Assistant | In-trip only; no guest / no account surface | Closed runtime; not missing-from-account |

The older Account platform plan still describing AP-10 as missing is stale versus AP-10-S1.

### 2.8 Legal / consent / deletion / retention / SMTP / providers

**Reuse #497. Updated only where newer evidence exists.**

| ID | Classification | Newer evidence |
| --- | --- | --- |
| 1.1 Legal pages | `PO_GATED` | Still no routes; inventory tests **executed** |
| 1.2(a) CookieConsent | `CLOSED` | Unchanged |
| 1.2(b) Consent record | `NOT_APPLICABLE` | No tracker |
| 1.5 Terms capture | `PARTIAL` | Still checkbox only |
| 2.1 Scoped export | `CLOSED` | Tests **executed** |
| 2.2 Deletion | `PO_GATED` | Still no `deleteUser` / `/account/delete` |
| 2.4 Retention | `PO_GATED` | Unchanged |
| 3.4(b) Backup codes | `PO_GATED` | Unchanged |
| 3.6 Production redirects | `PO_GATED` | Not re-read live Auth |
| 3.8 SMTP | `PO_GATED` | Unchanged |
| 5.2 Ingestion | `PARTIAL` | **#494 is now merged** at `c7fb9f0f`. Local disposable proof only. No application INSERT. Gate G still open. |
| 5.5(b) Observability vendor | `PO_GATED` | Unchanged |
| Providers / TW-8 | `PO_GATED` | Unchanged |

#497 text that still calls #494 open is stale. The **ingestion classification stays `PARTIAL`**.

---

## 3. Sequential checks

| ID | Scenario | Execution | Outcome |
| --- | --- | --- | --- |
| S1 | Multi-stage create → position order → day/item → mobility → dates | **Executed** unit tests | Holds, with TW6 `unassigned` and protected commercial dates |
| S2 | Registry materialize → later registry edit | **Executed** + source trace | Snapshot does not silently mutate |
| S3 | Peer credentials → route change → stale/unknown | **Executed** | No preferred passport. Official stays unavailable |
| S4 | Guest adopt → retry/failure | **Executed** | Happy path holds. Invalid draft silent (`nichts`) |
| S5 | Archive → restore → conflict | **Executed** | Fail-closed without provenance; optimistic guard |
| S6 | Unavailable auth/data/provider | **Executed** + source | #500 honest HTML 503. Official not_required not claimed from empty rows |

Details: `docs/evidence/v1-trip-account-revalidation-1/sequential-checks.json`.

---

## 4. Findings

No new P0/P1 trip/account integration break was proven on this head.

### 4.1 New residual

#### TA-N1 — Protected commercial item date stays after trip date shift; attention does not name the mismatch

- **Class:** FACT + INFERENCE / RISK / RECOMMENDATION  
- **Severity:** P3 (user-truth after change; not a provider activation)  
- **FACT:** `zeitraumVerschieben` continues past `istKommerziell` items (`anwenden.ts` L172–175). `anwenden.test.ts` asserts `dayDate` moves and `startsOn` does not. `lib/trips/attention.ts` aggregates readiness/official/safety/seasonal only.  
- **INFERENCE:** After “shift the trip by a week”, a selected/protected activity can sit on a day whose calendar date no longer matches the item date. That is the accepted protection contract, not a license to rewrite commercial fields.  
- **RISK:** User believes the item moved with the trip, or believes the day is commercially current.  
- **RECOMMENDATION:** Add an attention/workspace signal for `startsOn/endsOn` ≠ owning `dayDate` on protected items. Do **not** move the dates. Do **not** start TW-8.  
- **Vs #498:** New. Hunter did not attack this sequential change.  
- **Contract that must not change:** `geschuetzt` commercial fields stay frozen.  
- **PO gate:** None for a presentation signal.  
- **Confidence:** High on the code/test fact; medium on product severity.

### 4.2 Known still-open residuals that this revalidation confirms

| ID | Severity | Still current? | Treat as |
| --- | --- | --- | --- |
| RH-2.1 invalid guest draft → `nichts` | P3 | **Yes.** Tests + `GastreiseBruecke` L73–75 | Candidate TA-R1 |
| RH-4.1 legacy singular fallback | P3 | **Yes.** Path still present | Candidate TA-R3 |
| RH-12.2 stale Foundation-E comment | P2 continuity-in-source | **Yes.** | Same slice as TA-R3 (comment only if fallback stays) |
| RH-5.1 / RH-6.1 official aggregate helpers | P3 latent | **Yes, still unused / dormant** | Not first. Harden before official-provider activation |
| #497 PO_GATED rows | P0–P2 launch, gated | **Yes** | Not this writer; not repair scopes here |
| 5.2 ingestion | PARTIAL | **Yes** after merged #494 | Persistent writer remains closed |

### 4.3 Closed / non-findings this slice must not reinvent

- RH-1.1 / #500, RH-3.1 / #502, RH-10.1–10.2 / #504  
- Happy-path guest→account (`uebernahme` 54/54)  
- Dual-Authority / no default passport  
- Archive provenance fail-closed  
- Scoped export, account error boundary, AP-3/AP-4, AP-7 S1–S4, AP-10-S1 existence  
- Official empty ≠ `not_required` on the engine/destination-essentials path  
- TW-8/TW-9 still blocked on real commercial/provider truth  

---

## 5. First useful next repairs

Exactly **three** bounded ungated honesty repairs are justified. They are specified in `docs/V1_TRIP_ACCOUNT_REVALIDATION_1_NEXT_SLICES_2026-09-21.md`.

They are **not** started here.

If Technical Lead wants zero product slices until legal/SMTP/provider gates move, that is also a valid reading: those gates are the actual V1 launch blockers, and they are not missing engineering capacity on this branch.

Do not invent AP-8/9/11/12, a day-stage editor, registry live-sync, TW-8, or a second generic audit to fill a quota.

---

## 6. Traveller-context check

Relevant. This revalidation attacked Multi-Traveller / Multi-Citizenship / Multi-Document seams.

Result: happy-path peer options hold; no default/preferred passport inference in production UI/domain; registry→trip is explicit copy; readiness fingerprints all credentials. Residual is the degraded Foundation-E fallback (RH-4.1) and latent official-summary helpers (RH-5.1 / RH-6.1). No new identity model was proposed.

---

## 7. What this slice did not do

- No `app/`, `components/`, `lib/`, tests, styles, scripts, package, supabase, workflow, operating-mode or global continuity edit.  
- No Production / remote DB / real-user / provider / model / secret / payment / account / email / factor action.  
- No browser Preview proof.  
- No implementation of TA-N1 or any known residual.  
- No Ready, merge or follow-up.

---

## 8. Stop

Freeze after STATUS / HANDOFF / SELF_REVIEW. Exact-head CI / Auth / Vercel IDs belong in a PR comment.

**STOP FOR TECHNICAL-LEAD FUNCTIONAL REVIEW.**
