# ADR-0203 – TA-CUX1 Shared Country Presentation

**Datum:** 30. August 2026  
**Status:** Implementiert auf Draft-PR #234 / nicht gemergt / Persistenz bleibt Country-Code

## Entscheidung

1. Persistenz und Domain bleiben der kanonische ISO-3166-1-alpha-2-Code. Der lokalisierte Name und die Flagge sind nur Presentation.
2. Eine einzige Foundation (`lib/country/*`) plus ein einziges Control (`components/country/LandFeld.tsx`) bedienen Account Registry und Trip-Workspace-Reisendenkontext.
3. Neu auswählbar sind nur offiziell zugewiesene ISO-3166-1-alpha-2-Codes. Beliebige Zwei-Buchstaben-Werte sind keine gültige neue Auswahl.
4. Unerwartete persistierte Codes bleiben sichtbar als `Bestehender Code XX` und werden nicht still einem Land zugeordnet.
5. Das Control ist ein natives `<select>` plus Filterfeld. Eine Custom-Combobox wurde bewusst nicht gebaut, weil der vorhandene Stack kein robustes Combobox-Primitive hat und Accessibility Vorrang vor Optik hat.
6. Kein Defaultland aus Locale, IP, Browser oder First-Item. Issuer, Citizenship und Residence bleiben getrennte Facts.

## Alternativen

1. Custom Combobox/Listbox – suchfreundlicher, aber im aktuellen Stack (kein Radix-Combobox, kein cmdk) accessibility-riskant.
2. Nur natives Select ohne Filter – maximal zugänglich, aber die verlangte Namenssuche entfällt.
3. Neue npm-Abhängigkeit für Länderdaten/Flaggen – unnötig; `Intl.DisplayNames` und Regional-Indicator-Flags reichen.
4. Neue Country-Tabelle / Migration – ausserhalb des Non-Scope und ändert die Domain-Wahrheit.

## Konsequenzen

Tastatur, Screenreader und Touch delegieren an das native Select. Die Filterzeile verhindert Enter-Submit im umgebenden Formular. Namen werden nicht persistiert. Domain-Reader (`landescodeLesen` / Zod `^[A-Z]{2}$`) bleiben unverändert, damit Legacy-Werte nicht am Server verworfen werden.
