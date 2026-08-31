# Entry Requirements Temporal Projection E5-A – Adversarial Self-Review

Stand: 31. August 2026  
Autor-Agent: **`Jetnity entry requirements temporal projection 1`**  
Generation: **1**  
Cursor-Session/Run-ID: `bc-01a057e1-e45f-79d8-a828-97be0e060415`  
Typ: adversarial Self-Review, **kein** unabhängiger Technical-Lead-PASS

## 1. Auftrag gegen Diff

Auftrag: Issue #323 / E5-A exact event-instant temporal projection core.

Geprüft: E4-Typen wiederverwendet; keine zweite Temporal-Domain; keine Trip-/Route-Occurrence-Auswahl; kein Country→first match; keine Zeitzone geraten; kein `Z` an lokale Flug-/Stage-Zeiten; nur explizite `Z`-/Offset-Instants; `eventRef` erhalten; Partial-Issues `missing_anchor` / `invalid_instant` / `invalid_projected_window`; Cross-Anchor-Fenster erst nach beiden Instants; kein `Date.now()`; kein system-local zoneless `new Date(string)`; keine Supabase-/DB-/RLS-/Auth-Änderung; kein Provider/Secret/paid call; keine Workspace-Deadline-UI; keine Task-/Reminder-Runtime; Factory `null`; kein E5-B; `docs/ACTIVE_WORK_STATUS.md` nicht editiert.

## 2. Adversarial Fragen

| Frage | Ergebnis |
| --- | --- |
| Entsteht eine zweite Anchor-/Relation-Taxonomie? | Nein. Import nur aus `lib/readiness/temporal.ts`. |
| Sucht der Core ein Trip-/Route-Event? | Nein. Kein Import von `lib/route` oder Flight-Mapping. Nur `bindings[anchor]`. |
| Wird bei zwei Occurrences desselben Landes first-picked? | Nein. Ohne explizites Binding `missing_anchor`. Nur die übergebene `eventRef` erscheint. |
| Wird ein Binding eines anderen Anchors als Fallback genutzt? | Nein. `trip_departure` ersetzt fehlendes `destination_arrival` nicht. |
| Wird `2026-09-12T18:00` als UTC gelesen? | Nein. `invalid_instant`. Kein `new Date('zoneless')`. |
| Wird Date-only `2026-09-12` als UTC-Tagesgrenze gelesen? | Nein. `invalid_instant`. |
| Wird `Z` an Foundation-D-`HH:mm` gehängt? | Nein. Kein Kontakt-Formatter, kein `${date}T${time}:00.000Z`. |
| Wird eine IANA-Zone oder DST rekonstruiert? | Nein. `+01:00` / `+02:00` am 29.03.2026 bleiben reine Offset-Arithmetik. |
| Bleibt `eventRef` erhalten? | Ja, auf available/due und im Action Window. |
| Wird ein unmögliches Cross-Anchor-Fenster als Handlungswahrheit ausgegeben? | Nein. `actionWindow === null` plus `invalid_projected_window`. |
| Bricht Overflow aus der E4-Bound aus? | Nein. `MAX + 1` Minuten wird nicht angewandt. |
| Wird `Date.now()` oder die Maschinenzone benutzt? | Nein. Parser arbeitet mit `Date.UTC` / Millisekunden. |
| Wird Safety-`isoZeitLesen` gekoppelt? | Nein. Bewusste lokale Instant-Validierung, weil Safety nur `Z` kennt. |
| Wird `OfficialEvaluation` oder der Provider-Port erweitert? | Nein. |
| Wird die Factory non-null oder ein Adapter verdrahtet? | Nein. `requirementsProviderAus()` bleibt `null`. |
| Werden Secrets, paid calls, Supabase, Auth, Tasks oder Notifications angefasst? | Nein. |
| Wurde ACTIVE_WORK_STATUS oder Ready/Merge/E5-B gestartet? | Nein. |

## 3. Bewusste Schwächen, die bleiben

- Ohne späteren Event-Resolver bleibt der Core ungerufen im Produktpfad. Das verhindert erfundene Deadlines, liefert aber keine Workspace-Wirkung.
- Bei ungültigem Fenster bleiben die einzeln gerechneten Punkte sichtbar. Nur `actionWindow` ist die Fenster-Wahrheit; ein unachtsamer Aufrufer könnte die Punkte trotzdem lesen. Das ist dokumentiert und getestet.
- Dieses Self-Review ersetzt keinen unabhängigen Technical-Lead-Review.

## 4. Urteil des Autors

**CHANGES REQUIRED durch den Autor:** keine in diesem Slice. Lokale Gates: 2944/2944 Tests, Typecheck, Lint 0/137, Production-Build, Hygiene.

**Unabhängiger Technical-Lead-Review:** ausstehend auf dem finalen Head. PR bleibt Draft. Kein Ready, kein Merge, kein E5-B.
