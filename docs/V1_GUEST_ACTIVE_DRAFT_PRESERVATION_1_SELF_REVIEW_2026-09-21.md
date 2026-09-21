# Jetnity – V1 Guest Active Draft Preservation 1 SELF-REVIEW

Stand: 21. September 2026  
Status: **AGENT SELF-REVIEW ONLY / NOT TECHNICAL-LEAD PASS**

Agent: **Jetnity V1 guest active draft preservation 1**, Generation 1  
Session: `bc-7b2ee7bd-2aa2-4b83-bbf0-4d88eb19bfad`  
Required and actual model: Cursor Grok 4.6 High Fast (`originalModelName=cursor-grok-4.6-high-fast`)

Reviewed TL comments: 5768184284 (GP-R1/R2), 5768307752 (authorized main merge), 5768634081 (GP-R3), 5768808875 (GP-R4 continuation of the exact-290c336 review).

---

## Held

- Occupied but unusable active v3 bytes are not free capacity.
- Missing active + valid legacy occupies `/planen` and action-time create **before** model/place/create. Occupancy lives in `gastspeicherCreateBelegungLesen` and reuses `ausLegacy` read-only.
- Missing active + throwing Legacy-key `getItem` is `speicher_unlesbar`. Successful malformed Legacy bytes stay non-cleanup / not occupied. Both persistence functions refuse that unreadable slot without writing.
- Missing active + migration-accepted Legacy without persisted string id is `belegt_ohne_kennung`. Repeated observations stay occupied without an id. Create/network/persistence are blocked; no `/reisen/` Continue. Loader migration policy is unchanged.
- Loader still skips legacy normalization when active is invalid or storage is unreadable.
- `gastreiseAnlegen` and `gastreiseAblegen` re-preflight and reject without writing on invalid/unreadable active.
- Valid legacy migration, one-active-trip, same-ID Ablegen retry and #517 adoption remain.
- PlanenCreateGate titles come from occupancy, not `gastspeicherLaden`.
- 360/200% headings reflow; viewport/full-page evidence is 360px wide; overflowX false. #528 TripPlanner/Reiseidee layout classes untouched.
- Mounted Reiseidee + TripPlanner submits after late legacy inject: 0 model/place/create calls. Adoption is not reachable because idea is blocked before a proposal.
- Account create stays independent of guest storage. Account files came only from merged main `65db24b6`.
- Traveller context is not relevant; no credential collection.

## Smallest required expansion

- `lib/trips/uebernahme.test.ts` fixture only. Adoption runtime not edited.
- `GastCreateLink` still calls `gastspeicherLaden`. Reported, not edited.

## Residual / not claimed

- Generic list/CTA may still show `aktiv: null` for unreadable bytes. They do not authorize `/planen` create.
- Valid-legacy first paint may migrate via the unowned nav loader. Create gate/action-time do not require that write.
- Malformed legacy/queue cleanup remains out of scope.
- Screenshots are synthetic compiled CSS. Not Preview/hardware/Safari/WCAG.
- Exact-head CI / Auth / Vercel belong in the PR receipt after freeze.

## Verdict

Ready for independent Technical-Lead exact-head re-review. **Not Ready. Not merged. No follow-up slice.**
