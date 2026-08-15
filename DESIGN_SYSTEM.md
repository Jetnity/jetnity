# Jetnity – Design-System

Stand: 15. August 2026
Status: Farbsystem verbindlich

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

## 3. Bekannte Abweichungen und Ausnahmen

**1. shadcn-Tokens tragen noch die alte Farbwelt.** In `styles/globals.css` gilt weiterhin `--primary: 222 84% 56%` (Blau) und `--accent: 264 85% 62%` (Violett), dazu `--ring: var(--primary)`. Diese Tokens widersprechen Abschnitt 1. Sie werden von Radix-/shadcn-Komponenten genutzt, unter anderem für Fokus-Ringe und Buttons in Alt-Oberflächen. Die Umstellung auf die V2-Farbwelt ist freigegeben ([DECISIONS.md](DECISIONS.md), ADR-0008) und noch nicht umgesetzt.

**2. Tote Tokens mit Blauanteil.** `--jet-hero: 14 27 46` (`#0E1B2E`, dunkles Blau) und `--jet-btn: 17 19 23` sowie die Utilities `.bg-hero-panel`, `.bg-hero-panel-strong` und `.btn-hero` werden in `app/` und `components/` **nicht** verwendet. Sie stammen aus der alten Farbwelt und werden mit der shadcn-Umstellung entfernt.

**3. Namensähnlichkeit `surface`.** Es existieren zwei Gruppen: `--jet-surface-*` (V2, RGB-Kanäle, über Tailwind als `surface-*` nutzbar) und `--surface-1/2/3` (alt, HSL). Nur die `--jet-surface-*`-Tokens sind für V2 verbindlich. Die alten werden mit der shadcn-Umstellung geprüft.

**4. Kein Dark-Mode für V2.** Die Root-Ebene setzt `color-scheme: light`. Ein Dark-Theme-Block existiert aus der Alt-Welt, ist aber für die V2-Oberflächen nicht ausgearbeitet und nicht freigegeben.

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
- Fokus muss sichtbar sein und **grün**, nicht blau. Bei neuen Komponenten Fokus-Ringe explizit auf `brand`-Tokens setzen, solange `--ring` noch die alte Farbe trägt.
- Animationen nur, wo sie Orientierung geben. Keine Dauerbewegung, keine Parallax-Effekte ohne Zweck.
- Trennlinien möglichst leicht: `line-100` bis `line-300`, häufig zusätzlich mit Transparenz.

---

## 6. Layout

- mobile-first; Layouts werden von der schmalen Breite aus gedacht
- zentrierte Inhaltsbreite mit `max-w-7xl` und großzügigem Innenabstand (`px-5` mobil, `px-8` ab `sm`)
- viel Weißraum zwischen Sektionen; im Zweifel mehr Abstand statt mehr Inhalt
- keine Kartenteppiche: wenige, große, klare Elemente statt vieler kleiner

---

## 7. Regeln für neue Komponenten

1. Keine Hex-Literale in `className`. Nur Tokens.
2. Keine neue Farbe einführen, ohne zu prüfen, ob ein Token perzeptuell schon passt.
3. Kein Blau, kein Violett, kein Gradient-AI-Look.
4. Neue Tokens brauchen einen Eintrag in dieser Datei und in [DECISIONS.md](DECISIONS.md).
5. Sichtbare Neugestaltung bestehender Oberflächen braucht vorher Freigabe.
