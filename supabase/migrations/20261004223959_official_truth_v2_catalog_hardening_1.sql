-- Official Truth v2 catalog hardening 1. LOCAL / UNAPPLIED to hosted projects.
-- Created with Supabase CLI 2.48.3 migration new official_truth_v2_catalog_hardening_1.
-- Inert DB registration guard only; executable verifier authority remains the
-- code-owned OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY.
begin;

-- Use the catalog writer's lock order. No existing identity is rewritten.
lock table private.official_sources, private.official_source_domains,
  private.official_source_blocked_domains, private.official_content_items,
  private.official_content_item_versions, private.official_content_representations,
  private.official_content_url_reservations, private.official_content_representation_urls in access exclusive mode;

create table private.official_content_identity_profile_pins (
  identity_profile_id text not null check (identity_profile_id ~ '^[a-z][a-z0-9_-]{1,63}$'),
  identity_profile_version integer not null check (identity_profile_version > 0),
  current boolean not null,
  primary key (identity_profile_id, identity_profile_version)
);
create unique index official_content_identity_profile_one_current
  on private.official_content_identity_profile_pins(identity_profile_id) where current;
alter table private.official_content_identity_profile_pins enable row level security;
alter table private.official_content_identity_profile_pins force row level security;
revoke all on table private.official_content_identity_profile_pins from public, anon, authenticated, service_role;
create trigger official_content_identity_profile_pins_immutable
before update or delete on private.official_content_identity_profile_pins
for each row execute function private.official_identity_immutable_v2();
create trigger official_content_identity_profile_pins_no_truncate
before truncate on private.official_content_identity_profile_pins
for each statement execute function private.official_identity_immutable_v2();
comment on table private.official_content_identity_profile_pins is
  'Inert DB registration guard, not executable profile authority. Append-only; no runtime mutator. Activation/retirement requires separately reviewed migration/transition.';

insert into private.official_content_identity_profile_pins(identity_profile_id, identity_profile_version, current)
values ('govuk-eta-national-list-content-api-en', 1, true);

-- Validate existing rows; unknown historical tuples fail the whole migration.
alter table private.official_content_representations
  add constraint official_content_representations_profile_pin_fk
  foreign key (identity_profile_id, identity_profile_version)
  references private.official_content_identity_profile_pins(identity_profile_id, identity_profile_version);

-- Source permission is exact; blocked domains still include their descendants.
create or replace function private.official_identity_authorized_url_v2(source_ text, url_ text)
returns boolean language sql stable set search_path = '' as $fn$
  select private.official_identity_url_v2(url_) and exists (
    select 1 from private.official_source_domains d
    where d.source_id = source_ and h.host = d.domain
  ) and not exists (
    select 1 from private.official_source_blocked_domains b
    where h.host = b.domain or pg_catalog.right(h.host, pg_catalog.length(b.domain)+1) = '.' || b.domain
  ) from (select pg_catalog.split_part(pg_catalog.substr(url_, 9), '/', 1) host) h;
$fn$;

create or replace function private.official_identity_representation_check_v2()
returns trigger language plpgsql set search_path = '' as $fn$
declare r private.official_content_representations%rowtype; n bigint; finals bigint; last_ordinal integer;
begin
  if tg_table_name = 'official_content_representations' then r := new;
  else
    select * into strict r from private.official_content_representations
    where (source_id, content_item_id, representation_id, representation_version) =
      (new.source_id, new.content_item_id, new.representation_id, new.representation_version);
  end if;
  if r.current and not exists (
    select 1 from private.official_content_identity_profile_pins p
    where p.identity_profile_id = r.identity_profile_id
      and p.identity_profile_version = r.identity_profile_version and p.current
  ) then raise exception 'current representation requires current profile pin' using errcode = '23514'; end if;
  if r.current and not exists (
    select 1 from private.official_content_item_versions i
    where (i.source_id, i.content_item_id, i.content_item_version) = (r.source_id, r.content_item_id, r.content_item_version) and i.current
  ) then raise exception 'current representation requires current item' using errcode = '23514'; end if;
  if exists (
    select 1 from private.official_content_representations other
    where (other.source_id, other.content_item_id, other.representation_id) = (r.source_id, r.content_item_id, r.representation_id)
      and (other.expected_media_type, other.expected_locale) is distinct from (r.expected_media_type, r.expected_locale)
  ) then raise exception 'representation stream format drift' using errcode = '23514'; end if;
  select pg_catalog.count(u.request_ordinal), pg_catalog.count(*) filter(where u.is_final), pg_catalog.max(u.request_ordinal)
    into n, finals, last_ordinal from private.official_content_representation_urls u
    where (u.source_id, u.content_item_id, u.representation_id, u.representation_version) =
      (r.source_id, r.content_item_id, r.representation_id, r.representation_version);
  if n not between 1 and 16 or n <> last_ordinal or finals <> 1 or exists (
    select 1 from private.official_content_representation_urls u
    where (u.source_id, u.content_item_id, u.representation_id, u.representation_version) =
      (r.source_id, r.content_item_id, r.representation_id, r.representation_version)
      and (u.is_final is distinct from (u.url = r.expected_final_url)
        or not private.official_identity_authorized_url_v2(r.source_id, u.url))
  ) then raise exception 'incomplete or unauthorized representation URLs' using errcode = '23514'; end if;
  if exists (
    select 1 from private.official_content_representation_urls a
    join private.official_content_representation_urls b on
      (b.source_id,b.content_item_id,b.representation_id,b.representation_version) =
      (a.source_id,a.content_item_id,a.representation_id,a.representation_version)
      and b.request_ordinal = a.request_ordinal + 1
    where (a.source_id,a.content_item_id,a.representation_id,a.representation_version) =
      (r.source_id,r.content_item_id,r.representation_id,r.representation_version) and a.url collate "C" >= b.url collate "C"
  ) then raise exception 'request URLs must be sorted' using errcode = '23514'; end if;
  return null;
end;
$fn$;

create or replace function public.official_truth_source_catalog_v2(payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $fn$
declare
  operation text; body jsonb; element record; domain_text text;
  incoming text[] := '{}'::text[]; sorted_domains text[]; stored_domains text[];
  stored_class text; stored_publisher text; stored_authority text;
  neu_source_id text; neu_source_class text; neu_publisher text; neu_authority text;
  item_ jsonb; reps jsonb; rep jsonb; value_ jsonb; stored_item jsonb; stored_reps jsonb;
  urls text[]; publishers text[]; authorities text[]; url_ text; ordinal_ integer;
begin
  if pg_catalog.jsonb_typeof(payload) is distinct from 'object'
    or pg_catalog.jsonb_typeof(payload -> 'operation') is distinct from 'string' then
    raise exception 'invalid v2 catalog payload' using errcode = '22023';
  end if;
  operation := payload ->> 'operation';
  if operation = 'read_registry' then
    perform private.official_identity_object_v2(payload, '{"operation":"string"}');
    -- All collections belong to this ONE statement snapshot.
    return pg_catalog.jsonb_build_object(
      'ok', true, 'operation', operation, 'identity_schema', 2,
      'sources', (select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
        'source_id', s.source_id, 'source_class', s.source_class, 'publisher_name', s.publisher_name,
        'authority_name', s.authority_name, 'domains', (select coalesce(pg_catalog.jsonb_agg(d.domain order by d.domain collate "C"), '[]'::jsonb)
          from private.official_source_domains d where d.source_id = s.source_id)) order by s.source_id collate "C"), '[]'::jsonb) from private.official_sources s),
      'blocked_domains', (select coalesce(pg_catalog.jsonb_agg(domain order by domain collate "C"), '[]'::jsonb) from private.official_source_blocked_domains),
      'content_items', (select coalesce(pg_catalog.jsonb_agg(pg_catalog.to_jsonb(i) - 'source_class' order by source_id collate "C", content_item_id collate "C"), '[]'::jsonb) from private.official_content_items i),
      'item_versions', (select coalesce(pg_catalog.jsonb_agg(pg_catalog.to_jsonb(i) order by source_id collate "C", content_item_id collate "C", content_item_version), '[]'::jsonb) from private.official_content_item_versions i),
      'representations', (select coalesce(pg_catalog.jsonb_agg(pg_catalog.to_jsonb(r) order by source_id collate "C", content_item_id collate "C", representation_id collate "C", representation_version), '[]'::jsonb) from private.official_content_representations r),
      'representation_urls', (select coalesce(pg_catalog.jsonb_agg(pg_catalog.to_jsonb(u) order by source_id collate "C", content_item_id collate "C", representation_id collate "C", representation_version, request_ordinal nulls last, url collate "C"), '[]'::jsonb) from private.official_content_representation_urls u),
      'url_reservations', (select coalesce(pg_catalog.jsonb_agg(pg_catalog.to_jsonb(u) order by url collate "C"), '[]'::jsonb) from private.official_content_url_reservations u)
    );
  end if;
  if operation not in ('register_source', 'register_content_item') then
    raise exception 'unsupported v2 catalog operation' using errcode = '22023';
  end if;
  if pg_catalog.current_setting('transaction_isolation') <> 'read committed' then
    raise exception 'catalog writes require READ COMMITTED' using errcode = '0A000';
  end if;
  -- One lock order for all catalog writers. Unique keys additionally protect
  -- external identity and URL ownership at every transaction isolation level.
  lock table private.official_sources, private.official_source_domains,
    private.official_source_blocked_domains, private.official_content_items,
    private.official_content_item_versions, private.official_content_representations,
    private.official_content_url_reservations, private.official_content_representation_urls in share row exclusive mode;
  if operation = 'register_content_item' then
    perform private.official_identity_object_v2(payload, '{"operation":"string","item":"object","representations":"array"}');
    item_ := payload -> 'item';
    perform private.official_identity_object_v2(item_, '{"source_id":"string","content_item_id":"string","external_id_namespace":"string","external_content_id":"string","content_item_version":"number","current":"boolean","expected_publisher_ids":"array","expected_authority_ids":"array"}');
    if item_ -> 'content_item_version' <> '1'::jsonb or item_ -> 'current' <> 'true'::jsonb
      or pg_catalog.jsonb_array_length(payload -> 'representations') not between 1 and 16
      or exists (select 1 from pg_catalog.jsonb_array_elements(item_ -> 'expected_publisher_ids') x where pg_catalog.jsonb_typeof(x) <> 'string')
      or exists (select 1 from pg_catalog.jsonb_array_elements(item_ -> 'expected_authority_ids') x where pg_catalog.jsonb_typeof(x) <> 'string') then
      raise exception 'initial item requires version 1 and bounded descriptors' using errcode = '22023';
    end if;
    publishers := array(select pg_catalog.jsonb_array_elements_text(item_ -> 'expected_publisher_ids'));
    authorities := array(select pg_catalog.jsonb_array_elements_text(item_ -> 'expected_authority_ids'));
    if not private.official_identity_ids_v2(publishers) or not private.official_identity_ids_v2(authorities) then
      raise exception 'invalid publisher/authority pins' using errcode = '22023';
    end if;
    if not exists(select 1 from private.official_sources s where s.source_id = item_ ->> 'source_id' and s.source_class = 'official_authority') then
      raise exception 'item requires registered official authority' using errcode = '23503';
    end if;
    for rep in select value from pg_catalog.jsonb_array_elements(payload -> 'representations') loop
      perform private.official_identity_object_v2(rep, '{"representation_id":"string","representation_version":"number","current":"boolean","request_urls":"array","expected_final_url":"string","expected_media_type":"string","identity_profile_id":"string","identity_profile_version":"number","expected_locale":"string|null","expected_schema":"string|null"}');
      if rep -> 'representation_version' <> '1'::jsonb or rep -> 'current' <> 'true'::jsonb
        or pg_catalog.jsonb_array_length(rep -> 'request_urls') not between 1 and 16
        or exists(select 1 from pg_catalog.jsonb_array_elements(rep -> 'request_urls') x where pg_catalog.jsonb_typeof(x) <> 'string') then
        raise exception 'invalid initial representation' using errcode = '22023';
      end if;
      -- Inert availability only. Executable verifier authority stays in code.
      -- Check before replay and every insert, including multi-representation input.
      if not exists (
        select 1 from private.official_content_identity_profile_pins p
        where p.identity_profile_id = rep ->> 'identity_profile_id'
          and p.identity_profile_version = (rep ->> 'identity_profile_version')::integer and p.current
      ) then raise exception 'unavailable content identity profile pin' using errcode = '22023'; end if;
      urls := array(select pg_catalog.jsonb_array_elements_text(rep -> 'request_urls'));
      if urls is distinct from (select pg_catalog.array_agg(distinct u collate "C" order by u collate "C") from pg_catalog.unnest(urls) u) then
        raise exception 'request URLs must be sorted and unique' using errcode = '22023';
      end if;
      foreach url_ in array pg_catalog.array_append(urls, rep ->> 'expected_final_url') loop
        if not private.official_identity_authorized_url_v2(item_ ->> 'source_id', url_) then
          raise exception 'unauthorized exact content URL' using errcode = '22023';
        end if;
      end loop;
    end loop;
    if (select pg_catalog.count(distinct x ->> 'representation_id') from pg_catalog.jsonb_array_elements(payload -> 'representations') x)
      <> pg_catalog.jsonb_array_length(payload -> 'representations') then
      raise exception 'duplicate representation stream' using errcode = '22023';
    end if;
    select pg_catalog.jsonb_agg(x order by (x ->> 'representation_id') collate "C") into reps
      from pg_catalog.jsonb_array_elements(payload -> 'representations') x;
    select (pg_catalog.to_jsonb(i) - 'source_class') || (pg_catalog.to_jsonb(v) - 'source_id' - 'content_item_id') into stored_item
      from private.official_content_items i join private.official_content_item_versions v using(source_id, content_item_id)
      where i.source_id = item_ ->> 'source_id' and i.content_item_id = item_ ->> 'content_item_id' and v.content_item_version = 1;
    if found then
      select pg_catalog.jsonb_agg((pg_catalog.to_jsonb(r) - array['source_id','content_item_id','content_item_version']) ||
        pg_catalog.jsonb_build_object('request_urls', (select pg_catalog.jsonb_agg(u.url order by u.request_ordinal)
          from private.official_content_representation_urls u where
          (u.source_id,u.content_item_id,u.representation_id,u.representation_version) =
          (r.source_id,r.content_item_id,r.representation_id,r.representation_version) and u.request_ordinal is not null))
        order by r.representation_id collate "C", r.representation_version) into stored_reps
        from private.official_content_representations r where r.source_id = item_ ->> 'source_id' and r.content_item_id = item_ ->> 'content_item_id';
      if stored_item = item_ and stored_reps = reps then
        return pg_catalog.jsonb_build_object('ok',true,'identity_schema',2,'operation',operation,'outcome','idempotent',
          'source_id',item_ ->> 'source_id','content_item_id',item_ ->> 'content_item_id');
      end if;
      raise exception 'conflicting content item registration' using errcode = '23505';
    end if;
    set constraints private.official_content_representation_complete, private.official_content_urls_complete deferred;
    insert into private.official_content_items(source_id,content_item_id,external_id_namespace,external_content_id)
      values(item_ ->> 'source_id',item_ ->> 'content_item_id',item_ ->> 'external_id_namespace',item_ ->> 'external_content_id');
    insert into private.official_content_item_versions values(item_ ->> 'source_id',item_ ->> 'content_item_id',1,true,publishers,authorities);
    for rep in select value from pg_catalog.jsonb_array_elements(reps) loop
      insert into private.official_content_representations values(item_ ->> 'source_id',item_ ->> 'content_item_id',1,
        rep ->> 'representation_id',1,true,rep ->> 'expected_final_url',rep ->> 'expected_media_type',
        rep ->> 'identity_profile_id',(rep ->> 'identity_profile_version')::integer,rep ->> 'expected_locale',rep ->> 'expected_schema');
      urls := array(select pg_catalog.jsonb_array_elements_text(rep -> 'request_urls'));
      if not (rep ->> 'expected_final_url') = any(urls) then urls := pg_catalog.array_append(urls, rep ->> 'expected_final_url'); end if;
      ordinal_ := 0;
      foreach url_ in array urls loop
        ordinal_ := ordinal_ + 1;
        insert into private.official_content_url_reservations values(url_,item_ ->> 'source_id',item_ ->> 'content_item_id',rep ->> 'representation_id');
        insert into private.official_content_representation_urls values(item_ ->> 'source_id',item_ ->> 'content_item_id',rep ->> 'representation_id',1,url_,
          case when ordinal_ <= pg_catalog.jsonb_array_length(rep -> 'request_urls') then ordinal_ else null end,
          url_ = rep ->> 'expected_final_url');
      end loop;
    end loop;
    set constraints private.official_content_representation_complete, private.official_content_urls_complete immediate;
    return pg_catalog.jsonb_build_object('ok',true,'identity_schema',2,'operation',operation,'outcome','inserted',
      'source_id',item_ ->> 'source_id','content_item_id',item_ ->> 'content_item_id');
  end if;
  -- Unchanged v1 authority/domain validation and exact-set idempotence follow.
  if operation is distinct from 'register_source' then
    raise exception 'official source catalog operation is not supported'
      using errcode = '22023';
  end if;

  if payload - 'operation' - 'source' is distinct from '{}'::jsonb then
    raise exception 'official source catalog source payload is not valid'
      using errcode = '22023';
  end if;

  body := payload -> 'source';
  if body is null or pg_catalog.jsonb_typeof(body) is distinct from 'object' then
    raise exception 'official source catalog source is not an object'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from pg_catalog.jsonb_object_keys(body) as key(name)
    where key.name not in (
      'source_id',
      'source_class',
      'publisher_name',
      'authority_name',
      'domains'
    )
  ) then
    raise exception 'official source catalog source payload is not valid'
      using errcode = '22023';
  end if;

  if pg_catalog.jsonb_typeof(body -> 'source_id') is distinct from 'string'
    or pg_catalog.jsonb_typeof(body -> 'source_class') is distinct from 'string'
    or pg_catalog.jsonb_typeof(body -> 'publisher_name') is distinct from 'string'
    or pg_catalog.jsonb_typeof(body -> 'domains') is distinct from 'array' then
    raise exception 'official source catalog source payload is not valid'
      using errcode = '22023';
  end if;

  neu_source_id := body ->> 'source_id';
  neu_source_class := body ->> 'source_class';
  neu_publisher := body ->> 'publisher_name';

  if neu_source_id !~ '^[a-z][a-z0-9_-]{1,63}$' then
    raise exception 'official source catalog source id is invalid'
      using errcode = '22023';
  end if;

  if neu_source_class not in ('official_authority', 'licensed_evidence_provider') then
    raise exception 'official source catalog source class is invalid'
      using errcode = '22023';
  end if;

  if neu_publisher is null
    or pg_catalog.char_length(neu_publisher) < 2
    or pg_catalog.char_length(neu_publisher) > 80
    or neu_publisher is distinct from pg_catalog.btrim(neu_publisher)
    or neu_publisher ~ '[[:cntrl:]]'
    or position('://' in neu_publisher) > 0 then
    raise exception 'official source catalog publisher name is invalid'
      using errcode = '22023';
  end if;

  if body ? 'authority_name'
    and pg_catalog.jsonb_typeof(body -> 'authority_name') is distinct from 'string'
    and pg_catalog.jsonb_typeof(body -> 'authority_name') is distinct from 'null' then
    raise exception 'official source catalog source payload is not valid'
      using errcode = '22023';
  end if;

  if not body ? 'authority_name' or pg_catalog.jsonb_typeof(body -> 'authority_name') = 'null' then
    neu_authority := null;
  else
    neu_authority := body ->> 'authority_name';
  end if;

  if neu_source_class = 'licensed_evidence_provider' then
    if neu_authority is not null then
      raise exception 'licensed provider is not an authority'
        using errcode = '22023';
    end if;
  elsif neu_authority is null
    or pg_catalog.char_length(neu_authority) < 2
    or pg_catalog.char_length(neu_authority) > 80
    or neu_authority is distinct from pg_catalog.btrim(neu_authority)
    or neu_authority ~ '[[:cntrl:]]'
    or position('://' in neu_authority) > 0 then
    raise exception 'official source catalog authority is required'
      using errcode = '22023';
  end if;

  for element in
    select item.value
    from pg_catalog.jsonb_array_elements(body -> 'domains') as item(value)
  loop
    if pg_catalog.jsonb_typeof(element.value) is distinct from 'string' then
      raise exception 'official source catalog domain is invalid'
        using errcode = '22023';
    end if;
    domain_text := element.value #>> '{}';
    if domain_text is null
      or pg_catalog.char_length(domain_text) < 1
      or pg_catalog.char_length(domain_text) > 253
      or domain_text !~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$'
      or domain_text ~ '\.\.'
      or domain_text ~ '^[0-9]+(\.[0-9]+)+$'
      or domain_text = 'localhost'
      or domain_text like '%.localhost'
      or domain_text like '%.local' then
      raise exception 'official source catalog domain is invalid'
        using errcode = '22023';
    end if;
    if not domain_text = any (incoming) then
      incoming := pg_catalog.array_append(incoming, domain_text);
    end if;
  end loop;

  if coalesce(pg_catalog.cardinality(incoming), 0) = 0 then
    raise exception 'official source catalog domains are empty'
      using errcode = '22023';
  end if;

  select pg_catalog.array_agg(item.domain order by item.domain)
  into sorted_domains
  from pg_catalog.unnest(incoming) as item(domain);

  lock table private.official_sources in share row exclusive mode;
  lock table private.official_source_domains in share row exclusive mode;

  select
    source.source_class,
    source.publisher_name,
    source.authority_name
  into stored_class, stored_publisher, stored_authority
  from private.official_sources as source
  where source.source_id = neu_source_id;

  if found then
    select pg_catalog.array_agg(domain.domain order by domain.domain)
    into stored_domains
    from private.official_source_domains as domain
    where domain.source_id = neu_source_id;

    if stored_class is not distinct from neu_source_class
      and stored_publisher is not distinct from neu_publisher
      and stored_authority is not distinct from neu_authority
      and coalesce(stored_domains, '{}'::pg_catalog.text[]) is not distinct from sorted_domains then
      return pg_catalog.jsonb_build_object(
        'ok', true, 'identity_schema', 2,
        'operation', 'register_source',
        'outcome', 'idempotent',
        'source_id', neu_source_id
      );
    end if;

    raise exception 'conflicting official source'
      using errcode = '23505';
  end if;

  insert into private.official_sources (
    source_id,
    source_class,
    publisher_name,
    authority_name
  ) values (
    neu_source_id,
    neu_source_class,
    neu_publisher,
    neu_authority
  );

  foreach domain_text in array incoming loop
    if exists (
      select 1
      from private.official_source_domains as existing
      where existing.source_id is distinct from neu_source_id
        and (
          existing.domain = domain_text
          or pg_catalog.right(existing.domain, pg_catalog.char_length(domain_text) + 1)
            = '.' || domain_text
          or pg_catalog.right(domain_text, pg_catalog.char_length(existing.domain) + 1)
            = '.' || existing.domain
        )
    ) then
      raise exception 'overlapping official source domain'
        using errcode = '23505';
    end if;

    insert into private.official_source_domains (source_id, domain)
    values (neu_source_id, domain_text);
  end loop;

  return pg_catalog.jsonb_build_object(
    'ok', true, 'identity_schema', 2,
    'operation', 'register_source',
    'outcome', 'inserted',
    'source_id', neu_source_id
  );
end;
$fn$;

-- CREATE OR REPLACE preserves ACLs; restate the reviewed boundary explicitly.
revoke all on function private.official_identity_authorized_url_v2(text, text) from public, anon, authenticated, service_role;
revoke all on function private.official_identity_representation_check_v2() from public, anon, authenticated, service_role;
revoke all on function public.official_truth_source_catalog_v2(jsonb) from public, anon, authenticated, service_role;
grant execute on function public.official_truth_source_catalog_v2(jsonb) to service_role;
commit;
