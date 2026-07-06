import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Single className helper for every component — merges conditional classes
// (clsx) and resolves conflicting Tailwind utilities (tailwind-merge) so a
// consumer's override (e.g. `className="p-2"`) always wins over a
// component's own default padding instead of both classes fighting.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
