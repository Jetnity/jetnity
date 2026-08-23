-- Foundation E Re-Review: Backfill ohne erfundene Document↔Citizenship-
-- Relation und deadlock-freier Parent-Lock für Child-Limits.
-- Nur Development. Keine Production-Migration ohne separates Gate.
--
-- 1) Der ursprüngliche Legacy-Backfill setzte citizenship_id, wenn
--    Ausstellerland = Nationalität. Das alte Modell speicherte keine
--    explizite Relation. Neutralisierung nur für genau diese Backfill-Form:
--    Legacy-Issuer-Spalte + Backfill-client_ref.
-- 2) FOR NO KEY UPDATE serialisiert Child-Inserts, ohne mit dem FK
--    KEY SHARE zu deadlocken.

update public.trip_traveller_documents d
set citizenship_id = null
from public.trip_travellers t
join public.trip_traveller_citizenships c
  on c.traveller_id = t.id
 and c.trip_id = t.trip_id
 and c.user_id = t.user_id
where d.traveller_id = t.id
  and d.trip_id = t.trip_id
  and d.user_id = t.user_id
  and d.citizenship_id = c.id
  and t.document_issuing_country_code is not null
  and t.document_issuing_country_code = d.issuing_country_code
  and t.document_issuing_country_code = c.country_code
  and c.client_ref = 'citizenship:' || c.country_code
  and d.client_ref = 'document:' || d.document_type || ':' || coalesce(d.issuing_country_code, 'xx');

create or replace function public.trip_traveller_kinder_limit_pruefen()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  perform 1
  from public.trip_travellers
  where id = new.traveller_id
    and trip_id = new.trip_id
    and user_id = new.user_id
  for no key update;

  if tg_table_name = 'trip_traveller_citizenships' then
    if (
      select count(*) from public.trip_traveller_citizenships
      where traveller_id = new.traveller_id
    ) > 8 then
      raise exception 'Ein Reisender trägt höchstens 8 Staatsbürgerschaften.'
        using errcode = 'check_violation';
    end if;
  elsif tg_table_name = 'trip_traveller_documents' then
    if (
      select count(*) from public.trip_traveller_documents
      where traveller_id = new.traveller_id
    ) > 12 then
      raise exception 'Ein Reisender trägt höchstens 12 Reisedokumente.'
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;
