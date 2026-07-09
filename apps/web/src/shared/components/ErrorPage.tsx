import type { ReactNode } from 'react'

interface ErrorPageProps {
  title: string
  message: string
  action?: ReactNode
}

export function ErrorPage({ title, message, action }: ErrorPageProps) {
  return (
    <div className="bg-canvas flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-fg-default text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-fg-muted mt-2 text-sm">{message}</p>
        {action !== undefined && <div className="mt-6">{action}</div>}
      </div>
    </div>
  )
}
