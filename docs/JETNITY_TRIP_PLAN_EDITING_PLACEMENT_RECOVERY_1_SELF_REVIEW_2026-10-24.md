# Trip Plan Editing and Placement Recovery 1 — SELF-REVIEW

Date: 24 October 2026
Author: **Jetnity Trip Plan Editing and Placement Recovery 1 — Cursor Generation 1**
Session: `bc-ddd91109-9dd1-4ed0-b554-c9c9d5b3888d`

This is the author's self-review. It is not an independent Technical-Lead review and it is not PASS.

## Scope check

The diff against `origin/main` `0c37d318c47a758f06634448d6e0de3856bbc6a6` is TASK V1, the plan, the plan surface, the editor, the local lifecycle hook, `gastPlanpunktEntfernen` plus one import, the pure helper, the node test, and the mounted harness. The docs commit adds the status set and the evidence directory. No Account writer, schema, migration, workflow, package, or sibling lane is included.

TASK blob `42b124f5f68172aaa51365b028bb22772d362dcc` matches the immutable file. The accepted plan blob `98e6d31842647176400b0ae4cfa9ed62b0c87a71` gained only the no-op clarification the Technical Lead required for implementation. Current plan blob: `b0665bc1f6309c590c4cb6d6d9e673a3cc54c436`.

## Code review V1

A-P2-CODE-01: the delete alert used operation identity and ignored a newer editor. The repair adds a focus token taken when the editor opens, a save starts, or a delete starts, and again on day or trip change. I kept the error visible. The mounted reproduction leaves the title input focused. The older delete-error focus test still passes when no newer editor is open.

A-P2-PROOF-02: the guest-delete assertion now checks the target node and the stored item, plus the surviving items and revision. The unmount case leaves the request pending, unmounts, then resolves that id. The counter increases by one. A second resolve of the same id does nothing. No page error was observed. That matches the earlier independent control: the product path was already returning when the form was gone.

A-P2-PROOF-03: callback records are addressable. R1 late success and late error leave R2 busy, with its draft unchanged, until R2's own id completes. Same-id content and placement changes keep revision, `updatedAt`, and `rowVersion`. Save and Cancel are the measured controls. While R2 is saving, the browser moves focus to `body` because the submit button becomes disabled. R1 does not move that focus onto the plan alert. I did not add a focus trap for the disabled state.

## What I would still question

- Domain equality uses `JSON.stringify` with `rowVersion` removed, as the accepted plan requires. A reloaded Account item whose keys are ordered differently from `punktAendern`'s spread would not match, even when every field matches. The mounted Account fixture builds that item from `punktAendern`, so it does not prove `planpunktAus` key order. I did not switch the item compare to the key-sorted guest helper, because that would widen the accepted rule.
- `warteAufBestaetigung` ends on the next committed render of this form. If no newer trip arrives, the form becomes editable again and does not claim success. A later graph can still close that same operation while the submit draft is unchanged. That is the null-then-graph path. Edits after recovery stop it. I checked both in the harness.
- Guest delete can still lose a write that lands in the frozen setter's read-to-set gap. The test records the bytes left behind and does not call that a rollback.
- `npm test` includes native PostgreSQL proofs. On this machine those fail because `initdb` is absent or `local_proof_connection_override_forbidden` is raised. They are outside this slice. I do not treat that environment failure as a pass, and I do not treat it as a regression in the plan editor.

## Not claimed

Hosted Account, Production, device, screen reader, Preview, App CI, and Auth CI are not accepted by this review. Draft stays Draft.
