# Jetnity Widgets Origin Isolation Foundation 1 — SELF-REVIEW

**Stand:** 29 October 2026. **Author review only.** This is not an independent Technical-Lead PASS, not Ready, and not merge approval.

## Scope check

Writes are limited to `apps/widgets-host/**`, `scripts/widgets-origin-foundation-1/**`, and the five `docs/JETNITY_WIDGETS_ORIGIN_FOUNDATION_1_*_2026-10-29.md` files other than the immutable task. The task file was not modified. Root `next-env.d.ts` was dirty at session start from a dev type-path drift and was restored before the plan comment. It is not part of this change.

#1084, #1086, and #1089 were read for ownership and were not edited. No vendor HTML or script was copied.

## What holds

- One response function. Routes and the proxy call it without reading Cookie, Authorization, Host, Origin, query, or the body.
- Unit tests pass forged secrets through that function and assert they are absent from the body and headers.
- The HTTP matrix repeats that proof on a production `next start`, including method, trailing slash, framework paths, and host spoof.
- CSP `frame-ancestors` is `'none'`. The host is not an embed yet.
- The origin contract hard-codes `subdomainIsolatesCredentials: false` and a function that can only return `false`.
- The source scan fails if production files gain a vendor host, script, iframe, form, button, cookie API, redirect, `process.env` read, CORS header, or absolute URL.
- Dependencies are exact pins. `npm ci` reproduced the lock with 0 audit findings.
- The build no longer selects the repository root as Turbopack's workspace.

## What this review does not prove

- Production TLS, the certificate, Infomaniak DNS, or Vercel project `prj_Qq4i6dNt3hlSbQDpr2LrRaSKOQsk` were not read in this session. Earlier Technical Lead infrastructure notes stay the external record. They are not re-proved here.
- No production `Set-Cookie` attributes were read. The parent-domain cookie risk is a contract, not a measured inventory.
- Consent #1087 / #1089 is not accepted by this host existing.
- Root GitHub CI and any `jetnity-app` Preview were not green evidence at authoring time. They cannot prove this app, because CI does not run `apps/widgets-host` `npm test`.
- Local `eslint .` after `next build` in this app fails: generated `apps/widgets-host/.next/**` is outside the root ignore `.next/**`. The directory is gitignored and current CI does not build it before lint. I did not widen the root eslint config.
- Next still writes a script-bearing `/_not-found` build artifact. The tested server hides it behind the proxy. A future edit that removes the proxy, or a static file server pointed at `.next`, would expose framework JavaScript. That JavaScript is Next's, not DiscoverCars or 12Go. The synthetic test is what locks the current behavior, and root CI does not run that test.
- The Next server bundle contains framework cookie parsers. Live responses did not set cookies. I am not claiming the framework binary is free of the word cookie.
- Tests and the scanner are excluded from the production token scan because they contain the forbidden patterns as assertions. A hostile string placed only in a test is not served. It would also not be caught by the scan.
- No browser, no click, no 320/390/768/1440 layout check, no personal browser (#748).
- `check:schema-bezug` passed after the host and scripts were staged. The docs were not in the index for that run. They do not call schema RPCs.

## Decision

Safe to hand to the Technical Lead as a Draft source foundation. Not safe to link Git, deploy, change DNS, or describe `widgets.jetnity.com` as a live isolated credential origin.
