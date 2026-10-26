import { ROLE_LABELS, type AccountStatus, type Role } from '@/lib/auth/roles'
import type {
  AmbiguousReason,
  CapturedSubject,
  HoldReason,
  MutationIntent,
  TargetOperation,
} from '@/lib/admin/user-mutation-lifecycle'
import type { MutationBlockReason } from '@/lib/admin/user-row-truth'

export const STATUS_LABELS: Record<AccountStatus, string> = {
  active: 'Aktiv',
  pending: 'Ausstehend',
  disabled: 'Deaktiviert',
  banned: 'Gesperrt',
}

export const RECOVER_LABEL = 'Hinweis schließen, ohne erneut zu senden'

export function roleLabel(role: Role | null): string {
  return role ? ROLE_LABELS[role] : 'Unbekannte Rolle'
}

export function statusLabel(status: AccountStatus | null): string {
  return status ? STATUS_LABELS[status] : 'Unbekannter Status'
}

function subjectLabel(subject: Pick<CapturedSubject, 'displayName' | 'email' | 'userId'>): string {
  return subject.displayName || subject.email || 'Ohne Namen'
}

export function blockCopy(reason: MutationBlockReason): string {
  if (reason === 'self') return 'Das eigene Konto lässt sich hier nicht ändern.'
  if (reason === 'rank') return 'Für dieses Konto fehlt die Berechtigung.'
  if (reason === 'unknown-role') return 'Die gespeicherte Rolle ist unbekannt. Es wird keine Änderung angeboten.'
  if (reason === 'unknown-status') return 'Der gespeicherte Status ist unbekannt. Es wird keine Änderung angeboten.'
  return 'Die Kontokennung ist unbrauchbar. Es wird keine Änderung gesendet.'
}

export function holdCopy(reason: HoldReason): string {
  if (reason === 'removed') return 'Das Konto ist in der aktuellen Liste nicht mehr vorhanden. Es wird nichts gesendet.'
  if (reason === 'changed') return 'Das Konto hat sich seit der Auswahl geändert. Es wird nichts gesendet.'
  if (reason === 'unknown') return 'Rolle oder Status sind nicht mehr bekannt. Es wird nichts gesendet.'
  if (reason === 'malformed') return 'Die Kontokennung ist unbrauchbar. Es wird nichts gesendet.'
  return 'Diese Änderung ist nicht mehr zulässig. Es wird nichts gesendet.'
}

export function confirmationTitle(subject: CapturedSubject): string {
  return `Änderung für ${subjectLabel(subject)} bestätigen`
}

export function confirmationLines(subject: CapturedSubject, intent: MutationIntent): string[] {
  const desired =
    intent.kind === 'role'
      ? `Gewünschte Rolle: ${roleLabel(intent.nextRole)}`
      : `Gewünschter Status: ${statusLabel(intent.nextStatus)}`
  return [
    `Konto: ${subjectLabel(subject)}`,
    `E-Mail: ${subject.email ?? 'Keine E-Mail hinterlegt'}`,
    `Kennung: ${subject.userId}`,
    `Bisherige Rolle: ${roleLabel(subject.role)}`,
    `Bisheriger Status: ${statusLabel(subject.status)}`,
    desired,
  ]
}

function named(operation: TargetOperation): string {
  return `${subjectLabel(operation.subject)} (${operation.subject.userId})`
}

export function outcomeCopy(operation: TargetOperation): string {
  const who = named(operation)
  if (operation.phase === 'pending') {
    return `Die Änderung für ${who} läuft. Eine Rückmeldung ist noch keine bestätigte Speicherung.`
  }
  if (operation.phase === 'fulfilled') {
    return `Die Aktion für ${who} ist zurückgekehrt. Eine neue Abfrage hat die Speicherung noch nicht bestätigt.`
  }
  if (operation.phase === 'confirmed') {
    if (operation.intent.kind === 'role') {
      return `Die neue Abfrage zeigt für ${who} die Rolle ${roleLabel(operation.intent.nextRole)}.`
    }
    return `Die neue Abfrage zeigt für ${who} den Status ${statusLabel(operation.intent.nextStatus)}.`
  }
  if (operation.phase === 'rejected') {
    return `Die Änderung für ${who} wurde abgelehnt: ${operation.message ?? 'ohne lesbare Rückmeldung'}`
  }
  if (operation.phase === 'ambiguous') {
    return ambiguousCopy(who, operation.ambiguousReason)
  }
  return `Für ${who} liegt keine Änderung vor.`
}

function ambiguousCopy(who: string, reason: AmbiguousReason | null): string {
  if (reason === 'absent') return `${who} fehlt in der neuen Abfrage. Das ist keine bestätigte Speicherung.`
  if (reason === 'unchanged') return `Die neue Abfrage zeigt ${who} unverändert. Das ist keine bestätigte Speicherung.`
  if (reason === 'contradictory') {
    return `Die neue Abfrage widerspricht der gewünschten Änderung für ${who}. Das ist keine bestätigte Speicherung.`
  }
  return `Die Übertragung für ${who} ist unklar. Es wird nicht erneut gesendet.`
}

export const DETACHED_PREFIX =
  'Diese Rückmeldung gehört nur zu diesem Konto und nicht zu den jetzt sichtbaren Konten.'
