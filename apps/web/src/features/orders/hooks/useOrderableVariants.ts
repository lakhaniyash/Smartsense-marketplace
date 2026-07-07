import { useQuery } from '@apollo/client'
import {
  GetOrderableVariantsDocument,
  ProductVariantStatus,
} from '@lib/graphql/__generated__/graphql'

export interface OrderableVariantOption {
  variantId: string
  sku: string
  price: string
  label: string
}

// Flattens Product -> ProductVariant[] into a single pickable list for the
// Create Order form's line-item selects — only ACTIVE variants are sellable
// (docs/domain-model.md § Product Variant).
export function useOrderableVariants(search: string | undefined) {
  const { data, loading, error } = useQuery(GetOrderableVariantsDocument, {
    variables: { search: search ?? null },
  })

  const options: OrderableVariantOption[] =
    data?.products.edges.flatMap((edge) =>
      edge.node.variants
        .filter((variant) => variant.status === ProductVariantStatus.Active)
        .map((variant) => ({
          variantId: variant.id,
          sku: variant.sku,
          price: variant.price,
          label: `${edge.node.title} — ${variant.sku} ($${variant.price})`,
        })),
    ) ?? []

  return { options, isLoading: loading, error }
}
