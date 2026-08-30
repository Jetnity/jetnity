# TA-CUX1 – Adversarial Self-Review

Stand: 30. August 2026  
Cursor-Agent: `Account plattform audit vorbereitung 21`  
Reviewed Head: `a5cf4193fa447bdf898ba176bd72dbd2cb4445cc`; live am Draft-PR #234 prüfen.

## Verdict

**IMPLEMENTATION COMPLETE / READY FOR INDEPENDENT TECHNICAL-LEAD REVIEW.**  
Kein Author-PASS. Kein Ready. Kein Merge.

## Scope

In scope: eine Shared Country Foundation/Control und ihre Verwendung auf `/account/travellers` plus Trip-Workspace-Reisendenkontext.

Nicht angefasst: Migrationen, Schema, RLS, Grants, Auth/MFA/AAL, Service Role, Provider, Visa/Einreise, Default-Credential, globale Continuity-Dateien.

## Adversarial checks

| Risiko | Ergebnis |
| --- | --- |
| Sichtbare `ISO-2`-Freitextfelder in den Scope-Flächen | entfernt; Contract-Tests prüfen `ISO-2`, `maxLength={2}`, `z. B. CH` |
| `citizenships[0]` / `documents[0]` als Wahrheit | nicht vorhanden |
| `primary` / `defaultPassport` / `chosen` / `bestPassport` | nicht vorhanden |
| Auto-Vorauswahl aus Locale/IP/First-Item | kein `navigator.language`/`geolocation`; leerer Wert bleibt leer |
| Country-Name persistiert | `onChange` liefert nur Code; `landAuswahlUebernehmen` lehnt Namen ab |
| Issuer → Citizenship-Ableitung | getrennte Felder, unveränderte Domain-Hinweise |
| Legacy `XX` still überschrieben | Presentation `Bestehender Code XX`; Auswahl bleibt erhalten bis expliziter Wechsel |
| Multi-Citizenship / nullable Relation | Add/Remove und leere Zuordnung unverändert |
| Domain-Semantik verschärft | `landescodeLesen` / Zod `^[A-Z]{2}$` unverändert |
| Neue npm dependency | keine |
| Custom Combobox / `touch-pan-x` | natives Select; kein `touch-pan-x` |
| Globale Continuity | dieser Agent hat `JETNITY_START_HERE.md`, `JETNITY_HANDOFF.md`, `ACTIVE_WORK_STATUS.md` nicht geändert |

## Gates

Lokal:

- Tests 2759/2759 auf `aafc1464` und erneut nach Overflow-Fix
- Typecheck pass
- Lint 0 errors
- Hygiene pass
- Production-Build pass
- Account-UI-Audit 48/48
- Fokussierte TW-Reisevorbereitungs-Verifikation pass
- 280px-Overflow der beiden Country-Vorbereitungs-Fixtures nach Fix = 0
- `audit:trip-workspace` 1017/1018; Restfehler ist WebKit-Tabwechsel/sticky header, nicht Country-UX

Exact-Head auf `a5cf4193`: CI #1322 / Run `33285733748` SUCCESS; Vercel Preview `7EnN9EACJrtSJuJMcxH1CiiWmMsT` SUCCESS. Ein nachfolgender Docs-Stamp muss live neu gegatet werden.

## Offen / nicht behauptet

- Authentifizierter Real-Device-Durchlauf `/account/travellers` in dieser Umgebung nicht möglich
- WebKit 1280 Tabwechsel-Fokus unter klebender Kopfzeile bleibt ein bestehender/flaky Workspace-Auditpunkt und wurde hier nicht erweitert
- Unabhängiger Technical-Lead-Review ausstehend
