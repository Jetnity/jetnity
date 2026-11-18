// Destination-level official service links for IT, FR, ES, PT.
// NO traveller/passport-specific positive claims; private 4x50 imported rows
// are RESEARCH_ONLY until a separate approved destination method and source gate.
type Country = 'IT' | 'FR' | 'ES' | 'PT'
type Official = Readonly<{
  name:string; authority:string; generalUrl:string; scope:string;
  application: Readonly<{label:string;url:string;cost:string}> | null;
}>
const WARNING='Warnung vor Fake- und Drittanbieterseiten: Nutze nur die verlinkte amtliche Website. Vermittler können zusätzliche Kosten verlangen oder persönliche Daten missbrauchen.'
const SOURCES:Readonly<Record<Country,Official>>=Object.freeze({
 IT:Object.freeze({
  name:'Italien',authority:'Italienisches Aussenministerium',
  generalUrl:'https://www.esteri.it/it/ministero/sportello_info/domandefrequenti/sezione_visti_entrare_in_italia/',
  scope:'Die amtliche Visumprüfung berücksichtigt Staatsangehörigkeit, Wohnsitz, Reisegrund, Dauer und Dokumenttyp. Die Ergebnisse sind noch nicht als passgenaue Jetnity-Regeln freigegeben.',
  application:null,
 }),
 FR:Object.freeze({
  name:'Frankreich',authority:'France-Visas – Französische Regierung',
  generalUrl:'https://france-visas.gouv.fr/en/faq',
  scope:'Ausnahmen hängen unter anderem von Passklasse, Nationalität, Aufenthaltstitel, Aufenthaltsdauer und französischen Überseegebieten ab.',
  application:Object.freeze({label:'Offizieller Zugang zur Online-Visumantragstellung',
   url:'https://france-visas.gouv.fr/demande-de-visa',
   cost:'Kurzaufenthaltsvisum normalerweise 90 €, mit gesetzlichen Befreiungen und Ermässigungen. Das Formular ist nicht automatisch für deinen Pass erforderlich.'}),
 }),
 ES:Object.freeze({
  name:'Spanien',authority:'Spanisches Innenministerium',
  generalUrl:'https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/tramites-y-gestiones/extranjeria/regimen-general/entrada-requisitos-y-condiciones/',
  scope:'Passgültigkeit, Finanzmittel, Rückreise und Transit sind von Einreisekontext und Nationalität abhängig. In der vorhandenen Recherche sind Konflikte offen; daher keine pauschale Freigabe.',
  application:null,
 }),
 PT:Object.freeze({
  name:'Portugal',authority:'Portugiesischer Regierungsservice gov.pt',
  generalUrl:'https://www.gov.pt/servicos/pedir-um-visto-schengen-de-curta-duracao',
  scope:'Der offizielle Service bietet den Zugang zur Visumantragstellung. Bei aktuellen Gebühren nennen Behördenportale teilweise unterschiedliche Werte; bis zur amtlichen Klärung kein fester Preis.',
  application:Object.freeze({label:'Offizieller staatlicher Online-Visumservice',
   url:'https://www.gov.pt/servicos/pedir-um-visto-schengen-de-curta-duracao',
   cost:'Derzeit nicht verfügbar: widersprüchliche aktuelle Quellen; beim zuständigen portugiesischen Konsulat nachfragen.'}),
 }),
})
const linkStyle='underline underline-offset-4 break-words focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600'
function AmtlicherLink({url,label}:{url:string;label:string}){
 return <a href={url} target="_blank" rel="noopener noreferrer" className={linkStyle}>{label}</a>
}

export default function FollowupOfficialGuidance({country}:{country:string}){
 const selected=SOURCES[country as Country]
 if(!selected)return null
 return <section className="rounded-2xl border border-line-200 bg-white p-4 space-y-3"
   aria-label={`Amtliche Einreiseinformationen ${selected.name}`}
   data-entry-next-four-country={country} data-official-status="RESEARCH_ONLY">
  <h3 className="text-lg font-semibold">Amtliche Informationen zu {selected.name}</h3>
  <p className="text-sm leading-6"><strong>Derzeit nicht verfügbar:</strong> Für diesen Pass liegen noch keine von Jetnity bestätigten Einreise- oder Visumfakten vor.
   Die folgenden amtlichen Informationsseiten ersetzen keine passgenaue, geprüfte Auskunft.</p>
  <p className="text-sm leading-6">{selected.scope}</p>
  <p className="text-sm"><AmtlicherLink url={selected.generalUrl} label={selected.authority}/></p>
  {selected.application?<div className="space-y-2 border-t border-line-200 pt-2" data-official-form-source={country}>
   <p className="text-sm"><AmtlicherLink url={selected.application.url} label={selected.application.label}/></p>
   <p className="text-xs leading-5">Kosten: {selected.application.cost}</p>
   <p className="text-xs leading-5">{WARNING}</p>
  </div>:<p className="text-xs leading-5">Direktes anwendbares Antragsformular und Kosten: derzeit nicht verfügbar.
   Bitte prüfe die zuständige amtliche Antragsstelle. {WARNING}</p>}
  <p className="text-xs leading-5">Passgültigkeit, ETA, Impfungen, Gesundheit, Transit, Minderjährige, Zoll und Sonderfälle:
    derzeit nicht verfügbar, bis eine eigene amtlich belegte Regel freigegeben ist.</p>
 </section>
}
