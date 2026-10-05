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
- volles `npm test` lokal nicht wiederholt; Exact-Head CI Run `33137160070` auf `8ead1a8f` **SUCCESS** (Typecheck/Lint/Build + Auth-Konfiguration)

## Exact-Head auf dem Stamp-Head `8ead1a8f`

- SHA: `8ead1a8f7e34c7d1745e358faed9705779ebe1fb`
- Actions: https://github.com/Jetnity/jetnity/actions/runs/33137160070 SUCCESS
- Jobs: Typecheck/Lint/Build SUCCESS; Auth-Konfiguration gegen config.toml SUCCESS
- Vercel Preview Inspector: `8h2J9vfjaCWSJVS6W4RcvLEHVowz` SUCCESS
- GitHub Preview-Deployment: `6134729753` success
- Preview-URL: `https://jetnity-410g8p2hu-jetnity-e1b93c82.vercel.app`

Historischer vorheriger Stamp-Head `5fff38bf` bleibt gültige Vor-Evidence (Actions `33136978825`, Vercel `DUGxaYrrx1NDjVLt5r1DahTEyacE`). Dieser Commit dokumentiert nur die erfolgreiche Re-Gate von `8ead1a8f`. Danach kein weiterer Evidence-Stamp, außer die CI dieses Commits fehlschlägt.

## Grenze

Kein Auth-Config-Write. Keine Migration. Keine Production-Daten.
