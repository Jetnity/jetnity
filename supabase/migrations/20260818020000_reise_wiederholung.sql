-- Eine Wiederholung ist keine Neuanlage
--
-- ADR-0045 hat die Erzeugungsregeln von `public.trips` in den Auslöser
-- `trips_erzeugung_pruefen` verlegt, damit sie auf jedem Schreibweg gelten. Das
-- war richtig, hat aber die Idempotenz genau an der Grenze gebrochen.
--
-- `public.reise_anlegen()` trägt die Idempotenz über
-- `on conflict (user_id, client_ref) do nothing`: Derselbe Aufruf ergibt
-- dieselbe Reise, und die Brücke auf /reisen löscht den Entwurf im Browser erst,
-- nachdem der Server die Kennung gemeldet hat. Ein `BEFORE INSERT`-Auslöser
-- läuft jedoch **vor** dem eindeutigen Index. Die Reihenfolge ist:
--
--   1. Auslöser
--   2. Prüfung von `trips_client_ref_eindeutig`
--   3. `on conflict`
--
-- Hatte ein Konto 60 Reisen in der letzten Stunde und wiederholte danach einen
-- bereits erfolgreichen Aufruf – Retry nach Netzfehler, Reload, zweite
-- Anmeldung –, dann warf der Auslöser bei Schritt 1 mit `53400`, bevor Schritt 3
-- die bestehende Reise erkennen konnte. Fachlich entstand dabei keine Reise; die
-- Schranke lehnte trotzdem ab. Der Entwurf im Browser blieb liegen, und jeder
-- weitere Versuch scheiterte gleich – bis eine Stunde vergangen war.
--
-- Dieselbe Verwechslung traf den direkten Weg: Ein `INSERT` mit einer schon
-- belegten Kennung meldete `53400` statt `23505`.
--
-- Die Ursache ist keine falsche Zahl, sondern eine falsche Frage. Der Auslöser
-- fragte „wie viele Reisen hat dieses Konto in der letzten Stunde angelegt?" und
-- schloss daraus auf „darf dieser Schreibvorgang durch?". Dazwischen fehlte:
-- „entsteht hier überhaupt eine Reise?"
--
-- Diese Migration ergänzt genau diese Frage. Liegt `(user_id, client_ref)` schon
-- vor, entsteht keine Reise, und die Schranke gilt nicht. Der Schreibvorgang ist
-- damit nicht erlaubt – er läuft weiter in den eindeutigen Index und endet dort,
-- wo er hingehört: in `reise_anlegen()` im `on conflict do nothing`, auf dem
-- direkten Weg in `23505`.
--
-- Warum das kein neues Loch ist: Der Weg an der Schranke vorbei setzt eine
-- bestehende Kennung voraus, und genau die lässt `trips_client_ref_eindeutig`
-- keine zweite Zeile werden. Eine tatsächlich neue Kennung kommt an der
-- Existenzprüfung nicht vorbei und wird bei erreichtem Limit weiter mit `53400`
-- abgelehnt.

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
  -- Diese Regel steht bewusst vor der Prüfung auf eine Wiederholung: `booked`
  -- beim Anlegen zu behaupten ist auf jedem Weg falsch, auch wenn die Zeile
  -- danach ohnehin am eindeutigen Index scheitern würde. `reise_anlegen()` setzt
  -- den Status selbst auf `draft`, ein Retry über die Funktion erreicht diese
  -- Ausnahme also nicht.
  if new.status <> 'draft' then
    raise exception 'Eine neue Reise beginnt als Entwurf.'
      using errcode = '22023';
  end if;

  -- Ist die Kennung dieses Kontos schon belegt, entsteht keine Reise. Die
  -- Schranke zählt Neuanlagen und darf an einer Wiederholung nicht greifen.
  --
  -- Die Abfrage läuft über `trips_client_ref_eindeutig` – denselben Index, an
  -- dem der Schreibvorgang unmittelbar danach hängt. `SECURITY DEFINER` gilt
  -- hier aus demselben Grund wie für die Zählung: Eine Prüfung, die durch die
  -- Lesepolicy läuft, wäre nur so lange richtig, wie diese jede eigene Reise
  -- zeigt.
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
  'Auslöser vor jeder Einfügung in public.trips: setzt created_at und updated_at, verlangt status = draft und begrenzt auf 60 neue Reisen je Konto und Stunde. Die Schranke zählt Neuanlagen: Ist (user_id, client_ref) schon belegt, entsteht keine Reise, und der Schreibvorgang läuft unbehindert in trips_client_ref_eindeutig – so bleibt der Retry von public.reise_anlegen() auch an der Grenze idempotent (ADR-0045, ADR-0048).';
