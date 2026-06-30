export type Maybe<T> = T | null | undefined

export type Nullable<T> = T | null

export type UserRole = 'admin' | 'partner' | 'customer'

export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiError {
  code: string
  message: string
}

export interface SelectOption<T = string> {
  label: string
  value: T
  disabled?: boolean
}
