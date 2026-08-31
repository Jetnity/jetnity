# Entry Requirements Temporal Rules E4 – Adversarial Self-Review

Stand: 31. August 2026  
Autor-Agent: **`Jetnity entry requirements temporal rules 1`**  
Generation: **1**  
Cursor-Session/Run-ID: `bc-69084bbc-a7ab-4ed5-8418-754bea9ee241`  
Typ: adversarial Self-Review, **kein** unabhängiger Technical-Lead-PASS

## 1. Auftrag gegen Diff

Auftrag: Issue #315 / E4 official temporal-rule contract, no reminder runtime.

Geprüft: nur `relative_duration`; geschlossene Anchors/Relations; `availableFrom`/`dueBy` mit `mandatory|recommended`; Timing nur aus strukturierten Provider-Metadaten; kein Default-Pass/`documents[0]`/`evaluations[0]`; Temporal Rule nur current/trusted `required|conditional`; malformed Timing ändert keine Hard Truth; Duplicate-Timing fail-closed und permutationsstabil; relative Copy ohne Kalender-Timestamps; Factory `null`; keine Provider/Secrets/paid calls; keine Supabase/Auth; keine sensitiven Dokumentdaten; kein Ranking; keine Deadline-/Notification-Runtime; kein E5; `docs/ACTIVE_WORK_STATUS.md` nicht editiert.

## 2. Adversarial Fragen

| Frage | Ergebnis |
| --- | --- |
| Wird Timing aus URL, Freitext, Requirement-Typ oder `validFrom/validUntil` abgeleitet? | Nein. Parser liest nur explizites `temporalRule`. Evidence-Gültigkeit bleibt getrennt. |
| Wird `not_required` mit Timing ausgeliefert? | Nein. `officialDarfTemporalTragen` lässt nur `required\|conditional`. |
| Zerstört malformed Timing eine gültige `required`-Entscheidung? | Nein. Requirement bleibt, `temporalRule` wird `null`. |
| Wird Timing in die Entscheidungssignatur gemischt und Hard Truth bei Timing-Konflikt zerstört? | Nein. `entscheidungenGleich` bleibt ohne Timing. Reconciliation ist explizit. |
| Gewinnt die erste Duplicate-Zeile bei widersprüchlichem Timing? | Nein. Beide Richtungen und `null` vs. Wert werden `temporalRule: null`. |
| Bleibt identisches Timing permutationsstabil erhalten? | Ja. Gleiche Schlüssel, Feldreihenfolge egal. |
| Kollabieren zwei Credential-Optionen auf ein Timing? | Nein. Scope bleibt credential-spezifisch. |
| Wird Transit-Timing auf Destination oder den anderen Transit gezogen? | Nein. Anchor `transit_arrival` bleibt am exakten Transit-Country. |
| Löscht Visa-Conflict das Timing? | Ja. Degradation setzt `temporalRule: null`. |
| Zeigt die UI konkrete Kalenderdaten oder Uhrzeiten? | Nein. Nur relative Copy aus Minuten. |
| Wird `calendar_day` oder ein absoluter Timestamp in den Contract gepresst? | Nein. Unsupported kinds werden `null`. |
| Wird die Safety-Bound als fachliche Frist verkauft? | Nein. Dokumentiert als technische Obergrenze `1_051_200` Minuten. |
| Wird die Factory non-null oder ein Adapter verdrahtet? | Nein. `requirementsProviderAus()` bleibt `null`. |
| Werden Secrets, paid calls, Supabase, Auth, Tasks oder Notifications angefasst? | Nein. |
| Wurde ACTIVE_WORK_STATUS oder Ready/Merge/E5 gestartet? | Nein. |

## 3. Bewusste Schwächen, die bleiben

- Ohne Provider gibt es keine echte Timing-Evidence. Die Checkliste bleibt fail-closed.
- 72 Stunden werden als Stunden formatiert; 3 Tage und 72 Std. sind dieselbe Minutenmenge und daher nicht beide darstellbar.
- Presentation verbirgt Timing zusätzlich, wenn Status/Freshness nicht current sind. Das ist Defense-in-Depth, nicht neue Hard Truth.
- Dieses Self-Review ersetzt keinen unabhängigen Technical-Lead-Review.

## 4. Urteil des Autors

**CHANGES REQUIRED durch den Autor:** keine in diesem Slice, sobald lokale Gates grün dokumentiert sind.

**Unabhängiger Technical-Lead-Review:** ausstehend. PR bleibt Draft. Kein Ready, kein Merge, kein E5.
