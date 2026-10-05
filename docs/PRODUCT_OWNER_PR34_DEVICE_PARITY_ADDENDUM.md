# PR #34 Product-Owner Addendum – Geräte- und Viewport-Parität

Stand: 22. August 2026  
Status: **verbindliche Product-Owner-Entscheidung für die laufende Abnahme**

Dieses Addendum ergänzt `docs/PRODUCT_OWNER_PR34_ACCEPTANCE_NOTES.md` und insbesondere die Qualitätsanforderungen für den Trip Workspace.

## Verbindliche Entscheidung

Alle während der Product-Owner-Abnahme festgelegten psychologischen, logischen, funktionalen und intelligenten Produktprinzipien gelten **für jede unterstützte Bildschirmgröße und jedes Gerät**.

Das umfasst insbesondere:

- kleine und große Smartphones
- Tablets
- Laptops
- Desktop-Bildschirme
- Hoch- und Querformat, soweit unterstützt
- Web/PWA und spätere native Oberflächen, sofern dieselbe Funktion dort angeboten wird
- Touch-, Maus- und Tastaturbedienung, soweit relevant

## Was gleich bleiben muss

Responsives Design darf die Darstellung anpassen, aber nicht die Produktlogik verändern.

Auf allen unterstützten Geräten müssen gleich bleiben:

- fachliche Reise-Wahrheit
- Statusbegriffe und Statusbedeutung
- Entscheidungs- und Freigabelogik
- Hard-Facts-vs.-Soft-Preferences-Logik
- Änderungsprinzip und Nutzerkontrolle
- wichtige Warnungen, Empfehlungen und Auswirkungen
- Kernfunktionen und ihre Erreichbarkeit
- Cross-Domain-Logik zwischen Flügen, Unterkunft, Aktivitäten, Mobilität, Readiness und weiteren relevanten Bereichen

Zusätzlich verbindlich:

- **Ansicht und Benutzererlebnis müssen auf jedem Gerät logisch und durchschaubar sein.**
- Der Nutzer muss auf Smartphone, Tablet, Laptop und Desktop innerhalb weniger Sekunden verstehen können: Wo bin ich? Was ist wichtig? Was ist der aktuelle Zustand? Was sollte ich als Nächstes tun?
- Die Informationshierarchie muss je Viewport aktiv gestaltet werden. Mobile darf nicht lediglich eine zusammengedrückte Desktop-Ansicht sein; Desktop darf nicht nur eine auseinandergezogene Mobile-Ansicht sein.
- Navigation, Hauptbereiche, Rückwege, Status, Primäraktionen und wichtige Warnungen müssen je Gerät eindeutig auffindbar und psychologisch richtig priorisiert sein.
- Zusammengehörige Informationen müssen auch visuell zusammengehörig wirken. Kein Viewport darf durch Kartenbruch, horizontales Scrollen, überdeckte Elemente, zu viel Leerraum oder zu hohe Informationsdichte die fachliche Logik verschleiern.
- Unterschiedliche Darstellungsformen sind ausdrücklich erlaubt und erwünscht, wenn sie die jeweilige Bildschirmfläche besser nutzen. Die **mentale Struktur** und die **Nutzerkontrolle** bleiben dennoch dieselben.
- Ein Nutzer, der Jetnity auf einem anderen Gerät öffnet, soll sich sofort wieder zurechtfinden und nicht das Gefühl haben, ein anderes Produkt oder einen anders aufgebauten Workflow zu benutzen.

Mobile darf Details progressiver öffnen und Desktop mehr gleichzeitig zeigen. Das darf aber nie dazu führen, dass derselbe Nutzer auf einem anderen Gerät eine andere fachliche Aussage, eine andere Entscheidung, weniger Kontrolle **oder eine unklarere Nutzerführung** erhält.

## Review-Pflicht

Jeder aus der laufenden Product-Owner-Abnahme entstehende Implementierungs-Amendment muss eine geeignete Geräte-/Viewport-Matrix enthalten.

Mindestens sind die relevanten neuen Zustände auf schmalem Smartphone, größerem Smartphone/Tablet-Kontext und Desktop zu prüfen; bei gerätespezifischen Risiken zusätzlich reale Hardware bzw. relevante Browser.

Dabei wird nicht nur auf technische Responsiveness geprüft, sondern ausdrücklich auf:

- Orientierung und Verständlichkeit
- Informationshierarchie
- Auffindbarkeit von Navigation und Rückwegen
- Sichtbarkeit und Priorität der Primäraktion
- logische Gruppierung zusammengehöriger Inhalte
- Scroll-/Sticky-/Overlay-Verhalten
- Lesbarkeit und Bedienbarkeit
- gleiche fachliche Bedeutung und Nutzerkontrolle

Ein grüner Test auf nur einer Bildschirmklasse reicht nicht als vollständige Abnahme.

Leitsatz:

> **Gleiche Reise. Gleiche Wahrheit. Gleiche Nutzerkontrolle. Gleich verständlich auf jedem Gerät.**

Diese Entscheidung ist zusätzlich global im verbindlichen `docs/UX_INFORMATION_ARCHITECTURE_STANDARD.md` verankert.

## Gate

- kein Merge ohne ausdrückliche Product-Owner-Freigabe
- kein Mark Ready aufgrund dieses Addendums
- keine Production-Migration durch dieses Addendum
- Umsetzung erst nach Abschluss der laufenden Product-Owner-Abnahme und verbindlichem Implementierungs-Amendment
