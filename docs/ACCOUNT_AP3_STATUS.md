# Jetnity Account AP-3 – Status

Stand: 24. August 2026  
Status: **implementiert, Gates folgen – Draft, kein Ready, kein Merge, kein AP-4**

| Feld | Wert |
| --- | --- |
| Cursor-Anzeigename | **Account plattform audit vorbereitung** |
| Branch | `feat/account-ap3` |
| Base | `main` @ `1ec93cc9f6d70bd57ea054463e4ba8e3822a2267` |
| Auftrag | `docs/ACCOUNT_AP3_TASK.md` |
| Entscheidung | ADR-0158 |

## Scope-Ergebnis

| Regel | Ergebnis |
| --- | --- |
| Gruppen | Aktiv / Kommend / Vergangen / Ohne Datum aus `startDate`/`endDate` |
| Kalendertag | Geräte-Kalendertag, gleiche Prädikate wie die Übersicht |
| Ohne Datum | niemals Vergangen |
| Empty-Gruppe | Text, kein `role=alert` |
| Error ≠ Empty | unverändert in `KontoReisen` |
| Limit 200 | Hinweis, wenn `reisen.length >= 200` |
| Suche | Titel und Herkunft, optional |
| Archiv | kein Write, kein Filter |
| Gast | unverändert `GastReisen` |

## Nicht enthalten

Keine Migration, keine RLS, kein Auth-Contract, keine Traveller-Registry, keine Guest→Account-Änderung, kein AP-4, keine Citizenship-Defaults, keine Provider-/Secret-/Kosten-Aktivierung.

## Nächster Schritt

Lokale und Remote Exact-Head-Gates, danach STOPP für Technical-Lead-Review.
