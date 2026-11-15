'use server'

import { uiEinstellungenFuerAktionLesen, uiEinstellungenFuerAktionSpeichern } from './server'
import type { UiEinstellungenLesen, UiEinstellungenSpeichernErgebnis } from './vertrag'

export async function uiEinstellungenSpeichern(eingabe: unknown): Promise<UiEinstellungenSpeichernErgebnis> {
  return uiEinstellungenFuerAktionSpeichern(eingabe)
}

export async function uiEinstellungenNeuLaden(): Promise<UiEinstellungenLesen> {
  return uiEinstellungenFuerAktionLesen()
}
