import { createBrowserRouter, RouterProvider } from 'react-router'

function PlaceholderPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">SmartSense Marketplace</h1>
        <p className="mt-2 text-sm text-gray-500">
          Platform foundation ready. Features coming soon.
        </p>
      </div>
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <PlaceholderPage />,
  },
  {
    path: '*',
    element: <PlaceholderPage />,
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
