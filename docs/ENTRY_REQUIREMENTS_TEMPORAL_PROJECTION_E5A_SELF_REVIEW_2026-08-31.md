# Entry Requirements Temporal Projection E5-A – Adversarial Self-Review

Stand: 31. August 2026  
Autor-Agent: **`Jetnity entry requirements temporal projection 1`**, Generation 1  
Ursprüngliche Implementation: Session `bc-01a057e1-e45f-79d8-a828-97be0e060415` (abgeschlossen; nicht wieder geöffnet)  
TL-Review-Fix-Recovery: Session `bc-c3909ff8-66de-4b95-afeb-cff18935b4fc`  
Grund: GitHub/Cursor konnte die abgeschlossene ursprüngliche Session trotz expliziter Fortsetzungsanweisung nicht wieder öffnen.  
Rolle: nur mechanischer enger Review-Fix — **keine** gleiche Session, keine neue Produktgeneration, kein neuer Slice  
Typ: adversarial Self-Review, **kein** unabhängiger Technical-Lead-PASS

## 1. Auftrag gegen Diff

Auftrag: Issue #323 / E5-A exact event-instant temporal projection core, plus TL-CHANGES-REQUIRED auf Head `ae091777e5aec0d5a0b6baf8b28a5ce1234c967d` (Kommentar `5478873885`).

Session-Abweichung (Live Evidence): ursprüngliche Implementation-Session `bc-01a057e1-e45f-79d8-a828-97be0e060415` war abgeschlossen und wurde nicht wieder geöffnet. Recovery-Session `bc-c3909ff8-66de-4b95-afeb-cff18935b4fc` erhielt STOP und alle späteren Recovery-Anweisungen. Das ist **nicht** die ursprüngliche Session.

Geprüft: E4-Typen wiederverwendet; keine zweite Temporal-Domain; keine Trip-/Route-Occurrence-Auswahl; kein Country→first match; keine Zeitzone geraten; kein `Z` an lokale Flug-/Stage-Zeiten; nur explizite `Z`-/Offset-Instants; `eventRef` erhalten; Partial-Issues `missing_anchor` / `invalid_instant` / `invalid_projected_window`; Cross-Anchor-Fenster erst nach beiden Instants; kein `Date.now()`; kein system-local zoneless `new Date(string)`; keine Supabase-/DB-/RLS-/Auth-Änderung; kein Provider/Secret/paid call; keine Workspace-Deadline-UI; keine Task-/Reminder-Runtime; Factory `null`; kein E5-B; `docs/ACTIVE_WORK_STATUS.md` nicht editiert.

Zusätzlich nach TL-Befund: kein gemeinsam mutierbares leeres Resultat; frische Projection pro Aufruf; Cross-Call-Isolation getestet; whitespace-only `eventRef` ist `missing_anchor`.

Traveller-Context-Intelligence: für diesen reinen Instant-Rechenkern **nicht relevant**. Der Core liest keine Citizenships, Dokumente oder Residence; er projiziert nur explizit gebundene Instants. Mehrfach-Occurrence bleibt Sache des Aufrufers, nicht first-match.

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
| Teilen leere Projektionen eine mutierbare Referenz? | **Nein, nach Fix.** `leereProjektion()` liefert pro Aufruf ein neues Objekt. Mutation von `issues` / Feldern eines früheren Ergebnisses ändert spätere Aufrufe nicht. Vorher: `LEERE_PROJEKTION`-Singleton (TL-Befund). |
| Wurde der Scope über den Purity-Fix hinaus erweitert? | Nein, außer dem TL-freigegebenen Provenance-Grenzfall. |
| Ist `'   '` eine stabile `eventRef`? | **Nein, nach Fix.** `missing_anchor`, `eventRef: null`, kein anderes Binding, keine ID-Erfindung. |
| Ist diese Recovery-Session die ursprüngliche Session? | **Nein.** Ursprüngliche Implementation: `bc-01a057e1-e45f-79d8-a828-97be0e060415`. Recovery: `bc-c3909ff8-66de-4b95-afeb-cff18935b4fc`. |
| Ist diese Recovery-Session eine neue Generation oder ein neuer Slice? | Nein. Nur mechanischer enger Review-Fix, weil GitHub/Cursor die abgeschlossene Original-Session nicht wieder öffnen konnte. |

## 3. Bewusste Schwächen, die bleiben

- Ohne späteren Event-Resolver bleibt der Core ungerufen im Produktpfad. Das verhindert erfundene Deadlines, liefert aber keine Workspace-Wirkung.
- Bei ungültigem Fenster bleiben die einzeln gerechneten Punkte sichtbar. Nur `actionWindow` ist die Fenster-Wahrheit; ein unachtsamer Aufrufer könnte die Punkte trotzdem lesen. Das ist dokumentiert und getestet.
- Erfolgreiche Projektionen sind weiterhin gewöhnliche mutable Objects. Der Review-Fix isoliert den früher geteilten leeren Pfad; Deep-Freeze des gesamten Vertrags war nicht verlangt und nicht eingeführt.
- Das erste Autor-Self-Review auf `ae091777...` hat das Singleton nicht gefunden. Der Technical-Lead-Befund war berechtigt.
- Dieses Self-Review ersetzt keinen unabhängigen Technical-Lead-Review.

## 4. Urteil des Autors

**CHANGES REQUIRED durch den Technical Lead:** Purity-Singleton und whitespace-only `eventRef` in dieser Recovery-Session behoben. Lokale Gates nach Re-Run: 2946/2946 Tests, Typecheck, Lint 0/137, Production-Build, Hygiene. `origin/main` unverändert `1600767b...`.

**Unabhängiger Technical-Lead-Review:** ausstehend auf dem **neuen** Head. Vorherige Exact-Head-Gates auf `ae091777...` und `85aef5e2...` zählen nicht. PR bleibt Draft. Kein Ready, kein Merge, kein E5-B.
