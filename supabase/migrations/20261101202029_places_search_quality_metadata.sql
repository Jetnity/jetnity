-- Additive Suchmetadaten: vorhandene IDs und Reise-FKs bleiben unverändert.
-- Nur nach geprüftem Referenzdaten-Rollout auf Production anwenden.
alter table public.places
  add column population bigint constraint places_population_bereich check (population is null or population >= 0),
  add column feature_code text constraint places_feature_code_form check (feature_code is null or feature_code ~ '^[A-Z0-9]{1,10}$');

comment on column public.places.population is 'Einwohnerzahl aus GeoNames, nur Gleichstand im Suchrang; null bedeutet unbekannt, keine touristische Relevanzbehauptung.';
comment on column public.places.feature_code is 'Original-Featurecode aus GeoNames für nachprüfbare Typzuordnung; keine Provider- oder Reiseautorität.';

create index places_country_typ_idx on public.places (country_code, typ);
-- Deterministische Kandidatenreihenfolge nach exaktem Retrieval.
create index places_population_id_idx on public.places (population desc nulls last, id);
