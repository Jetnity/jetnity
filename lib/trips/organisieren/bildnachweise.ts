// Bildnachweise der mitgelieferten Reisebilder.
//
// Ein Bild wird nur zusammen mit seinem Nachweis gezeigt. Die Quelle der Wahrheit für
// Lizenzen und Herkunft bleibt public/images/organisieren/Bildnachweise.txt; ein Test hält
// beide Listen deckungsgleich. Ein Bild ohne Nachweis hier gilt als nicht freigegeben und
// wird durch das neutrale Kartenmotiv ersetzt.
//
// Zwei Medien werden getrennt geführt: `foto` (echte Aufnahme mit Urheber und freier Lizenz)
// und `ki-illustration` (KI-generiert, Eigentum Jetnity laut Erklärung des Product Owners).
// Eine KI-Illustration ist nie ein Foto und wird nie als echte Aufnahme eines Ortes
// beschrieben, gekennzeichnet oder in Metadaten ausgeliefert.

export type Bildmedium = 'foto' | 'ki-illustration'

type Nachweisgrund = {
  datei: string
  bildtitel: string
  urheber: string | null
  lizenz: string
  lizenzUrl: string | null
  bearbeitung: string
}

export type FotoNachweis = Nachweisgrund & { medium: 'foto'; quelleUrl: string }

/**
 * Herkunft einer KI-Illustration. Nichts davon ist erfunden: Die Erklärung des Product Owners
 * ist die Quelle, das Datum ist der Ersteintrag im Git-Repository (kein verifiziertes
 * Erstellungsdatum), und der Hash bindet den Nachweis an genau diese Datei.
 */
export type Illustrationsherkunft = {
  erstellung: string
  eigentum: string
  erklaerung: string
  ersteintrag: { datum: string; commit: string }
  sha256: string
  bedingungen: { archiv: string; aktuell: string }
  binaerhinweis: string
}

export type IllustrationsNachweis = Nachweisgrund & {
  medium: 'ki-illustration'
  quelleUrl: null
  bildbeschreibung: string
  herkunft: Illustrationsherkunft
}

export type Bildnachweis = FotoNachweis | IllustrationsNachweis

const PFAD = '/images/organisieren/'
const COMMONS = 'https://commons.wikimedia.org/wiki/File:'
const BY = 'https://creativecommons.org/licenses/by/'
const BY_SA = 'https://creativecommons.org/licenses/by-sa/'

const ORIGINAL = 'Originaldatei unverändert; Bildausschnitt je nach Darstellung.'
const WEBP = 'Als WebP gespeichert; Bildausschnitt je nach Darstellung.'
const WEBP_KLEIN = 'Verkleinert und als WebP gespeichert; Bildausschnitt je nach Darstellung.'

function commons(
  datei: string,
  bildtitel: string,
  urheber: string | null,
  lizenz: string,
  lizenzUrl: string | null,
  commonsDatei: string,
  bearbeitung: string,
): FotoNachweis {
  return { medium: 'foto', datei: `${PFAD}${datei}`, bildtitel, urheber, lizenz, lizenzUrl, quelleUrl: `${COMMONS}${commonsDatei}`, bearbeitung }
}

export const NEUTRALES_REISEBILD = `${PFAD}reiseatlas.webp`

export const BILDNACHWEISE: readonly FotoNachweis[] = [
  commons('amsterdam-commons.jpg', 'Holland-Netherlands, Amsterdam canals.jpg', 'Kája Kinová', 'CC BY-SA 4.0', `${BY_SA}4.0/`, 'Holland-Netherlands,_Amsterdam_canals.jpg', ORIGINAL),
  commons('lisbon-commons.jpg', 'Panoramic Lisboa.jpg', 'Ex13', 'CC BY-SA 3.0', `${BY_SA}3.0/`, 'Panoramic_Lisboa.jpg', ORIGINAL),
  commons('zermatt-commons.jpg', 'Matterhorn from Zermatt3.jpg', 'Zermatt photos', 'CC BY-SA 3.0', `${BY_SA}3.0/`, 'Matterhorn_from_Zermatt3.jpg', ORIGINAL),
  commons('paris.jpg', 'Skyline of Paris with the Eiffel Tower 2.jpg', 'DiscoA340', 'CC BY-SA 4.0', `${BY_SA}4.0/`, 'Skyline_of_Paris_with_the_Eiffel_Tower_2.jpg', ORIGINAL),
  commons('hero.webp', 'Wat Arun Temple Of Dawn (121412175).jpeg', 'Fernando Garcia', 'CC BY 3.0', `${BY}3.0/`, 'Wat_Arun_Temple_Of_Dawn_(121412175).jpeg', WEBP),
  commons('reise.webp', 'Vue aérienne Europe 24.jpg', 'Cactus0625', 'CC BY-SA 4.0', `${BY_SA}4.0/`, 'Vue_a%C3%A9rienne_Europe_24.jpg', WEBP),
  commons('bangkok.webp', 'Wat Arun Ratchawararam and the Royal Barge Procession.jpg', 'Tee-12838', 'CC BY-SA 4.0', `${BY_SA}4.0/`, 'Wat_Arun_Ratchawararam_and_the_Royal_Barge_Procession.jpg', WEBP),
  commons('chang.webp', 'Ko Chang White Sand Beach.jpg', null, 'Gemeinfrei', null, 'Ko_Chang_White_Sand_Beach.jpg', WEBP),
  commons('phuket.webp', 'Dramatic karst landscape of Phang Nga Bay, Thailand.jpg', 'Vyacheslav Argenberg', 'CC BY 4.0', `${BY}4.0/`, 'Dramatic_karst_landscape_of_Phang_Nga_Bay,_Thailand.jpg', WEBP),
  commons('shangri.webp', 'Shangri-La Hotel, Bangkok.JPG', 'Shangrilahotelbangkok', 'CC BY-SA 4.0', `${BY_SA}4.0/`, 'Shangri-La_Hotel,_Bangkok.JPG', WEBP),
  commons('peninsula.webp', 'Bangkok Thailand - the Peninsula Hotel - panoramio.jpg', 'David Broad', 'CC BY 3.0', `${BY}3.0/`, 'Bangkok_Thailand_-_the_Peninsula_Hotel_-_panoramio.jpg', WEBP),
  commons('mandarin.webp', 'Mandarin Oriental Bangkok Bang Rak.jpg', 'Chainwit.', 'CC BY-SA 4.0', `${BY_SA}4.0/`, 'Mandarin_Oriental_Bangkok_Bang_Rak.jpg', WEBP),
  commons('katathani.webp', 'Good maintained beautiful courtyard of Katathani Beach Resort Phuket - panoramio.jpg', 'yuichiro anazawa', 'CC BY 3.0', `${BY}3.0/`, 'Good_maintained_beautiful_courtyard_of_Katathani_Beach_Resort_Phuket_-_panoramio.jpg', WEBP),
  commons('angsana.webp', 'Angsana Laguna Phuket.jpg', 'Banyantree2014', 'CC BY-SA 4.0', `${BY_SA}4.0/`, 'Angsana_Laguna_Phuket.jpg', WEBP),
  commons('paradise.webp', 'Hotel Koh Chang Paradise Resort - panoramio.jpg', 'Александр Ф', 'CC BY-SA 3.0', `${BY_SA}3.0/`, 'Hotel_Koh_Chang_Paradise_Resort_-_panoramio.jpg', WEBP),
  commons('canal.webp', 'Bangkok river boat taxi, Khlong Saen Saep, Bangkok, Thailand.jpg', 'Vyacheslav Argenberg', 'CC BY 4.0', `${BY}4.0/`, 'Bangkok_river_boat_taxi,_Khlong_Saen_Saep,_Bangkok,_Thailand.jpg', WEBP),
  commons('watpho.webp', 'Wat Pho, Bangkok, Tailandia, 2013-08-22, DD 37.jpg', 'Diego Delso', 'CC BY-SA 3.0', `${BY_SA}3.0/`, 'Wat_Pho,_Bangkok,_Tailandia,_2013-08-22,_DD_37.jpg', WEBP),
  commons('waterfall.webp', 'Klong Plu Waterfall, Ko Chang, Thailand.jpg', 'Vyacheslav Argenberg', 'CC BY 4.0', `${BY}4.0/`, 'Klong_Plu_Waterfall,_Ko_Chang,_Thailand.jpg', WEBP),
  commons('oldtown.webp', 'Thalang Road 1.jpg', 'Slleong', 'CC0', null, 'Thalang_Road_1.jpg', WEBP),
  commons('nusa-penida.webp', 'Broken Bay, Nusa Penida.jpg', 'Georgi Kovachev', 'CC BY-SA 4.0', `${BY_SA}4.0/`, 'Broken_Bay,_Nusa_Penida.jpg', WEBP_KLEIN),
  commons('panama.webp', 'Panama Papers (148830809).jpeg', 'Dronepicr', 'CC BY 3.0', `${BY}3.0/`, 'Panama_Papers_(148830809).jpeg', WEBP_KLEIN),
  {
    medium: 'foto',
    datei: NEUTRALES_REISEBILD,
    bildtitel: 'Kartengrundlage Natural Earth (v5.1.2, 1:50m)',
    urheber: null,
    lizenz: 'Gemeinfrei',
    lizenzUrl: null,
    quelleUrl: 'https://www.naturalearthdata.com/',
    bearbeitung: 'Grafisch für Jetnity aufbereitet.',
  },
]

const OPENAI_BEDINGUNGEN = {
  archiv: 'https://openai.com/policies/dec-2024-eu-terms/',
  aktuell: 'https://openai.com/policies/eu-terms-of-use/',
} as const

/** Wortlaut des Herkunftsvermerks. Er steht identisch in Bildnachweise.txt, hier, auf der Datenquellen-Seite und im Bildnachweis. */
export const KI_URHEBER = 'KI-generiert (ChatGPT/OpenAI), Eigentum Jetnity/Sasa Feirov (PO-Erklärung 26.11.2026)'

/** Sichtbarer, dezenter Hinweis am Bild einer KI-Illustration. */
export const ILLUSTRATIONSHINWEIS = 'KI-Illustration'

/** `2025-07-19` wird zu `19.07.2025`. */
export function datumDeutsch(iso: string): string {
  const [jahr, monat, tag] = iso.split('-')
  return `${tag}.${monat}.${jahr}`
}

const KI_LIZENZ = 'Keine CC-Lizenz; Nutzung nach PO-Erklärung und OpenAI-Bedingungen'
const KI_BEARBEITUNG = 'Datei seit dem Ersteintrag unverändert; Bildausschnitt je nach Darstellung.'
const KI_BINAERHINWEIS =
  'Die Dateien enthalten ein eingebettetes C2PA-Manifest (Claim-Generator ChatGPT, signiert «Truepic Lens CLI in ChatGPT», Aussteller OpenAI; ' +
  'die Dateiprüfsumme im Manifest stimmt). Die Prüfung mit c2pa-python 0.39.0 ergibt insgesamt «ungültig»: Zertifikat nicht vertrauenswürdig und abgelaufen, ' +
  'Aktionsangabe von der Bibliothek als fehlerhaft gewertet. Binär- und EXIF-Angaben sind damit nicht unabhängig verifiziert und ersetzen weder die PO-Erklärung noch einen Rechtsnachweis.'

const ERSTEINTRAG_HERO = { datum: '2025-07-19', commit: '6f59d83eec1453892139eb2eab3e238223487a25' } as const
const ERSTEINTRAG_MEGA = { datum: '2025-09-02', commit: '265887dd8a5dbdaf450eb14eec6b84f987568e6f' } as const

function illustration(
  datei: string,
  bildtitel: string,
  bildbeschreibung: string,
  ersteintrag: Illustrationsherkunft['ersteintrag'],
  sha256: string,
): IllustrationsNachweis {
  return {
    medium: 'ki-illustration',
    datei: `/images/${datei}`,
    bildtitel,
    urheber: KI_URHEBER,
    lizenz: KI_LIZENZ,
    lizenzUrl: OPENAI_BEDINGUNGEN.aktuell,
    quelleUrl: null,
    bearbeitung: KI_BEARBEITUNG,
    bildbeschreibung,
    herkunft: {
      erstellung: 'KI-generiert (ChatGPT/OpenAI)',
      eigentum: 'Jetnity/Sasa Feirov',
      erklaerung: 'PO-Erklärung 26.11.2026',
      ersteintrag,
      sha256,
      bedingungen: OPENAI_BEDINGUNGEN,
      binaerhinweis: KI_BINAERHINWEIS,
    },
  }
}

/**
 * Herkunftsdatensätze der fünf KI-Illustrationen. Ein Datensatz ist noch keine Freigabe zur Anzeige:
 * gezeigt wird nur, was in FREIGEGEBENE_ILLUSTRATIONEN steht.
 */
export const KI_ILLUSTRATIONEN: readonly IllustrationsNachweis[] = [
  illustration('hero-bali.png', 'Palmen und Reisterrassen im Sonnenuntergang (Motiv Bali)', 'KI-Illustration: Palmen und Reisterrassen im warmen Licht des Sonnenuntergangs, Motiv Bali', ERSTEINTRAG_HERO, '0d8aa8603c674211691e491ed39820b94a0a358c03f852f8bfa2f27bf165ee45'),
  illustration('bali.jpg', 'Reisterrassen und Palmen im Morgenlicht (Motiv Bali)', 'KI-Illustration: Reisterrassen und Palmen im Morgenlicht, Motiv Bali', ERSTEINTRAG_MEGA, '86acf2c0201f65967c6d800dbcf9c498f23a716674f4ec661c25632850d60f07'),
  illustration('lisbon.jpg', 'Gelbe Tram in einer Gasse bei Sonnenuntergang (Motiv Lissabon)', 'KI-Illustration: gelbe Tram in einer Gasse bei Sonnenuntergang, Motiv Lissabon', ERSTEINTRAG_MEGA, 'e8f4f66ba68d75995c7ef053874d8b4f23aff7d9cec66bdff8f0b994f79070c3'),
  illustration('zermatt.jpg', 'Matterhorn mit Berghütte und zwei Wandernden (Motiv Zermatt)', 'KI-Illustration: Matterhorn mit Berghütte und zwei Wandernden, Motiv Zermatt', ERSTEINTRAG_MEGA, '0720951b5a7e57451184a56c8bce5ca223b59cff4262bf753ca67eceb69192bc'),
  illustration('amsterdam.jpg', 'Grachtenhäuser und beleuchtete Brücken am Abend (Motiv Amsterdam)', 'KI-Illustration: Grachtenhäuser und beleuchtete Brücken am Abend mit Tulpen, Motiv Amsterdam', ERSTEINTRAG_MEGA, '02462fc4943b1b77034c24837541a6f9150697fde75ac9d76b80397b21bfb122'),
]

/** Einzig freigegebene KI-Illustrationen: jede ist einzeln belegt. Alles andere bleibt neutral. */
export const FREIGEGEBENE_ILLUSTRATIONEN: readonly string[] = [
  '/images/hero-bali.png',
  '/images/bali.jpg',
  '/images/lisbon.jpg',
  '/images/amsterdam.jpg',
]

/** Dokumentierte, aber zurückgehaltene Illustrationen mit dem Grund. Sie werden nirgends gezeigt. */
export const ZURUECKGEHALTENE_ILLUSTRATIONEN: Readonly<Record<string, string>> = {
  '/images/zermatt.jpg':
    'Die Ortskennung der Reiseidee Zermatt (geonames:2657915) widerspricht der des Reisekopf-Katalogs (geonames:2657928) und ist ungeklärt. Die Datei bleibt belegt, wird aber nicht gezeigt.',
}

export const ALLE_BILDNACHWEISE: readonly Bildnachweis[] = [...BILDNACHWEISE, ...KI_ILLUSTRATIONEN]

const NACH_DATEI = new Map(BILDNACHWEISE.map((eintrag) => [eintrag.datei, eintrag]))
const ILLUSTRATIONEN_NACH_DATEI = new Map(KI_ILLUSTRATIONEN.map((eintrag) => [eintrag.datei, eintrag]))

/** Nachweis eines mitgelieferten Fotos; `null`, wenn die Datei kein freigegebenes Foto ist. KI-Illustrationen führt `illustrationsnachweisFuerDatei`. */
export function bildnachweisFuerDatei(src: string): FotoNachweis | null {
  return NACH_DATEI.get(src) ?? null
}

/** Nachweis einer zur Anzeige freigegebenen KI-Illustration; `null` für jede andere Datei, auch für dokumentierte, aber zurückgehaltene. */
export function illustrationsnachweisFuerDatei(src: string): IllustrationsNachweis | null {
  return FREIGEGEBENE_ILLUSTRATIONEN.includes(src) ? (ILLUSTRATIONEN_NACH_DATEI.get(src) ?? null) : null
}

/** Nachweis jeder zur Anzeige freigegebenen Datei, Foto oder Illustration. */
export function freigegebenerNachweis(src: string): Bildnachweis | null {
  return bildnachweisFuerDatei(src) ?? illustrationsnachweisFuerDatei(src)
}

export type StadtfotoNachweis = {
  title: string
  author: string
  license: string
  licenseUrl: string
  sourceUrl: string
}

/** Nachweis eines Commons-Fotos aus dem geprüften Laufzeitweg (`lib/travel-images`). */
function bildnachweisAusStadtfoto(foto: StadtfotoNachweis): FotoNachweis {
  return {
    medium: 'foto',
    datei: foto.sourceUrl,
    bildtitel: foto.title,
    urheber: foto.author,
    lizenz: foto.license,
    lizenzUrl: foto.licenseUrl,
    quelleUrl: foto.sourceUrl,
    bearbeitung: 'Bildausschnitt je nach Darstellung.',
  }
}

/**
 * Ein Foto für die Anzeige. Ohne Nachweis (unbekannte Datei, auch jede KI-Illustration) bleibt nur das
 * neutrale Kartenmotiv: ein Bild ohne geklärte Lizenz wird hier nicht gezeigt. KI-Illustrationen laufen
 * ausschliesslich über das Gate in `lib/inspiration/bildfreigabe.ts`.
 */
export function bildMitNachweis(src: string, foto: StadtfotoNachweis | null): { src: string; nachweis: FotoNachweis } {
  if (foto) return { src, nachweis: bildnachweisAusStadtfoto(foto) }
  const nachweis = bildnachweisFuerDatei(src)
  if (nachweis) return { src, nachweis }
  const neutral = bildnachweisFuerDatei(NEUTRALES_REISEBILD)
  if (!neutral) throw new Error('Das neutrale Reisebild braucht einen Nachweis.')
  return { src: NEUTRALES_REISEBILD, nachweis: neutral }
}
