import { useMutation } from '@apollo/client'
import { useNavigate, useParams } from 'react-router'
import { CreateProductDocument, UpdateProductDocument } from '@lib/graphql/__generated__/graphql'
import { Card, CardContent, ErrorState, PageHeader, Skeleton, useToast } from '@shared/components'
import { ROUTES } from '@shared/constants'
import { ProductForm, type ProductFormValues } from '../components'
import { useProduct } from '../hooks'

// One page for both create (SM-113, /catalog/new) and edit
// (/catalog/:id/edit) — the mode is derived from the route's :id param, per
// Jira SM-113's "a single create/edit page handles both."
export function ProductFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEditMode = id !== undefined
  const navigate = useNavigate()
  const { toast } = useToast()

  const { product, isLoading, error } = useProduct(id)

  const [createProduct, { loading: isCreating }] = useMutation(CreateProductDocument, {
    onCompleted: (data) => {
      toast({ title: 'Product created', variant: 'success' })
      navigate(`${ROUTES.CATALOG}/${data.createProduct.id}`)
    },
    onError: (mutationError) => {
      toast({
        title: "Couldn't create product",
        description: mutationError.message,
        variant: 'danger',
      })
    },
  })

  const [updateProduct, { loading: isUpdating }] = useMutation(UpdateProductDocument, {
    onCompleted: (data) => {
      toast({ title: 'Product updated', variant: 'success' })
      navigate(`${ROUTES.CATALOG}/${data.updateProduct.id}`)
    },
    onError: (mutationError) => {
      toast({
        title: "Couldn't update product",
        description: mutationError.message,
        variant: 'danger',
      })
    },
  })

  function handleSubmit(values: ProductFormValues) {
    const description = values.description === '' ? undefined : values.description
    const brand = values.brand === '' ? undefined : values.brand

    if (isEditMode) {
      void updateProduct({
        variables: {
          input: {
            id,
            title: values.title,
            categoryId: values.categoryId,
            ...(description !== undefined && { description }),
            ...(brand !== undefined && { brand }),
            ...(values.status !== undefined && { status: values.status }),
          },
        },
      })
    } else if (values.sku !== undefined && values.price !== undefined) {
      // buildProductFormSchema('create') rejects submission before this
      // point if either is missing, so this narrows rather than guards.
      void createProduct({
        variables: {
          input: {
            title: values.title,
            categoryId: values.categoryId,
            sku: values.sku,
            price: values.price,
            ...(description !== undefined && { description }),
            ...(brand !== undefined && { brand }),
          },
        },
      })
    }
  }

  if (isEditMode && isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (isEditMode && (error !== undefined || product === undefined)) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <ErrorState
          title="Couldn't load this product"
          description="It may not exist, or you may not have access to it."
        />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex flex-col gap-6">
        <PageHeader title={isEditMode ? 'Edit product' : 'New product'} />
        <Card>
          <CardContent className="pt-6">
            <ProductForm
              mode={isEditMode ? 'edit' : 'create'}
              defaultValues={
                isEditMode && product !== undefined
                  ? {
                      title: product.title,
                      categoryId: product.category.id,
                      status: product.status,
                    }
                  : undefined
              }
              onSubmit={handleSubmit}
              isSubmitting={isCreating || isUpdating}
              submitLabel={isEditMode ? 'Save changes' : 'Create product'}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
