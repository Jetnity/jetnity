# Admin + Account ungated residual precheck 1 — source notes

Read-only. No runtime edit. Subject: `main@bee041911003a3b871dacddc0fcdd12f4b8714a1`.

These notes record source traces. They are not a signed-in Admin session, not a browser run, and not Production row proof.

## C1 — transaction status change uses the previous status

`components/admin/payments/PaymentsCenter.tsx` `TransactionsCard`:

- `load` reads `status` from the render that created it.
- The status `<select>` `onChange` calls `setStatus(e.target.value)` and then `filtern()`.
- `filtern` calls `load(true)` in that same turn.
- `load(true)` therefore still sees the previous `status`.
- The server route `app/api/admin/payments/list/route.ts` does apply `status` when the query contains it (`eq('status', status)`).

Trace:

1. Render with `status === 'all'`.
2. Operator chooses `paid`.
3. The request built in that turn has no `status` parameter.
4. After the following render the control shows `paid`.
5. A later press of `Filtern` uses the new status. The change itself does not.

Changing `paid` to `failed` in one gesture requests `paid` while the control shows `failed`.

`q` plus Enter is a later event, after the input render has committed. That path is not this defect.

Refund writes, `RefundCard`, and `/api/admin/payments/refund` are a different contract. This trace does not authorize touching them.

## C2 — security filter miss uses the period-empty sentence

`components/admin/security/SecurityWidget.tsx`:

- `events` is the client filter of `data.events`.
- When `events.length === 0`, the table renders `ADMIN_EHRLICHE_TEXTE.securityTabelleLeer`.
- That sentence is `Keine aufgezeichneten Events in diesem Zeitraum.`
- An unmatched filter against a non-empty `data.events` therefore says the period is empty.

`app/api/admin/security/list/route.ts` returns at most `MAX_ZEILEN = 200` rows from the last 7 days and does not return a count or a truncation flag. The widget treats that array as the recorded 7-day window and computes the 24h KPIs from it. A result shorter than 200 does not prove the cap bound. A result of 200 is not labelled as a cap. Account bookings already disclose their 200-row cap (`BUCHUNGEN_COPY.abgeschnittenText`). This trace does not authorize security-event ingestion.

## C3 — null profile `created_at` is shown as now

`app/(admin)/admin/users/page.tsx` maps `created_at: r?.created_at ?? new Date().toISOString()`.

`public.profiles.created_at` in `supabase/migrations/20260815060111_baseline.sql` is `timestamp with time zone` with a default and without `NOT NULL`. Generated `types/supabase.ts` types it as `string | null`.

`components/admin/UsersTable.tsx` formats that string with `de-CH`. A null therefore appears as the time of the page render.

No Production profile row was read. Ordinary inserts receive the default. This path is exceptional, not the #608 search defect. #608 did not edit this server page.
