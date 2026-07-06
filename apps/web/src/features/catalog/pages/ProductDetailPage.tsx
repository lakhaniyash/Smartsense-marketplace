import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { Link, useNavigate, useParams } from 'react-router'
import { usePermissions } from '@features/auth'
import { ArchiveProductDocument, GetProductByIdDocument } from '@lib/graphql/__generated__/graphql'
import {
  Breadcrumb,
  Button,
  Card,
  CardContent,
  Dialog,
  ErrorState,
  PageHeader,
  Skeleton,
  useToast,
} from '@shared/components'
import { ROUTES } from '@shared/constants'
import { ProductStatusBadge } from '../components'
import { useProduct } from '../hooks'

// SM-108 (docs/milestones.md M12) — a single product's detail view. Nested
// more than one level deep under /catalog, so it gets a Breadcrumb per
// docs/ui-guidelines.md § Navigation (contrast the list page, which omits one).
export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { product, isLoading, error } = useProduct(id)
  const { canEditCatalog } = usePermissions()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

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
      <Breadcrumb
        items={[{ label: 'Catalog', href: ROUTES.CATALOG }, { label: product?.title ?? 'Product' }]}
      />

      {isLoading && (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
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
                    className="inline-flex h-10 items-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
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
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <ProductStatusBadge status={product.status} />
                <span className="text-sm text-gray-500">SKU: {product.sku}</span>
              </div>
              {product.description !== null && product.description !== undefined && (
                <p className="text-sm text-gray-700 dark:text-gray-300">{product.description}</p>
              )}
              {product.brand !== null && product.brand !== undefined && (
                <p className="text-sm text-gray-500">Brand: {product.brand}</p>
              )}
            </CardContent>
          </Card>

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
