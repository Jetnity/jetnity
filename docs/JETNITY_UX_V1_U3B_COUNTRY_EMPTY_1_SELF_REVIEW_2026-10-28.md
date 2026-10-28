# UX V1 U3-B — SELF-REVIEW

Author review only. This is not a Technical Lead PASS. R1 on `2e58485b061ffe78c666d03c486072ff6313d228` is corrected in the following commit. That rejected head is historical.

## R1

- The CH-DE harness allowlist is an exact two-id map. `destinationRenderModul` throws for every other id, including `destination-essentials`, `katalog`, `react`, and a padded copy of the helper path. The helper binding is the module the test runner imported, checked by function identity. The unavailable/unknown checklist assertions in the original render test were not edited.
- `countryLabel?.trim()` is gone. A label that differs from `label.trim()` has no signature, so `' Thailand '` is not stored as `'Thailand'` and two padded copies do not group with each other or with the catalog label. `trim()` remains only as that inequality check.

## What holds

- Grouping reads the existing `DestinationEssentialZiel` projection. It does not call `destinationEssentialsAbleiten`, does not sort, and does not mutate stage objects.
- A signature requires a catalog ISO code already in uppercase, a non-empty identical label, `keine_evidence`, `unvollstaendig === false`, no entry details, no entry links, and the exact engine empty sentence. `required`, `conditional`, `not_required`, `unknown`, `unavailable`, `stale`, `insufficient_context`, option/traveller splits, and any other text stay ungrouped.
- Dates, names, place ids and coordinates are not part of the signature. Repeated Bangkok rows stay separate stage ids.
- Null or non-catalog country codes never join a group. An unknown place named Panama is not relabelled Panama City.
- Safety and season render on every stage in a shared run, including their details and links. Warning and source counts are attributes of the owning stage.
- Guest and account are the same function of the same projection. There is no second renderer.
- The compact path still requires every domain of every stage to be truly empty. A shared entry run is full density.
- `tsc --noEmit` and the focused tests listed in STATUS passed on this working tree. The mounted script aborted non-document requests.

## What this review does not prove

- Native App/Auth CI and Vercel Preview for the delivery head. Those start after push and are not inherited from the seed.
- A real `/trips` guest or account session, a physical device, VoiceOver, or browser zoom at 200 percent. Root font-size 32px was applied to the synthetic document. The shared sentence computed at 28px. The pre-existing 11px domain labels do not scale with the root font.
- Work A01–A16. Synthetic screenshots are not that QA.
- That a global same-country bucket would be rejected by the Product Owner. The contiguous-run reading is documented in the handoff because the task forbids collapsing a reentry. It is still a review point.
- PostgreSQL was not required and was not claimed.

## Residual presentation note

`ZielQuellen` still opens “Quellen und Details” whenever `hatHinweise` is true, even if a fixture domain has a non-empty lage and no detail rows. The real safety and season builders emit one detail per evaluation, so this is not a new empty-state collapse. It was not changed, because changing that rule is outside the empty-entry grouping.
