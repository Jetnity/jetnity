# Jetnity – Trip Workspace TW-5 Status

Stand: 25. August 2026  
Status: **DRAFT-PR #66 OFFEN – CONTROL-DOC STOPP; Runtime-Implementierung noch nicht gestartet**  
Agent: `Trip workspace audit architecture`  
Branch: `feat/trip-workspace-tw5-item-gap-details`  
Draft-PR: #66  
Baseline: `bee9f653d7d83dfbafbf9b9c1da6385433071a4a`

## 1. Zweck

TW-5 – **Item- und Gap-Details** verbindet vorhandene Workspace-Truth mit kontextuellen Details und on-demand Werkzeugen. Domain-Flächen werden aus Reise-/Coverage-/Attention-/Item-Kontext geöffnet und dürfen nicht länger die primäre gleichrangige Workspace-IA bilden.

Verbindliche Dokumente:

- `docs/ADR_0167_TRIP_WORKSPACE_TW5_ITEM_GAP_DETAILS.md`
- `docs/TRIP_WORKSPACE_TW5_TASK.md`
- `docs/TRIP_WORKSPACE_IMPLEMENTATION_PLAN.md`
- `docs/TRIP_WORKSPACE_TARGET_ARCHITECTURE.md`
- `docs/TRIP_WORKSPACE_DEPENDENCY_MATRIX.md`
- `JETNITY_START_HERE.md`
- `JETNITY_HANDOFF.md`
- `docs/ACTIVE_WORK_STATUS.md`

## 2. Baseline / Continuity

Vor TW-5 wurde der post-TW-3-Continuity-Drift in PR #65 korrigiert.

Verifizierte Integration:

- PR #64 / TW-3: merged
- PR #65 / post-TW-3 Continuity: merged
- aktueller TW-5-Baseline-`main`: `bee9f653d7d83dfbafbf9b9c1da6385433071a4a`
- TW-5-Branch wurde auf diesen `main` fast-forward synchronisiert.
- Draft-PR #66 wurde auf diesem Branch eröffnet.

Control-Doc-Head vor dieser Statusnachführung: `6b0ea2a7c805350f8d96163e3d7c361c535555d7`.

Keine Runtime-Änderung ist Bestandteil dieses Statuspunktes.

## 3. Ist-Audit vor Agent-Start

Auf der Baseline wurde live geprüft:

- `TripWorkspace.tsx` hält `bereich` als Client-State und rendert `TripWorkspaceNavigation`.
- `TripWorkspaceNavigation.tsx` zeigt `Übersicht`, `Flüge`, `Unterkunft`, `Aktivitäten`, `Mobilität` als sticky gleichrangige Buttons.
- `TripWorkspaceUebersicht.tsx` öffnet bestehende Coverage-Flächen über `onBereich`.
- `TripWorkspaceJetztWichtig.tsx` hat `AttentionAktion` aktuell als Bereichswechsel.
- `TripWorkspacePlan.tsx` rendert Etappen/Tage/Planpunkte; Items selbst öffnen noch kein Detail.
- bestehende Commercial-/Search-Flächen werden bereits lazy per Bereichsbesuch gemountet und sollen diese Eigenschaft behalten.
- `FlugBestand` und `UnterkunftBestand` existieren und sollen wiederverwendet werden.

Architekturfolgerung:

TW-5 muss **keinen neuen Datenstack** bauen. Es braucht eine kleine workspace-lokale Detail-/Intent-Schicht und eine UI-Komposition, die vorhandene Wahrheit kontextuell öffnet.

## 4. Harte Grenzen

Keine:

- DB/Migration/RLS/Auth/Identity;
- Traveller-/Citizenship-/Document-Neumodellierung;
- Route-/Transit-Contract-Änderung;
- Provider-Activation/Secrets/paid calls;
- Fake-Preise/Fake-Verfügbarkeit/Fake-Provider-Health;
- neue Official/Safety/Seasonal Truth;
- stillen Airports/Herkunftsdefaults;
- neuen `trips.status`;
- Guardian/Simulator/Value;
- TW-6+;
- Homepage/Marketing/Growth;
- Production-Aktivierung.

## 5. Shared Contracts

Kein Shared-Contract-Change ist für den geplanten TW-5-Ansatz erforderlich.

Weiterhin Technical-Lead-kontrolliert:

- Auth/Identity/Sessions/MFA/AAL/RLS/Ownership;
- Guest→Account;
- Traveller/Multi-Citizenship/Multi-Document;
- Route/Transit;
- Privacy/Consent;
- Billing/Payment;
- Admin Audit/Capabilities;
- Provider Activation;
- Attribution/Revenue/Claims Truth;
- Guardian/Simulator/Value Contracts.

Möglicher Citizenship-only-Credential-Option-Contract bleibt ausdrücklich außerhalb von TW-5.

## 6. Datenbank / Kosten / Production

- keine TW-5-Migration vorgesehen;
- keine neuen Secrets vorgesehen;
- keine neuen laufenden Kosten vorgesehen;
- keine paid provider calls vorgesehen;
- kein Production-Gate derzeit offen.

Supabase Development-Migrationen `20260824160000` und `20260824180000` bleiben nicht Production-approved und unberührt.

## 7. Aktueller STOPP-Punkt

Control Docs und Draft-PR #66 sind vorbereitet. **Jetzt ist der manuelle Cursor-Start erforderlich.**

Nächste Schritte:

1. `Trip workspace audit architecture` in Cursor mit `docs/TRIP_WORKSPACE_TW5_TASK.md` und ADR-0167 starten.
2. Agent verifiziert zuerst Branch, Draft-PR #66, aktuellen `main` und den Ist-Code.
3. Agent implementiert ausschließlich den freigegebenen Scope.
4. Agent führt adversarial Self-Review + vollständige Exact-Head-Gates aus.
5. Agent aktualisiert diesen Status mit Runtime-Head, Tests, CI/Vercel, Risiken und offenen Punkten.
6. **STOPP** für unabhängigen ChatGPT/Technical-Lead-Re-Review.

Bis zu Schritt 1 gibt es keinen Runtime-Code von TW-5.

## 8. Review-Risiken, die der Agent gezielt prüfen muss

- Übergangs-Domain-Navigation darf nicht als zweite primäre IA bestehen bleiben.
- Entfernen der Domain-Navigation darf die Auffindbarkeit vorhandener Funktionen nicht verschlechtern.
- Detail-State darf keine Hard Facts kopieren.
- `AttentionAktion` darf nicht in einen Cross-Domain-Truth-Contract ausufern.
- Timeline-Item-Interaktion darf Delete/Tag-Auswahl nicht brechen.
- `ohneTag` darf keinen Fake-Tag erzeugen.
- Commercial-Suchen dürfen nicht eager mounten.
- zurück/focus/hidden/inert müssen Mobile/Desktop/a11y sauber sein.
- lange Texte und 280px dürfen nicht overflowen.
- Guest/Account dürfen keine zwei Produktlogiken bekommen.

## 9. Ready/Merge

Aktuell ausdrücklich:

**Kein Ready. Kein Merge. Kein TW-6.**

Ready/Merge erst nach vollständigem Agent-Evidence-Paket und unabhängigem Technical-Lead-PASS auf dem exakten finalen Head.