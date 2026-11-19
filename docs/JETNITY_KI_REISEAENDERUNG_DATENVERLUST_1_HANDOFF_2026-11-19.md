# KI-Reiseänderung Datenverlustschutz 1 — Handoff

**An:** unabhängiger Technical Lead
**Von:** Jetnity KI Datenverlustschutz 1, Generation 1
**Session:** https://cursor.com/agents/bc-8bcd33df-ceae-48b0-b81e-ee1de890e6f5
**Modell:** grok-4.7-high-fast
**Branch:** `fix/ki-reiseaenderung-datenverlust-1-20261119`
**PR:** #1252 · **Issue:** #1247
**Status:** `REVIEW_REQUIRED`
**Nicht tun:** Ready, Merge, Folgeslice, weiterer Agent.

## Exact head

Der Commit, der diese drei Dokumente und den Code zusammen enthält, ist der Head. CI gilt nur für genau diesen SHA. Die Lauf-URL wird im PR-Kommentar nachgetragen, ohne einen neuen Commit.

## Auftrag

Eine KI-Kürzung darf Aktivitäten, Notizen, Unterkünfte und Transfers nicht still löschen. Die Vorschau muss den Graphen zeigen und darf eine Nachtverschiebung nicht behaupten, wenn mehr betroffen ist.

## Änderung

| Datei | Warum |
| --- | --- |
| `lib/reiseaenderung/anwenden.ts` | Punkte bleiben ungeplant. Gemischtes `punkt_entfernen` fällt vorher. |
| `lib/reiseaenderung/diff.ts` | Graph-Vergleich: Etappentage, ungeplant, entfernt. |
| `lib/reiseaenderung/regeln.ts` | Das Modell soll Kürzung und Löschung nicht kombinieren und keine Nachtzahl erfinden. |
| `components/trips/AenderungVorschau.tsx` | Vorher/Nachher, ungeplant und Löschung getrennt, Umbruch, Fokusring. |
| `lib/reiseaenderung/datenverlust.test.ts` | Synthetischer Bangkok/Krabi-Graph, RED-Vertrag jetzt grün. |
| `lib/reiseaenderung/direct-trip-editing-1.test.ts` | Manuelle Etappenentfernung behält normale Punkte und Vorbereitungsbezüge. |

`lib/trips/gastspeicher.ts`, `aktionen.ts` ausser dem schon vorhandenen Aufruf, Schema, SQL und Workflows sind unverändert. Konto und Gast treffen dieselbe `operationenAnwenden`.

## Lokal geprüft

- `lib/reiseaenderung/*.test.ts` und `change-impact-foundation-v1/*.test.ts`: 195 bestanden, nachdem der Fix stand.
- Davor derselbe neue Test: 11 fehlgeschlagen, darunter die fünf verlorenen Bangkok-IDs und der Button „Änderung übernehmen“ über der Löschliste.
- `eslint` auf den geänderten Dateien: ohne Befund.
- `npm run typecheck`: erfolgreich.
- `npm run check:exports`: 0 Exporte ohne Aufrufer.
- `npm run build`: der zweite Lauf ist durchgelaufen. Der erste Stop war nur der Next.js-Sicherheitshinweis, kein Compile-Fehler. `package.json` bleibt unverändert. Next 16.4.1 meldet eine bekannte Advisory; das Upgrade liegt ausserhalb dieses Slices.

## Offen für den Review

1. Ob der manuelle Editor Punkte bei Etappenentfernung behalten soll. Das folgt aus der gemeinsamen Funktion. Ein getrennter Schalter wäre ein zweiter Vertrag.
2. Ob alleiniges `punkt_entfernen` ganz gesperrt werden soll. Dafür müsste der bestehende Positive-Test geändert werden. Hier ist es sichtbar und nur ohne Strukturänderung erlaubt.
3. Gehosteter Dev-Browser mit Konto und der echte Nächte-Satz bleiben ein späteres Gate. Dieser Lauf hat kein Modell und keine Production berührt.
