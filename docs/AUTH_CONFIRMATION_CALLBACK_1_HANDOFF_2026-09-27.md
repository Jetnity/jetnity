# Auth Confirmation Callback 1 — Handoff

Date: 2026-09-27
Status: **STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW**
Logical writer: **Jetnity auth confirmation callback 1**, Generation **1**
Session: https://cursor.com/agents/bc-bdb579ac-f2b5-452e-8e48-0aeb403f4c4d
Session id: `bc-bdb579ac-f2b5-452e-8e48-0aeb403f4c4d`
Reviewed head, gates do not carry forward: `3bce9ff3a4bc230db3c5e7c511fa1c5888bf67cd`
Implementation of R3/R4: `e175aa28083d1ce773a8dd90e918995a55258ab0`
Earlier reviewed head, also not gated: `716d708d1673e2e96c4028d82332a633baf677a4`
`origin/main` re-read at this handoff: `2ae99dc0d37e325fe6a021d6767aca18d24ad4f3` (unchanged)
Task model pin: `cursor-grok-4.6-high-fast`
Technical-Lead correction: that pin was stale. New sessions use Grok 4.7 High Fast. This existing session stays `grok-4.7-high-fast`. It was not switched and no new agent was created.
UI title remained `Auth callback PKCE conflict`.
Branch: `fix/auth-confirmation-callback-1`
Draft PR: https://github.com/Jetnity/jetnity/pull/583
Parent issue: #582, open
Baseline main from the task: `2ae99dc0d37e325fe6a021d6767aca18d24ad4f3`
Mode: `NORMAL`

Cursor does not mark Ready, does not merge, and does not start a follow-up slice.

## Read next

1. `docs/AUTH_CONFIRMATION_CALLBACK_1_TASK_2026-09-27.md`
2. `docs/AUTH_CONFIRMATION_CALLBACK_1_STATUS_2026-09-27.md`
3. `docs/AUTH_CONFIRMATION_CALLBACK_1_SELF_REVIEW_2026-09-27.md`
4. `lib/auth/callback-abschluss.ts` and `lib/auth/callback-abschluss.test.ts`
5. `app/auth/callback/CallbackClient.tsx`
6. `lib/supabase/client.ts` merkt die Wiederherstellung nur für `/auth/callback` und bindet sie an die Sitzung
7. ADR-0214, beide Review-Nachträge

## Do not

- Do not treat the earlier refresh-only landing as PASS.
- Do not send another signup, resend or reset email from this slice.
- Do not change hosted Supabase, SMTP, redirect URLs, MFA/AAL, DB or RLS.
- Do not upgrade `@supabase/ssr`, `supabase-js` or `auth-js` to make the test green.
- Do not restart this session for a new slice. A review fix on this same PR stays Generation 1.
- Do not treat head `3bce9ff3a4bc230db3c5e7c511fa1c5888bf67cd` or `716d708d1673e2e96c4028d82332a633baf677a4` as still gated.

## Session footer

Jetnity auth confirmation callback 1 · Generation 1 · Session `bc-bdb579ac-f2b5-452e-8e48-0aeb403f4c4d` · Model `grok-4.7-high-fast` (TL-Korrektur: 4.6-Pin veraltet, dieselbe Session behalten) · Draft #583 · #582 offen · kein Ready · kein Merge
