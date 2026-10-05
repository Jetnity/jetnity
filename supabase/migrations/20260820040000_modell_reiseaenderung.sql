-- Jetnity V2 – Phase 2.2: Modellfunktion reiseaenderung
--
-- Dieselbe Kostenschranke wie reisevorschlag. Es gibt keinen zweiten Topf:
-- 4/8/24/38 Aufrufe und 3.00 USD je Tag gelten für beide Funktionen gemeinsam.
-- `funktion` ist nur die Bezeichnung in public.model_usage.

alter table public.model_usage
  drop constraint model_usage_funktion_werte;

alter table public.model_usage
  add constraint model_usage_funktion_werte
  check (funktion in ('reisevorschlag', 'reiseaenderung'));

comment on column public.model_usage.funktion is
  'Welche Modellfunktion den Aufruf ausgelöst hat. reisevorschlag und reiseaenderung teilen Kontingent und Kostendeckel.';
