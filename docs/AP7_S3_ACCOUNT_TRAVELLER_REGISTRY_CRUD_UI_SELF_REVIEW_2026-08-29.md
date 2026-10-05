# Jetnity – AP-7-S3 Account Traveller Registry CRUD / UI Self-Review

Stand: 29. August 2026  
Autor-Agent: **`Cursor-Agent: Account plattform audit vorbereitung 17`**  
Typ: adversarial Self-Review, **kein** unabhängiger Technical-Lead-PASS

## 1. Auftrag gegen Diff

Auftrag: AP-7-S3 Runtime/UI auf Draft-PR #215, Task `docs/AP7_S3_ACCOUNT_TRAVELLER_REGISTRY_CRUD_UI_TASK_2026-08-29.md`.

Baseline-Re-Fetch: `origin/main` = `b2857117741aad47a2bca3d198e5a0a88b4a0415` (0 behind).

Geprüft gegen den tatsächlichen Dateisatz dieses Stamps, nicht gegen Chat-Absicht.

## 2. Adversarial Fragen

| Frage | Ergebnis |
| --- | --- |
| Wurde ein Schema/RLS/Grant geändert? | Nein. Keine neue Migration. Bestehende S2-SQL unverändert. |
| Gibt es Service Role oder privilegierten Bypass? | Nein. `createServerComponentClient` / `createServerActionClient` + `auth.getUser()`. |
| Wird ein Trip Snapshot geschrieben? | Nein. Kein `party_schreiben`, keine Projektion, kein Trip-Import-CTA. |
| Wird Guest-Kontext still zur Registry? | Nein. |
| Empty als Error oder Error als Empty? | Nein. `lese()` trennt die Fälle; Loading-Route nutzt eigene Copy. |
| Default/first citizenship or passport? | Nein. Dokumenttyp startet leer. Zuordnung startet leer, auch bei einer Staatsbürgerschaft. |
| Issuer = Citizenship? | Nein. Getrennte Felder, keine Ableitung. |
| Sensitive Felder eingeführt? | Nein. Keine Nummern, Scans, MRZ, Biometrie, DOB, Health-Inputs. |
| Delete impliziert Reise-Löschung? | Nein. Copy und Success-Text sagen das Gegenteil. |
| Citizenship-Delete verliert Dokumente? | Nein. DB `SET NULL`; UI zeigt danach „Keine Zuordnung“. |
| Ready/Merge/Folgeslice? | Nein. STOPP für unabhängigen TL-Review. |

## 3. Risiken, die bleiben

- Ohne authentifizierten Preview-Klick bleibt mobile/a11y real-device Evidence residual.
- Hand-aligned `types/supabase.ts` kann von einem späteren `db:typen` umformatiert werden; fachlich müssen die drei S2-Tabellen erhalten bleiben.
- Unbegrenzte Owner-Liste: S2 hat kein Account-Traveller-Maximum.
- Dieses Self-Review erzeugt keinen PASS.

## 4. Urteil des Autors

Der Slice bleibt im autorisierten Runtime/UI-Rahmen. Dual-Authority ist in Copy und Code gehalten. Lokale Gates sind grün. Exact-head GitHub Actions `33276012303` und Vercel Preview `8K9aEMNJGGzjE5Cs4nhZT48knA12` sind SUCCESS auf `376023b5502be495115119adb06cb16340317f16`.

**Unabhängiger Technical-Lead-Review: ausstehend. Dieses Self-Review ersetzt ihn nicht und ist kein PASS.**
