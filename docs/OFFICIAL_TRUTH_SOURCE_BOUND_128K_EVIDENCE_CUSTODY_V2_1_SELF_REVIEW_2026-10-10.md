# Official Truth source-bound 128KiB Evidence/custody V2.1 — SELF REVIEW

- V1 hashing function and historical identity serialization were not edited. Protocol 2 is emitted only after byte/unit selection and code-owned identity checks; private retrieval also verifies that decoded text re-encodes to the measured transport length.
- Accepted Evidence exact shape remains closed. The only V2 addition is `sourceFingerprintProtocol: 2`; missing, `1`, and unknown values do not become V2.
- Integrated-pilot parsing keeps the old exact V1 keys and separately accepts the V2 key set. No automatic historical upgrade is introduced.
- The real Bern/AA profile remains absent. V2 source acceptance is therefore blocked in production paths; synthetic local SQL behavior is not regulatory evidence.
- Limitations: the serial suite ended 6,273/6,275. The stale local-RPC inventory assertion is fixed and passes standalone; the concurrent integrated-pilot writer failure (`55P03`) remains unresolved, with no timeout increase. Trusted-store PG16 tests passed 22/22, but complete V2 accepted-Evidence replay is not proven. Final CodeQL/review, remote CI/Auth/Preview, and positive authorized V2 acceptance/readback are incomplete. This is not a PASS.
