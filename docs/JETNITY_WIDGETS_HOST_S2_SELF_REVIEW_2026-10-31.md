# Jetnity Widgets Host S2 — SELF-REVIEW

**Stand:** 31 October 2026. Author review only. Not an independent Technical-Lead PASS.

## Holds

- Frozen bytes were hashed before copy and matched the task. A later test reads the artifact files and the embedded strings and requires them to be equal.
- The production registry cannot return a selection while `selected` is false. The shell HTML test requires `"plans":{}` and no vendor host.
- The controller consumes a matching challenge only after the selector and artifact hash match, and it refuses a second grant.
- Playwright aborted `https://canary.test` rather than recording it. The route was installed before `goto`.
- Teardown used `iframe.remove()` on an element created with `document.createElement('iframe')`. The pending canary did not request after that.
- Root `eslint .` was run while `apps/widgets-host/.next` existed. Exit 0, 0 errors. The nested build output did not reintroduce the S1 lint failure.

## Does not hold

- I did not read Vercel project `prj_Qq4i6dNt3hlSbQDpr2LrRaSKOQsk`, DNS, or production cookies in this turn.
- The browser harness does not execute the page at `https://jetnity-widgets.vercel.app`. A high local port cannot satisfy the pinned origin without a certificate on 443. The Node tests pass those exact origin strings into the same controller.
- `frame-src` is still `'none'`. I did not invent a vendor frame allowlist.
- #1096 was not treated as stable. Nothing from `b1408bc679738ae05e691206c90a1e695c927ab1` was imported.
- Native CI for the new head is not claimed here.
- Author self-review is not merge approval.

## Decision

Ready for Technical-Lead review of the pushed head as dormant host source. Not ready to link Git, deploy, change DNS, or turn a registry entry on.
