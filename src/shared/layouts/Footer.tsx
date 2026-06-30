const CURRENT_YEAR = new Date().getFullYear()

export function Footer() {
  return (
    <footer className="flex h-12 shrink-0 items-center border-t border-gray-200 bg-white px-6">
      <p className="text-xs text-gray-400">
        &copy; {CURRENT_YEAR} SmartSense Solutions. All rights reserved.
      </p>
    </footer>
  )
}
