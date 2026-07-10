export { AppLoadingState } from './AppLoadingState'
export { ComingSoonPage } from './ComingSoonPage'
export { ErrorPage } from './ErrorPage'

// Shared UI vocabulary (docs/milestones.md M10 — Shared Component Library).
// Physically organized under `ui/` to distinguish design-system primitives
// from the page-shell components above; all still consumed via this one
// barrel per folder-structure.md's "feature/shared barrel is the only
// import path other layers may use" convention.
export { Accordion } from './ui/Accordion'
export type { AccordionItem, AccordionProps } from './ui/Accordion'
export { Alert } from './ui/Alert'
export type { AlertProps, AlertVariant } from './ui/Alert'
export { Avatar } from './ui/Avatar'
export type { AvatarProps, AvatarSize } from './ui/Avatar'
export { Badge } from './ui/Badge'
export type { BadgeProps, BadgeVariant } from './ui/Badge'
export { Breadcrumb } from './ui/Breadcrumb'
export type { BreadcrumbItem, BreadcrumbProps } from './ui/Breadcrumb'
export { Button } from './ui/Button'
export type { ButtonProps, ButtonSize, ButtonVariant } from './ui/Button'
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/Card'
export { Checkbox } from './ui/Checkbox'
export { CommandPalette } from './ui/CommandPalette'
export type { CommandPaletteNavItem, CommandPaletteProps } from './ui/CommandPalette'
export type { CheckboxProps } from './ui/Checkbox'
export { Dialog } from './ui/Dialog'
export type { DialogProps } from './ui/Dialog'
export { Drawer } from './ui/Drawer'
export type { DrawerProps } from './ui/Drawer'
export { EmptyState } from './ui/EmptyState'
export type { EmptyStateProps } from './ui/EmptyState'
export { ErrorState } from './ui/ErrorState'
export type { ErrorStateProps } from './ui/ErrorState'
export { Input } from './ui/Input'
export type { InputProps } from './ui/Input'
export { Kbd } from './ui/Kbd'
export { Menu, MenuItem, MenuLabel, MenuSeparator } from './ui/Menu'
export type { MenuItemProps, MenuProps } from './ui/Menu'
export { Modal } from './ui/Modal'
export type { ModalProps } from './ui/Modal'
export { PageHeader } from './ui/PageHeader'
export type { PageHeaderProps } from './ui/PageHeader'
export { Pagination } from './ui/Pagination'
export type { PaginationProps } from './ui/Pagination'
export { Popover } from './ui/Popover'
export type { PopoverProps } from './ui/Popover'
export { Radio, RadioGroup } from './ui/RadioGroup'
export type { RadioGroupProps, RadioProps } from './ui/RadioGroup'
export { Select } from './ui/Select'
export type { SelectOption, SelectProps } from './ui/Select'
export { Skeleton } from './ui/Skeleton'
export { Spinner } from './ui/Spinner'
export type { SpinnerProps } from './ui/Spinner'
export { Switch } from './ui/Switch'
export type { SwitchProps } from './ui/Switch'
export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
} from './ui/Table'
export type { TableCellProps, TableSkeletonProps } from './ui/Table'
export { Tabs } from './ui/Tabs'
export type { TabItem, TabsProps } from './ui/Tabs'
export { Textarea } from './ui/Textarea'
export type { TextareaProps } from './ui/Textarea'
export { ThemeProvider, ThemeToggle, useTheme } from './ui/ThemeToggle'
export type { ThemeToggleProps } from './ui/ThemeToggle'
export { ToastProvider, useToast } from './ui/Toast'
export type { ToastOptions, ToastVariant } from './ui/Toast'
export { UserMenu } from './ui/UserMenu'
export type { UserMenuProps } from './ui/UserMenu'
