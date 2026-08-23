# Jetnity – Active Work Status

Stand: 23. August 2026
Arbeitsblock: **Travel Timing & Seasonal Intelligence – provider-neutrale Foundation**

## 1. Arbeitsblock / Ziel

Eigene provider-neutrale Seasonal-Domäne. Unabhängiger Review hat vier Truth-Blocker benannt; Cursor hat sie geschlossen. Re-Review ist der nächste Schritt.

Verbindlicher Auftrag: `docs/CURSOR_TRAVEL_TIMING_SEASONAL_FOUNDATION_TASK.md`  
Review: `docs/PR38_CHATGPT_INDEPENDENT_REVIEW.md`  
Fixes: `docs/PR38_CURSOR_REVIEW_FIXES.md`

## 2. Branch / PR / aktueller Head

- Branch: `feat/travel-timing-seasonal-intelligence`
- Draft PR: https://github.com/Jetnity/jetnity/pull/38
- Basis: `origin/main` @ `cd220beb44d90ae376feeb8de9db8a3afb808d60`
- Runtime-Head der Review-Fixes: `89290effba61602a71418ab3904b4dc42e76709d`
- Docs-Head ist der Commit dieses Nachzugs
- Ahead/behind zum Runtime-Lock: **8 ahead, 0 behind** `origin/main`

## 3. Status

**Review-Fixes implementiert, Full Gate auf `89290eff` grün.** PR bleibt Draft. Kein Mark Ready, kein Merge. ChatGPT Re-Review der vier Blocker steht aus.

## 4. Bereits umgesetzt

- Foundation-Runtime plus die vier Review-Blocker
- `seasonalProviderAus()` bleibt `null`
- keine DB-Migration, keine Secrets, keine neuen Kosten

## 5. Gerade offen / noch nicht umgesetzt

- ChatGPT Re-Review der vier geschlossenen Blocker
- keine Merge-Freigabe
- kein echter Seasonal-Provider

## 6. Letzte relevanten Änderungen

Vier Truth-Fixes: Statusaggregation, strikte absolute Fenster, Fingerprint ohne `toFixed(4)`, strikte Provider-Normalisierung.

## 7. Tests / CI / Preview

Auf Runtime `89290eff`:

- `npm test` **1550/1550**
- Typecheck / Lint / Hygiene grün
- Production-Build Exit 0
- UI-Audit **1014/1014**, 0 Fehler
- DB: Rechte 51 OK, RLS Exit 0, Sicherheit **210/210**, Parallelität **7/7**
- GitHub Actions SUCCESS: https://github.com/Jetnity/jetnity/actions/runs/32639811262
- Vercel Preview READY: https://vercel.com/jetnity-e1b93c82/jetnity-app/8dvvtK3sWaKFQShZVJ7LdpJ3LRyx

## 8. DB / RLS / Production-Grenze

Unverändert: keine Seasonal-Tabelle, keine Migration.

## 9. Kosten / Provider / Secrets

Unverändert `null`.

## 10. Bekannte Risiken / Review-Funde

Die vier früheren Merge-Blocker sind geschlossen. Offene spätere Nähte bleiben: In-process Rate-Limit, keine persistierte Nutzerentscheidung, Account-Serverload, title-only Geo.

## 11. Offene Nutzerentscheidungen / Freigaben

Keine Merge-Freigabe.

## 12. Exakter nächster Schritt

Unabhängiger ChatGPT-Re-Review von Draft-PR #38, beschränkt auf die vier geschlossenen Blocker und das Stop-Kriterium im Review.

## 13. Welche Dateien zuerst gelesen werden müssen

1. `docs/PR38_CHATGPT_INDEPENDENT_REVIEW.md`
2. `docs/PR38_CURSOR_REVIEW_FIXES.md`
3. `docs/ACTIVE_WORK_STATUS.md`
4. `lib/seasonal/status.ts`
5. `lib/seasonal/fenster.ts`
6. `lib/seasonal/fingerprint.ts`
7. `lib/seasonal/normalisieren.ts`
