# Official Truth JP fallback audit 1 report

Date: 6 October 2026. Issue #868 / Draft PR #870.

**JP_FALLBACK_SOURCE_NOT_READY**

## Delivered scope

Four documents record current official-source discovery, per-candidate semantic/identity/retrieval qualification, the gap matrix, findings and review handoff. The seeded TASK is unchanged. No runtime, registration, database or production operation is part of this delivery.

The [audit](OFFICIAL_TRUTH_JP_FALLBACK_SOURCE_AUDIT_1_2026-10-06.md) contains every exact direct-test URL, separately identified discovery-only official addresses, the authorities and substantive locators. Research labels below map one-to-one to that inventory, including query variants. No search snippet is Official Evidence.

## Git and execution evidence

- Current fetched main at preparation: `9adfc04ffe90693dedc059f07a396751a0625157`.
- Task seed: `67b34ef43b5db3b561fdf2f7f25b74c0c16aaa5e`.
- Branch: `docs/official-truth-jp-fallback-source-audit-1`.
- Preparation merge-base: `9adfc04ffe90693dedc059f07a396751a0625157`; seed relation 1 ahead / 0 behind.
- TASK blob: `be6767c7ce6c39c2f156fef6d876d93ad28079fe`.
- Codex Desktop session: `01a10e90-2e64-7be3-b409-5058846bc6ef`.
- Local `session_meta`/`turn_context` evidence: originator Codex Desktop, CLI `0.160.0`, model `gpt-6-astra`, effort `xhigh`, provider `openai`. No hidden/backend model identity is asserted.
- A separate checkout was used. No parallel writer's checkout or global continuity file was edited.
- Fresh #863/#866/#867/#871 remote Changed Files had zero overlap with this five-file family. Their unmerged designs are not dependencies of the audit conclusion.
- Final commit/push head, fresh main, relation, exact remote Changed Files and Draft state are reported in the post-push chat readback. No pre-push SHA or previous CI is presented as verification of that future head.

Exact PR file set relative to main (all added; TASK was seeded before this agent's delivery):

1. `docs/OFFICIAL_TRUTH_JP_FALLBACK_SOURCE_AUDIT_1_TASK_2026-10-06.md`
2. `docs/OFFICIAL_TRUTH_JP_FALLBACK_SOURCE_AUDIT_1_2026-10-06.md`
3. `docs/OFFICIAL_TRUTH_JP_FALLBACK_SOURCE_AUDIT_1_REPORT_2026-10-06.md`
4. `docs/OFFICIAL_TRUTH_JP_FALLBACK_SOURCE_AUDIT_1_HANDOFF_2026-10-06.md`
5. `docs/OFFICIAL_TRUTH_JP_FALLBACK_SOURCE_AUDIT_1_SELF_REVIEW_2026-10-06.md`

## Actual retrieval checks

**32 GETs / 21 distinct exact URLs / 32 HTTP 403 responses.** UTC window: `2026-10-06T08:19:09.144Z`–`2026-10-06T08:22:21.747Z` (10:19–10:22 Europe/Zurich). Eleven baseline/core candidates were repeated on fresh connections. All completed, 25–824 ms, with valid UTF-8 denial bodies, public DNS sets and authorized TLS. Every final URL equals its request; zero redirects observed and none followed. No successful regulatory body was obtained by this probe.

Method: Node 22.23.3 `node:https`; exact fixed HTTPS URLs; GET; port 443; fresh `https.Agent({keepAlive:false,maxSockets:1})`; default TLS verification/SNI; only explicit headers `accept-encoding: identity` and `cache-control: no-cache`; no Cookie/Authorization/custom User-Agent. A copied, unchanged baseline public-IP predicate checked all `dns.lookup({all:true,verbatim:true})` answers and the vetted answers were supplied to the socket lookup. The 10,000 ms deadline and 65,536-byte declared/streaming cap were unchanged. No credentials, proxy origin, browser spoofing, app catalog, DB or Supabase call was used.

The scratch client collected complete short 403 bodies for diagnosis. The live application rejects those statuses; these hashes are **not** source/Evidence hashes or approved identity pins. The client did not implement catalog admission or redirect following, so it is a compatible immediate-transport probe, not an end-to-end Jetnity acceptance test. The initial sandbox Git DNS failure was resolved by an approved network execution path; it is not counted among the official-source results.

### Direct receipt ledger

All rows: HTTP 403; completed=true; allPublic=true; TLS authorized=true; redirectCount=0; no Content-Encoding, Set-Cookie or WWW-Authenticate observed. Response media is `text/html`, except J01/J02 `text/html; charset=utf-8`. Akamai rows use TLSv1.2; ISA and JapanGov use TLSv1.3. The byte count and SHA-256 cover the **complete unencoded received error body**, not a page excerpt. These particular error bodies have the same SHA after Jetnity newline normalization; no general equivalence of raw and normalized hashing is implied.

| Receipt | UTC start | UTC finish | Bytes | ms | Server | Bound socket | Raw body SHA-256 |
| --- | --- | --- | ---: | ---: | --- | --- | --- |
| R01-1 | 2026-10-06T08:19:09.144Z | 2026-10-06T08:19:09.236Z | 431 | 91 | AkamaiGHost | `2a02:26f0:f3:886::3ead` | `7c46849e111191e7242539f01a1fe1a174710125b0266a72ecb9dc4fa120dccd` |
| R04-1 | 2026-10-06T08:19:09.236Z | 2026-10-06T08:19:09.271Z | 418 | 35 | AkamaiGHost | `2a02:26f0:f3:886::3ead` | `6f9f5d8ea6e8209622138cf1d6d8c9b7a4c70d449f789895e66627e9db984735` |
| B01-1 | 2026-10-06T08:19:09.271Z | 2026-10-06T08:19:09.363Z | 443 | 92 | AkamaiGHost | `2a02:26f0:f3:889::3653` | `e6d840ddaa472712bc20cd9a5e4ac37d2db732269c1a2d473c553dad26f57b07` |
| B02-1 | 2026-10-06T08:19:09.364Z | 2026-10-06T08:19:09.401Z | 441 | 37 | AkamaiGHost | `2a02:26f0:f3:889::3653` | `bc280abe7d16cd2f96c415237187382e426765ad5736efda925d74d8c0f443b4` |
| B03-1 | 2026-10-06T08:19:09.401Z | 2026-10-06T08:19:09.454Z | 423 | 53 | AkamaiGHost | `2a02:26f0:f3:889::3653` | `ca7c54b2f98754442cfe4e77ccd8fd8f45b213968d8ca9016e471f22efbc95e3` |
| G01-1 | 2026-10-06T08:19:09.454Z | 2026-10-06T08:19:09.530Z | 426 | 76 | AkamaiGHost | `2a02:26f0:f3:889::3653` | `8b80de71cfe39ac35c9439fb9b3abae526061c27b34378f48d37047a9c7aedab` |
| G02-1 | 2026-10-06T08:19:09.531Z | 2026-10-06T08:19:09.572Z | 436 | 41 | AkamaiGHost | `2a02:26f0:f3:889::3653` | `e6a1811946893d0c411c69fbee59d357c078bcd83488838a87d9f6452f166e57` |
| U01-1 | 2026-10-06T08:19:09.573Z | 2026-10-06T08:19:09.639Z | 427 | 66 | AkamaiGHost | `2a02:26f0:f3:889::3653` | `c1f97bbc9a0f6619113aec50d54a7e33f49fcb54da9cdf0a9add0041cd3f22d6` |
| U02-1 | 2026-10-06T08:19:09.640Z | 2026-10-06T08:19:09.697Z | 427 | 57 | AkamaiGHost | `2a02:26f0:f3:881::3653` | `923b4f567455d469e77c642083c17ed477115a7bba2809a900d11e6381a82e93` |
| I01-1 | 2026-10-06T08:19:09.697Z | 2026-10-06T08:19:09.763Z | 919 | 66 | CloudFront | `2600:9000:20a5:7800:14:1ad4:ff00:93a1` | `d60be541e15394d95a429e9f9cb29aefcdf63482ade6b9e2f3b8eaa2bc3bfd35` |
| I02-1 | 2026-10-06T08:19:09.763Z | 2026-10-06T08:19:09.801Z | 919 | 38 | CloudFront | `2600:9000:20a5:7800:14:1ad4:ff00:93a1` | `f58f8173ea4ccb00cfc3edb126109631489f7d3c3685cc40a9d78bd7b8f16158` |
| L01-1 | 2026-10-06T08:20:15.378Z | 2026-10-06T08:20:15.492Z | 438 | 113 | AkamaiGHost | `2a02:26f0:f3:886::3593` | `5a52c5aa2e4daeed8790b4172acf1e0329c97d50636cebca6ebb0460298166de` |
| J01-1 | 2026-10-06T08:20:15.492Z | 2026-10-06T08:20:16.316Z | 113 | 824 | AmazonS3 | `2600:9000:20a5:3c00:2:a509:7880:93a1` | `627bf02af392782b4deaee472a7f091e6b54600d1eb0dbb949297102a19c12a4` |
| R02-1 | 2026-10-06T08:20:16.316Z | 2026-10-06T08:20:16.348Z | 425 | 32 | AkamaiGHost | `2a02:26f0:f3:886::3ead` | `d0fdb631662bb4e4fec34ebe285e3fe04df653dee8b3e643ce77d915e4a7602a` |
| D01-1 | 2026-10-06T08:20:16.348Z | 2026-10-06T08:20:16.433Z | 529 | 85 | AkamaiGHost | `2a02:26f0:f3:887::3596` | `3d89cf87efdd1382084da9132486619bf0ae4e38c1a92328bfa2bf90f1173e5a` |
| B04-1 | 2026-10-06T08:20:16.433Z | 2026-10-06T08:20:16.465Z | 434 | 32 | AkamaiGHost | `2a02:26f0:f3:881::3653` | `7337989352077087dfea4c2d80a4badca21703fcc3bcec9ac3df860c2cc3d580` |
| M01-1 | 2026-10-06T08:20:16.466Z | 2026-10-06T08:20:16.500Z | 431 | 34 | AkamaiGHost | `2a02:26f0:f3:886::3ead` | `850c7c2cc74cd469d3aae24f8138fe2c4d6e9cbd5f6c25125a5a854b82b5b3bf` |
| T01-1 | 2026-10-06T08:20:16.500Z | 2026-10-06T08:20:16.532Z | 452 | 32 | AkamaiGHost | `2a02:26f0:f3:886::3ead` | `943a2fe9e506f9dd7ed6d5c38368f00fe91255e4ed455fda8497aa189e122b61` |
| I03-1 | 2026-10-06T08:22:21.223Z | 2026-10-06T08:22:21.261Z | 919 | 38 | CloudFront | `2600:9000:20a5:7800:14:1ad4:ff00:93a1` | `2b671168ec7953939e347df49ac8d40fefce6c38dfabea245e6ec10de59a6051` |
| I04-1 | 2026-10-06T08:22:21.261Z | 2026-10-06T08:22:21.287Z | 919 | 26 | CloudFront | `2600:9000:20a5:7800:14:1ad4:ff00:93a1` | `4e1a49f0324bcfaf1a768dc71b17576053316aa367753bc593e26770ff981a68` |
| J02-1 | 2026-10-06T08:22:21.287Z | 2026-10-06T08:22:21.318Z | 113 | 31 | AmazonS3 | `2600:9000:20a5:7e00:2:a509:7880:93a1` | `627bf02af392782b4deaee472a7f091e6b54600d1eb0dbb949297102a19c12a4` |
| R01-2 | 2026-10-06T08:22:21.396Z | 2026-10-06T08:22:21.437Z | 429 | 40 | AkamaiGHost | `2a02:26f0:f3:886::3ead` | `d5ff4dd5845e870e61da250d8dfd967a49fd7443f157b307e2f033d9695f40ba` |
| R04-2 | 2026-10-06T08:22:21.437Z | 2026-10-06T08:22:21.468Z | 416 | 31 | AkamaiGHost | `2a02:26f0:f3:886::3ead` | `775d541571b39da108b1bab247ad854055dd849179f1f82eebca583ec38bb3f9` |
| B01-2 | 2026-10-06T08:22:21.469Z | 2026-10-06T08:22:21.499Z | 443 | 30 | AkamaiGHost | `2a02:26f0:f3:881::3653` | `05015feef82808853dc73d62462cfb669c84f10864de015d64f22af8a6d63ebd` |
| B02-2 | 2026-10-06T08:22:21.499Z | 2026-10-06T08:22:21.531Z | 441 | 32 | AkamaiGHost | `2a02:26f0:f3:881::3653` | `32180548ee4f5fb4cff3b7efb273572f1990c38c7a123e8c49ac03e5f139daea` |
| B03-2 | 2026-10-06T08:22:21.531Z | 2026-10-06T08:22:21.560Z | 423 | 29 | AkamaiGHost | `2a02:26f0:f3:881::3653` | `6d602dcf30bb559261dec5ec890b19c7b18fe808efd4935e74c79fe0ac405426` |
| G01-2 | 2026-10-06T08:22:21.560Z | 2026-10-06T08:22:21.590Z | 426 | 30 | AkamaiGHost | `2a02:26f0:f3:881::3653` | `332806210a69bffd0bf4b2e7881b2b2e5e4f7eaa61afb45be1d208b4adffa493` |
| G02-2 | 2026-10-06T08:22:21.591Z | 2026-10-06T08:22:21.621Z | 436 | 30 | AkamaiGHost | `2a02:26f0:f3:881::3653` | `4d7e00328d1b19ff2809c0a5c3104b174a225895c28795bcd06413adf2f15b55` |
| U01-2 | 2026-10-06T08:22:21.622Z | 2026-10-06T08:22:21.658Z | 427 | 36 | AkamaiGHost | `2a02:26f0:f3:881::3653` | `7a26944df3b4f49ca11fa7775cb836856e9a23442e570fd70584afc4d08bc223` |
| U02-2 | 2026-10-06T08:22:21.658Z | 2026-10-06T08:22:21.690Z | 427 | 31 | AkamaiGHost | `2a02:26f0:f3:881::3653` | `e0cc4e0c9ae5d8fc11432b1f79342f68d2edf7d780df33b1db85cc70b79b150f` |
| I01-2 | 2026-10-06T08:22:21.690Z | 2026-10-06T08:22:21.722Z | 919 | 32 | CloudFront | `2600:9000:20a5:7800:14:1ad4:ff00:93a1` | `a88b935946bb00311bbc2d0bb142439ee6878a4952ee16949ab68f38a85ba465` |
| I02-2 | 2026-10-06T08:22:21.722Z | 2026-10-06T08:22:21.747Z | 919 | 25 | CloudFront | `2600:9000:20a5:7800:14:1ad4:ff00:93a1` | `efb9b6e74b3999e8837fdfab7f6c45629c2783356a71b71b6ac062cc625f7bd3` |

No denial body supplies a current legal page's size. The audit separately records the three complete browser-decoded sizes and their compression, dates and capture limitations. Normal-browser controls were B01, I01 and ISA's old/new/query country-list path sequence. An initial cross-origin CDP body capture lacked a usable body and was not counted as a completed receipt; subsequent reloads provided the three reported complete captures. No new headless or intended deployed-egress test was run.

### Public DNS observations

All answers for each request passed the unchanged public-IP guard before connection. The following union per host makes the observed network scope explicit; it is diagnostic data, not a future static IP allowlist. The actual selected address for each receipt is above.

| Host | Observed DNS answer union |
| --- | --- |
| `www.ch.emb-japan.go.jp` | `2.20.17.37`; `2a02:26f0:f3:881::3653`; `2a02:26f0:f3:889::3653` |
| `www.do.emb-japan.go.jp` | `2.19.66.137`; `2a02:26f0:f3:887::3596`; `2a02:26f0:f3:88c::3596` |
| `www.geneve.ch.emb-japan.go.jp` | `2.20.17.37`; `2a02:26f0:f3:881::3653`; `2a02:26f0:f3:889::3653` |
| `www.japan.go.jp` | `143.204.55.114`; `143.204.55.6`; `143.204.55.93`; `143.204.55.99`; `2600:9000:20a5:2200:2:a509:7880:93a1`; `2600:9000:20a5:2a00:2:a509:7880:93a1`; `2600:9000:20a5:2c00:2:a509:7880:93a1`; `2600:9000:20a5:3600:2:a509:7880:93a1`; `2600:9000:20a5:3c00:2:a509:7880:93a1`; `2600:9000:20a5:4400:2:a509:7880:93a1`; `2600:9000:20a5:4e00:2:a509:7880:93a1`; `2600:9000:20a5:5200:2:a509:7880:93a1`; `2600:9000:20a5:7e00:2:a509:7880:93a1`; `2600:9000:20a5:9600:2:a509:7880:93a1`; `2600:9000:20a5:a200:2:a509:7880:93a1`; `2600:9000:20a5:a400:2:a509:7880:93a1`; `2600:9000:20a5:b000:2:a509:7880:93a1`; `2600:9000:20a5:c400:2:a509:7880:93a1`; `2600:9000:20a5:cc00:2:a509:7880:93a1`; `2600:9000:20a5:f800:2:a509:7880:93a1` |
| `www.la.us.emb-japan.go.jp` | `2.19.66.135`; `2a02:26f0:f3:886::3593`; `2a02:26f0:f3:88e::3593` |
| `www.mofa.go.jp` | `104.77.19.97`; `2a02:26f0:f3:881::3ead`; `2a02:26f0:f3:886::3ead` |
| `www.moj.go.jp` | `143.204.55.104`; `143.204.55.105`; `143.204.55.21`; `143.204.55.8`; `2600:9000:20a5:1600:14:1ad4:ff00:93a1`; `2600:9000:20a5:2c00:14:1ad4:ff00:93a1`; `2600:9000:20a5:6a00:14:1ad4:ff00:93a1`; `2600:9000:20a5:7400:14:1ad4:ff00:93a1`; `2600:9000:20a5:7800:14:1ad4:ff00:93a1`; `2600:9000:20a5:7e00:14:1ad4:ff00:93a1`; `2600:9000:20a5:8c00:14:1ad4:ff00:93a1`; `2600:9000:20a5:d200:14:1ad4:ff00:93a1` |
| `www.uk.emb-japan.go.jp` | `2.20.17.37`; `2a02:26f0:f3:881::3653`; `2a02:26f0:f3:889::3653` |

## Validation and limits

Mechanical checks completed: **PASS** for the exact allowed-file set, unchanged TASK blob, UTF-8/local Markdown links, all 21 probe URLs present in the audit, all 32 ledger bodies/counts/digests recomputed, and byte-identical copied guard predicate. `node scripts/operating-mode-guard.mjs`: **PASS**. Whitespace checks passed; the staged diff is checked again immediately before commit. Scratch probe SHA-256: `5582820d8a9c579d90e0106238bc716260331e07db084521e800bf950092aea6`. The helper is not a repository deliverable or production implementation.

No runtime tests, typecheck, full lint/hygiene suite or production build were run locally: no runtime/test/config/schema file changed. Existing tests were read to reconstruct invariants, not reported as newly passing. GitHub CI/Preview, if present after the authorized push, belongs to that exact pushed SHA and is reported separately. No environment installation or paid provider call was needed. No database/SQL/migration execution, source/profile/extractor/policy change, accepted Evidence/Rule, F8, CH-11, Production change or follow-up occurred.

Findings: P0 none; P1 JP-F01 transport and JP-F02 complete current semantic support remain open; P2 JP-F03 identity/path qualification and JP-F04 currentness/scope reconciliation remain open; P3 no additional finding. These are pilot-readiness findings, not authorization to fix runtime or activate anything. Browser headers/body text do not close them.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
