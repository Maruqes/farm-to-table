const YEAR = new Date().getFullYear()

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-4 text-sm text-dim sm:flex-row sm:justify-between">
        <p>Farm to Table — local produce and live auctions.</p>
        <p>© {YEAR} Farm to Table</p>
      </div>
    </footer>
  )
}
