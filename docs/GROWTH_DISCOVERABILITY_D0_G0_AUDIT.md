# Jetnity – Growth / Discoverability D0-G0 Foundation Audit

Stand: 25. August 2026  
Agent: `Jetnity growth discoverability`  
Status: **AUDIT AUSGEFÜHRT / STOPP für unabhängigen ChatGPT-/Technical-Lead-Review**  
Draft-PR: #69  
Branch: `audit/growth-discoverability-d0-g0-foundation`  
Audit-Head: der aktuelle Head dieses Branches nach diesem Bericht  
Baseline: `main @ b2a9e69495d7e11cbc0f0c8fb1a6750e933094ea`

Harte Grenze dieses Slices: **AUDIT / EVIDENCE / ARCHITECTURE ONLY.**  
Keine Homepage-Copy, keine D0/G0-Runtime, keine D1/G1+, keine Tracking-/Ads-/CRM-Aktivierung, keine Secrets/paid calls, keine DB/RLS/Auth/Traveller/Route-Änderung.

---

## 1. Executive Summary

Jetnity besitzt eine **teilweise vorhandene, nicht vertragsreife D0-Schicht** und **keine G0-Measurement-Verträge im Code**.

Heute schützt Production-`robots.txt` die ganze Site mit `Disallow: /`, weil `NEXT_PUBLIC_APP_URL` auf `jetnity-app.vercel.app` zeigt und `app/robots.ts` `*.vercel.app` als ephemeral behandelt. Das ist ein wirksamer Crawl-Kill-Switch, **kein Index-Boundary-Contract**.

Sobald ein nicht-ephemeral Host (`jetnity.ch` / `jetnity.com`) mit `VERCEL_ENV=production` verbunden wird und `NEXT_PUBLIC_ALLOW_INDEXING` nicht ausdrücklich `false` ist, werden private Produktflächen (`/reisen`, `/reisen/[tripId]`) über HTML-`index,follow` und die Sitemap indexierbar. Account-Trip-Inhalte sind für anonyme Crawler derzeit nicht SSR-sichtbar; die **Index-Grenze selbst ist trotzdem falsch**.

Es gibt **keinen nachgewiesenen anonymen SSR-Leak** von privaten Trip-, Account-, Dokument-, Admin- oder Payment-Inhalten. Es gibt **keinen Live-Tracker**, kein Fingerprinting und keine versteckte Anonymous→Account-Identitätsauflösung.

Es gibt **drei P1-Findings**, keinen P0.

| ID | Severity | Kurz |
| --- | --- | --- |
| D0-P1-01 | P1 Privacy/SEO | Private Reise-Surfaces erben `index,follow`; Sitemap enthält `/reisen`; `robots.ts` verbietet `/reisen` nicht |
| D0-P1-02 | P1 Privacy/SEO | `/planen?idee=` rendert Nutzereingaben serverseitig in indexierbares HTML |
| D0-P1-03 | P1 Legal/Privacy | `/privacy` und `/terms` sind 404, während Registrierung deren Annahme verlangt |
| D0-P2-01 | P2 SEO | Production: `Disallow: /` + beworbene Sitemap + HTML `index,follow` widersprechen sich |
| D0-P2-02 | P2 SEO | Kein Canonical; `APP_URL` vs `SITE_URL`; kein `generateMetadata` |
| D0-P2-03 | P2 Security/SEO | `/admin/login` und `/unauthorized` sind HTML-indexierbar; Admin-`head.tsx` ist tot |
| D0-P2-04 | P2 SEO | Keine Locale-/hreflang-Architektur; `lang="de"` hart |
| D0-P2-05 | P2 SEO | Nur `WebApplication`-JSON-LD; keine `Organization`/`WebSite`; Entity-URL ist `vercel.app` |
| D0-P3-01 | P3 SEO | Title-Template verdoppelt Auth-Titel |
| D0-P3-02 | P3 SEO/QA | Manifest ohne Icons; keine SEO-/Metadata-/robots-Tests |
| D0-P3-03 | P3 SEO/A11y | Anonyme Trip-URL ist dünne Client-Hülle ohne SSR-`main`/`h1` |
| G0-P2-01 | P2 Data Quality | Kein versionierter Event-/Attribution-/UTM-/Referrer-Contract |
| G0-P2-02 | P2 Privacy | Verwaistes `CookieConsent` behauptet Views/Likes-Messung und zeigt auf `/privacy` |
| G0-P3-01 | P3 Data Quality | Locale/Markt/Währung sind kein Growth-Contract |
| G0-P3-02 | P3 Architecture | Admin Analytics/Marketing/Content sind Platzhalter |

**Nicht Ready. Nicht mergen. Keine Runtime in diesem Slice.**

---

## 2. Live-Verifikation vor Audit

Verifiziert am 25. August 2026, vor und während der inhaltlichen Prüfung. Nicht aus Continuity-Docs übernommen.

| Prüfung | Live-Stand |
| --- | --- |
| Lokales `main` / `origin/main` | `b2a9e69495d7e11cbc0f0c8fb1a6750e933094ea` – `Merge PR #68: post-TW5 continuity closure` |
| Festgelegte Start-Baseline | **identisch** |
| Audit-Branch vor diesem Bericht | `audit/growth-discoverability-d0-g0-foundation` @ `9f1a91603ef5a9296c891164ec88710ec595b920` |
| Merge-Base gegen `origin/main` | `b2a9e69495d7e11cbc0f0c8fb1a6750e933094ea` |
| Ahead / Behind | **2 / 0** (zwei Control-Docs; 0 behind) |
| Draft-PR #69 | OPEN, Draft, MERGEABLE/CLEAN, Base `main` @ `b2a9e694` |
| TW-5 / PR #66 | MERGED; Runtime nicht berührt |
| Offene parallele PRs | #52, #50, #40, #39, #28 – historische Drafts, keine aktiven Runtime-Kollisionen mit diesem Docs-only-Slice |
| Production-Host | `https://jetnity-app.vercel.app` erreichbar |
| `jetnity.ch` / `jetnity.com` | **keine DNS-Auflösung** |
| Production `robots.txt` | `User-Agent: *` / `Disallow: /` / Host+Sitemap auf `jetnity-app.vercel.app` |
| Production `sitemap.xml` | `/`, `/planen`, `/reisen` auf `https://jetnity-app.vercel.app` |
| Homepage-HTML | `robots=index, follow`; kein Canonical; kein hreflang; 1× `WebApplication` JSON-LD |
| PR-#69 CI vor diesem Bericht | Typecheck/Lint/Build SUCCESS; Auth-Konfiguration SUCCESS; Vercel SUCCESS |

`JETNITY_START_HERE.md` / `JETNITY_HANDOFF.md` / `docs/ACTIVE_WORK_STATUS.md` nannten noch den älteren TW-5-Merge `6f2beecc…`. Live-`main` ist der post-TW-5-Continuity-Stand `b2a9e694…`. Dieser Audit folgt der Live-Evidence.

---

## 3. Ist-Architektur (code- und HTTP-verifiziert)

### 3.1 Öffentliche App-Router-Flächen

| Route | Gruppe | Auth | `dynamic` | HTML robots (Production) | HTTP anonym |
| --- | --- | --- | --- | --- | --- |
| `/` | `(public)` | offen | statisch (Build `○`) | `index, follow` | 200 |
| `/planen` | `(public)` | offen | `force-dynamic` | `index, follow` | 200 |
| `/reisen` | `(public)` | offen, sitzungsabhängig | `force-dynamic` | `index, follow` | 200 |
| `/reisen/[tripId]` | `(public)` | offen, sitzungsabhängig | `force-dynamic` | `index, follow` | 200 |
| `/login` | `(public)` | offen | `force-dynamic` | `noindex, nofollow` | 200 |
| `/register` | `(public)` | offen | `force-dynamic` | `noindex, nofollow` | 200 |
| `/admin/login` | `(public)` | offen | client | `index, follow` | 200 |
| `/account*` | `app/account` | Middleware → `/login` | `force-dynamic` | nicht erreicht (307) | 307 |
| `/admin` und Unterseiten außer Login | `(admin)` | Middleware + `requireAdminPage` | `force-dynamic` | nicht erreicht (307) | 307 → `/admin/login` |
| `/auth/callback` | `app/auth` | offen | statisch | `noindex, nofollow` | 200 |
| `/auth/update-password` | `app/auth` | offen | — | `noindex, nofollow` | 200 |
| `/unauthorized` | root | offen | — | `index, follow` | 200 |
| `/ui-audit/*` | `(public)` | Production 404 | `force-dynamic` | `noindex` (404) | 404 |
| `/privacy`, `/terms`, `/impressum`, `/datenschutz` | **keine Page** | — | — | `noindex` (404) | 404 |

Es gibt **kein** `generateMetadata`. Nur statische `metadata`-Exporte. `next.config.js` hat keine `redirects`, `rewrites` oder `headers`. `vercel.json` enthält nur `{ "version": 2 }`.

### 3.2 Metadata-Schichten

1. Root `app/layout.tsx`: Default **`robots.index=true, follow=true`**, `metadataBase` aus `NEXT_PUBLIC_APP_URL`, OG/Twitter mit `/images/hero-bali.png`, `html lang="de"`.
2. Public `app/(public)/layout.tsx`: erneut **`robots.index=true`**, eigene Description/OG.
3. Account-Layout und Login/Register/Auth/UI-Audit setzen `index: false`.
4. `/reisen`, `/reisen/[tripId]`, `/planen`, `/admin/login`, `/unauthorized` setzen **kein** eigenes robots und erben `index,follow`.
5. `app/(admin)/admin/head.tsx` setzt `noindex,nofollow`, wird von Next.js 14 App Router **nicht geladen** und nirgends importiert.

### 3.3 robots / sitemap / manifest

`app/robots.ts` erlaubt Indexierung nur wenn:

- `(VERCEL_ENV ?? NODE_ENV) === 'production'`
- Hostname von `NEXT_PUBLIC_APP_URL` **nicht** `localhost` oder `*.vercel.app`
- `NEXT_PUBLIC_ALLOW_INDEXING !== 'false'` (Default also **allow**)

Bei Allow:

- `allow: /`
- `disallow`: `/api/`, `/admin/`, `/account/`, `/login`, `/register`, `/private/`, `/draft/`, `/ui-audit`, `/*?*preview=*`
- **nicht** disallowed: `/reisen`, `/reisen/`, `/planen`, `/auth/`, `/unauthorized`

Sitemap (`app/sitemap.ts`) listet immer `/`, `/planen`, `/reisen` – auch wenn robots die ganze Site verbietet. Kommentar im File sagt korrekt, dass Gastreisen nicht indexierbar sind; `/reisen` selbst ist trotzdem enthalten.

Manifest: Name/Short-Name/Description/`lang=de`/Farben/Kategorien. **Keine Icons.** `start_url: /`. Production liefert JSON 200.

### 3.4 Canonical / Locale / hreflang

Nicht vorhanden. Kein `alternates.canonical`, kein `alternates.languages`, kein i18n-Routing, keine Locale-Segment-URLs. Admin-Localization-Seite ist Platzhalter: „hreflang und Locale-Verwaltung folgen später.“

Zwei öffentliche Origin-Variablen ohne Vertrag:

- `NEXT_PUBLIC_APP_URL` – Metadata, robots, sitemap, JSON-LD
- `NEXT_PUBLIC_SITE_URL` – `.env.example` Kommentar „kanonische URLs und Rücksprungziele“, im D0/G0-Pfad ungenutzt

### 3.5 OpenGraph / JSON-LD

OG/Twitter existieren auf Root- und Public-Layout. Production-Homepage setzt absolute Bild-URLs auf `https://jetnity-app.vercel.app/images/hero-bali.png`. Kein seitenlokales `og:url`/`canonical`. Homepage-Titel im `<title>` weicht vom OG-Titel ab.

JSON-LD nur auf der Homepage, Client-unabhängig im Server-Render:

```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Jetnity",
  "url": "https://jetnity-app.vercel.app",
  "applicationCategory": "TravelApplication",
  "operatingSystem": "Web",
  "description": "Eine persönliche Plattform für Reiseplanung und Reisebegleitung."
}
```

Kein `Organization`, kein `WebSite`, kein `sameAs`, kein `Product`/`Offer`/`Review`. Keine Fake-Ratings.

### 3.6 Middleware / Auth / Index-relevante Caches

Middleware schützt `/account`, `/admin` (außer `/admin/login`) und `/api/admin`. Fail-closed ohne Supabase-ENV. `getUser()`, nicht `getSession()`. `/reisen` und `/planen` sind **nicht** auth-geschützt – das ist Produkt (Gastmodus), nicht ein Gate-Fehler.

Account-Trip-Lesen nutzt RLS; fremde UUID ergibt dieselbe 404 wie nicht existent (`app/(public)/reisen/[tripId]/page.tsx`). Unauthentifizierte Treffer auf Account-UUIDs gehen in `GastArbeitsbereich` (localStorage, client-only). Anonymes SSR enthält keine Reisedaten.

### 3.7 G0 / Measurement / Consent

Kein UTM-/Referrer-/Click-ID-Parser. Kein Acquisition-Context-Objekt. Keine versionierten Product-/Marketing-/Revenue-Events. Kein gtag/GTM/Plausible/PostHog/Mixpanel. Admin `/admin/analytics`, `/admin/marketing`, `/admin/content` sind `AdminFolgtSeite`-Platzhalter.

Anonymous→Account ist **explizit** und produktseitig: `lib/trips/uebernahme.ts` + `GastreiseBruecke` nach Login auf `/reisen`. ADR-0042: kein `auth.users`-Schattenkonto, kein Gast-Cookie-Token, kein Fingerprinting.

`components/layout/CookieConsent.tsx` ist bewusst unerreichbar (`check:dead`-Ausnahme). Text behauptet „Views/Likes“-Messung und verlinkt `/privacy`.

Währung ist Trip-Feld mit Default `CHF`. Locale der HTML-Seite ist hart `de`. Kein Market-Contract.

---

## 4. D0-Matrix

| D0-Baustein | Soll (Standard) | Ist | Reife |
| --- | --- | --- | --- |
| Öffentliche vs private Index-Boundary | Private Trips/Account/Dokumente/Admin/Support/Checkout nie indexierbar | Account/Admin-APIs geschützt; **Trip-Listen/-URLs indexierbar sobald Allow-Index greift** | **defekt / latent live** |
| Crawlability öffentlicher Kerninhalt | SSR/statischer Kern | Homepage SSR vollständig; `/planen` SSR; Trip-Workspace Gast client-only | teilweise |
| Metadata-Architektur | zentrale, überschreibbare Verträge | Root default index=true; kein `generateMetadata`; Duplikate Root/Public | teilweise / riskant |
| Canonical | eine kanonische URL je Surface | fehlt | fehlt |
| Locale / hreflang | Schweiz-first, skalierbar | `lang=de` only | fehlt |
| Sitemap | nur bewusst öffentliche URLs | `/` + `/planen` + **`/reisen`**; auch bei Disallow-all beworben | vorhanden / falsch geschnitten |
| robots.txt | bewusst, minimal restriktiv, konsistent | Kill-Switch für vercel.app; Allow-Liste ohne `/reisen`; Sitemap trotzdem gesetzt | vorhanden / widersprüchlich |
| Redirects / Duplicate Content | sauber, keine unnötigen Varianten | keine Config-Redirects; `/planen?zielId&idee` erzeugt Varianten | Lücke |
| OpenGraph | vorhanden, wahr, seitenlokal | Layout-Defaults, Bild vorhanden, kein Canonical-URL | teilweise |
| JSON-LD | getestete, truth-ready Typen | eine ungeprüfte `WebApplication`-Injektion | teilweise / nicht vertragsreif |
| Semantisches HTML | Landmarks, Headings | Public: `nav`/`main`/`footer`/`h1`; anonyme Trip-URL ohne SSR-`main`/`h1` | teilweise |
| Accessibility-Gates | DoD | Skip-Link auf Public/Account/Admin; keine Discoverability-A11y-Gates | produktseitig vorhanden, D0-Gate fehlt |
| Performance-Gates | CWV als Ziel | Homepage First Load JS 136 kB; kein SEO/CWV-Gate | fehlt |
| Technische SEO-Tests | robots/canonical/schema | **0** einschlägige Tests | fehlt |

---

## 5. G0-Matrix

| G0-Baustein | Soll | Ist | Owner-Lage |
| --- | --- | --- | --- |
| Acquisition Context | kanonischer Contract | fehlt im Code | Shared: Attribution/Revenue/Claims Truth → Technical Lead |
| Attribution First/Last/Conversion/`unknown` | ehrlich, versioniert | fehlt | Technical Lead |
| UTM / Click-IDs / Referrer | geparst, consent-gebunden | keine Implementierung; `utm_` kommt im TS-Code nicht vor | Technical Lead + später Growth |
| Deep-Link-Vertrag | Web/App, stabil, getestet | nur Produkt-Links `/planen?zielId&idee` und Auth `next=` Allowlist | Growth (Web) / Native später / Auth `next` gehört Account/Auth |
| Event-Versionierung | Name, Version, Surface, Privacy-Klasse | fehlt | Technical Lead (Contract), Growth (Producer) |
| Product vs Marketing vs Revenue Events | getrennt | nicht modelliert | Technical Lead |
| Anonymous → Account | nur mit Consent/Privacy-Vertrag; kein Fingerprint | **explizite Gast→Konto-Reiseübernahme**, kein Marketing-Join | Shared Guest→Account (ADR-0042); nicht ändern |
| Consent / Privacy | Purpose-Trennung, kein Bypass | Orphan-Banner, keine Purpose-API, keine Legal-Seiten | Shared Privacy/Consent → Technical Lead; Legal-Texte PO |
| Locale / Market / Currency | getrennte Dimensionen | `de` + Trip-`CHF` | später Growth + Account; kein Contract |
| Data Quality | Schema-Tests, Duplikate, Bot-Filter | keine Marketing-Events, daher keine DQ-Pipeline | später Admin M0 |
| Tracking produktiv | erst nach Gates | **nicht aktiv** | bleibt aus |
| Growth Control Plane | Admin-Standard M0+ | Platzhalterseiten | `Admin platform audit` |

---

## 6. Private / Public Index Boundary

### 6.1 Was ein anonymer Crawler heute wirklich sieht

Live gegen `https://jetnity-app.vercel.app`, ohne Session:

| Surface | Sensible Daten im HTML? | Index-Signal |
| --- | --- | --- |
| `/` | nein (Marketing + synthetisches Bali-Beispiel) | `index, follow` + robots deny-all |
| `/planen` | Formular, keine gespeicherte Reise | `index, follow` |
| `/planen?idee=Bali+mit+Pass+CH+und+Budget` | **Ja: Query-Text „Bali mit Pass CH und Budget“ steht im SSR-HTML** | `index, follow` |
| `/reisen` | nur generischer Gast-Text; `GastReisen` ist Client/`localStorage` | `index, follow` + **in Sitemap** |
| `/reisen/<uuid>` | kein Trip-PII; Client-Hülle | `index, follow` |
| `/account*` | 307 Login, kein Account-HTML | — |
| `/admin` | 307 Admin-Login | — |
| `/admin/login` | Login-Formular, keine Nutzerdaten | `index, follow` |
| `/ui-audit/*` | 404 | noindex |
| Dokument-/Pass-Seiten | existieren öffentlich nicht | — |
| Checkout/Support | existieren öffentlich nicht | — |

### 6.2 Was die Boundary **nicht** leakte

- Keine Account-Reisetitel, Budget-, Dokument- oder Traveller-Felder im anonymen SSR von `/reisen/[tripId]`.
- Keine Admin-Boards, Payments oder Security-Events ohne Auth.
- UI-Audit in Production fail-closed (ADR-0086).
- `robots.ts` verbietet `/api/` im Allow-Modus; Admin-APIs zusätzlich `requireAdminApi()` (12/12 im Gate).

### 6.3 Aktivierungsfußangel

`allowIndex = production && !ephemeralHost(APP_URL) && ALLOW_INDEXING !== 'false'`.

Der Hostname kommt aus **ENV**, nicht aus dem Request-Host. Ein späterer Custom-Domain-Cutover ohne vorherigen D0-1-Fix macht D0-P1-01/02 sofort wirksam. Das ist der eigentliche Launch-Blocker, nicht der heutige `vercel.app`-Kill-Switch.

---

## 7. Findings

### D0-P1-01 – Private Reise-Surfaces sind indexierbar, sobald Allow-Index greift

| Feld | Inhalt |
| --- | --- |
| Severity | **P1** |
| Kategorie | Privacy / SEO / D0 |
| Datei / Route / Surface | `app/(public)/layout.tsx`, `app/(public)/reisen/page.tsx`, `app/(public)/reisen/[tripId]/page.tsx`, `app/sitemap.ts`, `app/robots.ts` |
| Contract / Owner | Discoverability Index-Boundary → `Jetnity growth discoverability`; Privacy/Trip-URLs nicht still öffentlich machen. Technical Lead prüft Shared Privacy. |
| Vorgeschlagener Folge-Slice | **D0-1 Index Boundary Contract** |
| Blockiert | D1 Homepage/Public Indexierung; Custom-Domain-/Public-Launch-Indexing; ehrliche Sitemap |

**Evidence**

- Public-Layout setzt `robots: { index: true, follow: true }`. `/reisen` und `/reisen/[tripId]` überschreiben das nicht.
- Production-HTML `/reisen` und `/reisen/00000000-0000-0000-0000-000000000001`: HTTP 200, `<meta name="robots" content="index, follow"/>`, kein Canonical.
- `app/sitemap.ts` enthält `${APP_URL}/reisen` mit `priority: 0.7`. Production-Sitemap bestätigt das live.
- `app/robots.ts` Allow-Disallow listet `/account/` und `/admin/`, **nicht** `/reisen` oder `/reisen/`.
- Navbar/Footer verlinken `/reisen` als „Meine Reisen“ (`lib/auth/oeffentliche-navigation.ts`).

**Erwartet vs. tatsächlich**

- Erwartet: private Reiseübersicht und Trip-Workspace `noindex,nofollow`; nicht in Sitemap; robots disallow `/reisen`.
- Tatsächlich: Default-Index, Sitemap-Eintrag, Allow-Liste lässt die Flächen offen. Heute nur durch den ephemeral-Host-Kill-Switch gedämpft.

**Impact**

Suchmaschinen können „Meine Reisen“ und Trip-URLs als öffentliche Seiten behandeln. Trip-Inhalte sind anonym nicht SSR-sichtbar, aber URL-Muster, Titel und die persönliche Surface würden öffentlich. Das verletzt `docs/JETNITY_AI_SEARCH_DISCOVERABILITY_STANDARD.md` §9. Kein nachgewiesener PII-SSR-Leak – deshalb P1, nicht P0.

---

### D0-P1-02 – `/planen`-Query wird SSR in indexierbares HTML gespiegelt

| Feld | Inhalt |
| --- | --- |
| Severity | **P1** |
| Kategorie | Privacy / SEO / D0 |
| Datei / Route / Surface | `app/(public)/planen/page.tsx`, `lib/places/auswahl.ts` `zielHref()`, Homepage-Inspiration |
| Contract / Owner | Discoverability + Privacy. Shared Consent nicht betroffen, solange kein Tracker. |
| Vorgeschlagener Folge-Slice | **D0-1** (noindex bei SearchParams) und später D1 (ob `/planen` selbst öffentlich bleiben soll) |
| Blockiert | Programmatic/Public URLs mit Nutzerintent; Duplicate Content; mögliche Traveller-Hinweise in geteilten Links |

**Evidence**

Live `GET /planen?idee=Bali+mit+Pass+CH+und+Budget` → 200, `robots=index, follow`. Sichtbarer SSR-Text enthält wörtlich `Bali mit Pass CH und Budget`.

`zielHref()` setzt `zielId` und optionales `idee` in die Query. Die Homepage verlinkt vier Inspirationsziele so öffentlich.

`idee` wird in `Reiseidee` als `initialIdee` serverseitig übergeben.

**Erwartet vs. tatsächlich**

- Erwartet: Nutzerintent in URLs entweder nicht indexierbar oder nur kuratierte, bewusst öffentliche Ideen; keine unique indexierbaren Intent-Seiten.
- Tatsächlich: jede Query-Variante ist eine eigene, indexierbare SSR-Seite.

**Impact**

Geteilte `/planen?idee=…`-Links können Reiseabsicht, Budget oder Dokument-/Pass-Hinweise öffentlich machen. Das ist kein Fingerprinting, aber ein Index-Leak von Nutzertext. Traveller-Context-Policy: solche Hinweise dürfen nicht still öffentlich werden.

---

### D0-P1-03 – Pflicht-Legal-Links führen auf 404

| Feld | Inhalt |
| --- | --- |
| Severity | **P1** |
| Kategorie | Privacy / Legal / Trust / D0 |
| Datei / Route / Surface | `components/auth/RegisterForm.tsx` → `/terms`, `/privacy`; keine `app/**/page.tsx` dafür |
| Contract / Owner | Legal-Texte: Product Owner. Surfaces: Growth/Account. Shared Privacy. |
| Vorgeschlagener Folge-Slice | **D0-3 Legal Surfaces** – erst nach Legal-/PO-Texten; keine erfundenen Policies |
| Blockiert | Registrierung als vertrauenswürdiger Public Path; Consent-UX; D1 Entity/About/Legal |

**Evidence**

Production:

- `/privacy` 404
- `/terms` 404
- `/impressum` 404
- `/datenschutz` 404

Register-Checkbox verlangt Annahme von Nutzungsbedingungen und Datenschutzerklärung. AP-2 Self-Review dokumentierte bewusst: „Bestehende `/terms`- und `/privacy`-Links bleiben. Keine neuen rechtlichen Texte.“ Footer hat **keine** Legal-Links.

**Erwartet vs. tatsächlich**

- Erwartet: erreichbare, wahrheitsgetreue Legal-Seiten, bevor Nutzer zustimmen müssen.
- Tatsächlich: Zustimmung zu nicht existierenden Seiten.

**Impact**

Rechtliche und Vertrauenslücke. Kein Tracking-Bypass, aber die öffentliche Privacy-Grenze ist unvollständig. Inhalte dürfen in D0-3 nicht erfunden werden.

---

### D0-P2-01 – robots / Sitemap / HTML-robots widersprechen sich

| Feld | Inhalt |
| --- | --- |
| Severity | **P2** |
| Kategorie | SEO / Data Quality / D0 |
| Datei / Route / Surface | `app/robots.ts`, `app/sitemap.ts`, Root/Public metadata |
| Contract / Owner | Growth D0 |
| Vorgeschlagener Folge-Slice | **D0-2 Canonical + robots/sitemap-Konsistenz** |
| Blockiert | Saubere Indexierung; Search-Console-Trust; Launch-Cutover |

**Evidence**

Production `robots.txt`:

```
User-Agent: *
Disallow: /

Host: https://jetnity-app.vercel.app
Sitemap: https://jetnity-app.vercel.app/sitemap.xml
```

Dieselbe Production-Sitemap listet drei URLs. Dieselbe Production-Homepage setzt `index, follow`.

`robots.ts` hängt Sitemap und Host immer an, unabhängig von `allowIndex`.

**Erwartet vs. tatsächlich**

- Erwartet: Deny-all ohne Sitemap-Werbung **oder** Allow mit korrekter Boundary; HTML-robots und robots.txt gleichsinnig.
- Tatsächlich: drei widersprüchliche Signale.

**Impact**

Crawler-Verhalten wird mehrdeutig. Der Kill-Switch ist heute stark, die übrigen Signale untergraben ihn. Bei Domain-Cutover kippt nur ein Teil der Logik.

---

### D0-P2-02 – Kein Canonical, zwei Origin-ENVs, kein generateMetadata

| Feld | Inhalt |
| --- | --- |
| Severity | **P2** |
| Kategorie | SEO / D0 |
| Datei / Route / Surface | `app/layout.tsx`, `app/(public)/layout.tsx`, `.env.example` |
| Contract / Owner | Growth D0; URL-Origin ist Shared, weil Auth-Callbacks denselben Host brauchen |
| Vorgeschlagener Folge-Slice | **D0-2** |
| Blockiert | hreflang, OG-URL, Entity-Konsistenz, Duplicate-Host |

**Evidence**

Production-Homepage: `found canonical: False`. Kein `generateMetadata` im Repo. `NEXT_PUBLIC_APP_URL` vs `NEXT_PUBLIC_SITE_URL=https://jetnity.com` in `.env.example`. Wunschdomains haben kein DNS.

**Impact**

Keine kanonische öffentliche Identität. `jetnity.com` ist dokumentierte Wunschdomain, live existiert nur `vercel.app`. JSON-LD und OG zementieren den Preview-Host als Entity-URL.

---

### D0-P2-03 – Sensitive Nicht-Account-Surfaces ohne noindex

| Feld | Inhalt |
| --- | --- |
| Severity | **P2** |
| Kategorie | Security / SEO / D0 |
| Datei / Route / Surface | `app/(public)/admin/login/page.tsx`, `app/unauthorized/page.tsx`, `app/(admin)/admin/head.tsx` |
| Contract / Owner | Growth D0 Metadata; Admin-IA bleibt `Admin platform audit` |
| Vorgeschlagener Folge-Slice | **D0-1** |
| Blockiert | Saubere Sensitive-Surface-Liste; Admin-Entity nicht in Search |

**Evidence**

- `/admin/login` 200, Title `Jetnity – Deine ganze Reise – Jetnity`, `robots=index, follow`. Client-Page, keine eigene Metadata.
- `/unauthorized` 200, `robots=index, follow`, erklärt fehlende Admin-Berechtigung.
- `app/(admin)/admin/head.tsx` ist Pages-Router-Relikt; App Router ignoriert es. `(admin)`-Layout exportiert keine Metadata → Root `index:true`.
- Allow-`robots.txt` würde `/admin/` disallown; HTML-Meta bleibt trotzdem index. Login liegt unter `/admin/login` (disallow-prefix würde greifen), `/unauthorized` nicht.

**Impact**

Kein Credential-Leak. Sensitive Surfaces sollen trotzdem nicht indexierbar sein. Toter `head.tsx` täuscht Schutz vor.

---

### D0-P2-04 – Locale / hreflang fehlen vollständig

| Feld | Inhalt |
| --- | --- |
| Severity | **P2** |
| Kategorie | SEO / D0 |
| Datei / Route / Surface | `app/layout.tsx` `lang="de"`; Admin Localization-Platzhalter |
| Contract / Owner | D1 trägt die mehrsprachige Strategie; D0 soll den Contract nicht verbauen |
| Vorgeschlagener Folge-Slice | Contract in D0-2 dokumentieren; Runtime erst D1 |
| Blockiert | Internationale Discoverability; hreflang-Konsistenz |

**Evidence**

Keine `hreflang`-Attribute, keine Locale-Segmente, kein `alternates.languages`. Admin sagt ausdrücklich, Locale folge später. Das ist erwartete D1-Lücke, aber D0-Readiness ist **nicht** vorbereitet (kein Contract, keine URL-Regel).

**Impact**

Kein aktueller hreflang-Konflikt, weil es nur eine Locale gibt. Ein späteres `/en` ohne Canonical-Plan erzeugt Duplicate Content.

---

### D0-P2-05 – Structured Data nicht D0-vertragsreif

| Feld | Inhalt |
| --- | --- |
| Severity | **P2** |
| Kategorie | SEO / D0 |
| Datei / Route / Surface | `app/(public)/page.tsx` JSON-LD |
| Contract / Owner | Growth D0; Claims-Truth bleibt Technical Lead |
| Vorgeschlagener Folge-Slice | **D0-4 JSON-LD Foundation** nur `Organization` + `WebSite` |
| Blockiert | Citation-/Entity-Readiness; Schema-Tests |

**Evidence**

Nur `WebApplication` mit `url` = Production-Alias. Standard verlangt zuerst `Organization` und `WebSite`, App-Typen erst bei realer öffentlicher App. Kein Test, keine wiederverwendbare Komponente. Kein `Product`/`Offer`/`Review` – das ist korrekt und darf so bleiben.

**Impact**

Entity ist an `vercel.app` gebunden. Keine Fake-Awards. Die Lücke ist fehlende, getestete, wahrheitsarme Basis – nicht zu viel Schema.

---

### D0-P3-01 – Title-Template verdoppelt Auth-Titel

| Feld | Inhalt |
| --- | --- |
| Severity | **P3** |
| Kategorie | SEO / D0 |
| Datei / Route / Surface | `app/layout.tsx` template `%s – Jetnity`; Login/Register/Callback setzen bereits „… – Jetnity“ |
| Evidence | Production `<title>Login – Jetnity – Jetnity</title>`, analog Register und Callback |
| Erwartet | `Login – Jetnity` |
| Impact | Schwaches Branding, kein Privacy-Issue |
| Folge-Slice | D0-1 oder D0-2, neben Metadata-Aufräumen |
| Blockiert | nichts Kritisches |

---

### D0-P3-02 – Keine SEO-Gates; Manifest ohne Icons

| Feld | Inhalt |
| --- | --- |
| Severity | **P3** |
| Kategorie | SEO / QA / D0 |
| Datei / Route / Surface | `app/manifest.ts`; Testbaum |
| Evidence | `rg` über `lib/**/*.test.ts` findet keine robots/sitemap/canonical/hreflang/CookieConsent/utm-Tests. Manifest ohne `icons`. |
| Impact | Regression der Index-Boundary wäre heute unsichtbar. |
| Folge-Slice | Tests gehören in D0-1/D0-2/D0-4 |
| Blockiert | D0 Definition of Done |

---

### D0-P3-03 – Anonyme Trip-URL ist eine dünne Client-Hülle

| Feld | Inhalt |
| --- | --- |
| Severity | **P3** |
| Kategorie | SEO / Accessibility / D0 |
| Datei / Route / Surface | `components/trips/GastArbeitsbereich.tsx` via `/reisen/[tripId]` |
| Evidence | Production-SSR der UUID-URL: Landmarks `main=0`, `h1=0`; Text nur Chrome/Footer. Inhalt kommt erst clientseitig aus localStorage. |
| Impact | Falls indexiert: thin pages. Kein PII-SSR. A11y für No-JS: kein Inhalt. |
| Folge-Slice | D0-1 noindex macht das Follow-up weitgehend unnötig |
| Blockiert | nichts, sobald noindex steht |

---

### G0-P2-01 – Kein Event-/Attribution-/UTM-Contract

| Feld | Inhalt |
| --- | --- |
| Severity | **P2** |
| Kategorie | Data Quality / G0 |
| Datei / Route / Surface | Repo-weit; Admin-Platzhalter `/admin/analytics` |
| Contract / Owner | Shared Attribution/Revenue/Claims Truth → Technical Lead. Growth darf nur einen Entwurf vorschlagen. |
| Vorgeschlagener Folge-Slice | **G0-1 Event/Attribution Contract** (Typen/Docs/Tests, **kein Tracking-Live**) |
| Blockiert | G1 Acquisition-Messung; Admin M0; Paid/CRM |

**Evidence**

Keine Treffer für `utm_`, `gclid`, `acquisitionContext`, versionierte Eventnamen. `npm test` deckt Auth-`next`, Gastübernahme und Navigation ab, nicht Marketing-Events.

**Erwartet vs. tatsächlich**

- Erwartet für G0: dokumentierter, testbarer Contract, noch nicht produktiv sendend.
- Tatsächlich: nur Standards, keine Code-Contracts.

**Impact**

G1 würde Events ad hoc erfinden. Das wäre ein Shared-Contract-Verstoß.

---

### G0-P2-02 – Verwaistes Consent-UI mit falschem Zweck und totem Legal-Link

| Feld | Inhalt |
| --- | --- |
| Severity | **P2** |
| Kategorie | Privacy / G0 |
| Datei / Route / Surface | `components/layout/CookieConsent.tsx` |
| Contract / Owner | Shared Privacy/Consent → Technical Lead. Einbindung nicht ohne Legal-/PO-Entscheidung. |
| Vorgeschlagener Folge-Slice | **G0-2 Consent Purpose Contract**; Banner nicht ungeprüft mounten |
| Blockiert | Jede Tracking-Aktivierung; ehrliche Consent-UX |

**Evidence**

`check:dead`: 699 erreichbar, 1 begründete Ausnahme `CookieConsent.tsx`. Text: „Wir verwenden Cookies/LocalStorage, um die Nutzung zu messen (z. B. Views/Likes).“ Views/Likes sind Alt-Social, nicht V2-Wahrheit. Link `/privacy` = 404. Speichert bei „Okay“ nur `jetnity:cookie-consent:v1=1` in localStorage. Schließen ohne Okay speichert nichts, setzt Banner nur unsichtbar.

**Impact**

Solange unmounted: kein Live-Schaden. Der wartende Baustein ist inhaltlich falsch und würde bei naivem Mount Consent für nicht existierende Messung einholen.

---

### G0-P3-01 – Locale / Markt / Währung sind kein Growth-Contract

| Feld | Inhalt |
| --- | --- |
| Severity | **P3** |
| Kategorie | G0 / Data Quality |
| Surface | HTML `lang=de`; TripPlanner Default `currency: 'CHF'` |
| Owner | später Growth + Account; keine Runtime jetzt |
| Folge-Slice | in G0-1 als Dimensionen festhalten |
| Blockiert | internationale G1-Messung, nicht den aktuellen Kern |

---

### G0-P3-02 – Admin Growth-Flächen sind Platzhalter

| Feld | Inhalt |
| --- | --- |
| Severity | **P3** |
| Kategorie | Architecture / G0 |
| Surface | `app/(admin)/admin/{analytics,marketing,content,localization}/page.tsx` |
| Owner | `Admin platform audit` gemäß Control-Center-Standard M0+ |
| Folge-Slice | nicht in diesem Agenten; nach G0-1-Contracts |
| Blockiert | M0 Read-only Growth Overview |

---

## 8. Geprüfte Kategorien ohne Finding

Diese Flächen wurden adversarial geprüft. **Kein Finding**, weil die Ist-Lage den jeweiligen Standard nicht verletzt oder bewusst fail-closed ist.

| Kategorie | Ergebnis |
| --- | --- |
| Anonymer SSR-Leak von Account-Trip-PII | Nicht beobachtet. Unauth → `GastArbeitsbereich` / localStorage. RLS + gleiche 404 für fremde/fehlende UUID. |
| Anonymer Leak von Dokument-/Pass-/MRZ-/Biometrie-Daten | Keine öffentlichen Dokument-Routen. Readiness bleibt im Workspace. |
| Admin-/Payments-/Security-HTML ohne Auth | 307 auf Login. Admin-APIs: 12/12 `requireAdminApi()`. |
| Checkout-/Support-Indexierung | Surfaces existieren öffentlich nicht. |
| UI-Audit in Production | 404 unabhängig vom Flag. |
| Fake `Product`/`Offer`/`Review`/`AggregateRating` | Nicht vorhanden. |
| Live Analytics / Ads / CRM / Pixel / Fingerprinting | Nicht vorhanden. |
| Versteckte Anonymous→Account-Identität | Nicht vorhanden. ADR-0042 + explizite Übernahme. Gast bleibt ohne `auth.users`. |
| Consent-Bypass durch Tracking | Kein Tracker, der Consent umgehen könnte. |
| Open Redirect über `next=` | Allowlist `/account*`, `/reisen*` (`lib/auth/naechstes-ziel.ts`, Tests vorhanden). |
| Middleware fail-open ohne ENV | Fail-closed. |
| Secrets in Client-Analytics | Keine Analytics-Secrets. |
| Homepage-Copy in diesem Slice | Nicht geändert, wie beauftragt. Beobachtete Zukunfts-/Cockpit-Sätze sind D1-Themen, keine stillen Fixes. |
| Trip-Workspace-Runtime | Nicht verändert. TW-5 bleibt unangetastet. |
| Provider-/paid-call-/Secret-Aktivierung | Nicht erfolgt. |
| `main` Branch Protection | Bekanntes Governance-Risiko außerhalb D0/G0; nicht neu. |

---

## 9. Semantik, Accessibility, Performance (D0-Schnitt)

Geprüft, soweit ohne Runtime-Änderung und ohne Real-Device-Audit sinnvoll.

**Semantik / A11y**

- Public Chrome: Skip-Link „Zum Inhalt“, `header`/`nav`/`main`/`footer`, ein `h1` auf Home/`/reisen`/`/planen`.
- Homepage-Hero-Bild hat beschreibendes `alt`.
- Login/Register tragen `noindex` und eigene `h1`.
- Account/Admin haben Skip-Links; Admin-Drawer hat Fokusfalle.
- Anonyme Trip-URL hat im SSR keine `main`/`h1` (D0-P3-03).
- Es gibt **kein** Discoverability-A11y-Gate. Workspace-A11y-Audits sind ein anderer Workstream und wurden nicht als D0-Beweis verwendet.

**Performance**

- Production-Homepage HTML ≈ 96 kB.
- Build: `/` 9.94 kB / First Load JS **136 kB**; shared 87.3 kB; Middleware 62.7 kB.
- Hero `priority`; `next.config.js` avif/webp.
- Keine Core-Web-Vitals-Messung, kein Lighthouse-Gate, kein `llms.txt`.
- Kein D0-Performance-Finding über „Gate fehlt“ hinaus; keine gemessene Regression behauptet.

---

## 10. Vorgeschlagene Folge-Slices

Kleine, testbare Slices. **Nicht in diesem PR ausführen.** Technical Lead zerlegt und gibt frei.

### D0-1 – Index Boundary Contract

- `noindex,nofollow` für `/reisen`, `/reisen/[tripId]`, `/admin/login`, `/unauthorized`, `(admin)`-Layout.
- `/planen` ohne SearchParams: Entscheidung TL (öffentliche Produktseite vs. noindex bis D1).
- `/planen` **mit** SearchParams: zwingend noindex.
- `robots.ts`: `/reisen`, `/reisen/`, `/auth/`, `/unauthorized` disallow im Allow-Modus.
- `/reisen` aus Sitemap entfernen.
- Toten `admin/head.tsx` entfernen oder durch Metadata ersetzen.
- Title-Template-Hygiene für Auth.
- Tests: Metadata/robots/sitemap-Boundary.
- **Nicht:** Homepage-Copy, Tracking, Legal-Texte erfinden.

Abhängigkeiten: keine Shared-Contract-Änderung. Privacy-Owner informieren.

### D0-2 – Canonical + Origin + robots/sitemap-Konsistenz

- Ein öffentlicher Origin-Contract (`APP_URL` vs `SITE_URL`).
- Canonical-Helfer, kein `generateMetadata`-Wildwuchs.
- Sitemap nur wenn `allowIndex`; sonst nicht bewerben.
- Locale-URL-Regel als Doc (noch keine `/en`-Runtime).
- Tests gegen ENV-Matrix (localhost / vercel.app / künftiger Apex).

Shared: Origin berührt Auth-Callbacks. TL entscheidet, ob separater Shared-Slice nötig ist.

### D0-3 – Legal Surfaces

- Echte `/privacy` und `/terms` **nur mit PO-/Legal-Text**.
- Footer-Links.
- Keine erfundenen Policies, keine Cookie-Claims über nicht existierende Messung.
- Besonderes Product-Owner-Gate für rechtlich bindende Texte.

### D0-4 – JSON-LD Foundation

- Getestete Server-Komponente nur `Organization` + `WebSite`.
- `sameAs` nur für reale Profile (heute: keines oder nur `mailto`/Domain, wenn wahr).
- `WebApplication` erst nach TL-Entscheidung; kein `SoftwareApplication` vor Store-Apps.
- Kein `Product`/`Offer`/`Review`.

### G0-1 – Event / Attribution Contract

- Versionierte Typen: Product vs Marketing vs Revenue.
- UTM/Referrer/Deep-Link-Felder, `unknown` erlaubt.
- **Kein Emitter, kein Pixel, kein Provider.**
- Shared-Contract: Technical Lead reviewed/owned.

### G0-2 – Consent Purpose Contract

- Purpose-Enum getrennt von Service-/Security-Kommunikation.
- Entscheidung über Orphan-`CookieConsent`: entfernen, umschreiben oder warten.
- Kein Mount, kein Tracking, kein Fingerprinting.
- Shared Privacy/Consent: Technical Lead.

**Nicht jetzt:** D1 Homepage-Finalisierung, G1 Landingpages, Ads, CRM, ASO, Fake Authority, App-Store, Provider.

---

## 11. STOPP- und Gate-Regeln

- Dieser PR bleibt Draft.
- Kein Ready, kein Merge durch diesen Agenten.
- Keine D0/G0-Runtime in #69.
- Custom-Domain-Indexing ist durch D0-P1-01/02 **blockiert**, bis D0-1 (mindestens) steht.
- Tracking/Ads/CRM bleiben besondere Privacy-/PO-Gates.
- Legal-Texte bleiben PO-Gate.
- Guest→Account, Auth `next`, RLS, Traveller, Route: nicht durch Growth ändern.

---

## 12. Tests / Gates – exakte Evidence

Ausgeführt auf Branch-Head `9f1a91603ef5a9296c891164ec88710ec595b920` (Control-Docs, keine Runtime-Änderung). Node `v22.14.0`, npm `10.9.7`. Logs: `/opt/cursor/artifacts/d0g0_gates/`.

| Command | Exit | Zählung / Ausgabe |
| --- | --- | --- |
| `npm run typecheck` | **0** | `tsc -p tsconfig.json --noEmit`, keine Ausgabe |
| `npm run lint` | **0** | `✔ No ESLint warnings or errors` |
| `npm test` | **0** | **1994/1994** pass, 0 fail, 0 skip, 363 suites, 16525 ms |
| `npm run check:setup:ci` | **0** | 1 Warning: keine lokale `.env/.env.local` |
| `npm run check:dead` | **0** | 295 Startpunkte, 699 erreichbar, 1 begründete Ausnahme `CookieConsent.tsx` |
| `npm run check:exports` | **0** | 592 Dateien, 0 Exporte ohne Aufrufer |
| `npm run check:deps` | **0** | 11 dependencies / 2 geprüfte devDependencies, 0 ungenutzt |
| `npm run check:api-schutz` | **0** | 12 Admin-Routen, alle `requireAdminApi()` |
| `npm run check:schema-bezug` | **0** | 17 Tabellen/Views, 19 Funktionen |
| `npm run build` | **0** | Next 14.2.32; 45 statische Seiten generiert; `/` 136 kB First Load JS |

Nicht ausgeführt, weil außerhalb D0/G0 und ohne Schema-/Auth-Änderung: `db:rechte`, `db:rls`, `db:sicherheit`, `auth:pruefen` (Secrets, anderer Job; CI von #69 war SUCCESS).  
Nicht ausgeführt: `audit:trip-workspace` – anderer Workstream, Runtime unverändert.  
Keine Fehler herausgefiltert.

Einschlägige **bestehende** Tests (nicht SEO, aber G0-nah):

- `lib/auth/naechstes-ziel.test.ts` – Deep-Link-Allowlist nach Login
- `lib/auth/oeffentliche-navigation.test.ts` – öffentliche Nav
- `lib/trips/uebernahme.test.ts` – Guest→Account, kein stilles Identity-Join
- `lib/ui-audit` / ADR-0086 – Production-404 für Audit-Routen

Fehlend: robots/sitemap/canonical/hreflang/JSON-LD/Consent-Purpose-Tests.

HTTP-Probe (Production, anonym): `/opt/cursor/artifacts/d0g0_http_probe/`.

---

## 13. Adversarial Self-Review

Geprüft gegen den Auftrag, nicht gegen Wunschdenken.

1. **Kein P0 erfunden und keiner versteckt.** Ein P0 hätte anonym crawlbaren privaten Trip-/Dokument-/Account-Inhalt erfordert. Der ist nicht nachgewiesen. Die Index-Grenze ist trotzdem P1, weil sie beim Domain-Cutover kippt.
2. **Severity nicht aufgeblasen.** Fehlende G0-Contracts sind P2/P3-Lücken, keine Sicherheitsvorfälle. Admin-Login-Index ist P2, kein Credential-Leak.
3. **Production-`Disallow: /` wurde nicht als „D0 fertig“ gewertet.** Das wäre Schönfärberei.
4. **Homepage-Zukunftssätze** („Mitreisende planen gemeinsam“, Pro-Paket „später“) sind beobachtete D1-Claim-Risiken. Sie wurden **nicht** still umgeschrieben und nicht als D0-Runtime-Auftrag gezogen.
5. **TW-5 / Workspace** nur als Surface-Grenze gelesen, nicht verändert.
6. **Mögliche blinde Flecken:** kein eingeloggter Crawl (Session-Cookie eines echten Users); keine Search-Console; kein Real-Device-A11y; keine Messung, ob fremde Bots `robots.txt` ignorieren; Vercel-ENV-Werte nur aus beobachtetem robots-Verhalten rekonstruiert, nicht aus dem Vercel-Dashboard gelesen.
7. **Kein Scope-Creep:** keine Implementierung trotz klarer Fixes. D0-1 wäre klein und testbar – absichtlich nicht gebaut.
8. **Shared Contracts** (Privacy/Consent, Attribution, Guest→Account, Auth `next`) sind benannt und nicht umgebaut.
9. Continuity-Docs auf `main` können hinter `b2a9e694` zurückliegen; dieser Bericht stützt sich auf Live-Git/HTTP.

Ergebnis Self-Review: **Audit vollständig im erlaubten Scope. STOPP.**

---

## 14. Empfehlung an ChatGPT / Technical Lead

1. Findings und Slice-Schnitt unabhängig reviewen.
2. **D0-1** als ersten kontrollierten Runtime-Slice vorbereiten, **bevor** `jetnity.ch`/`jetnity.com` indexierbar werden.
3. D0-3 nicht ohne Legal-/PO-Texte starten.
4. G0-1 als Contract-only Shared-Slice führen, nicht als Tracking-Aktivierung.
5. Diesen PR Draft lassen, bis der Review das ausdrücklich ändert.

Kein weiterer Agent aus diesem Slice.  
Kein Ready. Kein Merge. Keine D1/G1+-Arbeit.
