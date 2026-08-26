# Jetnity Account Platform – AP-3 Handoff

Stand: 24. August 2026  
Status: **HISTORICAL HANDOFF. AP-3 ist auf `main` integriert (PR #53). Nicht der aktuelle operative Stand.**

> Kanonisch: `JETNITY_HANDOFF.md` und `docs/CHATGPT_FINAL_CONTINUITY_HANDOFF_CHECKPOINT_2026-08-26.md`.

| Feld | Wert |
| --- | --- |
| Cursor-Anzeigename | **Account plattform audit vorbereitung** |
| Branch | `feat/account-ap3` |
| Base | `main` @ `78192ab775165d08bb357140c2d04b865b8cc049` |
| Auftrag | `docs/ACCOUNT_AP3_TASK.md` |
| Draft-PR | https://github.com/Jetnity/jetnity/pull/53 |
| Status | `docs/ACCOUNT_AP3_STATUS.md` |
| Self-Review | `docs/ACCOUNT_AP3_SELF_REVIEW.md` |
| Gegateter Head | `c5e4a51feff80b94b9bb9b153ee5211d49fa4375` |
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

Der 200er-Hinweis bleibt fail-closed: höchstens 200 zuletzt geänderte Reisen werden geladen und angezeigt; Suche und Gruppen gelten nur für diese geladene Auswahl.

## Shared Contracts unverändert

Auth, RLS, `trips.status`, Guest→Account, Traveller, Privacy, Billing, Admin, Provider. Admin Slice C / ADR-0162 auf `main` `78192ab` bleibt erhalten.

## Offene Risiken

- Bereits gespeichertes `archived` bleibt in der Datumsgruppe sichtbar; Archiv-UX ist AP-4.
- 200 ist last-updated, keine vollständige Inventur.
- Gruppen erscheinen nach dem Geräte-Kalendertag; der erste Paint ist ungruppiert.

## Runtime-Nachweis

Genau `c5e4a51feff80b94b9bb9b153ee5211d49fa4375`:

- GitHub Actions **SUCCESS** (`32766099353`)
- Vercel **success / READY** (`62QioKqqL8rwXBHmxLrnXFqAck7j`)
- Preview: https://jetnity-f4zxs1cp6-jetnity-e1b93c82.vercel.app

Ein späterer Docs-only-Commit ist kein neues Runtime-Gate.

## Nächster Schritt

Unabhängiger Technical-Lead Docs-Re-Check von Draft-PR #53. Runtime bleibt `c5e4a51f`. Kein AP-4. Kein Ready. Kein Merge. Nach Account-Integration folgt Provider #54, nicht TW-1.
