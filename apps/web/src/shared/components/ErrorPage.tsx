import type { ReactNode } from 'react'

interface ErrorPageProps {
  title: string
  message: string
  action?: ReactNode
}

export function ErrorPage({ title, message, action }: ErrorPageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">{title}</h1>
        <p className="mt-2 text-sm text-gray-500">{message}</p>
        {action !== undefined && <div className="mt-6">{action}</div>}
      </div>
    </div>
  )
}
