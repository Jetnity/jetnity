# Native Abnahme für den gebundenen CH→DE-Abschluss

**Nur Plan. Nicht ausgeführt und nicht durch die beiden verbrauchten Read-Gos freigegeben.** Keine Anweisung in dieser Datei ist ein Ausführungsauftrag.

## 1. Erste Schranke: bestehende native Autorität

Der Zielread hat den direkten `postgres`-Zugriff auf Jobs-Ausführung/CAS und UPDATE als nicht erlaubt belegt. Vor jedem weiteren Aufbau muss ein bereits vorhandener geschützter Weg mit geeigneter Autorität aus den exakten Quell- und nativen Funktionsverträgen hergeleitet werden. Ein Kandidat darf nicht durch neue Grants, SET ROLE, Eigentümerwechsel, ACL-/RLS-Änderungen, eine privilegierte Hilfsfunktion zur Umgehung oder Secret-Export hergestellt werden.

Relevante Quellen am unveränderlichen Quellcommit `86238b2c34011554c05353ddf6f9f764e92fd6ca`:

| Quelle | Prüfzweck |
| --- | --- |
| `lib/readiness/official-truth-product-v3/jobs/selected-claim.ts` | Deterministische Cycle12-Enqueue-/Job-/Claim-Identitäten; keinen neuen Job aus alten IDs erzeugen. |
| `scripts/db/official-truth-v3-customer-information-1/atomic-claim-definitions.sql` | Normaler Claim-/Mutate-Vertrag, abgelaufene Lease, Tokenpflicht und CAS/Confirmation. |
| `scripts/db/official-truth-v3-background-guard-1/parts/owner.sql` | Echter Owner/AAL2-Vertrag, Replay/Kollision, unveränderliche Quittung; ursprünglicher Erstversuchsfall ersetzt Cycle12 nicht. |
| `scripts/db/official-truth-v3-background-guard-1/parts/state.sql` | Unveränderliche Owner-/Retirementtabellen, Daten- und Katalogschutz. |
| `scripts/db/official-truth-chde-at-renewal-dev-20261121/dev-cycle5-owner-retirement-v6.CANDIDATE-ROLLBACK.sql` | Nur Muster für genaue Auswahl, Zustandserhaltung und Bestätigung. Temp-GRANT/SET-ROLE-Pfad ausdrücklich ausgeschlossen. |
| `scripts/db/official-truth-v3-production-import-schedule-1/core.sql` | Bestehender Altblocker, neue Zyklus-/HTTP-Erzeugung, natürliche Cron-Abwicklung und Quoten. |

Byte-/Git-/SHA-256-Bindungen stehen in `SOURCE_PROVENANCE.json`; die beim Read beobachteten nativen Definitionen und ACL-/Konfigurationshashes stehen in `TARGET_BINDINGS.json`. Das Vorhandensein einer Quellfunktion beweist nicht ihre identische Installation oder Mutationsberechtigung.

Fehlen für einen tatsächlichen vorhandenen Hilfspfad erforderliche native Definitionen oder Metadaten, muss zuerst ein neues eng gebundenes Lese-/Prüfpaket mit eigenem Go vorbereitet werden. Der abgeschlossene Cycle12-Read darf nicht wiederholt oder erweitert werden. Eine direkte native Prüfung kann erst nach gesonderter Autorisierung stattfinden.

## 2. Prüfaufbau nach separater Freigabe

Eine isolierte PG17-Prüfumgebung bildet den beobachteten Rollen-/ACL-/RLS-Vertrag und den exakt korrelierten historischen Zustand nach. Sie darf keine neuen Hosted- oder Production-Schreibrechte voraussetzen. Private Original-/Token-/Ownerdaten werden weder aus Production exportiert noch als erfundene echte Belege ausgegeben. Synthetische Negativfälle müssen sichtbar synthetisch bleiben. Ein positiver realer Ownerpfad benötigt eine echte freigegebene Dev-Owner/AAL2-Sitzung über den vorhandenen Zugang; keine nachgebauten Claims, keine TOTP-/Passkey-Änderung.

Vor dem Test bindet das Prüfprotokoll insbesondere Zyklus-/Dispatchdigests, Subject-/Current-job-Digests, Revision 38, Zähler 13/38, den einen offenen Versuch, Intake-Digest, zwei Archivoriginale und drei alte Owner-Operationen. Fehlt ein hierfür tatsächlich notwendiger Bestandteil in den erlaubten Beobachtungsdaten, ist das ein offener Input-Gate; kein verdeckter zusätzlicher Live-Read.

## 3. Erforderliche native Fälle

| Fall | Erwartung und Nachweis |
| --- | --- |
| N01 – tatsächlicher Autoritätspfad | Der zulässige vorhandene Akteur erreicht den eng begrenzten nativen Abschluss ohne GRANT/SET ROLE/ACL-/RLS-Änderung. Andernfalls STOP; kein erzwungener Positivfall. |
| N02 – falscher Zyklus/Job/Claim | Jede einzelne abweichende ID oder Zeilendigest führt vor Mutation zum Abbruch. |
| N03 – fehlende/falsche/abgelaufene Owner-Sitzung | Review, niedrigster Mutator und Bestätigung verweigern; keine Quittung, kein Jobdelta. |
| N04 – echter Owner/AAL2-Positivfall | Die tatsächliche autorisierte Dev-Sitzung erzeugt genau eine passende Quittung; Actor und Sitzung werden nur intern geprüft, nicht exportiert. |
| N05 – Zustandsänderung zwischen Review und Abschluss | CAS verweigert geänderten Current-job-/Subject-/Archive-/Ownerdigest; vollständiges Rollback. |
| N06 – identischer Replay und Kollision | Identischer Replay liefert dieselbe Quittung ohne erneute Mutation; gleiche Operation mit anderem Selektionsdigest oder Actor verweigert. |
| N07 – Konkurrenz | Zwei wirklich parallele Abschlussversuche erzeugen höchstens eine gültige Quittung/einen Abschluss; keine nur sequenzielle Simulation als Parallelbeleg. |
| N08 – Bewahrung der Historie | Cycle12 und neun Dispatches bleiben byte-/feldgleich, ebenso zwei Originale, Referenzen und drei alte Owner-Operationen. |
| N09 – keine Quoten-/ID-Abkürzung | Keine Rücksetzung von Starts/Operationen/Versuchen, kein nextval/setval, kein Entfernen des HTTP-ID-Allocators; der exakt zugelassene native Delta wird vor dem Installationsreview benannt. |
| N10 – geschlossenes Dispatch-Gate | Nach Installation und auch nach echtem Abschluss bei fälligem Cron kein neuer Zyklus/Dispatch/HTTP-Auftrag; Ergebnis `closed_waiting_restart_approval`. |
| N11 – fremder Altblocker | Ein zusätzlicher blockierter anderer Zyklus verhindert weiterhin Starts; Cycle12-Quittung deckt ihn nicht ab. |
| N12 – Katalogschutz | Nur ausdrücklich benannte Objektdeltas zulässig; Scheduler vollständig erfasst; fremder Funktions-/Owner-/ACL-/Konfigurationsdelta verweigert. |
| N13 – Probe/Installation/Rücknahme | Vollständiges Rehearsal-Rollback und unabhängige Nachlese; dann einzeln freigegebene Installation/Post-Commit-Nachlese. Nach COMMIT Rücknahme nur separat gebunden, fail-closed und historienerhaltend. |
| N14 – erneuerte BG1-Beweisführung | Echter natürlicher vollständiger Beleg nach neuem Cutoff; fehlender/abgelaufener Beleg sperrt Owner-/Neustartpfad. Kein manuelles Audit als Ersatz. |
| N15 – getrennte Einmal-Neustartautorisierung | Ohne eigene Autorisierung kein Start. Nach separat freigegebenem Prüfszenario atomar höchstens ein neuer Zyklus mit begrenzter Fortsetzung; kein zweiter neuer Zyklus. Dieses Szenario gehört nicht zur bloßen Abschlussfreigabe. |
| N16 – Kundenwahrheit | Kein positiver Einreisefakt aus einem unbekannten Abschluss; ohne qualifizierte Quellen/Methode bleibt „derzeit nicht verfügbar“. |

Für jeden tatsächlich ausgeführten Fall werden Start-/Endzeit, exakte Version, Akteurklasse, erwartete/erhaltene Werte und unveränderte Rechte aufgezeichnet. Fehlende Fälle sind offen, keine Skips als PASS. Der ursprüngliche 503-Auslöser darf nicht aus dem erfolgreichen Abbau eines Altblockers abgeleitet werden.

## 4. Ausgang der Abnahme

Erst nach Autoritätsnachweis, echter nativer Prüfung und unabhängigem Review entstehen endgültige, vollständig gebundene SQL-Dateien für Probe, Nachlese, Installation und Schutz/Rücknahme. Ihr eigener Go-Text nennt die dann tatsächlichen SHA-256 und Reihenfolge. Owner-Abschluss und Einmal-Wiederanlauf bleiben getrennte spätere Entscheidungen. Eine Veränderung des gemeinsamen BG1-Vorgängers durch AT verlangt neue Bindung und neue Prüfung.
