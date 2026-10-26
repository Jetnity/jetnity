# GetYourGuide Manual Widget Integration 1 — STATUS

Date: 26 October 2026.
Writer: Jetnity GetYourGuide Manual Widget Integration 1 — Cursor Generation 1.
This status is not a Root PASS, not Ready, and not a merge.

## Runtime receipt

Observed at this reporting point from cursor-cloud `run-info`, field `originalModelName`: `grok-4.7-high-fast`. Metadata source is that tool result, not a guessed label. Run `source` is `scm`. Session `bc-a2ac7c66-900d-4ad0-9fd1-dfe692d10f50`, https://cursor.com/agents/bc-a2ac7c66-900d-4ad0-9fd1-dfe692d10f50. Logical name on the run: Jetnity GetYourGuide Manual Widget Integration 1 — Cursor Generation 1. No Auto fallback was selected.

Stage: implementation, proof, and the first handoff were already pushed at `8da4d3292a4d00afe2f57598043b2ff6f8164a21`. This receipt commit is rebased onto Root’s task revision `3eddc72ade423afa1dd5109f3bbd625014495f7e`. Its own SHA is the PR body after the push.

Concrete blocker: offer-card clicks in this session land on GetYourGuide URLs that keep `partner_id=2MQHT6Z`, and the latest bodies are the provider outage page. Ray ID on the latest Lisbon click: `a50d22a04b76bdc9`. Root’s separate test-browser `net::ERR_CERT_AUTHORITY_INVALID` was not reproduced here and is not used as a sandbox or certificate-bypass reason. No vendor inquiry.

## State

The manual search widget is implemented on `feat/getyourguide-manual-widget-integration-1`, Draft PR #1041, tracking #1040, parent #1023 V5. The application loads the official activities widget only after an explicit visitor action. The query is the confirmed public place name plus the catalog country label, or the country label alone for a country without days. The document is `/embed/getyourguide`. Direct opens stay inactive.

The delivering review head is the branch tip that contains this file. Its exact SHA is recorded in the PR body after the last commit of this delivery. `origin/main` read on 26 October 2026 is `7d52da97efc1f40fbea5c07d978c2e81e6b76659`, tree `608321f4a8813adf1de23c3132039d39f9c27e98`. Merge-base with that main is the same commit. The branch was 1 ahead / 0 behind before these implementation commits.

## What is shown

Public Lisbon, Crete and Portugal loads showed provider images and named offers inside the isolated frame. Before the load action the proof recorded zero GetYourGuide requests. Removal, a switch to Crete, and a switch back to Lisbon did not revive the old frame. The native synthetic card stayed. A parent canary in the URL, title, DOM and storage did not appear in the embed URL, the embed HTML, or captured provider URLs. With `credentialless`, the framed embed request did not carry that cookie.

## V2 boundary

TASK V2 addendum `3eddc72ade423afa1dd5109f3bbd625014495f7e` replaces only the mandatory selected-product-detail destination for this slice. A search list opened from an offer card, with `partner_id=2MQHT6Z`, is the bounded navigation result. It does not satisfy TASK V1 section 9.3 and does not close parent #1023 V5. The visible sentence is: “Ein Angebotsklick kann zunächst eine Ergebnisliste bei GetYourGuide öffnen. Dort wählst du dein Angebot aus.” An outage page stays an outage. On `127.0.0.1`, `gygPAStatus` stayed `loading` across three ticks while the offers were visible. That hostname is excluded by the Analyzer’s own host filter, so this is not Analyzer initialization evidence. `collector.getyourguide.com` was requested. `sessionStorage` in the opaque document throws `SecurityError`. No uncaught provider exception was observed on these ticks.

Root’s eligible-host probe of the original Work query `San Blas Panama` opened `/s/` with `q=San Blas Panama`, visible H1 “San Blas Panama”, 62 results, and `partner_id=2MQHT6Z`. All three card anchors used that search route. That is a search list. It is not TASK V1 section 9.3 and it does not close #1023 V5.

The same search route appears on this branch’s Lisbon, Crete and Portugal cards. The anchors are `/s/?et=…&q=…&partner_id=2MQHT6Z`, not a hand-built product registry:

- Lisbon `q=Lissabon Portugal`: `et=935537`, `et=430238`, `et=212667`. See-all was `lissabon-l42` and was not used as the card target.
- Crete `q=Kreta Griechenland`: `et=419006`, `et=1288737`, `et=412901`. See-all was `santorin-l753`.
- Portugal `q=Portugal`: `et=623626`, `et=593912`, `et=391326`. See-all was `sintra-l99`.

Clicking the first card of each case in the latest proof kept `partner_id=2MQHT6Z` and opened the provider outage page, title “GetYourGuide – Error”, no H1. Ray IDs: Lisbon `a50d22a04b76bdc9`, Crete `a50d238deafabdc9`, Portugal `a50d24757dc9bdc9`. Earlier Ray IDs include `a50cf48ddecf22ce` and `a50d03fc3fa6ad68`. An earlier Lisbon load in this session showed “From Lisbon: Arrábida and Sesimbra Full-Day Tour” at the search-shaped URL; that screenshot was overwritten. The outage is an outage. It does not contradict Root’s search-list result and it does not prove a product page. The proof exits 1 for that reason. No purchase was made.

At 375px the three Lisbon cards stack. Their anchor bottoms were 354, 724 and 1094. Before the height message the outer iframe stayed 640px and hid the second and third cards, while the provider frame had grown to about 1171px. The embed document now posts only `{ quelle: 'jetnity-gyg-rahmen', art: 'hoehe', px }` with an integer from 1 to 2400. The parent applies it only from that iframe’s `contentWindow` and only when `origin` is `null`. After that message the outer iframe was 1187px, the ancestor was 1791px with `overflow-y: hidden`, and the iframe did not extend past the ancestor. The provider frame’s client and scroll height were both 1203px, which contains the third card. About 32px of the embed document (scroll 1219 versus client 1187) remained below the outer iframe at the moment the cards already fit. No product payload is accepted on this channel.

## Boundaries

No database, RLS, Auth, Places, native activity search, secret, contract, payment, or new infrastructure. `ACTIVE_WORK_STATUS.md` was not edited because it is outside the task allowlist. The historical harness `scripts/getyourguide-visual-discovery-1/` still expects the closed foundation and is not this slice’s proof.
