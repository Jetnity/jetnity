# Jetnity – AP-4 Account Archive Lifecycle – Author Self-Review

Stand: 27. August 2026  
Cursor-Agent: **`Account plattform audit vorbereitung 3`**  
Typ: adversarial Author-Review, **kein** unabhängiger Technical-Lead-PASS  
Gegateter Review-Head vor Follow-up: `954b0c751e5b662985119e26d0c49acbd9d0b82f`

## Scope-Treue

| Regel | Prüfung |
| --- | --- |
| Nur Konto-Reisen | Gast-UI/Speicher ohne Schreibweg |
| Datumsgruppen ohne archived | `kontoReisenSichten` filtert vor `reisenGruppenAus` |
| Eigener Archiv-Abschnitt | nur wenn mindestens eine sichtbare archivierte Reise existiert |
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
| Kartenlink ohne nested controls | Aktion liegt in `KontoReiseArchivAktion` ausserhalb von `Reisekarte` |

## Adversarial Findings

1. **Client-State nach `router.refresh()`** – gefunden und im Follow-up geschlossen. Dieselbe `key={reise.id}` würde `laeuft=true` behalten und den Knopf disabled lassen. Reset bei Statuswechsel und nach Erfolg.
2. **Concurrent Metadata bei gleichem Status** – bewusst offen. Der beauftragte Guard ist statusbasiert, nicht metadata-basiert.
3. **Historische `archived` ohne Provenienz** – ehrlich nicht wiederherstellbar, kein Default.
4. **200er-Grenze** – Filter/Gruppen/Archiv gelten nur für die geladene Auswahl.

## Exact-Head Evidence vor Follow-up

- Actions `33108364497` SUCCESS auf `954b0c75`
- Vercel `C6s9zyHZV9owevNEXH1Rie2t96rH` READY auf demselben SHA
- Review-Threads: 0

## STOPP

Kein Ready. Kein Merge. Unabhängiger Technical-Lead-Review erforderlich.
