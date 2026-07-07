import { useMutation } from '@apollo/client'
import { useNavigate } from 'react-router'
import { CreateOrderDocument } from '@lib/graphql/__generated__/graphql'
import { Breadcrumb, PageHeader, useToast } from '@shared/components'
import { ROUTES } from '@shared/constants'
import { OrderForm, type OrderFormValues } from '../components'

// Per docs/ui-guidelines.md's own example: "Create Order navigates to the
// new Order's detail page" on success.
export function OrderFormPage() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [createOrder, { loading: isCreating }] = useMutation(CreateOrderDocument, {
    onCompleted: (data) => {
      toast({ title: 'Order created', variant: 'success' })
      navigate(`${ROUTES.ORDERS}/${data.createOrder.id}`)
    },
    onError: (mutationError) => {
      toast({
        title: "Couldn't create order",
        description: mutationError.message,
        variant: 'danger',
      })
    },
  })

  function handleSubmit(values: OrderFormValues) {
    void createOrder({
      variables: {
        input: {
          items: values.items.map((item) => ({
            productVariantId: item.productVariantId,
            quantity: Number(item.quantity),
          })),
          ...(values.customerId !== undefined &&
            values.customerId !== '' && { customerId: values.customerId }),
          ...(values.shippingAddressId !== undefined &&
            values.shippingAddressId !== '' && { shippingAddressId: values.shippingAddressId }),
        },
      },
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: 'Orders', href: ROUTES.ORDERS }, { label: 'New order' }]} />
      <PageHeader title="New order" />
      <OrderForm onSubmit={handleSubmit} isSubmitting={isCreating} />
    </div>
  )
}
