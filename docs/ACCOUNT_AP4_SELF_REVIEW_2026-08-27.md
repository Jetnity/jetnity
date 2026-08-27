# Jetnity – AP-4 Account Archive Lifecycle – Author Self-Review

Stand: 27. August 2026  
Cursor-Agent: **`Account plattform audit vorbereitung 3`**  
Typ: adversarial Author-Review, **kein** unabhängiger Technical-Lead-PASS  
Review-Fix-Stand nach P1-AP4-TL-01/02 und P2-AP4-TL-03; neuer Exact Head folgt nach Gates.  
Letzter gegateter Runtime-Head vor Review: `f19b5711e05282617d7c35262ebbfaeef4253e0d`  
Vorheriger PASS vor Follow-up: `954b0c751e5b662985119e26d0c49acbd9d0b82f`

## Scope-Treue

| Regel | Prüfung |
| --- | --- |
| Nur Konto-Reisen | Gast-UI/Speicher ohne Schreibweg |
| Datumsgruppen ohne archived | `kontoReisenSichten` filtert vor `reisenGruppenAus` |
| Eigener Archiv-Abschnitt | nur wenn mindestens eine sichtbare archivierte Reise existiert |
| Kein erfundenes Restore | `wiederherstellenPlan` verlangt exakt `draft`/`planned`/`booked` |
| Metadata-Keys erhalten | flacher Merge; Restore entfernt nur `previous_status`, Geschwister unter `account_archive` bleiben |
| Bereits archived überschreibt Provenienz nicht | `archivierenPlan` → `bereits-archiviert` |
| Optimistic Guard | Update mit `.eq('status', expectedStatus)` und `.eq('updated_at', gelesene Version)` |
| Keine erfundene `trips.metadata`-Grenze | kein `TRIPS_METADATA_MAX_ZEICHEN` / `metadata-zu-gross` |
| Unsichtbare UUID | Read `maybeSingle` → „unbekannt“, kein Existenzleak |
| Nicht angemeldet | `konto()` → `NICHT_ANGEMELDET` |
| Kein Service Role | kein privilegierter Client |
| Keine Migration / RLS / Auth / AAL | Diff enthält keine SQL-Policy und keine Auth-Datei |
| TW7-A unangetastet | `reiseOrte` / `stageCount` / `itemCount` / `stages` unverändert |
| Kein AP-7 / P2-TA-06 / Provider / Admin / Growth / TW-8 | nicht im Diff |
| Kartenlink ohne nested controls | Aktion liegt in `KontoReiseArchivAktion` ausserhalb von `Reisekarte` |

## Adversarial Findings

1. **Client-State nach `router.refresh()`** – gefunden und im Follow-up geschlossen. Dieselbe `key={reise.id}` würde `laeuft=true` behalten und den Knopf disabled lassen. Reset bei Statuswechsel und nach Erfolg.
2. **Concurrent Metadata bei gleichem Status** – geschlossen. Der Write matcht zusätzlich das gelesene `updated_at`; ein statusgleicher Zwischenstand wird nicht überschrieben.
3. **Historische `archived` ohne Provenienz** – ehrlich nicht wiederherstellbar, kein Default.
4. **200er-Grenze** – Filter/Gruppen/Archiv gelten nur für die geladene Auswahl.

## Exact-Head Evidence

Neue Exact-Head-Evidence für den Review-Fix-Head folgt nach lokalen Gates und GitHub/Vercel. Historisch:

- Actions `33108697812` SUCCESS auf `f19b5711`
- Vercel `BiQYRdySrHjnea8MmTbxqSomsCMQ` READY auf demselben SHA
- Vorheriger PASS `954b0c75` / Actions `33108364497` / Vercel `C6s9zyHZV9owevNEXH1Rie2t96rH`
- Review auf `e34d5829`: CHANGES REQUIRED (P1-AP4-TL-01/02, P2-AP4-TL-03)

## STOPP

Kein Ready. Kein Merge. Unabhängiger Technical-Lead-Review erforderlich.
