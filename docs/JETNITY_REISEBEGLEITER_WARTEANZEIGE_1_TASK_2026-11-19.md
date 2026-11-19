# Jetnity Reisebegleiter Warteanzeige 1 — begrenzter Technical-Lead-UI-Slice

**Datum:** 19.11.2026, Zürich · **Issue:** [#1248](https://github.com/Jetnity/jetnity/issues/1248)
**Ausgang:** `main@f0f376fa2a65ff2276b665d2b549ec75ae9c5ae5` · **Branch:** `feat/reisebegleiter-warteanzeige-1-20261119` · **Draft-PR**
**Bearbeiter:** ChatGPT Technical Lead, direktes enges UI-Paket (kein zusätzlicher Cursor-Agent beauftragt). **Independent exact-head CI vor Freigabe.**

## Auftrag und gesicherter Nutzerstand

Der Owner hat am 19.11. bestätigt, dass die harmlose KI-Titeländerung in Dev nach Speichern und Wiederladen bestehen blieb. Seine Screenshots zeigen beim Erzeugen eines **Reiseänderungsvorschlags** eine mehrzeilige Wartekarte mit Punkten. Bei **„Reisebegleiter fragen“** gibt es bisher nur eine Textzeile. Ein echtes 7-Tage-Reisebegleiter-Ergebnis in der isolierten Dev-Vorschau ist bereits separat unter [#1243](https://github.com/Jetnity/jetnity/issues/1243) abgenommen.

**Ziel:** dieselbe ruhige, deutliche Fortschrittskarte mit Punkten für die Reisebegleiter-Wartezeit. Echte KI-Laufzeitschritte werden nicht nach aussen gestreamt; die Karte erklärt den **typischen Ablauf, nicht gemessene Live-Etappen**. Kein falscher Abschluss einzelner Schritte, keine Prozentzahl, kein Versprechen einer amtlichen Auskunft. Nur die im geschlossenen Jetnity-Katalog berechneten Aussagen werden ausgewählt.

## Genauer Schreib-Scope
- `components/trips/Reisebegleiter.tsx`: die bestehende Lade-Textzeile durch eine eigene Karte ersetzen. Bestehendes `laeuft` verwenden. Fragen-/Beispiel-Eingaben während des laufenden Aufrufs sperren, Status nach Erfolg/Fehler entfernen, Fehlertext erhalten und nicht erneut anfragen.
- `components/trips/Begleiterfortschritt.tsx`: kleine, barrierearme, **rein visuelle** Fortschrittskarte mit Punktliste; keine neuen Server-Aktionen, Anbieter- oder Modellaufrufe.
- `lib/reisebegleiter/fortschritt-ui.test.ts`: SSR-/Quelle-Kontrakte für Status, korrekte Sprache, Anzahl Punkte, keine Pseudo-Live-Prozente, kein direkter API-Aufruf.

Die fertige Karte darf nicht behaupten, das Modell „schreibe“ freie amtliche Sätze oder dass ein spezieller Unterpunkt tatsächlich gerade fertig sei. Die Systemantwort ist weiterhin eine Auswahl aus von Jetnity formulierten Aussagen.

## Absolut nicht berühren

`lib/reisebegleiter/{kontext,erzeugen,nutzlast,regeln,pruefung,aktionen,schema}.ts`, `lib/modell/**`, Kosten/Preise/Quoten/Provider, `supabase/**`, DB-Migrationen/RLS/SQL/DB-Tests, Auth/AAL2, `.github/**`, `package.json`/Lockfiles, Vercel-/OpenAI-/Google-Keys/ENV und alle Official-Truth-/Einreise-/Readiness-/Safety-/Seasonal-Dateien. Kein anderes PR ändern, besonders #1240, #1244, #1238, #1235, #1247. Kein Kostenbudget erhöhen, kein Publish/Production-Rollout. Kein automatischer Modellaufruf.

## Acceptance/Gates

1. Vor Anfrage keine Wartekarte, während `laeuft` gut lesbare Karte mit Punktliste, Erfolg und Fehler schliessen die Karte; Fehlermeldung bleibt, kein unendlicher Wartezustand bei Netzwerkfehler.
2. Typische statische Orientierungspunkte: Reisekontext abgleichen, zulässige Jetnity-Aussagen auswählen, Ausgabe gegen Jetnity-Stand prüfen. **Keine getaktete Behauptung über reale Backend-Phasen**.
3. `aria-live=polite` und `aria-busy=true` während Wartephase; Punkte selbst sind dekorativ. 320/390px: Inhalte umbrechen, kein horizontaler Überlauf, 44px-Bedienelemente bleiben erreichbar.
4. Testen ohne Bezahlaufruf: deterministische SSR-/UI-Sicherung, TypeScript, Lint, `npm run check:exports`, relevante Tests, Build und **vollständige GitHub-CI auf dem endgültigen Head**. Falls CI grün: isolierte Dev-Vorschau vor der Owner-Abnahme; kein Production-Schritt.
5. Risiken und exakten Head im Draft-PR dokumentieren. **STOPP: Draft, nicht Ready, nicht mergen, keine Production/DB/ENV-Änderung, keinen Folgeslice starten.**
