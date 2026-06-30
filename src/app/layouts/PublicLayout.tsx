import { Suspense } from 'react'
import { Outlet } from 'react-router'
import { LoadingPage } from '@app/pages/LoadingPage'

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Phase 6: Public header — logo only, no navigation */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Suspense fallback={<LoadingPage />}>
          <Outlet />
        </Suspense>
      </main>
      {/* Phase 6: Public footer */}
    </div>
  )
}
