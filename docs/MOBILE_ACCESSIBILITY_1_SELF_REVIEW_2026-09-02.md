# Mobile Accessibility 1 – Agent Self-Review

Stand: 16. September 2026  
Status: **AGENT SELF-REVIEW / NOT A TECHNICAL-LEAD PASS**  
Logical agent: **`Jetnity mobile accessibility 1`**  
Generation: **1**  
PR: [#430](https://github.com/Jetnity/jetnity/pull/430)  
Issue: [#429](https://github.com/Jetnity/jetnity/issues/429)  
Canonical base: `main@e31e57269e985cb73e1490a0ac6b8ad6bea87725`

Agent self-review is not PASS. Cursor does not Ready or merge.

---

## 1. Scope held

| Rule | Held? |
| --- | --- |
| Audit first, then only confirmed P0/P1/P2 defects | **yes** |
| Public/guest critical path + shared presentation actually used there | **yes** |
| No redesign / new IA / new product feature | **yes** |
| No second design-system or a11y architecture | **yes** |
| CookieConsent left orphan | **yes** |
| PWA-1 / SW / offline / push untouched | **yes** |
| No DB / Supabase / RLS / Auth / MFA / AAL | **yes** |
| No Traveller / Citizenship / Document / Route change | **yes** |
| No provider / secret / paid / live / Production S6 | **yes** |
| No Assistant / OpenAI / new `Modellfunktion` | **yes** |
| No payments / indexing / public launch / new cost | **yes** |
| No Ready / merge / follow-up slice | **yes** |

## 2. Adversarial checks

1. **Did I treat 127.0.0.1 hydration failure as a product bug?** No. Next 16 blocked `/_next/static` from `127.0.0.1`. After the audit used `localhost`, menu, BackToTop and guest workspace hydrated.
2. **Did I claim `/ui-audit/trip-workspace` without `JETNITY_UI_AUDIT`?** No. Workspace evidence uses guest `localStorage` `jetnity:reise:v3` and `/reisen/trip-a11y-1`.
3. **Did I claim real-device testing?** No. Evidence is Chromium viewport/emulation only.
4. **Did I wire CookieConsent because it looked unused?** No. Intentional orphan.
5. **Did I reopen PWA-1 to “make mobile complete”?** No.
6. **Did I change Auth/session because account layout gained `tabIndex={-1}`?** No. Presentation-only landmark focus, same shared skip-link contract.
7. **Did I invent visa/citizenship/document rules?** No. Traveller context is not relevant.
8. **Did I treat a leftover 30px after BackToTop as uninvestigated?** No. Competing CSS smooth scroll and unmount-while-focused were isolated. Harness now reduces motion before an instant downward scroll; BackToTop stays mounted.
9. **Did I spawn a second Next server and kill start-user?** No. Next 16 refuses a second `next dev` in this workspace. Audit reuses `:3000`.
10. **Did I mark Ready or merge?** No.
11. **Would an empty guest workspace be reported as a pass?** No. The audit waits for “Deine Reise auf einen Blick” or records the missing heading.
12. **Did I use an invalid guest fixture that `reiseLesen` would drop?** The fixture now includes revision, stage dates/country, day `stageId`s and timestamps so `reiseLesen` accepts it.

## 3. Honesty

| Claim | Status |
| --- | --- |
| Skip-link focuses the landmark | **true** (source contract + 390 keyboard audit) |
| Mobile disclosure keyboard/semantics/44px | **true** |
| JS Reduced Motion for `scrollTo` / `scrollIntoView` | **true** |
| 18 public reflow combos without html/body overflow | **true** |
| `/planen` 390 keyboard/touch | **true** |
| Guest workspace 390 via `jetnity:reise:v3` | **true** |
| Full `npm test` 3214/3214 | **true** |
| Typecheck / lint(0 errors) / hygiene / production build | **true** |
| Real-device iPhone/Android | **false / not run** |
| Authenticated account/admin path beyond shared landmarks | **not claimed** |
| Ready / merge | **false** |

## 4. Traveller Context

Not relevant. No citizenship, document, residence or route collection was added or changed.

## 5. Residual / not this slice

- Physical-device Safari/Chrome QA
- Cookie banner product decision
- Authenticated trip workspace beyond the guest fixture
- Any later mobile polish slice; this slice does not authorize one
