// Local synthetic trip data only. No commercial or Official Truth is fabricated.
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { beispielreise } = require('../../../lib/reiseaenderung/fixtures/reise.ts')
const { reiseLesen } = require('../../../lib/trips/schema.ts')
export function fixture(long = false) {
  const trip = beispielreise()
  const item = trip.days[0].items[0]
  const date = (i) => new Date(Date.UTC(2026, 10, 1 + i)).toISOString().slice(0, 10)
  const count = long ? 30 : 5
  trip.id = 'trip-integrated-audit-869'
  trip.clientRef = trip.id
  trip.title = long ? '30 Tage Italien – sechs Etappen mit bewusst langen Ortsbezeichnungen' : 'Lokaler Audit – Italien'
  trip.startDate = date(0); trip.endDate = date(count - 1)
  trip.party = []; trip.travellers = 2; trip.readinessItems = []
  trip.stages = Array.from({length: long ? 6 : 1}, (_,i) => ({...trip.stages[0], id:'stage-'+(i+1), position:i+1,
    name:long ? 'Etappe '+(i+1)+' – San Casciano in Val di Pesa und Umgebung' : 'Florenz', arrivalDate:date(i*5), departureDate:date(long ? Math.min((i+1)*5,count-1) : count-1)}))
  trip.days = Array.from({length:count},(_,i)=>({...trip.days[0],id:'day-'+(i+1),dayIndex:i+1,dayDate:date(i),stageId:'stage-'+(long?Math.floor(i/5)+1:1),items:[]}))
  const clean = {...item, startsOn:null, startsAt:null, endsOn:null, endsAt:null, dayId:'day-1',stageId:'stage-1',priceAmount:null,priceCurrency:null,provider:null,externalRef:null,bookingUrl:null,routeItinerary:null}
  trip.days[0].items = [{...clean,id:'manual-stay',kind:'stay',title:'Manuelle Unterkunft',position:1}, {...clean,id:'manual-flight',kind:'flight',title:'Manueller Flug',position:2}]
  trip.days[1].items = [{...clean,id:'walk',kind:'activity',title:'Spaziergang durch die Altstadt',dayId:'day-2',position:1}]
  trip.ohneTag=[]
  const valid=reiseLesen(trip)
  if(!valid) throw new Error('Synthetic fixture rejected by existing trip schema')
  return valid
}
