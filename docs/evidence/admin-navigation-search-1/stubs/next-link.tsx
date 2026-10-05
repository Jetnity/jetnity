import * as React from 'react'

import { setHarnessPathname } from './next-navigation'

type HarnessLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
  prefetch?: boolean
}

function lesenPushes(): string[] {
  const win = globalThis as { __routerPushes?: string[] }
  win.__routerPushes ??= []
  return win.__routerPushes
}

function merkePrefetch(href: string, prefetch: boolean | undefined) {
  const win = globalThis as { __linkPrefetch?: Array<{ href: string; prefetch: boolean | undefined }> }
  win.__linkPrefetch ??= []
  win.__linkPrefetch.push({ href, prefetch })
}

export default function Link({ href, children, onClick, prefetch, ...rest }: HarnessLinkProps) {
  merkePrefetch(href, prefetch)
  return (
    <a
      href={href}
      {...rest}
      onClick={(event) => {
        event.preventDefault()
        onClick?.(event)
        lesenPushes().push(href)
        setHarnessPathname(href)
      }}
    >
      {children}
    </a>
  )
}
