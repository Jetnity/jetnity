# Jetnity – AP-4 Account Archive Lifecycle – Author Self-Review

Stand: 27. August 2026  
Cursor-Agent: **`Account plattform audit vorbereitung 3`**  
Typ: adversarial Author-Review, **kein** unabhängiger Technical-Lead-PASS

## Scope-Treue

| Regel | Prüfung |
| --- | --- |
| Nur Konto-Reisen | Gast-UI/Speicher ohne Schreibweg |
| Datumsgruppen ohne archived | `kontoReisenSichten` filtert vor `reisenGruppenAus` |
| Eigener Archiv-Abschnitt | nur wenn mindestens eine archivierte Reise in der geladenen/sichtbaren Auswahl |
| Kein erfundenes Restore | `wiederherstellenPlan` verlangt exakt `draft`/`planned`/`booked` |
| Metadata-Keys erhalten | flacher Merge; Namespace nur `account_archive` |
| Bereits archived überschreibt Provenienz nicht | `archivierenPlan` → `bereits-archiviert` |
| Optimistic Guard | Update nur mit `.eq('status', expectedStatus)` |
| Unsichtbare UUID | Read `maybeSingle` → „unbekannt“, kein Existenzleak |
| Nicht angemeldet | `konto()` → `NICHT_ANGEMELDET` |
| Kein Service Role | kein privilegierter Client |
| Keine Migration / RLS / Auth / AAL | Diff enthält keine SQL-Policy und keine Auth-Datei |
| TW7-A unangetastet | `reiseOrte` / `stageCount` / `itemCount` / `stages` unverändert |
| Kein AP-7 / P2-TA-06 / Provider / Admin / Growth / TW-8 | nicht im Diff |

## Bewusst offene Risiken

- Historische `archived`-Zeilen ohne Provenienz bleiben sichtbar im Archiv, aber nicht wiederherstellbar.
- Die 200er-Grenze gilt weiter nur für die geladene Auswahl.
- Concurrent Metadata-Änderung bei gleichem Status kann den Guard nicht sehen; der Guard ist statusbasiert, wie beauftragt.
- Kein Browser-/Real-Device-Beweis in diesem Autor-Lauf.

## STOPP

Kein Ready. Kein Merge. Unabhängiger Technical-Lead-Review erforderlich.
