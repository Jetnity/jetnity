# Jetnity – AP-5 Gate 0 Local Test Evidence

Stand: 28. August 2026  
Branch: `cursor/ap5-gate0-auth-session-mfa-79f9`  
Draft-PR: #129

## Read-only runs

| Lauf | Ergebnis |
| --- | --- |
| `npm run auth:pruefen` | sauber: 55 erwartete Werte, 242 Schlüssel, kein ungenannter Provider/Hook, Passwortregel entspricht `config.toml` |
| `node --import tsx --test lib/auth/ap5-gate0-contract-inventory.test.ts` | 8/8 pass |
| Focused Auth/Account-Unit (Inventory + `auth-erwartung` + Passwort + `next` + Register + MFA-A11y + Account-Nav + Anmelde-Gatter) | 84/84 pass |

## Nicht gelaufen

- `auth:fluesse` – schreibt ein Wegwerfkonto
- `auth:anwenden` – würde Config pushen
- Browser / Real-Device
- Production-Auth-Config-Abgleich (AUTH.md Parent-Spalte bleibt Evidence vom 17. August 2026)
- volles `npm test` lokal nicht wiederholt; Exact-Head CI Run `33136978825` auf `5fff38bf` **SUCCESS** (Typecheck/Lint/Build + Auth-Konfiguration)

## Exact-Head vor Stamp

- SHA: `5fff38bf9cd4a43cb708f55b2fa1945c6b8cee4b`
- Actions: https://github.com/Jetnity/jetnity/actions/runs/33136978825 SUCCESS
- Vercel Preview: `DUGxaYrrx1NDjVLt5r1DahTEyacE` SUCCESS

## Grenze

Kein Auth-Config-Write. Keine Migration. Keine Production-Daten.
