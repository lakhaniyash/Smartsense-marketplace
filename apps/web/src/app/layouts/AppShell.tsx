import { Outlet } from 'react-router'
import { useAuth } from '@features/auth'

interface AppShellProps {
  roleLabel: string
}

// One shared authenticated shell, parameterized by role — Admin/Partner/
// Customer layouts are three configurations of it, not three
// implementations (docs/frontend-architecture.md § Layout Architecture).
// The full nav/sidebar chrome lands with M10 (Shared Component Library);
// today this proves the login → protected route → logout journey.
export function AppShell({ roleLabel }: AppShellProps) {
  const { identity, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">SmartSense Marketplace</p>
          <p className="text-xs text-gray-500">{roleLabel}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{identity?.email}</span>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700"
          >
            Log out
          </button>
        </div>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  )
}
