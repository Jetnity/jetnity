// components/ui/icons/CruiseShip.tsx
import * as React from 'react'
import { cn } from '@/lib/utils'

export type IconVariant = 'outline' | 'filled' | 'duotone'

export type CruiseShipIconProps = React.SVGProps<SVGSVGElement> & {
  /** Breite/Höhe des Icons – Zahl (px) oder String (z. B. "1em"). */
  size?: number | string
  /** Strichstärke in px bei 24x24. */
  strokeWidth?: number
  /** Konstante Strichstärke relativ zur Icon-Größe (wie bei lucide). */
  absoluteStrokeWidth?: boolean
  /** Farbe; default: currentColor (erbt vom Text). */
  color?: string
  /** Für Screenreader – wenn gesetzt, ist das Icon **nicht** dekorativ. */
  title?: string
  /** Wenn true, wird das Icon für ATs verborgen (aria-hidden). */
  decorative?: boolean
  /** Darstellungsvariante. */
  variant?: IconVariant
  className?: string
}

/**
 * CruiseShipIcon – anpassbares Kreuzfahrtschiff-Icon im 24x24-Grid.
 * - A11y: `title` setzen, wenn das Icon semantisch relevant ist (sonst `decorative`).
 * - Varianten: 'outline' (Standard), 'filled', 'duotone'
 * - absoluteStrokeWidth: hält Strichstärke bei Größenänderung optisch konstant.
 */
export const CruiseShipIcon = React.memo(
  React.forwardRef<SVGSVGElement, CruiseShipIconProps>(function CruiseShipIcon(
    {
      size = 18,
      className,
      strokeWidth = 1.75,
      absoluteStrokeWidth = false,
      color = 'currentColor',
      title,
      decorative = false,
      variant = 'outline',
      ...rest
    },
    ref
  ) {
    const titleId = React.useId()

    const computedStrokeWidth =
      typeof size === 'number' && absoluteStrokeWidth
        ? (24 / size) * strokeWidth
        : strokeWidth

    const isFilled = variant === 'filled'
    const isDuotone = variant === 'duotone'

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={isFilled ? color : 'none'}
        stroke={isFilled ? 'none' : color}
        strokeWidth={computedStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn('shrink-0', className)}
        role="img"
        aria-hidden={decorative || !title ? true : undefined}
        aria-labelledby={!decorative && title ? titleId : undefined}
        focusable="false"
        {...rest}
      >
        {title ? <title id={titleId}>{title}</title> : null}

        {/* Duotone: gefüllte Silhouette mit niedriger Deckkraft */}
        {isDuotone && (
          <g opacity="0.16">
            <path d="M3 16l3-9h12l3 9z" />
          </g>
        )}

        {/* Schiffskörper & Aufbauten */}
        {!isFilled ? (
          <>
            {/* Rumpf und Rumpfkante */}
            <path d="M3 16l3-9h12l3 9" />
            {/* Schornstein/Brücke */}
            <path d="M12 5v3" />
            <path d="M9 7h6" />
          </>
        ) : (
          <>
            {/* Gefüllter Rumpf */}
            <path d="M3 16l3-9h12l3 9z" />
            {/* Details als Stroke über dem Fill */}
            <g
              fill="none"
              stroke={color}
              strokeWidth={computedStrokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v3" />
              <path d="M9 7h6" />
            </g>
          </>
        )}

        {/* Wellen – immer als Strich gezeichnet */}
        <g
          fill="none"
          stroke={color}
          strokeWidth={computedStrokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 18c1 .8 2 .8 3 0s2-.8 3 0 2 .8 3 0 2-.8 3 0 2 .8 3 0" />
          <path d="M6 21c1 .8 2 .8 3 0s2-.8 3 0 2 .8 3 0 2-.8 3 0" />
        </g>
      </svg>
    )
  })
)

CruiseShipIcon.displayName = 'CruiseShipIcon'
