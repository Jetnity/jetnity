# Jetnity – PrivacyBee Schweiz Vendor Gate 0 Self-Review

Stand: 29. August 2026  
Autor-Agent: **`Privacy provider integration audit 1`**  
Typ: adversarial Self-Review, **kein** unabhängiger Technical-Lead-PASS  
Cloud-Run: https://cursor.com/agents/bc-294ba965-a57a-4590-a98c-e11f079bc7ae

## 1. Auftrag gegen Diff

Auftrag: korrigierter Task `docs/PRIVACYBEE_VENDOR_GATE0_TASK_2026-08-29.md` (Swiss `privacybee.io`) und Issue #169 auf Draft-PR #171. Baseline `6083ee63`.

Geprüft: Status, Fit/Gap, Integrationsvertrag, dieses Self-Review, Handoff. Nur versionierte Audit-Docs. Keine Runtime, keine Shared Continuity, kein Search #168.

Ein früherer Irrläufer gegen `privacybee.com` wurde **nicht** als Swiss-Truth wiederverwendet. Die Disambiguation steht in Status und Handoff.

## 2. Adversarial Fragen

| Frage | Ergebnis |
| --- | --- |
| Wurde das US-Produkt als Ziel bewertet? | Nein. TARGET ist PrivacyBee AG / `privacybee.io`. |
| Wurde ein Trial/Signup/Order/paid call erzeugt? | Nein. AVV entstünde automatisch – deshalb bewusst kein Trial. |
| Wurde das bestehende PO-Konto geöffnet oder Zugangsdaten angefordert? | Nein. Account-Stand als `account-evidence-required`. Bestehendes Konto ≠ Freigabe. |
| Wurden ALB/AVV akzeptiert? | Nein. Nur gelesen. |
| Wurden User-Daten übertragen oder Runtime geändert? | Nein. |
| Wurde Search #168 / Homepage / AP-7 / DB / Auth angefasst? | Nein. |
| Wurden Shared Continuity-Dateien mutiert? | Nein. |
| Wurden unbelegte Anlage-2-/TOM-/API-Fakten als wahr behauptet? | Nein. `unknown / vendor-confirmation-required`. |
| Wurde CHF 54.90 live re-verifiziert? | Ja, Preis-Seite HTTP 200 am 2026-08-29. |
| Wurden Consumer-US-Preise verwendet? | Nein. |
| Wurden Passport/Scan/MRZ/Biometrie freigegeben? | Nein. |
| Wurde AP-6b dem Vendor zugeordnet? | Nein. First-Party belegt das nicht. |
| Wurde `/terms` als PrivacyBee-Lieferung behauptet? | Nein. |
| Wurde Vendor-„100 % konform“ zu Jetnity-Wahrheit? | Nein. |
| Wurde Integration oder Folgeslice gestartet? | Nein. |
| Ready/Merge empfohlen? | Nein. STOPP für TL-Review. |
| Generation 2 wegen UI-Titel oder Vendor-Korrektur? | Nein. Dieselbe Generation 1 / dieselbe Session. Target-Korrektur (`privacybee.io`, Task-Head `61014e39`) ist bereits in den Deliverables; US-Evidence nicht wiederverwendet. |

## 3. Proaktive Funde, nicht still geschlossen

1. **Server-seitige Lücke ist der eigentliche Fit-Breaker**, nicht der Preis. Jetnity ist kein Durchschnitts-CMS.
2. **Trial = AVV.** Jeder „nur mal testen“-Schritt ist ein Vertragsschluss.
3. **OpenAI im Impressum** ist first-party belegt (mittleres TIA-Residual). Extra-Gate, nicht Kleinigkeit.
4. **ALB 8.6** (keine vertragliche Hack-Meldepflicht) steht in Spannung zu **AVV §9** (48-Stunden-Breach). Legal muss das lesen.
5. **5-Jahre-Exit-Verbot** macht einen späteren Vendor-Wechsel teuer, weil Texte nicht mitgenommen werden dürfen.
6. Cookie-Banner ohne Tracker erzeugt neuen Besucher-PII-Fluss (IP/UA). Heute kein Bedarf.
7. `/terms` bleibt unabhängig vom Vendor eine Legal-Lücke.

## 4. Bewusst nicht getan

- Kein Trial, um hinter Login Anlage 2 zu sehen.
- Kein zweiter CMP-Vendor-Audit.
- Kein Browser-Mount der Scripts.
- Keine TOM-/TIA-PDFs angefordert (wäre Vendor-Kontakt/Aktivierung).

## 5. Residuals

- Authoring-Push invalidiert Prior-Heads.
- `main` `protected=false`.
- Agent-Self-Review ist kein PASS.
- Vendor-Copy kann sich nach 2026-08-29T09:32Z ändern.

## 6. Urteil

Acceptance aus dem korrigierten Task ist aus Autorensicht erfüllt: Swiss-First-Party datiert, Jetnity-Ist rekonstruiert, 16 Fit/Gap-Achsen, Zukunftsvertrag, sensible Daten nicht freigegeben, Kosten `keine` plus belegter Listenpreis, Disambiguation vorhanden, keine verbotene Grenze verletzt.

**Unabhängiger Technical-Lead Exact-Head-Review: ausstehend. Dieses Self-Review ist kein PASS.**
