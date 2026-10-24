type ImageProps = {
  src: string | { src: string }
  alt: string
}

export default function Image({ alt, src }: ImageProps) {
  const quelle = typeof src === 'string' ? src : src.src
  return <span role="img" aria-label={alt} data-src={quelle} />
}
