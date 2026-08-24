# Jetnity Account Platform – AP-3 Handoff

Stand: 24. August 2026  
Status: **AP-3 implementiert auf `feat/account-ap3` – Draft, kein Mark Ready, kein Merge**

| Feld | Wert |
| --- | --- |
| Cursor-Anzeigename | **Account plattform audit vorbereitung** |
| Agent | https://cursor.com/agents/bc-01a030a0-d97f-782b-8bd0-acb906563518 |
| Branch | `feat/account-ap3` |
| Base | `main` @ `1ec93cc9f6d70bd57ea054463e4ba8e3822a2267` |
| Auftrag | `docs/ACCOUNT_AP3_TASK.md` |
| Status | `docs/ACCOUNT_AP3_STATUS.md` |
| Entscheidung | ADR-0158 |

## Was ein neuer Agent zuerst liest

1. `docs/ACCOUNT_AP3_TASK.md`
2. `docs/ACCOUNT_AP3_STATUS.md`
3. `lib/account/reise-lage.ts`
4. `app/(public)/reisen/page.tsx`
5. ADR-0153 und ADR-0158

## Produktstand

Kontoreisen auf `/reisen` liegen in vier ableitenden Gruppen. Die Lage teilt sich die date-only-Prädikate mit der Account-Übersicht. Gast bleibt ein lokaler Entwurf ohne Gruppen.

## Shared Contracts unverändert

Auth, RLS, `trips.status`, Guest→Account, Traveller, Privacy, Billing, Admin, Provider.

## Offene Risiken

- Bereits gespeichertes `archived` bleibt in der Datumsgruppe sichtbar; Archiv-UX ist AP-4.
- 200 ist last-updated, keine vollständige Inventur.
- Gruppen erscheinen nach dem Geräte-Kalendertag; der erste Paint ist ungruppiert.
- `docs/ACCOUNT_ADMIN_SHARED_CONTRACT_DECISIONS.md` und `docs/DOMAIN_PROGRAM_COMPLETION_POLICY.md` liegen nicht auf diesem `main`.

## Nächster Account-Block nach Integration

Gemäß Audit: AP-5 UI-/Security-Teile und AP-6a Legal. AP-4 / AP-6b / AP-7 / AP-8 / AP-12 brauchen Shared Gates. AP-3 beendet das Account-Programm nicht.
