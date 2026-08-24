# Jetnity Account AP-3 – Status

Stand: 24. August 2026  
Status: **Current-Main-Sync und fail-closed 200-Hinweis lokal und remote gegatet – Draft, kein Ready, kein Merge, kein AP-4**

| Feld | Wert |
| --- | --- |
| Cursor-Anzeigename | **Account plattform audit vorbereitung** |
| Branch | `feat/account-ap3` |
| Draft-PR | https://github.com/Jetnity/jetnity/pull/53 |
| Base | `main` @ `e3bad749c8e03512001e7bccd5e08467f10a7134` |
| Auftrag | `docs/ACCOUNT_AP3_TASK.md` |
| **Gegateter Head** | `c1ccfb6e02ffbf3125dced304980d1c801c4c47c` |
| Runtime-Head (200-Hinweis) | `ef370965` |
| Entscheidung | ADR-0160 (nicht ADR-0158; das bleibt Admin Slice A) |
| Self-Review | `docs/ACCOUNT_AP3_SELF_REVIEW.md` |

## Technical-Lead-Nacharbeit 24. August 2026

Kommentar auf PR #53 verlangte zwei Punkte vor Technical Integration Closure:

1. Sauberer Sync auf aktuellen `main` `e3bad749` (Admin Slice B / PR #46). Merge-Base ist jetzt genau dieser Commit. Admin A+B und Provider/Account-Fakten bleiben erhalten.
2. Fail-closed 200er-Hinweis: höchstens 200 zuletzt geänderte Reisen werden geladen und angezeigt. Suche und Gruppen gelten nur für diese geladene Auswahl. Keine Behauptung, dass weitere Reisen existieren.

Kein zusätzlicher Scope. Kein AP-4. Keine Pagination-Architektur.

## Remote-Gates auf dem gegateten Head

Genau `c1ccfb6e02ffbf3125dced304980d1c801c4c47c`:

- GitHub Actions CI: **SUCCESS** – https://github.com/Jetnity/jetnity/actions/runs/32761572610
- Vercel Preview: **success / READY** – https://vercel.com/jetnity-e1b93c82/jetnity-app/ERFzEa9dMQHncNJ9shajiPQrcMzj
- Preview-URL: https://jetnity-71xpabzf1-jetnity-e1b93c82.vercel.app

Der Produktcode der 200-Korrektur liegt in `ef370965`. `c1ccfb6e` enthält diesen Runtime-Fix plus die Sync-Dokumentation. Ein späterer Docs-only-Commit ist kein neues Runtime-Gate.

Historischer Runtime-Head vor diesem Sync: `612d819ed9691f93cbab97128e301b0b7744721b`. Das ist kein aktuelles Exact-Head-Gate.

PR #53 bleibt Draft. Kein Mark Ready. Kein Merge.

## Lokale Gates auf dem gegateten Head

Genau `c1ccfb6e02ffbf3125dced304980d1c801c4c47c`:

- AP-3-Pflichttests inkl. fail-closed 200-Hinweis, Timezone-Grenze, Empty-Gruppe, undatiert ≠ vergangen: grün
- Guest→Account `uebernahme.test.ts`: grün
- `npm test`: 1856/1856 grün
- Typecheck, Lint, Hygiene (`check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`): grün
- `auth:pruefen` (55 Werte): grün
- Production-Build: grün

## Scope-Ergebnis

| Regel | Ergebnis |
| --- | --- |
| Gruppen | Aktiv / Kommend / Vergangen / Ohne Datum aus `startDate`/`endDate` |
| Kalendertag | Geräte-Kalendertag, gemeinsame Prädikate mit der Übersicht |
| Ohne Datum | niemals Vergangen |
| Empty-Gruppe | Text, kein `role=alert` |
| Error ≠ Empty | unverändert in `KontoReisen` |
| Limit 200 | fail-closed Hinweis, wenn die geladene Liste die Grenze erreicht |
| Suche | Titel und Herkunft, nur auf der geladenen Auswahl |
| Archiv | kein Write, kein Filter |
| Gast | unverändert `GastReisen` |

## Shared Contracts unverändert

Auth, RLS, `trips.status`, Guest→Account, Traveller, Privacy, Billing, Admin, Provider.

## Offene Risiken

- Bereits gespeichertes `archived` bleibt in der Datumsgruppe sichtbar; Archiv-UX ist AP-4.
- 200 ist last-updated, keine vollständige Inventur und kein Count.
- Erster Client-Paint ist ungruppiert, bis der Geräte-Kalendertag da ist.

## Nächster Account-Block nach Integration

AP-5 UI-/Security-Teile und AP-6a Legal. AP-4 / AP-6b / AP-7 / AP-8 / AP-12 brauchen Shared Gates.

## Nächster Schritt

Unabhängiger Technical-Lead-Re-Review von Draft-PR #53 auf `c1ccfb6e`.  
STOPP. Kein AP-4. Kein Mark Ready. Kein Merge.
