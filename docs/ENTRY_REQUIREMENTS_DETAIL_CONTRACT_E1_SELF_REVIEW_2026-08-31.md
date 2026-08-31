# Entry Requirements Detail Contract E1 – Adversarial Self-Review

Stand: 31. August 2026  
Autor-Agent: **`Jetnity entry requirements detail 1`**  
Generation: **1**  
Cursor-Session/Run-ID: `bc-ed28b92e-5bca-4a79-88bb-773205180d40`  
Typ: adversarial Self-Review, **kein** unabhängiger Technical-Lead-PASS

## 1. Auftrag gegen Diff

Auftrag: Issue #298 / E1 Contract only.

Geprüft: First-Class `blank_passport_pages` / `financial_means`; Visa-Modus nur für `visa`; eTA bleibt eigener Typ; lossless Provider → Engine → `OfficialEvaluation`; ungültige Werte fail-closed; nicht-Visa trägt keinen Visa-Modus; keine Hard Truth aus Fehlern oder fehlender Evidence; Factory `null`; keine UI/Deadlines/Adapter/Secrets/paid calls; keine Supabase-/Auth-Änderung; Traveller-Invariants unverändert; S4-R1 nicht abgeschwächt; Tests; Slice-Docs. `docs/ACTIVE_WORK_STATUS.md` und `JETNITY_START_HERE.md` nicht editiert.

## 2. Adversarial Fragen

| Frage | Ergebnis |
| --- | --- |
| Werden `blank_passport_pages` / `financial_means` nur als `other_entry_requirement` versteckt? | Nein. Eigene Typen in `OFFICIAL_REQUIREMENT_TYPES`; Engine bewertet sie als Pflichtslots. |
| Wird eTA als Visa-Modus umetikettiert? | Nein. `electronic_travel_authorization` bleibt eigener Typ. `visaModeLesen('electronic_travel_authorization', 'electronic_visa')` ist `null`. |
| Kann eine Passport-/Health-/ETA-Zeile `visa_on_arrival` als Product Truth tragen? | Nein. Nicht-Visa normalisiert immer auf `null`. |
| Wird aus ungültigem `'visa_free'` ein `visa_exempt`? | Nein. `unknown`. |
| Wird fehlender Visa-Modus als `visa_before_travel` angenommen? | Nein. `unknown`. |
| Wird ein konkreter Visa-Modus aus untrusted Evidence übernommen? | Nein. Nur wenn `uebernehmbar` (Trust + current + required/not_required/conditional). Sonst `unknown`. |
| Werden widersprüchliche Visa-Modi still gemergt? | Nein. `entscheidungenGleich` unterscheidet `visaMode`; Konflikt → `officialLeer` mit `visaMode: 'unknown'`. |
| Wird ein Default-Pass oder `documents[0]` eingeführt? | Nein. Zwei Optionen bleiben zwei Visa-Evaluations mit eigenen Modi. |
| Wird die Factory non-null oder ein Adapter verdrahtet? | Nein. `requirementsProviderAus()` bleibt `null`. Tests injizieren Doubles. |
| Werden Timeout/Abort/Kill-Switch/Freshness abgeschwächt? | Nein. S4-R1-Tests bleiben grün; keine Änderung an `abruf.ts` / `zustand.ts` / Ceiling. |
| Werden Schwellen, Gebühren oder Deadlines modelliert? | Nein. |
| Wurde UI oder Workspace live verdrahtet? | Nein. |
| Wurde Auth/DB/ACTIVE_WORK_STATUS/Start-Here mitgeschleppt? | Nein. |
| Wurde Ready/Merge/Folgeslice gestartet? | Nein. |

## 3. Bewusste Schwächen, die bleiben

- Ohne Provider erzeugen die zwei neuen Typen zusätzliche fail-closed Official-Slots in Attention. Das ist First-Class-Ehrlichkeit, keine Besucher-UI.
- Vergleichsrang nach Visa-Modus fehlt bewusst. E1 transportiert Struktur, entscheidet nicht „besser“.
- Konkreter Visa-Modus ist an Trust gebunden. Ein Provider, der nur den Modus ohne Authority liefert, verliert den Modus. Das verhindert Hard Truth aus untrusted Zeilen.
- Dieses Self-Review ersetzt keinen unabhängigen Technical-Lead-Review.

## 4. Urteil des Autors

Während der lokalen Gates ein Author-Fix: Test-Hilfen durften `requirementType` nicht doppelt im Object-Literal setzen (`TS1117`); ein Inline-`OfficialEvaluation` in `bezeichnungen.test.ts` brauchte `visaMode`. Beides gehört zum Slice-Diff.

**CHANGES REQUIRED durch den Autor:** keine weiteren in diesem Slice. CI/Vercel am Exact Head bleiben live zu prüfen.

**Unabhängiger Technical-Lead-Review:** ausstehend.
