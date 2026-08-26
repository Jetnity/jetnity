# Jetnity – TW6-A Runtime – Create-Entry Alignment

Stand: 26. August 2026  
Agent: **`Trip workspace audit architecture`**  
Branch: `feat/tw6-create-entry-alignment`  
Typ: **RUNTIME / Product-Owner-Option 1 / TW6-A Create-Entry**  
Baseline nach Sync: `main @ 2468160ede5cf8cfcc96fb59cc1346ebd6b0fa21`

`docs/ACTIVE_WORK_STATUS.md` wird in diesem Slice **nicht** geändert.

## 1. Ziel

TW6-A macht den Einstieg zur Reiseerstellung klar, ehrlich und minimal.

Das ist **nicht** das gesamte TW-6. Progressive weitere Ziele / Stage-Create
bleiben ein eigener TW-6-Rest.

Verbindliche Produktwahrheit:

- eine Reise, eine Oberfläche;
- für Gäste maximal eine aktive Gastreise;
- Konten dürfen mehrere Reisen anlegen;
- kein dritter Create-Pfad;
- kein erfundener Startflughafen;
- keine Citizenship-/Pass-Erhebung beim Reise-Create;
- keine versteckte Nutzerentscheidung;
- bestehender Guest-One-Trip-Vertrag bleibt erhalten;
- bestehender Guest→Account-Vertrag bleibt unangetastet;
- D0-2 / SEO-Origin-Vertrag bleibt unangetastet.

## 2. Genehmigte Option

Product-Owner-Option 1 aus dem TW-6-Dependency-Audit (PR #75), in diesem PR nur
als **Create-Entry-Schnitt (TW6-A)**:

- Guest-Speicher und Guest→Account nicht anfassen;
- Tempo-/Interessen-Chips entfernen, damit die UI nicht behauptet, der Nutzer habe `balanced` gewählt;
- Persistenz darf den SQL-Default `balanced` weiter schreiben;
- bei bestehender Gastreise keinen zweiten Create suggerieren;
- generische CTAs sind sitzungsfest: Konto bleibt Create, auch mit Rest-Gastspeicher;
- Homepage-Handoff `zielId` / optional `idee` behalten;
- `/planen`-Metadata/robots nicht anfassen;
- Reiseidee bleibt der bestehende zweite Create-UI-Weg, kein dritter Pfad;
- Fail-fast vor jedem netz-/kostenrelevanten Guest-Create-Schritt.

## 3. Scope

- Create-Einstiege ehrlich ausrichten (Homepage-Generika, Navbar, Footer, 404, `/reisen`, `/planen`);
- Guest-One-Trip-UX: kein „Neue Reise“, wenn eine aktive Gastreise existiert;
- Fail-fast vor Modell-/Ortsbestätigung und vor Guest-Übernehmen;
- Tempo-/Interessen-Chips entfernen;
- Vorbelegung nur aus wirklich vorhandenen Daten; fehlender Origin bleibt fehlend.

## 4. Bewusst offen – TW-6-Rest, kein Closure

Nicht in diesem PR und nicht still als erledigt:

- progressive weitere Ziele / zusätzliche `trip_stages` im Create;
- TW-7 Hub-Anschluss;
- TW-8 Commercial Surfaces.

Keine neue Stage-Architektur in TW6-A.

## 5. Non-Scope

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

## 6. STOPP

Nach Self-Review, Tests und Exact-Head-Gates:

- NICHT Ready setzen;
- NICHT mergen;
- KEIN TW-7;
- KEIN TW-8;
- KEINEN Folgeslice selbst starten.

Unabhängiger Review: ChatGPT / Technical Lead.
