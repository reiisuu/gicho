import type { Product } from "./ProductGrid";

export type CartItem = Product & { quantity: number };
export type PaymentMethod = "Cash" | "GCash" | "Maya" | "Bank Transfer";

type CartProps = {
  items: CartItem[];
  paymentMethod: PaymentMethod;
  amountTenderedCents: number;
  referenceNumber: string;
  totalCents: number;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onAmountTenderedChange: (amountCents: number) => void;
  onQuickCash: (amountCents: number, mode: "add" | "exact") => void;
  onReferenceNumberChange: (referenceNumber: string) => void;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
  onSubmit: () => void;
  isSaving: boolean;
};

const formatPrice = (cents: number) =>
  `₱${(cents / 100).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const paymentMethods: PaymentMethod[] = ["Cash", "GCash", "Maya", "Bank Transfer"];

export default function Cart({
  items,
  paymentMethod,
  amountTenderedCents,
  referenceNumber,
  totalCents,
  onPaymentMethodChange,
  onAmountTenderedChange,
  onQuickCash,
  onReferenceNumberChange,
  onIncrement,
  onDecrement,
  onSubmit,
  isSaving,
}: CartProps) {
  const changeCents = Math.max(0, amountTenderedCents - totalCents);
  const insufficientCash =
    paymentMethod === "Cash" && amountTenderedCents < totalCents;

  return (
    <section className="flex min-h-0 min-w-0 h-full max-w-full flex-col overflow-hidden rounded-xl bg-white p-2 shadow-sm sm:p-4">
      <div className="mb-1 flex shrink-0 items-center justify-between sm:mb-4">
        <h2 className="text-lg font-bold text-gray-900 sm:text-xl">Current Order</h2>
        <span className="text-sm text-gray-500">{items.length} item types</span>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <p className="py-8 text-center text-gray-500">Tap a product to add it.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-500">
                  {formatPrice(item.priceCents)} each
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onDecrement(item.id)}
                  className="h-8 w-8 rounded-lg bg-gray-100 text-base font-bold"
                  aria-label={`Decrease ${item.name}`}
                >
                  -
                </button>
                <span className="w-4 text-center text-sm font-semibold">{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => onIncrement(item.id)}
                  className="h-8 w-8 rounded-lg bg-gray-900 text-base font-bold text-white"
                  aria-label={`Increase ${item.name}`}
                >
                  +
                </button>
              </div>
              <span className="w-20 text-right font-semibold">
                {formatPrice(item.priceCents * item.quantity)}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="mt-1 shrink-0 space-y-1 border-t border-gray-200 pt-1 sm:mt-4 sm:space-y-4 sm:pt-4">
        <div>
          <p className="mb-1 text-xs font-medium text-gray-700 sm:text-sm sm:mb-2">Payment Method</p>
          <div className="grid grid-cols-2 gap-1 sm:gap-2">
            {paymentMethods.map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => onPaymentMethodChange(method)}
                className={`rounded-lg px-2 py-0.5 text-xs font-semibold sm:px-3 sm:py-2 sm:text-sm ${
                  paymentMethod === method
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-2 gap-1 sm:gap-3">
          <label className="min-w-0 text-sm font-medium text-gray-700">
            Amount Received
            <input
              type="number"
              min="0"
              step="0.01"
              value={amountTenderedCents === 0 ? "" : amountTenderedCents / 100}
              onChange={(event) => {
                const amount = Number(event.target.value);
                onAmountTenderedChange(
                  Number.isFinite(amount)
                    ? Math.max(0, Math.round(amount * 100))
                    : 0,
                );
              }}
              className="mt-1 block min-w-0 max-w-full w-full rounded-lg border border-gray-300 px-2 py-0.5 text-base text-gray-900 sm:px-3 sm:py-2 sm:text-lg"
              placeholder="₱0.00"
            />
          </label>
          <div className="min-w-0">
            <span className="text-sm font-medium text-gray-700">Change</span>
            <p
              className={`mt-1 text-lg font-bold sm:text-2xl ${
                insufficientCash ? "text-red-600" : "text-green-700"
              }`}
            >
              {insufficientCash ? "Insufficient" : formatPrice(changeCents)}
            </p>
          </div>
        </div>

        {paymentMethod === "Cash" ? (
          <div>
            <p className="mb-1 text-xs font-bold text-slate-700 sm:mb-2 sm:text-sm">Quick Cash</p>
            <div className="grid min-w-0 grid-cols-2 gap-1 sm:grid-cols-4 sm:gap-2">
              {[
                { label: "Exact", amount: totalCents },
                { label: "₱100", amount: 10_000 },
                { label: "₱500", amount: 50_000 },
                { label: "₱1000", amount: 100_000 },
              ].map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() =>
                    onQuickCash(
                      option.amount,
                      option.label === "Exact" ? "exact" : "add",
                    )
                  }
                  className="min-h-7 min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap rounded-lg border-2 border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-extrabold text-emerald-900 hover:bg-emerald-100 active:scale-95 sm:min-h-12 sm:rounded-xl sm:py-2 sm:text-sm"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {paymentMethod !== "Cash" ? (
          <div className="min-w-0 max-w-full overflow-hidden rounded-lg bg-gray-50 p-2 sm:p-3">
            <label className="block min-w-0 text-sm font-medium text-gray-700">
              Reference Number{" "}
              <span className="font-normal text-gray-500">(Optional)</span>
              <input
                type="text"
                value={referenceNumber}
                onChange={(event) => onReferenceNumberChange(event.target.value)}
                className="mt-1 block min-w-0 max-w-full w-full rounded-lg border border-gray-300 px-2 py-1.5 text-base text-gray-900 sm:px-3 sm:py-2"
                placeholder="Enter reference number"
              />
            </label>
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-gray-700 sm:text-lg">Total</span>
          <span className="text-xl font-bold text-gray-900 sm:text-3xl">{formatPrice(totalCents)}</span>
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isSaving || items.length === 0 || insufficientCash}
          className="w-full rounded-xl bg-slate-900 px-4 py-1.5 text-base font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 sm:py-4 sm:text-xl"
        >
          {isSaving ? "Saving..." : "Save Sale"}
        </button>
      </div>
    </section>
  );
}