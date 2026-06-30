import { Suspense } from 'react'
import { Outlet } from 'react-router'
import { MainLayout } from '@shared/layouts'

const contentFallback = (
  <div className="flex h-full items-center justify-center">
    <div
      aria-label="Loading"
      role="status"
      className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
    />
  </div>
)

export function PrivateLayout() {
  return (
    <MainLayout>
      <Suspense fallback={contentFallback}>
        <Outlet />
      </Suspense>
    </MainLayout>
  )
}
