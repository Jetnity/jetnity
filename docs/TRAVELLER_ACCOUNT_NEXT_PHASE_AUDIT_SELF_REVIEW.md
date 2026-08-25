# Jetnity – Traveller / Account Next-Phase Audit – Adversarial Self-Review

Stand: 26. August 2026  
Agent: `Account plattform audit vorbereitung`  
Gegenstand: `docs/TRAVELLER_ACCOUNT_NEXT_PHASE_AUDIT.md`  
PR: #76 / `audit/traveller-account-next-phase`

Auftrag: jede Aussage muss auf Code, Test, Schema, ADR oder Live-Evidence beruhen oder als offene Entscheidung markiert sein.

---

## 1. Was dieser Review angreift

1. Habe ich Current Truth mit Wunschzustand verwechselt?
2. Habe ich einen Default-Pass behauptet, der im Trip-Graph-Pfad gar nicht existiert?
3. Habe ich Production- oder Test-Grün behauptet, das dieses Run nicht belegt?
4. Habe ich AP-4 oder AP-7 als nächsten Slice empfohlen und damit die Build Order oder den Shared Contract unterlaufen?
5. Habe ich parallele PRs als kollisionsfrei erklärt, ohne ihre Diffs gelesen?

---

## 2. Gehaltene Aussagen

| Aussage | Evidence | Angriff | Stand |
| --- | --- | --- | --- |
| Current Truth ist trip-scoped | Tabellen `trip_travellers` + Children; `types/trips.ts` „Keine accountweiten Profile“; keine account_* Traveller-Tabelle | Ein verstecktes Profil in `profiles`? Nicht gefunden. | gehalten |
| 1:n Citizenship/Document existiert | Migration `20260822160000`; Domain-Typen; UI-Limits 8/12 | Foundation-E-Audit vom 22.08. beschreibt den *Vorzustand*. Der ist historisch. | gehalten; historisches Audit nicht als Ist-Stand zitiert |
| Issuer ≠ Citizenship | ADR-0120; `dokument-formular.ts`; Re-Review-Migration `20260822180000` | Alte Backfill-Zeilen könnten Relation noch tragen. Neutralisierung ist form-spezifisch. Rest-Risiko: **partial**, im Audit als Expand/Contract/P3 geführt. | gehalten |
| Engine-First-Document ist conflicting | `travellerNormalisieren` Zeilen 123–134; Aufruf über `anfrage.travellers.map(travellerNormalisieren)` | Trip-Graph setzt Options über `credentialOptionsAus`. Deshalb **kein P0** auf dem Produktpfad Reisevorbereitung. | gehalten; P1 nicht hochgestuft |
| Official-Collapse ist nicht erfundenes Visa | `result: 'unknown'` hart in `officialAusEvaluations` | Badge/Reason können trotzdem first-evaluation sein. Deshalb P1 Presentation, nicht P0 Regulatory. | gehalten |
| Attention verbietet Default-Pass | `attention.test.ts` `cit:*` vs `:none` | Test beweist Attention-Refs, nicht die Engine-API. Getrennt dokumentiert. | gehalten |
| Vergleich fail-closed | `vergleich.ts` Größe `< 2` und Konflikt → `VERGLEICH_NICHT_VERFUEGBAR` | Ohne Provider gibt es ohnehin keinen Winner. | gehalten |
| Route traveller-neutral | keine Party-Treffer in `lib/route` | Andere Transit-Module außerhalb `lib/route`? Nicht gefunden. | gehalten |
| Account AP-1/AP-3 ohne Registry | Account-Code nutzt `travellers` als Zahl; AP-1/AP-3 Tasks verbieten Registry | Ältere Statusdateien tun noch so, als wären #43/#48/#53 Drafts. ROADMAP sagt gemergt. Audit folgt ROADMAP + `main`. | gehalten |
| Guest→Account kopiert Arrays | `GastreiseBruecke.tsx` | Nicht jeder Fehlerpfad erneut durchgespielt. Code-Evidence, kein Runtime-Takeover in diesem Run. | gehalten, als Code-Evidence markiert |
| Foundation E „auf Production“ | Binding Build Order + START_HERE | Dieses Run hat Supabase nicht abgefragt. ADR-Text ist historisch „nicht Production“. Audit sagt **insufficient evidence** für den exakten Live-Stand. | gehalten |
| Plan-Datei fehlt auf `main` | Glob 0 Treffer; Datei via GitHub auf `audit/account-platform` lesbar | Inhalt des Plans ist Evidence für AP-4–AP-12-Schnitt, nicht für `main`. | gehalten |

---

## 3. Schwächen, die stehen bleiben

1. **Kein vollständiger Datei-für-Datei-Diff der Parallel-PRs #74/#75/#77/#78/#79.** Kollisionsaussage stützt sich auf PR-Titel, Task-Grenzen und Abwesenheit von Traveller-Schema in diesem Branch. Ein späterer Runtime-Commit dort könnte kollidieren. Offen: TL prüft bei Merge-Reihenfolge.
2. **Shallow Fetch** zerstörte lokale Merge-Bases der Parallel-Branches. Live-Beweis dort: GitHub-PR-Metadaten, nicht `git merge-base`.
3. **Keine RLS-Live-Queries** (`db:rls` / `db:sicherheit` nicht ausgeführt). Policies aus Migrationstext gelesen.
4. **Planner `/planen`** nicht runtime-geprüft. Kopfzahl-Create aus bekanntem `reise_anlegen`-Vertrag; als insufficient/nicht relevant markiert.
5. **Safety „zulässig citizenship-set“** hängt an der heutigen Fact-Form. Ein späterer dokumentabhängiger Safety-Fact wäre ein neues Gap. Als P2-TA-05 markiert, nicht als ewig korrekt.
6. **P1-TA-01** ist nur dann produktionswirksam, wenn ein API- oder Legacy-Aufruf `credentialOptions` weglässt. Der Trip-Graph tut das nicht. Ein Reviewer kann die Schwere auf P2 senken; der Audit stuft sie als P1, weil die Synthese dem kanonischen Verbot widerspricht.

---

## 4. Was bewusst nicht empfohlen wurde

- AP-4 als „nächster Account-Slice“, nur weil der AP-3-Handoff Archiv nennt.
- AP-7 als kleinster Slice, nur weil die Build Order „Registry“ erwähnt.
- Shared-Contract-Änderung „kurz im Code“, um den Engine-Fallback zu schließen.
- Production- oder Ready-Behauptung für PR #76.

Das kleinste korrekte *spätere* Slice bleibt trip-scoped Leftover-Closure. Das ist eine Empfehlung, kein Auftrag.

---

## 5. Non-Scope eingehalten

Keine DB-/Migration-/RLS-Änderung. Keine Auth/MFA/Session-Änderung. Keine Guest→Account-Änderung. Keine Traveller-Shared-Contract-Änderung. Keine Passscan-/MRZ-/Biometrie-Speicherung. Keine AP-4–AP-12-Implementierung. Keine `/planen`-Runtime. Keine Route-/Provider-/Payment-/Growth-Runtime. `docs/ACTIVE_WORK_STATUS.md` unberührt.

---

## 6. Urteil

Der Audit ist **review-fähig, nicht Ready**. Shared-Contract-Bedarf ist ein STOPP, kein Implementierungsauftrag.

Offene Restunsicherheit ist in Abschnitt 3 und in der Audit-Datei Abschnitt 12 benannt. Nichts davon darf als geschlossen verkauft werden.
