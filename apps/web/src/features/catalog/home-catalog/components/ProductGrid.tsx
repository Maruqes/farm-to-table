import type { Product } from '../catalog.types'
import { ProductCard } from './ProductCard'

// The catalog is a board: one .board-row per product under a thick top rule.
// ProductCard renders the <li>, so this stays a plain list wrapper.
export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul className="board">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </ul>
  )
}
