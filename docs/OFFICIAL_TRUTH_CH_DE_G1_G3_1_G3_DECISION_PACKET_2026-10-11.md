# G3 Bern — stopped preflight and finite TL decision packet

Author: **Jetnity Official Truth CH-DE G1 G3 Preflight 1 — Codex Generation 1**.
Draft #931 / #930; parent #917 remains OPEN / SOURCE_NOT_QUALIFIED.

**CAPTURE_BLOCKED. Actual origin attempts: 0.** No capture start/end time,
completed byte count, response metadata, source hash, snippet or original body
exists from this task. Whole-response identity/privacy/legal checks are NOT_RUN.
The Owner's one-attempt permission was not consumed by an HTTP request. This
handoff does not authorize a later attempt by another task.

## Exact existing blocker

Fixed candidate: https://bern.diplo.de/ch-de/service/visumundeinreise/2611474-2611474
(source family: German Embassy Bern / Auswärtiges Amt, research candidate only).

`official-truth-content-identity.ts` compiles only
`govuk-eta-national-list-content-api-en@1`. The existing dormant Bern pin is
`de-bern-embassy-research-only / bern-visa-entry-2611474@1 /
bern-visa-entry-html-de@1 / de-bern-entry-page-unqualified@1`.
`createContentIdentityGraph` refuses that tuple with **profile_unavailable**
using the real default registry. No Bern profile is inserted or supplied.
At the retrieval layer an absent matching profile also fails before DNS/HTTP;
invalid catalog reconstruction may surface as `catalog_failed`, not as an
observed origin response. The new offline test proves the earlier graph gate.

`officialTruthChDeSourceBudget128k1` requires the exact approved compiled profile
object and all source/item/representation/URL/media pins; it returns null here.
The live 131072-byte entitlement is restricted to the privileged server-owned
path with no injected catalog. The isolated developer seam stays at 65536 bytes
and requires an injected profile. Reusing the old S1/S2 quarantine or inventing a
Bern profile would cross G3-03 and is expressly forbidden. Neither was done.

Static transport review found the existing fixed HTTPS GET on port 443,
public-address checks and same-request pinned lookup, TLS SNI/certificate
verification, per-hop source/representation allowlist, five-hop maximum, fixed
identity encoding/cache headers, ten-second default deadline, bounded whole
stream, UTF-8/BOM/charset refusal and no cookies/credentials/JS execution. These
protections are unchanged. Existing synthetic transport tests exercise redirect,
DNS, timeout, size/stream failure, compression and encoding refusal. They do not
prove the current Bern response's properties. No new executable capture runner
exists, so ordinary tests/CI cannot trigger the approved real-source capture.

## Smallest decision needed from the independent Technical Lead

Choose whether to authorize a separate, exact **research-only quarantine seam**
within the existing retrieval module, plus its tests and finite compiled research
configuration. Do not register a real approved identity profile just to inspect
an unqualified source. Proposed requirements for that separately scoped work:

- One code-owned Bern URL/host/media pin, no caller URL/profile/header/DNS/cap;
  explicit developer opt-in, at most one attempt and no automatic retry/CI import.
- Reuse the same internal HTTPS/DNS/TLS/redirect/timeout/UTF8/whole-body guards.
  Separately decide the research-only 131072-byte entitlement; do not silently
  grant the privileged approved-source budget to injected profiles.
- Keep the research outcome type disjoint from server-owned official retrieval,
  Evidence, hashes, custody and acceptance. No public endpoint, source admission,
  trusted retrievedAt or legal validity. A completed response remains research.
- Inspect the bounded full response only in memory. Return finite sanitized
  categories/counts; never return/store/log raw bytes, snippets, full headers,
  staff names, cookies, identifiers or embedded script metadata. No JS execution.
- Offline proofs before any live opt-in: exact target/no injection, redirect and
  SSRF refusal, pinned socket, full-response/truncation/compression/UTF8 limits,
  consent/cookie absence, zero retention/printing, one-call cap and fail-closed
  output under every error. Independent TL review before an actual attempt.

This is a design packet, not implementation or a request to waive any gate.
Current G3 work stops. No follow-up slice is started.

## Remaining substantive decisions

Full-response publisher/item/locale/canonical identity and dynamic variation,
privacy/analytics/scripts/media rights and licensing remain unverified. Legal
review must distinguish Swiss-national entry treatment from residence procedures
and generic third-country 90/180 rules, verify ordinary-passport applicability,
purpose/duration/exceptions and current legal text. No legal validFrom/validUntil
or source freshness is asserted. G4 hosted reconciliation/apply, G5 real protected
acceptance, G6 accepted reader/refresh/provider/Workspace activation and G7 remain
reserved; #913 remains separately blocked. Raw-source retention and #865 D01–D12
are not approved by the ephemeral research grant.
