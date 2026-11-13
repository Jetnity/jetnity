# M04 Recovery V31 — independent Root source review

**Disposition: SOURCE-ONLY ACCEPTED FOR IMMUTABLE PACKAGE REVIEW; runtime and release gates pending.** Root independently reviewed candidate `b54ae82183fc5f91b02b2ac17f277a3e72cad704` against `b01cd488c6d652129a2b8baa23b1a88b812a2111`. Agent self-review is input, not TL release PASS. Independent reviewers `/root/ch_de_release_gate_audit` and `/root/ch_de_method_readiness` found no concrete admission/output counterexample.

## Actual source and scope

Only SQL +6/-8 lines and exact original Native restoration +1/-204 lines change in the author candidate. Root read and hashed all 18 protected sources: aggregate `f9f0bfaf2476692119f63e474bb61988bc0d50bb3c4518b96ee4987ef56e40e2`, 2395-byte sorted manifest. The other 16 source pins remain exact. The complete original Native blob is `0b3f7d9906687ec42171de5af60fed009d07b39f` / 191098 bytes / SHA256 `f5d849c643ff22d264bc9adc1a7cd65f12caaac80a804647604851f22effbde0`.

SQL is `7021673c611b0b2cc5dc62cbd5dccb92e5024837` / 160983 bytes / SHA256 `0d2210d84c02aacbeef1c8e14b38e7be6c2e3e8c387057fd97666fb00c71bba4`. Root compared the whole source outside canonical_v1 and all 29 declaration/modifier/security/search_path headers, including the three SQL RETURN-body declarations. They are exact. Both positive emitters are byte-identical, together 1533 bytes / `47caf82957d823b9b955d6fb75049c2ae998ef2d9b0d3ffda79b767de9f1fe4a`; the full original fallback is 7778 bytes / `85028ed221c72b4f0979223dad8d7665f72a1a07a4eb3ea3a7f31ea0ca52a679`.

## Independent conservative-subset argument

The unchanged prerequisites restrict this path to a nonempty object, d<24, at most 8192 bytes, no backslash and the same printable-ASCII guard. Actual JSONB output places a quoted object key immediately before colon-space. The new C-collated pattern inspects that structural boundary, rejecting arrays, -0 prefixes, at least 16 integer digits or a decimal point after the optional-sign integer portion.

Any array below an object root has a first array ancestor whose parent is an object. Its true member boundary is therefore detected; arrays cannot hide behind arrays. Once arrays are excluded, every numeric value is an object member. Its true boundary catches every numeric class rejected by the former residue checks. Removing string tokens cannot join numeric fields across surviving commas, colons or containers. The unchanged whole-text guard against "{," remains. Thus a new positive admission is also an old safe positive admission.

This is a **subset**, not exact selector equality. A key/string beginning with ": [" / ": -0" / ": 1234567890123456" / ": 18.0" can match at its opening quote and take the fallback. These are conservative additional refusals, not false admissions.

## Output equivalence, recursion and error preservation

An actual nested object necessarily has the marker used by the new flat-versus-recursive selection, so it cannot accidentally enter the flat emitter. A string beginning with ": {" can instead send a genuinely flat object through the unchanged recursive emitter. It still emits root opening, exactly one scalar member token each in C ordering, and root closing. Direct children have depth at most 24; the unchanged whole-text "{," guard prevents replacement inside content. The output equals the flat emitter.

The unchanged fallback itself recursively calls canonical_v1; merely freezing its text is insufficient as a proof. Equivalence follows by structural induction on smaller JSONB subtrees: every new positive return is old-positive-equivalent, and every additional refusal follows the same fallback logic with equivalent child results/errors. This also covers arrays and non-ASCII/escaped parents whose smaller object children may reach the selector.

Fifteen-digit signed integers are within the safe range. Sixteen-digit values, including safe endpoints, retain fallback; unsafe values retain rejection. Scaled integer and fractional values retain fallback normalization/rejection. Quote/backslash and non-ASCII cases retain the same guards. Empty roots return only after the unchanged argument checks. At depth23 primitive/empty-object children at24 remain valid; nonempty object depth24 is rejected by the same validation/fallback. Nonempty roots at24 use fallback; depth25/negative/NULL reject before selection. The 8192-byte boundary, C sorting, wire/node/duplicate-key contracts and all errors remain unchanged.

Primary references read by Root: [PostgreSQL JSONB numeric output](https://www.postgresql.org/docs/16/datatype-json.html#JSON-INPUT-OUTPUT), [official JSONB output source](https://doxygen.postgresql.org/jsonb_8c_source.html) and [PostgreSQL regex syntax](https://www.postgresql.org/docs/16/functions-matching.html#FUNCTIONS-POSIX-REGEXP). This is textual reasoning, not project/parser/SQL execution.

## Evidence and limits

The complete R39 profile is reconstructed from its two immutable comments: 85663 bytes / SHA256 `0cb1be5978cecef8ac4917d28a705466fa260193955f9ee98bf6dbc625b5f866`. Root rechecked all 12 snapshots / 348 rows / 29 identities, fields, null semantics, numeric validity and monotonicity. Complete Native and companion receipts, the original formal review and original log identities are in [the V31 evidence record](M04_RECOVERY_R39_EVIDENCE_AND_R40_PLAN_V31.json). R38 failed at24/31 within the unchanged240s frame; R39 passed31/31 with the same SQL plus profiling and remains diagnostic-only.

The new selector removes repeated token-stripping/allocation/scans. Its actual time benefit is not measured. Conservative false positives can add fallback/recursive cost. No CPU claim, controlled comparison or safety margin is inferred from the old profile.

## Root integration and next gate

Root alone adds five current pointer blocks, a new M04 handoff prefix retaining the entire preceding handoff, this review/task/evidence triplet, and the two narrowly scoped operating-standard edits authorized by V31 v2. Prior V27–V30 files and every pointer exterior remain exact. No package/workflow/quotas/ACL/RLS/authority/hosted/source-window activation changes.

Generation4 is a new real session, not a resumed Generation3. The permanent succession exception preserves evidence, bounded scope and all independent re-gating. The historical human Stage1 Run2 is now accepted for observed fields, with ledger and Stage2 target gaps separately recorded in [#917](https://github.com/Jetnity/jetnity/issues/917#issuecomment-6812112217) and [#1139](https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6812118367).

First unfinished step: independently inspect the full immutable package and fresh main/expected head/ownership/rules/threads, publish once through the existing CI, then inspect all31 Native groups, full256/64/65 quotas, bothR9 witnesses,761/min4182 bounds, complete cleanup, six companions, type/lint/hygiene/build and exact Preview. Only a complete actual TL-PASS permits Root Ready/merge and fresh actual-main/Production verification. No unchanged-source rerun, local execution or repetition/copying of held #917/#1131 actions.
