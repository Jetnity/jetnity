# Jetnity – AP-5-S3 Self-Review

Stand: 29. August 2026  
Autor-Agent: **`Account plattform audit vorbereitung 13`**  
Typ: adversarial Self-Review, **kein** unabhängiger Technical-Lead-PASS

## 1. Auftrag gegen Diff

Auftrag: Issue #153 / AP-5-S3 only.

Geprüft: Scope-Mapping `local`/`others`/`global`, Zustandsmodell, Fehler nicht als Erfolg, `others` zerstört die lokale Sitzung nicht, allgemeines Abmelden bleibt unscoped/global, keine Sessionliste/Sessionzahl, kein JWT-Kill-Claim, keine Service Role, keine Migration/RLS/Auth-Config, S1/S2 unverändert, Tests, Continuity.

Keine Migration. Kein `supabase/config.toml`-Write. Kein RLS/Identity. Kein S4/S5. Kein Consumer-AAL2.

## 2. Adversarial Fragen

| Frage | Ergebnis |
| --- | --- |
| Wird Navbar-Abmelden still auf `local` gedreht? | Nein. `signOutAction` bleibt `signOut()` ohne Scope. |
| Kann `others` die aktuelle Sitzung beenden und trotzdem Erfolg zeigen? | Nein. Nach `others` muss `getUser()` weiter einen User liefern. Sonst `others_ended_local` oder Netzfehler. |
| Wird bei Netzfehler trotzdem redirected oder Erfolg gezeigt? | Nein. Erfolg nur aus `working` + `ausfuehren_ok`. Navigation nur nach lokalem Erfolg von `local`/`global`. |
| Wird eine Sessionzahl oder Geräteliste erfunden? | Nein. Keine `listSessions` / `auth.sessions`. Copy sagt ausdrücklich, dass die Anzahl unbekannt ist. |
| Wird sofortiges JWT-Kill behauptet? | Nein. Hinweis und Erfolgstexte nennen die Restlaufzeit. |
| Werden GoTrue-/Token-Rohtexte gezeigt oder geloggt? | Nein. Mapper + Dicht-Tests. Kein `console.*`. |
| Ist `global` klar gefährlicher als `local`/`others`? | Ja. Destructive-Variante plus Bestätigungsschritt. |
| Wird ein unbekannter Scope still als Default-`global` ausgeführt? | Nein. `logoutScopeLesen` fail-closed; kein `signOut()` ohne Scope im S3-Pfad. |
| Wird ein `getUser()`-Netzfehler als Sitzungsverlust gezeigt? | Nein. 401/fehlender User ≠ Failed to fetch. |
| Wurde S4/S5/AAL2/Service Role still gebaut? | Nein. |
| Traveller-/Dokumentdaten? | Nicht berührt. Nicht relevant. |

## 3. Risiken, die bleiben

- Der installierte User-Client kann bestimmte Logout-HTTP-Fehler schlucken. S3 macht daraus keine zweite Wahrheitsebene.
- Allgemeines `signOutAction` bleibt fehlerblind. Bewusst nicht in S3 umgeschrieben.
- Kein authentifizierter Browser-/Real-Device-Beweis.
- Exact-Head CI/Vercel müssen live geprüft werden.
- S4–S5 und AP-5-P1–P5 bleiben offen.

## 4. Urteil des Autors

**CHANGES REQUIRED durch den Autor:** keine weiteren in diesem Slice.

**Unabhängiger Technical-Lead-Review:** ausstehend. Dieses Self-Review ersetzt ihn nicht.
