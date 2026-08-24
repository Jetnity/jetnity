'use client'

import { Button } from '@/components/ui/button'
import { AppleIcon, GoogleIcon } from '@/components/auth/provider-icons'
import {
  sichtbareOauthAnbieter,
  type OauthAnbieter as Anbieter,
  type OauthFreigabe,
} from '@/lib/auth/oauth-anbieter'

export default function OauthAnbieter({
  freigabe,
  loading,
  onStart,
}: {
  freigabe: OauthFreigabe
  loading: Anbieter | null
  onStart: (anbieter: Anbieter) => void
}) {
  const sichtbar = sichtbareOauthAnbieter(freigabe)
  if (sichtbar.length === 0) return null

  return (
    <>
      <div className="my-6 flex items-center gap-4 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        <span>oder</span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="grid grid-cols-1 gap-3">
        {sichtbar.includes('google') ? (
          <Button
            type="button"
            variant="outline"
            disabled={loading !== null}
            onClick={() => onStart('google')}
            className="w-full justify-center"
            isLoading={loading === 'google'}
            loadingText="Weiter mit Google…"
            leftIcon={<GoogleIcon />}
          >
            Weiter mit Google
          </Button>
        ) : null}
        {sichtbar.includes('apple') ? (
          <Button
            type="button"
            variant="outline"
            disabled={loading !== null}
            onClick={() => onStart('apple')}
            className="w-full justify-center"
            isLoading={loading === 'apple'}
            loadingText="Weiter mit Apple…"
            leftIcon={<AppleIcon />}
          >
            Weiter mit Apple
          </Button>
        ) : null}
      </div>
    </>
  )
}
