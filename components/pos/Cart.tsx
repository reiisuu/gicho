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
    <section className="flex h-full flex-col rounded-xl bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Current Order</h2>
        <span className="text-sm text-gray-500">{items.length} item types</span>
      </div>

      <div className="min-h-32 flex-1 space-y-3 overflow-y-auto">
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onDecrement(item.id)}
                  className="h-9 w-9 rounded-lg bg-gray-100 text-lg font-bold"
                  aria-label={`Decrease ${item.name}`}
                >
                  -
                </button>
                <span className="w-5 text-center font-semibold">{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => onIncrement(item.id)}
                  className="h-9 w-9 rounded-lg bg-gray-900 text-lg font-bold text-white"
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

      <div className="mt-4 space-y-4 border-t border-gray-200 pt-4">
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Payment Method</p>
          <div className="grid grid-cols-2 gap-2">
            {paymentMethods.map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => onPaymentMethodChange(method)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                  paymentMethod === method
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm font-medium text-gray-700">
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
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-lg text-gray-900"
              placeholder="₱0.00"
            />
          </label>
          <div>
            <span className="text-sm font-medium text-gray-700">Change</span>
            <p
              className={`mt-1 text-2xl font-bold ${
                insufficientCash ? "text-red-600" : "text-green-700"
              }`}
            >
              {insufficientCash ? "Insufficient" : formatPrice(changeCents)}
            </p>
          </div>
        </div>

        {paymentMethod !== "Cash" ? (
          <div className="rounded-lg bg-gray-50 p-3">
            <label className="block text-sm font-medium text-gray-700">
              Reference Number <span className="font-normal text-gray-500">(Optional)</span>
              <input
                type="text"
                value={referenceNumber}
                onChange={(event) => onReferenceNumberChange(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900"
                placeholder="Enter reference number"
              />
            </label>
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-gray-700">Total</span>
          <span className="text-3xl font-bold text-gray-900">{formatPrice(totalCents)}</span>
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isSaving || items.length === 0 || insufficientCash}
          className="w-full rounded-xl bg-green-600 px-4 py-4 text-xl font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isSaving ? "Saving..." : "Save Sale"}
        </button>
      </div>
    </section>
  );
}