# Official Truth CH→DE Compact Primary Source Feasibility 1 — CONTRACTS

**Status:** PHASE A NOT EXECUTED (live network unavailable in agent sandbox) / SOURCE_NOT_QUALIFIED / RESEARCH_ONLY
TASK blob `f14ff315daa02097ab89f816d04929d742be6c58`, base `main@c3db56a4021904aa21c25d75d218f91ee1127697`, issue #923, parent #917.

- CS02/CS04: no change to retrieval, evidence, profile registry, limits (65,536 bytes / 65,536 UTF-16 chars).
- Quarantine verifier ALWAYS refuses; `completeBodyBytes` is set only when the whole original body reached the verifier, else `null`.
- Output flags: `identityQualified/privacyQualified/legalQualified=false`, `acceptedOfficialTruth=false`, `productionActivated=false`.
- `requirementsProviderAus()` unchanged (null); no UI/store/Supabase wiring.
- Citizenship CH ≠ residence/issuer; `ordinary_passport`, purpose, route, validity and exceptions stay `research_gap`; `validFrom/validUntil=null`.
