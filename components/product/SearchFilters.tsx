/**
 * Product search filters sidebar.
 *
 * @component SearchFilters
 * @author Anurag Muthyam
 * @organization indosyn
 */

"use client";

import { Button } from "@/components/ui/Button";

interface SearchFiltersProps {
  productType: "ALL" | "JEWELRY" | "CLOTHING";
  onProductTypeChange: (type: "ALL" | "JEWELRY" | "CLOTHING") => void;
  minPrice: string;
  maxPrice: string;
  onMinPriceChange: (val: string) => void;
  onMaxPriceChange: (val: string) => void;
  sortBy: string;
  onSortChange: (val: string) => void;
  inStockOnly: boolean;
  onInStockChange: (val: boolean) => void;
  onApply: () => void;
  onReset: () => void;
}

export function SearchFilters({
  productType,
  onProductTypeChange,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  sortBy,
  onSortChange,
  inStockOnly,
  onInStockChange,
  onApply,
  onReset,
}: SearchFiltersProps) {
  return (
    <div className="p-5 border border-[var(--color-border)] rounded-xl bg-white space-y-5">
      <h3 className="font-semibold text-[var(--color-foreground)]">Filters</h3>

      {/* Product Type */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">Category</label>
        <div className="space-y-1.5">
          {(["ALL", "JEWELRY", "CLOTHING"] as const).map((type) => (
            <label key={type} className="flex items-center gap-2.5 text-sm text-[var(--color-foreground)] cursor-pointer hover:text-[var(--color-primary)] transition-colors">
              <input
                type="radio"
                name="productType"
                checked={productType === type}
                onChange={() => onProductTypeChange(type)}
                className="form-radio"
              />
              {type === "ALL" ? "All Products" : type.charAt(0) + type.slice(1).toLowerCase()}
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">Price Range (₹)</label>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => onMinPriceChange(e.target.value)}
            className="form-input"
            min="0"
          />
          <span className="text-[var(--color-muted)] shrink-0">—</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(e.target.value)}
            className="form-input"
            min="0"
          />
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">Sort By</label>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="form-input form-select"
        >
          <option value="newest">Newest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name_asc">Name: A to Z</option>
        </select>
      </div>

      {/* In Stock */}
      <label className="flex items-center gap-2.5 text-sm text-[var(--color-foreground)] cursor-pointer hover:text-[var(--color-primary)] transition-colors">
        <input
          type="checkbox"
          checked={inStockOnly}
          onChange={(e) => onInStockChange(e.target.checked)}
          className="form-checkbox"
        />
        In Stock Only
      </label>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={onApply} size="sm" className="flex-1">
          Apply
        </Button>
        <Button onClick={onReset} size="sm" variant="ghost" className="flex-1">
          Reset
        </Button>
      </div>
    </div>
  );
}
