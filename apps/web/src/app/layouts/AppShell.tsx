import { useState } from 'react'
import { useAuth, usePermissions } from '@features/auth'
import { NotificationsMenu } from '@features/notifications'
import { Button, CommandPalette, Drawer } from '@shared/components'
import { DashboardIcon, MenuIcon, OrdersIcon, ProductsIcon, RevenueIcon } from '@shared/icons'
import { ROUTES } from '@shared/constants'
import { AppLayout, Content, Header, Sidebar, type SidebarItem } from '@shared/layouts'

interface AppShellProps {
  roleLabel: string
}

const SIDEBAR_COLLAPSED_KEY = 'smartsense-sidebar-collapsed'

const NAV_ITEMS: Array<SidebarItem & { permission: string }> = [
  {
    label: 'Dashboard',
    href: ROUTES.DASHBOARD,
    permission: 'dashboard:view',
    icon: <DashboardIcon className="size-4 shrink-0" aria-hidden="true" />,
  },
  {
    label: 'Catalog',
    href: ROUTES.CATALOG,
    permission: 'catalog:read',
    icon: <ProductsIcon className="size-4 shrink-0" aria-hidden="true" />,
  },
  {
    label: 'Orders',
    href: ROUTES.ORDERS,
    permission: 'orders:read',
    icon: <OrdersIcon className="size-4 shrink-0" aria-hidden="true" />,
  },
  {
    label: 'Billing',
    href: ROUTES.BILLING,
    permission: 'billing:read',
    icon: <RevenueIcon className="size-4 shrink-0" aria-hidden="true" />,
  },
]

function readStoredCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
  } catch {
    return false
  }
}

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(readStoredCollapsed)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)

  const items = NAV_ITEMS.filter((item) => can(item.permission))
  const initials = (identity?.email ?? '?').slice(0, 2).toUpperCase()

  function toggleSidebarCollapsed() {
    setIsSidebarCollapsed((current) => {
      const next = !current
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next))
      } catch {
        // Persistence is a convenience; a storage exception must not block
        // the sidebar from collapsing.
      }
      return next
    })
  }

  return (
    <AppLayout
      header={
        <Header
          title="SmartSense Marketplace"
          subtitle={roleLabel}
          onOpenSearch={() => setIsCommandPaletteOpen(true)}
          notificationsSlot={<NotificationsMenu />}
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
      sidebar={
        <Sidebar
          items={items}
          collapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapsed}
          userLabel={identity?.email}
          userInitials={initials}
          roleLabel={roleLabel}
          onLogout={() => void logout()}
        />
      }
    >
      <Content />
      <Drawer
        open={isMobileNavOpen}
        onOpenChange={setIsMobileNavOpen}
        title="Navigation"
        side="left"
      >
        <Sidebar
          items={items}
          className="block w-full border-0 p-0"
          userLabel={identity?.email}
          userInitials={initials}
          roleLabel={roleLabel}
          onLogout={() => void logout()}
        />
      </Drawer>
      <CommandPalette
        open={isCommandPaletteOpen}
        onOpenChange={setIsCommandPaletteOpen}
        navItems={items}
        onLogout={() => void logout()}
      />
    </AppLayout>
  )
}
