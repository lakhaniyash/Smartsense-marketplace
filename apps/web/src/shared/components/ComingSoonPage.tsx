interface ComingSoonPageProps {
  title: string
}

export function ComingSoonPage({ title }: ComingSoonPageProps) {
  return (
    <div className="p-6">
      <h1 className="text-fg-default text-3xl font-bold tracking-tight">{title}</h1>
      <p className="text-fg-muted mt-2 text-sm">This module is not built yet.</p>
    </div>
  )
}
