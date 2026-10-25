import { lazy, Suspense, type ComponentType } from 'react'

type Loader = () => Promise<{ default: ComponentType<Record<string, unknown>> }>

export default function dynamic(loader: Loader) {
  const Geladen = lazy(loader)
  return function Dynamisch(props: Record<string, unknown>) {
    return (
      <Suspense fallback={null}>
        <Geladen {...props} />
      </Suspense>
    )
  }
}
