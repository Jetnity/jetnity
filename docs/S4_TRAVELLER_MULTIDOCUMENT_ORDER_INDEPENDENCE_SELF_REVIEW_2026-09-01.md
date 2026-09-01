# S4 Residual – Multi-Document Parser Order Independence Self-Review

Stand: 1. September 2026  
Status: **AGENT SELF-REVIEW / NOT A TECHNICAL-LEAD PASS**  
Logical agent: **`Jetnity S4 multi-document parser order independence 1`**  
Generation: **1**  
Cursor session: `bc-aae0f830-3be2-49d7-897e-ffc7407dcf01`  
Draft-PR: #371  
Implementation head: `382c31eabeea1e88d0daab371e5ba09da46df4e3`  
Exact-head gates recorded for: `2d8a884e355b4a12ec941ed5dc3dd01c05771984`

Agent self-review is not PASS. Cursor does not Ready or merge.

---

## 1. Scope held

| Rule | Held? |
| --- | --- |
| Only the central parser truth boundary + direct tests + versioned docs | **yes** |
| No `traveller-kontext.ts` rewrite / second normalization | **yes** |
| No DB / migration / RLS / function | **yes** |
| No provider / secret / paid / live / activation | **yes** |
| No body-cap / Safety / Seasonal flags | **yes** |
| No S6 / S7 / S8 / TW-8 / TW-9 / Auth / MFA / AAL | **yes** |
| No sensitive-data expansion | **yes** |
| No `docs/ACTIVE_WORK_STATUS.md` / `JETNITY_START_HERE.md` | **yes** |
| No default / primary / preferred citizenship or passport | **yes** |

Unrelated snapshot `next-env.d.ts` dirty state on stale local `main` was restored before checkout; not committed.

---

## 2. Task coverage

| Required | Delivered |
| --- | --- |
| Reconstruct branch/main before edit | local snapshot `main@17ee633e`; fetched `origin/main@6dc5a153` and branch `@ace5fb47` |
| Remove positional coupling after canonical sort | `citizenshipLinkStimmtMitValidierterQuelle` looks up validated `clientRef` |
| Keep fail-closed malformed / sensitive / duplicate / unknown-ref | existing tests remain; new unknown-ref + identity tests added |
| Mixed passport + national_id accepted | test pass |
| Semantic permutations equivalent | two mixed orders + audit 3-document permutation; same fingerprint and per-ref links |
| Links stay on the correct document after sort | `national_id` sorts first; CH/DE and CH/RS links remain on the matching `clientRef` |
| Unknown citizenship ref rejected | test pass |
| Duplicate document ref rejected | existing test remains green |
| Malformed / sensitive extra-field rejection | existing tests remain green |
| Missing/invalid identity fail-closed | duplicate generated fallback, numeric ref, whitespace ref rejected; unique generated fallback still accepted |
| No residence → citizenship | residence CH + US passport → 0 citizenships, null link |
| No issuer → citizenship | CH citizenship + US issuer without link stays CH-only, null link |
| No default / primary / preferred | both credential options remain peers; no such fields |

---

## 3. Honesty

| Claim | Status |
| --- | --- |
| Runtime positional defect removed | **true** in `traveller-anfrage.ts` |
| Targeted + full `npm test` this session | **true**: 23/23 targeted, 3067/3067 full |
| Typecheck / lint / build / hygiene this session | **true** locally |
| CI / Vercel of `2d8a884e` | **true** — CI run 33458244777 SUCCESS; Vercel `9qZQSn7mndoYMgf7qSfcP876CqxT` SUCCESS |
| CI / Vercel of this evidence follow-up commit | **not** claimed; a docs-only tip cannot carry its own SHA |
| Browser / Real-Device | **not** run |
| S4 is closed | **false** |
| S6 may start | **false** |
| Ready / merge | **false** |

---

## 4. Adversarial checks

1. **Did I keep comparing by index and only sort the raw array first?** No. Lookup is by validated `clientRef`.
2. **Did I invent a second traveller/document truth?** No. `travellerLegacyLesen` remains the single normalizer.
3. **Did I make the first document or first citizenship primary?** No. Both documents remain peer credential options.
4. **Did I infer citizenship from residence or issuer?** No; tests reject that reading.
5. **Did I weaken unknown-ref / duplicate-ref / sensitive rejection?** No; those paths still return `null`.
6. **Did I accept two documents that cannot be distinguished?** No; identical generated fallback `document:passport:CH` is rejected.
7. **Did I edit Guest legacy storage parsing?** No.
8. **Did I touch Active Work / Start Here / S6?** No.
9. **Did I claim CI/Preview for a superseded intermediate deploy?** No. `HUaAwxMx` is `382c31ea` only. Exact-head gates are `2d8a884e`.
10. **Would a missing `clientRef` after sort silently attach the wrong link?** No; unmatched identity fails closed.

---

## 5. Traveller Context

Relevant. The previous positional check violated `1 traveller → n documents → context-aware evaluation` by turning input order into a false invalid. The fix restores option-preserving identity matching without creating a preferred credential.

## 6. Residual / not this slice

- Guest/`travellerLegacyLesen` still drops an unknown `citizenshipClientRef` to `null` instead of rejecting. Strict API parsing already rejects that before legacy. Changing Guest storage tolerance is out of scope.
- Generated fallback identity `document:${type}:${issuer}` remains the current contract when `clientRef` is omitted. Ambiguous fallbacks fail closed.
- S4 final closure and S6 remain blocked until independent Technical-Lead review and post-merge recheck.

## 7. Recommendation

Technical Lead reviews exact final head of Draft-PR #371 independently. If PASS: Ready/Merge is Technical-Lead-only. Then a fresh S4 closure recheck. Do not start S6 from this session.
