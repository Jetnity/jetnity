# ChatGPT / Technical Lead – PR #137 Post-Merge New-Chat Checkpoint

Stand: 28. August 2026

Status: **AP-5-S2 integriert / Issue #136 CLOSED completed / Account Generation 10 abgeschlossen / kein automatischer AP-5-S3–S5-Start.**

> Live-Evidence gewinnt immer. Dieser Checkpoint ist versionierte Continuity-Evidence des hier verifizierten Stands und ersetzt keine spätere Live-Rekonstruktion.

## 1. Integrierter Slice

AP-5-S2 – eingeloggte Passwortänderung über bestehende Supabase-Reauthentication.

- Issue: `#136` – `AP-5-S2 – eingeloggte Passwortänderung über Reauthentication`
- Cursor-Agent: `Account plattform audit vorbereitung 10`
- PR: `#137`
- Branch: `cursor/ap5-s2-password-reauth-82e4`
- Start-Baseline: `0256905cee3e6705156ce642839983daf8b0709a`
- final reviewed PR head: `e4cb805a2313fd537aeb9f1f65a8de436301d258`
- Merge-Commit auf `main`: `f11a17533c56f5746ca9ef56e08c3e4a21a5a3c5`

## 2. Technical-Lead Review

Der erste unabhängige Review fand auf einem früheren Head einen P1-Truth-State-Fehler: `getUser()`-Netz-/5xx-/Unknown-Fehler durften nicht pauschal als ungültige Session dargestellt werden.

Der Fix wurde unabhängig revalidiert. Auf dem finalen reviewed Head gilt:

- echte Session-Evidence (`401` / session-missing / `data.user === null`) -> `session_required`;
- Netzwerkfehler -> `network`;
- unbekannte / 5xx-Fehler -> `unknown`;
- keine rohe GoTrue-/Token-/Nonce-/Factor-ID-Copy im UI;
- Recovery bleibt vom signed-in Passwortwechsel getrennt;
- kein erfundenes Current-Password-Feld.

Finaler Technical-Lead-PASS wurde als Review-COMMENT `5051115258` auf exact Head `e4cb805a2313fd537aeb9f1f65a8de436301d258` persistiert. GitHub verweigerte technisch eine `APPROVE`-Submission, weil der verbundene Repository-Owner den eigenen PR nicht approven darf (`Review Can not approve your own pull request`). Das ändert den unabhängigen ChatGPT/Technical-Lead-PASS nicht.

Vor Merge:

- Merge-Base = `0256905cee3e6705156ce642839983daf8b0709a`
- Ahead / Behind = `8 / 0`
- Inline Review Threads = `0`
- Actions Run `33170816296` = `SUCCESS` auf exact Head `e4cb805a...`
- CI enthielt Typecheck, Lint, Tests, Schutz-/Hygienechecks, Production Build und Auth-Konfiguration gegen `config.toml`
- Vercel Preview `dpl_FfPQYnBjypHCwi4puvMLDNir8dEA` = `READY` auf exact Head `e4cb805a...`

## 3. Integrierter Auth-Vertrag

AP-5-S2 bleibt innerhalb des bereits durch AP-5 Gate 0 etablierten Vertrags:

1. eingeloggte, serverseitig geschützte `/account`-Oberfläche;
2. explizite Nutzeraktion;
3. `supabase.auth.reauthenticate()`;
4. E-Mail-Code / Nonce über die bestehende Supabase-Authority;
5. `supabase.auth.updateUser({ password, nonce })`;
6. Erfolg erst nach erfolgreichem `updateUser`;
7. stabile, nicht-leakende Fehlerzustände.

Der Recovery-Pfad `/auth/update-password` bleibt eigene Authority und verwendet nicht still den signed-in Reauthentication-Vertrag.

Nicht eingeführt:

- kein Current-Password-Submit;
- keine Auth-Config-Änderung;
- kein Consumer-AAL2;
- keine Admin-AAL2-Änderung;
- keine Session-/Identity-Architekturänderung;
- kein Service Role;
- keine RLS-/Ownership-/Schema-/Migration-Änderung;
- keine OAuth-/Passkey-Aktivierung;
- kein AP-5-S3–S5;
- kein AP-5-P1–P5 / C2.

## 4. Post-Merge Live-Evidence

Nach dem Merge wurde `main` erneut live verifiziert.

- `main` = `f11a17533c56f5746ca9ef56e08c3e4a21a5a3c5`
- Merge-Commit hat als Eltern die alte Main-Baseline `0256905c...` und den reviewed PR Head `e4cb805a...`
- GitHub Actions Run `33171851756` = `SUCCESS` auf exact Merge-SHA `f11a1753...`
- Vercel Production `dpl_A7BMLsQoZwx8Y4qEdMRCsdyPmRGg` = `READY`
- Vercel Production meta `githubCommitSha` = `f11a17533c56f5746ca9ef56e08c3e4a21a5a3c5`
- Issue `#136` = `CLOSED`, `state_reason=completed`
- `main` Branch Protection bleibt live `protected=false`

Es wurde kein Production-Supabase-/Auth-Config-/Schema-/RLS-Write für AP-5-S2 ausgeführt.

## 5. Test- und Evidence-Grenzen

Automatisierte Evidence ist grün. Der Slice enthält insbesondere Regressionen für:

- signed-in Reauthentication vs Recovery;
- `password + nonce`, ohne Current Password;
- kanonische Passwortregel / HIBP-Einordnung;
- Session-/Network-/Unknown-Truth-State;
- keine Rohtext-/Secret-Leaks;
- Accessibility-/Status-/Keyboard-Semantik;
- bestehende AP-5-S1-/MFA-Grenzen.

**Nicht behauptet:** authentifizierter Browser-/Real-Device-End-to-End-Beweis der Passwortänderung. Das bleibt ein ehrlicher residualer Evidence-Punkt, nicht ein Merge-Blocker des geprüften S2-Vertrags.

## 6. Continuity-Supersession

Dieser Checkpoint supersediert für den aktuellen Integrationsstatus ausdrücklich pre-merge/Draft-Aussagen in älteren S2-Dokumenten und kanonischen Zeigern, die noch Formulierungen enthalten wie:

- `AP-5-S2 ist aktueller Draft`;
- `Issue #136 ist offen`;
- `Generation 10 ist aktuell`;
- `PR #137 wartet auf Technical-Lead-Review`.

Diese Aussagen bleiben historische Authoring-/Pre-Merge-Evidence. **Aktuelle Wahrheit ist:** PR #137 ist integriert, Issue #136 ist completed und Generation 10 ist abgeschlossen.

Die vorhandenen S2-Dateien (`AP5_S2_*`) bleiben als Slice-Evidence erhalten und werden nicht rückwirkend umgeschrieben, nur weil der Slice später gemergt wurde.

## 7. Agent-Rotation

`Account plattform audit vorbereitung 10` ist nach AP-5-S2 abgeschlossen und darf nicht für einen neuen logischen Slice wiederverwendet werden.

Falls später ein neuer Account-Slice nach ausdrücklicher Technical-Lead-Entscheidung startet, ist die nächste frische Generation voraussichtlich:

`Cursor-Agent: Account plattform audit vorbereitung 11`

Vor Start muss die Generation dennoch live gegen Repository-Evidence rekonstruiert werden.

## 8. Kein automatischer Folgeslice

Der Merge von AP-5-S2 startet **nicht** automatisch:

- AP-5-S3;
- AP-5-S4;
- AP-5-S5;
- AP-5-P1–P5;
- C2;
- AP-7;
- Provider S5-B;
- TW-8 / TW-9;
- Issue #109 / #110;
- Search-/Homepage-/Native-/Public-Indexing-Arbeit.

AP-5-S3–S5 bleiben normale Technical-Lead-Gates gemäß AP-5 Gate 0, aber jeder neue logische Slice braucht eine neue Live-Entscheidung, frische Baseline und frische Agent-Generation.

## 9. Bekannte Residuals, die dieser Merge nicht löst

- `main` Branch Protection bleibt `protected=false`;
- Login-MFA / Consumer-AAL-Verhalten außerhalb S2 bleibt unverändert;
- Session-/Gerätelisting bleibt ohne unterstützte User-API ungebaut / `unsupported`;
- Recovery-UI kann für bereits eingeloggte Sessions weiterhin separat geprüft/geschärft werden, ohne Recovery-Authority still umzuschreiben;
- kein authentifizierter Real-Device-Nachweis für S2;
- Project-Sanitation-Close/Delete bleibt separat gated;
- Provider/TW/Traveller/andere Workstreams unverändert.

## 10. Nächster Technical-Lead-Schritt

Zuerst diesen Checkpoint und Live-Evidence lesen/revalidieren. Danach **keinen** Product-Folgeslice automatisch starten.

Wenn der nächste Account-Slice fachlich priorisiert wird, muss der Technical Lead vor Start erneut begründen:

- warum genau dieser Slice als nächstes kommt;
- welche Abhängigkeiten erfüllt sind;
- welche Shared Contracts berührt werden;
- ob ein Product-Owner-Sondergate entsteht;
- welcher exakte frische Cursor-Agent-Name gilt.

Für einen Chat-Wechsel ist dieser Checkpoint die post-merge Account-Evidence nach AP-5-S2. Der endgültige New-Chat-Handoff muss zusätzlich den dann aktuellen Gesamt-Live-Stand aller Workstreams rekonstruieren.