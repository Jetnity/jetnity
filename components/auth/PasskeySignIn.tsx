import { Button } from '@/components/ui/button'
import { sicherheitText, type SicherheitTextSchluessel } from '@/lib/localization/account-security-texte'
import type { UiSprache } from '@/lib/localization/ui-sprache'

export function PasskeySignIn({
  sprache = 'de',
  bereit,
  meldung,
  beschaeftigt,
  onAnmelden,
}: {
  sprache?: UiSprache
  bereit: boolean
  meldung: SicherheitTextSchluessel | null
  beschaeftigt: boolean
  onAnmelden: () => void
}) {
  return (
    <div className="mt-4" data-passkey-login={bereit ? 'bereit' : 'geschlossen'}>
      {bereit ? (
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full"
          disabled={beschaeftigt}
          isLoading={beschaeftigt}
          loadingText={sicherheitText(sprache, 'passkey.login.working')}
          onClick={onAnmelden}
        >
          {sicherheitText(sprache, 'passkey.login.action')}
        </Button>
      ) : (
        <p role="status" className="text-sm leading-6 text-muted-foreground">
          {sicherheitText(sprache, 'passkey.login.closed')}
        </p>
      )}
      {meldung ? (
        <p role="alert" className="mt-3 text-sm leading-6 text-ink-700">
          {sicherheitText(sprache, meldung)}
        </p>
      ) : null}
    </div>
  )
}
