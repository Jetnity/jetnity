/** Local, already resized WebP/brand assets. No remote image proxy or third-party requests. */
export default function Reisefoto({
  src,
  breite,
  hoehe,
  sofort = false,
}: {
  src: string
  breite?: number
  hoehe?: number
  sofort?: boolean
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={breite}
      height={hoehe}
      decoding="async"
      loading={sofort ? 'eager' : 'lazy'}
    />
  )
}
