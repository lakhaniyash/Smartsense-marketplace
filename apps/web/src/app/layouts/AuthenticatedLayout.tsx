import { useAuth } from '@features/auth'
import { AdminLayout } from './AdminLayout'
import { PartnerLayout } from './PartnerLayout'
import { CustomerLayout } from './CustomerLayout'

// Layout selection happens after auth resolves and is driven by the user's
// resolved roles by one function — never duplicated if(isAdmin) branches at
// call sites (docs/authentication.md § Route Protection). This is a
// rendering concern only; ProtectedRoute/PermissionRoute already decided
// access before this component renders.
export function AuthenticatedLayout() {
  const { identity } = useAuth()
  const roles = identity?.roles ?? []

  if (roles.includes('Admin')) {
    return <AdminLayout />
  }
  if (roles.includes('Partner')) {
    return <PartnerLayout />
  }
  return <CustomerLayout />
}
