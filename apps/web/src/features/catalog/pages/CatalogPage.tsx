import { Link } from 'react-router'
import { usePermissions } from '@features/auth'
import {
  Button,
  Card,
  CardContent,
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
    goToPreviousPage,
    hasPreviousPage,
    refetch,
  } = useCatalog()
  const { canEditCatalog } = usePermissions()
  const hasActiveFilters =
    filters.search !== undefined || filters.categoryId !== undefined || filters.status !== undefined

  return (
    <div className="flex h-full flex-col gap-6">
      <PageHeader
        title="Catalog"
        description="Products in your catalog."
        action={
          canEditCatalog && (
            <Link
              to={`${ROUTES.CATALOG}/new`}
              className="bg-neutral-emphasis text-fg-on-emphasis hover:bg-neutral-emphasis-hover focus-visible:outline-focus-ring inline-flex h-10 items-center rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              New Product
            </Link>
          )
        }
      />
      <Card>
        <CardContent className="p-4">
          <ProductFilterBar
            search={filters.search}
            categoryId={filters.categoryId}
            status={filters.status}
            onSearchChange={(value) => setFilter('search', value)}
            onCategoryChange={(value) => setFilter('categoryId', value)}
            onStatusChange={(value) => setFilter('status', value)}
          />
        </CardContent>
      </Card>

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

      {!isLoading && error === undefined && products.length === 0 && hasActiveFilters && (
        <EmptyState
          title="No products found"
          description="Try adjusting your search or filters."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setFilter('search', undefined)
                setFilter('categoryId', undefined)
                setFilter('status', undefined)
              }}
            >
              Clear filters
            </Button>
          }
        />
      )}

      {!isLoading && error === undefined && products.length === 0 && !hasActiveFilters && (
        <EmptyState
          title="No products yet"
          description="Products you add to your catalog will show up here."
          action={
            canEditCatalog && (
              <Link
                to={`${ROUTES.CATALOG}/new`}
                className="bg-neutral-emphasis text-fg-on-emphasis hover:bg-neutral-emphasis-hover focus-visible:outline-focus-ring inline-flex h-10 items-center rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                New Product
              </Link>
            )
          }
        />
      )}

      {!isLoading && error === undefined && products.length > 0 && (
        // The table scrolls in its own bounded region; Pagination is a
        // plain, non-scrolling sibling below it, not layered on top of it
        // (see Pagination.tsx's doc comment for why `position: sticky`
        // was tried and reverted here).
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <Table>
              <ProductTableHead />
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell label="Title">
                      <Link
                        to={`${ROUTES.CATALOG}/${product.id}`}
                        className="text-fg-default hover:text-fg-secondary font-medium hover:underline"
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
          </div>
          <div className="border-border-default border-t pt-3">
            <Pagination
              hasPreviousPage={hasPreviousPage}
              hasNextPage={pageInfo?.hasNextPage ?? false}
              onPrevious={goToPreviousPage}
              onNext={goToNextPage}
            />
          </div>
        </div>
      )}
    </div>
  )
}
