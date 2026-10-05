-- Kontingent nur über den vertrauenswürdigen Serverweg (Nachtrag zu Phase 2.1)
--
-- `20260818040000` hat `EXECUTE` auf die beiden Kostenschranken-Funktionen an
-- `anon` und `authenticated` gegeben. Ein Gast hat keine Sitzung (ADR-0042),
-- und die Schranke sollte trotzdem gelten. Das öffnete denselben Weg über
-- PostgREST: Wer den öffentlichen anon-Key kennt, konnte
-- `/rest/v1/rpc/modell_kontingent_beanspruchen` direkt aufrufen, Reservierungen
-- erzeugen und den Gasttopf leeren – ohne Modellaufruf, ohne Server Action.
--
-- Die Kostenschranke selbst bleibt in der Datenbank (ADR-0052). Geändert wird
-- nur, wer sie auslösen darf: ausschliesslich `service_role`, und damit nur
-- der serverseitige Modellweg. Gäste ohne Konto bleiben möglich, weil die
-- Server Action die Gastkennung setzt und den Aufruf für sie übernimmt.
--
-- `auth.uid()` steht auf diesem Weg nicht zur Verfügung – der Dienst-JWT trägt
-- kein `sub`. Die Kontokennung kommt deshalb als Argument vom Server, der sie
-- zuvor mit `auth.getUser()` gelesen hat. Ohne Dienstrolle wird das Argument
-- nicht angenommen; ein direkter Aufruf als `anon` oder `authenticated` endet
-- mit `42501`, auch wenn jemand das Ausführungsrecht später wieder vergäbe.

-- ---------------------------------------------------------------------------
-- 1. Beanspruchung: nur service_role, Identität vom Server
-- ---------------------------------------------------------------------------

create or replace function public.modell_kontingent_beanspruchen(
  _funktion text,
  _modell text,
  _gastkennung text default null,
  _konto uuid default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  -- Dieselben Zahlen wie MODELL_GRENZEN in lib/modell/konfiguration.ts.
  _max_eingabe_tokens constant integer := 2600;
  _max_ausgabe_tokens constant integer := 6000;
  _je_kennung_stunde  constant integer := 4;
  _je_kennung_tag     constant integer := 8;
  _gaeste_tag         constant integer := 24;
  _gesamt_tag         constant integer := 38;
  _kosten_tag         constant bigint  := 3000000;

  _art text;
  _hash text;
  _preis record;
  _reservierung bigint;
  _id uuid;
begin
  -- Nur der Dienst-JWT. `anon` und `authenticated` haben kein EXECUTE; diese
  -- Prüfung hält den Weg auch dann zu, wenn jemand das Recht wieder vergibt.
  if coalesce(auth.role(), '') is distinct from 'service_role' then
    raise exception 'Diese Funktion ist nur über den internen Modellweg erreichbar.'
      using errcode = '42501';
  end if;

  -- Die Identität kommt vom vertrauenswürdigen Server, nicht aus dem JWT:
  -- service_role trägt kein `sub`. Ein mitgeschicktes `_konto` gewinnt gegen
  -- die Gastkennung, damit ein Konto sich nicht als Gast ausgeben kann.
  if _konto is not null then
    _art := 'konto';
    _hash := encode(sha256(convert_to('konto:' || _konto::text, 'UTF8')), 'hex');
  else
    _art := 'gast';

    if _gastkennung is null or char_length(btrim(_gastkennung)) not between 16 and 64 then
      raise exception 'Für diesen Schritt fehlt eine Sitzungskennung. Bitte lade die Seite neu.'
        using errcode = '22023';
    end if;

    _hash := encode(sha256(convert_to('gast:' || btrim(_gastkennung), 'UTF8')), 'hex');
  end if;

  select * into _preis from public.modell_preis(_modell);
  if not found then
    raise exception 'Die intelligente Planung ist nicht richtig konfiguriert.'
      using errcode = '22023';
  end if;

  _reservierung := ceil(
    (_max_eingabe_tokens::numeric * _preis.eingabe + _max_ausgabe_tokens::numeric * _preis.ausgabe)
    / 1000000
  );

  perform pg_advisory_xact_lock(hashtext('public.model_usage'), 0);

  if (select count(*) from public.model_usage
       where kennung_hash = _hash
         and created_at >= now() - interval '1 hour') >= _je_kennung_stunde then
    raise exception 'Du hast in der letzten Stunde schon mehrere Reisen erstellen lassen. Bitte versuche es später erneut.'
      using errcode = '53400';
  end if;

  if (select count(*) from public.model_usage
       where kennung_hash = _hash
         and created_at >= now() - interval '1 day') >= _je_kennung_tag then
    raise exception 'Für heute ist die Zahl der Reisevorschläge erreicht. Morgen geht es weiter.'
      using errcode = '53400';
  end if;

  if _art = 'gast' and (select count(*) from public.model_usage
       where art = 'gast'
         and created_at >= now() - interval '1 day') >= _gaeste_tag then
    raise exception 'Die intelligente Planung ist heute stark gefragt. Mit einem Konto steht sie dir wieder zur Verfügung.'
      using errcode = '53400';
  end if;

  if (select count(*) from public.model_usage
       where created_at >= now() - interval '1 day') >= _gesamt_tag then
    raise exception 'Die intelligente Planung ist heute ausgelastet. Bitte versuche es morgen erneut.'
      using errcode = '53400';
  end if;

  if (select coalesce(sum(kosten_mikro_usd), 0) from public.model_usage
       where created_at >= now() - interval '1 day') + _reservierung > _kosten_tag then
    raise exception 'Die intelligente Planung ist heute ausgelastet. Bitte versuche es morgen erneut.'
      using errcode = '53400';
  end if;

  insert into public.model_usage (funktion, modell, art, kennung_hash, kosten_mikro_usd)
  values (_funktion, _modell, _art, _hash, _reservierung)
  returning id into _id;

  return _id;
end
$$;

comment on function public.modell_kontingent_beanspruchen(text, text, text, uuid) is
  'Prüft alle Kontingente und legt vor dem Modellaufruf eine Zeile mit dem Preis des schlechtesten Falls an; liefert deren Kennung. Nur service_role: der serverseitige Modellweg. Die Kontokennung kommt als Argument vom Server, der sie mit auth.getUser() gelesen hat; ohne _konto gilt die Gastkennung. Erschöpftes Kontingent: 53400. Serialisiert global über pg_advisory_xact_lock (ADR-0052).';

-- Die dreistellige Fassung aus 20260818040000 bleibt sonst stehen und wäre
-- weiter für anon ausführbar. Ein CREATE OR REPLACE mit zusätzlichem Argument
-- ersetzt sie nicht.
drop function if exists public.modell_kontingent_beanspruchen(text, text, text);

revoke all on function public.modell_kontingent_beanspruchen(text, text, text, uuid)
  from public, anon, authenticated;
grant execute on function public.modell_kontingent_beanspruchen(text, text, text, uuid)
  to service_role;

-- ---------------------------------------------------------------------------
-- 2. Abschluss: dieselbe Tür
-- ---------------------------------------------------------------------------

create or replace function public.modell_nutzung_abschliessen(
  _id uuid,
  _ergebnis text,
  _eingabe_tokens integer default null,
  _gecachte_tokens integer default null,
  _ausgabe_tokens integer default null,
  _laufzeit_ms integer default null
)
returns void
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  _modell text;
  _preis record;
  _kosten bigint;
begin
  if coalesce(auth.role(), '') is distinct from 'service_role' then
    raise exception 'Diese Funktion ist nur über den internen Modellweg erreichbar.'
      using errcode = '42501';
  end if;

  if _ergebnis = 'reserviert' then
    raise exception 'Ein Abschluss braucht ein Ergebnis.' using errcode = '22023';
  end if;

  select modell into _modell
    from public.model_usage
   where id = _id and ergebnis = 'reserviert'
     for update;

  if not found then
    return;
  end if;

  if _eingabe_tokens is null and _ausgabe_tokens is null then
    _kosten := null;
  else
    select * into _preis from public.modell_preis(_modell);

    if found then
      _kosten := ceil(
        (
          (greatest(coalesce(_eingabe_tokens, 0), 0) - least(greatest(coalesce(_gecachte_tokens, 0), 0), greatest(coalesce(_eingabe_tokens, 0), 0)))::numeric * _preis.eingabe
          + least(greatest(coalesce(_gecachte_tokens, 0), 0), greatest(coalesce(_eingabe_tokens, 0), 0))::numeric * _preis.eingabe_gecacht
          + greatest(coalesce(_ausgabe_tokens, 0), 0)::numeric * _preis.ausgabe
        ) / 1000000
      );
    else
      _kosten := null;
    end if;
  end if;

  update public.model_usage
     set ergebnis = _ergebnis,
         eingabe_tokens = case when _eingabe_tokens is null then null else greatest(_eingabe_tokens, 0) end,
         gecachte_tokens = case when _gecachte_tokens is null then null else greatest(_gecachte_tokens, 0) end,
         ausgabe_tokens = case when _ausgabe_tokens is null then null else greatest(_ausgabe_tokens, 0) end,
         laufzeit_ms = case when _laufzeit_ms is null then null else least(greatest(_laufzeit_ms, 0), 600000) end,
         kosten_mikro_usd = coalesce(_kosten, kosten_mikro_usd),
         abgeschlossen_am = now()
   where id = _id and ergebnis = 'reserviert';
end
$$;

comment on function public.modell_nutzung_abschliessen(uuid, text, integer, integer, integer, integer) is
  'Schliesst eine reservierte Zeile ab: Ergebnisklasse, Tokens, Laufzeit und die daraus berechneten Kosten. Nur service_role. Ohne Tokens bleibt der reservierte Betrag stehen. Wirkt genau einmal je Zeile.';

revoke all on function public.modell_nutzung_abschliessen(uuid, text, integer, integer, integer, integer)
  from public, anon, authenticated;
grant execute on function public.modell_nutzung_abschliessen(uuid, text, integer, integer, integer, integer)
  to service_role;
