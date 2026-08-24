# Jetnity – Provider Readiness S2 / FlugNachweis

Stand: 24. August 2026  
Status: **Runtime implementiert / Gates und Technical-Lead-Review ausstehend**  
Branch: `feat/provider-flight-evidence-s2`  
Base: `main` @ `01761eb9ba80828e87ca2da201901e0e211e1719`  
Vorgänger: PR #47 / S1 Shared Operational Contract – **MERGED / Technical Closure**

## 1. Auftrag

Implementiere ausschließlich **S2 – FlugNachweis**. Ziel ist, die Flug-Kontoübernahme und jede kommerzielle Flug-Persistenz auf dieselbe Trust-Grenze wie Hotels zu heben: **Browserdaten dürfen keine kommerzielle Flugwahrheit persistieren.**

Der bestehende Provider-Ops-Vertrag aus S1 ist zu verwenden. Kein zweiter Operations-/Failure-/Cost-Guard-Stil.

## 2. Verbindlicher Zielvertrag

### Browser / Client

Der Browser darf für die Übernahme einer gewählten Flugoption nur die notwendigen Identifikatoren senden, insbesondere:

- `tripId`
- `dayId`
- `optionId`

Keine vom Browser gelieferte kommerzielle Flugwahrheit darf als Nachweis gelten. Insbesondere sind Browserwerte wie Preis, Zeiten, `externalRef`, Provider, Währung oder vorgeformte Flugoptionen **nicht** vertrauenswürdig.

### Server

Führe einen klaren `FlugNachweis` analog zur bestehenden Hotel-Nachweisgrenze ein.

Der Server muss die `optionId` gegen den zugehörigen serverseitig belegten Suchkontext bestätigen. Der Nachweis muss mindestens den relevanten Kontext binden:

- Legs / Route
- Passagieranzahl bzw. Traveller-Zusammensetzung, soweit heute Teil des Flug-Suchvertrags
- Kabine
- angeforderte Währung
- verfügbare/noch gültige Option

Nur das serverseitig bestätigte Ergebnis darf in die bestehende Trip-/Flug-Persistenz übergehen.

`booking_url` bleibt `null`.

### Guest

Der Guest-Pfad darf keine kommerzielle Provider-Flugoption aus Browser-/LocalStorage-Daten als belegte Wahrheit persistieren. Wenn derselbe Nachweisvertrag im Guest-Kontext nicht sauber erfüllbar ist, muss der Pfad bewusst **fail-closed** bleiben.

Guest → Account darf eine unbewiesene Flugoption niemals nachträglich zu belegter kommerzieller Wahrheit hochstufen.

## 3. Sicherheits- und Truth-Grenzen

Verbindlich:

- keine Browser-Preis-/Zeit-/Ref-Persistenz als Provider-Wahrheit
- kein Vertrauen in `externalRef`, Providername oder zusätzliche Clientfelder
- keine Route-Heuristik als Ersatz für Nachweis
- Route Truth bleibt bei der bestehenden Foundation-D-Kanonisierung; S2 baut keine zweite Route Truth
- keine Traveller-/Account-/Billing-Truth neu modellieren
- keine sensitiven Providerdaten, Tokens, Payloads oder Secrets in Fehlern/Observability
- S1-Allowlist für Observability beibehalten
- S1-Cost-Guard-Port nicht umgehen

## 4. Nicht in S2

Ausdrücklich verboten:

- kein Live-Duffel
- kein echter Provider-Adapter
- keine Provideraktivierung / kein Production-Flag auf `true`
- keine Secrets oder API-Keys
- keine Verträge / keine kostenpflichtigen Calls
- kein Offer-Booking / kein Affiliate-Flow
- kein persistenter/globaler Cost Guard (S6)
- keine Mobility-/Rental-Nachweise (S3)
- keine Readiness-/Safety-Operationsarbeit (S4)
- keine Offer-Provenance-/Stale-Arbeit außer was minimal für den Nachweis zwingend nötig wäre; sonst stoppen und Technical Lead informieren (S5)
- keine DB-/Production-Migration, keine RLS-/Auth-/MFA-/AAL-/Capability-Änderung ohne neuen ausdrücklichen Auftrag
- keine Homepage-, Account- oder Admin-Featurearbeit

Wenn eine saubere S2-Lösung einen Shared-Contract-Fix außerhalb dieses Scopes erfordert: **stoppen, Befund dokumentieren, nicht still erweitern.**

## 5. Implementierungsrichtung

1. Lies zuerst:
   - `JETNITY_HANDOFF.md`
   - `docs/ACTIVE_WORK_STATUS.md`
   - `DECISIONS.md` – insbesondere ADR-0154 / Provider Ops
   - bestehende Hotel-Nachweisimplementierung und Tests
   - bestehende Flight Search / Auswahl / Persistenz / Guest→Account-Wege
   - `lib/provider-ops/*`

2. Identifiziere exakt alle Wege, auf denen eine Browser-`FlugOption` oder deren kommerzielle Felder heute in Trip-/Account-Persistenz gelangen können.

3. Baue **eine** kanonische serverseitige `FlugNachweis`-Grenze. Keine parallele zweite Nachweisform.

4. Alle Schreib-/Übernahmepfade müssen durch diese Grenze gehen oder fail-closed sein.

5. Behalte Public HTTP-Semantik und bestehende Foundation-Truths bei, soweit der neue Nachweis keine explizit notwendige Änderung erfordert.

## 6. Pflichtregressionen

Mindestens folgende Fälle müssen mit automatisierten Tests belegt werden:

1. Browser manipuliert Preis → persistierter Wert kommt nicht aus dem Browser / Übernahme fail-closed.
2. Browser manipuliert Abflug-/Ankunftszeit → kein Vertrauen / kein Persistieren als Nachweis.
3. Browser manipuliert `externalRef` / Provider / Zusatzfelder → kein Einfluss auf belegte Option.
4. `optionId` gehört zu anderem Suchkontext / anderen Legs → reject/fail-closed.
5. Passagierkontext driftet → reject/fail-closed.
6. Kabine driftet → reject/fail-closed.
7. Währung driftet → reject/fail-closed; keine Gleichsetzung verschiedener Currency-Truth.
8. Option unavailable oder abgelaufen → reject/fail-closed.
9. Guest-/LocalStorage-Manipulation darf keine kommerzielle Flugwahrheit persistieren.
10. Guest → Account darf keinen unbewiesenen Flugdatensatz aufwerten.
11. `booking_url` bleibt `null`.
12. Fehler enthalten keine Secrets/Tokens/Rohpayloads.
13. Route-Fingerprint / Route Truth bleibt mit Foundation D konsistent.
14. Bestehende Hotel-Nachweis- und Provider-Ops-Regressionen bleiben grün.

## 7. Gates

Vor Übergabe an den Technical Lead:

- relevante neue Unit-/Contract-/Integrationstests grün
- vollständiges `npm test` grün
- Typecheck grün
- Lint grün
- Hygiene (`check:dead`, `check:exports`, `check:deps`, `check:schema-bezug`) grün
- `check:api-schutz` grün
- Production Build Exit 0
- falls UI/Browserpfade betroffen sind: relevanter UI-Audit in WebKit + Chromium auf den etablierten Viewports
- GitHub Actions **SUCCESS auf dem exakten Runtime-Head**
- Vercel Preview **READY auf demselben Runtime-Head**

Docs-only Nachträge nach einem gegateten Runtime-Head sind als Docs-only zu kennzeichnen und dürfen nicht als neues Runtime-Gate ausgegeben werden.

## 8. Dokumentation / Handoff

Am Ende mindestens:

- eigener S2 Status
- eigener S2 Handoff
- Self-Review
- `docs/ACTIVE_WORK_STATUS.md`
- `JETNITY_HANDOFF.md`
- relevante Architektur-/ADR-Nachträge nur wenn wirklich nötig

Dokumentiere:

- exakten Runtime-Head
- exakte Tests/Gates
- welche Persistenzpfade jetzt serverseitig nachgewiesen oder fail-closed sind
- offene Restpunkte
- Security/DB/Kosten-Grenzen

## 9. Governance

Dieser Auftrag autorisiert **nur S2**.

- PR bleibt Draft
- **kein Mark Ready** ohne ausdrückliche aktuelle Product-Owner-Freigabe
- **kein Merge** ohne ausdrückliche aktuelle Product-Owner-Freigabe
- **kein S3** ohne neuen Auftrag
- keine Production-Migration
- keine Provider-/Secret-/Kostenaktivierung

Nach vollständiger Implementierung + Exact-Head-Gates: **STOPP** und auf den unabhängigen ChatGPT/Technical-Lead-Review warten.
