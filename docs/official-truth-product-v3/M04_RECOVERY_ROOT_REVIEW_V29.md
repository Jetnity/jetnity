# M04 Recovery V29 — Root exact-source review and independent evidence

**Source review complete; immutable package, runtime, Ready and merge gates remain pending.** This record binds only the selected noninstrumented R38 proposal. It is not TL-PASS.

Root's binding task is [V29 v2](https://github.com/Jetnity/jetnity/pull/1184#issuecomment-6786124307). Same author/session: Jetnity Official Truth V3 Durable Jobs1 — Codex Generation3, /root/m04_durable_jobs_writer_g3. SQL161095B/868778c647464bf51ff179e39b86c2f4d6771cad07998165898f2f222e5fa84a; original native191098B/f5d849c643ff22d264bc9adc1a7cd65f12caaac80a804647604851f22effbde0. All authority/Owner stops and full runtime gates remain.

## Root independent source review

```json
{
  "schema": "jetnity.m04.r38.root-exact-source-review.v29",
  "reviewer": "ChatGPT Technical Lead / root",
  "reviewedAt": "2026-11-11T03:29:50Z",
  "sourceOnly": true,
  "sourceDisposition": "EXACT_SOURCE_SEMANTIC_REVIEW_NO_CONCRETE_BLOCKER_RUNTIME_PENDING",
  "baseline": {
    "head": "994eed7511d612db5158a2af77b5ad3d35f4b6c6",
    "sql": {
      "bytes": 161125,
      "sha256": "92ca2bf0c45c9e3702b2de63bf984d6a1f30b6fe4c9c3ee83de35ae470ab2d16",
      "blob": "9d15e032dea6dd9a5ab6cbb8537220f6fa23529e"
    }
  },
  "sql": {
    "bytes": 161095,
    "sha256": "868778c647464bf51ff179e39b86c2f4d6771cad07998165898f2f222e5fa84a",
    "blob": "1bb764344f22569dec9d3320667e0125d64c1cbf"
  },
  "twoUniqueEditSpans": [
    {
      "old": {
        "bytes": 118,
        "sha256": "c7fd81ba6006610d7158f3f7a6a244c1d88258e95bbbe82fc823634e68775bee",
        "blob": "476d0247cd62c305492c89cfdff16777032fa5dc"
      },
      "new": {
        "bytes": 137,
        "sha256": "424c10c5651e385a23449df3403fb95aa1d20d1c36f9e1ebd4bf718fac6745e0",
        "blob": "1290f5015341f99fcf5405d5d38e2f9891c0737d"
      }
    },
    {
      "old": {
        "bytes": 2439,
        "sha256": "ab7d7505269bc1b3a481ce275245c3a03b63416304c555fbe64b3847fed21157",
        "blob": "4564c3ed3c5c54198279d30d07c664ceca955d07"
      },
      "new": {
        "bytes": 2390,
        "sha256": "c45dc2dded64400243cf1f19f86cac9dfc354da1e5bff24e479e9b58585ebbfd",
        "blob": "590c35cf381daa0db868c81861eed31244bc0f5b"
      }
    }
  ],
  "exactSQLInverse": true,
  "scope": {
    "oldHeaders": 29,
    "newHeaders": 29,
    "allHeadersExact": true,
    "beforeCanonicalExact": true,
    "afterCanonicalExact": true,
    "fallbackExact": true,
    "initialRootGuardExact": true,
    "nativeInversePin": {
      "bytes": 191098,
      "sha256": "f5d849c643ff22d264bc9adc1a7cd65f12caaac80a804647604851f22effbde0",
      "blob": "0b3f7d9906687ec42171de5af60fed009d07b39f"
    },
    "headerExtraction": "All29 CREATE FUNCTION declaration lines plus full immediate LANGUAGE/modifiers/body-delimiter line; all bytes outside canonical separately exact"
  },
  "nativeInverse": {
    "steps": [
      {
        "index": 8,
        "unique": true
      },
      {
        "index": 7,
        "unique": true
      },
      {
        "index": 6,
        "unique": true
      },
      {
        "index": 5,
        "unique": true
      },
      {
        "index": 4,
        "unique": true
      },
      {
        "index": 3,
        "unique": true
      },
      {
        "index": 2,
        "unique": true
      },
      {
        "index": 1,
        "unique": true
      }
    ],
    "fullExact": true,
    "pin": {
      "bytes": 191098,
      "sha256": "f5d849c643ff22d264bc9adc1a7cd65f12caaac80a804647604851f22effbde0",
      "blob": "0b3f7d9906687ec42171de5af60fed009d07b39f"
    },
    "proofCount": 31,
    "originalNativeExact": true,
    "profilingAllRemoved": true
  },
  "sourceAggregate": "77f86edfbac0bbcf277913f1225f044fbbb11c22ac6f0ce0c65332d552864b13",
  "reasoning": [
    "Original SQL NULL/depth guard remains byte-exact and executes before the new object-only probe; all scalar/array roots go to the exact original fallback. Empty object direct return is identical for all valid root depths0..24; invalid/null depth still raises first.",
    "Raw text conversion is already present in R36. New probe is bounded to raw UTF8 bytes<=8192 and nonempty object with d<24. Any raw backslash declines before the quoted-token regexp. The original default-collation printable-character predicate is applied once to all raw text; success implies it passes for each admitted literal key/string substring. Unsupported default-collation regex still errors for this nonempty probe, or the unchanged fallback handles declined inputs.",
    "PG16 escape_json wraps strings/keys, escapes controls/quote/backslash, otherwise copies bytes. With any raw backslash excluded, no escaped quote/control/backslash can occur. The C-collated regexp quoted-token removal is unambiguous, including empty strings/keys. Its output is inspected only for eligibility and is not used as canonical output.",
    "PG16 JSONB numeric rendering calls numeric_out/get_str_from_var: finite numeric output is fixed decimal, not scientific exponent. No unquoted dot and no16-consecutive-digit run plus no-0 conservatively admits only <=15digit scale0 integers within9007199254740991. Their original numeric validation and trunc::text equal the direct scalar text.16digit safe endpoints, fractional/scale-positive/extreme values remain original fallback. Boolean/null tokens remain valid; no bare e/E test accidentally rejects true/false.",
    "Unquoted array opening declines any array anywhere. No unquoted nested object after the root opener means the flat path contains only scalar members. Nonempty JSONB object supplies at least one member, non-SQL-null key and non-SQL-null jsonb value, including JSON null, so ordered string_agg cannot drop a field. Direct quotes are exact under the whole-document guard; explicit C key ordering matches original.",
    "Nested path retains bounded recursive object walk with max absolute depth24. Parents expand only below24. Scalar or empty object at24 is valid; nonempty object at24 makes is_valid=false, prevents return, and exact original fallback raises its original error. bool_and terms are nonnull for every row; valid pieces are nonnull. Root opener plus closing tokens ensures a nonempty aggregate.",
    "Path sorting remains the R36 text[] C order, with null appended close token after real member-key descendants. Every keyed token receives one comma. Literal byte replacement of {, with { removes only an object's first-member comma because raw input containing {, was conservatively excluded and all admitted strings/keys retain their literal contents. Empty objects contain no keyed token; later sibling commas remain. This is not JSON parsing by regexp or acceptance of arbitrary raw text; input is already typed jsonb.",
    "Repeated equal objects are walked fully; no new cache or state survives one invocation. The exact original CASE fallback, its retained-object behavior, all28 other functions and all29 declaration/modifier headers, authority reads, ACL/RLS, catalog binding, locks, quotas and rollback remain unchanged.",
    "SELECT CASE expressions are within complete SQL statements; no CASE expression is introduced directly into a PLpgSQL IF condition. Literal delimiters, semicolons, recursive CTE column types, UNION ALL columns and INTO placement manually reviewed against the existing syntax. No parser/runtime execution performed."
  ],
  "primaryPostgresCommit": "c372fbbd8e911f2412b80a8c39d7079366565d67",
  "primarySourcePins": [
    {
      "path": "src/backend/utils/adt/array_userfuncs.c",
      "bytes": 44501,
      "sha256": "d73ddb943522601a1c774314b21778d78832aa501b0c0121ca239551c9bfb149",
      "blob": "5c4fdcfba4693dcf6d83047806bd62cbe3adfd1d"
    },
    {
      "path": "src/backend/utils/adt/jsonb.c",
      "bytes": 54882,
      "sha256": "d359e1bd6bbfab80ec57a2c4e080ebc616541e180aee997fa5675bef83d9efce",
      "blob": "cf43c3f2ded19aabd2a913ab914f84d6c70d3afc"
    },
    {
      "path": "src/backend/utils/adt/numeric.c",
      "bytes": 301100,
      "sha256": "50b364de513b14b2b341d5368366615f889b67661eb91eb559ac6e3089a53306",
      "blob": "3c3184f15b5692341342e2d720a09f906d74fba7"
    },
    {
      "path": "src/backend/utils/adt/regexp.c",
      "bytes": 55062,
      "sha256": "1f5e84ce76de7afe3145d942fe1e9dde7a1f061c5dce19fecb638ca910fb320e",
      "blob": "702cd52b6d429018e51c3167407c0128a2962fac"
    },
    {
      "path": "src/backend/utils/adt/varlena.c",
      "bytes": 167644,
      "sha256": "1ffb27166a88fdd65dfd30125f802f60eb20e9e3005d369a4bafe7b027dd844b",
      "blob": "b1ec5c32cede21998f6084039aa57655afdfbef0"
    },
    {
      "bytes": 43895,
      "sha256": "eedc0616b74a4673cbece06cdedff88962a412fd53e8850721f6193f95fa6db7",
      "blob": "7205f4adca81af77f0308294709e01f6be604a68",
      "path": "src/backend/utils/adt/json.c",
      "commit": "c372fbbd8e911f2412b80a8c39d7079366565d67"
    },
    {
      "bytes": 150652,
      "sha256": "d36a4e15730cd6afd2eac6e636ecdeb72755dfdd1d3b864b02c8f6a2dc480eda",
      "blob": "70cb922e6b7aa45629483bb64d3380d07a1e81a0",
      "path": "src/backend/utils/adt/jsonfuncs.c",
      "commit": "c372fbbd8e911f2412b80a8c39d7079366565d67"
    }
  ],
  "resourceAndPerformanceLimits": [
    "Targets the measured dominant canonical_v1 body, but does not establish actual speedup or sufficient remaining240s reserve.",
    "Adds empty-object comparison, raw-backslash/default-printable checks, one quoted-token replacement/copy and several bounded residue/raw scans per admitted call. Noneligible inputs can incur these checks before unchanged fallback; planner can reorder same-level safe AND checks.",
    "Flat success replaces three ordered array aggregates, per-key/value validation and fallback loop with one ordered string_agg; nested success removes the materialized encoded stage, lag/window sort and per-leaf regexp/numeric validation/key serialization while retaining walk, two token scans, one ordered string_agg and bool_and.",
    "Raw conversion occurs before8192 limit as before. Walk/output remain bounded by input and depth; not a CPU/IO plan or row-allocation measurement. No extension, new connection, host or runtime authority change.",
    "Existing tests are frozen; exact native inverse removes all profiling. Dedicated raw-{, and8192 edge oracle is not claimed unless present in existing tests. Full existing31group gate and all companion matrices must be rereviewed at the changed head.",
    "R37 measurement limitations remain: inclusive times overlap, completed-prefix single runtime only, failed calls/wrapper/collection overhead incompletely represented; no64cycle extrapolation."
  ],
  "runtimePass": false,
  "technicalLeadPass": false,
  "ready": false,
  "merge": false,
  "fallback": {
    "bytes": 7778,
    "sha256": "85028ed221c72b4f0979223dad8d7665f72a1a07a4eb3ea3a7f31ea0ca52a679",
    "blob": "20aaa2fbbbc78d9dad0869b45203f21a22811e07"
  }
}
```

## Independent source reviewer: complete exact receipt

The compact JSON object is7147UTF8bytes/SHA256af8027d74f01cc53b97c0380d26a7fadd86ccdd94de24b2da179dae7fd96b72c; indentation below is presentation only. Earlier pending model status within this dated receipt is resolved by the later cost record below, without rewriting the historical review.

```json
{
  "schema": "jetnity.m04.r38.independent-source-review.g3.v1",
  "reviewer": "/root/m04_recovery_source_review_g3",
  "sameSession": true,
  "task": {
    "url": "https://github.com/Jetnity/jetnity/pull/1184#issuecomment-6785712854",
    "bytes": 7536,
    "sha256": "52dbeb9e1b87d24c44d033d941e8091f9c1efa809fa22f975ee2523e16ee656e"
  },
  "base": "994eed7511d612db5158a2af77b5ad3d35f4b6c6",
  "disposition": "NO_CONCRETE_SOURCE_BLOCKER_RECOMMEND_ROOT_SELECTION_SUBJECT_TO_FRESH_IMMUTABLE_AND_RUNTIME_GATES",
  "sql": {
    "bytes": 161095,
    "sha256": "868778c647464bf51ff179e39b86c2f4d6771cad07998165898f2f222e5fa84a",
    "blob": "1bb764344f22569dec9d3320667e0125d64c1cbf"
  },
  "native": {
    "bytes": 191098,
    "sha256": "f5d849c643ff22d264bc9adc1a7cd65f12caaac80a804647604851f22effbde0",
    "blob": "0b3f7d9906687ec42171de5af60fed009d07b39f"
  },
  "exactScope": {
    "sqlUniqueSpans": 2,
    "sqlInverseExact": true,
    "all29DeclarationAttributeHeadersExact": true,
    "other28FunctionBlocksExact": true,
    "outsideCanonicalExact": true,
    "fullOriginalFallbackExact": true,
    "nativeReverseSpans": 8,
    "nativeExactOriginal191098": true,
    "profileIdentifiersRemain": false,
    "native31GroupsExact": true
  },
  "proof": [
    {
      "topic": "NULL and entry",
      "finding": "Original SQLNULL/d<0/d>24 root guard remains first. Empty object returns before regex. Nonempty d24 bypasses shortcut to exact fallback. Scalar and array roots retain original branches."
    },
    {
      "topic": "Lexical proof",
      "finding": "Raw size must fit8192 before scans; any backslash declines. Original default-collation single-character printable test over whole raw text implies each unescaped key/string substring passes the same original test. Explicit-C global complete-quote stripping is unambiguous only after backslash rejection."
    },
    {
      "topic": "Numbers",
      "finding": "JSONB numeric_out emits fixed decimal spelling. No decimalpoint plus no16-digit run gives integer dscale0 with at most15digits, strictly within safeinteger bound. Conservative -0 decline cannot widen acceptance. String numeric-looking content is removed before these tests. true/false/null are retained and allowed."
    },
    {
      "topic": "Escaping",
      "finding": "Pinned escape_json escapes quotes,backslashes and controls; all would introduce a rejected raw backslash. Other bytes are copied, so direct quote/key/colon and jsonb leaf::text exactly preserve admitted canonical bytes."
    },
    {
      "topic": "Flat",
      "finding": "Residue removes all strings and keys; no nested openingbrace and no array means only scalar children. d<24 makes each child depth valid. Nonempty jsonb_each yields non-NULL key and non-SQL-null JSONB value including JSONnull, so string_agg loses no value."
    },
    {
      "topic": "Nested",
      "finding": "Unchanged safe recursive arm only expands objects below24; all emitted nodes have depth<=24. is_valid rejects every nonempty object at24 and accepts scalar/emptyobject24. No NULL validity or piece exists. Failed depth returns SQLNULL and enters exact fallback."
    },
    {
      "topic": "Ordering and commas",
      "finding": "Existing C text-array key paths/NULL closing sentinels preserve preorder and closure. Uniform member comma prefix plus raw'{,' admission rejection means C literal cleanup changes only builder-created object-first-member separators, never original key/string content."
    },
    {
      "topic": "Syntax",
      "finding": "All IF conditions are ordinary expressions; CASE expressions remain inside complete SELECT statements. Recursive column types unchanged. No scalar local/alias-field ambiguity or unparenthesized IF CASE delimiter hazard found."
    },
    {
      "topic": "State and authority",
      "finding": "Only invocation-local text variable added. No cross-call cache or state. All authority/history/catalog/transaction functions and all29 headers untouched. Fallback clears both temporary texts."
    }
  ],
  "costs": {
    "measuredTarget": "canonical_v1 has largest measured self-time in both completed R37 intervals; measurement does not isolate a CTE operator",
    "removedForAdmittedNested": [
      "one lag/window ordering source site",
      "explicit encoded_nodes MATERIALIZED stage",
      "per-leaf/key printable regex evaluations",
      "per-number numeric casts/truncation/range checks",
      "per-key to_jsonb escaping"
    ],
    "flatChange": "three ordered array aggregates plus pending-position discovery become one ordered string_agg for lexically admitted flat nonempty objects",
    "retained": [
      "recursive worktable and reused walk materialization",
      "two walk consumers for open/value and close tokens",
      "one ordered aggregate",
      "path arrays and token text",
      "fresh whole history and all validations outside canonical"
    ],
    "added": [
      "bounded whole-raw printable regex",
      "bounded C quoted-token stripping",
      "bounded residue/substr checks",
      "C postassembly comma replacement"
    ],
    "exactEligibilityModel": "Separate auditor model pending; no estimated exact counts asserted here",
    "physicalSortCountMeasured": false,
    "speedupPromised": false
  },
  "resourceLimits": [
    "Raw v::text is materialized before8192 admission, as predecessor also did; arbitrary huge private-helper memory/error timing is not proven identical.",
    "Accepted raw scan inputs<=8192B; quoted-token regexp allocates widechar workspace plus output; query tuplestores/path/sort/output remain.",
    "Per-admitted nested document N<=1639 and tokens<=3278 using prior source bound; cumulative logical path-volume bounds are not peak RSS or physical traffic.",
    "Nonaccepted documents use full exact fallback; no acceptance cap or validator budget changes."
  ],
  "coverage": [
    "Existing five R26 plain nested positive rows and R19 emptychild/depth23 row exercise positive family; actual N02/runtime is still pending.",
    "R26 16-digit maxsafe row falls back; mixed arrays/escapedR21/decimal-scaleR20 use exact fallback.",
    "No dedicated existing8KiB-boundary,raw'{,' collision,or every plain-lexical-edge runtime oracle is claimed; native is frozen.",
    "All31groups/full254-256/full64-65/realR9/finalrollback/inherited761/min4182 and complete changed-head/main gates remain required."
  ],
  "primarySources": [
    {
      "repository": "postgres/postgres",
      "commit": "c372fbbd8e911f2412b80a8c39d7079366565d67",
      "path": "src/backend/utils/adt/regexp.c",
      "blob": "702cd52b6d429018e51c3167407c0128a2962fac"
    },
    {
      "repository": "postgres/postgres",
      "commit": "c372fbbd8e911f2412b80a8c39d7079366565d67",
      "path": "src/backend/utils/adt/varlena.c",
      "blob": "b1ec5c32cede21998f6084039aa57655afdfbef0"
    },
    {
      "repository": "postgres/postgres",
      "commit": "c372fbbd8e911f2412b80a8c39d7079366565d67",
      "path": "src/backend/utils/adt/array_userfuncs.c",
      "blob": "5c4fdcfba4693dcf6d83047806bd62cbe3adfd1d"
    },
    {
      "repository": "postgres/postgres",
      "commit": "c372fbbd8e911f2412b80a8c39d7079366565d67",
      "path": "src/backend/utils/adt/jsonb.c",
      "blob": "cf43c3f2ded19aabd2a913ab914f84d6c70d3afc"
    },
    {
      "repository": "postgres/postgres",
      "commit": "c372fbbd8e911f2412b80a8c39d7079366565d67",
      "path": "src/backend/utils/adt/numeric.c",
      "blob": "3c3184f15b5692341342e2d720a09f906d74fba7"
    },
    {
      "repository": "postgres/postgres",
      "commit": "c372fbbd8e911f2412b80a8c39d7079366565d67",
      "path": "src/backend/utils/adt/json.c",
      "blob": "7205f4adca81af77f0308294709e01f6be604a68"
    },
    {
      "repository": "postgres/postgres",
      "commit": "c372fbbd8e911f2412b80a8c39d7079366565d67",
      "path": "src/backend/utils/adt/jsonfuncs.c",
      "blob": "70cb922e6b7aa45629483bb64d3380d07a1e81a0"
    }
  ],
  "noExecution": true,
  "noMutation": true,
  "noReadyMerge": true,
  "allOwnerStopsRetained": true
}
```

## Same-session author disposition

This is Root's structured transcription of the complete author response, not a claim of byte-identity with its original prose. Author self-review is not TL-PASS.

```json
{
  "schema": "jetnity.m04.r38.author-delivery.root-transcription.v29",
  "author": "Jetnity Official Truth V3 Durable Jobs1 — Codex Generation3",
  "session": "/root/m04_durable_jobs_writer_g3",
  "sameSession": true,
  "disposition": "EXACT_SELECTED_SOURCE_DELIVERY_COMPLETE_NO_CONCRETE_SOURCE_BLOCKER_RUNTIME_PENDING",
  "source": "Author final response received2026-11-11 03:31UTC; this structured transcription is not claimed byte-identical to the prose response",
  "taskReadback": {
    "url": "https://github.com/Jetnity/jetnity/pull/1184#issuecomment-6786124307",
    "bytes": 9996,
    "sha256": "4129b65707e6ee08b48d2e7c5cf2cdfdc31610650524b87019c2a7a0cc63c1f4",
    "blob": "a7a691bd7f094f7ca00834d668d3f26ab36e3708"
  },
  "sql": {
    "bytes": 161095,
    "sha256": "868778c647464bf51ff179e39b86c2f4d6771cad07998165898f2f222e5fa84a",
    "blob": "1bb764344f22569dec9d3320667e0125d64c1cbf"
  },
  "native": {
    "bytes": 191098,
    "sha256": "f5d849c643ff22d264bc9adc1a7cd65f12caaac80a804647604851f22effbde0",
    "blob": "0b3f7d9906687ec42171de5af60fed009d07b39f"
  },
  "aggregate": "77f86edfbac0bbcf277913f1225f044fbbb11c22ac6f0ce0c65332d552864b13",
  "scope": {
    "uniqueSqlEdits": 2,
    "inverseRecovers161125Baseline": true,
    "nativeUniqueInverseEdits": 8,
    "originalNativeExact": true,
    "profilingRemains": false,
    "all29HeadersExact": true,
    "other28FunctionsExact": true,
    "allOutsideCanonicalExact": true,
    "rootNullDepthGuardExact": true,
    "fallback": {
      "bytes": 7778,
      "sha256": "85028ed221c72b4f0979223dad8d7665f72a1a07a4eb3ea3a7f31ea0ca52a679",
      "blob": "20aaa2fbbbc78d9dad0869b45203f21a22811e07"
    }
  },
  "semanticProof": [
    "Original SQLNULL/invalid or NULL depth guard and exact P7601 exception remain first.",
    "Empty object returns only after original root guard and before lexical/default-collation regex; preserves empty-object behavior even where regex would raise collation error.",
    "Nonempty object atdepth24 bypasses shortcut; nested traversal never expands at24 and explicit depth predicate rejects nonemptyobject24; emptyobject/scalar24 remain valid.",
    "Any raw backslash declines. Admitted strings/keys are literal rawJSONB substrings; original printable predicate applied once proves original per-substring checks. Direct quoting equals pinned escape_json.",
    "Pinned numeric_out uses fixeddecimal. After complete quoted-token removal, decimalpoint/16digitrun/-0 decline. Admitted <=15digit integral output is inside safeinteger bound and equals original truncation; valid larger/scaled numeric cases remain fallback.",
    "Boolean and JSONnull spellings preserved; guard does not reject true/false because they contain e.",
    "Unquoted arrays decline; original array branch and recursion unchanged.",
    "Explicit C ordering unchanged; NULL-last closing path sentinel retained. Uniform member commas removed only at generated {, after raw text excludes that sequence.",
    "Positive proof ensures every node/key/piece nonNULL; nested bool_and independently checks depth and must be explicitly TRUE."
  ],
  "sourceCosts": {
    "positiveFlatRoots": 133836,
    "positiveNestedRoots": 359536,
    "fallbackWireRoots": 517,
    "unchangedScalarRoots": 54704,
    "denominator": "Source-only full two frozen quota traces, not observed incomplete R37 call counter",
    "fallbackObjectQueries": 6081,
    "additionalVsR36ObjectQuerySites": 5564,
    "removedNested": [
      "encoded materialization source stage",
      "LAG window stage and its ordering source site",
      "per-member key to_jsonb",
      "repeated leaf printable/numeric validation"
    ],
    "retainedNested": [
      "bounded recursive walk",
      "one ordered string_agg PLUS bool_and",
      "paths/worktable/sort requirements",
      "all fresh history/authority checks"
    ],
    "flat": "three ordered array aggregates/pending-position scan/array join replaced by one ordered string_agg; empty objects avoid enumeration",
    "added": [
      "bounded wholetext scans",
      "quoted-token removal/residue copy",
      "six strpos source sites on admitted root",
      "default printable regex",
      "C quoted-token-removal regex",
      "C numeric-run regex",
      "nested final C replacement",
      "fallback original arrays/memo comparisons/stack copies"
    ]
  },
  "limits": [
    "Shortcut lexical scans follow existing8192-byte gate; raw serialization still occurs before that admission; no accepted-input-bound or RSS claim.",
    "Existing native tests do not exhaust8KiB/lexical/raw-{, edges. Exact fallback and positive soundness do not replace full existing CI.",
    "No physical-sort/CPU/RSS/elapsed-time or adequate240s reserve promise.",
    "Measured function self-time does not isolate internal CTE cost.",
    "No cross-invocation cache/state/authority change."
  ],
  "primarySourceCommit": "c372fbbd8e911f2412b80a8c39d7079366565d67",
  "authorIndependentlyRead": [
    "jsonb.c",
    "json.c",
    "numeric.c",
    "varlena.c"
  ],
  "noGitMutation": true,
  "noExecution": true,
  "noLogAccess": true,
  "noReadyMerge": true,
  "availableForSameSessionImmutableRereadOrImmediateFix": true
}
```

## Independent source-shaped cost model

Full two frozen quota traces only. The compact receipt is8980UTF8bytes/SHA256c0dbaf6d8cf2b82a49a923805d41d761b0d74a0eb31317491119b19a615def9a. Object queries rise493889→499453 (+5564); ordered aggregates fall761561→511615; all aggregates, including retained bool_and, fall1121614→871151. These are source sites and complete-trace arithmetic, not physical plans or measured runtime. Added scans/copies/fallback and retained repeated history are part of the result.

```json
{
  "schema": "jetnity-m04-r38-independent-source-cost-g3-v1",
  "reviewer": "/root/m04_recovery_live_audit_g3",
  "scope": "Static source-shaped analysis of the two COMPLETE frozen native quota traces only. No project execution, SQL evaluation, log read, runtime measurement or speed guarantee.",
  "source": {
    "proposal": {
      "bytes": 161095,
      "sha256": "868778c647464bf51ff179e39b86c2f4d6771cad07998165898f2f222e5fa84a"
    },
    "proposalPrefix": {
      "bytes": 2390,
      "sha256": "c45dc2dded64400243cf1f19f86cac9dfc354da1e5bff24e479e9b58585ebbfd"
    },
    "baselineSQL": {
      "bytes": 161125,
      "sha256": "92ca2bf0c45c9e3702b2de63bf984d6a1f30b6fe4c9c3ee83de35ae470ab2d16"
    },
    "native": {
      "bytes": 191098,
      "sha256": "f5d849c643ff22d264bc9adc1a7cd65f12caaac80a804647604851f22effbde0"
    },
    "fixtures": {
      "bytes": 6321,
      "sha256": "68312bc9424dc71066b6717135f4d13bf350968618dadda143b9b7e16f0bd927"
    },
    "immutableModel": {
      "commit": "d1f134a698ddd63c147191b34f24f529a28f5605",
      "path": "docs/official-truth-product-v3/M04_RECOVERY_R36_EVIDENCE_V27.json",
      "bytes": 892275,
      "sha256": "434df6950887434c2dcaf91cade83ad6a31190aff0b1e32b244441ef82bdbb80"
    },
    "proposalReconstructedExact": true,
    "onlyCanonicalDeclarationAndPositivePrefixChangedFromSQLBaseline": true
  },
  "method": {
    "denominator": 548593,
    "scopeDefinition": "Complete ledger254/255/256 and starts64/65 traces, history plus frontdoor/standalone/reply canonical calls. Excludes remaining native groups and all noncanonical work.",
    "reuseOfImmutableModel": "V27 definitions and exact per-trace shape multiplicities reused, independently recomputed raw subtree counts and memo-aware fallback counts.",
    "admission": "All modelled object roots are nonempty, d=0, object-only trees, <=3519 raw bytes. Native field names/values have printable ASCII, no arrays, no fractional/scaled/16-digit numeric tokens, no negative zero and no raw {, token. Numbers inside quoted IDs/timestamps are stripped before numeric-residue checks.",
    "escapedRootExceptions": "Only WInit,WDedupQ,WDedupL,WLater,WClaim,WFail,WStart embed subjectText as a quoted JSON string and necessarily contain raw backslashes. WRead does not.",
    "commandCorrection": "CE/CC/CF canonicalize original command.value, not command_v1's returned commandText/subjectText wrapper. Attempt embeds subjectText::jsonb. RJob/RStart replies carry job/claim rather than embedded canonical strings.",
    "bytesQualification": "3519 is the prior conservative source bound for these two quota traces, not a generic product bound. Generic oversized roots still materialize full v::text before byte rejection."
  },
  "eligibility": {
    "allRoots": 548593,
    "scalarRootsUnchanged": 54704,
    "objectRoots": 493889,
    "positiveFlat": 133836,
    "positiveNested": 359536,
    "positiveTotal": 493372,
    "fallback": 517,
    "perTrace": {
      "ledgerHistory": {
        "scalar": 1039,
        "flat": 66562,
        "nested": 134682,
        "fallback": 0,
        "newObjectQueries": 201244,
        "newOrderedAggregates": 201244,
        "newAllAggregates": 335926
      },
      "cyclesHistory": {
        "scalar": 50308,
        "flat": 66306,
        "nested": 216202,
        "fallback": 0,
        "newObjectQueries": 282508,
        "newOrderedAggregates": 282508,
        "newAllAggregates": 498710
      },
      "ledgerOutside": {
        "scalar": 1807,
        "flat": 516,
        "nested": 4392,
        "fallback": 259,
        "newObjectQueries": 7764,
        "newOrderedAggregates": 13476,
        "newAllAggregates": 17868
      },
      "cyclesOutside": {
        "scalar": 1550,
        "flat": 452,
        "nested": 4260,
        "fallback": 258,
        "newObjectQueries": 7937,
        "newOrderedAggregates": 14387,
        "newAllAggregates": 18647
      }
    },
    "fallbackByShape": {
      "ledgerOutside": {
        "WInit": 1,
        "WDedupQ": 253,
        "WDedupL": 1,
        "WLater": 1,
        "WClaim": 1,
        "WFail": 1,
        "WStart": 1
      },
      "cyclesOutside": {
        "WInit": 1,
        "WLater": 64,
        "WClaim": 65,
        "WFail": 64,
        "WStart": 64
      }
    },
    "allHeavyHistoryRootsPositive": true
  },
  "positiveNested": {
    "objects": 1743393,
    "members": 10446964,
    "scalars": 9063107,
    "memberSlots": 21526311,
    "closeSlots": 4101686,
    "maxPath": 4,
    "walkRows": 10806500,
    "tokens": 12549893,
    "pathAppendSites": 12190357,
    "pathElementSlots": 25627997
  },
  "positiveFlat": {
    "roots": 133836,
    "members": 300836,
    "priorObjectSelects": 133836,
    "newObjectSelects": 133836,
    "priorOrderedArrayAggregates": 401508,
    "newOrderedStringAggregates": 133836,
    "removedArrayAggregates": 267672,
    "removedArrayPositionsSites": 133836,
    "emptyRootsInModel": 0
  },
  "fallback": {
    "roots": 517,
    "priorRawCTEObjects": 6844,
    "priorRawCTEMembers": 37430,
    "newVisitedObjects": 6081,
    "newVisitedMembers": 31584,
    "regainedMemoObjects": 763,
    "regainedMemoMembers": 5846,
    "frames": 3233,
    "indexedMetadataWrites": 9699,
    "payloadArraySites": 38796,
    "totalFrameArraySites": 48495,
    "payloadElementSlots": 284898,
    "maxStackFrames": 4,
    "qualifier": "Nominal static source sites and logical element slots, not physical copies/bytes/RSS. The exact R35 object fallback is used; no generic CTE on rejected roots."
  },
  "queryAndAggregateComparison": {
    "baseline": "Current R36 SQL, identical in instrumented R37",
    "oldObjectSelectSites": 493889,
    "newObjectSelectSites": 499453,
    "deltaObjectSelectSites": 5564,
    "oldOrderedAggregateInvocations": 761561,
    "newOrderedAggregateInvocations": 511615,
    "oldAllAggregateInvocations": 1121614,
    "newAllAggregateInvocations": 871151,
    "oldNestedBoolAnd": 360053,
    "newNestedBoolAnd": 359536,
    "oldLagWindowInvocations": 360053,
    "newLagWindowInvocations": 0,
    "oldNestedGlobalOrderingSites": 720106,
    "newNestedGlobalOrderingSites": 359536,
    "oldExplicitEncodedMaterializedRows": 10844447,
    "newExplicitEncodedMaterializedRows": 0,
    "remainingRecursiveWalkRows": 10806500,
    "newTokenRows": 12549893,
    "physicalPlanQualification": "Nested bool_and remains alongside one ordered string_agg. Recursive worktables and two token UNION branches remain. Source ordering sites do not establish physical sort count, materialization count or memory use."
  },
  "visits": {
    "oldR36ObjectsIncludingFlat": 1884073,
    "newObjectsIncludingFlatAndFallback": 1883310,
    "oldR36MembersIncludingFlat": 10785230,
    "newMembersIncludingFlatAndFallback": 10779384,
    "oldR35MemoObjects": 1682930,
    "extraObjectsVersusR35": 200380,
    "oldR35MemoMembers": 9243141,
    "extraMembersVersusR35": 1536243,
    "qualification": "Positive nested CTE still loses same-parent successful-object reuse. R38 recovers only the 763 objects/5846 members in escaped-wire fallback relative to R36; it does not remove duplicated history traversal."
  },
  "positiveLeafModel": {
    "positiveKeyMembers": 10747800,
    "positiveScalarMembers": 9363943,
    "strings": 5787084,
    "fixedIntegers": 2175715,
    "fixedNulls": 1097152,
    "integerOrNullFields": 303992,
    "booleanMembers": 0,
    "arrayMembers": 0,
    "integerRange": [
      2175715,
      2479707
    ],
    "nullRange": [
      1097152,
      1401144
    ],
    "qualification": "Grouped JQ.predecessorRevision and Audit.priorRevision shapes retain integer-or-null alternatives. Bounds are honest source-model bounds, not a claim that exact numeric/null split was independently enumerated.",
    "perStringAndKeySavings": "Positive branch removes per-key printable test and to_jsonb(key) quoting, plus per-string #>> extraction/printable test; whole-document lexical guards replace their validation.",
    "priorPositiveFieldPrintableRegexSites": 16534884,
    "newWholeDocumentPrintableRegexSites": 493372,
    "priorNumericSourceSitesPerInteger": {
      "numericCasts": 4,
      "truncCalls": 2
    },
    "newPositivePerIntegerNumericCasts": 0,
    "newPositivePerIntegerTruncCalls": 0
  },
  "addedAndRetainedCosts": {
    "nonemptyObjectEqualityChecks": 493889,
    "rootTextSerializationsRetained": 493889,
    "byteMeasurementsRetained": 493889,
    "rawBackslashStrpos": 493889,
    "positiveAdditionalStrposSites": 2466860,
    "totalStrposSites": 2960749,
    "positiveOriginalDefaultPrintableRegex": 493372,
    "positiveCQuotedTokenStripRegex": 493372,
    "positiveCSixteenDigitRegex": 493372,
    "residueSubstringCopies": 493372,
    "nestedOutputReplaceScans": 359536,
    "positiveNestedPathAppends": 12190357,
    "positiveNestedLogicalTextPathElementSlots": 25627997,
    "unchangedCanonicalExternalEntries": 548593,
    "unchangedSevenEmptyFrameArrayInitializations": 3840151,
    "wholeDocumentQualifications": [
      "Each positive root adds document-wide lexical scans, quote stripping/residue construction and classification; nested output adds replace scan/copy.",
      "No-backslash failures stop before printable/strip/residue work and then pay exact fallback validation.",
      "Other valid declined inputs (escaped strings, arrays, scaled/large numeric forms or literal {,) still pay the completed selector portion plus exact fallback.",
      "Depth-invalid admitted objects can pay bounded walk then exact original error path.",
      "Selector and residue processing after <=8192 check is bounded; full root serialization occurs before that check.",
      "Path arrays/text payload widths, worktable/storage, sort comparison prefixes and physical allocations remain unmeasured."
    ]
  },
  "catalog": {
    "sqlBytesBefore": 161125,
    "sqlBytesAfter": 161095,
    "deltaBytes": -30,
    "completeQuotaApiCalls": 520,
    "definitionHashInputDeltaBytes": -15600,
    "deltaVersusR35SQLBytes": 2425,
    "deltaVersusR35For520Calls": 1261000,
    "wholeNativeCatalogCallCountClaimed": false
  },
  "conclusion": "The candidate reaches the dominant repeated history shapes and removes specific per-field validation/window/encoded-materialization work. It increases object SELECT sites versus R36 and adds lexical full-document work; no net runtime saving or 240s completion is proved by this model. Native must be restored exactly and all required exact-head/actual-main gates remain mandatory.",
  "specialGatesUnchanged": true,
  "noRuntimeExecuted": true,
  "noMutation": true
}
```

## Root arithmetic cross-check

```json
{
  "reviewer": "Root Technical Lead",
  "sourceOnly": true,
  "at": "2026-11-11 03:34:13 UTC",
  "pinnedV27Readback": true,
  "definitionAndTraceMultiplicityReview": true,
  "rawRepeatedLastChildSemanticsPreserved": true,
  "checks": {
    "perTraceExact": true,
    "positiveNestedExact": true,
    "fallbackObjects": true,
    "fallbackMembers": true,
    "flatMembers": true,
    "querySum": true,
    "aggregateSum": true,
    "extraQuerySites": true,
    "guardStrpos": true,
    "totalRoots": true
  },
  "fullPerTrace": {
    "ledgerHistory": {
      "scalar": 1039,
      "flat": 66562,
      "nested": 134682,
      "fallback": 0,
      "newObjectQueries": 201244,
      "newOrderedAggregates": 201244,
      "newAllAggregates": 335926
    },
    "cyclesHistory": {
      "scalar": 50308,
      "flat": 66306,
      "nested": 216202,
      "fallback": 0,
      "newObjectQueries": 282508,
      "newOrderedAggregates": 282508,
      "newAllAggregates": 498710
    },
    "ledgerOutside": {
      "scalar": 1807,
      "flat": 516,
      "nested": 4392,
      "fallback": 259,
      "newObjectQueries": 7764,
      "newOrderedAggregates": 13476,
      "newAllAggregates": 17868
    },
    "cyclesOutside": {
      "scalar": 1550,
      "flat": 452,
      "nested": 4260,
      "fallback": 258,
      "newObjectQueries": 7937,
      "newOrderedAggregates": 14387,
      "newAllAggregates": 18647
    }
  },
  "positiveNested": {
    "objects": 1743393,
    "members": 10446964,
    "scalars": 9063107,
    "memberSlots": 21526311,
    "closeSlots": 4101686,
    "maxPath": 4,
    "walkRows": 10806500,
    "tokens": 12549893,
    "pathAppendSites": 12190357,
    "pathElementSlots": 25627997
  },
  "fallbackMemoVisited": {
    "objects": 6081,
    "members": 31584
  },
  "positiveFlatMembers": 300836,
  "qualifications": [
    "Pure arithmetic over source shape metadata; no project/function/SQL/test execution.",
    "Full two frozen quota traces, not incomplete R37 measured counters or entire native suite.",
    "Detailed string/integer/null field breakdown is the independent auditor's qualified source account; Root rechecked classification/totals/visit/aggregate/site arithmetic, not an unqualified exact numeric/null split.",
    "No elapsed-time/physical-sort/RSS/240s completion conclusion."
  ]
}
```

## Next gates

Create/read back the exact11path immutable package on parent994eed, independently review all exact files/tree/inverses/marker exteriors/parallel preservation, then expected-parent fast-forward same Draft. Existing full8job CI and all31 M04 groups/full254–256/full64–65/realR9/inherited761/min4182/finalrollback remain mandatory. Root alone may Ready/merge after all fresh gates. Actual merged-main fullCI and both exact Production aliases must subsequently pass, then the already-contracted finite8path documentation closure with its own full gates and final receipts/STOP. All30 failed observations and genuine R21/R29/R35 successes remain preserved. No Auth logs, replacement execution, hosted change, new product slice or special-gate bypass.
