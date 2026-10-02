import { useMemo, useState } from "react";

export type Product = {
  id: string;
  name: string;
  category: string;
  priceCents: number;
};

type ProductGridProps = {
  products: Product[];
  onAdd: (product: Product) => void;
};

const formatPrice = (cents: number) =>
  `₱${(cents / 100).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function ProductGrid({ products, onAdd }: ProductGridProps) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category))),
    [products],
  );
  const visibleProducts = useMemo(
    () =>
      selectedCategory === "All"
        ? products
        : products.filter((product) => product.category === selectedCategory),
    [products, selectedCategory],
  );

  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center font-semibold text-slate-600">
        No active products yet.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="custom-scrollbar flex shrink-0 gap-2 overflow-x-auto pb-1">
        {["All", ...categories].map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setSelectedCategory(category)}
            aria-pressed={selectedCategory === category}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${
              selectedCategory === category
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
        {visibleProducts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center font-semibold text-slate-600">
            No products in this category.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {visibleProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => onAdd(product)}
                className="min-h-28 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-900 active:scale-95"
              >
                <span className="block font-semibold text-slate-950">{product.name}</span>
                <span className="mt-2 block text-lg font-bold text-slate-800">
                  {formatPrice(product.priceCents)}
                </span>
                <span className="mt-1 block text-xs font-semibold text-slate-500">{product.category}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}