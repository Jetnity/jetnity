-- Jetnity V2 – Phase 1.4: die drei überzähligen Admin-Autoritäten entfernen
--
-- Reihenfolge: 20260817100000 hat die Rollen der Betroffenen übernommen,
-- 20260817100100 hat sämtliche Policies auf `creator_profiles.role` umgestellt.
-- Erst danach lässt sich das Übrige entfernen, ohne jemandem den Zugang zu
-- nehmen und ohne eine Policy ins Leere laufen zu lassen.
--
-- `admin_domains` – Eine E-Mail-Domain hat mit ADR-0027 keine Berechtigung mehr
-- zu erteilen. Die Tabelle beschreibt genau das Gegenteil. Geprüft vor dem
-- Entfernen: kein Fremdschlüssel zeigt darauf (`pg_constraint`), keine Stelle
-- im Anwendungscode spricht sie an (`npm run db:verwendung`), und sie enthält
-- auf dem Development-Branch keine Zeilen.
--
-- `app_admins` – Zweite Mitgliederliste neben der Rolle. Sie entschied über die
-- Policies auf `creator_profiles`, war der Anwendung aber unbekannt: Ein
-- Eintrag dort verschaffte Zugriff auf alle Profile, ohne dass die Oberfläche
-- das Konto als Administrator geführt hätte. Ebenfalls ohne Fremdschlüssel,
-- ohne Verwendung im Code und ohne Zeilen.
--
-- `creator_profiles.is_admin` – Dritte Fassung derselben Aussage, ausgewertet
-- von `is_admin(uuid)`. Ein Konto konnte `role = 'user'` und `is_admin = true`
-- tragen; welche der beiden Angaben galt, hing davon ab, wer fragte.

drop table if exists public.admin_domains;
drop table if exists public.app_admins;

drop function if exists public.is_admin(uuid);

alter table public.creator_profiles drop column if exists is_admin;
