const YEAR = new Date().getFullYear()

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>Farm to Table — local produce and live auctions.</p>
        <p>© {YEAR} Farm to Table</p>
      </div>
    </footer>
  )
}
