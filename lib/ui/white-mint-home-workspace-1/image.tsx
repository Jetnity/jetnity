import type { ImgHTMLAttributes } from 'react'

type ImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean
  priority?: boolean
  unoptimized?: boolean
  sizes?: string
}

/** Browser stand-in for `next/image`. Local public files stay the real pixels. */
export default function Image({ fill, priority, unoptimized, sizes, alt = '', className, ...rest }: ImageProps) {
  void priority
  void unoptimized
  void sizes
  return (
    // The product component keeps next/image. This shim only exists in the local fixture.
    // eslint-disable-next-line @next/next/no-img-element
    <img {...rest} alt={alt} className={fill ? `absolute inset-0 h-full w-full ${className ?? ''}` : className} />
  )
}
