# V2-S2 Traveller and Preparation Clarity 1 — Self-review

Author only. Session `bc-a62482f0-b662-484a-b2a4-ca39b15ea410`. Model `grok-4.7-high-fast`. This is not an independent Technical Lead PASS.

## Checked

- Stored headcount wins for 2 travellers with 0, 1, or 2 profiles. The partial case text contains `2 Reisende` and a separate profile count. It does not say `1 Reisende Person`.
- Profile count is `party.length` only. Tests include citizenships and labels and assert they do not appear in the header text.
- `party.length` greater than `travellers`, and `travellers` of 0, leave `anzahl` null and do not claim either total. The same unsettled sentence is what preparation shows. A known headcount of 1 does not show `MEHRERE_REISENDE_HINWEIS`. A known headcount above 1 does.
- `Reisevorbereitung.tsx` no longer mentions `individualClaimsForbidden`. That flag remains in `lib/readiness/status.ts` for summary consumers and was not retuned.
- `Status ändern` is a separate button. Mounted Guest and Account tests at 320 and 390 focus it from the keyboard, move to Erledigt, and see no write until `Speichern`. Saved status stays `open` until then. Existing title-edit, barrier, retry, and late-confirmation tests still pass.
- Production-CSS harness at 390 and at 320 with root 32px found no horizontal overflow after the status editor was opened from the keyboard, and the status choice did not write.
- `npm run build` exited 0 on the implementation head.
- `check:exports`, `check:dead` and `check:deps` passed after `kopfzahl` was made internal. That function is not a second public headcount API.

## Not accepted by this review

- Full `npm test` was not run.
- CI and Vercel Preview on the tip were not read back here.
- 32px is an injected root font size in headless Chromium, not native zoom, a phone, or a screen reader.
- Screenshots are author evidence. They do not replace Technical Lead acceptance.
- A snapshot with headcount 2 and 3 profiles is treated as unsettled, so it does not receive the definitive multi-person sentence even though both numbers are above 1. That is deliberate honesty about the contradiction, not a claim that the trip has one traveller.
- `1 von 2 Profilen vorhanden` counts stored profile records. It does not say those profiles are document-complete.

## R1-F1

Review `5671376977` is correct. The shared `docs/ACTIVE_WORK_STATUS.md` block was outside S2 ownership. It is restored to blob `2c87fdf8c4814695b3bb67a3bc61900325f4f56d`. Task-owned handoff carries the slice status. Runtime files are unchanged from `47e46d75`. The mounted and CSS runs were not repeated.

## Stop

No Ready. No merge. No follow-up slice. No extra path beyond the owned traveller, header, and preparation files, their close tests, and this packet. Shared status stays with Root.
