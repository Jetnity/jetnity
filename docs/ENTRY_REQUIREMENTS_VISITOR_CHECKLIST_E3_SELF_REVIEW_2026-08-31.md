# Entry Requirements Visitor Checklist E3 – Adversarial Self-Review

Stand: 31. August 2026  
Autor-Agent: **`Jetnity entry requirements checklist 1`**  
Generation: **1**  
Cursor-Session/Run-ID: `bc-101a3978-c843-4ac5-8678-112eef039283`  
Typ: adversarial Self-Review, **kein** unabhängiger Technical-Lead-PASS

## 1. Auftrag gegen Diff

Auftrag: Issue #311 / E3 Visitor Checklist Presentation only.

Geprüft: lossless Zeile je OfficialEvaluation; kein Default-Pass/`documents[0]`/`evaluations[0]`; fail-closed Status/Freshness; Visa-Modi und eTA strikt; Credential-Label nur aus exakten Trip-/Traveller-Daten; Issuer ≠ Citizenship; purpose-spezifische Actions ohne URL-Heuristik; keine erfundenen Gebühren/Stay/Seiten/Proof-of-Funds/Deadlines; Factory `null`; keine Provider/Secrets/paid calls; keine Supabase/Auth; keine sensitiven Dokumentdaten; kein Ranking; keine Notification-Runtime; kein IA-Redesign; `docs/ACTIVE_WORK_STATUS.md` nicht editiert.

## 2. Adversarial Fragen

| Frage | Ergebnis |
| --- | --- |
| Wird die Checkliste auf eine Traveller-Summe reduziert? | Nein. Jede Evaluation wird zur eigenen Karte. Summary bleibt nur Hinweis. |
| Kollabieren zwei Credential-Optionen desselben Travellers? | Nein. Getrennte `scopeKey`s, permutation-stabil sortiert. |
| Gibt es `documents[0]` / `evaluations[0]` in Presentation/UI? | Nein. Source-Test verbietet beide. Auflösung nur bei genau einem Treffer. |
| Wird Residence als Issuer oder Citizenship geraten? | Nein. Issuer nur `issuingCountryCode`, Citizenship nur exakter `citizenshipClientRef`. |
| Erscheint eine interne Option-ID als Besucher-Copy? | Nein. Unauflösbar → `Reisedokument-Option`. |
| Wird stale `required` als `Erforderlich` gezeigt? | Nein. Nicht-current gewinnt: `Erneut prüfen`. |
| Wird eTA als Visa-Modus oder E-Visum gezeigt? | Nein. Eigenes Label, `visaMode` bleibt `null`. |
| Wird `visa` + `unknown` als erledigter Antrag gruppiert? | Nein. Gruppe `Vor Abreise`, Titel `Visumstatus`, keine Antrag-erledigt-Copy. |
| Werden `blank_passport_pages` / `financial_means` versteckt? | Nein. First-Class-Labels und eigene Gruppen. |
| Bleibt Transit scoped? | Ja. Gruppe `Route / Transit`, Ort zeigt Destination und Transitland. |
| Werden Actions pauschal „Offizielle Information öffnen“? | Nein. Labels aus `purpose`. UI enthält den Pauschalstring nicht mehr hart. |
| Wird dieselbe URL doppelt gezeigt? | Nein. `sourceUrl === action.href` → eine Action. |
| Wird der Zweck aus der URL geraten? | Nein. Keine URL-Inspektion ausser Gleichheit für Dedup. |
| Werden Gebühren, Stay, Seiten, Beträge, Deadlines erfunden? | Nein. Keine solchen Felder gerendert. `validFrom`/`validUntil` nicht als Frist. |
| Ändert Gruppierung `result`/`status`/`freshness`/`visaMode`? | Nein. Presentation kopiert die Werte nur. |
| Wird die Factory non-null oder ein Adapter verdrahtet? | Nein. `requirementsProviderAus()` bleibt `null`. |
| Werden Secrets, paid calls, Supabase, Auth oder Deadlines angefasst? | Nein. |
| Wurde ACTIVE_WORK_STATUS oder Ready/Merge/E4 gestartet? | Nein. |

## 3. Bewusste Schwächen, die bleiben

- Ohne Provider ist die Checkliste fail-closed und kann viele `provider_unavailable`-Zeilen zeigen. Das ist lossless, nicht schön.
- `information` aus `sourceUrl` bleibt klickbar, wenn keine abweichende Action existiert. Das ist E2-Kompatibilität, kein Antrag.
- `checkedAt` wird als UTC-Jetnity-Prüfzeit formatiert, nicht in der Nutzerzeitzone. Das vermeidet erfundene lokale Deadlines.
- Dieses Self-Review ersetzt keinen unabhängigen Technical-Lead-Review.

## 4. Urteil des Autors

**CHANGES REQUIRED durch den Autor:** keine in diesem Slice. Lokale Gates: 2896/2896 Tests, Typecheck, Lint 0/137, Production-Build, Hygiene.

**Unabhängiger Technical-Lead-Review:** ausstehend. PR bleibt Draft. Kein Ready, kein Merge, kein E4.
