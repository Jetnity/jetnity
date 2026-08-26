# Jetnity – TW-6 Runtime – Create-Entry Alignment

Stand: 26. August 2026  
Agent: **`Trip workspace audit architecture`**  
Branch: `feat/tw6-create-entry-alignment`  
Typ: **RUNTIME / Product-Owner-Option 1**  
Baseline: `main @ 71230c280b1cd2500d224095fa84f4472101d31f`

`docs/ACTIVE_WORK_STATUS.md` wird in diesem Slice **nicht** geändert.

## 1. Ziel

TW-6 macht den Einstieg zur Reiseerstellung klar, ehrlich und minimal.

Verbindliche Produktwahrheit:

- eine Reise, eine Oberfläche;
- für Gäste maximal eine aktive Gastreise;
- kein dritter Create-Pfad;
- kein erfundener Startflughafen;
- keine Citizenship-/Pass-Erhebung beim Reise-Create;
- keine versteckte Nutzerentscheidung;
- bestehender Guest-One-Trip-Vertrag bleibt erhalten;
- bestehender Guest→Account-Vertrag bleibt unangetastet;
- D0-2 / SEO-Origin-Vertrag bleibt unangetastet.

## 2. Genehmigte Option

Product-Owner-Option 1 aus dem TW-6-Dependency-Audit (PR #75, Merge `5ef981ecd7f761294bcbb691d6cf966395f7ce97`):

- Guest-Speicher und Guest→Account nicht anfassen;
- Tempo-/Interessen-Chips entfernen, damit die UI nicht behauptet, der Nutzer habe `balanced` gewählt;
- Persistenz darf den SQL-Default `balanced` weiter schreiben;
- bei bestehender Gastreise keinen zweiten Create suggerieren;
- Homepage-Handoff `zielId` / optional `idee` behalten;
- `/planen`-Metadata/robots nicht anfassen;
- Reiseidee bleibt der bestehende zweite Create-UI-Weg, kein dritter Pfad;
- weitere Ziele nur über bestehende Trip-/Stage-Wahrheit.

## 3. Scope

- Create-Einstiege ehrlich ausrichten (Homepage-Generika, Navbar, Footer, 404, `/reisen` Gast, `/planen`);
- Guest-One-Trip-UX: kein „Neue Reise“, wenn eine aktive Gastreise existiert;
- Fail-fast vor Modell-/Ortsbestätigung, wenn der Gast-Slot belegt ist;
- Tempo-/Interessen-Chips entfernen;
- Vorbelegung nur aus wirklich vorhandenen Daten; fehlender Origin bleibt fehlend.

## 4. Non-Scope

Nicht ändern:

- Guest→Account-Transferlogik;
- Account-Registry;
- Traveller Shared Contract;
- Citizenship-/Pass-Architektur;
- Route-/Transit-Shared-Contract;
- Provider;
- Commercial Surfaces / TW-8;
- TW-7;
- DB-Schema, RLS, Auth/MFA/AAL, Payments;
- `/planen` Metadata, robots, sitemap, Canonical-/Origin-Vertrag;
- D0/G0;
- `docs/ACTIVE_WORK_STATUS.md`.

Wenn ein Shared Contract geändert werden müsste: dokumentieren und STOPP.

## 5. STOPP

Nach Self-Review, Tests und Exact-Head-Gates:

- NICHT Ready setzen;
- NICHT mergen;
- KEIN TW-7;
- KEIN TW-8;
- KEINEN Folgeslice selbst starten.

Unabhängiger Review: ChatGPT / Technical Lead.
