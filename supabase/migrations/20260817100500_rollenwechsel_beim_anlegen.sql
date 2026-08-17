-- Jetnity V2 – Phase 1.4: Rechteausweitung auch beim Anlegen verhindern
--
-- 20260817100100 sichert den Rollenwechsel beim Ändern ab. Der Weg über das
-- Anlegen blieb offen: Die Policy `profile_eigenes_anlegen` prüft nur, dass die
-- Zeile dem eigenen Konto gehört. Ein frisch registriertes Konto ohne Profil
-- konnte sich damit sein erstes Profil mit `role = 'owner'` ausstellen.
--
-- Gemessen wurde das an einem Konto, das bereits ein Profil hatte; dort
-- scheiterte der Versuch nur an der Eindeutigkeitsbedingung auf `user_id`
-- (23505), nicht an einer Regel. Ohne bestehendes Profil hätte er gegriffen.
--
-- Der Auslöser deckt jetzt beide Wege ab. Für das Anlegen gilt:
--
--   · Wer sich selbst ein Profil ausstellt, bekommt `user` und `active`.
--     Alles andere wird abgelehnt statt stillschweigend überschrieben – wer
--     eine Rolle mitschickt, meint etwas, das hier nicht gilt.
--   · Wer ein Profil für ein anderes Konto anlegt, braucht mindestens
--     `moderator` und muss die vergebene Rolle echt überragen. Dieselbe Regel
--     wie beim Ändern.
--
-- Ohne angemeldetes Konto greift der Auslöser weiterhin nicht: Dann stammt die
-- Zeile aus einem Kontext mit BYPASSRLS, den keine Policy erreicht.

create or replace function public.creator_profiles_rollenwechsel_pruefen()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  handelnder uuid := (select auth.uid());
  rang_handelnder integer;
begin
  if handelnder is null then
    return new;
  end if;

  rang_handelnder := public.rollenrang(public.aktuelle_rolle());

  if tg_op = 'INSERT' then
    if new.user_id = handelnder then
      if new.role is distinct from 'user' then
        raise exception 'Ein neues eigenes Profil erhält immer die Rolle user.'
          using errcode = 'check_violation';
      end if;
      if new.status is distinct from 'active' then
        raise exception 'Ein neues eigenes Profil erhält immer den Status active.'
          using errcode = 'check_violation';
      end if;
      return new;
    end if;

    if rang_handelnder is null or rang_handelnder < public.rollenrang('moderator') then
      raise exception 'Keine Berechtigung, Profile für andere Konten anzulegen.'
        using errcode = 'insufficient_privilege';
    end if;
    if rang_handelnder < public.rollenrang('owner')
       and rang_handelnder <= coalesce(public.rollenrang(new.role), -1) then
      raise exception 'Diese Rolle liegt nicht unterhalb der eigenen.'
        using errcode = 'insufficient_privilege';
    end if;

    return new;
  end if;

  if new.role is distinct from old.role then
    if old.user_id = handelnder then
      raise exception 'Die eigene Rolle lässt sich nicht ändern.'
        using errcode = 'check_violation';
    end if;
    if rang_handelnder is null or rang_handelnder < public.rollenrang('moderator') then
      raise exception 'Keine Berechtigung, Rollen zu vergeben.'
        using errcode = 'insufficient_privilege';
    end if;
    if rang_handelnder < public.rollenrang('owner')
       and (rang_handelnder <= coalesce(public.rollenrang(old.role), -1)
            or rang_handelnder <= coalesce(public.rollenrang(new.role), -1)) then
      raise exception 'Diese Rolle liegt nicht unterhalb der eigenen.'
        using errcode = 'insufficient_privilege';
    end if;
  end if;

  if new.status is distinct from old.status then
    if old.user_id = handelnder then
      raise exception 'Der eigene Kontostatus lässt sich nicht ändern.'
        using errcode = 'check_violation';
    end if;
    if rang_handelnder is null or rang_handelnder < public.rollenrang('moderator') then
      raise exception 'Keine Berechtigung, den Kontostatus zu ändern.'
        using errcode = 'insufficient_privilege';
    end if;
  end if;

  return new;
end
$$;

comment on function public.creator_profiles_rollenwechsel_pruefen() is
  'Verhindert Rechteausweitung beim Anlegen und Ändern eines Profils. Entspricht canAssignRole() in lib/auth/roles.ts.';

drop trigger if exists creator_profiles_rollenwechsel on public.creator_profiles;

create trigger creator_profiles_rollenwechsel
  before insert or update on public.creator_profiles
  for each row execute function public.creator_profiles_rollenwechsel_pruefen();
