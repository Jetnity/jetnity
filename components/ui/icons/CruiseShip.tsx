// components/ui/icons/CruiseShip.tsx

export function CruiseShipIcon({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 18l3-9h12l3 9"/>
      <path d="M12 3v6"/>
      <path d="M9 6h6"/>
      <path d="M4 18c2 .5 4 1 8 1s6-.5 8-1"/>
      <path d="M6 21c2 .5 4 1 6 1s4-.5 6-1"/>
    </svg>
  )
}
