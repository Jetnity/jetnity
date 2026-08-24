# Jetnity Account Platform – AP-3 Handoff

Stand: 24. August 2026  
Status: **auf `main` `e3bad749` synchronisiert; 200er-Hinweis fail-closed; Exact-Head `c1ccfb6e` gegatet; Draft, wartet auf Technical-Lead-Re-Review; kein Mark Ready, kein Merge**

| Feld | Wert |
| --- | --- |
| Cursor-Anzeigename | **Account plattform audit vorbereitung** |
| Branch | `feat/account-ap3` |
| Base | `main` @ `e3bad749c8e03512001e7bccd5e08467f10a7134` |
| Auftrag | `docs/ACCOUNT_AP3_TASK.md` |
| Draft-PR | https://github.com/Jetnity/jetnity/pull/53 |
| Gegateter Head | `c1ccfb6e02ffbf3125dced304980d1c801c4c47c` |
| Runtime-Head (200-Hinweis) | `ef370965` |
| Status | `docs/ACCOUNT_AP3_STATUS.md` |
| Self-Review | `docs/ACCOUNT_AP3_SELF_REVIEW.md` |
| Entscheidung | ADR-0160 |

## Was ein neuer Agent zuerst liest

1. `docs/ACCOUNT_AP3_TASK.md`
2. `docs/ACCOUNT_AP3_STATUS.md`
3. `lib/account/reise-lage.ts`
4. `components/trips/KontoReisenGruppen.tsx`
5. `app/(public)/reisen/page.tsx`
6. ADR-0153 und ADR-0160

## Produktstand

Kontoreisen auf `/reisen` liegen in vier ableitenden Gruppen. Die Lage teilt sich die date-only-Prädikate mit der Account-Übersicht. Gast bleibt ein lokaler Entwurf ohne Gruppen.

Der 200er-Hinweis behauptet nicht, dass weitere Reisen gespeichert sind. Er sagt nur: höchstens 200 zuletzt geänderte Reisen werden geladen und angezeigt; Suche und Gruppen gelten nur für diese geladene Auswahl.

## Shared Contracts unverändert

Auth, RLS, `trips.status`, Guest→Account, Traveller, Privacy, Billing, Admin, Provider.

## Runtime-Nachweis

Genau `c1ccfb6e02ffbf3125dced304980d1c801c4c47c`:

- GitHub Actions **SUCCESS** (`32761572610`)
- Vercel **success / READY** (`ERFzEa9dMQHncNJ9shajiPQrcMzj`)
- Preview: https://jetnity-71xpabzf1-jetnity-e1b93c82.vercel.app

Produktcode der 200-Korrektur: `ef370965`. Ein späterer Docs-only-Commit ist kein neues Runtime-Gate.

## Offene Risiken

- Bereits gespeichertes `archived` bleibt in der Datumsgruppe sichtbar; Archiv-UX ist AP-4.
- 200 ist last-updated, keine vollständige Inventur.
- Gruppen erscheinen nach dem Geräte-Kalendertag; der erste Paint ist ungruppiert.

## Nächster Account-Block nach Integration

Gemäß Audit: AP-5 UI-/Security-Teile und AP-6a Legal. AP-4 / AP-6b / AP-7 / AP-8 / AP-12 brauchen Shared Gates. AP-3 beendet das Account-Programm nicht.

## Nächster Schritt

Unabhängiger Technical-Lead-Re-Review von Draft-PR #53 auf `c1ccfb6e`. Kein AP-4. Kein Ready. Kein Merge.
