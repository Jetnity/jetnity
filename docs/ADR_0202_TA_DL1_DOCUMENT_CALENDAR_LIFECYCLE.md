# ADR-0202 – TA-DL1 Calendar-Date Document Lifecycle

**Datum:** 30. August 2026  
**Status:** Implementiert auf Draft-PR #227 / nicht gemergt / kein persistierter Status

## Entscheidung

Vorhandenes `expiresOn` wird nur als timezone-sicherer ISO-Kalendertag `YYYY-MM-DD` gegen einen expliziten Datumskontext ausgewertet.

1. Der Helper lebt unter `lib/traveller/dokument-lebenszyklus.ts`. Er erzeugt keinen zweiten Traveller-Wahrheitsraum und keine persistierte Lifecycle-Spalte.
2. Fehlende oder unlesbare Daten bleiben `unknown`. Ungültige Kalenderdaten werden nicht über `Date`-Rollover uminterpretiert.
3. Account Registry vergleicht nur gegen den Geräte-Kalendertag: `expiresOn < heute` → abgelaufen; am Referenztag noch nicht abgelaufen.
4. Trip Workspace vergleicht nur gegen `startDate`/`endDate`: vor Beginn; `start <= expiresOn < end` während der Reise; `expiresOn >= end` nicht vor Reiseende.
5. Mehrere Dokumente werden unabhängig ausgewertet. Es gibt keine Default-/Primary-/Preferred-/Chosen-Credential-Wahl und kein Ranking.
6. Die Texte behaupten keine Einreise-, Visum- oder Bordkarten-Zulässigkeit.

## Alternativen

1. Beliebiges „läuft bald ab in N Tagen“-Produktfenster – in diesem Slice verboten.
2. Persistierter Lifecycle-Status – unnötig und ausserhalb des Non-Scope.
3. UTC-`Date('YYYY-MM-DD')` – verschiebt westlich von UTC den Kalendertag.

## Konsequenzen

Darstellung bleibt derived. Ohne vollständigen Reisezeitraum gibt es keine volle Reise-Einordnung. Global continuity auf `main` bleibt Technical-Lead-owned bis Merge.
