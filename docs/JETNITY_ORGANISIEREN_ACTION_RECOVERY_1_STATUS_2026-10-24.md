# Organisieren Action Recovery 1 — STATUS

Date: 24 October 2026
Author: **Jetnity Organisieren Action Recovery 1 — Cursor Generation 1**
State: R1 review fix committed, awaiting a new independent Technical-Lead exact-head review. Draft. Not Ready. Not merged.

- Session: `bc-9156e555-e2b3-4e47-9b8a-1bfa65fc2bfa`
- https://cursor.com/agents/bc-9156e555-e2b3-4e47-9b8a-1bfa65fc2bfa
- Model: `grok-4.7-high-fast`
- Branch: `fix/organisieren-action-recovery-1`
- Issue #992, Draft PR #995
- Base main: `913cf9353fd33491d2bd3130b3c430cc88990200`
- Merge-base: that same main SHA. Behind: 0.
- Plan commit: `a1093d53feebe9586b0351ade1ab786d95230bb5`
- Reviewed head that received CHANGES REQUIRED R1: `48fd52dad48583871948ce804aecb9063e7e2410`
- R1 runtime/proof commit: `143b4976c221eab56a35a872ae0d54f32e69174d`
- R1 runtime tree: `26e4a8ba2d2db56f0961d753a7dc9cb2f662641e`
- Ahead of main before this docs commit: 5. Exact final HEAD, including this docs update, is recorded in the PR comment so this file does not chase its own SHA.
- TASK V1 blob `6db7bbecc3eaecc744569bbe74951342ff7f778e` unchanged.
- Mode NORMAL. Traveller context is not relevant: no citizenship, document, or visa inference.

## What landed

Booking status for flight, stay, connection, and rental now shares one local lifecycle. A second click in the same inventory does not call the callback. Domain error, rejection, and throw clear the busy state and show a fixed message. Success does not flip the seal; the parent trip remains the booking truth. Trip change, item disappearance, and unmount drop ownership so a late completion cannot write into the next context.

Manual rental locks its ten controls for the owned save. Errors keep the values. Success resets only that form and keeps the Nutzerangabe sentence. A trip change does not clear a newer draft.

`ManuelleVerbindung` stays byte-identical (`10fe6c8f0ec2bb976a53678ac3df9b100bcafe55baa97a72f4081a22bb368360`).

## R1 disposition

Owned booking buttons now use one block-level class, `BUCHUNG_AKTION_KLASSE`, on every assigned and unassigned path. The label wraps inside the button. At 320px and root font-size 32px, DOM Range rects sit inside the button border box for idle, pending, recovered, and domain-error labels (`maxExcess` 0). Lifecycle behavior is unchanged. The connection-form overflow and the rental auto-focus P3 are unchanged disclosures.

## Next step

Independent Technical-Lead exact-head review. Do not Ready, merge, close #992, or start a follow-up.
