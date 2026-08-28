# Jetnity – AP-7 Gate 0 Self-Review

Stand: 28. August 2026  
Autor-Agent: **`Cursor-Agent: Account plattform audit vorbereitung 11`**  
Typ: adversarial Self-Review nach CHANGES REQUIRED `5455299179`, **kein** unabhängiger Technical-Lead-PASS

## 1. Auftrag gegen Diff

Auftrag: nur Review-Fixes gegen Exact Head `a0ef801fd7fa39685fab9a1fe69d411f736ea78c`. Keine Runtime.

Geprüft gegen den tatsächlichen Dateisatz: `ARCHITECTURE.md`, Status, ADR-0186, Handoff, Account-Plan-Nachtrag, dieses Self-Review.

Keine Änderung an `app/`, `components/`, `lib/`-Runtime, `supabase/migrations`, Grants, RLS, Auth-Config, Branch Protection.

## 2. Adversarial Fragen

| Frage | Ergebnis |
| --- | --- |
| Wurde der stale Satz `S2–S5 und AP-6–AP-12 bleiben ungebaut` belassen? | Nein. `ARCHITECTURE.md` nennt AP-5-S2 / PR #137 integriert; nur S3–S5 ungebaut/nicht automatisch gestartet; AP-6–AP-12 bleiben ungebaut/gated. AP-7-Gate-0-Wording bleibt. |
| Wurde `chosenCredentialOptionRef` als trip-weites Snapshot-Feld belassen? | Nein. Aus Status, ADR-0186 und Plan-Nachtrag entfernt. |
| Bleiben alle Credential-Optionen first-class? | Ja. |
| Wurde eine zukünftige Wahl als globaler Traveller-/Trip-Default neu erfunden? | Nein. Nur ein späterer trip-scoped, kontext-/evaluations-scharfer Vertrag oder bewusst unspezifiziert; route-weit nur bei expliziter Evidence. |
| Wurde AP-7-Runtime, Schema oder RLS gebaut? | Nein. |
| Wurde ein Default-Pass oder Default-Citizenship empfohlen? | Nein. Explizit verboten. |
| Wurde Ready/Merge empfohlen? | Nein. STOPP für unabhängigen TL-Re-Review. |
| Wurde Generation 12 erfunden? | Nein. Sichtbarer Titel bleibt `Account traveller registry architecture`, non-blocking. |

## 3. Risiken, die bleiben

- Ein späterer Implementierungs-ADR könnte `chosenCredentialOptionRef` wieder als trip-weites Feld einführen, wenn dieser Review-Fix nicht gelesen wird.
- Dual-Authority bleibt Empfehlung, keine PO-Freigabe.
- Dieser Review-Fix erzeugt einen neuen Head und invalidiert alle Prior-Gates inkl. `a0ef801f`.
- `main` `protected=false` unverändert.

## 4. Urteil des Autors

Die zwei Findings aus `5455299179` sind in den betroffenen Docs nachgezogen. Non-Scope gehalten.

**Unabhängiger Technical-Lead-Re-Review: ausstehend. Dieses Self-Review ersetzt ihn nicht und ist kein PASS.**
