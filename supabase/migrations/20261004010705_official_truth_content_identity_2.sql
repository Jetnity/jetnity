-- Official Truth content identity S1. Repository definition; never a live apply.
-- Generated with npx --yes supabase@2.48.3 migration new official_truth_content_identity_2.
-- Source identity stays authority-level. SQL proves structure, not HTTP/legal truth.
begin;

-- Locks precede every DDL change. Missing prerequisites fail closed too.
lock table private.official_sources, private.official_source_domains,
  private.official_evidence_versions, private.official_rule_claims,
  private.official_rule_claim_support, private.official_rule_claim_requirement_effect,
  private.official_rule_claim_visa_options, private.official_rule_claim_stay_limit,
  private.official_rule_claim_passport_validity, private.official_rule_claim_blank_pages,
  private.official_rule_claim_transit_paths, private.official_rule_claim_actions,
  private.official_rule_claim_temporal_rule in access exclusive mode;

do $gate$
declare rel record; rows_found bigint;
begin
  -- Include every present dependent fact table, not just the known minimum.
  for rel in
    select c.relname from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'private' and c.relkind in ('r', 'p')
      and (c.relname in ('official_sources', 'official_source_domains', 'official_evidence_versions', 'official_rule_claims')
        or c.relname like 'official\_rule\_claim\_%' escape '\')
    order by c.relname
  loop
    execute pg_catalog.format('lock table private.%I in access exclusive mode', rel.relname);
    execute pg_catalog.format('select count(*) from private.%I', rel.relname) into rows_found;
    if rows_found <> 0 then
      raise exception 'content identity cutover requires empty table: %', rel.relname using errcode = '55000';
    end if;
  end loop;
end;
$gate$;

-- Closed, typed JSON objects. Every named field is required, including explicit
-- nulls; unknown fields never disappear during jsonb-to-record coercion.
create function private.official_identity_object_v2(body jsonb, shape jsonb)
returns void language plpgsql immutable set search_path = '' as $fn$
declare field record; actual text;
begin
  if pg_catalog.jsonb_typeof(body) is distinct from 'object'
    or (select pg_catalog.count(*) from pg_catalog.jsonb_object_keys(body))
       <> (select pg_catalog.count(*) from pg_catalog.jsonb_object_keys(shape)) then
    raise exception 'invalid v2 object shape' using errcode = '22023';
  end if;
  for field in select * from pg_catalog.jsonb_each_text(shape) loop
    actual := pg_catalog.jsonb_typeof(body -> field.key);
    if actual is null or not actual = any(pg_catalog.string_to_array(field.value, '|')) then
      raise exception 'invalid v2 field: %', field.key using errcode = '22023';
    end if;
    if actual = 'number' and ((body ->> field.key)::numeric <> pg_catalog.trunc((body ->> field.key)::numeric)
      or (body ->> field.key)::numeric not between -2147483648 and 2147483647) then
      raise exception 'invalid v2 integer: %', field.key using errcode = '22023';
    end if;
  end loop;
end;
$fn$;

create function private.official_identity_domain_v2(value text)
returns boolean language sql immutable set search_path = '' as $fn$
  select coalesce(pg_catalog.char_length(value) between 1 and 253
    and value ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$'
    and value !~* '^(0x[0-9a-f]+|[0-9]+)(\.(0x[0-9a-f]+|[0-9]+))*$' and value not like '%.localhost' and value not like '%.local', false);
$fn$;

-- Conservative canonical ASCII URL subset: canonical lower-case DNS authority,
-- explicit slash, default HTTPS port only, exact ordered query, no fragment,
-- wildcard, dot-segment, credentials, path backslash or malformed percent escape.
-- No DNS/HTTP authenticity claim is made by this structural check.
create function private.official_identity_url_v2(value text)
returns boolean language plpgsql immutable set search_path = '' as $fn$
declare host text; path text; query_ text;
begin
  if value is null or pg_catalog.char_length(value) not between 12 and 500
    or value !~ '^https://[a-z0-9.-]+/[!-~]*$'
    or value ~ '[*#"<>]' or value ~ '%(?![A-Fa-f0-9]{2})' then return false; end if;
  host := pg_catalog.split_part(pg_catalog.substr(value, 9), '/', 1);
  path := pg_catalog.split_part(pg_catalog.substr(value, 9 + pg_catalog.length(host)), '?', 1);
  query_ := case when position('?' in value) > 0 then pg_catalog.substr(value, position('?' in value) + 1) else '' end;
  if not private.official_identity_domain_v2(host)
    or position(pg_catalog.chr(92) in path) > 0 or path ~ '[{}`]'
    or position('''' in query_) > 0
    or path ~* '(^|/)(\.|%2e){1,2}(/|$)' then return false; end if;
  return true;
end;
$fn$;

create function private.official_identity_ids_v2(values_ text[])
returns boolean language sql immutable set search_path = '' as $fn$
  select coalesce(pg_catalog.array_ndims(values_) = 1 and pg_catalog.array_lower(values_, 1) = 1
    and pg_catalog.cardinality(values_) between 1 and 8
    and not exists(select 1 from pg_catalog.unnest(values_) x where x is null or x !~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$')
    and values_ = (select pg_catalog.array_agg(distinct x collate "C" order by x collate "C") from pg_catalog.unnest(values_) x), false);
$fn$;

create table private.official_source_blocked_domains (
  domain text primary key check (private.official_identity_domain_v2(domain))
);

create table private.official_content_items (
  source_id text not null,
  content_item_id text not null check (content_item_id ~ '^[a-z][a-z0-9_-]{1,63}$'),
  external_id_namespace text not null check (external_id_namespace ~ '^[a-z][a-z0-9_-]{1,63}$'),
  external_content_id text not null check (external_content_id ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$'),
  source_class text not null default 'official_authority' check (source_class = 'official_authority'),
  primary key (source_id, content_item_id),
  unique (source_id, external_id_namespace, external_content_id),
  foreign key (source_id, source_class) references private.official_sources(source_id, source_class)
);

create table private.official_content_item_versions (
  source_id text not null,
  content_item_id text not null,
  content_item_version integer not null check (content_item_version > 0),
  current boolean not null,
  expected_publisher_ids text[] not null check (private.official_identity_ids_v2(expected_publisher_ids)),
  expected_authority_ids text[] not null check (private.official_identity_ids_v2(expected_authority_ids)),
  primary key (source_id, content_item_id, content_item_version),
  foreign key (source_id, content_item_id) references private.official_content_items(source_id, content_item_id)
);
create unique index official_content_item_one_current
  on private.official_content_item_versions(source_id, content_item_id) where current;

create table private.official_content_representations (
  source_id text not null,
  content_item_id text not null,
  content_item_version integer not null,
  representation_id text not null check (representation_id ~ '^[a-z][a-z0-9_-]{1,63}$'),
  representation_version integer not null check (representation_version > 0),
  current boolean not null,
  expected_final_url text not null check (private.official_identity_url_v2(expected_final_url)),
  expected_media_type text not null check (expected_media_type ~ '^[a-z0-9][a-z0-9!#$&^_.+-]{0,63}/[a-z0-9][a-z0-9!#$&^_.+-]{0,63}$'),
  identity_profile_id text not null check (identity_profile_id ~ '^[a-z][a-z0-9_-]{1,63}$'),
  identity_profile_version integer not null check (identity_profile_version > 0),
  expected_locale text check (expected_locale ~ '^[a-z]{2,3}(-[A-Za-z0-9]{2,8}){0,3}$'),
  expected_schema text check (expected_schema ~ '^[a-z][a-z0-9_-]{1,63}$'),
  primary key (source_id, content_item_id, representation_id, representation_version),
  foreign key (source_id, content_item_id, content_item_version)
    references private.official_content_item_versions(source_id, content_item_id, content_item_version),
  constraint official_content_representation_evidence_key unique
    (source_id, content_item_id, content_item_version, representation_id, representation_version,
     identity_profile_id, identity_profile_version, expected_media_type, expected_final_url)
);
create unique index official_content_representation_one_current
  on private.official_content_representations(source_id, content_item_id, representation_id) where current;

-- One global reservation per exact URL; a separate version binding lets the
-- SAME stream reuse its URL without letting another stream take historical URLs.
create table private.official_content_url_reservations (
  url text primary key check (private.official_identity_url_v2(url)),
  source_id text not null,
  content_item_id text not null,
  representation_id text not null check (representation_id ~ '^[a-z][a-z0-9_-]{1,63}$'),
  unique (url, source_id, content_item_id, representation_id),
  foreign key (source_id, content_item_id) references private.official_content_items(source_id, content_item_id)
);
create table private.official_content_representation_urls (
  source_id text not null,
  content_item_id text not null,
  representation_id text not null,
  representation_version integer not null,
  url text not null,
  request_ordinal integer check (request_ordinal between 1 and 16),
  is_final boolean not null,
  check (request_ordinal is not null or is_final),
  primary key (source_id, content_item_id, representation_id, representation_version, url),
  unique (source_id, content_item_id, representation_id, representation_version, request_ordinal),
  foreign key (source_id, content_item_id, representation_id, representation_version)
    references private.official_content_representations(source_id, content_item_id, representation_id, representation_version),
  foreign key (url, source_id, content_item_id, representation_id)
    references private.official_content_url_reservations(url, source_id, content_item_id, representation_id)
);
create index official_content_urls_reservation on private.official_content_representation_urls(url);

create function private.official_identity_authorized_url_v2(source_ text, url_ text)
returns boolean language sql stable set search_path = '' as $fn$
  select private.official_identity_url_v2(url_) and exists (
    select 1 from private.official_source_domains d
    where d.source_id = source_ and (h.host = d.domain or pg_catalog.right(h.host, pg_catalog.length(d.domain)+1) = '.' || d.domain)
  ) and not exists (
    select 1 from private.official_source_blocked_domains b
    where h.host = b.domain or pg_catalog.right(h.host, pg_catalog.length(b.domain)+1) = '.' || b.domain
  ) from (select pg_catalog.split_part(pg_catalog.substr(url_, 9), '/', 1) host) h;
$fn$;

-- S1 has no descriptor mutation, retirement or URL release. A later transition
-- needs separately reviewed DDL/RPC; metadata and reservations are append-only.
create function private.official_identity_immutable_v2()
returns trigger language plpgsql set search_path = '' as $fn$
begin raise exception 'v2 identity is append-only; transition unsupported' using errcode = '0A000'; end;
$fn$;

create function private.official_identity_representation_check_v2()
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
create constraint trigger official_content_representation_complete
after insert on private.official_content_representations deferrable initially deferred
for each row execute function private.official_identity_representation_check_v2();
create constraint trigger official_content_urls_complete
after insert on private.official_content_representation_urls deferrable initially deferred
for each row execute function private.official_identity_representation_check_v2();

alter table private.official_evidence_versions
  drop constraint official_evidence_versions_version_id_format,
  drop constraint official_evidence_versions_previous_format,
  drop constraint official_evidence_versions_lookup_key,
  add column identity_schema integer not null check (identity_schema = 2),
  add column content_item_id text not null,
  add column content_item_version integer not null,
  add column representation_id text not null,
  add column representation_version integer not null,
  add column identity_profile_id text not null,
  add column identity_profile_version integer not null,
  add column content_type text not null,
  add constraint official_evidence_versions_version_id_format check (version_id ~ '^ev2_[a-f0-9]{32}$'),
  add constraint official_evidence_versions_previous_format check
    (previous_version_id is null or (previous_version_id ~ '^ev2_[a-f0-9]{32}$' and previous_version_id <> version_id)),
  add constraint official_evidence_versions_lookup_key check (lookup_key ~ '^evidence-key:v3:[a-f0-9]{64}$'),
  add constraint official_evidence_representation_v2_fk foreign key
    (source_id, content_item_id, content_item_version, representation_id, representation_version,
     identity_profile_id, identity_profile_version, content_type, canonical_url)
    references private.official_content_representations
    (source_id, content_item_id, content_item_version, representation_id, representation_version,
     identity_profile_id, identity_profile_version, expected_media_type, expected_final_url),
  add constraint official_evidence_support_v2_key unique
    (version_id, identity_schema, source_id, content_item_id, content_item_version, representation_id,
     representation_version, identity_profile_id, identity_profile_version, content_type);
create index official_evidence_representation_v2 on private.official_evidence_versions
  (source_id, content_item_id, representation_id, representation_version);

create function private.official_evidence_identity_check_v2()
returns trigger language plpgsql set search_path = '' as $fn$
declare previous private.official_evidence_versions%rowtype;
begin
  if new.previous_version_id is not null then
    select * into previous from private.official_evidence_versions where version_id = new.previous_version_id;
    if not found then raise exception 'previous evidence must already exist' using errcode = '23503'; end if;
    if (previous.source_id, previous.content_item_id, previous.representation_id, previous.lookup_key, previous.rule_scope_key)
      is distinct from (new.source_id, new.content_item_id, new.representation_id, new.lookup_key, new.rule_scope_key)
      or private.official_evidence_validity_instant(previous.retrieved_at) >= private.official_evidence_validity_instant(new.retrieved_at)
      or (pg_catalog.to_jsonb(previous) - array['version_id','previous_version_id','lifecycle','validation_state','source_id','canonical_url',
        'retrieved_at','source_content_hash','valid_from','valid_until','lookup_key','extraction_note','identity_schema','content_item_id',
        'content_item_version','representation_id','representation_version','identity_profile_id','identity_profile_version','content_type'])
        is distinct from
        (pg_catalog.to_jsonb(new) - array['version_id','previous_version_id','lifecycle','validation_state','source_id','canonical_url',
        'retrieved_at','source_content_hash','valid_from','valid_until','lookup_key','extraction_note','identity_schema','content_item_id',
        'content_item_version','representation_id','representation_version','identity_profile_id','identity_profile_version','content_type']) then
      raise exception 'previous evidence is not chronological in the same identity and regulatory stream' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$fn$;
create trigger official_evidence_identity_check_v2 before insert on private.official_evidence_versions
for each row execute function private.official_evidence_identity_check_v2();
create trigger official_evidence_identity_immutable_v2 before update or delete on private.official_evidence_versions
for each row execute function private.official_identity_immutable_v2();

alter table private.official_rule_claim_support
  drop constraint official_rule_claim_support_version_id_format,
  add column identity_schema integer not null check (identity_schema = 2),
  add column content_item_id text not null,
  add column content_item_version integer not null,
  add column representation_id text not null,
  add column representation_version integer not null,
  add column identity_profile_id text not null,
  add column identity_profile_version integer not null,
  add column content_type text not null,
  add constraint official_rule_claim_support_version_id_format check (version_id ~ '^ev2_[a-f0-9]{32}$'),
  add constraint official_rule_support_one_item unique (claim_id, source_id, content_item_id),
  add constraint official_rule_support_identity_v2_fk foreign key
    (version_id, identity_schema, source_id, content_item_id, content_item_version, representation_id,
     representation_version, identity_profile_id, identity_profile_version, content_type)
    references private.official_evidence_versions
    (version_id, identity_schema, source_id, content_item_id, content_item_version, representation_id,
     representation_version, identity_profile_id, identity_profile_version, content_type);

create function private.official_rule_support_count_v2()
returns trigger language plpgsql set search_path = '' as $fn$
declare claim_ bigint; quality text; count_ bigint; targets bigint[];
begin
  if tg_op = 'DELETE' then targets := array[old.claim_id];
  elsif tg_op = 'UPDATE' then targets := array[old.claim_id,new.claim_id];
  else targets := array[new.claim_id]; end if;
  foreach claim_ in array targets loop
  select evidence_quality into quality from private.official_rule_claims where claim_id = claim_;
  if not found then continue; end if;
  select pg_catalog.count(*) into count_ from private.official_rule_claim_support where claim_id = claim_;
  if (quality = 'explicit_primary_statement' and count_ <> 1)
    or (quality = 'composed_from_multiple_primary_sources' and count_ not between 2 and 8) then
    raise exception 'invalid distinct ContentItemRef support count' using errcode = '23514';
  end if;
  end loop;
  return null;
end;
$fn$;
create constraint trigger official_rule_claims_support_count_v2
after insert or update on private.official_rule_claims deferrable initially deferred
for each row execute function private.official_rule_support_count_v2();
create constraint trigger official_rule_support_count_v2
after insert or update or delete on private.official_rule_claim_support deferrable initially deferred
for each row execute function private.official_rule_support_count_v2();
create function public.official_truth_source_catalog_v2(payload jsonb)
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

create function private.official_store_payload_check_v2(payload jsonb)
returns void language plpgsql immutable set search_path = '' as $fn$
declare body jsonb; fact jsonb; entry jsonb; key_ text; kind text;
begin
  if pg_catalog.jsonb_typeof(payload) is distinct from 'object' then
    raise exception 'invalid v2 store payload' using errcode = '22023';
  end if;
  if payload ->> 'operation' = 'accepted_evidence' then
    perform private.official_identity_object_v2(payload, '{"operation":"string","evidence":"object"}');
    body := payload -> 'evidence';
    perform private.official_identity_object_v2(body, '{"rule_scope_key":"string","citizenship_mode":"string","credential_option_mode":"string","residence_mode":"string","requirement_type":"string","validity_mode":"string","destination_country_code":"string|null","transit_country_code":"string|null","document_type":"string|null","issuing_country_code":"string|null","related_citizenship_country_code":"string|null","residence_country_code":"string|null","travel_date":"string|null","citizenship_country_codes":"array","identity_schema":"number","content_item_id":"string","content_item_version":"number","representation_id":"string","representation_version":"number","identity_profile_id":"string","identity_profile_version":"number","content_type":"string","version_id":"string","lifecycle":"string","validation_state":"string","source_id":"string","canonical_url":"string","retrieved_at":"string","source_content_hash":"string","lookup_key":"string","previous_version_id":"string|null","valid_from":"string|null","valid_until":"string|null","extraction_note":"string|null"}');
    if body -> 'identity_schema' <> '2'::jsonb then
      raise exception 'unsupported Evidence identity schema' using errcode = '22023';
    end if;
  elsif payload ->> 'operation' = 'accepted_rule_claim' then
    perform private.official_identity_object_v2(payload, '{"operation":"string","claim":"object","accepted_at":"string"}');
    body := payload -> 'claim';
    perform private.official_identity_object_v2(body, '{"rule_scope_key":"string","citizenship_mode":"string","credential_option_mode":"string","residence_mode":"string","requirement_type":"string","validity_mode":"string","destination_country_code":"string|null","transit_country_code":"string|null","document_type":"string|null","issuing_country_code":"string|null","related_citizenship_country_code":"string|null","residence_country_code":"string|null","travel_date":"string|null","citizenship_country_codes":"array","fact_kind":"string","evidence_quality":"string","lifecycle":"string","validation_state":"string","support_version_ids":"array","fact":"object"}');
    if (payload ->> 'accepted_at') !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$'
      or private.official_evidence_validity_instant(payload ->> 'accepted_at') is null then
      raise exception 'invalid accepted_at' using errcode = '22023';
    end if;
    if pg_catalog.jsonb_array_length(body -> 'support_version_ids') not between 1 and 8
      or exists(select 1 from pg_catalog.jsonb_array_elements(body -> 'support_version_ids') x
        where pg_catalog.jsonb_typeof(x) <> 'string' or (x #>> '{}') !~ '^ev2_[a-f0-9]{32}$')
      or (select pg_catalog.count(distinct x) from pg_catalog.jsonb_array_elements(body -> 'support_version_ids') x)
         <> pg_catalog.jsonb_array_length(body -> 'support_version_ids') then
      raise exception 'invalid v2 supports' using errcode = '22023';
    end if;
    fact := body -> 'fact'; kind := body ->> 'fact_kind';
    case kind
    when 'requirement_effect' then
      perform private.official_identity_object_v2(fact, '{"effect":"string","visa_mode":"string|null"}');
      if fact ->> 'effect' = 'conditional' then raise exception 'applicability_not_persistable' using errcode = '22023'; end if;
    when 'visa_options' then
      perform private.official_identity_object_v2(fact, '{"options":"array"}');
      if pg_catalog.jsonb_array_length(fact -> 'options') not between 1 and 4 then raise exception 'invalid fact collection' using errcode = '22023'; end if;
      for entry in select value from pg_catalog.jsonb_array_elements(fact -> 'options') loop
        perform private.official_identity_object_v2(entry, '{"ordinal":"number","visa_mode":"string","eligibility":"string","mandate":"string"}');
      end loop;
    when 'stay_limit' then
      perform private.official_identity_object_v2(fact, '{"per_visit_value":"number|null","rolling_maximum_value":"number|null","rolling_within_value":"number|null","initial_grant_value":"number|null","extension_maximum_total_value":"number|null","per_visit_unit":"string|null","rolling_maximum_unit":"string|null","rolling_within_unit":"string|null","initial_grant_unit":"string|null","extension_maximum_total_unit":"string|null","extension_requires_application":"boolean|null","border_discretion":"string"}');
    when 'passport_validity' then
      perform private.official_identity_object_v2(fact, '{"semantics":"string","duration_value":"number|null","duration_unit":"string|null"}');
    when 'blank_passport_pages' then
      perform private.official_identity_object_v2(fact, '{"minimum_pages":"number"}');
    when 'official_actions' then
      perform private.official_identity_object_v2(fact, '{"actions":"array"}');
      if pg_catalog.jsonb_array_length(fact -> 'actions') not between 1 and 4 then raise exception 'invalid fact collection' using errcode = '22023'; end if;
      for entry in select value from pg_catalog.jsonb_array_elements(fact -> 'actions') loop
        perform private.official_identity_object_v2(entry, '{"ordinal":"number","action_source_id":"string","purpose":"string","href":"string","visa_mode":"string|null"}');
      end loop;
    when 'transit_conditions' then
      perform private.official_identity_object_v2(fact, '{"paths":"array"}');
      if pg_catalog.jsonb_array_length(fact -> 'paths') not between 1 and 8 then raise exception 'invalid fact collection' using errcode = '22023'; end if;
      for entry in select value from pg_catalog.jsonb_array_elements(fact -> 'paths') loop
        perform private.official_identity_object_v2(entry, '{"ordinal":"number","crosses_border_control":"boolean|null","leaves_transit_area":"boolean|null","third_country_required":"boolean|null","same_flight_required":"boolean|null","onward_ticket_required":"boolean|null","transit_airport_codes":"array|null","max_transit_duration_minutes":"number|null","arrival_mode":"string|null","departure_mode":"string|null"}');
        if pg_catalog.jsonb_typeof(entry -> 'transit_airport_codes') = 'array' and exists(
          select 1 from pg_catalog.jsonb_array_elements(entry -> 'transit_airport_codes') x where pg_catalog.jsonb_typeof(x) <> 'string'
        ) then raise exception 'invalid airport strings' using errcode = '22023'; end if;
      end loop;
    when 'temporal_rule' then
      perform private.official_identity_object_v2(fact, '{"temporal_kind":"string","available_from_anchor":"string|null","available_from_relation":"string|null","due_by_anchor":"string|null","due_by_relation":"string|null","due_by_semantics":"string|null","available_from_offset_minutes":"number|null","due_by_offset_minutes":"number|null"}');
    else raise exception 'unsupported flat fact' using errcode = '22023';
    end case;
  else raise exception 'unsupported v2 store operation' using errcode = '22023';
  end if;
  if pg_catalog.jsonb_array_length(body -> 'citizenship_country_codes') > 8
    or exists(select 1 from pg_catalog.jsonb_array_elements(body -> 'citizenship_country_codes') x where pg_catalog.jsonb_typeof(x) <> 'string') then
    raise exception 'invalid citizenship strings' using errcode = '22023';
  end if;
end;
$fn$;

create function private.official_store_eligibility_v2(payload jsonb)
returns void language plpgsql set search_path = '' as $fn$
declare e private.official_evidence_versions%rowtype; c private.official_rule_claims%rowtype;
  total_ bigint; distinct_ bigint; support_id text;
begin
  if payload ->> 'operation' = 'accepted_evidence' then
    select * into e from pg_catalog.jsonb_populate_record(null::private.official_evidence_versions, payload -> 'evidence');
    if e.lifecycle is distinct from 'accepted' or e.validation_state is distinct from 'valid'
      or not exists(select 1 from private.official_content_representations r
        join private.official_content_item_versions i using(source_id,content_item_id,content_item_version)
        where (r.source_id,r.content_item_id,r.content_item_version,r.representation_id,r.representation_version,r.identity_profile_id,r.identity_profile_version,r.expected_media_type,r.expected_final_url)
          = (e.source_id,e.content_item_id,e.content_item_version,e.representation_id,e.representation_version,e.identity_profile_id,e.identity_profile_version,e.content_type,e.canonical_url)
        and r.current and i.current)
      or not private.official_identity_authorized_url_v2(e.source_id,e.canonical_url) then
      raise exception 'Evidence is not eligible for its exact current catalog identity' using errcode = '23514';
    end if;
  else
    select * into c from pg_catalog.jsonb_populate_record(null::private.official_rule_claims, payload -> 'claim');
    if c.lifecycle is distinct from 'accepted' or c.validation_state is distinct from 'valid'
      or c.evidence_quality not in ('explicit_primary_statement','composed_from_multiple_primary_sources') then
      raise exception 'ineligible Rule lifecycle or quality' using errcode = '23514';
    end if;
    total_ := pg_catalog.jsonb_array_length(payload -> 'claim' -> 'support_version_ids');
    select pg_catalog.count(distinct (v.source_id,v.content_item_id)) into distinct_
    from private.official_evidence_versions v
    join private.official_content_representations r using(source_id,content_item_id,representation_id,representation_version)
    join private.official_content_item_versions i on (i.source_id,i.content_item_id,i.content_item_version) = (r.source_id,r.content_item_id,r.content_item_version)
    join private.official_sources s on s.source_id = v.source_id
    where v.version_id in (select pg_catalog.jsonb_array_elements_text(payload -> 'claim' -> 'support_version_ids'))
      and v.lifecycle = 'accepted' and v.validation_state = 'valid' and s.source_class = 'official_authority'
      and r.current and i.current and private.official_identity_authorized_url_v2(v.source_id,v.canonical_url)
      and (v.rule_scope_key, v.citizenship_mode, v.credential_option_mode, v.residence_mode, v.requirement_type, v.validity_mode, v.destination_country_code, v.transit_country_code, v.document_type, v.issuing_country_code, v.related_citizenship_country_code, v.residence_country_code, v.travel_date, v.citizenship_country_codes) is not distinct from (c.rule_scope_key, c.citizenship_mode, c.credential_option_mode, c.residence_mode, c.requirement_type, c.validity_mode, c.destination_country_code, c.transit_country_code, c.document_type, c.issuing_country_code, c.related_citizenship_country_code, c.residence_country_code, c.travel_date, c.citizenship_country_codes);
    if distinct_ <> total_ or (c.evidence_quality = 'explicit_primary_statement' and distinct_ <> 1)
      or (c.evidence_quality = 'composed_from_multiple_primary_sources' and distinct_ not between 2 and 8) then
      raise exception 'supports require exact eligible Evidence and distinct ContentItemRefs in the same cell' using errcode = '23514';
    end if;
  end if;
end;
$fn$;
create function public.official_truth_store_accepted_v2(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  neu_identity_schema integer;
  neu_content_item_id text;
  neu_content_item_version integer;
  neu_representation_id text;
  neu_representation_version integer;
  neu_identity_profile_id text;
  neu_identity_profile_version integer;
  neu_content_type text;
  operation text;
  body jsonb;
  fact jsonb;
  neu_version_id text;
  neu_previous_version_id text;
  neu_lifecycle text;
  neu_validation_state text;
  neu_source_id text;
  neu_canonical_url text;
  neu_retrieved_at text;
  neu_source_content_hash text;
  neu_valid_from text;
  neu_valid_until text;
  neu_lookup_key text;
  neu_extraction_note text;
  neu_rule_scope_key text;
  neu_destination text;
  neu_transit text;
  neu_citizenship_mode text;
  neu_citizenship text[];
  neu_credential_mode text;
  neu_document_type text;
  neu_issuing text;
  neu_related text;
  neu_residence_mode text;
  neu_residence text;
  neu_requirement_type text;
  neu_validity_mode text;
  neu_travel_date text;
  neu_fact_kind text;
  neu_evidence_quality text;
  neu_accepted_at timestamptz;
  neu_support text[];
  stored_support text[];
  incoming_fact jsonb;
  stored_fact jsonb;
  stored_claim_id bigint;
  new_claim_id bigint;
  exact_match boolean;
  present boolean;
  support_expected bigint;
  support_written bigint;
  action_source_class text;
  action_row record;
  option_row record;
  path_row record;
  path_airports text[];
begin
  perform private.official_store_payload_check_v2(payload);
  if pg_catalog.current_setting('transaction_isolation') <> 'read committed' then
    raise exception 'accepted writes require READ COMMITTED' using errcode = '0A000';
  end if;
  lock table private.official_sources, private.official_source_domains,
    private.official_source_blocked_domains, private.official_content_items,
    private.official_content_item_versions, private.official_content_representations,
    private.official_content_url_reservations, private.official_content_representation_urls in share mode;
  lock table private.official_evidence_versions, private.official_rule_claims,
    private.official_rule_claim_support in share row exclusive mode;
  perform private.official_store_eligibility_v2(payload);
  if payload is null or pg_catalog.jsonb_typeof(payload) is distinct from 'object' then
    raise exception 'official truth store payload is not an object'
      using errcode = '22023';
  end if;

  if pg_catalog.jsonb_typeof(payload -> 'operation') is distinct from 'string' then
    raise exception 'official truth store operation is not supported'
      using errcode = '22023';
  end if;

  operation := payload ->> 'operation';

  if operation = 'accepted_evidence' then
    body := payload -> 'evidence';
    if body is null or pg_catalog.jsonb_typeof(body) is distinct from 'object' then
      raise exception 'official truth store evidence is not an object'
        using errcode = '22023';
    end if;

    neu_identity_schema := (body ->> 'identity_schema')::integer;
    neu_content_item_id := (body ->> 'content_item_id')::text;
    neu_content_item_version := (body ->> 'content_item_version')::integer;
    neu_representation_id := (body ->> 'representation_id')::text;
    neu_representation_version := (body ->> 'representation_version')::integer;
    neu_identity_profile_id := (body ->> 'identity_profile_id')::text;
    neu_identity_profile_version := (body ->> 'identity_profile_version')::integer;
    neu_content_type := (body ->> 'content_type')::text;
    neu_version_id := body ->> 'version_id';
    neu_previous_version_id := body ->> 'previous_version_id';
    neu_lifecycle := body ->> 'lifecycle';
    neu_validation_state := body ->> 'validation_state';
    if neu_lifecycle is distinct from 'accepted'
      or neu_validation_state is distinct from 'valid' then
      raise exception 'official truth store evidence is not accepted'
        using errcode = '22023';
    end if;
    neu_source_id := body ->> 'source_id';
    neu_canonical_url := body ->> 'canonical_url';
    neu_retrieved_at := body ->> 'retrieved_at';
    neu_source_content_hash := body ->> 'source_content_hash';
    neu_valid_from := body ->> 'valid_from';
    neu_valid_until := body ->> 'valid_until';
    neu_lookup_key := body ->> 'lookup_key';
    neu_extraction_note := body ->> 'extraction_note';
    neu_rule_scope_key := body ->> 'rule_scope_key';
    neu_destination := body ->> 'destination_country_code';
    neu_transit := body ->> 'transit_country_code';
    neu_citizenship_mode := body ->> 'citizenship_mode';
    neu_credential_mode := body ->> 'credential_option_mode';
    neu_document_type := body ->> 'document_type';
    neu_issuing := body ->> 'issuing_country_code';
    neu_related := body ->> 'related_citizenship_country_code';
    neu_residence_mode := body ->> 'residence_mode';
    neu_residence := body ->> 'residence_country_code';
    neu_requirement_type := body ->> 'requirement_type';
    neu_validity_mode := body ->> 'validity_mode';
    neu_travel_date := body ->> 'travel_date';

    if pg_catalog.jsonb_typeof(body -> 'citizenship_country_codes') is distinct from 'array' then
      raise exception 'official truth store citizenship list is invalid'
        using errcode = '22023';
    end if;

    select pg_catalog.array_agg(item.value order by item.ordinality)::pg_catalog.text[]
    into neu_citizenship
    from pg_catalog.jsonb_array_elements_text(body -> 'citizenship_country_codes')
      with ordinality as item(value, ordinality);
    if neu_citizenship is null then
      neu_citizenship := '{}'::pg_catalog.text[];
    end if;

    exact_match := exists (
      select 1
      from private.official_evidence_versions as existing
      where existing.version_id = neu_version_id
        and existing.identity_schema is not distinct from neu_identity_schema
        and existing.content_item_id is not distinct from neu_content_item_id
        and existing.content_item_version is not distinct from neu_content_item_version
        and existing.representation_id is not distinct from neu_representation_id
        and existing.representation_version is not distinct from neu_representation_version
        and existing.identity_profile_id is not distinct from neu_identity_profile_id
        and existing.identity_profile_version is not distinct from neu_identity_profile_version
        and existing.content_type is not distinct from neu_content_type
        and existing.previous_version_id is not distinct from neu_previous_version_id
        and existing.lifecycle is not distinct from neu_lifecycle
        and existing.validation_state is not distinct from neu_validation_state
        and existing.source_id is not distinct from neu_source_id
        and existing.canonical_url is not distinct from neu_canonical_url
        and existing.retrieved_at is not distinct from neu_retrieved_at
        and existing.source_content_hash is not distinct from neu_source_content_hash
        and existing.valid_from is not distinct from neu_valid_from
        and existing.valid_until is not distinct from neu_valid_until
        and existing.lookup_key is not distinct from neu_lookup_key
        and existing.extraction_note is not distinct from neu_extraction_note
        and existing.rule_scope_key is not distinct from neu_rule_scope_key
        and existing.destination_country_code is not distinct from neu_destination
        and existing.transit_country_code is not distinct from neu_transit
        and existing.citizenship_mode is not distinct from neu_citizenship_mode
        and existing.citizenship_country_codes is not distinct from neu_citizenship
        and existing.credential_option_mode is not distinct from neu_credential_mode
        and existing.document_type is not distinct from neu_document_type
        and existing.issuing_country_code is not distinct from neu_issuing
        and existing.related_citizenship_country_code is not distinct from neu_related
        and existing.residence_mode is not distinct from neu_residence_mode
        and existing.residence_country_code is not distinct from neu_residence
        and existing.requirement_type is not distinct from neu_requirement_type
        and existing.validity_mode is not distinct from neu_validity_mode
        and existing.travel_date is not distinct from neu_travel_date
    );

    if exact_match then
      return pg_catalog.jsonb_build_object(
        'ok', true, 'identity_schema', 2,
        'operation', 'accepted_evidence',
        'outcome', 'idempotent',
        'version_id', neu_version_id
      );
    end if;

    present := exists (
      select 1
      from private.official_evidence_versions as existing
      where existing.version_id = neu_version_id
    );

    if present then
      raise exception 'conflicting official evidence version'
        using errcode = '23505';
    end if;

    insert into private.official_evidence_versions (
      identity_schema,
      content_item_id,
      content_item_version,
      representation_id,
      representation_version,
      identity_profile_id,
      identity_profile_version,
      content_type,
      version_id,
      previous_version_id,
      lifecycle,
      validation_state,
      source_id,
      canonical_url,
      retrieved_at,
      source_content_hash,
      valid_from,
      valid_until,
      lookup_key,
      extraction_note,
      destination_country_code,
      transit_country_code,
      citizenship_mode,
      citizenship_country_codes,
      credential_option_mode,
      document_type,
      issuing_country_code,
      related_citizenship_country_code,
      residence_mode,
      residence_country_code,
      requirement_type,
      validity_mode,
      travel_date,
      rule_scope_key
    ) values (
      neu_identity_schema,
      neu_content_item_id,
      neu_content_item_version,
      neu_representation_id,
      neu_representation_version,
      neu_identity_profile_id,
      neu_identity_profile_version,
      neu_content_type,
      neu_version_id,
      neu_previous_version_id,
      neu_lifecycle,
      neu_validation_state,
      neu_source_id,
      neu_canonical_url,
      neu_retrieved_at,
      neu_source_content_hash,
      neu_valid_from,
      neu_valid_until,
      neu_lookup_key,
      neu_extraction_note,
      neu_destination,
      neu_transit,
      neu_citizenship_mode,
      neu_citizenship,
      neu_credential_mode,
      neu_document_type,
      neu_issuing,
      neu_related,
      neu_residence_mode,
      neu_residence,
      neu_requirement_type,
      neu_validity_mode,
      neu_travel_date,
      neu_rule_scope_key
    );

    return pg_catalog.jsonb_build_object(
      'ok', true, 'identity_schema', 2,
      'operation', 'accepted_evidence',
      'outcome', 'inserted',
      'version_id', neu_version_id
    );
  end if;

  if operation is distinct from 'accepted_rule_claim' then
    raise exception 'official truth store operation is not supported'
      using errcode = '22023';
  end if;

  body := payload -> 'claim';
  if body is null or pg_catalog.jsonb_typeof(body) is distinct from 'object' then
    raise exception 'official truth store claim is not an object'
      using errcode = '22023';
  end if;

  fact := body -> 'fact';
  if fact is null or pg_catalog.jsonb_typeof(fact) is distinct from 'object' then
    raise exception 'official truth store fact is not an object'
      using errcode = '22023';
  end if;

  if pg_catalog.jsonb_typeof(payload -> 'accepted_at') is distinct from 'string' then
    raise exception 'official truth store accepted_at is invalid'
      using errcode = '22023';
  end if;

  neu_accepted_at := (payload ->> 'accepted_at')::pg_catalog.timestamptz;
  neu_rule_scope_key := body ->> 'rule_scope_key';
  neu_fact_kind := body ->> 'fact_kind';
  neu_evidence_quality := body ->> 'evidence_quality';
  neu_lifecycle := body ->> 'lifecycle';
  neu_validation_state := body ->> 'validation_state';
  neu_destination := body ->> 'destination_country_code';
  neu_transit := body ->> 'transit_country_code';
  neu_citizenship_mode := body ->> 'citizenship_mode';
  neu_credential_mode := body ->> 'credential_option_mode';
  neu_document_type := body ->> 'document_type';
  neu_issuing := body ->> 'issuing_country_code';
  neu_related := body ->> 'related_citizenship_country_code';
  neu_residence_mode := body ->> 'residence_mode';
  neu_residence := body ->> 'residence_country_code';
  neu_requirement_type := body ->> 'requirement_type';
  neu_validity_mode := body ->> 'validity_mode';
  neu_travel_date := body ->> 'travel_date';

  if pg_catalog.jsonb_typeof(body -> 'citizenship_country_codes') is distinct from 'array' then
    raise exception 'official truth store citizenship list is invalid'
      using errcode = '22023';
  end if;

  if pg_catalog.jsonb_typeof(body -> 'support_version_ids') is distinct from 'array' then
    raise exception 'official truth store support list is invalid'
      using errcode = '22023';
  end if;

  select pg_catalog.array_agg(item.value order by item.ordinality)::pg_catalog.text[]
  into neu_citizenship
  from pg_catalog.jsonb_array_elements_text(body -> 'citizenship_country_codes')
    with ordinality as item(value, ordinality);
  if neu_citizenship is null then
    neu_citizenship := '{}'::pg_catalog.text[];
  end if;

  select pg_catalog.array_agg(item.value order by item.value)::pg_catalog.text[]
  into neu_support
  from pg_catalog.jsonb_array_elements_text(body -> 'support_version_ids') as item(value);
  if neu_support is null then
    neu_support := '{}'::pg_catalog.text[];
  end if;

  if neu_fact_kind = 'requirement_effect' then
    incoming_fact := pg_catalog.jsonb_build_object(
      'effect', fact ->> 'effect',
      'visa_mode', fact ->> 'visa_mode'
    );
  elsif neu_fact_kind = 'visa_options' then
    if pg_catalog.jsonb_typeof(fact -> 'options') is distinct from 'array' then
      raise exception 'official truth store visa options are invalid'
        using errcode = '22023';
    end if;
    select pg_catalog.jsonb_build_object(
      'options',
      coalesce(
        pg_catalog.jsonb_agg(
          pg_catalog.jsonb_build_object(
            'ordinal', (option_item.value ->> 'ordinal')::pg_catalog.int4,
            'visa_mode', option_item.value ->> 'visa_mode',
            'eligibility', option_item.value ->> 'eligibility',
            'mandate', option_item.value ->> 'mandate'
          )
          order by (option_item.value ->> 'ordinal')::pg_catalog.int4
        ),
        '[]'::pg_catalog.jsonb
      )
    )
    into incoming_fact
    from pg_catalog.jsonb_array_elements(fact -> 'options') as option_item(value);
  elsif neu_fact_kind = 'stay_limit' then
    incoming_fact := pg_catalog.jsonb_build_object(
      'per_visit_value', case when fact -> 'per_visit_value' = 'null'::pg_catalog.jsonb or fact -> 'per_visit_value' is null then null else (fact ->> 'per_visit_value')::pg_catalog.int4 end,
      'per_visit_unit', fact ->> 'per_visit_unit',
      'rolling_maximum_value', case when fact -> 'rolling_maximum_value' = 'null'::pg_catalog.jsonb or fact -> 'rolling_maximum_value' is null then null else (fact ->> 'rolling_maximum_value')::pg_catalog.int4 end,
      'rolling_maximum_unit', fact ->> 'rolling_maximum_unit',
      'rolling_within_value', case when fact -> 'rolling_within_value' = 'null'::pg_catalog.jsonb or fact -> 'rolling_within_value' is null then null else (fact ->> 'rolling_within_value')::pg_catalog.int4 end,
      'rolling_within_unit', fact ->> 'rolling_within_unit',
      'initial_grant_value', case when fact -> 'initial_grant_value' = 'null'::pg_catalog.jsonb or fact -> 'initial_grant_value' is null then null else (fact ->> 'initial_grant_value')::pg_catalog.int4 end,
      'initial_grant_unit', fact ->> 'initial_grant_unit',
      'extension_requires_application', case when fact -> 'extension_requires_application' = 'null'::pg_catalog.jsonb or fact -> 'extension_requires_application' is null then null else (fact ->> 'extension_requires_application')::pg_catalog.bool end,
      'extension_maximum_total_value', case when fact -> 'extension_maximum_total_value' = 'null'::pg_catalog.jsonb or fact -> 'extension_maximum_total_value' is null then null else (fact ->> 'extension_maximum_total_value')::pg_catalog.int4 end,
      'extension_maximum_total_unit', fact ->> 'extension_maximum_total_unit',
      'border_discretion', fact ->> 'border_discretion'
    );
  elsif neu_fact_kind = 'passport_validity' then
    incoming_fact := pg_catalog.jsonb_build_object(
      'semantics', fact ->> 'semantics',
      'duration_value', case when fact -> 'duration_value' = 'null'::pg_catalog.jsonb or fact -> 'duration_value' is null then null else (fact ->> 'duration_value')::pg_catalog.int4 end,
      'duration_unit', fact ->> 'duration_unit'
    );
  elsif neu_fact_kind = 'blank_passport_pages' then
    incoming_fact := pg_catalog.jsonb_build_object(
      'minimum_pages', (fact ->> 'minimum_pages')::pg_catalog.int4
    );
  elsif neu_fact_kind = 'transit_conditions' then
    if pg_catalog.jsonb_typeof(fact -> 'paths') is distinct from 'array' then
      raise exception 'official truth store transit paths are invalid'
        using errcode = '22023';
    end if;
    select pg_catalog.jsonb_build_object(
      'paths',
      coalesce(
        pg_catalog.jsonb_agg(
          pg_catalog.jsonb_build_object(
            'ordinal', (path_item.value ->> 'ordinal')::pg_catalog.int4,
            'crosses_border_control', case when path_item.value -> 'crosses_border_control' = 'null'::pg_catalog.jsonb or path_item.value -> 'crosses_border_control' is null then null else (path_item.value ->> 'crosses_border_control')::pg_catalog.bool end,
            'leaves_transit_area', case when path_item.value -> 'leaves_transit_area' = 'null'::pg_catalog.jsonb or path_item.value -> 'leaves_transit_area' is null then null else (path_item.value ->> 'leaves_transit_area')::pg_catalog.bool end,
            'transit_airport_codes', path_item.value -> 'transit_airport_codes',
            'max_transit_duration_minutes', case when path_item.value -> 'max_transit_duration_minutes' = 'null'::pg_catalog.jsonb or path_item.value -> 'max_transit_duration_minutes' is null then null else (path_item.value ->> 'max_transit_duration_minutes')::pg_catalog.int4 end,
            'arrival_mode', path_item.value ->> 'arrival_mode',
            'departure_mode', path_item.value ->> 'departure_mode',
            'third_country_required', case when path_item.value -> 'third_country_required' = 'null'::pg_catalog.jsonb or path_item.value -> 'third_country_required' is null then null else (path_item.value ->> 'third_country_required')::pg_catalog.bool end,
            'same_flight_required', case when path_item.value -> 'same_flight_required' = 'null'::pg_catalog.jsonb or path_item.value -> 'same_flight_required' is null then null else (path_item.value ->> 'same_flight_required')::pg_catalog.bool end,
            'onward_ticket_required', case when path_item.value -> 'onward_ticket_required' = 'null'::pg_catalog.jsonb or path_item.value -> 'onward_ticket_required' is null then null else (path_item.value ->> 'onward_ticket_required')::pg_catalog.bool end
          )
          order by (path_item.value ->> 'ordinal')::pg_catalog.int4
        ),
        '[]'::pg_catalog.jsonb
      )
    )
    into incoming_fact
    from pg_catalog.jsonb_array_elements(fact -> 'paths') as path_item(value);
  elsif neu_fact_kind = 'official_actions' then
    if pg_catalog.jsonb_typeof(fact -> 'actions') is distinct from 'array' then
      raise exception 'official truth store official actions are invalid'
        using errcode = '22023';
    end if;
    select pg_catalog.jsonb_build_object(
      'actions',
      coalesce(
        pg_catalog.jsonb_agg(
          pg_catalog.jsonb_build_object(
            'ordinal', (action_item.value ->> 'ordinal')::pg_catalog.int4,
            'action_source_id', action_item.value ->> 'action_source_id',
            'purpose', action_item.value ->> 'purpose',
            'href', action_item.value ->> 'href',
            'visa_mode', action_item.value ->> 'visa_mode'
          )
          order by (action_item.value ->> 'ordinal')::pg_catalog.int4
        ),
        '[]'::pg_catalog.jsonb
      )
    )
    into incoming_fact
    from pg_catalog.jsonb_array_elements(fact -> 'actions') as action_item(value);
  elsif neu_fact_kind = 'temporal_rule' then
    incoming_fact := pg_catalog.jsonb_build_object(
      'temporal_kind', fact ->> 'temporal_kind',
      'available_from_anchor', fact ->> 'available_from_anchor',
      'available_from_relation', fact ->> 'available_from_relation',
      'available_from_offset_minutes', case when fact -> 'available_from_offset_minutes' = 'null'::pg_catalog.jsonb or fact -> 'available_from_offset_minutes' is null then null else (fact ->> 'available_from_offset_minutes')::pg_catalog.int4 end,
      'due_by_anchor', fact ->> 'due_by_anchor',
      'due_by_relation', fact ->> 'due_by_relation',
      'due_by_offset_minutes', case when fact -> 'due_by_offset_minutes' = 'null'::pg_catalog.jsonb or fact -> 'due_by_offset_minutes' is null then null else (fact ->> 'due_by_offset_minutes')::pg_catalog.int4 end,
      'due_by_semantics', fact ->> 'due_by_semantics'
    );
  else
    incoming_fact := null;
  end if;

  select existing.claim_id
  into stored_claim_id
  from private.official_rule_claims as existing
  where existing.rule_scope_key = neu_rule_scope_key
    and existing.fact_kind = neu_fact_kind;

  if found then
    select pg_catalog.array_agg(support.version_id order by support.version_id)::pg_catalog.text[]
    into stored_support
    from private.official_rule_claim_support as support
    where support.claim_id = stored_claim_id;
    if stored_support is null then
      stored_support := '{}'::pg_catalog.text[];
    end if;

    stored_fact := case neu_fact_kind
      when 'requirement_effect' then (
        select pg_catalog.jsonb_build_object(
          'effect', fact_row.effect,
          'visa_mode', fact_row.visa_mode
        )
        from private.official_rule_claim_requirement_effect as fact_row
        where fact_row.claim_id = stored_claim_id
      )
      when 'visa_options' then (
        select pg_catalog.jsonb_build_object(
          'options',
          coalesce(
            pg_catalog.jsonb_agg(
              pg_catalog.jsonb_build_object(
                'ordinal', fact_row.ordinal::pg_catalog.int4,
                'visa_mode', fact_row.visa_mode,
                'eligibility', fact_row.eligibility,
                'mandate', fact_row.mandate
              )
              order by fact_row.ordinal
            ),
            '[]'::pg_catalog.jsonb
          )
        )
        from private.official_rule_claim_visa_options as fact_row
        where fact_row.claim_id = stored_claim_id
      )
      when 'stay_limit' then (
        select pg_catalog.jsonb_build_object(
          'per_visit_value', fact_row.per_visit_value,
          'per_visit_unit', fact_row.per_visit_unit,
          'rolling_maximum_value', fact_row.rolling_maximum_value,
          'rolling_maximum_unit', fact_row.rolling_maximum_unit,
          'rolling_within_value', fact_row.rolling_within_value,
          'rolling_within_unit', fact_row.rolling_within_unit,
          'initial_grant_value', fact_row.initial_grant_value,
          'initial_grant_unit', fact_row.initial_grant_unit,
          'extension_requires_application', fact_row.extension_requires_application,
          'extension_maximum_total_value', fact_row.extension_maximum_total_value,
          'extension_maximum_total_unit', fact_row.extension_maximum_total_unit,
          'border_discretion', fact_row.border_discretion
        )
        from private.official_rule_claim_stay_limit as fact_row
        where fact_row.claim_id = stored_claim_id
      )
      when 'passport_validity' then (
        select pg_catalog.jsonb_build_object(
          'semantics', fact_row.semantics,
          'duration_value', fact_row.duration_value,
          'duration_unit', fact_row.duration_unit
        )
        from private.official_rule_claim_passport_validity as fact_row
        where fact_row.claim_id = stored_claim_id
      )
      when 'blank_passport_pages' then (
        select pg_catalog.jsonb_build_object('minimum_pages', fact_row.minimum_pages)
        from private.official_rule_claim_blank_pages as fact_row
        where fact_row.claim_id = stored_claim_id
      )
      when 'transit_conditions' then (
        select pg_catalog.jsonb_build_object(
          'paths',
          coalesce(
            pg_catalog.jsonb_agg(
              pg_catalog.jsonb_build_object(
                'ordinal', fact_row.ordinal::pg_catalog.int4,
                'crosses_border_control', fact_row.crosses_border_control,
                'leaves_transit_area', fact_row.leaves_transit_area,
                'transit_airport_codes', pg_catalog.to_jsonb(fact_row.transit_airport_codes),
                'max_transit_duration_minutes', fact_row.max_transit_duration_minutes,
                'arrival_mode', fact_row.arrival_mode,
                'departure_mode', fact_row.departure_mode,
                'third_country_required', fact_row.third_country_required,
                'same_flight_required', fact_row.same_flight_required,
                'onward_ticket_required', fact_row.onward_ticket_required
              )
              order by fact_row.ordinal
            ),
            '[]'::pg_catalog.jsonb
          )
        )
        from private.official_rule_claim_transit_paths as fact_row
        where fact_row.claim_id = stored_claim_id
      )
      when 'official_actions' then (
        select pg_catalog.jsonb_build_object(
          'actions',
          coalesce(
            pg_catalog.jsonb_agg(
              pg_catalog.jsonb_build_object(
                'ordinal', fact_row.ordinal::pg_catalog.int4,
                'action_source_id', fact_row.action_source_id,
                'purpose', fact_row.purpose,
                'href', fact_row.href,
                'visa_mode', fact_row.visa_mode
              )
              order by fact_row.ordinal
            ),
            '[]'::pg_catalog.jsonb
          )
        )
        from private.official_rule_claim_actions as fact_row
        where fact_row.claim_id = stored_claim_id
      )
      when 'temporal_rule' then (
        select pg_catalog.jsonb_build_object(
          'temporal_kind', fact_row.temporal_kind,
          'available_from_anchor', fact_row.available_from_anchor,
          'available_from_relation', fact_row.available_from_relation,
          'available_from_offset_minutes', fact_row.available_from_offset_minutes,
          'due_by_anchor', fact_row.due_by_anchor,
          'due_by_relation', fact_row.due_by_relation,
          'due_by_offset_minutes', fact_row.due_by_offset_minutes,
          'due_by_semantics', fact_row.due_by_semantics
        )
        from private.official_rule_claim_temporal_rule as fact_row
        where fact_row.claim_id = stored_claim_id
      )
      else null
    end;

    exact_match := exists (
      select 1
      from private.official_rule_claims as existing
      where existing.claim_id = stored_claim_id
        and existing.rule_scope_key is not distinct from neu_rule_scope_key
        and existing.fact_kind is not distinct from neu_fact_kind
        and existing.evidence_quality is not distinct from neu_evidence_quality
        and existing.lifecycle is not distinct from neu_lifecycle
        and existing.validation_state is not distinct from neu_validation_state
        and existing.destination_country_code is not distinct from neu_destination
        and existing.transit_country_code is not distinct from neu_transit
        and existing.citizenship_mode is not distinct from neu_citizenship_mode
        and existing.citizenship_country_codes is not distinct from neu_citizenship
        and existing.credential_option_mode is not distinct from neu_credential_mode
        and existing.document_type is not distinct from neu_document_type
        and existing.issuing_country_code is not distinct from neu_issuing
        and existing.related_citizenship_country_code is not distinct from neu_related
        and existing.residence_mode is not distinct from neu_residence_mode
        and existing.residence_country_code is not distinct from neu_residence
        and existing.requirement_type is not distinct from neu_requirement_type
        and existing.validity_mode is not distinct from neu_validity_mode
        and existing.travel_date is not distinct from neu_travel_date
    )
    and stored_support is not distinct from neu_support
    and stored_fact is not distinct from incoming_fact;

    if exact_match then
      return pg_catalog.jsonb_build_object(
        'ok', true, 'identity_schema', 2,
        'operation', 'accepted_rule_claim',
        'outcome', 'idempotent',
        'claim_id', stored_claim_id
      );
    end if;

    raise exception 'conflicting official rule claim'
      using errcode = '23505';
  end if;

  set constraints private.official_rule_claims_fact_payload,
    private.official_rule_claim_requirement_effect_fact_payload,
    private.official_rule_claim_visa_options_fact_payload,
    private.official_rule_claim_stay_limit_fact_payload,
    private.official_rule_claim_passport_validity_fact_payload,
    private.official_rule_claim_blank_pages_fact_payload,
    private.official_rule_claim_transit_paths_fact_payload,
    private.official_rule_claim_actions_fact_payload,
    private.official_rule_claim_temporal_rule_fact_payload,
    private.official_rule_claims_support_count_v2,
    private.official_rule_support_count_v2 deferred;

  insert into private.official_rule_claims (
    rule_scope_key,
    fact_kind,
    evidence_quality,
    lifecycle,
    validation_state,
    accepted_at,
    destination_country_code,
    transit_country_code,
    citizenship_mode,
    citizenship_country_codes,
    credential_option_mode,
    document_type,
    issuing_country_code,
    related_citizenship_country_code,
    residence_mode,
    residence_country_code,
    requirement_type,
    validity_mode,
    travel_date
  ) values (
    neu_rule_scope_key,
    neu_fact_kind,
    neu_evidence_quality,
    neu_lifecycle,
    neu_validation_state,
    neu_accepted_at,
    neu_destination,
    neu_transit,
    neu_citizenship_mode,
    neu_citizenship,
    neu_credential_mode,
    neu_document_type,
    neu_issuing,
    neu_related,
    neu_residence_mode,
    neu_residence,
    neu_requirement_type,
    neu_validity_mode,
    neu_travel_date
  )
  returning claim_id into new_claim_id;

  if neu_fact_kind = 'requirement_effect' then
    insert into private.official_rule_claim_requirement_effect (
      claim_id, fact_kind, requirement_type, effect, visa_mode
    ) values (
      new_claim_id,
      neu_fact_kind,
      neu_requirement_type,
      fact ->> 'effect',
      fact ->> 'visa_mode'
    );
  elsif neu_fact_kind = 'visa_options' then
    for option_row in
      select entry.value as value
      from pg_catalog.jsonb_array_elements(fact -> 'options') as entry(value)
    loop
      insert into private.official_rule_claim_visa_options (
        claim_id, fact_kind, requirement_type, ordinal, visa_mode, eligibility, mandate
      ) values (
        new_claim_id,
        neu_fact_kind,
        neu_requirement_type,
        (option_row.value ->> 'ordinal')::pg_catalog.int2,
        option_row.value ->> 'visa_mode',
        option_row.value ->> 'eligibility',
        option_row.value ->> 'mandate'
      );
    end loop;
  elsif neu_fact_kind = 'stay_limit' then
    insert into private.official_rule_claim_stay_limit (
      claim_id,
      fact_kind,
      requirement_type,
      per_visit_value,
      per_visit_unit,
      rolling_maximum_value,
      rolling_maximum_unit,
      rolling_within_value,
      rolling_within_unit,
      initial_grant_value,
      initial_grant_unit,
      extension_requires_application,
      extension_maximum_total_value,
      extension_maximum_total_unit,
      border_discretion
    ) values (
      new_claim_id,
      neu_fact_kind,
      neu_requirement_type,
      case when fact -> 'per_visit_value' = 'null'::pg_catalog.jsonb or fact -> 'per_visit_value' is null then null else (fact ->> 'per_visit_value')::pg_catalog.int4 end,
      fact ->> 'per_visit_unit',
      case when fact -> 'rolling_maximum_value' = 'null'::pg_catalog.jsonb or fact -> 'rolling_maximum_value' is null then null else (fact ->> 'rolling_maximum_value')::pg_catalog.int4 end,
      fact ->> 'rolling_maximum_unit',
      case when fact -> 'rolling_within_value' = 'null'::pg_catalog.jsonb or fact -> 'rolling_within_value' is null then null else (fact ->> 'rolling_within_value')::pg_catalog.int4 end,
      fact ->> 'rolling_within_unit',
      case when fact -> 'initial_grant_value' = 'null'::pg_catalog.jsonb or fact -> 'initial_grant_value' is null then null else (fact ->> 'initial_grant_value')::pg_catalog.int4 end,
      fact ->> 'initial_grant_unit',
      case when fact -> 'extension_requires_application' = 'null'::pg_catalog.jsonb or fact -> 'extension_requires_application' is null then null else (fact ->> 'extension_requires_application')::pg_catalog.bool end,
      case when fact -> 'extension_maximum_total_value' = 'null'::pg_catalog.jsonb or fact -> 'extension_maximum_total_value' is null then null else (fact ->> 'extension_maximum_total_value')::pg_catalog.int4 end,
      fact ->> 'extension_maximum_total_unit',
      fact ->> 'border_discretion'
    );
  elsif neu_fact_kind = 'passport_validity' then
    insert into private.official_rule_claim_passport_validity (
      claim_id, fact_kind, requirement_type, semantics, duration_value, duration_unit
    ) values (
      new_claim_id,
      neu_fact_kind,
      neu_requirement_type,
      fact ->> 'semantics',
      case when fact -> 'duration_value' = 'null'::pg_catalog.jsonb or fact -> 'duration_value' is null then null else (fact ->> 'duration_value')::pg_catalog.int4 end,
      fact ->> 'duration_unit'
    );
  elsif neu_fact_kind = 'blank_passport_pages' then
    insert into private.official_rule_claim_blank_pages (
      claim_id, fact_kind, requirement_type, minimum_pages
    ) values (
      new_claim_id,
      neu_fact_kind,
      neu_requirement_type,
      (fact ->> 'minimum_pages')::pg_catalog.int4
    );
  elsif neu_fact_kind = 'transit_conditions' then
    for path_row in
      select entry.value as value
      from pg_catalog.jsonb_array_elements(fact -> 'paths') as entry(value)
    loop
      if path_row.value -> 'transit_airport_codes' is null
        or path_row.value -> 'transit_airport_codes' = 'null'::pg_catalog.jsonb then
        path_airports := null;
      elsif pg_catalog.jsonb_typeof(path_row.value -> 'transit_airport_codes') is distinct from 'array' then
        raise exception 'official truth store transit airports are invalid'
          using errcode = '22023';
      else
        select pg_catalog.array_agg(code.value order by code.ordinality)
        into path_airports
        from pg_catalog.jsonb_array_elements_text(path_row.value -> 'transit_airport_codes')
          with ordinality as code(value, ordinality);
      end if;

      insert into private.official_rule_claim_transit_paths (
        claim_id,
        fact_kind,
        requirement_type,
        ordinal,
        crosses_border_control,
        leaves_transit_area,
        transit_airport_codes,
        max_transit_duration_minutes,
        arrival_mode,
        departure_mode,
        third_country_required,
        same_flight_required,
        onward_ticket_required
      ) values (
        new_claim_id,
        neu_fact_kind,
        neu_requirement_type,
        (path_row.value ->> 'ordinal')::pg_catalog.int2,
        case when path_row.value -> 'crosses_border_control' = 'null'::pg_catalog.jsonb or path_row.value -> 'crosses_border_control' is null then null else (path_row.value ->> 'crosses_border_control')::pg_catalog.bool end,
        case when path_row.value -> 'leaves_transit_area' = 'null'::pg_catalog.jsonb or path_row.value -> 'leaves_transit_area' is null then null else (path_row.value ->> 'leaves_transit_area')::pg_catalog.bool end,
        path_airports,
        case when path_row.value -> 'max_transit_duration_minutes' = 'null'::pg_catalog.jsonb or path_row.value -> 'max_transit_duration_minutes' is null then null else (path_row.value ->> 'max_transit_duration_minutes')::pg_catalog.int4 end,
        path_row.value ->> 'arrival_mode',
        path_row.value ->> 'departure_mode',
        case when path_row.value -> 'third_country_required' = 'null'::pg_catalog.jsonb or path_row.value -> 'third_country_required' is null then null else (path_row.value ->> 'third_country_required')::pg_catalog.bool end,
        case when path_row.value -> 'same_flight_required' = 'null'::pg_catalog.jsonb or path_row.value -> 'same_flight_required' is null then null else (path_row.value ->> 'same_flight_required')::pg_catalog.bool end,
        case when path_row.value -> 'onward_ticket_required' = 'null'::pg_catalog.jsonb or path_row.value -> 'onward_ticket_required' is null then null else (path_row.value ->> 'onward_ticket_required')::pg_catalog.bool end
      );
    end loop;
  elsif neu_fact_kind = 'official_actions' then
    for action_row in
      select entry.value as value
      from pg_catalog.jsonb_array_elements(fact -> 'actions') as entry(value)
    loop
      select source.source_class
      into action_source_class
      from private.official_sources as source
      where source.source_id = action_row.value ->> 'action_source_id';

      if not found then
        raise exception 'official action source is not stored'
          using errcode = '23503';
      end if;

      insert into private.official_rule_claim_actions (
        claim_id,
        fact_kind,
        requirement_type,
        ordinal,
        action_source_id,
        source_class,
        purpose,
        href,
        visa_mode
      ) values (
        new_claim_id,
        neu_fact_kind,
        neu_requirement_type,
        (action_row.value ->> 'ordinal')::pg_catalog.int2,
        action_row.value ->> 'action_source_id',
        action_source_class,
        action_row.value ->> 'purpose',
        action_row.value ->> 'href',
        action_row.value ->> 'visa_mode'
      );
    end loop;
  elsif neu_fact_kind = 'temporal_rule' then
    insert into private.official_rule_claim_temporal_rule (
      claim_id,
      fact_kind,
      requirement_type,
      temporal_kind,
      available_from_anchor,
      available_from_relation,
      available_from_offset_minutes,
      due_by_anchor,
      due_by_relation,
      due_by_offset_minutes,
      due_by_semantics
    ) values (
      new_claim_id,
      neu_fact_kind,
      neu_requirement_type,
      fact ->> 'temporal_kind',
      fact ->> 'available_from_anchor',
      fact ->> 'available_from_relation',
      case when fact -> 'available_from_offset_minutes' = 'null'::pg_catalog.jsonb or fact -> 'available_from_offset_minutes' is null then null else (fact ->> 'available_from_offset_minutes')::pg_catalog.int4 end,
      fact ->> 'due_by_anchor',
      fact ->> 'due_by_relation',
      case when fact -> 'due_by_offset_minutes' = 'null'::pg_catalog.jsonb or fact -> 'due_by_offset_minutes' is null then null else (fact ->> 'due_by_offset_minutes')::pg_catalog.int4 end,
      fact ->> 'due_by_semantics'
    );
  end if;

  support_expected := pg_catalog.jsonb_array_length(body -> 'support_version_ids');

  insert into private.official_rule_claim_support (
    identity_schema,
    content_item_id,
    content_item_version,
    representation_id,
    representation_version,
    identity_profile_id,
    identity_profile_version,
    content_type,
    claim_id,
    rule_scope_key,
    version_id,
    source_id,
    evidence_lifecycle,
    evidence_validation_state,
    source_class
  )
  select
    version.identity_schema,
    version.content_item_id,
    version.content_item_version,
    version.representation_id,
    version.representation_version,
    version.identity_profile_id,
    version.identity_profile_version,
    version.content_type,
    new_claim_id,
    neu_rule_scope_key,
    version.version_id,
    version.source_id,
    version.lifecycle,
    version.validation_state,
    source.source_class
  from pg_catalog.jsonb_array_elements_text(body -> 'support_version_ids') as requested(version_id)
  join private.official_evidence_versions as version
    on version.version_id = requested.version_id
   and version.rule_scope_key = neu_rule_scope_key
  join private.official_sources as source
    on source.source_id = version.source_id;

  get diagnostics support_written = row_count;

  if support_written is distinct from support_expected then
    raise exception 'support evidence version is not stored for this rule scope'
      using errcode = '23503';
  end if;

  set constraints private.official_rule_claims_fact_payload,
    private.official_rule_claim_requirement_effect_fact_payload,
    private.official_rule_claim_visa_options_fact_payload,
    private.official_rule_claim_stay_limit_fact_payload,
    private.official_rule_claim_passport_validity_fact_payload,
    private.official_rule_claim_blank_pages_fact_payload,
    private.official_rule_claim_transit_paths_fact_payload,
    private.official_rule_claim_actions_fact_payload,
    private.official_rule_claim_temporal_rule_fact_payload,
    private.official_rule_claims_support_count_v2,
    private.official_rule_support_count_v2 immediate;

  return pg_catalog.jsonb_build_object(
    'ok', true, 'identity_schema', 2,
    'operation', 'accepted_rule_claim',
    'outcome', 'inserted',
    'claim_id', new_claim_id
  );
end;
$fn$;

-- No private table/API-role DML and no permissive policies.
alter table private.official_source_blocked_domains enable row level security;
alter table private.official_source_blocked_domains force row level security;
revoke all on table private.official_source_blocked_domains from public, anon, authenticated, service_role;
alter table private.official_content_items enable row level security;
alter table private.official_content_items force row level security;
revoke all on table private.official_content_items from public, anon, authenticated, service_role;
create trigger official_content_items_immutable before update or delete on private.official_content_items
for each row execute function private.official_identity_immutable_v2();
alter table private.official_content_item_versions enable row level security;
alter table private.official_content_item_versions force row level security;
revoke all on table private.official_content_item_versions from public, anon, authenticated, service_role;
create trigger official_content_item_versions_immutable before update or delete on private.official_content_item_versions
for each row execute function private.official_identity_immutable_v2();
alter table private.official_content_representations enable row level security;
alter table private.official_content_representations force row level security;
revoke all on table private.official_content_representations from public, anon, authenticated, service_role;
create trigger official_content_representations_immutable before update or delete on private.official_content_representations
for each row execute function private.official_identity_immutable_v2();
alter table private.official_content_url_reservations enable row level security;
alter table private.official_content_url_reservations force row level security;
revoke all on table private.official_content_url_reservations from public, anon, authenticated, service_role;
create trigger official_content_url_reservations_immutable before update or delete on private.official_content_url_reservations
for each row execute function private.official_identity_immutable_v2();
alter table private.official_content_representation_urls enable row level security;
alter table private.official_content_representation_urls force row level security;
revoke all on table private.official_content_representation_urls from public, anon, authenticated, service_role;
create trigger official_content_representation_urls_immutable before update or delete on private.official_content_representation_urls
for each row execute function private.official_identity_immutable_v2();

create or replace function public.official_truth_source_catalog_v1(payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $fn$
begin raise exception 'Official Truth identity v1 unsupported after v2 cutover' using errcode = '0A000'; end;
$fn$;
revoke all on function public.official_truth_source_catalog_v1(jsonb) from public, anon, authenticated, service_role;
grant execute on function public.official_truth_source_catalog_v1(jsonb) to service_role;

create or replace function public.official_truth_store_accepted_v1(payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $fn$
begin raise exception 'Official Truth identity v1 unsupported after v2 cutover' using errcode = '0A000'; end;
$fn$;
revoke all on function public.official_truth_store_accepted_v1(jsonb) from public, anon, authenticated, service_role;
grant execute on function public.official_truth_store_accepted_v1(jsonb) to service_role;
revoke all on function private.official_identity_object_v2(jsonb, jsonb) from public, anon, authenticated, service_role;
revoke all on function private.official_identity_domain_v2(text) from public, anon, authenticated, service_role;
revoke all on function private.official_identity_url_v2(text) from public, anon, authenticated, service_role;
revoke all on function private.official_identity_ids_v2(text[]) from public, anon, authenticated, service_role;
revoke all on function private.official_identity_authorized_url_v2(text, text) from public, anon, authenticated, service_role;
revoke all on function private.official_identity_immutable_v2() from public, anon, authenticated, service_role;
revoke all on function private.official_identity_representation_check_v2() from public, anon, authenticated, service_role;
revoke all on function private.official_evidence_identity_check_v2() from public, anon, authenticated, service_role;
revoke all on function private.official_rule_support_count_v2() from public, anon, authenticated, service_role;
revoke all on function private.official_store_payload_check_v2(jsonb) from public, anon, authenticated, service_role;
revoke all on function private.official_store_eligibility_v2(jsonb) from public, anon, authenticated, service_role;
revoke all on function public.official_truth_source_catalog_v2(jsonb) from public, anon, authenticated, service_role;
grant execute on function public.official_truth_source_catalog_v2(jsonb) to service_role;
revoke all on function public.official_truth_store_accepted_v2(jsonb) from public, anon, authenticated, service_role;
grant execute on function public.official_truth_store_accepted_v2(jsonb) to service_role;

comment on table private.official_content_url_reservations is 'Permanent exact URL ownership by representation stream, including historical bindings. S1 has no release/rebind.';
comment on table private.official_rule_claim_support is 'Exact ev2 Evidence identity. One version per ContentItemRef; deferred count enforces explicit=1 / composed=2..8, regardless of authority count.';
comment on function public.official_truth_source_catalog_v2(jsonb) is 'Private identity-schema 2 snapshot and atomic initial registration. No seed, inference, executable profile authority or runtime activation.';
comment on function public.official_truth_store_accepted_v2(jsonb) is 'Strict structural transport for accepted ev2 Evidence and flat Rule facts. Not HTTP authentication, freshness policy, legal completeness or autonomous acceptance.';
commit;
