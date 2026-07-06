import { Button } from '../Button'
import { Modal } from '../Modal'

export interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'primary' | 'danger'
  onConfirm: () => void
  isConfirming?: boolean
}

// A confirmation-dialog-flavored wrapper composing Modal, not a second
// implementation — title, one sentence of consequence, and the two actions
// docs/ui-guidelines.md § Dialogs & Modals (Confirmation dialogs) requires.
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  onConfirm,
  isConfirming = false,
}: DialogProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isConfirming}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm} isLoading={isConfirming}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  )
}
