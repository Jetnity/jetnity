# ADR-0167 – Trip Workspace TW-5 Item- und Gap-Details

Stand: 25. August 2026  
Status: **angenommener Technical-Lead-Entscheidungsrahmen für TW-5; Runtime noch nicht implementiert**  
Owner: `Trip workspace audit architecture`  
Baseline: `main` `bee9f653d7d83dfbafbf9b9c1da6385433071a4a`

## 1. Kontext

TW-1 bis TW-4 sind integriert. Der Workspace besitzt heute:

- eine gemeinsame Mobile/Desktop-Shell;
- eine Reiseübersicht;
- `Jetzt wichtig` als fail-closed Attention-Ableitung;
- eine Etappen-/Tages-Timeline;
- bestehende Flächen für Flugbestand, Unterkunftsbestand sowie on-demand eingebettete Flug-/Hotel-/Aktivitäten-/Mobilitätssuchen.

Die aktuelle Runtime trägt jedoch noch die Übergangs-IA aus TW-1: `TripWorkspaceNavigation` präsentiert `Übersicht / Flüge / Unterkunft / Aktivitäten / Mobilität` als gleichrangige Reisebereiche. `TripWorkspaceUebersicht` und `TripWorkspaceJetztWichtig` wechseln bei Coverage-/Attention-Aktionen lediglich in einen solchen Domain-Bereich. Timeline-Items selbst öffnen noch kein fachlich kontextuelles Detail.

Das widerspricht dem angenommenen Workspace-Zielbild, nach dem Flüge, Unterkunft, Aktivitäten und Mobilität **Systeme innerhalb einer Reise** sind und keine konkurrierenden Haupt-Apps. Domain-Suche soll aus einer konkreten Lücke oder einem konkreten Item heraus erreichbar sein.

TW-5 ist der kontrollierte Übergang von der Domain-Navigation zu Item-/Gap-Details. Er erzeugt **keine neue fachliche Wahrheit**.

## 2. Entscheidung

### 2.1 Eine Reise bleibt die primäre Oberfläche

Die Hauptorientierung des Workspace bleibt:

1. Reisekopf
2. `Jetzt wichtig`
3. Reise-/Coverage-Überblick
4. Etappen-/Tages-Timeline
5. kontextuelles Detail bzw. Werkzeug **nur nach Nutzeraktion**

Die Domain-Leiste `Übersicht / Flüge / Unterkunft / Aktivitäten / Mobilität` darf im TW-5-Zielzustand nicht mehr die primäre Nutzersprache des Workspace sein.

### 2.2 Detailzustand ist Presentation-State, keine Truth

TW-5 darf einen kleinen workspace-lokalen Detailzustand einführen. Dieser speichert ausschließlich **Referenzen und UI-Intent**, zum Beispiel:

- Detailart: `item` oder `gap`;
- Domain/Kind: Flight, Stay, Activity, Mobility;
- vorhandene `itemId`, `dayId` oder `stageId`, soweit real vorhanden;
- optional die auslösende bestehende Signal-/Coverage-ID;
- ob die bestehende Suche ausdrücklich geöffnet wurde.

Dieser Zustand:

- wird nicht in DB/Supabase persistiert;
- erzeugt keinen neuen Trip-/Booking-/Provider-/Coverage-/Attention-Fakt;
- kopiert keine Preis-, Availability-, Visa-, Safety- oder Provider-Truth;
- darf bei Graph-Mutationen nur auf weiterhin vorhandene Referenzen zeigen; ungültige Referenzen fallen deterministisch auf die Reiseoberfläche zurück.

Die fachlichen Inhalte werden bei Renderzeit aus dem bestehenden `Trip`/Graphen und den vorhandenen Domain-Ableitungen gelesen.

### 2.3 Zwei legitime Einstiege

**Gap-Detail**

Eine bestehende Coverage-/Attention-Lücke wie offene Flugstrecke oder fehlende Unterkunftsnacht darf ein kontextuelles Detail öffnen. Dieses erklärt ehrlich:

- welche bestehende Ableitung die Lücke trägt;
- welche Etappe/Tage betroffen sind, wenn dies aus vorhandener Evidence bestimmbar ist;
- was der nächste Nutzer-Schritt ist;
- ob eine Suche überhaupt verfügbar/eingebettet ist.

**Item-Detail**

Ein vorhandener Timeline-Punkt darf ein Detail öffnen, das ausschließlich vorhandene Item-Fakten zeigt und eine passende vorhandene Domain-Fläche bzw. Aktion anbietet.

Für `note` gibt es keinen erfundenen Commercial-/Provider-Kontext. Für manuelle Items bleibt Herkunft/Trust-Level ehrlich.

### 2.4 Suche bleibt lazy und explizit

Der Initial-Render einer Reise darf keine kommerzielle Suche starten.

Eine vorhandene Suchfläche wird erst gemountet, wenn der Nutzer eine passende Gap-/Item-Aktion ausdrücklich öffnet. Ein einmal gemounteter Suchzustand darf entsprechend der bestehenden TW-1-Lazy-Mount-Semantik erhalten bleiben, sofern dadurch keine erneuten Calls ausgelöst oder fremden Providerverträge verändert werden.

Kein stiller Suchparameter darf erfunden werden. Insbesondere:

- kein stilles `ZRH` oder anderes Herkunfts-/Airport-Default;
- keine Destination aus Wohnsitz, Sprache, Domain oder Citizenship erfinden;
- bei unvollständigem Suchkontext bleibt der Zustand unvollständig und fordert nötigen Nutzerkontext an.

### 2.5 Bestehende Domain-Komponenten wiederverwenden, nicht duplizieren

TW-5 darf bestehende Komponenten wie `FlugBestand` und `UnterkunftBestand` sowie die bereits von außen eingebetteten Suchflächen wiederverwenden und nur so weit kapseln/komponieren, wie für ein kontextuelles Detail nötig.

Kein zweiter Flight-/Hotel-/Activity-/Mobility-Datenstack und keine zweite Booking-/Coverage-Ableitung.

### 2.6 Mobile/Desktop: gleiche Zustandsmaschine

Mobile/Tablet:

- Detail als klarer Abschnitt, Sheet oder Unteransicht derselben Reise;
- Rückkehr führt deterministisch zur vorherigen Reiseoberfläche;
- Fokus wird sinnvoll gesetzt und bei Schließen zurückgegeben.

Desktop:

- dieselbe Detailauswahl und dieselben Inhalte;
- mehr Fläche darf als Master/Detail genutzt werden;
- keine separate Desktop-IA oder zweite State Machine.

Die konkrete Präsentationsform darf der Agent innerhalb des Design Systems bestimmen, solange Logik und Accessibility identisch bleiben.

## 3. Truth- und Trust-Regeln

TW-5 darf niemals einen besseren Zustand zeigen als die vorhandene Evidence trägt.

Verbindlich:

- `unknown` ≠ `stale` ≠ `error` ≠ `unavailable` ≠ `insufficient_context`;
- eine offene Coverage-Lücke ist nicht automatisch Provider-Unavailability;
- ein manuell eingetragener Flug ist kein nachgewiesenes Providerangebot;
- Preis wird nur gezeigt, wenn er bereits am Item/Evidence-Vertrag vorhanden und zulässig ist;
- keine Fake-Verfügbarkeit;
- keine Fake-Provider-Health;
- keine neue Official-/Visa-/Safety-/Seasonal-Truth;
- LLM erzeugt keine Hard Truth.

## 4. Shared-Contract-Grenzen

TW-5 darf **nicht** ändern:

- Auth / Identity / Sessions / MFA / AAL;
- RLS / Ownership / Guest→Account;
- Traveller-Kernmodell / Multi-Citizenship / Multi-Document;
- Route / Transit Shared Contracts;
- Privacy / Consent;
- Billing / Payment;
- Admin Audit / Capabilities;
- Provider Activation / Secrets / Cost Guards;
- Attribution / Revenue / Claims Truth;
- Guardian / Simulator / Value-Impact-Verträge.

Falls die gewünschte UX nur mit einer Änderung an einem dieser Contracts korrekt möglich wäre: **STOPP**, Evidence dokumentieren, Technical Lead entscheidet einen separaten Slice.

Der aus TW-4 bekannte mögliche Citizenship-only-Credential-Option-Contract bleibt außerhalb von TW-5.

## 5. Datenbank / Provider / Kosten

TW-5 ist ein UI-/Presentation-/Workspace-Integrationsslice.

Nicht erlaubt ohne neues Gate:

- Migrationen;
- neue Tabellen/Spalten;
- RLS-Änderungen;
- neue API-Secrets;
- Live-Provider-Aktivierung;
- paid provider calls;
- neue laufende Infrastrukturkosten;
- Production-Migration oder Production-Datenänderung.

Die Development-Migrationen `20260824160000` und `20260824180000` bleiben nicht Production-approved und sind kein TW-5-Auftrag.

## 6. Erwartete Touch Areas

Primär zulässig:

- `components/trips/TripWorkspace*.tsx`
- `lib/trips/arbeitsbereich.ts` bzw. ein kleiner neuer workspace-lokaler Presentation-Helper plus Tests
- vorhandene Workspace-Audit-Fixtures/Assertions
- gezielte Trip-Workspace-Dokumentation

Nur falls für die Präsentation zwingend und ohne Contract-Umbau:

- `FlugBestand` / `UnterkunftBestand` kleine prop-/presentationbezogene Erweiterungen

Nicht anfassen ohne STOPP/Lead-Entscheid:

- `lib/readiness/engine.ts`
- `lib/safety/`
- `lib/seasonal/`
- `lib/route/`
- Provider-Ops/Nachweis-/Activation-Verträge
- Account-/Admin-Routen
- Homepage-/Marketing-Runtime
- Supabase-Migrationen

## 7. Acceptance-Architektur

Ein PASS ist nur möglich, wenn mindestens folgende fachlichen Pfade belegt sind:

1. **Flight Gap** öffnet ein ehrliches kontextuelles Detail; keine Suche vor expliziter Nutzeraktion.
2. **Stay Gap** ebenso.
3. **Activity** ist kein erfundener Pflicht-Gap nur wegen `0 Aktivitäten`; vorhandene Activity-Items können als Items geöffnet werden, und eine explizite Aktivitätensuche bleibt on-demand.
4. **Mobility** respektiert `unknown`/offen/covered-by-flight und täuscht keinen Live-Adapter vor.
5. **Timeline Item** öffnet ein Item-Detail, ohne den gewählten Tag zu verlieren.
6. **Ungeplantes Item** kann geöffnet werden, ohne einen erfundenen Tag/Stage zu erzeugen.
7. **Graph mutation** entfernt oder verschiebt ein selektiertes Item → Detail-State bleibt nicht auf einer toten Referenz hängen.
8. **Guest/Account** nutzen dieselbe Presentation-Logik; Capability-/Trust-Grenzen bleiben ehrlich.
9. **Mobile/Desktop** verwenden dieselbe Ableitung und denselben Detailzustand.
10. **Lazy Mount**: Initialansicht mountet keine Commercial-Suche; explizites Öffnen mountet nur die angeforderte Fläche.
11. **Accessibility**: 44px/11 Tailwind-Minimum, Keyboard/Fokus, sinnvolle Labels/Expanded/Controls, kein fokussierbarer Inhalt in verborgenen/inerten Flächen.
12. **Keine zweite Wahrheit**: Detailzustand enthält IDs/Intent, keine kopierten Hard Facts.

## 8. Nicht-Ziele

TW-5 implementiert nicht:

- TW-6 Create-Entry / Multi-Destination;
- TW-7 Hub/Archiv;
- TW-8 Commercial Provenance;
- TW-9 finalen Polish-/Closure-Audit;
- Guardian;
- What-if-Simulator;
- Value Optimizer;
- echte Provider;
- Homepage/Growth/SEO;
- Native App.

## 9. Review- und Merge-Regel

Agent implementiert auf `feat/trip-workspace-tw5-item-gap-details`, führt adversarial Self-Review und vollständige Exact-Head-Gates aus und stoppt.

Danach unabhängig durch ChatGPT/Technical Lead:

- fachlicher Truth-/UX-/Security-/Privacy-/Integration-Review;
- Diff gegen den aktuellen `main`;
- offene Threads;
- Exact-Head CI/Vercel;
- bei fortgeschrittenem `main` Synchronisation und vollständiges Re-Gating.

Erst nach PASS darf der normale scope-treue PR gemäß Technical-Lead-Autonomy Policy Ready/Merge werden.