const YEAR = new Date().getFullYear()

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container d-flex flex-column flex-sm-row justify-content-sm-between gap-1 py-4 small text-body-secondary">
        <p className="mb-0">Farm to Table — local produce and live auctions.</p>
        <p className="mb-0">© {YEAR} Farm to Table</p>
      </div>
    </footer>
  )
}
