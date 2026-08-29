# AP-6a Gate 0 – Legal-Content-Input-Vertrag

Stand: 29. August 2026  
Status: **DOCS-CONTRACT ONLY / KEIN RECHTSTEXT / KEINE BEHAUPTETE KONFORMITÄT**  
Für: Product Owner + Legal vor jedem AP-6a-Runtime-Slice  
Cursor-Agent: **`Cursor-Agent: Account plattform audit vorbereitung 16`**

Dieser Vertrag ist die Vorlage, die der Technical Lead dem Product Owner vorlegen kann.  
**Jede Zeile, die nicht `belegt` ist, darf ein Runtime-Slice nicht erraten.**

Klassen: `belegt` · `fehlend` · `unknown` · `PO-Legal-approval-required`

`belegt` heißt nur: Repository- oder Live-Evidence existiert. Es heißt **nicht** „rechtlich ausreichend“.

---

## 1. Freigabe-Entscheidung, die vor Runtime nötig ist

Vor `app/(public)/privacy/page.tsx` und `app/(public)/terms/page.tsx` muss Product Owner / Legal **schriftlich** liefern oder ausdrücklich ablehnen:

1. Freigegebene Datenschutzerklärung (Sprache, Fassung, Datum).
2. Freigegebene Nutzungsbedingungen (Sprache, Fassung, Datum).
3. Ob die unbelegte UI-Behauptung „DSGVO & CH-DSG konform“ entfernt, ersetzt oder (nur nach Legal) belassen wird.
4. Ob Footer (und ggf. Login) dieselben zwei Routen verlinken sollen.
5. Ob `/impressum` und/oder `/datenschutz` zusätzlich nötig sind. Das ist **kein** stilles AP-6a-Default.
6. Ob `CookieConsent` Orphan bleibt, gelöscht oder erst nach ehrlichem Text gemountet wird.
7. Ob die Register-Checkbox nach Runtime weiterhin nur clientseitig gilt (AP-6a) oder erst mit AP-6b persistiert wird.

Ohne diese Freigaben: **kein Runtime-Slice, keine Platzhalter-AGB, keine „demnächst“-Legal-Seite als Compliance-Behauptung.**

---

## 2. Input-Matrix

| # | Input | Klasse | Was belegt ist | Was fehlt / unbekannt ist | Wer entscheiden muss |
| --- | --- | --- | --- | --- | --- |
| 1 | Betreiber-/Unternehmensidentität | **fehlend** / **PO-Legal-approval-required** | Produktname „Jetnity“ in UI und Docs | Rechtsform, Handelsregister, UID, Sitz | PO + Legal |
| 2 | Ladungsfähige/postalische Adresse | **fehlend** / **PO-Legal-approval-required** | — | Straße, PLZ, Ort, Land | PO + Legal |
| 3 | Verantwortliche Stelle / Controller | **fehlend** / **PO-Legal-approval-required** | — | Wer Verantwortlicher ist; ob identisch mit Betreiber | PO + Legal |
| 4 | Kontaktweg Betroffenenrechte | **belegt** (Anzeige) + **PO-Legal-approval-required** (Rolle) | Footer zeigt `info@jetnity.ch` | Ob das der Datenschutzkontakt ist; Antwortfrist; Vertreter | PO + Legal |
| 5 | Rechtsraum / Zielmärkte | **unknown** / **PO-Legal-approval-required** | Vision: „Schweiz zuerst“, DSG und DSGVO „soweit relevant“ – Produktabsicht, keine Rechtsfeststellung | Anwendbares Recht, Zielmärkte, ob nur CH oder auch EU/EWR | PO + Legal |
| 6 | Gerichtsstand / anwendbares Recht | **fehlend** / **PO-Legal-approval-required** | — | Nicht erfinden | Legal |
| 7 | Datenkategorien Konto/Auth | **belegt** (technisch) / **PO-Legal-approval-required** (Zweck/Rechtsgrundlage) | E-Mail, Passwort (Auth), optionales `user_metadata.name`; `profiles`: email, display_name, avatar_url, role, status, last_seen_at | Rechtsgrundlage, Zwecktexte, Aufbewahrung | PO + Legal |
| 8 | Datenkategorien Reise/Traveller | **belegt** (technisch) / **PO-Legal-approval-required** | Trip-scoped Reisegraph; Party ohne Passnummern/Scans/MRZ/Biometrie | Welche Zwecke Legal nennen darf; ob Guest-LocalStorage beschrieben werden muss | PO + Legal |
| 9 | Sensible Dokumentdaten | **belegt** | Architektur/Foundation: keine Passnummern, Ausweiskopien, Visa-Scans, Zahlungs- oder Gesundheitsdaten im Gast- oder Reiseschema | Jede spätere Speicherung bleibt Extra-Gate, nicht AP-6a | — |
| 10 | Modell-/Nutzungsprotokoll | **belegt** (technisch) / **PO-Legal-approval-required** | `model_usage`: Funktionsname, Modell, Art, Kennung-Hash, Tokens, Kosten; **keine** Reiseinhalte, IP, E-Mail. Keine automatische Löschung dokumentiert | Rechtsgrundlage; Retention-Frist vor Production-Modellaktivierung | PO + Legal |
| 11 | Gast-Quota-Cookie | **belegt** (technisch) / **PO-Legal-approval-required** | `jetnity_gast`: httpOnly, SameSite=lax, 30 Tage, 32 Hex; Quota, keine Messung | Cookie-Klassifikation, ob Einwilligung nötig | PO + Legal |
| 12 | Auth-/Session-Cookies | **belegt** (technisch) / **PO-Legal-approval-required** | Supabase-Auth ist cookie-basiert (SSR) | Konkrete Cookie-Namen/Laufzeiten in Legal-Copy; ob „essentiell“ | PO + Legal |
| 13 | Guest-Trip LocalStorage | **belegt** (technisch) / **PO-Legal-approval-required** | `jetnity:reise:v3` plus Warteschlange; genau eine aktive Gastreise | Beschreibung in Privacy; Verhältnis zu Kontoübernahme | PO + Legal |
| 14 | Orphan-Cookie-Banner | **belegt** (technisch, nicht gemountet) | Datei existiert; `jetnity:cookie-consent:v1`; Text behauptet Views/Likes; Link `/privacy` | Nicht verdrahten. Text ist V1-Alt-Social, nicht V2-Wahrheit | PO: Orphan belassen / löschen / erst nach ehrlichem Text |
| 15 | Analytics / Marketing / Ads | **belegt** (aktuell: nicht gefunden) / **PO-Legal-approval-required** bei Aktivierung | Kein gtag/plausible/posthog/vercel-analytics in App-Quellen | Jeder spätere Tracker ist Extra-Gate | PO + Legal |
| 16 | Auftragsverarbeiter / Provider-Kategorien | **technisch ableitbar**, rechtlich **fehlend** | Infra-Kategorien im Repo: Vercel Hosting, Supabase Auth/DB, GeoNames Ortsdaten, optional Modell-API falls aktiviert. Kommerzielle Search/Affiliate-Provider **nicht live** | Namen, Standorte, AV-Verträge, Transferinstrumente | PO + Legal. Keine Liste erfinden |
| 17 | Internationale Übermittlungen | **unknown** / **PO-Legal-approval-required** | Domains und Hosting-Alias belegt; Regionen der Provider **nicht** in diesem Run bewiesen | SCC/CH-Äquivalent, Speicherregion | PO + Legal |
| 18 | Aufbewahrung / Löschung | **fehlend** / **PO-Legal-approval-required** | Kein Consumer-Delete/Export (AP-6b). `model_usage` ohne Auto-Löschung dokumentiert | Fristen, Konto-Löschversprechen | PO + Legal; Runtime-Löschung = AP-6b |
| 19 | Betroffenenrechte | **fehlend** / **PO-Legal-approval-required** | — | Auskunft, Berichtigung, Löschung, Widerspruch, Beschwerdebehörde | Legal |
| 20 | Rechtsgrundlagen / Einwilligung | **fehlend** / **PO-Legal-approval-required** | Register-Checkbox ist nur Client-State, kein Consent-Satz in Auth/DB. OAuth-Pfad prüft die Checkbox nicht. Login behauptet Zustimmung ohne Checkbox | Was Einwilligung vs Vertrag vs berechtigtes Interesse sein soll | PO + Legal |
| 21 | Minderjährige / Altersgrenze | **fehlend** / **unknown** / **PO-Legal-approval-required** | Kein Altersfeld, kein Age-Gate in Register/Login. Traveller-Party kann Kinder-Kontext in Reisen tragen, ohne Account-Altersprüfung | Mindestalter Konto; Kinder in Party | PO + Legal |
| 22 | Aggregator-/Affiliate-/Provider-Haftung | **fehlend** / **PO-Legal-approval-required** | Vision/Code: Jetnity vermittelt, bucht nicht selbst; Search und Affiliate getrennt; keine Fake-Preise | Haftungsausschluss, Rolle gegenüber Carriern/Hotels, Affiliate-Offenlegung | PO + Legal |
| 23 | Sprache der Legal-Texte | **PO-Legal-approval-required** | UI-Sprache der betroffenen Flächen ist Deutsch (`html lang=de`) | Nur DE, oder DE+EN, oder weitere Vision-Sprachen | PO + Legal |
| 24 | Public Indexing der Legal-Seiten | **belegt** (fail-closed deny) / **PO-Legal-approval-required** für Allow | Live `robots.txt` deny-all; `NEXT_PUBLIC_ALLOW_INDEXING` Default deny; Sitemap ohne Legal-Pfade | Legal-Seiten dürfen vor dem bestehenden Public-Indexing-Gate **nicht** indexiert werden | PO bleibt am bestehenden Indexing-Gate |

---

## 3. Was ein Runtime-Slice **nicht** als Legal-Fakt einsetzen darf

- `info@jetnity.ch` als bewiesene verantwortliche Stelle
- „Jetnity“ als bewiesene GmbH/AG/Einzelfirma
- „Schweiz zuerst“ als Gerichtsstand oder anwendbares Recht
- „DSGVO & CH-DSG konform“ als bestehende Wahrheit
- CookieConsent-Views/Likes als bestehende Messung
- Provider-Listen aus Roadmap/Backlog als live Auftragsverarbeiter
- `/impressum` als stilles Pflichtziel ohne Legal-Entscheidung

---

## 4. Minimale Inhaltsmenge für Runtime

Legal muss mindestens so viel liefern, dass `/privacy` und `/terms` **keine leere Seite** und **keinen erfundenen Text** brauchen:

- Identität des Verantwortlichen **oder** ausdrückliche Anweisung, die Seite als vorläufige technische Hinweisfläche ohne Vollständigkeitsclaim zu bauen (das wäre eine eigene PO-Entscheidung und keine Konformität).
- Kontaktweg.
- Beschreibung der tatsächlich implementierten Verarbeitungen (Konto, Reise, Gast, Cookies/LocalStorage, Hosting), getrennt von geplanten.
- Nutzungs-/Haftungsrahmen für das Aggregator-Modell **oder** ausdrücklicher Hold, `/terms` nicht zu shippen.

Gate 0 empfiehlt: **keine** „technische Hinweisseite“, die Vollständigkeit oder Konformität andeutet. Lieber 404 belassen, als eine Schein-Privacy zu veröffentlichen. Die Register-404 bleibt dann der bekannte Trust-Defekt, bis echte Texte da sind.
