# Independent C V3 runner — prepared, not yet executed

Usage after TL confirms the final head is the review target:

`node /tmp/jetnity-r105-c-v3-independent-runner/run.mjs /tmp/jetnity-EXACT-CHECKOUT FULL_EXPECTED_HEAD`

The runner refuses a HEAD mismatch before starting. Each execution creates a new unique `/tmp/jetnity-r105-c-v3-proof-*` directory. It preserves copies of the fixture/runner, source hashes, the exact head/tree, phase observations, screenshots, all page errors and blocked requests, and a result written with exclusive-create mode. Prior artifacts and tracked product files are never modified.

Bounded cases (nine individual executions):

1. Same-row newer open draft after old successful callback, before old graph.
2. Other-row newer open draft after old successful callback, before old graph.
3. Current save without newer interaction, normal matching graph.
4–9. Old A success/domain/reject × newer B open/closed while A callback is pending.

The matrix verifies exact B DOM control identity after A callback and, for success, after A graph. It also checks B draft/open state, absence of stale selected status, A success/readback truth or visible error plus preserved draft and released pending state.

Actual imported components, synthetic in-memory callback results, loopback-only HTTP, no hosted/account/database/provider access. No physical-device, native-zoom, layout or overall product PASS claim.
