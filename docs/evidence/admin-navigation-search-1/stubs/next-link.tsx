import * as React from 'react'

import { setHarnessPathname } from './next-navigation'

function lesenPushes(): string[] {
  const win = globalThis as { __routerPushes?: string[] }
  win.__routerPushes ??= []
  return win.__routerPushes
}

export default function Link({
  href,
  children,
  onClick,
  ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <a
      href={href}
      {...rest}
      onClick={(event) => {
        event.preventDefault()
        onClick?.(event)
        if (event.defaultPrevented && event.isTrusted === false) {
          // Controlled synthetic clicks still navigate the allowlisted href.
        }
        lesenPushes().push(href)
        setHarnessPathname(href)
      }}
    >
      {children}
    </a>
  )
}
