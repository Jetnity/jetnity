-- Jetnity V2 – Phase 1.5: die letzte Tabelle der alten Produktidee entfernen
--
-- Phase 1.4b hat 29 Tabellen entfernt und `creator_sessions` bewusst stehen
-- gelassen: Die Startseite der Administration zog ihre Kennzahlen daraus, und
-- eine Kennzahl zu entfernen, ohne einen Ersatz zu haben, wäre eine
-- Verschlechterung gewesen ([docs/LEGACY_ENTFERNUNG.md]).
--
-- Der Ersatz steht seit 20260817120100: `admin_reisen_kennzahlen()` und
-- `admin_reisen_zeitreihe(integer)` zählen Reisen. Die beiden Ansichten der
-- Administration lesen sie, und `creator_sessions` hat damit keinen Aufrufer
-- mehr.
--
-- ---------------------------------------------------------------------------
-- Nachweis vor dem Entfernen, gemessen auf Development
-- ---------------------------------------------------------------------------
--
--   Zeilen                      0 – es werden keine Daten vernichtet
--   Eingehende Fremdschlüssel   keine
--   Abhängige Views             keine
--   Sequenzen                   keine
--   Publikationen               keine
--   Ausgehender Fremdschlüssel  creator_sessions_user_id_fkey → auth.users
--   Auslöser                    t_creator_sessions_updated_at → set_updated_at()
--   Policies                    4, alle auf dieser Tabelle
--   Indizes                     7, alle auf dieser Tabelle
--   Eigene Typen in Spalten     visibility_status (nur hier verwendet)
--   Funktionen mit Bezug        append_email_to_array(text, uuid),
--                               append_email_to_array(uuid, text),
--                               remove_email_from_array(uuid, text)
--   Anwendungscode              nur AdminStatsStrip und AdminTimeSeries,
--                               beide in diesem Zweig umgestellt
--
-- Kein `cascade`. Hängt etwas an den Objekten, das oben nicht steht, soll diese
-- Migration scheitern statt es stillschweigend mitzunehmen (AGENTS.md Regel 22).

-- ---------------------------------------------------------------------------
-- 1. Funktionen, die ausschliesslich zu dieser Tabelle gehören
-- ---------------------------------------------------------------------------
--
-- Alle drei lesen `creator_sessions.shared_with` – die Freigabeliste einer
-- Creator-Session. Keine hat ein EXECUTE-Recht für `anon` oder
-- `authenticated`, keine wird im Anwendungscode aufgerufen. Sie überlebten den
-- `drop table` sonst unbemerkt und schlügen erst beim Aufruf fehl: genau die
-- Fehlerklasse, die `npm run db:rechte` seit Phase 1.4b prüft.

drop function public.append_email_to_array(email text, session_id uuid);
drop function public.append_email_to_array(id uuid, email_to_add text);
drop function public.remove_email_from_array(id uuid, email_to_remove text);

-- ---------------------------------------------------------------------------
-- 2. Auslöser und seine Funktion
-- ---------------------------------------------------------------------------
--
-- `set_updated_at()` hängt an genau einem Auslöser, und der sitzt auf
-- `creator_sessions`. Das V2-Reiseschema bringt seine eigene Fassung mit
-- (`setze_aktualisiert_am()`, 20260817120000); zwei Funktionen mit derselben
-- Aufgabe im Schema stehen zu lassen wäre die Art von Doppelpflege, die Phase
-- 1.4 aufgeräumt hat.

drop trigger t_creator_sessions_updated_at on public.creator_sessions;
drop function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. Die Tabelle
-- ---------------------------------------------------------------------------
--
-- Policies, Indizes und Rechte gehören zur Tabelle und fallen mit ihr. Der
-- ausgehende Fremdschlüssel auf `auth.users` ebenso.

drop table public.creator_sessions;

-- ---------------------------------------------------------------------------
-- 4. Die beiden verbliebenen Enums
-- ---------------------------------------------------------------------------
--
-- `visibility_status` trug ausschliesslich `creator_sessions.visibility`.
--
-- `session_status` war schon vor Phase 1.4b verwaist. Damals blieb es stehen,
-- weil seine drei Werte genau die waren, die
-- `creator_sessions_review_status_check` auf der verbleibenden Spalte
-- `review_status` erlaubte – es war also nicht *nachweisbar* ausschliesslich
-- Teil der entfernten Struktur ([docs/DATENBANK.md] Abschnitt 11). Mit der
-- Tabelle fällt auch diese Spalte, und damit ist der Nachweis erbracht: Kein
-- Attribut im Cluster verwendet einen der beiden Typen mehr.
--
-- Ohne `cascade`: Verwendet noch irgendetwas einen der Typen, scheitert die
-- Anweisung.

drop type public.visibility_status;
drop type public.session_status;

-- Damit führt das Schema keinen Enum-Typ mehr. Das ist Absicht und keine
-- Lücke: Das V2-Reiseschema drückt seine Wertebereiche in CHECK-Bedingungen
-- aus (Begründung in 20260817120000 und DECISIONS.md ADR-0043).

-- ---------------------------------------------------------------------------
-- 5. Was dadurch offen bleibt
-- ---------------------------------------------------------------------------
--
-- Die Fähigkeit `inhalte-moderieren` deckt jetzt keine Tabelle mehr ab –
-- `creator_sessions` war ihre letzte. Sie bleibt trotzdem bestehen, wie
-- `konfiguration-verwalten` seit Phase 1.4b: Beide sind Teil des
-- Fähigkeitsmodells, das `CAPABILITY_MINIMUM` in `lib/auth/roles.ts` und
-- `lib/auth/faehigkeiten-datenbank.test.ts` zusammenhalten.
--
-- Reisen sind ausdrücklich **nicht** der neue Gegenstand dieser Fähigkeit.
-- Private Reiseinhalte werden nicht moderiert, und Adminrechte erweitern den
-- Zugriff darauf nicht (DECISIONS.md ADR-0041). `npm run db:sicherheit` prüft
-- beide Fähigkeiten deshalb direkt über `select 1 where public.darf_…()`.
