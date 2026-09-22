export const ADMIN_EHRLICHE_TEXTE = {
  steuerzentraleLage:
    'Operative Lage aus vorhandenen lokalen Daten. System Health und Provider & Kosten sind read-only und nur so weit belegt, wie eine frische Quelle reicht. Kein Copilot-Execute, keine Provider-Steuerung.',
  kennzahlenHinweis: 'Lokale Kennzahlen aus vorhandenen Aggregaten. Keine Provider-Health.',
  umsatzConversionHinweis:
    'Umsatz, Bestellungen und Conversion sind nicht verfügbar, solange kein provider-backed kommerzieller Pfad existiert. Lokale Zahlungsreste sind kein Umsatz.',
  rlsKatalogTitel: 'Datenbank-RLS-Katalog',
  rlsKatalogHinweis:
    'Nur RLS-Abdeckung der bekannten Tabellen. Keine Infrastruktur-Health und kein System-Health-Backend.',
  zahlungenTitel: 'Lokale Zahlungssicht',
  zahlungenHinweis:
    'Lokale/operative Übersicht. Keine provider-backed Geldbewegung und kein verbundenes Payment-Konto.',
  refundTitel: 'Lokale Refund-Notiz',
  refundHinweis:
    'Keine echte Geldbewegung. Es gibt keinen verbundenen Payment-Provider. Dieser Vorgang schreibt nur in die lokale Tabelle refunds.',
  refundButton: 'Lokal vermerken',
  refundErfolg: 'Lokal in refunds vermerkt. Keine Provider-Erstattung.',
  securityTitel: 'Security',
  securityHinweis:
    'Diese Fläche liest lokale Zeilen aus security_events. Die aktuelle Jetnity-Anwendung liefert keine vollständige Event-Ingestion. 0 aufgezeichnete Zeilen belegen nicht, dass kein sicherheitsrelevantes Ereignis stattgefunden hat. Keine Live-Überwachung. Die IP-Blockliste ist derzeit nicht enforced.',
  securityAbdeckungHinweis:
    'Die Kennzahlen und die Tabelle zählen nur aufgezeichnete Zeilen im aktuellen Fenster von security_events. Fehlende Ingestion heisst: die Abdeckung ist unvollständig.',
  securityKpiEvents24h: 'Aufgezeichnete Events (24h)',
  securityKpiLoginFehler24h: 'Aufgezeichnete Login-Fehler (24h)',
  securityKpiAuffaelligkeiten24h: 'Aufgezeichnete Auffälligkeiten (24h)',
  securityTabelleTitel: 'Aufgezeichnete Security-Events (7 Tage)',
  securityTabelleLeer: 'Keine aufgezeichneten Events in diesem Zeitraum.',
  ipBlockHinweis:
    'Die IP-Blockliste wird derzeit nicht enforced. Einträge stehen in blocked_ips; Middleware und Edge prüfen sie nicht.',
  ipBlockButton: 'In Blockliste schreiben',
  ipBlockErfolgPrefix: 'In Blockliste geschrieben (nicht enforced):',
  ipUnblockErfolgPrefix: 'Aus Blockliste entfernt (nicht enforced):',
  copilotFolgt: 'Copilot Pro folgt',
  copilotFolgtHinweis: 'Kein Execute-Pfad. Automatik ist nicht verfügbar.',
  sucheBereiche: 'Bereiche suchen',
  sucheBereicheHinweis:
    'Lokale Navigation über vorhandene Admin-Bereiche. Keine Datensatzsuche, kein Befehl, kein Execute.',
  sucheBereichePlatzhalter: 'Bereich suchen',
  sucheBereicheLeer: 'Vorhandene Bereiche dieser Sitzung. Keine Datensatzsuche.',
  sucheBereicheKeinTreffer: 'Kein passender Bereich.',
  sucheBereicheKuerzel: 'Strg+K',
  aktuelleHinweiseTitel: 'Aktuelle Hinweise',
  aktuelleHinweiseHinweis:
    'Regelbasierte Lage aus dem letzten System-Health-Stand dieses Prozesses. Alter und Frische folgen dem ursprünglichen Prüfzeitpunkt und dem Auswertezeitpunkt; unbekannt und veraltet bleiben sichtbar. Das belegt nicht die aktuelle Sitzung. Kein Copilot-Execute, keine Live-Überwachung, keine Modellantwort.',
  aktuelleHinweiseKeinSignal:
    'Aus den belegten System-Health-Quellen ergibt sich gerade keine priorisierte Untersuchung. Belegt sind Prozess-Erreichbarkeit und — wenn frisch — eine prozessweite airports-Beobachtung. Plattform-Health bleibt unbelegt.',
  aktuelleHinweiseNotzugang:
    'Für Notzugang werden datenbankgestützte System-Health-Fakten nicht zugeschrieben, auch nicht aus dem Prozess-Cache.',
  aktuelleHinweiseOhnePruefung:
    'Ohne bestandene betrieb-lesen-Prüfung wird System Health nicht gelesen.',
  aktuelleHinweiseVeraltet: 'Stand ist veraltet.',
  aktuelleHinweiseProzessBeweis:
    'Ein Prozess in dieser Instanz hat public.airports in einem kürzlichen Sammellauf beantwortet. Das ist kein Nachweis für die aktuelle Sitzung.',
  aktuelleHinweiseProzessGrenze:
    'Die Beobachtung stammt aus einem Prozessstand. Sie belegt nicht, dass die aktuelle Sitzung den airports-Read ausgeführt hat.',
  aktuelleHinweiseUntersuchen: 'System Health öffnen',
  aktuelleHinweiseKeinSignalTitel: 'Keine priorisierte Untersuchung',
  aktuelleHinweiseAbdeckungTitel: 'Erwartete Plattform-Quellen unbelegt',
  aktuelleHinweiseAbdeckungSatz:
    'Vercel, GitHub, Infomaniak und Supabase Management sind in diesem Stand nicht angebunden. Das ist Abdeckung, kein Auftrag, neue Tokens anzulegen.',
  aktuelleHinweiseSammlungFehlt: 'Die System-Health-Sammlung ist fehlgeschlagen. Es wird kein leerer All-Clear erzeugt.',
  aktuelleHinweiseUnvollstaendig:
    'Der System-Health-Bericht ist unvollständig. Fehlende Karten werden nicht als gesund angenommen.',
  modellnutzungTitel: 'Modellnutzung',
  modellnutzungHinweis:
    'Status und Frische der aufgezeichneten Modellnutzung aus dem bestehenden Provider-Ops-Stand. Nur ein begrenzter Read der letzten 30 Tage, höchstens 200 Zeilen. Das ist kein vollständiges Ausgabenbild, keine Providerrechnung und kein globales Budget. Kein Copilot-Execute, keine Live-Überwachung, keine Modellantwort.',
  modellnutzungOhnePruefung:
    'Ohne bestandene betrieb-lesen-Prüfung wird die Modellnutzung nicht gelesen.',
  modellnutzungNotzugang:
    'Für Notzugang werden datenbankgestützte Modellnutzungs-Fakten nicht zugeschrieben, auch nicht aus dem Prozess-Cache.',
  modellnutzungVeraltet: 'Stand ist veraltet.',
  modellnutzungProzessGrenze:
    'Die Beobachtung stammt aus einem Prozessstand. Sie belegt nicht, dass die aktuelle Sitzung model_usage gelesen hat.',
  modellnutzungFensterGrenze:
    'Der Read umfasst höchstens die letzten 30 Tage und höchstens 200 Zeilen. Das ist kein vollständiges Monats- oder Provider-Ledger.',
  modellnutzungUntersuchen: 'Provider & Kosten öffnen',
  modellnutzungAvailable:
    'Aufgezeichnete Modellnutzungszeilen waren in diesem begrenzten Read lesbar. Das ist Abdeckung, keine Finanz-, Budget- oder Limitaussage.',
  modellnutzungEmpty:
    'Im begrenzten Read der letzten 30 Tage, höchstens 200 Zeilen, wurden keine aufgezeichneten Modellnutzungszeilen gefunden. Das ist kein Beleg für null Ausgaben und keine vollständige Ausgabenaussage.',
  modellnutzungUnavailable:
    'Die Modellnutzungsquelle konnte nicht gelesen werden. Das ist kein leeres Kostenprotokoll und kein Beleg für null Ausgaben.',
  modellnutzungUnknown:
    'Der Modellnutzungsstand ist unbekannt. Unbekannt ist nicht leer und kein Beleg für null Ausgaben.',
  modellnutzungFoundation:
    'Dieser Stand liefert keine nutzbare Modellnutzungs-Evidenz. Das ist keine Empfehlung, Provider zu aktivieren oder Tokens anzulegen.',
  modellnutzungSammlungFehlt:
    'Die Modellnutzungsquelle ist fehlgeschlagen. Es wird kein leerer All-Clear und kein Beleg für null Ausgaben erzeugt.',
  modellnutzungUnvollstaendig:
    'Die Modellnutzungs-Karte im Provider-Ops-Stand fehlt, ist doppelt oder unbrauchbar. Es wird kein erster Treffer und kein gesunder Fallback erzeugt.',
  modellnutzungKeinFinanzClaim:
    'Nicht gesunde Finanzen, kein Budget, kein Limit und keine vollständigen Providerkosten.',
  modellnutzungKeinNullSpend:
    'Nicht, dass keine Kosten entstanden sind, und nicht ein vollständiges Ausgabenbild.',
  modellnutzungKeineAktivierung:
    'Nicht, dass ein Provider aktiviert oder ein Token angelegt werden muss.',
} as const

export type AdminNaechsterSchrittStand = 'ready' | 'later'

export type AdminNaechsterSchritt = {
  titel: string
  satz: string
  href: string | null
  stand: AdminNaechsterSchrittStand
}

export const ADMIN_NAECHSTE_SCHRITTE: readonly AdminNaechsterSchritt[] = [
  {
    titel: 'Nutzer',
    satz: 'Konten, Rollen und Status über die bestehende Nutzerverwaltung.',
    href: '/admin/users',
    stand: 'ready',
  },
  {
    titel: 'Zahlungen',
    satz: ADMIN_EHRLICHE_TEXTE.zahlungenHinweis,
    href: '/admin/payments',
    stand: 'ready',
  },
  {
    titel: 'Security',
    satz: ADMIN_EHRLICHE_TEXTE.securityHinweis,
    href: '/admin/security',
    stand: 'ready',
  },
  {
    titel: 'System Health',
    satz: 'Read-only. Nur belegte Quellen. Fehlt eine Quelle, bleibt unknown oder not_configured.',
    href: '/admin/system-health',
    stand: 'ready',
  },
  {
    titel: 'Provider & Kosten',
    satz: 'Read-only S1-Vertrag und belegte Modellnutzung. Kein Aktivieren, kein erfundenes Budget.',
    href: '/admin/provider-ops',
    stand: 'ready',
  },
  {
    titel: 'Copilot Pro',
    satz: ADMIN_EHRLICHE_TEXTE.copilotFolgtHinweis,
    href: null,
    stand: 'later',
  },
  {
    titel: 'Infomaniak / Domain & Mail',
    satz: 'Kein Token und kein DNS-/Mail-Write in Slice A.',
    href: null,
    stand: 'later',
  },
]

export function adminFolgtSeitenhinweis(bereich: string): string {
  return `${bereich} ist kein fertiges Modul. Die Fläche ist ein Platzhalter und enthält keine operative Steuerung.`
}
