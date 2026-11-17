// General Austrian primary-source pointers only, NOT a passport-specific
// Official Truth rule. Unverified obligations are never displayed as required.
// Only the official fixed URL set is rendered; no third-party checkout.
const OFFICIAL_VISA_C='https://www.bmeia.gv.at/fileadmin/user_upload/Allgemein/Formulare_ab_2023/Antragsformular_Visum_C1_Schengenvisum_DE-ES.pdf'
const OFFICIAL_CC2='https://afs-formulare.bmf.gv.at/IDOC/FormServlet?fid=7306'
const OFFICIAL_ETIAS='https://travel-europe.europa.eu/etias/faq'
const WARNING='Achtung vor inoffiziellen oder kostenpflichtigen Vermittlerseiten. Nutze nur das verlinkte Behördenformular und prüfe Gebühren vor der Zahlung.'
type Entry = Readonly<{id:string;title:string;message:string;url:string|null;source:string;
  form?:Readonly<{name:string;url:string;cost:string;warning:string}>}>

const ITEMS:readonly Entry[]=Object.freeze([
 {id:'visa',title:'Visum und amtlicher Antrag',
  message:'Die Visumpflicht richtet sich nach Nationalität, gewöhnlichem oder anderem Pass und Reisebedingungen. Ein Visum-C-Antrag ist nur erforderlich, wenn die amtliche Regel dies für den konkreten Fall vorgibt.',
  url:'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html',source:'Österreichisches BMI',
  form:{name:'Schengenvisum C – offizielles PDF',url:OFFICIAL_VISA_C,
   cost:'Formular kostenlos. Visum-Antragsgebühr bei Anwendbarkeit in der Regel 90 € (Erwachsene) bzw. 45 € (6–12 Jahre); Ausnahmen und externe Annahmegebühren möglich.',
   warning:WARNING}},
 {id:'eta',title:'ETIAS / elektronische Reisegenehmigung',
  message:'Am 17.11.2026 laut EU noch nicht in Betrieb. Es können derzeit keine ETIAS-Anträge gestellt werden; keine Antragspflicht oder aktuelle Zahlung ableiten. Der zukünftige EU-Direktantrag kostet 20 €, mit Ausnahmen.',
  url:OFFICIAL_ETIAS,source:'Europäische Union'},
 {id:'passport',title:'Reisepass und Gültigkeit',
  message:'Drittstaatsangehörige benötigen grundsätzlich einen Reisepass, der drei Monate über die Schengen-Ausreise hinaus gilt und in den letzten zehn Jahren ausgestellt wurde. Für EU/EWR/CH bestehen andere Regelungen; Sonderfälle individuell prüfen.',
  url:'https://eausweise.oesterreich.gv.at/de/themen/bauen_und_wohnen/umzug/2/1/Seite.180653',source:'oesterreich.gv.at'},
 {id:'passpages',title:'Leere Passseiten',
  message:'Die Botschaft Bern verlangt für dortige Visa-C/D-Anträge grundsätzlich zwei freie Passseiten. Daraus folgt keine allgemeine Passseitenpflicht für visumfreie Reisende.',
  url:'https://www.bmeia.gv.at/oeb-bern/reise-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag/',source:'Österreichische Botschaft Bern'},
 {id:'required-vaccination',title:'Pflichtimpfungen und Gesundheitsnachweise',
  message:'Für den konkreten Reiseweg und jede Staatsangehörigkeit derzeit nicht verfügbar, sofern keine eindeutig einschlägige amtliche Einreisebestimmung bestätigt ist. Keine negative Schlussfolgerung aus allgemeinen Impfempfehlungen.',
  url:null,source:'Keine passgenaue amtliche Quelle freigegeben'},
 {id:'health',title:'Empfohlene Impfungen und Gesundheit',
  message:'Reiseimpfungen, gesundheitliche Vorsorge und medizinische Anforderungen hängen von Person, Route und Aufenthaltsdauer ab. Diese Hinweise sind keine bestätigte Einreise-Impfpflicht.',
  url:'https://www.gesundheit.gv.at/leben/gesundheitsvorsorge/auf-reisen/impfschutz-auf-reisen.html',source:'Österreichisches Gesundheitsportal'},
 {id:'fees',title:'Gebühren, Geldnachweis und Unterkunft',
  message:'Für den Schengen-Visumantrag können die Visumgebühr, Finanzierungs- und Unterkunftsnachweise erforderlich sein. Eine allgemeine Geldgrenze oder eine Pflicht für jeden Pass ist nicht bestätigt.',
  url:'https://home-affairs.ec.europa.eu/policies/schengen/visa-policy/applying-schengen-visa_en',source:'Europäische Kommission'},
 {id:'transit',title:'Flughafentransit und Einreise auf dem Landweg',
  message:'Das BMI führt Flughafentransitvisa und Ausnahmen getrennt nach Staatsangehörigkeit; Visa A, Aufenthaltstitel und Flughafenwechsel sind einzelfallabhängig. Derzeit ohne konkrete Transitroute nicht abschliessend verfügbar.',
  url:'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html',source:'Österreichisches BMI'},
 {id:'minors',title:'Minderjährige und Einverständnis',
  message:'Bei Reisen ohne beide Sorgeberechtigte kann eine unterschriebene Einverständniserklärung sinnvoll sein. Eine allgemeine Pflicht für alle Reisenden nach Österreich ist daraus nicht abzuleiten.',
  url:'https://www.oesterreich.gv.at/.syndication?pageId=fd7753ff-b8a0-47d2-9f56-9a6ec5e6cd90',source:'oesterreich.gv.at'},
 {id:'customs',title:'Zoll und Barmittelerklärung',
  message:'Bei Ein- oder Ausreise über die EU-Aussengrenze müssen Barmittel ab 10.000 € angemeldet werden. Die Pflicht betrifft nicht automatisch jede Reise innerhalb der EU.',
  url:'https://www.bmf.gv.at/themen/zoll/Kontrolle-von-Barmitteln.html',source:'Österreichisches BMF',
  form:{name:'CC2 – Barmittelerklärung DOK-Online',url:OFFICIAL_CC2,
   cost:'Formularkosten in der amtlichen Quelle nicht beziffert – derzeit nicht verfügbar.',
   warning:WARNING}},
 {id:'forms',title:'Formulare und Warnung vor Fake-Seiten',
  message:'Benutze ausschliesslich amtliche Direktlinks. Ein Formular ist nur dann verpflichtend, wenn der für dich geprüfte konkrete Fall es erfordert. ETIAS nimmt derzeit keine Anträge an.',
  url:OFFICIAL_ETIAS,source:'EU / Österreichische Behörden'},
 {id:'special',title:'Sonderfälle und aktuelle Änderungen',
  message:'Aufenthaltstitel, Doppelpässe, Schutzstatus, Visa für Erwerbsarbeit, bilateral abweichende Regeln und Transit verlangen eine eigene Prüfung. Die BMI-Visaübersicht trägt den Stand 06.11.2026.',
  url:'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html',source:'Österreichisches BMI'},
])

function AmtlicherLink({url,name}:{url:string;name:string}){
 return <a href={url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 break-words focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">{name}</a>
}

export default function AtOfficialGuidance(){
 return <section className="space-y-3" aria-labelledby="at-amtliche-hinweise" data-at-guidance="research-only">
  <header className="space-y-2">
   <h3 id="at-amtliche-hinweise" className="text-lg font-semibold">Österreich – amtliche Informationsseiten und direkte Formulare</h3>
   <p className="text-sm leading-6">Diese Quellenhinweise sind keine bestätigten Pflichten für deinen Pass. Individuell nicht geprüfte Themen bleiben «derzeit nicht verfügbar».</p>
  </header>
  <div className="grid gap-3 md:grid-cols-2">
   {ITEMS.map(item=><article key={item.id} className="rounded-2xl border border-line-200 bg-white p-4 space-y-2" data-at-info-topic={item.id}>
    <h4 className="text-base font-semibold">{item.title}</h4>
    <p className="text-sm leading-6">{item.message}</p>
    {item.url?<p className="text-sm"><AmtlicherLink url={item.url} name={item.source}/></p>:<p className="text-xs">Derzeit nicht verfügbar.</p>}
    {item.form?<div className="space-y-1 border-t border-line-200 pt-2" data-at-official-form={item.id}>
      <p className="text-sm font-semibold">Amtliches Formular: <AmtlicherLink url={item.form.url} name={item.form.name}/></p>
      <p className="text-xs leading-5">Kosten: {item.form.cost}</p>
      <p className="text-xs leading-5">{item.form.warning}</p>
    </div>:null}
   </article>)}
  </div>
 </section>
}
