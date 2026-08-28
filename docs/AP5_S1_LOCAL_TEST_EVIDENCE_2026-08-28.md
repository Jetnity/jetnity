# Jetnity – AP-5-S1 lokale und Exact-Head-Evidence

Stand: 28. August 2026  
Head vor diesem Stamp: `55392fdae602c993f4382a67a0098ae5e62f5c51`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/133

## Lokal

- S1-Unit + UI-Semantik + Gate-0-Inventory + Account-Nav + MFA-A11y + Auth-Allowlist/Erwartung: **72/72 pass**
- `tsc --noEmit`: pass
- `next lint`: pass
- `check:exports`: 0 unbegründete Exporte
- `check:dead`: nur die bestehende CookieConsent-Ausnahme

Nicht gelaufen und nicht behauptet: Browser / Real-Device, `auth:fluesse`, Production-Build in dieser Session (CI-Build auf Exact-Head).

## Exact-Head auf `55392fda`

- GitHub Actions Run `33163350129`: **SUCCESS**
- Typecheck, Lint & Build: SUCCESS
- Auth-Konfiguration gegen config.toml: SUCCESS
- Vercel Preview Inspector `BviA8yxrA2h3WjzDBcfMRSZbd2hH`: **SUCCESS**
- GitHub Preview-Deployment `6139587003`: success
- Preview-URL zum Zeitpunkt der Evidence: `https://jetnity-iy870dtp9-jetnity-e1b93c82.vercel.app`

Dieser Stamp erzeugt einen neueren Head. Dessen Gates live neu lesen.