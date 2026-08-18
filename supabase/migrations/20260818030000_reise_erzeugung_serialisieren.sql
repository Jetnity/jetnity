-- Die Erzeugungsschranke hält auch gleichzeitig
--
-- ADR-0045 hat die Schranke von 60 neuen Reisen je Konto und Stunde in den
-- Auslöser `trips_erzeugung_pruefen` verlegt, ADR-0048 hat ihr beigebracht,
-- Neuanlagen von Wiederholungen zu unterscheiden. Beide Male blieb dieselbe
-- Annahme unausgesprochen: dass ein Konto seine Reisen der Reihe nach anlegt.
--
-- Die Prüfung ist ein Lesen mit anschliessendem Schreiben – `count(*)`, dann die
-- Einfügung. Zwischen beidem liegt ein Fenster, und in PostgreSQL sieht eine
-- Transaktion die noch nicht festgeschriebene Zeile einer anderen nicht. Bei 59
-- vorhandenen Reisen sahen darum acht gleichzeitige Anfragen alle den Stand 59,
-- alle kamen durch, und das Konto hatte danach 67 Reisen. Nachgemessen mit
-- `npm run db:parallelitaet`, auf beiden Schreibwegen.
--
-- Über PostgREST sind gleichzeitige Anfragen der Normalfall und nicht der
-- Sonderfall: Genau der öffentliche Schreibweg, gegen den ADR-0045 absichert,
-- war damit weiter offen – nur nicht mehr sequenziell, sondern parallel.
--
-- Diese Migration serialisiert die Prüfung je Konto mit einer Beratungssperre
-- auf Transaktionsdauer. Wer sie hält, führt Zählung und Einfügung allein aus;
-- wer wartet, sieht danach den festgeschriebenen Stand.
--
-- Zur Wahl standen:
--
--   a) `select … for update` auf einer Zeile je Konto, etwa in `public.profiles`.
--      Bindet die Erzeugung einer Reise an eine fremde Tabelle: Wer sein Profil
--      ändert, blockiert dann das Anlegen einer Reise. Ausserdem hat nicht jedes
--      Konto ein Profil – `trips.user_id` verweist auf `auth.users`.
--
--   b) `SERIALIZABLE`. Die Isolationsstufe bestimmt der Client, nicht die
--      Tabelle. Ein Auslöser kann sie nicht verlangen, und `40001` müsste die
--      Anwendung überall behandeln.
--
--   c) Ein Zähler je Konto und Stunde in einer eigenen Tabelle, hochgezählt per
--      `insert … on conflict do update`. Serialisiert über die Zeilensperre, aber
--      um den Preis einer weiteren Tabelle, einer weiteren Policy und eines
--      zweiten Ortes, an dem die Wahrheit über den Bestand steht.
--
--   d) Eine Beratungssperre je Konto auf Transaktionsdauer.
--
-- Diese Migration nimmt d) (ADR-0049): kein neues Schemaobjekt, keine Sperre auf
-- Nutzdaten, und die Freigabe geschieht von selbst mit dem Ende der Transaktion –
-- auch bei einem Abbruch. Eine vergessene Freigabe ist damit ausgeschlossen.

create or replace function public.reise_erzeugung_pruefen()
returns trigger
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
begin
  -- Die Zeitstempel gehören der Datenbank. Sie sind kein Feld der Oberfläche,
  -- und ein rückdatiertes `created_at` wäre der bequemste Weg an der Schranke
  -- vorbei: Zeilen ausserhalb des Fensters zählen nicht mit.
  new.created_at := now();
  new.updated_at := now();

  -- Eine neue Reise ist ein Entwurf. `planned`, `booked` oder `archived`
  -- entstehen aus einem Vorgang und nicht aus einer Behauptung beim Anlegen.
  --
  -- Diese Regel braucht keine Sperre: Sie liest nichts, sie sieht nur die Zeile,
  -- die gerade entsteht.
  if new.status <> 'draft' then
    raise exception 'Eine neue Reise beginnt als Entwurf.'
      using errcode = '22023';
  end if;

  -- Ab hier wird gelesen und daraus auf ein Schreiben geschlossen. Beides gehört
  -- zusammen, also gilt es je Konto der Reihe nach.
  --
  -- Der Schlüssel ist zweiteilig: Der erste Teil benennt, worum es geht, der
  -- zweite das Konto. Beratungssperren teilen sich einen Namensraum über die
  -- ganze Datenbank – ohne den ersten Teil könnte eine spätere Sperre zu
  -- irgendeinem anderen Zweck zufällig dieselbe Zahl treffen. Ein Zusammenstoss
  -- zweier Konten im zweiten Teil kostet Wartezeit, nie Richtigkeit.
  --
  -- `_xact_`: Die Sperre endet mit der Transaktion, ob sie festschreibt oder
  -- abbricht. Innerhalb derselben Transaktion ist sie wiederholt nehmbar – eine
  -- Anweisung, die 61 Zeilen einfügt, ruft den Auslöser 61-mal und blockiert sich
  -- dabei nicht selbst.
  perform pg_advisory_xact_lock(hashtext('public.trips'), hashtext(new.user_id::text));

  -- Ist die Kennung dieses Kontos schon belegt, entsteht keine Reise. Die
  -- Schranke zählt Neuanlagen und darf an einer Wiederholung nicht greifen.
  --
  -- Diese Prüfung steht bewusst NACH der Sperre und nicht davor. Vor der Sperre
  -- gelesen wäre sie veraltet, sobald sie gebraucht wird: Zwei gleichzeitige
  -- Anfragen mit derselben neuen Kennung sähen beide „noch nicht vorhanden", und
  -- die zweite würde nach dem Warten an der Schranke scheitern, obwohl die erste
  -- ihre Reise inzwischen angelegt hat. Genau dieser Fall – zwei Tabs, ein Klick –
  -- muss idempotent bleiben (ADR-0048).
  if exists (
    select 1 from public.trips
     where user_id = new.user_id
       and client_ref = new.client_ref
  ) then
    return new;
  end if;

  -- Missbrauchsschranke: 60 neue Reisen je Konto und Stunde. Die Schranke ist
  -- bewusst eine Rate und keine Gesamtzahl – wie viele Reisen ein Konto besitzen
  -- darf, ist eine Produktentscheidung; wie schnell es sie anlegen kann, ist
  -- eine technische Frage.
  --
  -- Die Zählung läuft jetzt unter der Sperre und sieht deshalb den Stand, der
  -- auch nach dem Warten noch gilt.
  --
  -- `53400` ist `configuration_limit_exceeded` und damit für
  -- `lib/api/datenbank-lesen.ts` ein vorübergehendes Problem: „später erneut
  -- versuchen" ist hier die richtige Auskunft.
  if (select count(*) from public.trips
       where user_id = new.user_id
         and created_at >= now() - interval '1 hour') >= 60 then
    raise exception 'Zu viele neue Reisen in kurzer Zeit. Bitte versuche es später erneut.'
      using errcode = '53400';
  end if;

  return new;
end
$$;

comment on function public.reise_erzeugung_pruefen() is
  'Auslöser vor jeder Einfügung in public.trips: setzt created_at und updated_at, verlangt status = draft und begrenzt auf 60 neue Reisen je Konto und Stunde. Die Schranke zählt Neuanlagen: Ist (user_id, client_ref) schon belegt, entsteht keine Reise, und der Schreibvorgang läuft unbehindert in trips_client_ref_eindeutig – so bleibt der Retry von public.reise_anlegen() auch an der Grenze idempotent. Zählung und Einfügung laufen je Konto der Reihe nach, serialisiert über eine Beratungssperre auf Transaktionsdauer; ohne sie liesse sich die Schranke mit gleichzeitigen Anfragen überschreiten (ADR-0045, ADR-0048, ADR-0049).';
