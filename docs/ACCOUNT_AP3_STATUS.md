# Jetnity Account AP-3 – Status

Stand: 24. August 2026  
Status: **lokal und remote gegatet – Draft, kein Ready, kein Merge, kein AP-4**

| Feld | Wert |
| --- | --- |
| Cursor-Anzeigename | **Account plattform audit vorbereitung** |
| Branch | `feat/account-ap3` |
| Draft-PR | https://github.com/Jetnity/jetnity/pull/53 |
| Base | `main` @ `1ec93cc9f6d70bd57ea054463e4ba8e3822a2267` |
| Auftrag | `docs/ACCOUNT_AP3_TASK.md` |
| **Runtime-Head** | `612d819ed9691f93cbab97128e301b0b7744721b` |
| Entscheidung | ADR-0160 (nicht ADR-0158; das bleibt Admin Slice A) |
| Self-Review | `docs/ACCOUNT_AP3_SELF_REVIEW.md` |

## Remote-Gates auf dem Runtime-Head

Genau `612d819ed9691f93cbab97128e301b0b7744721b`:

- GitHub Actions CI: **SUCCESS** – https://github.com/Jetnity/jetnity/actions/runs/32750420663
- Vercel Preview: **success / completed** – https://vercel.com/jetnity-e1b93c82/jetnity-app/ChAxmb8ygS6NjwT5PrCNmSUo7wi7
- Preview-URL: https://jetnity-isvjotl2a-jetnity-e1b93c82.vercel.app

Ein nachfolgender Docs-only-Commit ist **kein** neues Runtime-Gate.

PR #53 bleibt Draft. Kein Mark Ready. Kein Merge.

## Lokale Gates auf dem Runtime-Head

- AP-3-Pflichttests inkl. Timezone-Grenze, Empty-Gruppe, undatiert ≠ vergangen: grün
- Guest→Account `uebernahme.test.ts`: grün
- `npm test`: 1842/1842 grün
- Typecheck, Lint, Hygiene, `auth:pruefen` (55 Werte): grün
- Production-Build: grün

## Scope-Ergebnis

| Regel | Ergebnis |
| --- | --- |
| Gruppen | Aktiv / Kommend / Vergangen / Ohne Datum aus `startDate`/`endDate` |
| Kalendertag | Geräte-Kalendertag, gemeinsame Prädikate mit der Übersicht |
| Ohne Datum | niemals Vergangen |
| Empty-Gruppe | Text, kein `role=alert` |
| Error ≠ Empty | unverändert in `KontoReisen` |
| Limit 200 | Hinweis, wenn die geladene Liste voll ist |
| Suche | Titel und Herkunft |
| Archiv | kein Write, kein Filter |
| Gast | unverändert `GastReisen` |

## Shared Contracts unverändert

Auth, RLS, `trips.status`, Guest→Account, Traveller, Privacy, Billing, Admin, Provider.

## Offene Risiken

- Bereits gespeichertes `archived` bleibt in der Datumsgruppe sichtbar; Archiv-UX ist AP-4.
- 200 ist last-updated, keine vollständige Inventur.
- Erster Client-Paint ist ungruppiert, bis der Geräte-Kalendertag da ist.
- Preview remote success, nicht zusätzlich manuell im Browser abgeklickt.
- `docs/ACCOUNT_ADMIN_SHARED_CONTRACT_DECISIONS.md` und `docs/DOMAIN_PROGRAM_COMPLETION_POLICY.md` liegen nicht auf diesem `main`.

## Nächster Account-Block nach Integration

AP-5 UI-/Security-Teile und AP-6a Legal. AP-4 / AP-6b / AP-7 / AP-8 / AP-12 brauchen Shared Gates.

## Nächster Schritt

Unabhängiger Technical-Lead-Review von Draft-PR #53 auf `612d819e`.  
STOPP. Kein AP-4. Kein Mark Ready. Kein Merge.
