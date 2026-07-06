import { Link } from 'react-router'
import { usePermissions } from '@features/auth'
import {
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
} from '@shared/components'
import { ROUTES } from '@shared/constants'
import { ProductFilterBar, ProductStatusBadge } from '../components'
import { useCatalog } from '../hooks'

const COLUMN_COUNT = 4

function ProductTableHead() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Title</TableHead>
        <TableHead>SKU</TableHead>
        <TableHead>Category</TableHead>
        <TableHead>Status</TableHead>
      </TableRow>
    </TableHeader>
  )
}

// The Product list — SM-101 (docs/milestones.md M12). Route-level composition
// only: calls the feature's hook, branches the four view states, arranges
// components (docs/frontend-architecture.md § Feature Module Architecture).
export function CatalogPage() {
  const {
    products,
    pageInfo,
    filters,
    isLoading,
    error,
    setFilter,
    goToNextPage,
    hasPreviousPage,
    refetch,
  } = useCatalog()
  const { canEditCatalog } = usePermissions()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Catalog"
        description="Products in your catalog."
        action={
          canEditCatalog && (
            <Link
              to={`${ROUTES.CATALOG}/new`}
              className="inline-flex h-10 items-center rounded-md bg-gray-900 px-4 text-sm font-medium text-white transition-colors hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
            >
              New Product
            </Link>
          )
        }
      />
      <ProductFilterBar
        search={filters.search}
        categoryId={filters.categoryId}
        status={filters.status}
        onSearchChange={(value) => setFilter('search', value)}
        onCategoryChange={(value) => setFilter('categoryId', value)}
        onStatusChange={(value) => setFilter('status', value)}
      />

      {isLoading && (
        <Table>
          <ProductTableHead />
          <TableSkeleton rows={5} columns={COLUMN_COUNT} />
        </Table>
      )}

      {!isLoading && error !== undefined && (
        <ErrorState
          title="Couldn't load products"
          description="Something went wrong while loading the catalog."
          action={
            <Button variant="secondary" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
      )}

      {!isLoading && error === undefined && products.length === 0 && (
        <EmptyState title="No products found" description="Try adjusting your search or filters." />
      )}

      {!isLoading && error === undefined && products.length > 0 && (
        <>
          <Table>
            <ProductTableHead />
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell label="Title">
                    <Link
                      to={`${ROUTES.CATALOG}/${product.id}`}
                      className="text-primary font-medium hover:underline"
                    >
                      {product.title}
                    </Link>
                  </TableCell>
                  <TableCell label="SKU">{product.sku}</TableCell>
                  <TableCell label="Category">{product.category.name}</TableCell>
                  <TableCell label="Status">
                    <ProductStatusBadge status={product.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            hasPreviousPage={hasPreviousPage}
            hasNextPage={pageInfo?.hasNextPage ?? false}
            onPrevious={() => window.history.back()}
            onNext={goToNextPage}
          />
        </>
      )}
    </div>
  )
}
