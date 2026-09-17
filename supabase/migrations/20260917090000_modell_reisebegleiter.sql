-- Jetnity V2 – Phase 1: Modellfunktion reisebegleiter
--
-- Der In-Trip-Assistant ist die dritte Modellfunktion. Sie bekommt bewusst
-- keinen eigenen Topf: 4/8/24/38 Aufrufe und 3.00 USD je Tag gelten weiterhin
-- für alle Funktionen gemeinsam. Ein zweites Kontingent wäre eine zweite Zusage
-- über dieselben Kosten, und zwei Zusagen über eine Summe sind keine.
--
-- `funktion` bleibt Text mit Prüfbedingung und kein Enum (ADR-0043): Ein
-- weiterer Wert ist damit diese Migration und kein Typwechsel.
--
-- Additiv: `reisevorschlag` und `reiseaenderung` bleiben unverändert zulässig.
-- Keine Änderung an RLS, Rechten, Reservierung, Preisen oder Deckeln.

alter table public.model_usage
  drop constraint model_usage_funktion_werte;

alter table public.model_usage
  add constraint model_usage_funktion_werte
  check (funktion in ('reisevorschlag', 'reiseaenderung', 'reisebegleiter'));

comment on column public.model_usage.funktion is
  'Welche Modellfunktion den Aufruf ausgelöst hat. reisevorschlag, reiseaenderung und reisebegleiter teilen Kontingent und Kostendeckel.';
