# Jetnity – Engineering Excellence Standard

Stand: 25. August 2026  
Status: **verbindliche Product-Owner-Vorgabe**

## Leitprinzip

Jetnity muss hervorragend gebaut werden. Geschwindigkeit ist wichtig, aber niemals wichtiger als Produktqualität, Datenwahrheit, Sicherheit, Wartbarkeit und eine klare Nutzererfahrung.

Für jeden relevanten Slice, jede Funktion und jede technische Entscheidung gilt:

- **Produktqualität:** Funktionen müssen einen klaren Nutzwert haben, verständlich sein und zur Jetnity-Zielarchitektur passen. Keine Feature-Wand, keine unnötige Komplexität in der Oberfläche.
- **Engineering-Qualität:** produktionsreifer, verständlicher, typisierter und wartbarer Code; keine Demo-/Placeholder-Architektur als Endzustand; keine unnötigen Duplikate oder Schattenmodelle.
- **Datenwahrheit:** `unknown` bleibt `unknown`; Error, Empty, Stale, Unavailable, Ungeprüft und Clean bleiben getrennt. Keine erfundenen Preise, Verfügbarkeiten, regulatorischen Aussagen, Safety- oder Provider-Health-Zustände.
- **Security & Privacy:** Least Privilege, klare Ownership/RLS/Auth-Grenzen, keine Service-Role-Abkürzungen im Produktpfad, sensible Daten nur nach ausdrücklich freigegebenem Modell.
- **Traveller-Kontext:** mehrere Reisende, mehrere Staatsbürgerschaften und mehrere Dokumente dürfen in keiner relevanten Funktion still auf einen ersten/default Pass reduziert werden.
- **UX:** Mobile, Tablet und Desktop müssen professionell funktionieren. Mehr Bildschirmfläche darf mehr Komfort bieten, aber keine widersprüchliche Produktlogik erzeugen.
- **Accessibility:** Fokusführung, Tastaturbedienung, Screenreader-Grundlagen, `hidden`/`inert`, Touch-Ziele und semantische Struktur gehören zur Definition von fertig.
- **Performance:** keine unnötigen Provider-/Netzwerkaufrufe, Lazy-/Mount-/Cache-Verhalten bewusst gestalten, Bundle-/Render-/Query-Kosten beobachten.
- **Tests & Evidence:** relevante Unit-, Integrations-, UI-/E2E- und Regressionstests; Typecheck, Lint, Hygiene, Production Build, Exact-Head CI und Vercel-Evidence. Grün allein ersetzt keinen fachlichen Review.
- **Review-Tiefe:** jeder Slice erhält adversarial Self-Review und unabhängigen Technical-Lead-Review gegen Scope, Architektur, Truth, Security, UX, Cross-Domain-Integrität und bekannte Risiken.
- **Keine stillen Kompromisse:** Wenn eine schnelle Lösung einen später teuren Architektur-, Security-, Daten- oder UX-Schaden erzeugt, wird sie nicht als fertig akzeptiert. Ein besserer Ansatz wird vorgeschlagen und kontrolliert umgesetzt.
- **Proaktive Verbesserung:** Agenten und Technical Lead sollen hochrelevante Defekte, Risiken und klare Qualitätsverbesserungen selbst erkennen und melden. Scope-Erweiterungen erfolgen kontrolliert, nicht heimlich.

## Definition of Done

Ein Slice ist nur dann technisch fertig, wenn:

1. der vereinbarte Scope vollständig und nachvollziehbar umgesetzt ist;
2. bekannte P0/P1-Probleme im Scope gelöst oder ausdrücklich als Folgeauftrag dokumentiert sind;
3. keine neue Fake-Truth, Shadow-Truth oder unklare Autorität entstanden ist;
4. relevante Geräte-/Accessibility-/Security-/Guest-vs-Account-/Multi-Citizenship-Fälle geprüft sind;
5. Tests und vollständige Exact-Head-Gates erfolgreich sind;
6. ein unabhängiger Technical-Lead-Review die Implementierung tatsächlich geprüft hat;
7. Dokumentation, Handoff und nächster Schritt den realen Stand widerspiegeln.

## Priorität

Bei Konflikten gilt grundsätzlich:

**Korrektheit & Sicherheit → Datenwahrheit → Produktklarheit/UX → Wartbarkeit → Performance → Entwicklungsgeschwindigkeit.**

Ausnahmen sind nur zulässig, wenn der Technical Lead sie fachlich begründet und kein besonderes Product-Owner-Gate verletzt wird.

## Geltung

Dieser Standard gilt verbindlich für ChatGPT/Technical Lead, alle Cursor-Agenten und neue Chats. Er ergänzt `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`, `docs/JETNITY_BINDING_BUILD_ORDER.md` und bestehende Domain-/Review-Standards. Er darf nur durch eine spätere ausdrückliche Product-Owner-Entscheidung wesentlich abgeschwächt werden.
