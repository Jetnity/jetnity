# R109-T — Multi Stop Create Day Allocation 1 — SELF REVIEW

Date: 26 October 2026.

Writer: **Jetnity Multi Stop Create Day Allocation 1 — Cursor Generation 1**.  
This is author self-review. It is not a Technical-Lead PASS.

## P0

None found in the owned create path. No hosted write was attempted.

## P1

Hosted persistence of the new `stage_position` payload was not verified. The Account proof stops at the object passed to `reiseAnlegen` and at `createKontoTage` / `alsNutzlast`. A reviewer must not treat the mounted account case as `public.reise_anlegen()` acceptance.

Post-create Account assignment editing is still impossible through `reise_aendern`. That residual is unchanged and was not relabelled as done.

`scripts/next-16-4-1-security-patch-p1/historical-control.json` is outside the owned file list. Root's R1 addendum authorizes only the already-landed one-entry blob for `lib/trips/aktionen.ts`, from `4833378894aeedb152e093912574a698a9701b33` to `e0c03d9ea5fc1200774727e4b790511684020c86`. R1 did not edit that file, `aktionen.ts`, or the audit script. Protected pins and every other entry stay as reviewed. This is not blanket ownership of historical controls.

## P2

Date inputs use `appearance: none` so a 32px root font can sit inside 320px. Keyboard entry is what the mounted proof uses. A native calendar indicator may be quieter than the browser default.

The preflight sums item lengths up to the canonical 1000 plan points. It does not also cap that sum at 366. The 366 cap is the number of day containers. A valid day of 400 notes still passes the guard and still has to pass Zod. This matches the 1000-item total in the task. It should be confirmed against the phrase "sum at most 366 day-container item lengths".

`reiseAusNutzlastAnlegen` applies the same guard after authentication. Proposal takeover uses that function. The guard allows normal proposal sizes. The task's pre-parse claim is still only `reiseAnlegen` and `gastreiseUebernehmen`.

## P3

Claims are dropped, not shifted, when a destination key disappears or a date leaves the interval. A later return of the same key does not restore the dropped claim, because the cleared array is written back.

Single-destination creation still rejects an explicit claim. No-opt-in multi-stop stays `unassigned`.

Local PostgreSQL proofs in `npm test` fail closed in this session because the binaries are not installed. No OS package was installed. No hosted fallback was used.

## R1.1

The reviewed head built a capped 366-day list for 2026-11-01 through 2027-11-02 and the new summary called that cap the whole journey. Create, the form schema, guest storage, and the planner now reject that interval first. The mounted stand text for the 367-day case is “Dieser Zeitraum ist länger als erlaubt. Die Tage werden nicht gekürzt und nicht gespeichert.” Submit focuses `#feld-ende`. Guest storage stays empty. The account shim receives no call. A 366-day guest graph stores 366 days ending 2027-11-01. The account shim for that interval receives `endDate` `2027-11-01`.

`zeitraumDauer` is module-private. It had no caller outside `tage.ts`, and `check:exports` rejects an unused export. That visibility change is on the handoff commit, after the mounted run of `c17257ad`. It does not change the predicate.

## Author conclusion

R1.1 matches the required end state on the owned create path. Ready and merge stay with the Technical Lead after an independent exact-head review. Do not rebase onto `68435f01` until Root gives a separate integration instruction.
