export const ADMIN_EHRLICHE_TEXTE = {
  steuerzentraleLage:
    'Operative Lage aus vorhandenen lokalen Daten. System Health ist read-only und nur so weit belegt, wie eine frische Quelle reicht. Kein Copilot-Execute, keine Provider-Steuerung.',
  kennzahlenHinweis: 'Lokale Kennzahlen aus vorhandenen Aggregaten. Keine Provider-Health.',
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
    'Lokale Events und Blockliste. Keine Live-Überwachung. Die IP-Blockliste ist derzeit nicht enforced.',
  ipBlockHinweis:
    'Die IP-Blockliste wird derzeit nicht enforced. Einträge stehen in blocked_ips; Middleware und Edge prüfen sie nicht.',
  ipBlockButton: 'In Blockliste schreiben',
  ipBlockErfolgPrefix: 'In Blockliste geschrieben (nicht enforced):',
  ipUnblockErfolgPrefix: 'Aus Blockliste entfernt (nicht enforced):',
  copilotFolgt: 'Copilot Pro folgt',
  copilotFolgtHinweis: 'Kein Execute-Pfad. Automatik ist nicht verfügbar.',
  sucheFolgt: 'Befehlssuche folgt',
  sucheFolgtHinweis: 'Keine funktionierende Befehlspalette in Slice A.',
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
