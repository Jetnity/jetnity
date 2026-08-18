-- Kostenkontrolle und Nutzungsprotokoll für Modellaufrufe (Phase 2.1)
--
-- Mit dieser Phase ruft Jetnity zum ersten Mal seit Phase 1.1b ein
-- kostenpflichtiges Modell auf. Der Weg dorthin ist ein öffentlicher Endpunkt:
-- Ein Gast darf eine Reise beschreiben, und ein Gast hat serverseitig keine
-- Identität (ADR-0042). Damit ist die Schranke gegen unkontrollierte Kosten
-- keine Nebensache der Oberfläche, sondern eine Eigenschaft der Datenbank.
--
-- ---------------------------------------------------------------------------
-- Warum die Schranke hier liegt und nicht in der Anwendung
-- ---------------------------------------------------------------------------
--
-- Ein Zähler im Browser ist keiner. Ein Zähler im Serverprozess ist auch keiner:
-- Vercel startet beliebig viele Instanzen, und jede hätte ihren eigenen. Die
-- einzige Stelle, die alle Aufrufe sieht, ist die Datenbank.
--
-- Dieselbe Lehre wie in ADR-0049 gilt auch hier: Die Prüfung ist ein Lesen mit
-- anschliessendem Schreiben. Ohne Serialisierung sähen gleichzeitige Anfragen
-- alle denselben Stand und kämen alle durch. Beide Funktionen unten nehmen
-- deshalb vor dem ersten Lesen eine Beratungssperre – hier eine **globale**,
-- weil die Tagesgrenzen über alle Aufrufer hinweg gelten und nicht je Konto.
-- Bei höchstens 38 Aufrufen am Tag ist dieser Wartepunkt keine Last.
--
-- ---------------------------------------------------------------------------
-- Zwei Schritte, nicht einer
-- ---------------------------------------------------------------------------
--
-- `modell_kontingent_beanspruchen()` läuft **vor** dem Aufruf und schreibt eine
-- Zeile mit dem Ergebnis `reserviert` und dem Preis des schlechtesten Falls.
-- `modell_nutzung_abschliessen()` läuft danach und ersetzt Ergebnis und Preis
-- durch das, was wirklich geschehen ist.
--
-- Die Reihenfolge ist der ganze Punkt. Zwischen dem Start eines Aufrufs und
-- seinem Ergebnis liegen Sekunden; würde erst hinterher gezählt, wäre der
-- Deckel für alles blind, was gerade läuft. So ist die Tagessumme zu jedem
-- Zeitpunkt eine Obergrenze.
--
-- Eine Reservierung wird nie freigegeben, auch nicht bei einem Fehlschlag. Ein
-- Aufruf, der in eine Zeitüberschreitung gelaufen ist, wurde von der Gegenseite
-- womöglich trotzdem berechnet – und ein Fehler, der das Kontingent wieder
-- öffnet, ist der bequemste Weg, es unbegrenzt zu benutzen.
--
-- ---------------------------------------------------------------------------
-- Was diese Schranke leistet und was nicht
-- ---------------------------------------------------------------------------
--
-- Die **Zählgrenzen** sind die belastbare Zusage. Sie wirken auf der
-- Reservierung, und die entsteht, bevor Geld ausgegeben wird; sie lassen sich
-- durch nichts, was danach geschieht, zurücknehmen.
--
-- Der **Kostendeckel** ist die zweite Schranke. Er greift, wenn ein Aufruf mehr
-- kostet als geschätzt – etwa nach einem Wechsel auf ein teureres Modell, bei
-- dem niemand die Zählgrenzen nachgezogen hat. Er ist aber der weichere der
-- beiden: `modell_nutzung_abschliessen()` ist für `anon` ausführbar (ein Gast
-- muss seinen eigenen Aufruf abschliessen können), und wer den Endpunkt direkt
-- anspricht, kann seine Reservierung mit 0 Tokens abschliessen und den Deckel
-- damit entlasten. Deshalb hängt die Zusage nicht an ihm.
--
-- Beide zusammen sind so gewählt, dass die Zählgrenze allein den Betrag
-- garantiert: 38 Aufrufe × 77 200 µ$ (schlechtester Fall auf `gpt-5.6-terra`)
-- = 2 933 600 µ$ < 3 000 000 µ$. `lib/modell/grenzen-datenbank.test.ts` prüft
-- diese Rechnung und die Gleichheit aller Zahlen mit
-- `lib/modell/konfiguration.ts` bei jedem `npm test`.
--
-- Eine rotierende Gastkennung bleibt möglich – ein Cookie ist wechselbar. Die
-- Antwort darauf ist nicht, ihn unwechselbar zu machen, sondern das
-- Gastkontingent kleiner zu halten als das gesamte (ADR-0052).

-- ---------------------------------------------------------------------------
-- 1. Die Tabelle
-- ---------------------------------------------------------------------------
--
-- Sie trägt, was für Kosten und Missbrauch nötig ist – und nichts darüber
-- hinaus. Kein Prompt, kein Modelloutput, keine Reisebeschreibung, keine
-- Kontokennung. Ein Kostenprotokoll ist kein Ort für Reiseinhalte.

create table public.model_usage (
  id uuid primary key default gen_random_uuid(),

  -- Welche Modellfunktion. Heute genau eine; ein weiterer Wert ist eine Zeile
  -- in der nächsten Migration und kein Enum (ADR-0043).
  funktion text not null
    constraint model_usage_funktion_werte check (funktion in ('reisevorschlag')),

  modell text not null
    constraint model_usage_modell_laenge check (char_length(btrim(modell)) between 1 and 60),

  -- Ob der Aufruf aus einem Konto oder von einem Gast kam. Trägt das eigene
  -- Tageskontingent der Gäste.
  art text not null
    constraint model_usage_art_werte check (art in ('konto', 'gast')),

  -- Pseudonym: SHA-256 der Kennung mit einem Präfix je Art, hexadezimal.
  --
  -- Bewusst **nicht** `user_id uuid references auth.users`. Für die Schranke
  -- genügt Gleichheit, und ein Kostenprotokoll, das jede Zeile einem Konto
  -- zuordnet, sammelt mehr, als es braucht. Ein gelöschtes Konto lässt hier
  -- einen Hash zurück, der auf nichts mehr zeigt.
  kennung_hash text not null
    constraint model_usage_kennung_format check (kennung_hash ~ '^[0-9a-f]{64}$'),

  -- `reserviert` bis zum Abschluss. Die übrigen Werte sind die Fehlerklassen aus
  -- `ERGEBNISKLASSEN` in `lib/modell/konfiguration.ts` – Klassen, keine
  -- Meldungen. Was ein Mensch liest, entsteht in der Anwendung.
  ergebnis text not null default 'reserviert'
    constraint model_usage_ergebnis_werte check (
      ergebnis in (
        'reserviert', 'erfolg', 'zeitueberschreitung', 'netz',
        'anbieter-4xx', 'anbieter-5xx', 'verweigert', 'abgeschnitten',
        'ungueltige-antwort', 'schema'
      )
    ),

  -- Tokens, soweit die API sie berichtet. `null` heisst „nicht berichtet" und
  -- nicht „keine" – ein Abschluss ohne Zahlen lässt den reservierten Betrag
  -- stehen, statt ihn auf null zu senken.
  eingabe_tokens integer
    constraint model_usage_eingabe_tokens_bereich check (eingabe_tokens is null or eingabe_tokens >= 0),
  gecachte_tokens integer
    constraint model_usage_gecachte_tokens_bereich check (gecachte_tokens is null or gecachte_tokens >= 0),
  ausgabe_tokens integer
    constraint model_usage_ausgabe_tokens_bereich check (ausgabe_tokens is null or ausgabe_tokens >= 0),

  laufzeit_ms integer
    constraint model_usage_laufzeit_bereich check (laufzeit_ms is null or laufzeit_ms between 0 and 600000),

  -- Mikrodollar: 1 USD = 1 000 000 µ$. Ganzzahlig, weil ein Deckel, der über
  -- Gleitkommazahlen summiert wird, kein Deckel bleibt. Bei der Reservierung der
  -- schlechteste Fall, nach dem Abschluss der berichtete Betrag.
  kosten_mikro_usd bigint not null
    constraint model_usage_kosten_bereich check (kosten_mikro_usd >= 0),

  created_at timestamptz not null default now(),
  abgeschlossen_am timestamptz,

  -- Solange nichts abgeschlossen ist, gibt es keinen Abschlusszeitpunkt – und
  -- umgekehrt. Ohne diese Bedingung wäre „läuft noch" von „abgeschlossen, aber
  -- ohne Zeitpunkt" nicht zu unterscheiden.
  constraint model_usage_abschluss_stimmig check (
    (ergebnis = 'reserviert' and abgeschlossen_am is null)
    or (ergebnis <> 'reserviert' and abgeschlossen_am is not null)
  )
);

comment on table public.model_usage is
  'Nutzungs- und Kostenprotokoll der Modellaufrufe. Trägt Funktionsart, Modell, Ergebnisklasse, Tokens, Laufzeit und Kosten in Mikrodollar – keinen Prompt, keinen Modelloutput, keine Kontokennung. Geschrieben ausschliesslich von modell_kontingent_beanspruchen() und modell_nutzung_abschliessen(); lesbar ab der Fähigkeit betrieb-lesen.';
comment on column public.model_usage.kennung_hash is
  'SHA-256 der Kennung mit Präfix je Art (konto:<auth.uid()> bzw. gast:<Cookie>). Pseudonym: für die Schranke genügt Gleichheit.';
comment on column public.model_usage.kosten_mikro_usd is
  'Mikrodollar (1 USD = 1e6). Bei ergebnis = reserviert der schlechteste Fall, danach der von der API berichtete Betrag. Preise in lib/modell/preise.ts und in public.modell_preis().';
comment on column public.model_usage.ergebnis is
  'reserviert bis zum Abschluss, danach eine Fehlerklasse aus ERGEBNISKLASSEN (lib/modell/konfiguration.ts). Klassen, keine Meldungen.';

-- Zugriffspfade, die es wirklich gibt:
--
--   · Kontingent je Kennung: Aufrufe einer Kennung im Fenster.
--   · Tagesgrenzen und Kostendeckel: alle Aufrufe des Fensters, teils nach Art.
create index model_usage_kennung_zeit_idx on public.model_usage (kennung_hash, created_at desc);
create index model_usage_zeit_idx on public.model_usage (created_at desc);

-- ---------------------------------------------------------------------------
-- 2. Zugriff
-- ---------------------------------------------------------------------------
--
-- Geschrieben wird ausschliesslich über die beiden Funktionen unten. Deshalb
-- gibt es kein `insert`-, `update`- oder `delete`-Recht und keine Policy dafür:
-- Ein Weg, auf dem sich eine Zeile von Hand anlegen liesse, wäre ein Weg, das
-- Kontingent zu fälschen.
--
-- Gelesen wird ab der Fähigkeit `betrieb-lesen` – dieselbe Stufe wie für
-- `security_events` und `blocked_ips`. Ein Kostenprotokoll, das niemand
-- ansehen kann, erfüllt AGENTS.md Regel 17 nicht; es enthält keine
-- Reiseinhalte und keine Kontokennung.

alter table public.model_usage enable row level security;

create policy model_usage_lesen on public.model_usage
  for select to authenticated using (public.darf_betrieb_lesen());

revoke all on table public.model_usage from anon, authenticated;
grant select on table public.model_usage to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Preise
-- ---------------------------------------------------------------------------
--
-- Die Preise stehen ein zweites Mal in `lib/modell/preise.ts`. Das ist keine
-- Bequemlichkeit: Der Kostendeckel wird hier durchgesetzt, und ein Deckel, der
-- den Preis von seinem Aufrufer erfährt, ist keiner – `/rest/v1/rpc/` ist mit
-- dem öffentlichen anon-Key erreichbar.
--
-- Dass beide Seiten übereinstimmen, prüft `lib/modell/grenzen-datenbank.test.ts`
-- ohne Datenbank, allein aus diesem SQL und der TypeScript-Datei.
--
-- Einheit: µ$ je 1 000 000 Tokens – genau die Einheit der OpenAI-Preisliste.
-- Stand 18. August 2026, https://developers.openai.com/api/docs/pricing

create or replace function public.modell_preis(_modell text)
returns table (eingabe bigint, eingabe_gecacht bigint, ausgabe bigint)
language sql
immutable
set search_path = public, pg_temp
as $$
  select *
    from (
      values
        ('gpt-5.6-luna',    200000::bigint,   20000::bigint,  1200000::bigint),
        ('gpt-5.6-terra',  2000000::bigint,  200000::bigint, 12000000::bigint),
        ('gpt-5.6-sol',    5000000::bigint,  500000::bigint, 30000000::bigint)
    ) as preis(modell, eingabe, eingabe_gecacht, ausgabe)
   where preis.modell = _modell;
$$;

comment on function public.modell_preis(text) is
  'Preis eines Modells in Mikrodollar je 1e6 Tokens. Leer für ein unbekanntes Modell – dann kommt kein Kontingent zustande. Muss mit PREISE in lib/modell/preise.ts übereinstimmen (geprüft in lib/modell/grenzen-datenbank.test.ts).';

revoke all on function public.modell_preis(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Kontingent beanspruchen
-- ---------------------------------------------------------------------------

create or replace function public.modell_kontingent_beanspruchen(
  _funktion text,
  _modell text,
  _gastkennung text default null
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

  _konto uuid := auth.uid();
  _art text;
  _hash text;
  _preis record;
  _reservierung bigint;
  _id uuid;
begin
  -- Die Identität kommt nicht vom Aufrufer, soweit es eine gibt. Ein
  -- angemeldetes Konto wird über `auth.uid()` bestimmt; eine mitgeschickte
  -- Gastkennung wird dann ignoriert. Sonst könnte ein Konto sein eigenes
  -- Kontingent umgehen, indem es sich als Gast ausgibt.
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

  -- Ohne Preis kein Kontingent. Ein unbekanntes Modell ist keine Kleinigkeit:
  -- Es hiesse, ohne Kostendeckel aufzurufen.
  select * into _preis from public.modell_preis(_modell);
  if not found then
    raise exception 'Die intelligente Planung ist nicht richtig konfiguriert.'
      using errcode = '22023';
  end if;

  -- Der schlechteste Fall, ohne Annahme über den Prompt-Cache. Eine Annahme zu
  -- Gunsten der Kosten wäre keine Reservierung.
  _reservierung := ceil(
    (_max_eingabe_tokens::numeric * _preis.eingabe + _max_ausgabe_tokens::numeric * _preis.ausgabe)
    / 1000000
  );

  -- Serialisierung über alle Aufrufer. Die Tagesgrenzen gelten global, also
  -- muss auch die Sperre global sein. Zweiteiliger Schlüssel wie in ADR-0049:
  -- Der erste Teil benennt den Zweck, damit eine spätere Sperre zu einem
  -- anderen Zweck nicht zufällig dieselbe Zahl trifft.
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

  -- Der Kostendeckel. Summiert wird der aktuelle Stand jeder Zeile: bei
  -- laufenden Aufrufen die Reservierung, bei abgeschlossenen der berichtete
  -- Betrag. Damit ist die Summe zu jedem Zeitpunkt eine Obergrenze.
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

comment on function public.modell_kontingent_beanspruchen(text, text, text) is
  'Prüft alle Kontingente und legt vor dem Modellaufruf eine Zeile mit dem Preis des schlechtesten Falls an; liefert deren Kennung. Erschöpftes Kontingent: 53400 mit einer Meldung für Reisende. Die Identität eines angemeldeten Kontos kommt aus auth.uid(), nicht vom Aufrufer. Serialisiert global über pg_advisory_xact_lock (ADR-0052).';

revoke all on function public.modell_kontingent_beanspruchen(text, text, text) from public;
grant execute on function public.modell_kontingent_beanspruchen(text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Nutzung abschliessen
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
  if _ergebnis = 'reserviert' then
    raise exception 'Ein Abschluss braucht ein Ergebnis.' using errcode = '22023';
  end if;

  -- Die Kennung der Zeile ist die Berechtigung: eine zufällige UUID, die nur
  -- kennt, wer das Kontingent beansprucht hat. Ein zweiter Abschluss derselben
  -- Zeile findet nichts mehr – `where ergebnis = 'reserviert'` unten – und
  -- bleibt damit ohne Wirkung statt eine Korrektur zu erlauben.
  select modell into _modell
    from public.model_usage
   where id = _id and ergebnis = 'reserviert'
     for update;

  if not found then
    return;
  end if;

  -- Die Kosten rechnet die Datenbank aus den Tokens, nicht der Aufrufer aus
  -- seinem Ergebnis. Fehlen die Tokens, bleibt der reservierte Betrag stehen:
  -- „nicht berichtet" ist nicht „hat nichts gekostet".
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
         eingabe_tokens = greatest(coalesce(_eingabe_tokens, 0), 0),
         gecachte_tokens = greatest(coalesce(_gecachte_tokens, 0), 0),
         ausgabe_tokens = greatest(coalesce(_ausgabe_tokens, 0), 0),
         laufzeit_ms = least(greatest(coalesce(_laufzeit_ms, 0), 0), 600000),
         kosten_mikro_usd = coalesce(_kosten, kosten_mikro_usd),
         abgeschlossen_am = now()
   where id = _id and ergebnis = 'reserviert';
end
$$;

comment on function public.modell_nutzung_abschliessen(uuid, text, integer, integer, integer, integer) is
  'Schliesst eine reservierte Zeile ab: Ergebnisklasse, Tokens, Laufzeit und die daraus berechneten Kosten. Ohne Tokens bleibt der reservierte Betrag stehen. Wirkt genau einmal je Zeile; eine unbekannte oder bereits abgeschlossene Kennung bleibt ohne Wirkung und ohne Fehler.';

revoke all on function public.modell_nutzung_abschliessen(uuid, text, integer, integer, integer, integer) from public;
grant execute on function public.modell_nutzung_abschliessen(uuid, text, integer, integer, integer, integer) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. Aufbewahrung
-- ---------------------------------------------------------------------------
--
-- Die Zeilen tragen keine Reiseinhalte und keine Kontokennung, und ihr Zweck
-- endet mit dem Tagesfenster, das sie begrenzen. Länger als für Kostenübersicht
-- und Missbrauchserkennung nötig sollen sie nicht liegen bleiben.
--
-- Ein zeitgesteuerter Lauf entsteht hier bewusst nicht: `cron.job` ist seit
-- Phase 1.1 leer, und ein einzelner Job wieder einzuführen ist eine eigene
-- Entscheidung mit eigenem Nachweis. Bis dahin gilt die Anweisung unten von
-- Hand; sie steht in docs/MODELL.md.
--
--   delete from public.model_usage where created_at < now() - interval '90 days';
