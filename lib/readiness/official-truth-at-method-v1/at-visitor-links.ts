// Presentation-only navigation. The receiptHref is the unchanged historical
// authority allowlist; href is a public information link, not source qualification.
// Never use this list to approve, re-pin, renew or publish a fact.
export const AT_VISITOR_INFORMATION_LINKS = [
  { label: 'Österreichisches Innenministerium – Einreise', receiptHref: 'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/start.html', href: 'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/start.html' },
  { label: 'Österreichisches Innenministerium – Visumliste', receiptHref: 'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html', href: 'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html' },
  { label: 'Österreichische Botschaft Bern', receiptHref: 'https://www.bmeia.gv.at/oeb-bern/reise-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag/', href: 'https://www.bmeia.gv.at/oeb-bern/reise-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag' },
] as const
