import type { ReactNode } from 'react'
import { Footer } from './Footer'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

interface MainLayoutProps {
  readonly children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
      </div>
      <Footer />
    </div>
  )
}
