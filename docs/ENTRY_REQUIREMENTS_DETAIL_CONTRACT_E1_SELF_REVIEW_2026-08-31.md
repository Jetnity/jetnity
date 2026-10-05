# Entry Requirements Detail Contract E1 – Adversarial Self-Review

Stand: 31. August 2026  
Autor-Agent: **`Jetnity entry requirements detail 1`**  
Generation: **1**  
Cursor-Session/Run-ID: `bc-ed28b92e-5bca-4a79-88bb-773205180d40`  
Typ: adversarial Self-Review, **kein** unabhängiger Technical-Lead-PASS

## 1. Auftrag gegen Diff

Auftrag: Issue #298 / E1 Contract only.

Geprüft: First-Class `blank_passport_pages` / `financial_means`; Visa-Modus nur für `visa`; eTA bleibt eigener Typ; lossless Provider → Engine → `OfficialEvaluation`; ungültige Werte fail-closed; nicht-Visa trägt keinen Visa-Modus; `result ↔ visaMode`-Konsistenz fail-closed; keine Hard Truth aus Fehlern oder fehlender Evidence; Factory `null`; keine UI/Deadlines/Adapter/Secrets/paid calls; keine Supabase-/Auth-Änderung; Traveller-Invariants unverändert; S4-R1 nicht abgeschwächt; Tests; Slice-Docs. `docs/ACTIVE_WORK_STATUS.md` und `JETNITY_START_HERE.md` nicht editiert.

## 2. Adversarial Fragen

| Frage | Ergebnis |
| --- | --- |
| Werden `blank_passport_pages` / `financial_means` nur als `other_entry_requirement` versteckt? | Nein. Eigene Typen in `OFFICIAL_REQUIREMENT_TYPES`; Engine bewertet sie als Pflichtslots. |
| Wird eTA als Visa-Modus umetikettiert? | Nein. `electronic_travel_authorization` bleibt eigener Typ. `visaModeLesen('electronic_travel_authorization', 'electronic_visa')` ist `null`. |
| Kann eine Passport-/Health-/ETA-Zeile `visa_on_arrival` als Product Truth tragen? | Nein. Nicht-Visa normalisiert immer auf `null`. |
| Wird aus ungültigem `'visa_free'` ein `visa_exempt`? | Nein. `unknown`. |
| Wird fehlender Visa-Modus als `visa_before_travel` angenommen? | Nein. `unknown`. |
| Wird ein konkreter Visa-Modus aus untrusted Evidence übernommen? | Nein. Nur wenn `uebernehmbar` (Trust + current + required/not_required/conditional). Sonst `unknown`. |
| Kann `required + visa_exempt` als `current` Hard Truth stehen bleiben? | Nein. Widerspruch degradiert `result` und `visaMode` auf `unknown`, `status` nicht `current`. Keine Seite gewinnt. |
| Kann `not_required + visa_on_arrival/electronic_visa/visa_before_travel` current bleiben? | Nein. Dieselben fail-closed Degrade-Regeln. |
| Wird `conditional + visa_exempt` oder `conditional + VoA/eVisa` verboten? | Nein. `conditional` erzeugt keine erfundene Gewissheit und gilt nicht als Widerspruch. |
| Infiziert ein Widerspruch auf Pass CH die Option RS? | Nein. Nur die betroffene Credential-Option wird degradiert. |
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

TL CHANGES REQUIRED auf `ee700691`: `result ↔ visaMode` fehlte. Nachgezogen mit `visaResultUndModusWidersprechen` / `officialVisaWiderspruchDegradieren`, Engine-Anwendung, Tests für alle Pflicht-Widersprüche, gültige Paare, `conditional` und Multi-Credential-Trennung. ADR-0201 und Slice-Docs korrigiert.

**CHANGES REQUIRED durch den Autor:** keine weiteren in diesem Slice. CI/Vercel am neuen Exact Head bleiben live zu prüfen.

**Unabhängiger Technical-Lead-Review:** erneut ausstehend nach diesem Review-Fix.
