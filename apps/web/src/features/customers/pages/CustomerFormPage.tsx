import { useMutation } from '@apollo/client'
import { useNavigate, useParams } from 'react-router'
import { CreateCustomerDocument, UpdateCustomerDocument } from '@lib/graphql/__generated__/graphql'
import { Card, CardContent, ErrorState, PageHeader, Skeleton, useToast } from '@shared/components'
import { ROUTES } from '@shared/constants'
import { CustomerForm, type CustomerFormValues } from '../components'
import { useCustomer } from '../hooks'

// One page for both create (/customers/new, Admin-only) and edit
// (/customers/:id/edit) — the mode is derived from the route's :id param,
// same pattern as ProductFormPage.
export function CustomerFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEditMode = id !== undefined
  const navigate = useNavigate()
  const { toast } = useToast()

  const { customer, isLoading, error } = useCustomer(id)

  const [createCustomer, { loading: isCreating }] = useMutation(CreateCustomerDocument, {
    onCompleted: (data) => {
      toast({ title: 'Customer created', variant: 'success' })
      navigate(`${ROUTES.CUSTOMERS}/${data.createCustomer.id}`)
    },
    onError: (mutationError) => {
      toast({
        title: "Couldn't create customer",
        description: mutationError.message,
        variant: 'danger',
      })
    },
  })

  const [updateCustomer, { loading: isUpdating }] = useMutation(UpdateCustomerDocument, {
    onCompleted: (data) => {
      toast({ title: 'Customer updated', variant: 'success' })
      navigate(`${ROUTES.CUSTOMERS}/${data.updateCustomer.id}`)
    },
    onError: (mutationError) => {
      toast({
        title: "Couldn't update customer",
        description: mutationError.message,
        variant: 'danger',
      })
    },
  })

  function handleSubmit(values: CustomerFormValues) {
    if (isEditMode) {
      void updateCustomer({
        variables: {
          input: {
            id,
            displayName: values.displayName,
            type: values.type,
            billingEmail: values.billingEmail,
          },
        },
      })
    } else {
      void createCustomer({
        variables: {
          input: {
            displayName: values.displayName,
            type: values.type,
            billingEmail: values.billingEmail,
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

  if (isEditMode && (error !== undefined || customer === undefined)) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <ErrorState
          title="Couldn't load this customer"
          description="It may not exist, or you may not have access to it."
        />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex flex-col gap-6">
        <PageHeader title={isEditMode ? 'Edit customer' : 'New customer'} />
        <Card>
          <CardContent className="pt-6">
            <CustomerForm
              defaultValues={
                isEditMode && customer !== undefined
                  ? {
                      displayName: customer.displayName,
                      type: customer.type,
                      billingEmail: customer.billingEmail,
                    }
                  : undefined
              }
              onSubmit={handleSubmit}
              isSubmitting={isCreating || isUpdating}
              submitLabel={isEditMode ? 'Save changes' : 'Create customer'}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
