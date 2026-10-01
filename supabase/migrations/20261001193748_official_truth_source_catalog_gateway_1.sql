-- Jetnity V2 – Official Truth source catalog gateway 1
--
-- Repository migration only. Cursor does not apply this file to Development
-- or Production. The filename comes from
-- `supabase migration new official_truth_source_catalog_gateway_1`
-- with Supabase CLI 2.48.3. The timestamp was not typed by hand.
--
-- Depends on private.official_sources and private.official_source_domains
-- from 20261001121258_official_truth_private_evidence_store_schema_1.
-- This file does not create those tables and does not insert a catalog row.
--
-- One public gateway: public.official_truth_source_catalog_v1(jsonb).
-- Operations are only read_registry and register_source.
-- lib/readiness/source-registry.ts stays the canonical trust rule.
-- This function is a second gate for the same rule, not a second model.
--
-- register_source writes one source and its domains in this function.
-- There is no exception handler. A later domain rejection rolls the
-- statement back, including the source row and any domain already written
-- in this call. Exact duplicate of source fields and the complete domain
-- set returns without writing. Any other reuse of that source id fails
-- closed. A domain is never detached or moved to another source.
--
-- Parent and child hostnames on the same new source are accepted because
-- quellenRegistryErstellen accepts them. The same pair across two sources
-- is rejected. Overlap is exact equality or a dot-boundary parent/child.
--
-- search_path is empty. Relation and function references in the body are
-- schema-qualified, except the SQL-standard coalesce keyword. EXECUTE is
-- granted only to service_role. No table privilege is granted. No policy.

create function public.official_truth_source_catalog_v1(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  operation text;
  body jsonb;
  element record;
  domain_text text;
  incoming text[] := '{}'::pg_catalog.text[];
  sorted_domains text[];
  stored_domains text[];
  stored_class text;
  stored_publisher text;
  stored_authority text;
  neu_source_id text;
  neu_source_class text;
  neu_publisher text;
  neu_authority text;
begin
  if payload is null or pg_catalog.jsonb_typeof(payload) is distinct from 'object' then
    raise exception 'official source catalog payload is not an object'
      using errcode = '22023';
  end if;

  if pg_catalog.jsonb_typeof(payload -> 'operation') is distinct from 'string' then
    raise exception 'official source catalog operation is not supported'
      using errcode = '22023';
  end if;

  operation := payload ->> 'operation';

  if operation = 'read_registry' then
    if payload - 'operation' is distinct from '{}'::jsonb then
      raise exception 'official source catalog read payload is not valid'
        using errcode = '22023';
    end if;

    return pg_catalog.jsonb_build_object(
      'ok', true,
      'operation', 'read_registry',
      'sources', (
        select coalesce(
          pg_catalog.jsonb_agg(
            pg_catalog.jsonb_build_object(
              'source_id', source.source_id,
              'source_class', source.source_class,
              'publisher_name', source.publisher_name,
              'authority_name', source.authority_name,
              'domains', (
                select coalesce(
                  pg_catalog.jsonb_agg(domain.domain order by domain.domain),
                  pg_catalog.jsonb_build_array()
                )
                from private.official_source_domains as domain
                where domain.source_id = source.source_id
              )
            )
            order by source.source_id
          ),
          pg_catalog.jsonb_build_array()
        )
        from private.official_sources as source
      )
    );
  end if;

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
        'ok', true,
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
    'ok', true,
    'operation', 'register_source',
    'outcome', 'inserted',
    'source_id', neu_source_id
  );
end;
$fn$;

comment on function public.official_truth_source_catalog_v1(jsonb) is
  'Trusted read and one-source registration for the private Official Truth source catalog. Not an Official-Truth engine. Exact duplicates return without writing. Conflicts and cross-source domain overlap fail closed. No catalog seed. EXECUTE is service_role only.';

revoke all on function public.official_truth_source_catalog_v1(jsonb) from public;
revoke all on function public.official_truth_source_catalog_v1(jsonb) from anon;
revoke all on function public.official_truth_source_catalog_v1(jsonb) from authenticated;
revoke all on function public.official_truth_source_catalog_v1(jsonb) from service_role;
grant execute on function public.official_truth_source_catalog_v1(jsonb) to service_role;
