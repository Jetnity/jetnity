# Provider S5-B Gate 0 – Agent Self-Review

Stand: 28. August 2026  
Status: **SELF-REVIEW ONLY / REVIEW-FIX FÜR 5453667424 / KEINE FREIGABE / KEIN PASS**  
Agent: `Cursor-Agent: Jetnity provider readiness audit 2`  
PR: https://github.com/Jetnity/jetnity/pull/141  
Gegen: Technical-Lead-Kommentar `5453667424` auf Head `9674a658e697dd4dd1743046911cff1a29305b5c`

Ein Agenten-Self-Review ersetzt keinen unabhängigen Technical-Lead-Re-Review. CI/Vercel auf `9674a658` gelten nicht für den neuen Head.

---

## 1. Scope-Treue

| Verbot | Einhaltung |
| --- | --- |
| Runtime-Implementierung | keine Runtime-Datei geändert |
| Schema / Migration / Supabase | keine |
| RLS / GRANT / REVOKE / SECURITY DEFINER | keine |
| Auth / AAL / Session | keine |
| Provider / Secrets / paid calls | keine |
| S6/S7/S8 / TW-8 Runtime | keine |
| Branch Protection / Ready / Merge / Folgeslice | nicht ausgeführt |
| `ACTIVE_WORK_STATUS.md` | unverändert |
| ADR-0168 umdeuten | nicht; nur Fehlzuordnungen im Gate-0-Text korrigiert |

Nur die vier Docs aus dem Gate-0-Satz.

---

## 2. Die vier Findings – Korrekturprüfung

| # | Forderung | Wo korrigiert | Residual |
| --- | --- | --- | --- |
| 1 | Keine globale Unique `(domain, provider_id, external_ref)` | Options C/A Refresh-Zeilen; Status §5.5; Handoff | Lookup-Index ohne Unique bleibt erlaubt und ist nicht gebaut |
| 2 | Actor ≠ Principal ≠ persistierte Provenance | Status §5.1–5.3; Options C-Idee; Schema-Fit §3.3 | Task-Datei nennt weiter `guest` / privileged path als zu unterscheidende Actors — das ist der Gate-0-Auftrag, nicht ADR-0168. Der Status trennt die Ebenen jetzt. Task nicht umgeschrieben (außerhalb Review-Fix). |
| 3 | Quote → `persisted_snapshot` | Status §5.4; Options C Mint-Regel + Empfehlung | Nur Konzept. Kein Runtime. |
| 4 | Residual auf alle Nicht-Flight-Kinds | Status PATH E/F/B, §5.6, TW-8, `S5B-G0-P2-01`; Options A/D | Transfer/Rental-Betrag bleibt User-Intake. Production-Katalog vom TL zitiert, von diesem Agenten nicht live wiederholt. |

---

## 3. Adversarial Prüfung der Korrektur

### 3.1 Habe ich Unique nur umbenannt?

Nein. Der Text sagt ausdrücklich: dieselbe Ref darf auf mehreren Items stehen; Ownership ist `trip_item_id`; Match gilt zwischen bestehender und vorgeschlagener Provenance **desselben** Items.

### 3.2 Habe ich Actor trotzdem persistiert?

`CommercialProvenance` hat kein Actor-Feld. Die Matrix ist Write-Time. `guest` und privilegierter Serverpfad stehen unter Runtime-Kanälen. Eine optionale Audit-Spalte ist als Nicht-S5-A markiert.

### 3.3 Könnte jemand `live_api` in der DB als Current Quote lesen?

Der Übergang sagt: Mint nur aus serverseitig validierter Quote; persistierte Form ist `persisted_snapshot` / `persistenz='snapshot'`. Ein Folgeslice, der `live_api` 1:1 speichert, würde gegen diesen Vertrag verstoßen. Das ist bewusst dokumentiert, nicht implementiert.

### 3.4 Ist Transfer/Rental-User-Intake zerstört?

Nein. Betrag/Währung bleiben erlaubt. Untrusted sind Provider/Ref/URL. `S5B-G0-P2-01` sagt das explizit.

### 3.5 Hätte der Residual P0 sein müssen?

Weiter nein: owner-scoped, kein Live-Provider, UI disclaimed. Klasse bleibt P2 residual + Pre-S5-B-Write-Gate. Der Scope ist jetzt vollständig (Nicht-Flight inkl. `note`).

### 3.6 Task-Datei unangetastet

Der versionierte Auftrag listet `guest` und `privileged server path` unter „Actors/Sources unterscheiden“. Das bleibt der Untersuchungsauftrag. Die Korrektur steht in Status/Options: diese beiden sind Kanäle, keine `CommercialAkteur`. Die Task nicht umzuschreiben vermeidet stilles Umschreiben der Authority.

---

## 4. Was dieser Review nicht geprüft hat

- Live-Supabase-Katalog (TL hat das unabhängig getan; dieser Agent nicht wiederholt)
- Exact-Head CI/Vercel des Review-Fix-Commits — müssen neu gaten
- Runtime-Verhalten (unverändert)

---

## 5. Rest-Risiken

1. Ein Folgeslice könnte Unique auf Provider+Ref trotzdem bauen. Handoff verbietet das ausdrücklich.
2. Ein Folgeslice könnte Actor in die Provenance-Zeile legen und ADR-0168 still erweitern.
3. `S5B-G0-P2-01` bleibt ein Production-P2 und ein Pre-Provider-Hard-Truth-Gate.
4. Branch Protection zuletzt `protected=false`; nicht verändert.

---

## 6. Verdict des Autors

Die vier Review-Findings sind in den Gate-0-Docs konsistent korrigiert. Scope bleibt Docs-only. TW-8 bleibt geschlossen.

**Kein PASS. Kein Ready. Kein Merge.**

Unabhängiger Technical-Lead-Re-Review auf dem neuen Exact Head ist erforderlich.
