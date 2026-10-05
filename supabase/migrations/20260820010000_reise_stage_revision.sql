-- Jetnity V2 – Phase 2.2: Stage/Day-Zuordnung und technische Trip-Revision
--
-- Phase 2.1 kann eine mehrstufige Reise ohne Kalenderdaten anlegen. Tage
-- hatten dann keine eindeutige Etappe: `trip_days` kannte nur `day_index` und
-- ein optionales Datum. Welche Etappe ein Tag betrifft, folgte erst aus
-- `arrival_date`/`departure_date` – und die fehlen ohne Startdatum.
--
-- Änderung per Sprache braucht diese Zuordnung: „Mach Florenz einen Tag kürzer"
-- muss die Tage von Florenz finden, auch wenn die Reise noch keinen Zeitraum
-- hat. Deshalb `trip_days.stage_id`.
--
-- Gleichzeitig braucht ein Änderungsvorschlag eine eindeutige Fassung der
-- Reise. Zwei offene Tabs dürfen einander nicht überschreiben. Deshalb
-- `trips.revision` (optimistische Concurrency) und `trips.last_mutation_id`
-- (Idempotenz bei Retry/Doppelklick).
--
-- Bestehende Daten werden so zugeordnet:
--   1. Reisen mit genau einer Etappe: alle Tage daran.
--   2. Tage mit Datum in einem Etappen-Zeitraum: diese Etappe.
--   3. Mehrheit der Planpunkte eines Tages mit `stage_id`.
--   4. Rest: proportionale Aufteilung nach `day_index` und Etappenposition.
--
-- Production bleibt unberührt: Diese Migration gilt dem Development-Branch.

-- ---------------------------------------------------------------------------
-- 1. Technische Revision der Reise
-- ---------------------------------------------------------------------------

alter table public.trips
  add column revision integer not null default 1
    constraint trips_revision_bereich check (revision >= 1);

alter table public.trips
  add column last_mutation_id text
    constraint trips_last_mutation_id_laenge
      check (last_mutation_id is null or char_length(last_mutation_id) between 1 and 64);

-- Dieselbe Mutation darf pro Konto nur einmal gelten. NULL kollidiert nicht.
alter table public.trips
  add constraint trips_last_mutation_eindeutig unique (user_id, last_mutation_id);

comment on column public.trips.revision is
  'Technische Fassung der Reise. Steigt bei jeder übernommenen Änderung. Ein Vorschlag nennt die Fassung, auf der er beruht; eine veraltete Fassung wird abgelehnt (ADR-0057).';
comment on column public.trips.last_mutation_id is
  'Kennung der zuletzt übernommenen Änderung. Macht public.reise_aendern() idempotent: derselbe Aufruf ergibt dieselbe Reise, ohne die Änderung ein zweites Mal anzuwenden.';

-- ---------------------------------------------------------------------------
-- 2. Tag → Etappe
-- ---------------------------------------------------------------------------

alter table public.trip_days
  add column stage_id uuid;

alter table public.trip_days
  add constraint trip_days_etappe_fk
  foreign key (stage_id, trip_id)
  references public.trip_stages (id, trip_id)
  on delete set null (stage_id);

create index trip_days_etappe_idx on public.trip_days (stage_id, trip_id);

comment on column public.trip_days.stage_id is
  'Etappe, zu der dieser Tag gehört. Pflicht für neue mehrstufige Reisen, auch ohne Kalenderdatum. Optional, weil on delete set null und weil ein Tag nach dem Entfernen einer Etappe neu zugeordnet werden kann.';

-- ---------------------------------------------------------------------------
-- 3. Bestehende Tage zuordnen
-- ---------------------------------------------------------------------------

-- 3a. Genau eine Etappe.
update public.trip_days d
   set stage_id = s.id
  from public.trip_stages s
 where s.trip_id = d.trip_id
   and d.stage_id is null
   and not exists (
         select 1
           from public.trip_stages s2
          where s2.trip_id = d.trip_id
            and s2.id <> s.id
       );

-- 3b. Datum liegt im Zeitraum einer Etappe. Bei Überlappung gewinnt die
-- frühere Position, dann die kleinere Kennung.
update public.trip_days d
   set stage_id = s.id
  from public.trip_stages s
 where s.trip_id = d.trip_id
   and d.stage_id is null
   and d.day_date is not null
   and s.arrival_date is not null
   and s.departure_date is not null
   and d.day_date >= s.arrival_date
   and d.day_date <= s.departure_date
   and not exists (
         select 1
           from public.trip_stages s2
          where s2.trip_id = d.trip_id
            and s2.id <> s.id
            and s2.arrival_date is not null
            and s2.departure_date is not null
            and d.day_date >= s2.arrival_date
            and d.day_date <= s2.departure_date
            and (
              s2.position < s.position
              or (s2.position = s.position and s2.id < s.id)
            )
       );

-- 3c. Mehrheit der Planpunkte eines Tages nennt bereits eine Etappe.
update public.trip_days d
   set stage_id = gewaehlt.stage_id
  from (
    select distinct on (i.day_id)
           i.day_id,
           i.stage_id
      from public.trip_items i
     where i.day_id is not null
       and i.stage_id is not null
     group by i.day_id, i.stage_id
     order by i.day_id, count(*) desc, i.stage_id
  ) as gewaehlt
 where d.id = gewaehlt.day_id
   and d.stage_id is null;

-- 3d. Rest: Tage einer Reise gleichmässig auf ihre Etappen verteilen.
with etappen as (
  select
    s.trip_id,
    s.id,
    row_number() over (partition by s.trip_id order by s.position, s.id) as nr,
    count(*) over (partition by s.trip_id) as anzahl
  from public.trip_stages s
),
tage as (
  select
    d.id,
    d.trip_id,
    row_number() over (partition by d.trip_id order by d.day_index, d.id) as nr,
    count(*) over (partition by d.trip_id) as anzahl
  from public.trip_days d
  where d.stage_id is null
)
update public.trip_days d
   set stage_id = e.id
  from tage t
  join etappen e
    on e.trip_id = t.trip_id
   and e.nr = least(
         e.anzahl,
         greatest(1, ceil(t.nr::numeric * e.anzahl / greatest(t.anzahl, 1)))
       )
 where d.id = t.id;

-- Planpunkte ohne Etappe, deren Tag eine hat, übernehmen sie.
update public.trip_items i
   set stage_id = d.stage_id
  from public.trip_days d
 where i.day_id = d.id
   and i.stage_id is null
   and d.stage_id is not null;
