// Official destination pointers only, no pass-specific legal adjudication.
// Each destination belongs to the next explicit priority from the owner's
// verified 206x50 RESEARCH_ONLY registry. No client source fetching/tracking,
// no payment, personal passport data, ETA/visa application or positive answer.
import {nextEightOfficialReview} from '@/lib/readiness/official-truth-next-eight-sources-v1'

const GERMAN=Object.freeze({
 GR:{name:'Griechenland',note:'Schengen-Kurzaufenthalt und Wohnsitz-/Aufenthaltstitelausnahmen müssen für den gewählten Pass und die Route gesondert bestätigt werden.'},
 HR:{name:'Kroatien',note:'Kroatien wendet seit 2023 Schengen-Regeln an. Grenzübertritt und Flughafentransitvisum sind voneinander zu trennen.'},
 NL:{name:'Niederlande',note:'Die europäischen Niederlande und karibische Gebiete sind nicht automatisch demselben Einreiserecht unterstellt.'},
 GB:{name:'Grossbritannien',note:'Je nach Staatsangehörigkeit und vorhandenem Aufenthaltsstatus können ein Visum oder eine ETA erforderlich sein. Ein ETA-Check ist keine Einreisegarantie.'},
 US:{name:'USA',note:'Das Visa-Waiver-Programm hat Pass-, Staatsangehörigkeits-, Reisehistorien- und ESTA-Bedingungen. ESTA ist kein Visum und keine Einreisegarantie.'},
 TR:{name:'Türkei',note:'Gewöhnlicher Pass, Diplomaten-/Dienstpass und e-Visum sind getrennte Fälle. Amtliche Änderung ab 02.01.2026 für gewöhnliche chinesische Reisepässe gesondert prüfen.'},
 TH:{name:'Thailand',note:'Wichtige amtliche Änderung ab 15.09.2026: Die frühere pauschale 60-Tage-Visumbefreiung wurde aufgehoben. Neue 30-/15-Tage-Listen und Visa-on-Arrival sind passgenau zu prüfen; keine alte Regel übernehmen.'},
 AE:{name:'Vereinigte Arabische Emirate',note:'Die 2026 erweiterte Einreisevisum-Regel hängt unter anderem von Staatsangehörigkeit UND einem passenden ausländischen Aufenthaltstitel ab. Keine pauschale Visumbefreiung.'},
} as const)

const linkStyle='underline underline-offset-4 break-words focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600'
export default function NextEightOfficialGuidance({country}:{country:string}){
 const entry=nextEightOfficialReview(country)
 if(!entry)return null
 const named=GERMAN[entry.country]
 return <section className="rounded-2xl border border-line-200 bg-white p-4 space-y-3"
  data-official-next-eight-country={country} data-official-status="RESEARCH_ONLY"
  aria-label={`Amtliche Einreise-Informationsquellen ${named.name}`}>
  <h3 className="text-lg font-semibold">{named.name} – amtliche Einreisequellen</h3>
  <p className="text-sm leading-6"><strong>Derzeit nicht verfügbar:</strong> Für diesen Pass ist keine individuell genehmigte Einreise- oder Visumregel verfügbar. Die nachstehenden Quellenhinweise sind nur eine Recherchegrundlage und ersetzen keinen amtlich geprüften persönlichen Entscheid.</p>
  <p className="text-sm leading-6">{named.note}</p>
  <p className="text-sm leading-6">Behördliche Anlaufstellen (Quellenrecherche vom 20.11.2026; keine passgenaue Zusage):</p>
  <ul className="list-disc space-y-2 pl-5 text-sm">
   <li><a className={linkStyle} href={entry.governmentPrimary} target="_blank" rel="noopener noreferrer">Amtliche Hauptquelle – {entry.directAuthorityName}</a></li>
   <li><a className={linkStyle} href={entry.governmentCountercheck} target="_blank" rel="noopener noreferrer">Weitere amtliche Information / Bedingungen</a></li>
  </ul>
  <p className="text-xs leading-5">Visum, ETA, Reisedokument, Passgültigkeit, Impfungen, Gesundheitsnachweise, Transit, Minderjährige, Formulare, Gebühren, Zoll und Sonderfälle: derzeit nicht verfügbar, solange die entsprechende Pass-/Reisebedingung nicht anhand der gültigen amtlichen Originalquelle geprüft und freigegeben ist.</p>
  <p className="text-xs leading-5">Amtliche Formulare und aktuelle Gebühren sind für deinen Einzelfall nicht bestätigt. Vorsicht vor kostenpflichtigen Fake- oder Vermittlerseiten; keine Zahlungen über inoffizielle Links.</p>
 </section>
}
