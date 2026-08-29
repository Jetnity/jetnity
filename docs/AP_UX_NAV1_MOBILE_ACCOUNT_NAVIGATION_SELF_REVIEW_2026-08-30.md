# Jetnity – AP-UX-NAV1 Mobile Account Navigation Rail Self-Review

Stand: 30. August 2026  
Autor-Agent: **`Cursor-Agent: Account plattform audit vorbereitung 20`**  
Typ: adversarial Self-Review, **kein** unabhängiger Technical-Lead-PASS

## 1. Auftrag gegen Diff

Auftrag: AP-UX-NAV1 auf Draft-PR #229, Task `docs/AP_UX_NAV1_MOBILE_ACCOUNT_NAVIGATION_RAIL_TASK_2026-08-30.md`.

Baseline: `main @ 0ac7296fbd9e348b05a30b4c43cd5fe1815e24d9` (0 behind zum Slice-Start).

Geprüft gegen den tatsächlichen Dateisatz, nicht gegen Chat-Absicht.

## 2. Adversarial Fragen

| Frage | Ergebnis |
| --- | --- |
| Wurde eine Route migriert oder umgeleitet? | Nein. `/reisen` bleibt `/reisen`. |
| Zweite Auth-Wahrheit / `getSession` / Browser-Client? | Nein. Eine `await supabase.auth.getUser()`-Stelle; `angemeldet` steuert Daten und Nav. |
| 2×2-Grid oder Wrap auf schmalen Screens? | Nein. `flex-nowrap` + `overflow-x-auto`. Markupvertrag und Chromium-Messung. |
| Eigene Swipe-to-Navigate-Geste? | Nein. Kein Pointer-/Touch-Recognizer. Nur natives Overflow-Scroll plus horizontales `scrollBy`. |
| Aktiver Tab ohne `aria-current`? | Nein. Semantik unverändert. `/account/security` bleibt Einstellungen. |
| Gast sieht Account-Nav? | Nein. Bedingung `angemeldet ? <AccountNavigation /> : null`. Live-Gast-HTML ohne `nav[aria-label="Konto"]`. |
| TA-DL1 / Continuity angefasst? | Nein. Keine Traveller-Lifecycle-Dateien, kein `ACTIVE_WORK_STATUS`, kein Start-Here/Handoff. |
| Schema / Auth / MFA / RLS / Supabase? | Nein. |
| Ready / Merge / Folgeslice? | Nein. STOPP für unabhängigen TL-Review. |
| Empty/Error-Verwechslung auf `/reisen`? | Nein. Bestehende Trennung unverändert. |

## 3. Bewusst belassene Residuals

- Authentifiziertes `/reisen` ist hier nur als Source-Vertrag bewiesen, nicht als eingeloggter Preview-Klick.
- Real-Device-Swipe bleibt Product-Owner-/Preview-Evidence.
- `/ui-audit/account` markiert keinen Tab aktiv; der Audit-Pfad ist kein Account-Ziel.
- Account-Leiste ist nicht sticky; das entspricht der bestehenden Account-Shell und war nicht Auftrag.
- Fokusring kann am Overflow-Rand der Leiste leicht angeschnitten werden.

## 4. Urteil des Autors

Der Slice bleibt im autorisierten UX-Rahmen. Lokale Gates sind grün. Exact-head GitHub Actions `33281797775` und Vercel Preview `9ymUnYwBAzUi9iT5vANXNsEoewPs` sind SUCCESS auf `d23758f64d11ab3479294ac1a4b354a3d219d8f0`.

**Unabhängiger Technical-Lead-Review: ausstehend. Dieses Self-Review ersetzt ihn nicht und ist kein PASS.**
