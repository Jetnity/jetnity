# Jetnity – AP-5 Gate 0 Self-Review

Stand: 28. August 2026  
Autor-Agent: **`Account plattform audit vorbereitung 8`**  
Typ: adversarial Self-Review, **kein** unabhängiger Technical-Lead-PASS

## 1. Auftrag gegen Diff

Auftrag: AP-5 Gate 0 – bestehenden Auth-/Session-/MFA-Vertrag rekonstruieren. Keine Runtime.

Geprüft gegen den tatsächlichen Dateisatz: Markdown unter `docs/`, Continuity-Zeiger, ADR-0182, Inventory-Test `lib/auth/ap5-gate0-contract-inventory.test.ts`.

Keine Änderung an `app/`-Runtime, `components/`, `supabase/config.toml`, Migrationen, Grants, RLS, Auth-Config.

## 2. Adversarial Fragen

| Frage | Ergebnis |
| --- | --- |
| Wurde ein Current-Password-Vertrag erfunden? | Nein. Explizit verboten. Recovery + `reauthenticate()` bleiben die Authority. |
| Wurde eine Sessionliste als baubar behauptet? | Nein. Installierter Client hat kein `listSessions`. UI-Soll ist `unsupported`. |
| Wurde Logout-all als fehlend beschrieben? | Nein. Heutiges Abmelden ist bereits `global`. |
| Wurde MFA-Step-up als serverseitig vorhanden behauptet? | Nein. App erzwingt keines. GoTrue-Unenroll-AAL für verifizierte Faktoren bleibt `unknown`. |
| Wurde Consumer-AAL2 still empfohlen als Normal-TL-Slice? | Nein. Eigenes PO-Gate AP-5-P3. |
| Wurde `auth:fluesse` als in diesem Slice gelaufen behauptet? | Nein. Nur historische AUTH.md-Evidence. |
| Wurde Production-Auth-Config als heute byte-identisch behauptet? | Nein. Parent-Spalte in AUTH.md ist vom 17. August 2026. `auth:pruefen` gilt für den Development-Branch. |
| Wurde C1 neu gebaut oder C2 gestartet? | Nein. |
| Ist der Inventory-Test ein Runtime-Write? | Nein. Liest Quelltext und `sollwerte()`. |
| Traveller-/Dokumentdaten? | Nicht berührt. |

## 3. Risiken, die bleiben

- Exact-Head auf `8ead1a8f` ist live SUCCESS (Actions `33137160070`, Vercel `8h2J9vfjaCWSJVS6W4RcvLEHVowz`). Dieser Docs-Stamp erzeugt einen neueren Head; dessen CI muss gelesen werden. Kein weiterer Evidence-Stamp, außer die Stamp-CI fehlschlägt.
- `JETNITY_START_HERE.md` / `JETNITY_HANDOFF.md` / `docs/ACTIVE_WORK_STATUS.md` waren vor diesem Slice noch auf C1-Draft-Zeiger; nur notwendige Current-Truth-Zeiger wurden nachgezogen.
- Ein späterer Agent könnte `/auth/update-password` als In-Account-UI „wiederverwenden“ und dabei Recovery und Reauth vermischen. S2 muss das trennen.
- Login-MFA-Abbrechen lässt AAL1 stehen. Das ist ein echter Rest, kein AP-5-Runtime-Fix in diesem Slice.

## 4. Urteil des Autors

**CHANGES REQUIRED durch den Autor:** keine weiteren in diesem Slice.

**Unabhängiger Technical-Lead-Review:** ausstehend. Dieses Self-Review ersetzt ihn nicht.
