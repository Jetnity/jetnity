// components/trips/useBookingActionLifecycle.ts
//
// Dieselbe lokale Buchungsaktion für Flug, Unterkunft, Verbindung und Mietwagen.
// Kein React-Hook: die bestehenden Komponentenprüfungen ersetzen `react`
// nur in ihrer eigenen Datei. Ein Hook in diesem Modul würde den echten
// Renderer treffen. Kein Speicher-, Server- oder Befehlsrahmen.

export const BUCHUNG_WIRD_GESPEICHERT = 'Buchungsstatus wird gespeichert.'

export const BUCHUNG_ABGELEHNT =
  'Der Buchungsstatus konnte nicht gespeichert werden. Du kannst es erneut versuchen.'

export type BookingMemory = {
  generation: number
  pendingId: string | null
  focus: HTMLButtonElement | null
  focusSerial: number
}

export function createBookingMemory(): BookingMemory {
  return { generation: 0, pendingId: null, focus: null, focusSerial: 0 }
}

export function dropBookingOwnership(memory: BookingMemory): void {
  memory.generation += 1
  memory.pendingId = null
  memory.focus = null
  memory.focusSerial += 1
}

export function bookingTripChanged(memory: BookingMemory, seenTripId: string, tripId: string): boolean {
  if (seenTripId === tripId) return false
  dropBookingOwnership(memory)
  return true
}

export function bookingItemDisappeared(memory: BookingMemory, itemIds: readonly string[]): boolean {
  if (!memory.pendingId || itemIds.includes(memory.pendingId)) return false
  dropBookingOwnership(memory)
  return true
}

function claimBooking(
  memory: BookingMemory,
  itemId: string,
  button: HTMLButtonElement | null,
): number | null {
  if (memory.pendingId) return null
  memory.pendingId = itemId
  memory.focus = button
  memory.focusSerial += 1
  return memory.generation
}

async function readBookingResult(run: () => Promise<string | null>): Promise<string | null> {
  try {
    return (await run()) || null
  } catch {
    return BUCHUNG_ABGELEHNT
  }
}

export function finishBooking(memory: BookingMemory, token: number, itemId: string): boolean {
  if (token !== memory.generation || memory.pendingId !== itemId) return false
  memory.pendingId = null
  memory.focus = null
  memory.focusSerial += 1
  return true
}

export function startBookingAction(
  memory: BookingMemory,
  onBuchungsstatus: (itemId: string, gebucht: boolean) => Promise<string | null>,
  itemId: string,
  gebucht: boolean,
  button: HTMLButtonElement | null,
  publish: (pendingId: string | null, message: string) => void,
): void {
  const token = claimBooking(memory, itemId, button)
  if (token === null) return
  publish(itemId, '')
  void (async () => {
    const fehler = await readBookingResult(() => onBuchungsstatus(itemId, gebucht))
    if (!finishBooking(memory, token, itemId)) return
    publish(null, fehler ?? '')
  })()
}

export type RentalMemory = {
  generation: number
  schreibt: boolean
  focusSerial: number
  submit: HTMLButtonElement | null
}

export function createRentalMemory(): RentalMemory {
  return { generation: 0, schreibt: false, focusSerial: 0, submit: null }
}

export function rentalTripChanged(memory: RentalMemory, seenTripId: string, tripId: string): boolean {
  if (seenTripId === tripId) return false
  memory.generation += 1
  memory.schreibt = false
  memory.focusSerial += 1
  return true
}

export function beginRentalSave(memory: RentalMemory): { token: number; serial: number } | null {
  if (memory.schreibt) return null
  const serial = ++memory.focusSerial
  memory.schreibt = true
  return { token: memory.generation, serial }
}

export function rentalStillOwned(memory: RentalMemory, token: number): boolean {
  return token === memory.generation
}

export function endRentalSave(memory: RentalMemory): void {
  memory.schreibt = false
}

export function rememberRentalSubmit(memory: RentalMemory, submit: HTMLButtonElement | null): void {
  memory.submit = submit
}

export function rentalFocusCurrent(memory: RentalMemory, serial: number): boolean {
  return memory.focusSerial === serial
}

export function restoreOwnedFocus(focus: HTMLButtonElement | null): void {
  if (typeof document === 'undefined' || !focus?.isConnected) return
  const active = document.activeElement
  if (active && active !== document.body && active !== document.documentElement) return
  focus.focus()
}
