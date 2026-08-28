# Jetnity – AP-7-S1 Dual-Authority Domain Contract Self-Review

Stand: 28. August 2026  
Autor-Agent: **`Cursor-Agent: Account plattform audit vorbereitung 12`**  
Typ: adversarial Self-Review, **kein** unabhängiger Technical-Lead-PASS

## 1. Auftrag gegen Diff

Auftrag: `docs/AP7_S1_DUAL_AUTHORITY_DOMAIN_CONTRACT_TASK_2026-08-28.md`  
Freigabe: `docs/AP7_DUAL_AUTHORITY_PRODUCT_OWNER_APPROVAL_2026-08-28.md`

Geprüft gegen den tatsächlichen Dateisatz: `lib/traveller/account-registry.ts`, Tests, Status, Handoff, ADR-0187, Continuity.

Keine Änderung an `app/`, `components/`, `supabase/migrations`, Grants, RLS, Auth-Config, Branch Protection, UI/CRUD, Provider-Runtime.

## 2. Adversarial Fragen

| Frage | Ergebnis |
| --- | --- |
| Zweites paralleles Traveller-Modell gebaut? | Nein. Semantik und Limits kommen aus Foundation E / `types/trips.ts` / `TRAVELLER_CONTEXT_GRENZEN`. |
| `travellerLegacyLesen` als Registry-Authority missbraucht? | Nein. Legacy-Singular-Ableitung wird abgelehnt. |
| Default-Citizenship oder Default-Pass erzeugt? | Nein. Leere Arrays bleiben leer. `documents[0]` ist keine Wahrheit. |
| Issuer als Citizenship gelesen? | Nein. Nur explizites `citizenshipClientRef`. Fehlt es → `null`. |
| Dangling/duplicate Refs geraten statt rejected? | Nein. Fail-closed. |
| Live-Authority im Snapshot behalten? | Nein. Tiefe Kopie, kein `authority`, kein Provenienz-Link, kein `chosenCredentialOptionRef`. |
| Quelle mutiert? | Nein. Tests prüfen Unverändertheit. |
| Sensible Payloads eingeführt? | Nein. DoB/MRZ/Scan/Nummer/Biometrie/Health sind Deny-Keys. |
| Schema/RLS/Auth/UI/Provider angefasst? | Nein. |
| Ready/Merge empfohlen? | Nein. STOPP für unabhängigen TL-Review. |
| Folgeslice S2 gestartet? | Nein. |
| Sichtbarer Titel als umbenannt behauptet? | Nein. Cloud-Run-Titel bleibt `Dual-authority domain contract`. |

## 3. Risiken, die bleiben

- Strukturelle TypeScript-Zuweisbarkeit von Registry-Objekten zu `TripTraveller`, wenn ein späterer Caller den Helper umgeht.
- Kopierte `id`/`clientRef`-Werte dürfen in S2 keine Live-FK werden.
- `main` `protected=false`.
- Dieses Self-Review erzeugt keinen PASS.

## 4. Urteil des Autors

Der Slice hält den genehmigten Dual-Authority-Vertrag und die Hard-Non-Scope-Grenze. Quality-Gates und Exact Head müssen live gestempelt werden.

**Unabhängiger Technical-Lead-Review: ausstehend. Dieses Self-Review ersetzt ihn nicht und ist kein PASS.**
