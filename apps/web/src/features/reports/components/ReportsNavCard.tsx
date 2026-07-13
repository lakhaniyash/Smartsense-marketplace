import type { ComponentType, SVGProps } from 'react'
import { Link } from 'react-router'
import { Card, CardContent } from '@shared/components'

export interface ReportsNavCardProps {
  title: string
  description: string
  href: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

// One tile in the Reports Dashboard's link grid to each report route
// (docs/frontend-architecture.md § Routing Architecture — six distinct data
// domains, each with its own bookmarkable URL, not tabs). The whole card is
// the click target — `Card`'s plain div is wrapped in `Link` rather than
// nesting an interactive element inside one, avoiding a nested-interactive
// a11y violation.
export function ReportsNavCard({ title, description, href, icon: Icon }: ReportsNavCardProps) {
  return (
    <Link
      to={href}
      className="focus-visible:outline-focus-ring block rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <Card className="hover:bg-surface-hover h-full transition-colors">
        <CardContent className="flex items-start gap-4">
          <div className="bg-surface-hover text-fg-muted rounded-lg p-3" aria-hidden="true">
            <Icon className="size-5" />
          </div>
          <div>
            <p className="text-fg-default font-medium">{title}</p>
            <p className="text-fg-muted text-sm">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
