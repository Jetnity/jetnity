// Bildnachweise der mitgelieferten Reisebilder.
//
// Ein Bild wird nur zusammen mit seinem Nachweis gezeigt. Die Quelle der Wahrheit für
// Lizenzen bleibt public/images/organisieren/Bildnachweise.txt; ein Test hält beide
// Listen deckungsgleich. Ein Bild ohne Nachweis hier gilt als nicht freigegeben und
// wird durch das neutrale Kartenmotiv ersetzt.

export type Bildnachweis = {
  datei: string
  bildtitel: string
  urheber: string | null
  lizenz: string
  lizenzUrl: string | null
  quelleUrl: string
  bearbeitung: string
}

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
): Bildnachweis {
  return { datei: `${PFAD}${datei}`, bildtitel, urheber, lizenz, lizenzUrl, quelleUrl: `${COMMONS}${commonsDatei}`, bearbeitung }
}

export const NEUTRALES_REISEBILD = `${PFAD}reiseatlas.webp`

export const BILDNACHWEISE: readonly Bildnachweis[] = [
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
    datei: NEUTRALES_REISEBILD,
    bildtitel: 'Kartengrundlage Natural Earth (v5.1.2, 1:50m)',
    urheber: null,
    lizenz: 'Gemeinfrei',
    lizenzUrl: null,
    quelleUrl: 'https://www.naturalearthdata.com/',
    bearbeitung: 'Grafisch für Jetnity aufbereitet.',
  },
]

const NACH_DATEI = new Map(BILDNACHWEISE.map((eintrag) => [eintrag.datei, eintrag]))

/** Nachweis eines mitgelieferten Bildes; `null`, wenn das Bild nicht freigegeben ist. */
export function bildnachweisFuerDatei(src: string): Bildnachweis | null {
  return NACH_DATEI.get(src) ?? null
}

export type StadtfotoNachweis = {
  title: string
  author: string
  license: string
  licenseUrl: string
  sourceUrl: string
}

/** Nachweis eines Commons-Fotos aus dem geprüften Laufzeitweg (`lib/travel-images`). */
function bildnachweisAusStadtfoto(foto: StadtfotoNachweis): Bildnachweis {
  return {
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
 * Ein Bild für die Anzeige. Ohne Nachweis (unbekannte Datei) bleibt nur das neutrale
 * Kartenmotiv: ein Bild ohne geklärte Lizenz wird nicht gezeigt.
 */
export function bildMitNachweis(src: string, foto: StadtfotoNachweis | null): { src: string; nachweis: Bildnachweis } {
  if (foto) return { src, nachweis: bildnachweisAusStadtfoto(foto) }
  const nachweis = bildnachweisFuerDatei(src)
  if (nachweis) return { src, nachweis }
  const neutral = bildnachweisFuerDatei(NEUTRALES_REISEBILD)
  if (!neutral) throw new Error('Das neutrale Reisebild braucht einen Nachweis.')
  return { src: NEUTRALES_REISEBILD, nachweis: neutral }
}
