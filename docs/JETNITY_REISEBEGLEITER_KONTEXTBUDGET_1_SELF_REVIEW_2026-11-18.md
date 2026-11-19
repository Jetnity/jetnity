# Reisebegleiter Kontextbudget 1 — Self-Review

**Stand:** 18.11.2026 · **Autor:** Jetnity Reisebegleiter Kontextbudget 1, Generation 1  
**Head:** der Commit dieses Dokuments auf `fix/reisebegleiter-kontextbudget-1-20261118`  
**Session:** https://cursor.com/agents/bc-f7678c37-fe48-4c1d-bc93-5c7bf6190145 · `grok-4.7-high-fast`  
**Urteil des Autors:** `REVIEW_REQUIRED`. Das ist kein unabhängiger Technical-Lead-PASS.

## Was geprüft wurde

Der Defekt ist der bestehende 24'000-Zeichen-Guard, nicht ein OpenAI-, Login- oder Quota-Ausfall. Die synthetische 7-Tage-/2-Etappen-Reise mit zwei Reisenden und je zwei gleichrangigen Dokumentoptionen erzeugt über `requirementsLokalFuerReise` 128 Official-Lagen. Vorher 76 789 Zeichen Systemregeln plus Frage, nachher 15 160. Die breite Statusvariante liegt bei 17 257. Beide bleiben unter 24 000. 128 Zeilen, 16 Typen und 4 Optionskennungen bleiben vorhanden.

`assistantTruthContextProjizieren()`, `auskunftPruefen()`, die Kataloge und `schema.ts` sind unverändert. `BEGLEITER_GRENZEN.eingabeZeichen` ist 24 000, `ausgabeTokens` ist 1 600. Die Reissleine läuft über die kompakte Nutzlast: eine E-Mail im Etappennamen und ein Behörden-Link werden vor der Reservierung abgefangen beziehungsweise entfernt. Feindlicher Etappentext bleibt ein JSON-Wert.

## Was dieses Review nicht ist

- kein Exact-Head-PASS
- kein Hosted-Login und kein bezahlter Preview-Aufruf
- keine Aussage, dass jetnity.com oder die isolierte KI-Dev-Vorschau diesen Branch schon ausliefert
- keine Freigabe, die Zeichengrenze, die Reservierung oder die Official-Truth-Erzeugung zu ändern

## Risiken für den Reviewer

1. Official-Zeilen sind Spalten, kein Objekt je Lage. Die Spaltenreihenfolge steht in `official.felder` und in den Systemregeln. Eine falsch gelesene Spalte kann nur eine ungültige Auswahl erzeugen. `auskunftPruefen()` verwirft sie. Ein amtlicher Satz kann daraus nicht entstehen, weil das Ausgabeschema kein Textfeld hat.
2. Lagen mit demselben Prüfstand teilen sich `stand`. Sie teilen sich nicht `ref`, Typ, Person oder Option. Ein Trip, in dem fast jede der 128 Lagen einen eigenen langen Prüfstand trägt, kann weiterhin über 24 000 Zeichen liegen und wird dann ehrlich abgelehnt. 4 000 Etappen tun das schon.
3. Die interne `optionRef` steht nicht mehr im Modellkontext. An ihrer Stelle steht `kennung` (`K1`…). Staatsangehörigkeiten, Ausstellungsland und Ablaufdatum bleiben an der Option. Die Projektion selbst behält `optionRef`.
4. Abwesende optionale Standfelder bedeuten `null`, abwesende `missingFacts` bedeuten keine fehlenden Angaben. Der Wert `unknown` bleibt gesetzt und wird nicht mit Abwesenheit gleichgesetzt.

## Empfehlung

Technical Lead prüft den exakten Head, die CI dieses Heads und die Längenbelege. Ready und Merge bleiben dort.
