import { useState } from 'react'
import { useAuth, usePermissions } from '@features/auth'
import { Button, Drawer } from '@shared/components'
import { MenuIcon } from '@shared/icons'
import { ROUTES } from '@shared/constants'
import { AppLayout, Content, Header, Sidebar, type SidebarItem } from '@shared/layouts'

interface AppShellProps {
  roleLabel: string
}

const NAV_ITEMS: Array<SidebarItem & { permission: string }> = [
  { label: 'Dashboard', href: ROUTES.DASHBOARD, permission: 'dashboard:view' },
  { label: 'Catalog', href: ROUTES.CATALOG, permission: 'catalog:read' },
  { label: 'Orders', href: ROUTES.ORDERS, permission: 'orders:read' },
  { label: 'Billing', href: ROUTES.BILLING, permission: 'billing:read' },
]

// One shared authenticated shell, parameterized by role — Admin/Partner/
// Customer layouts are three configurations of it, not three
// implementations (docs/frontend-architecture.md § Layout Architecture).
// Nav items are filtered by permission key (never a role check), per
// CLAUDE.md's Architecture Rules — this is the nav/sidebar chrome M10
// (Shared Component Library) adds on top of M8's login/logout journey.
export function AppShell({ roleLabel }: AppShellProps) {
  const { identity, logout } = useAuth()
  const { can } = usePermissions()
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  const items = NAV_ITEMS.filter((item) => can(item.permission))
  const initials = (identity?.email ?? '?').slice(0, 2).toUpperCase()

  return (
    <AppLayout
      header={
        <Header
          title="SmartSense Marketplace"
          subtitle={roleLabel}
          userLabel={identity?.email}
          userInitials={initials}
          onLogout={() => void logout()}
          leading={
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsMobileNavOpen(true)}
              aria-label="Open navigation"
            >
              <MenuIcon className="size-5" aria-hidden="true" />
            </Button>
          }
        />
      }
      sidebar={<Sidebar items={items} />}
    >
      <Content />
      <Drawer
        open={isMobileNavOpen}
        onOpenChange={setIsMobileNavOpen}
        title="Navigation"
        side="left"
      >
        <Sidebar items={items} className="block w-full border-0 p-0" />
      </Drawer>
    </AppLayout>
  )
}
