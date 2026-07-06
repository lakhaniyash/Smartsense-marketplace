// Single sourcing point for the application's icon set (docs/ui-guidelines.md
// § Icons — "one icon set for the entire application"). Components and
// features import icons from here, never `lucide-react` directly, so a future
// icon-set change is a one-file edit.
export {
  AlertCircle as InfoIcon,
  AlertTriangle as WarningIcon,
  Check as CheckIcon,
  CheckCircle2 as SuccessIcon,
  ChevronDown as ChevronDownIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Circle as RadioDotIcon,
  History as ActivityIcon,
  Inbox as EmptyIcon,
  Loader2 as SpinnerIcon,
  LogOut as LogOutIcon,
  Menu as MenuIcon,
  Minus as IndeterminateIcon,
  Package as ProductsIcon,
  Search as SearchIcon,
  ShoppingCart as OrdersIcon,
  User as UserIcon,
  Users as CustomersIcon,
  Wallet as RevenueIcon,
  X as CloseIcon,
  XCircle as DangerIcon,
} from 'lucide-react'
