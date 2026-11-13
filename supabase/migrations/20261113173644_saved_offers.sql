-- PO-approved: this new table only. Existing tables/policies/Auth are unchanged.
create table public.saved_offers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category text not null check (category in ('flight', 'stay', 'activity', 'rental_car', 'transfer')),
  provider text not null check (char_length(provider) between 1 and 80),
  offer_ref text not null check (char_length(offer_ref) between 1 and 128),
  title text not null check (char_length(title) between 1 and 200),
  url text not null check (char_length(url) between 9 and 2048 and url ~ '^https://[^/@[:space:]]+(/|$)'),
  destination text check (char_length(destination) between 1 and 200),
  starts_on date,
  ends_on date,
  starts_at time without time zone,
  ends_at time without time zone,
  start_timezone text check (char_length(start_timezone) between 1 and 64),
  end_timezone text check (char_length(end_timezone) between 1 and 64),
  source text not null check (source in ('manual', 'discovercars')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, offer_ref),
  check (starts_at is null or starts_on is not null),
  check (ends_at is null or ends_on is not null)
);

create index saved_offers_owner_created_idx on public.saved_offers (user_id, created_at desc);
alter table public.saved_offers enable row level security;
revoke all on public.saved_offers from public, anon, authenticated;
grant select, insert, delete on public.saved_offers to authenticated;
grant update (title, destination, starts_on, ends_on, starts_at, ends_at, start_timezone, end_timezone)
  on public.saved_offers to authenticated;

create policy saved_offers_select_own on public.saved_offers for select to authenticated
  using ((select auth.uid()) = user_id);
create policy saved_offers_insert_own on public.saved_offers for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy saved_offers_update_own on public.saved_offers for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy saved_offers_delete_own on public.saved_offers for delete to authenticated
  using ((select auth.uid()) = user_id);

comment on table public.saved_offers is 'Private offer references, never confirmed bookings. No prices, images or access tokens.';
