import type { ReactNode } from 'react'

interface PageContainerProps {
  readonly children: ReactNode
  readonly title?: string
}

export function PageContainer({ children, title }: PageContainerProps) {
  return (
    <div className="p-6">
      {title !== undefined && (
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-gray-900">{title}</h1>
      )}
      {children}
    </div>
  )
}
