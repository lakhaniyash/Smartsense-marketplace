import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { Link, useNavigate, useParams } from 'react-router'
import { usePermissions } from '@features/auth'
import { ArchiveProductDocument, GetProductByIdDocument } from '@lib/graphql/__generated__/graphql'
import {
  Button,
  Card,
  CardContent,
  Dialog,
  ErrorState,
  PageHeader,
  Skeleton,
  Tabs,
  useToast,
} from '@shared/components'
import { ROUTES } from '@shared/constants'
import { useBreadcrumb } from '@shared/layouts'
import { ProductStatusBadge, VariantList } from '../components'
import { useProduct } from '../hooks'

// SM-108 (docs/milestones.md M12) — a single product's detail view. The
// shell renders its breadcrumb automatically from route metadata
// (shared/layouts/Breadcrumbs.tsx); useBreadcrumb below only supplies the
// real title once it loads, replacing the route's static "Product" fallback.
export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { product, isLoading, error } = useProduct(id)
  const { canEditCatalog } = usePermissions()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  useBreadcrumb(product?.title)

  const [archiveProduct, { loading: isArchiving }] = useMutation(ArchiveProductDocument, {
    refetchQueries: [GetProductByIdDocument],
    onCompleted: () => {
      setIsConfirmingDelete(false)
      toast({ title: 'Product deleted', variant: 'success' })
      navigate(ROUTES.CATALOG)
    },
    onError: () => {
      toast({
        title: "Couldn't delete product",
        description: 'Something went wrong. Please try again.',
        variant: 'danger',
      })
    },
  })

  return (
    <div className="flex flex-col gap-6">
      {isLoading && (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-4 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      )}

      {!isLoading && (error !== undefined || product === undefined) && (
        <ErrorState
          title="Couldn't load this product"
          description="It may not exist, or you may not have access to it."
          action={
            <Button variant="secondary" onClick={() => window.history.back()}>
              Back to catalog
            </Button>
          }
        />
      )}

      {!isLoading && error === undefined && product !== undefined && (
        <>
          <PageHeader
            title={product.title}
            description={product.category.name}
            action={
              canEditCatalog && (
                <div className="flex gap-2">
                  <Link
                    to={`${ROUTES.CATALOG}/${product.id}/edit`}
                    className="border-border-control bg-surface text-fg-secondary hover:bg-surface-hover focus-visible:outline-focus-ring inline-flex h-10 items-center rounded-md border px-4 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    Edit
                  </Link>
                  <Button variant="danger" onClick={() => setIsConfirmingDelete(true)}>
                    Delete
                  </Button>
                </div>
              )
            }
          />
          <Tabs
            items={[
              {
                value: 'details',
                label: 'Details',
                content: (
                  <Card>
                    <CardContent className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <ProductStatusBadge status={product.status} />
                        <span className="text-fg-muted text-sm">SKU: {product.sku}</span>
                      </div>
                      {product.description !== null && product.description !== undefined && (
                        <p className="text-fg-secondary text-sm">{product.description}</p>
                      )}
                      {product.brand !== null && product.brand !== undefined && (
                        <p className="text-fg-muted text-sm">Brand: {product.brand}</p>
                      )}
                    </CardContent>
                  </Card>
                ),
              },
              {
                value: 'variants',
                label: 'Variants',
                content: (
                  <VariantList
                    productId={product.id}
                    variants={product.variants}
                    canEdit={canEditCatalog}
                  />
                ),
              },
            ]}
          />

          <Dialog
            open={isConfirmingDelete}
            onOpenChange={setIsConfirmingDelete}
            title="Delete this product?"
            description={`"${product.title}" will be archived and removed from the catalog list. This cannot be undone from here.`}
            confirmLabel="Delete"
            variant="danger"
            isConfirming={isArchiving}
            onConfirm={() => void archiveProduct({ variables: { id: product.id } })}
          />
        </>
      )}
    </div>
  )
}
