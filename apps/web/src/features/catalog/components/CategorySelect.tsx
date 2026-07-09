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
  // See Select's own doc comment — set true when this is a filter (the
  // placeholder means "all categories" and must stay re-selectable), leave
  // false (default) for a required form field like ProductForm's picker.
  clearable?: boolean
  // A table filter bar's placeholder/current-value text already discloses
  // "this is the category filter" to a sighted user (docs/ui-guidelines.md
  // § Tables — Filtering), so a filter usage sets this true to drop the
  // visible label and keep only its accessible name (aria-label), saving
  // the row of vertical space a label would cost. A required form field
  // (ProductForm) leaves this false — docs/ui-guidelines.md § Forms —
  // Labels requires a visible, persistent label there.
  hideLabel?: boolean
}

// Wraps the shared Select with the live category taxonomy. Read-only browse
// only, per docs/domain-model.md Assumption 4 — Admin owns the tree, Partners
// select from it but never create/edit a Category here.
export function CategorySelect({
  label = 'Category',
  placeholder = 'Select a category',
  clearable = false,
  hideLabel = false,
  disabled,
  error,
  ...props
}: CategorySelectProps) {
  const { categories, isLoading, error: queryError } = useCategories()
  const options = buildCategoryOptions(categories)
  // The caller's own validation error (a required field left empty) always
  // wins over the query error — both indicate "invalid", but the caller's
  // is the more specific, actionable one when both happen to be present.
  const resolvedError =
    error ?? (queryError !== undefined ? 'Failed to load categories' : undefined)

  return (
    <Select
      placeholder={isLoading ? 'Loading categories…' : placeholder}
      clearable={clearable}
      options={options}
      disabled={isLoading || disabled}
      {...(hideLabel ? { 'aria-label': label } : { label })}
      {...(resolvedError !== undefined && { error: resolvedError })}
      {...props}
    />
  )
}
