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

function desiredPhrase(operation: TargetOperation): string {
  if (operation.intent.kind === 'role') return `die Rolle ${roleLabel(operation.intent.nextRole)}`
  return `den Status ${statusLabel(operation.intent.nextStatus)}`
}

function currentPhrase(operation: TargetOperation): string {
  const truth = operation.laterTruth
  if (!truth) return 'einen anderen Stand'
  if (operation.intent.kind === 'role') return `die Rolle ${roleLabel(truth.role)}`
  return `den Status ${statusLabel(truth.status)}`
}

export function outcomeCopy(operation: TargetOperation): string {
  const who = named(operation)
  if (operation.phase === 'pending') {
    return `Die Änderung für ${who} läuft. Eine Rückmeldung ist noch keine bestätigte Speicherung.`
  }
  if (operation.phase === 'fulfilled') {
    if (operation.nonCanonical === 'failed') {
      return `Die letzte Abfrage für ${who} ist fehlgeschlagen. Sie zeigt nicht, dass das Konto fehlt, und bestätigt die Speicherung nicht.`
    }
    if (operation.nonCanonical === 'invalid') {
      return `Die letzte Abfrage für ${who} ist ungültig. Sie zeigt nicht, dass das Konto fehlt, und bestätigt die Speicherung nicht.`
    }
    return `Die Aktion für ${who} ist zurückgekehrt. Eine neue Abfrage hat die Speicherung noch nicht bestätigt.`
  }
  if (operation.phase === 'confirmed') {
    if (operation.nonCanonical === 'failed') {
      return `Eine frühere Abfrage zeigte für ${who} ${desiredPhrase(operation)}. Die letzte Abfrage ist fehlgeschlagen und setzt keinen neuen Stand.`
    }
    if (operation.nonCanonical === 'invalid') {
      return `Eine frühere Abfrage zeigte für ${who} ${desiredPhrase(operation)}. Die letzte Abfrage ist ungültig und setzt keinen neuen Stand.`
    }
    return `Die neue Abfrage zeigt für ${who} ${desiredPhrase(operation)}.`
  }
  if (operation.phase === 'rejected') {
    return `Die Änderung für ${who} wurde abgelehnt: ${operation.message ?? 'ohne lesbare Rückmeldung'}`
  }
  if (operation.phase === 'ambiguous') {
    if (operation.nonCanonical) return historicalUnread(who, operation)
    if (operation.confirmedOnce) return historicalCopy(who, operation)
    return ambiguousCopy(who, operation.ambiguousReason)
  }
  return `Für ${who} liegt keine Änderung vor.`
}

function rememberedPhrase(operation: TargetOperation): string {
  if (operation.laterTruth) return currentPhrase(operation)
  if (operation.confirmedOnce) return desiredPhrase(operation)
  if (operation.ambiguousReason === 'unchanged') return 'das Konto unverändert'
  if (operation.ambiguousReason === 'contradictory') return 'einen anderen Stand'
  return 'keine gesicherte Speicherung'
}

function historicalUnread(who: string, operation: TargetOperation): string {
  const kind = operation.nonCanonical === 'invalid' ? 'ungültig' : 'fehlgeschlagen'
  const earlier =
    operation.ambiguousReason === 'absent'
      ? `Eine frühere akzeptierte Abfrage enthielt ${who} nicht.`
      : `Eine frühere akzeptierte Abfrage zeigte für ${who} ${rememberedPhrase(operation)}.`
  return `${earlier} Die letzte Abfrage ist ${kind} und setzt keinen neuen Stand. Es wird nichts erneut gesendet.`
}

function historicalCopy(who: string, operation: TargetOperation): string {
  const earlier = `Eine frühere Abfrage zeigte für ${who} ${desiredPhrase(operation)}.`
  if (operation.ambiguousReason === 'absent') {
    return `${earlier} Die letzte akzeptierte Abfrage enthält das Konto nicht. Die frühere Beobachtung ist nicht mehr der aktuelle Stand. Es wird nichts erneut gesendet.`
  }
  return `${earlier} Die letzte akzeptierte Abfrage zeigt ${currentPhrase(operation)}. Die frühere Beobachtung ist nicht mehr der aktuelle Stand. Es wird nichts erneut gesendet.`
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
