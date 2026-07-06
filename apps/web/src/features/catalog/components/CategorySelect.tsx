import type { SelectHTMLAttributes } from 'react'
import { Select } from '@shared/components'
import { useCategories } from '../hooks'
import { buildCategoryOptions } from '../utils'

export interface CategorySelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'children'
> {
  label?: string
  placeholder?: string
  error?: string
}

// Wraps the shared Select with the live category taxonomy. Read-only browse
// only, per docs/domain-model.md Assumption 4 — Admin owns the tree, Partners
// select from it but never create/edit a Category here.
export function CategorySelect({
  label = 'Category',
  placeholder = 'Select a category',
  disabled,
  error,
  ...props
}: CategorySelectProps) {
  const { categories, isLoading } = useCategories()
  const options = buildCategoryOptions(categories)

  return (
    <Select
      label={label}
      placeholder={placeholder}
      options={options}
      disabled={isLoading || disabled}
      {...(error !== undefined && { error })}
      {...props}
    />
  )
}
