# ADR-0197 – Provider S5-B nimmt Option C als Zielarchitektur an

Stand: 29. August 2026  
Status: **ACCEPTED TARGET ARCHITECTURE / PERSISTENCE TRANSLATED BY ADR-0198 IN REPO / NO PRODUCTION APPLY / NO TW-8**  
Volltext-Kurzform auch in [DECISIONS.md](../DECISIONS.md) ADR-0197.

S5-A bleibt unverändert ADR-0168. Dieser ADR deutet ADR-0168 nicht um.

---

## Entscheidung

1. Commercial Provenance wird später in einer **eigenen provider-neutralen Relation** an `trip_item_id` persistiert.
2. Der erste persistente Vertrag ist **ein aktueller Snapshot pro `trip_item`**. Quote-History / 1:n wird nicht vorgebaut.
3. Persistiert wird S5-A-**Evidence**. `CommercialBewertung` wird zur Lesezeit mit `nowMs` neu berechnet.
4. Persistierte Provider-Truth entsteht nur aus einer serverseitig validierten Quote als `sourceKind='persisted_snapshot'` / `persistenz='snapshot'`.
5. Legacy ohne Provenance-Zeile bleibt `unknown`. Kein Backfill. Legacy-Flachfelder werden keine zweite Provider-Hard-Truth.
6. Guest→Account mintet keine Provider-Provenance. Kein Service Role im Produktpfad.
7. Dieser ADR autorisiert **keine** Tabelle, Migration, RLS, GRANT/REVOKE, SECURITY DEFINER, Runtime, Provider-Aktivierung oder TW-8.

Der vollständige Vertrag steht in `docs/PROVIDER_S5B_OPTION_C_TARGET_ARCHITECTURE_2026-08-29.md`.

## Kontext

Gate 0 / PR #141 hat Optionen A–D untersucht und Option C empfohlen, aber bewusst nicht angenommen. TW-8 bleibt hinter Provider S5 und realer Commercial-Provenance-Evidence. Der Technical Lead wählt Option C jetzt als technische Zielrichtung innerhalb des bestehenden S5-A-Shared-Contracts.

## Alternativen

1. *Option A – additive Spalten.* Querybar, aber unter heutigem Owner-Write eine Namenslüge.
2. *Option B – Metadata-JSON.* Höchstes Dual-Truth- und Bypass-Risiko; verletzt den Route-Metadata-Vertrag.
3. *Option D – ephemeral + User-Intake.* Ehrliche Härte gegen Direct-DML, aber kein persistierter S5-A-Vertrag und kein TW-8-Pfad.
4. *Nichts annehmen.* Würde den nächsten Persistenzslice ohne festen Vertrag starten.

## Begründung

S5-A ist zu reich für die fünf Legacy-Handelsfelder. `trip_items` ist bereits ein gemischter Trust-Store. Eine eigene Relation kann SELECT owner-only und WRITE privileged trennen, ohne Service-Role, ohne globale Unique auf Provider+Ref und ohne Flight-/Hotel-Semantik zu vermischen.

## Konsequenzen

- Zielarchitektur ist angenommen. Implementation ist **nicht** gestartet.
- Production-Migration / RLS / privilegierte Writes bleiben besondere Product-Owner-Gates.
- TW-8 bleibt geschlossen.
- Autor-Agent stoppt, solange PR #180 offen ist, für unabhängigen Technical-Lead Exact-Head-Review. Nach Merge ist diese Stopp-Klausel historisch. Self-Review ist kein PASS.
