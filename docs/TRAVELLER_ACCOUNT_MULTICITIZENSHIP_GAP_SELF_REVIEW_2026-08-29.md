# Jetnity – Traveller / Account / Multi-Citizenship Gap Audit Self-Review

Stand: 29. August 2026  
Autor-Agent: **`Cursor-Agent: Jetnity traveller account audit 1`**  
Typ: adversarial Self-Review, **kein** unabhängiger Technical-Lead-PASS  
Draft-PR: https://github.com/Jetnity/jetnity/pull/192

## 1. Auftrag gegen Diff

Auftrag: `docs/TRAVELLER_ACCOUNT_MULTICITIZENSHIP_GAP_AUDIT_TASK_2026-08-29.md` auf Draft-PR #192.

Geprüft gegen den tatsächlichen Dateisatz:

- Audit
- Entity-/Ownership-Vertrag
- Implementierungs-Backlog
- Status
- Handoff
- dieses Self-Review
- `docs/ACTIVE_WORK_STATUS.md` (Feature-Branch-Continuity)
- unveränderte Runtime: kein `app/`, `components/`, `lib/`-Produktcode, `supabase/migrations`

`git checkout -- next-env.d.ts` vor dem Stamp; lokale Typegen-Drift nicht committed.

## 2. Adversarial Fragen

| Frage | Ergebnis |
| --- | --- |
| Wurde produktiver Runtime-Code geändert? | Nein. |
| Wurde eine Migration, RLS, GRANT, REVOKE oder DEFINER angefasst? | Nein. |
| Wurden echte Dokumentdaten, Uploads oder Visa-Provider aufgerufen? | Nein. |
| Wurde eine Account-Platform-Implementation begonnen? | Nein. Nur Vertrag/Backlog als Vorschlag. |
| Wurde Dual-Authority durch eine neue Architektur ersetzt? | Nein. Bestätigt und um Empfehlung≠Identität ergänzt. |
| Wurde ein Default-Pass oder primary citizenship empfohlen? | Nein. Explizit verboten. |
| Wurde `chosenCredentialOptionRef` als Identitäts- oder tripweites Feld vorgeschlagen? | Nein. Nur ADR-0186 Punkt 8 als späterer evaluationsscharfer Vertrag. |
| Wurde Recommendation-UI oder AP-7-S2 als Folgeslice gestartet? | Nein. Backlog sagt ausdrücklich „nicht starten“. |
| Wurde Foundation E zum Neubau erklärt? | Nein. Binding Order §2: nicht neu bauen. |
| Wurden Visa-/Eligibility-Regeln erfunden? | Nein. Provider `null` → `unknown`/`unavailable` dokumentiert. |
| Wurde Guest→Registry als Automatismus vorgeschlagen? | Nein. Opt-in, getrennt vom Trip-Copy. |
| Wurde Collaboration in S2 gemischt? | Nein. Slot L getrennt / blocked. |
| Wurde Ready/Merge empfohlen, dass der Autor es ausführt? | Nein. STOPP für TL. |
| Wurde Generation 2 erfunden, weil der UI-Titel anders ist? | Nein. Generation 1 bleibt 1. |
| Wurden CI/Preview des Task-Commits als Gates dieses Heads behauptet? | Nein. Explizit invalidiert. |
| Wurde Production-Apply oder Live-Supabase behauptet? | Nein. Nicht abgefragt, nicht mutiert. |
| Würde ein späterer Merge die Continuity sofort falsch machen? | Nein, self-expiring: nach Merge = integrierte Audit-Evidence, kein automatisches S2. |

## 3. Schwächen, die der Technical Lead angreifen kann

1. **Kein neuer ADR.** Der Vertrag ist Vorschlag, nicht `DECISIONS.md`. Das ist bewusst, kann aber als zu schwach gelten, wenn der TL einen ADR-019x für die Empfehlung≠Identität-Grenze will.
2. **Plan-Stale-Zeile nicht gefixt.** `ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` S1/#145 bleibt auf `main` falsch, bis ein Continuity-Docs-Slice sie korrigiert. Bewusst nicht in diesem Audit still geändert.
3. **ACTIVE_WORK_STATUS ist ein Shared File.** Dieser Branch setzt den Audit als aktuellen Block. Parallele Branches (#187–#191) haben eigene Wahrheiten. TL integriert zentral.
4. **Protection `403`.** `protected=false` ist letzte dokumentierte Evidence, keine frische API-Bestätigung.
5. **Keine lokale Testausführung dieses Docs-Slices.** Inventar stützt sich auf gelesene Tests + Task-Commit-CI, nicht auf einen neuen `npm test` dieses Heads.
6. **S5-B #182** stand in der Baseline-`ACTIVE_WORK_STATUS`, fehlt in der live offenen PR-Liste. Dieser Audit erklärt das als Drift, reconstructed #182 nicht neu.

## 4. Risiken, die bleiben

- Jemand startet AP-7-S2 oder Recommendation-UI „weil der Backlog existiert“.
- Adapter-PRs schreiben Citizenship in Search-Requests.
- Ein späterer Persistenz-ADR führt `preferredDocument` wieder ein.
- `main` bleibt ungeschützt, falls `protected=false` noch gilt.
- Dieser Stamp erzeugt einen neuen Head und invalidiert `587e58b1`-Gates.

## 5. Urteil des Autors

Scope gehalten. Evidence-basiert. Non-Scope leer. Kanonischer Grundsatz (getrennte Entitäten, Mehrfach-Citizenship/Dokument, Empfehlung überschreibt Identität nicht) ist im Vertrag und Audit festgehalten.

**Unabhängiger Technical-Lead Exact-Head-Review: ausstehend. Dieses Self-Review ersetzt ihn nicht und ist kein PASS.**
