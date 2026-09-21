# V1 Destination Essentials Density 1 — Adversarial self-review

Stand: 21. September 2026  
Status: **AGENT SELF-REVIEW AFTER DE-R1 — NOT A TECHNICAL-LEAD PASS**

---

## 1. DE-R1

The first freeze collapsed when domains were empty even if `hatHinweise` was true. That violated the conservative contradictory-flag rule.

Correction: compact path now requires `essentials.hatHinweise === false` and every `ziel.hatHinweise === false`, **in addition to** `keine_evidence`, no details/links, and `unvollstaendig === false`. Flags alone still cannot prove emptiness.

Render cases added: aggregate-only, stage-only, both-positive. Genuine consistent empty still compact. Mixed/material tests unchanged.

---

## 2. Remaining risks / honest limits

- Prior screenshots were not recaptured. That is correct only because harness fixtures never set a contradictory positive flag. If a reviewer wants a new visual of the flag-contradiction full path, that is a later capture, not claimed here.
- Before images remain reconstructed JSX on `6f8cd923`, not a live historical baseline.
- Synthetic compiled-CSS only. No authenticated Preview trip, Safari, hardware, or official-travel-advice claim.
- Main was not integrated. #520 merged; #524 still owns the next integration slot.
- Exact-head CI/Auth/Preview for the corrected freeze belong in the PR comment.

---

## 3. Scope held

No evaluator, attention, `/planen`, sibling merge, Ready, or PR merge. Same session `bc-f4bf1e77-e22d-45b8-a15e-deed1bbbc1d8`.

---

## 4. Verdict

Author self-review: DE-R1 is implemented as specified. **Not TL PASS.**
