-- Foundation E Nachtrag: Composite-FK-Delete und parallele Child-Limits.
-- Nur Development. Keine Production-Migration ohne separates Gate.
--
-- 1) Unqualifiziertes ON DELETE SET NULL auf Composite-FKs würde NOT-NULL-
--    Spalten nullen. Citizenship-Löschung nullt nur citizenship_id.
--    Traveller-spezifische Readiness folgt dem Reisenden (CASCADE).
-- 2) Child-Limits sperren die Parent-Zeile, damit parallele Direct-Writes
--    das Limit nicht per MVCC-Race umgehen.

alter table public.trip_traveller_documents
  drop constraint if exists trip_traveller_documents_citizenship_fk;

alter table public.trip_traveller_documents
  add constraint trip_traveller_documents_citizenship_fk
    foreign key (citizenship_id, traveller_id, trip_id, user_id)
    references public.trip_traveller_citizenships (id, traveller_id, trip_id, user_id)
    on delete set null (citizenship_id);

alter table public.trip_readiness_items
  drop constraint if exists trip_readiness_items_traveller_fk;

alter table public.trip_readiness_items
  add constraint trip_readiness_items_traveller_fk
    foreign key (traveller_id, trip_id, user_id)
    references public.trip_travellers (id, trip_id, user_id)
    on delete cascade;

comment on column public.trip_readiness_items.traveller_id is
  'Optional. Nur für traveller-spezifische Vorbereitung. Trip-level bleibt null. Löschen des Reisenden entfernt diese Zeilen (CASCADE).';

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
  for update;

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
