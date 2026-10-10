# Official Truth source-bound 128KiB Evidence/custody V2.1 — CONTRACTS

## Version rules

| Path | Protocol selection | Identity behavior |
| --- | --- | --- |
| Existing V1/unknown Evidence calls | Existing 65,536 UTF-16 source hash remains unchanged for V1 material | Existing `identity_schema=2`, V1 `ev2_*`, lookup keys, and rows remain byte-compatible |
| Private full HTTP response | Selector verifies decoded UTF-8 byte count equals actual complete transport byte count; V1 only within the legacy byte/unit bounds; V2 only within both 131,072 bounds | Protocol 2 is fingerprinted with exact source/item/representation/profile identity and must pass the compiled source gate |
| Retrieved material / Evidence candidate | Recompute the shared UTF-8 byte/unit selection; never trust supplied digest or version | Oversize without code-owned profile authorization fails closed; V1 omits the discriminator |
| Accepted Evidence | Closed V1 field set unchanged; V2 field set adds only `sourceFingerprintProtocol: 2` | Protocol values 1, unknown values, and V2 field omission are rejected; accepted/candidate protocol must match |
| Integrated-pilot history | Closed identity parser accepts exact old field set or exact V2 field set | V2 discriminator participates in reconstructed canonical identity/version; old artifacts are not upgraded |

## Custody authority

The new SQL migration is repository-only and unapplied. It pin-gates synthetic V2 proof and accepts the complete body transiently; it does not persist the raw snapshot. Local synthetic PostgreSQL proof is structural only. No Bern/AA profile, source registration, accepted legal Evidence/Rule, or visitor result is authorized.

## Remaining verification limits

Same-request/review/extractor modules carry protocol 2 and re-prove the fingerprint. The new-head trusted-store test passed 22/22, including a disposable PostgreSQL proof. The serial suite remains red from an unresolved concurrent integrated-pilot bundle writer (`55P03`); it also exposed an outdated local-RPC inventory assertion, fixed and verified 4/4 standalone but not yet rerun in the full suite. GitHub CI is action-required with zero jobs; Auth and Preview are unverified. No end-to-end real-source or positive legal-result claim is made.
