# Jetnity – Design-System

Stand: 16. August 2026
Status: Farbsystem und Responsive-Regeln verbindlich

Die Jetnity-V2-Markenwirkung darf nicht stillschweigend verändert werden ([AGENTS.md](AGENTS.md) Regel 11). Neue Komponenten verwenden ausschließlich die hier definierten Tokens.

---

## 1. Markencharakter

- tiefes Dunkelgrün als Träger der Marke
- hochwertiges Primärgrün
- Lime-/Gelbgrün als **gezielter** Akzent, nie als Fläche
- warmes Creme und Off-White statt kaltem Weiß
- zurückhaltende helle Grünflächen
- große, hochwertige Typografie
- viel Weißraum
- ruhige Premium-Wirkung, mobile-first

**Ohne Freigabe nicht erlaubt:** Blau oder Violett als Hauptfarbe, AI-Gradient-Look, Neon-SaaS-Look, unnötiger Glassmorphism, überladene Dashboards, generische Template-Ästhetik.

---

## 2. Farbtokens

Definition in `styles/globals.css`, Mapping in `tailwind.config.js`.

**Notation:** Tokens sind RGB-Kanäle ohne `rgb()`-Wrapper, Tailwind referenziert sie als `rgb(var(--jet-*) / <alpha-value>)`. Nur so funktionieren Opacity-Modifier wie `bg-brand-600/10`. Mit Hex-Werten in Custom Properties wären transparente Flächen deckend geworden.

### brand – Marken- und Primärgrün

| Token | Tailwind | Hex | Verwendung |
| --- | --- | --- | --- |
| `--jet-brand-600` | `brand-600` | `#1d715e` | Primärgrün, aktive Elemente |
| `--jet-brand-700` | `brand-700` | `#17604f` | Hover auf Primärgrün |
| `--jet-brand-800` | `brand-800` | `#153a33` | Markenflächen, Überschriften, Primär-Buttons |
| `--jet-brand-900` | `brand-900` | `#0f302a` | tiefste Markenfläche, Hover auf `brand-800` |

### citrus – Akzent

| Token | Tailwind | Hex | Verwendung |
| --- | --- | --- | --- |
| `--jet-citrus-300` | `citrus-300` | `#e8fa91` | helle Akzentfläche |
| `--jet-citrus-400` | `citrus-400` | `#dff47a` | Leitakzent, Logo-Element, Highlights |
| `--jet-citrus-500` | `citrus-500` | `#cfe99a` | gedämpfter Akzent |

Der Akzent bleibt sparsam. Er markiert eine Sache pro Ansicht, nicht mehrere.

Die Familie heißt bewusst `citrus` und nicht `lime`, weil `lime` mit Tailwinds eingebauter Palette kollidiert und bestehende Klassen wie `to-lime-400` still verändert hätte.

### surface – Flächen

| Token | Tailwind | Hex | Verwendung |
| --- | --- | --- | --- |
| `--jet-surface-0` | `surface-0` | `#fbfcf9` | hellste Fläche, fast weiß mit warmem Ton |
| `--jet-surface-25` | `surface-25` | `#f4f7f3` | ruhige Sektionsfläche |
| `--jet-surface-50` | `surface-50` | `#edf8f3` | grünlich getönte Fläche |
| `--jet-surface-75` | `surface-75` | `#f5f4ee` | warmes Creme, Kopfbereich |
| `--jet-surface-100` | `surface-100` | `#e5f2ec` | aktive/hervorgehobene Fläche |
| `--jet-surface-200` | `surface-200` | `#d8e4dc` | stärkste helle Fläche |

### line – Rahmen und Trennlinien

| Token | Tailwind | Hex |
| --- | --- | --- |
| `--jet-line-100` | `line-100` | `#edf0ed` |
| `--jet-line-200` | `line-200` | `#dce4df` |
| `--jet-line-300` | `line-300` | `#cbd7d2` |
| `--jet-line-400` | `line-400` | `#b9c8c2` |
| `--jet-line-500` | `line-500` | `#a7bbb4` |

### ink – Textfarben

Von hell (auf dunklem Grund) nach dunkel (auf hellem Grund).

| Token | Tailwind | Hex | Verwendung |
| --- | --- | --- | --- |
| `--jet-ink-300` | `ink-300` | `#ddf4e9` | Text auf dunkelgrüner Fläche |
| `--jet-ink-400` | `ink-400` | `#bce5d4` | sekundärer Text auf dunkler Fläche |
| `--jet-ink-500` | `ink-500` | `#9db8ad` | gedämpft |
| `--jet-ink-600` | `ink-600` | `#99a7a2` | gedämpft |
| `--jet-ink-650` | `ink-650` | `#82928d` | Hilfstext |
| `--jet-ink-700` | `ink-700` | `#6f827d` | Hilfstext |
| `--jet-ink-800` | `ink-800` | `#5f756d` | Sekundärtext |
| `--jet-ink-900` | `ink-900` | `#456059` | starker Sekundärtext |
| `--jet-ink-950` | `ink-950` | `#39534b` | dunkelster Fließtext |

### Zusammenführungsregel

Aus 87 hartkodierten Hex-Werten wurden 27 Tokens. Zusammengelegt wurde nur, was perzeptuell praktisch nicht unterscheidbar ist:

- größter Abstand ΔE76 **4.53**, ausschließlich bei kleinen Textfarben und 1px-Linien
- Flächen bleiben unter ΔE76 **1.9**

**Regel:** Keine neuen Fast-Duplikate einführen. Wer eine Farbe braucht, die es fast schon gibt, verwendet die bestehende.

---

## 3. Semantische Tokens (shadcn-Namen)

Die shadcn-Namen definieren **keine eigenen Farben**. Sie verweisen auf die Palette aus Abschnitt 2, damit es je Farbe genau eine Quelle gibt:

| Token | verweist auf | Zweck |
|---|---|---|
| `--background` | `surface-75` | Grundfläche des Dokuments |
| `--foreground` | `brand-800` | Standardtext, 11,3:1 auf der Grundfläche |
| `--card`, `--popover` | `surface-0` | aufliegende Flächen |
| `--primary` | `brand-800` | Hauptaktion |
| `--primary-foreground` | `surface-0` | Aufschrift darauf, 12,5:1 |
| `--secondary` | `surface-200` | ruhige gefüllte Fläche |
| `--muted` | `surface-100` | gedämpfte Fläche |
| `--muted-foreground` | `ink-800` | Nebentext, 4,53:1 – erfüllt AA |
| `--accent` | `surface-100` | Zeigen-Zustand in Menüs |
| `--border`, `--input` | `line-200` | Rahmen und Felder |
| `--ring` | `brand-600` | Fokusring |
| `--destructive` | `danger-600` | zerstörende Aktion, 5,64:1 mit weisser Schrift |

Zwei Punkte sind bewusst keine reine Ableitung:

- **`--ring` liegt auf `brand-600`, nicht auf `--primary`.** Der Fokusring muss sich von dem Element abheben, auf dem er sitzt. Auf einer `brand-800`-Schaltfläche wäre ein `brand-800`-Ring unsichtbar.
- **`danger` ist die einzige Funktionsfarbe ausserhalb der Marke.** Rot lässt sich für zerstörende Aktionen nicht durch Grün ersetzen. Es gibt zwei Stufen, beide auf AA-Kontrast gewählt: `danger-600` auf hellem, `danger-400` auf dunklem Grund.

Die Notation ist durchgehend RGB-Kanäle (`rgb(var(--token) / <alpha-value>)` in `tailwind.config.js`). Nur so funktioniert die Verweiskette, und Opacity-Modifier wie `bg-primary/10` bleiben nutzbar.

**Regel:** Neue Komponenten verwenden die semantischen Namen. Die Paletten-Namen (`brand-*`, `citrus-*`) sind für Fälle da, in denen es kein passendes semantisches Token gibt – etwa die citrus-Akzentflächen.

---

## 3a. Bekannte Abweichungen und Ausnahmen

**1. Dunkelthema nur im Admin.** Die öffentlichen V2-Seiten sind hell; ein dunkler Zustand ist für sie nicht gestaltet und nicht freigegeben. Der Admin hat einen Umschalter, dessen Flächen aus `night-*` kommen. Die Klasse sitzt auf `<html>`, weil nur dort Bildlaufleisten, native Steuerelemente und der Untergrund beim Überdehnen mitgefärbt werden – das Admin-Layout entfernt sie beim Verlassen wieder (siehe [DECISIONS.md](DECISIONS.md), ADR-0025).

**2. Feine Körnung über der Fläche.** `body::before` legt eine achromatische Rausch-Textur mit 6 % Deckkraft und `mix-blend-mode: multiply` über die Seite. Sie verschiebt keine Farbtöne.

---

## 4. Typografie

- Große, ruhige Überschriften mit negativem Tracking (`tracking-[-0.04em]` bis `-0.02em`) für den Premium-Charakter.
- Fließtext bleibt zurückhaltend in `ink-800` bis `ink-950`, nicht in reinem Schwarz.
- Textfarbe auf dunkelgrünem Grund: `ink-300` oder `ink-400`, nicht reines Weiß, außer bei Buttons und Logo.
- Keine dekorativen Schriftschnitte, keine Sperrung als Effekt.

---

## 5. Form und Interaktion

- Radien sind großzügig und rund: Pillen (`rounded-full`) für Navigation und Aktionen, weiche Radien für Karten.
- Primäraktion: `bg-brand-800`, Hover `bg-brand-900`, dazu eine minimale Anhebung (`hover:-translate-y-0.5`). Keine harten Farbsprünge.
- Fokus muss sichtbar sein und **grün**, nicht blau. `--ring` trägt `brand-600`; `focus-visible:ring-ring` genügt, eigene Ring-Farben sind nicht mehr nötig.
- Animationen nur, wo sie Orientierung geben. Keine Dauerbewegung, keine Parallax-Effekte ohne Zweck.
- Trennlinien möglichst leicht: `line-100` bis `line-300`, häufig zusätzlich mit Transparenz.

### 5.1 Button-Varianten

Das Primitiv führt nur, was auch gezeigt wird. Weitere Varianten kommen dazu, wenn eine Oberfläche sie braucht – ungenutzte müssten bei jeder Farbänderung ungeprüft mitlaufen.

| Variante | Verwendung |
|---|---|
| `default` | die Hauptaktion der Maske, auf `--primary` |
| `outline` | Nebenaktion mit Rahmen |
| `ghost` | Nebenaktion, Fläche erst beim Zeigen |
| `destructive` | zerstörende Aktion |

**`default` ist die auffällige Fläche, nicht die ruhige.** Eine Schaltfläche ohne Variante ist in der Praxis immer die Hauptaktion; läge auf `default` die Sekundärfläche, würde genau sie zurückweichen.

Höhen: `default` und `sm` tragen `min-h-11` (44 px, Abschnitt 7.5), Geräte mit Maus erhalten über `pointer-fine` die kompaktere Höhe. `min-h` statt `h`, damit eine umbrechende Aufschrift nicht über den Rand läuft. Der Radius liegt **nur** an der Größe – setzen Variante und Größe beide `rounded-*`, entscheidet die Auflösungsreihenfolge von `twMerge`.

---

## 6. Layout

- mobile-first; Layouts werden von der schmalen Breite aus gedacht
- zentrierte Inhaltsbreite mit `max-w-7xl` und großzügigem Innenabstand (`px-5` mobil, `px-8` ab `sm`)
- viel Weißraum zwischen Sektionen; im Zweifel mehr Abstand statt mehr Inhalt
- keine Kartenteppiche: wenige, große, klare Elemente statt vieler kleiner

---

## 7. Responsive-Regeln

Verbindlich für alle V2-Oberflächen. Referenzbreiten: **280, 320, 360, 375, 390, 430, 768, 1280 px**, dazu Landscape (844×390 und 667×375).

### 7.1 Kein horizontales Scrollen, kein Verstecken

Auf keiner V2-Seite darf horizontal gescrollt werden müssen, und kein Inhalt darf außerhalb des Viewports liegen.

**Ursachen werden behoben, nicht kaschiert.** `overflow-hidden` bzw. `overflow-x-hidden` darf nicht auf `main`, `body` oder ganze Seitenbereiche gelegt werden, um zu breite Inhalte unsichtbar zu machen. Genau das war der Zustand vor diesem Pass: ein `overflow-hidden` auf `main` hat auf der Startseite Inhalte bis zu 408 px breit abgeschnitten, ohne dass es als Fehler auffiel.

Erlaubt bleibt Clipping dort, wo es dem Bild dient:

- Karten und Sektionen mit Radius, die ihren eigenen Inhalt begrenzen
- bewusst über den Rand laufende **dekorative** Flächen (Glow, Verlauf). Diese werden mit `aria-hidden="true"` markiert, damit ihre Absicht erkennbar ist.

### 7.2 Grid- und Flex-Spuren müssen schrumpfen dürfen

Häufigste Ursache für zu breite Layouts: eine `auto`-Spur wächst auf die Mindestbreite ihres Inhalts und sprengt den Container.

- Grid-Spuren, die Inhalt tragen, als `minmax(0,…)` definieren, nicht als `1fr` oder `0.8fr`
- Grid- und Flex-Kinder mit Text, Eingabefeldern oder verschachtelten Layouts erhalten `min-w-0`
- horizontale Scroller (`overflow-x-auto`) funktionieren nur, wenn ihr Elternelement `min-w-0` hat; sonst wächst die Spur mit und der Scroller greift nie
- `<input>` in flexiblen Zeilen brauchen `w-full min-w-0`, sonst wirkt ihre intrinsische Standardbreite
- nutzergenerierte Texte (Reisetitel, Orte) mit `break-words` absichern

### 7.3 Feste Höhen sind Mindesthöhen und wachsen mit dem Breakpoint

Keine großen `min-h`-Werte pauschal für alle Breiten. Staffelung von der kleinen Breite nach oben, zum Beispiel Hero `min-h-[520px] sm:min-h-[600px] lg:min-h-[720px]`. So bleibt die Desktop-Wirkung unverändert und Landscape auf dem Telefon nutzbar.

### 7.4 Typografie auf kleinen Geräten

Große Schriftgrade werden unterhalb `sm` (640 px) reduziert, darüber bleiben sie unverändert:

- Hero-Headline `text-[clamp(34px,7vw,78px)]` – die Untergrenze greift nur unter 600 px
- Sektions-Headlines `text-3xl sm:text-5xl` statt `text-4xl` auf allen Breiten

### 7.5 Touch-Ziele

- Primäraktionen, Menüpunkte und Icon-Buttons mindestens 44 px hoch
- Icon-Buttons in Listen mindestens 40 px
- freistehende Textlinks dürfen kleiner sein, brauchen aber Abstand: bei Zielen unter 24 px darf sich der 24-px-Radius um zwei Ziele nicht überschneiden (WCAG 2.2, SC 2.5.8, Ausnahme „Spacing“)

### 7.6 Eingabefelder

Felder tragen unterhalb `sm` mindestens **16 px** Schriftgröße (`text-base sm:text-sm`). Kleinere Werte lösen auf iOS beim Fokus einen automatischen Zoom aus, der das Layout verschiebt.

Jedes Feld hat genau ein Bedienelement pro Funktion. Das `Input`-Primitiv bringt für `type="password"` bereits einen Umschalter mit; Formulare bauen keinen zweiten daneben.

### 7.7 Beschriftungen

Das `Label`-Primitiv kürzt einzeilige Feldnamen mit Ellipse. Satzlanger Text – etwa eine Einwilligung mit Links – bekommt `multiline` und bricht dann um. Ohne das erzwingt `truncate` eine Zeile, die die Seite verbreitert und Linktext unerreichbar macht.

Symbole gehören in die dafür vorgesehenen Eigenschaften: `leftIcon` bzw. `rightIcon` beim Button, `icon` bei der Beschriftung. Der Grund ist dieselbe Preflight-Regel in beiden Fällen: `svg { display: block }` macht ein Symbol im laufenden Text zu einer eigenen Zeile. Beim Button rutscht es dadurch unter die Aufschrift, bei der Beschriftung über den Feldnamen.

### 7.8 Waagrechte Scrollbereiche

Inhalte, die auf schmalen Geräten nicht sinnvoll umbrechen – Tabellen, Reiter, Chip-Reihen – bekommen die Komponente `ScrollRow` statt eines nackten `overflow-x-auto`. Sie löst drei Punkte, die sonst regelmäßig fehlen:

- der Bereich selbst trägt `min-w-0`, sonst wächst die umgebende Spur auf die volle Inhaltsbreite und es gibt nichts zu scrollen
- `overscroll-x-contain` verhindert, dass eine Wischbewegung am Rand die Zurück-Navigation des Browsers auslöst
- weiche Kanten zeigen an, dass seitlich weiterer Inhalt steht; sie erscheinen nur an der Seite, an der wirklich etwas liegt

Der Bereich ist über `tabIndex` auch mit der Tastatur bedienbar. Erste und letzte Kachel müssen vollständig erreichbar sein, und die Seite selbst darf dadurch kein waagrechtes Scrollen bekommen.

### 7.9 Untergrund des Dokuments

Die Fläche liegt auf `html`, nicht auf `body`. Sichtbar wird sie beim Überdehnen des Scrollbereichs auf iOS und unterhalb von Seiten, die kürzer sind als der Viewport. Sie muss deshalb dieselbe warme Fläche zeigen wie die Seiten; eine abweichende Farbe fällt genau in dem Moment auf, in dem der Nutzer die Seite anfasst.

### 7.10 Safe Area

`viewport-fit` bleibt bewusst auf `auto`. iOS begrenzt den Viewport damit selbst auf den sicheren Bereich, Inhalte geraten nicht unter Notch oder Home-Indikator. `cover` würde diesen Schutz abschalten und Randabstände in jeder Sektion nötig machen – ohne Gewinn, da die V2-Sektionen ohnehin mit Außenabstand als Karten liegen.

Randverankerte Elemente rechnen zusätzlich `env(safe-area-inset-*)` ein, weil die App per Manifest als `standalone` installierbar ist und in diesem Modus (Android edge-to-edge) echte Insets auftreten:

- Kopfzeile: `pt-`/`pl-`/`pr-[env(safe-area-inset-*)]`
- Footer: `pb-`/`pl-`/`pr-[env(safe-area-inset-*)]`
- fixierte Elemente wie „Nach oben“: `bottom-[calc(1.5rem+env(safe-area-inset-bottom))]`

Im normalen Browser sind diese Werte 0, das Layout bleibt unverändert.

---

## 8. Regeln für neue Komponenten

1. Keine Hex-Literale in `className`. Nur Tokens.
2. Keine neue Farbe einführen, ohne zu prüfen, ob ein Token perzeptuell schon passt.
3. Kein Blau, kein Violett, kein Gradient-AI-Look.
4. Neue Tokens brauchen einen Eintrag in dieser Datei und in [DECISIONS.md](DECISIONS.md).
5. Sichtbare Neugestaltung bestehender Oberflächen braucht vorher Freigabe.
6. Neue Komponenten werden vor dem Abschluss auf den Referenzbreiten aus Abschnitt 7 geprüft.
