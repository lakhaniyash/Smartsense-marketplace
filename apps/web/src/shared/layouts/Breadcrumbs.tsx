import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import { useMatches } from 'react-router'
import { Breadcrumb, type BreadcrumbItem } from '@shared/components'

interface RouteHandle {
  crumb?: BreadcrumbItem[]
}

const BreadcrumbOverrideContext = createContext<
  { override: string | undefined; setOverride: (label: string | undefined) => void } | undefined
>(undefined)

// Wraps the shell's content region (Content.tsx) so a routed page (a
// descendant of the <Outlet/> rendered inside this same region) can publish
// a data-dependent trailing crumb — e.g. a Product's title, once fetched —
// to the <Breadcrumbs/> rendered as its sibling above.
export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [override, setOverride] = useState<string | undefined>(undefined)
  return (
    <BreadcrumbOverrideContext.Provider value={{ override, setOverride }}>
      {children}
    </BreadcrumbOverrideContext.Provider>
  )
}

// A page calls this with its resolved title once data has loaded (e.g.
// `useBreadcrumb(product?.title)`) to replace the trailing crumb's static
// route-handle fallback ("Product") with the real name. Passing `undefined`
// (still loading) leaves the fallback in place instead of showing a blank
// crumb — the fallback is never "nothing," it's the closest static label.
export function useBreadcrumb(label: string | undefined): void {
  const context = useContext(BreadcrumbOverrideContext)
  if (context === undefined) {
    throw new Error('useBreadcrumb must be used within a BreadcrumbProvider')
  }
  const { setOverride } = context
  useEffect(() => {
    if (label === undefined) {
      return undefined
    }
    setOverride(label)
    return () => setOverride(undefined)
  }, [label, setOverride])
}

// Derives the breadcrumb trail from the matched route's `handle.crumb`
// (declared once per route in app/router/index.tsx) rather than each page
// hand-rolling its own <Breadcrumb items={...}/> — this is what fixes the
// full-page-reload bug the old per-page <a> tags had (Breadcrumb now
// renders react-router <Link>s) and removes PageHeader's previously-dead
// `breadcrumb` prop. A route with no `handle.crumb` (every top-level list
// page: Dashboard/Catalog/Orders/Billing) renders nothing, matching
// docs/ui-guidelines.md § Navigation's "omitted on top-level list pages."
export function Breadcrumbs() {
  const matches = useMatches()
  const context = useContext(BreadcrumbOverrideContext)
  const leafCrumb = [...matches]
    .reverse()
    .map((match) => (match.handle as RouteHandle | undefined)?.crumb)
    .find((crumb): crumb is BreadcrumbItem[] => crumb !== undefined)

  if (leafCrumb === undefined || leafCrumb.length === 0) {
    return null
  }

  const override = context?.override
  const items =
    override !== undefined
      ? [...leafCrumb.slice(0, -1), { ...leafCrumb[leafCrumb.length - 1], label: override }]
      : leafCrumb

  return <Breadcrumb items={items} className="mb-6" />
}
