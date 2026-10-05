# P2-TA-04 C1 – lokale Test-Evidence

Stand: 28. August 2026  
Author-Head vor Continuity-Stamp: `f46fae174d27d4ac9f71b3ee9a6434be42bc3954`

Writable DB-Tests liefen ausschliesslich gegen Supabase `develop`. Production wurde nicht beschrieben und erhielt keine Testdaten.

| Lauf | Ergebnis |
| --- | --- |
| Focused unit | 15/15 pass |
| `npm test` | 2387/2387 pass |
| `typecheck` | pass |
| `lint` | pass |
| `build` | pass |
| Hygiene (`dead`, `exports`, `deps`, `api-schutz`, `schema-bezug`) | pass |
| `db:rechte` | pass |
| `db:rls` | snapshot ok |
| `db:parallelitaet` | 11/11 pass |
| C1-Fälle `db:sicherheit` | 13/13 pass |
| `db:sicherheit` gesamt | 217/248; 31 vorbestehende Admin-AAL2-JWT-Lücken |

Historische/develop-only Author-Evidence: `20260828120000` in develop `schema_migrations`. Dieselbe C1-SQL. Diese Develop-Version nicht still umschreiben.

Kanonische Production-/Repo-Version: `20260828015304`. Production C1 ist vom Technical Lead unter der bestehenden Product-Owner-C1-Freigabe angewendet und live verifiziert. Dieser Review-Fix verändert Supabase nicht erneut.

Develop-Katalog nach Author-Apply: `party_loeschen.prosecdef=false`. Party- und Child-Limit-Trigger sind INSERT+UPDATE.
