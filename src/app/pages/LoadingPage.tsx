export function LoadingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div
        aria-label="Loading"
        role="status"
        className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
      />
      <p className="mt-4 text-sm text-gray-500">Loading&hellip;</p>
    </div>
  )
}
