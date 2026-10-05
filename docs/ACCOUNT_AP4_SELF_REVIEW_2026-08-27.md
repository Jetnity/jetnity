# Jetnity – AP-4 Account Archive Lifecycle – Author Self-Review

Stand: 27. August 2026  
Cursor-Agent: **`Account plattform audit vorbereitung 3`**  
Typ: adversarial Author-Review, **kein** unabhängiger Technical-Lead-PASS  
Technical-Lead Final Re-Review: **PASS**. PR #108 ist gemergt.  
Merge-Commit: `70cac163a79c3cd4098a72a0df241eb75c47738f`  
Gegateter Exact Head: `88146dd57146515fe9e78417ecb36a93ca311c36`

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

- Technical-Lead PASS auf `88146dd5`; Actions `33110989276` SUCCESS; Vercel `3PTcb1RcStZT12RXiHffXghKa6tf` READY
- Merge auf `main`: `70cac163`
- Post-Merge Actions `33111852882` SUCCESS; Vercel `8bvcVH5kCvSFhauw6QooL4xPvuwW` / Deployment `6130217634`
- Review-Fix-Head `d9e35bb6` / Actions `33110692991` / Vercel `2EtoM6gGvaEpJwWhFRGj25S8X42F`
- Historisch: `f19b5711` / Actions `33108697812` / Vercel `BiQYRdySrHjnea8MmTbxqSomsCMQ`

## STOPP

Slice geschlossen durch Technical-Lead PASS + Merge. Dieses Self-Review bleibt Author-Evidence, kein zweites Review. Kein automatischer Folgeslice.
