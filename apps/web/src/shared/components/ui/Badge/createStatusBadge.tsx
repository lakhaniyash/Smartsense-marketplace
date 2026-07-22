import { Badge, type BadgeVariant } from './Badge'

// Factory collapsing the seven near-identical *StatusBadge components (release
// audit F-M15): each supplied an enum->variant map + enum->label map and an
// otherwise identical one-line render through the shared Badge. `TStatus` is
// the feature's string-enum union (e.g. OrderStatus); the returned component's
// `status` prop is that same union, so each call site preserves its exact
// props shape and rendered output.
export function createStatusBadge<TStatus extends string>(
  variantMap: Record<TStatus, BadgeVariant>,
  labelMap: Record<TStatus, string>,
) {
  return function StatusBadge({ status }: { status: TStatus }) {
    return <Badge variant={variantMap[status]}>{labelMap[status]}</Badge>
  }
}
