# GetYourGuide Manual Widget Integration 1 — STATUS

Date: 26 October 2026.
Writer: Jetnity GetYourGuide Manual Widget Integration 1 — Cursor Generation 1.
This status is not a Root PASS, not Ready, and not a merge.

## Runtime receipt

Observed at this reporting point from cursor-cloud `run-info`, field `originalModelName`: `grok-4.7-high-fast`. Metadata source is that tool result, not a guessed label. Run `source` is `scm`. Session `bc-a2ac7c66-900d-4ad0-9fd1-dfe692d10f50`, https://cursor.com/agents/bc-a2ac7c66-900d-4ad0-9fd1-dfe692d10f50. Logical name on the run: Jetnity GetYourGuide Manual Widget Integration 1 — Cursor Generation 1. No Auto fallback was selected.

Stage: Technical-Lead R1 is implemented on this same Generation 1 session. The corrected head is the branch tip that contains this file. Its SHA is in the PR body after the push. Root’s task revision `3eddc72ade423afa1dd5109f3bbd625014495f7e` stays an ancestor. `origin/main` fetched on 27 October 2026 is still `7d52da97efc1f40fbea5c07d978c2e81e6b76659`. Merge-base is that commit. Before this correction the branch was 9 ahead and 0 behind. GitHub Actions run 40418657518 remains the gate of `dd6f972d` only.

Concrete blocker: offer-card clicks in this session land on GetYourGuide URLs that keep `partner_id=2MQHT6Z`, and the latest bodies are the provider outage page. The latest Lisbon Ray ID on this corrected run is `a510b081d99d3e6e`. Earlier Ray IDs, including `a50d22a04b76bdc9`, stay separate observations. Root’s separate test-browser `net::ERR_CERT_AUTHORITY_INVALID` was not reproduced here and is not used as a sandbox or certificate-bypass reason. No vendor inquiry.

## State

The manual search widget is implemented on `feat/getyourguide-manual-widget-integration-1`, Draft PR #1041, tracking #1040, parent #1023 V5. The application loads the official activities widget only after an explicit visitor action. The query is the confirmed public place name plus the catalog country label, or the country label alone for a country without days. The document is `/embed/getyourguide`. Direct opens stay inactive.

The delivering review head is the branch tip that contains this file. Its exact SHA is recorded in the PR body after the last commit of this delivery. `origin/main` read on 26 October 2026 is `7d52da97efc1f40fbea5c07d978c2e81e6b76659`, tree `608321f4a8813adf1de23c3132039d39f9c27e98`. Merge-base with that main is the same commit. The branch was 1 ahead / 0 behind before these implementation commits.

## R1 correction

The height script that measured document scroll height, wrote that value onto the provider frame’s parent, and remembered only the maximum is replaced. Root’s reproduction of 1116→1292px and the stuck 1100px after a shrink to 400px belongs to that script, SHA256 `70eb95959f7e6172f3640a033c0f5a98a7e28a3431dc09d613a792e1ba0845ee`. The 1187px outer frame and the 32px remainder are historical measurements of that script.

The replacement reads only the explicit pixel height the provider loader writes. It does not write that style and does not keep a maximum. The parent still accepts only `{ quelle: 'jetnity-gyg-rahmen', art: 'hoehe', px }` from the current iframe at origin `null`, integer 1 to 2400. The active CSP hash is `sha256-7l6jKj7GuYrEhMz6eSTGsEYmIyXjLcO292wkNpWkfn8=`.

A synthetic Playwright run with the real script, 8px body margin, and no provider request held the outer frame at 1100px for 24 samples over 6 seconds while document scroll height stayed 1116. It then followed 400px for 8 samples and returned to 1100px for 8 samples. At 1280, 375 and 1280 again the outer frame stayed 1100, the ancestor did not clip it, and no host other than 127.0.0.1 was requested. Node on this machine was 22.23.4. That run is synthetic geometry, not provider acceptance.

On the real Lisbon widget after this change, fresh geometry after a 1.5s settle was outer 495px at 1440, 1173px at 375, and 495px again at 1440. Each matched the provider loader’s explicit style. Three cards were present at each width. At 375 the card bottoms were 363, 742 and 1121. The outer frame and the embed document were both 1173px, so the third card fit. The overflow-hidden ancestor was 1801px and did not cut the frame. This is not the earlier 1187px observation.

The proof now also waits for an exact place id, ignores a late answer after A→B→A, rejects a mismatched id, shows a synthetic load failure and retry, drops a late load after unmount, and keeps a second instance after the first is removed. In the same activities section a native “Synthetische Bootsfahrt” stays visible while its adoption is pending, then shows “Die Übernahme wurde gemeldet.” after resolve. Removing GetYourGuide leaves that card and that message. No GetYourGuide request happened during those synthetic steps.

The embed frame’s attempts to read the parent document, URL, cookie and localStorage each threw `SecurityError` from origin `null`. The canary was not in those reads. Context requests, including popup navigations, were scanned in URL, headers and body. `kanarienLecks` is empty. Nine collector requests remain, so telemetry is not zero. `gygPAStatus` stayed `loading` on `127.0.0.1`. That is not Analyzer initialization.

The load notice and the Jetnity privacy paragraph now say the Analyzer measures the widget’s display for GetYourGuide. They do not certify that measurement. ADR-0222 now limits the `credentialless` cookie observation to browsers that implement it and to the framed Chromium check. A first-party cookie on the first-party route in another browser is not by itself a provider leak.

The latest offer clicks still open GetYourGuide’s outage page with `partner_id=2MQHT6Z` and no H1. Ray IDs from this run: Lisbon `a510b081d99d3e6e` (`et=430238`, `q=Lissabon+Portugal`), Crete `a510b16f6e543e6e`, Portugal `a510b2573fa93e6e`. The proof exits 1 for that outage. It is not a search list and not TASK V1 section 9.3. Earlier search-list and Arrábida observations stay separate. Preview Fetch Metadata, paint and eligible-host Analyzer remain unchecked. No Ready and no merge.

## What is shown

Public Lisbon, Crete and Portugal loads showed provider images and named offers inside the isolated frame. Before the load action the proof recorded zero GetYourGuide requests. Removal, a switch to Crete, and a switch back to Lisbon did not revive the old frame. The native synthetic card stayed. A parent canary in the URL, title, DOM and storage did not appear in the embed URL, the embed HTML, or captured provider URLs. With `credentialless`, the framed embed request did not carry that cookie.

## V2 boundary

TASK V2 addendum `3eddc72ade423afa1dd5109f3bbd625014495f7e` replaces only the mandatory selected-product-detail destination for this slice. A search list opened from an offer card, with `partner_id=2MQHT6Z`, is the bounded navigation result. It does not satisfy TASK V1 section 9.3 and does not close parent #1023 V5. The visible sentence is: “Ein Angebotsklick kann zunächst eine Ergebnisliste bei GetYourGuide öffnen. Dort wählst du dein Angebot aus.” An outage page stays an outage. On `127.0.0.1`, `gygPAStatus` stayed `loading` across three ticks while the offers were visible. That hostname is excluded by the Analyzer’s own host filter, so this is not Analyzer initialization evidence. `collector.getyourguide.com` was requested. `sessionStorage` in the opaque document throws `SecurityError`. No uncaught provider exception was observed on these ticks.

Root’s eligible-host probe of the original Work query `San Blas Panama` opened `/s/` with `q=San Blas Panama`, visible H1 “San Blas Panama”, 62 results, and `partner_id=2MQHT6Z`. All three card anchors used that search route. That is a search list. It is not TASK V1 section 9.3 and it does not close #1023 V5.

The same search route appears on this branch’s Lisbon, Crete and Portugal cards. The anchors are `/s/?et=…&q=…&partner_id=2MQHT6Z`, not a hand-built product registry:

- Lisbon `q=Lissabon Portugal`: `et=935537`, `et=430238`, `et=212667`. See-all was `lissabon-l42` and was not used as the card target.
- Crete `q=Kreta Griechenland`: `et=419006`, `et=1288737`, `et=412901`. See-all was `santorin-l753`.
- Portugal `q=Portugal`: `et=623626`, `et=593912`, `et=391326`. See-all was `sintra-l99`.

Clicking the first card of each case in the latest proof kept `partner_id=2MQHT6Z` and opened the provider outage page, title “GetYourGuide – Error”, no H1. Ray IDs: Lisbon `a50d22a04b76bdc9`, Crete `a50d238deafabdc9`, Portugal `a50d24757dc9bdc9`. Earlier Ray IDs include `a50cf48ddecf22ce` and `a50d03fc3fa6ad68`. An earlier Lisbon load in this session showed “From Lisbon: Arrábida and Sesimbra Full-Day Tour” at the search-shaped URL; that screenshot was overwritten. The outage is an outage. A highlighted row on a search page is not TASK V1 section 9.3. The proof exits 1 for that reason. No purchase was made.

Root then ran two original-snippet controls. Card navigation follows the provider’s upstream `activity.href`. This isolation document does not replace that address. No direct-product switch is implemented. Location 42 and product 492343 are not stored in the application.

- Lissabon location 42: three cards. The selected card was “Sintra, Pena, Regaleira, Cabo da Roca & Cascais”. The landing was `/s/` with 500+ Lisbon results and that offer highlighted first. `partner_id=2MQHT6Z` remained. No visible H1 within 20 seconds. Report SHA256 `17c62cb2327d5fad7ba51331fe7b8af2797b83c4cbe6d3508f960c32ef6c6b77`.
- Product 492343: one card, “Tour zu den San-Blas-Inseln mit Inselhopping”. The click opened `/s/?q=Panama+City`, H1 “Panama City”, 437 results, with the selected offer highlighted first. Partner preserved. Report SHA256 `1343f5ca078b8f197770309e96a61b46ca4a146e6a701d8b595ec92b0f8eba2f`.

Both controls had zero captured private-canary matches, zero external requests before explicit load, the same child across resize, and only the parent frame after remove. Analyzer `sessionStorage` errors repeated, 29 and 10. Rendering and navigation continued. Root’s fixed-height fixture clipped lower mobile cards. That fixture is not this candidate’s layout result. The 1187px measurement above is the candidate proof.

Root’s screenshot qualification stays separate from any one file. In the earlier q run the final desktop PNG was blank while three DOM images had loaded. Desktop rendering was seen in the 22:25 eligible-host run, and the clicked first q card was in the final mobile PNG. For product 492343 the first desktop PNG and the mobile PNG show the card. A later desktop screenshot from the same instance is blank. Candidate paint stability on Preview for this head is still unchecked.

At 375px the three Lisbon cards stack. Their anchor bottoms were 354, 724 and 1094. Before the height message the outer iframe stayed 640px and hid the second and third cards, while the provider frame had grown to about 1171px. The embed document now posts only `{ quelle: 'jetnity-gyg-rahmen', art: 'hoehe', px }` with an integer from 1 to 2400. The parent applies it only from that iframe’s `contentWindow` and only when `origin` is `null`. After that message the outer iframe was 1187px, the ancestor was 1791px with `overflow-y: hidden`, and the iframe did not extend past the ancestor. The provider frame’s client and scroll height were both 1203px, which contains the third card. About 32px of the embed document (scroll 1219 versus client 1187) remained below the outer iframe at the moment the cards already fit. No product payload is accepted on this channel.

## Boundaries

No database, RLS, Auth, Places, native activity search, secret, contract, payment, or new infrastructure. `ACTIVE_WORK_STATUS.md` was not edited because it is outside the task allowlist. The historical harness `scripts/getyourguide-visual-discovery-1/` still expects the closed foundation and is not this slice’s proof.
