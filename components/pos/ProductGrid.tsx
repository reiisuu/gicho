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
  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center font-semibold text-slate-600">
        No active products yet.
      </div>
    );
  }

  return (
    <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {products.map((product) => (
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
    </div>
  );
}