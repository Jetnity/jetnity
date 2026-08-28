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
- volles `npm test` / Production-Build – Docs-plus-Inventory-Slice; Exact-Head-CI trägt den Rest

## Grenze

Kein Auth-Config-Write. Keine Migration. Keine Production-Daten.
