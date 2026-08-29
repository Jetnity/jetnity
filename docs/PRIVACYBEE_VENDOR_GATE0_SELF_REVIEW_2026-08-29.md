# Jetnity – PrivacyBee Schweiz Vendor Gate 0 Self-Review

Stand: 29. August 2026  
Autor-Agent: **`Privacy provider integration audit 1`**  
Typ: adversarial Self-Review nach TL `5057555199`, **kein** unabhängiger Technical-Lead-PASS  
Cloud-Run: https://cursor.com/agents/bc-294ba965-a57a-4590-a98c-e11f079bc7ae  
Generation: **1** (unmittelbarer Review-Fix, keine neue Arbeitseinheit)

## 1. Auftrag gegen Diff

Auftrag: nur Review-Fix `5057555199` auf Draft-PR #171 / Head `f97cb97a`. Baseline unverändert `6083ee63`. Swiss `privacybee.io` only.

Geprüft nach dem Fix: Task, Status, Fit/Gap, Integrationsvertrag, Handoff, dieses Self-Review. Nur versionierte Audit-Docs. Keine Runtime, keine Shared Continuity, kein Search #168, kein Login/Trial.

## 2. Adversarial Fragen

| Frage | Ergebnis |
| --- | --- |
| Wurde das öffentliche VVZ inventarisiert statt als „nicht öffentlich“ belassen? | Ja. `/de-ch/verarbeitungsverzeichnis/` und `/verarbeitungsverzeichnis/` HTTP 200 am 2026-08-29T09:49Z; 16 benannte Einträge. |
| Wurde das VVZ als identisch mit Anlage 2 v1.1 behauptet? | Nein. Identität **nicht** bewiesen (`vendor-confirmation-required`). |
| Wurde die de-CH-AVV-Anomalie fail-closed behandelt? | Ja. `Offizielle Version` / `Nach Patent Ochsner` + Mundart-Duplikat live beobachtet. Ursache nicht geraten. Klasse **`source-integrity/vendor-confirmation-required`**. |
| Wurde die sauberere de-DE-AVV-URL als kanonisches CH-Dokument erklärt? | Nein. Nur als Kontrast beobachtet. |
| Wurden öffentliche AVV-/TIA-Sätze weiter als unqualifizierte Rechtsgrundlage geführt? | Nein. Herabgestuft auf beobachtet / source-integrity. |
| Wurde ein Trial gestartet, „um Anlage 2 hinter Login zu sehen“? | Nein. Frühere Self-Review-Zeile war falsch begründet: das VVZ ist öffentlich. Korrigiert. |
| Wurde das PO-Konto geöffnet? | Nein. Bestätigungspfad = Account-Kopie durch PO (`account-evidence-required`). |
| Wurde ALB/AVV akzeptiert oder Runtime geändert? | Nein. |
| Wurde Search #168 / Shared Continuity / US-`privacybee.com` als Ziel angefasst? | Nein. |
| Ready/Merge empfohlen? | Nein. STOPP für neuen unabhängigen TL-Review. |

## 3. Was vorher falsch war

Der Authoring-Stand vor `5057555199` klassifizierte Anlage-2-Namen als „nicht im öffentlichen Fliesstext“ und begründete den fehlenden Trial mit „Anlage 2 hinter Login“. Das öffentliche Verarbeitungsverzeichnis war first-party auffindbar und wurde nicht inventarisiert. Das war ein Evidence-Defekt, kein Runtime-Defekt.

Die de-CH-AVV-Source-Integrity-Anomalie war ebenfalls nicht als Residual geführt, obwohl der formale Text und das Mundart-Duplikat auf derselben URL liegen (inkl. `og:description`).

## 4. Proaktive Funde, nicht still geschlossen

1. **Heroku** steht im VVZ als Host **aller AVV-§2-Daten** (inkl. Consent/IP). Das ist der wichtigste neue Subprocessor-Residual für eine spätere Anbindung.
2. Vendor-Marketing-Tracker (Hotjar, Amplitude, GA/Ads, Meta) gelten laut VVZ für **privacybee.io**, nicht automatisch für Jetnity.
3. TIA-Residual „mittel“ steht nur im AVV-Text und erbt deshalb die Source-Integrity-Klasse. OpenAI als benannter US-Processor ohne DPF bleibt unabhängig über das VVZ belegt.
4. Server-seitige Jetnity-Lücke, `/terms`, fehlende Controller-Adresse und Trial=AVV bleiben unverändert.

## 5. Bewusst nicht getan

- Kein Login, kein Trial, kein Vertrag/DPA-Accept, keine Credentials.
- Keine Spekulation, ob Patent Ochsner Crawl, CMS-Leak oder absichtliche Publikation ist.
- Keine Gleichsetzung VVZ = Anlage 2.
- Kein Folgeslice, kein Ready/Merge.

## 6. Residuals

- Dieser Push invalidiert `f97cb97a` / `902efc96`.
- `main` `protected=false`.
- Agent-Self-Review ist kein PASS.
- Vendor-Copy kann sich nach 2026-08-29T09:49Z ändern.

## 7. Urteil

Die beiden Blocking-Findings aus `5057555199` sind aus Autorensicht gegen live First-Party-Evidence korrigiert. Fit-Empfehlung bleibt: **jetzt nicht aktivieren**.

**Unabhängiger Technical-Lead Exact-Head-Review: erneut ausstehend. Dieses Self-Review ist kein PASS.**
