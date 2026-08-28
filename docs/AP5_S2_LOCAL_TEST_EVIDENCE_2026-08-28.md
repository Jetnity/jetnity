# Jetnity – AP-5-S2 lokale Test-Evidence

Stand: 28. August 2026  
Branch: `cursor/ap5-s2-password-reauth-82e4`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/137

| Lauf | Ergebnis |
| --- | --- |
| Focused S2 + Gate-0 + S1 + Nav + MFA-A11y + Richtlinie | pass |
| `npm test` | **2437/2437 pass** |
| `npm run typecheck` | pass |
| `npm run lint` | pass, keine Warnings |
| `npm run check:exports` | 674 Dateien, 0 unbegründete Exporte |
| `npm run check:dead` | nur begründete CookieConsent-Ausnahme |
| `npm run auth:pruefen` | 55/55 Sollwerte, 242 Schlüssel, Passwortregel = config.toml |
| `npm run build` | Production-Build erfolgreich; `/account/security` dynamisch |
| Browser / Real-Device | nicht gelaufen, nicht behauptet |

Exact-Head GitHub Actions und Vercel Preview müssen auf dem finalen Head live gelesen werden.
