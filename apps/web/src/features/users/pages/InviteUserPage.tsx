import { useMutation } from '@apollo/client'
import { useNavigate } from 'react-router'
import { InviteUserDocument } from '@lib/graphql/__generated__/graphql'
import { Card, CardContent, PageHeader, useToast } from '@shared/components'
import { ROUTES } from '@shared/constants'
import { InviteUserForm } from '../components'

// Sprint 3 (User Management, SM-340). On success, toast + redirect to the new
// user's detail page — same success pattern as CustomerFormPage.
export function InviteUserPage() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [inviteUser, { loading }] = useMutation(InviteUserDocument, {
    onCompleted: (data) => {
      toast({ title: 'Invitation sent', variant: 'success' })
      navigate(`${ROUTES.USERS}/${data.inviteUser.id}`)
    },
    onError: (error) =>
      toast({ title: "Couldn't send invite", description: error.message, variant: 'danger' }),
  })

  return (
    <div className="mx-auto w-full max-w-2xl">
      <PageHeader
        title="Invite user"
        description="Provision a new account. The invitee receives an email to set their password."
      />
      <Card>
        <CardContent className="pt-6">
          <InviteUserForm
            isSubmitting={loading}
            onSubmit={(input) => void inviteUser({ variables: { input } })}
          />
        </CardContent>
      </Card>
    </div>
  )
}
