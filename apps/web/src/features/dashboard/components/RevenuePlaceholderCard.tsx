import { Badge, Card, CardContent } from '@shared/components'
import { REVENUE_PLACEHOLDER_CARD } from '../constants'

// No GraphQL field backs this card — money needs a real Decimal/Money scalar
// (docs/graphql.md § 7), which lands with Billing (M14). Rendered as a
// UI-only placeholder rather than a mock schema field, per this project's
// "expose only implemented capabilities" rule for money.
export function RevenuePlaceholderCard() {
  const Icon = REVENUE_PLACEHOLDER_CARD.icon

  return (
    <Card className="border-dashed opacity-75">
      <CardContent className="flex items-center gap-4">
        <div className="bg-surface-hover text-fg-muted rounded-lg p-3">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-fg-muted text-xs font-medium tracking-wide uppercase">
            {REVENUE_PLACEHOLDER_CARD.label}
          </p>
          <Badge className="mt-1">Coming soon</Badge>
        </div>
      </CardContent>
    </Card>
  )
}
