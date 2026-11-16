# Quarantäne der ursprünglichen 50-Pass-Indexvarianten (16.11.2026)

RESEARCH_ONLY. Die originalen Forschungsdaten und das Archiv bleiben ausserhalb von GitHub; dieser Befund qualifiziert keine Einreiseaussage und verändert weder CH→DE Production noch bereits erzeugte private Länderpakete.

Ein rein lokaler, schreibfreier Lauf des neuen Index-Gap-Auditors mit dem Originalarchiv ergab 204 zweibuchstabige Zielordner (CN-HK und CN-MO bleiben ausserhalb des ISO2-Vertrags). Davon besitzen 143 eine Indexliste mit 50 Datei-/Digestverweisen. 136 sind gegen Originalbytes, Index-Digestmap und tracker.csv vollständig gebunden; sieben sind nicht eindeutig gebunden. Weitere 61 Zielfälle gehören anderen Formen an.

**Sicherheitsblocker:** Alle 136 gebundenen Fälle haben einen unvollständigen vorgeschriebenen Pflichtkern. In 6.800 Passdatensätzen fehlt truth_state_values, in 6.300 medication_import, in je 250 field_provenance_rule und minors_rules. Bei 120 der gebundenen Fälle liegt external_writes zudem in einer nicht kanonischen Repräsentation vor (kein Nachweis, dass Schreiboperationen ausgeführt wurden). Es wurden null Länder neu qualifiziert, akzeptiert oder veröffentlicht.

Der versionierte Offline-Auditor gibt nur Zählungen aus und enthält ausschliesslich synthetische Tests, keine echten Forschungsdaten. Der bereits geprüfte 12-Länder-Bestand bleibt unberührt.

Nächster Schritt: die fehlenden Pflichtkernfelder anhand amtlicher Quellen in einer nachweisbar originalgebundenen, getrennten Ergänzung recherchieren, für ein vollständiges 50-Pass-Zielpaket prüfen und erst danach einen eigenen Indexvertrag freigeben. Keine automatischen Platzhalter, Schema-Lockerung, Legacy-Sidecar-Umgehung, Production-Aktion oder Kundenveröffentlichung.
