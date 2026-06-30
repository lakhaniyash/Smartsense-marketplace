import { ErrorBoundary } from '@shared/components'
import { AppProviders } from '@shared/providers'

export function App() {
  return (
    <ErrorBoundary>
      <AppProviders />
    </ErrorBoundary>
  )
}
