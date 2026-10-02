import type { Product } from "./ProductGrid";

export type CartItem = Product & { quantity: number };
export type PaymentMethod = "Cash" | "GCash" | "Maya" | "Bank Transfer";

type CartProps = {
  items: CartItem[];
  paymentMethod: PaymentMethod;
  amountTenderedCents: number;
  referenceNumber: string;
  customerName: string;
  totalCents: number;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onAmountTenderedChange: (amountCents: number) => void;
  onReferenceNumberChange: (referenceNumber: string) => void;
  onCustomerNameChange: (customerName: string) => void;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
  onSubmit: () => void;
  isSaving: boolean;
  onClose?: () => void;
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
  customerName,
  totalCents,
  onPaymentMethodChange,
  onAmountTenderedChange,
  onReferenceNumberChange,
  onCustomerNameChange,
  onIncrement,
  onDecrement,
  onSubmit,
  isSaving,
  onClose,
}: CartProps) {
  const changeCents = Math.max(0, amountTenderedCents - totalCents);
  const insufficientCash =
    paymentMethod === "Cash" && amountTenderedCents < totalCents;

  return (
    <section className="flex h-full min-h-0 min-w-0 max-w-full flex-col overflow-hidden rounded-xl bg-white p-2 shadow-sm sm:rounded-xl sm:p-3">
      <div className="mb-1 flex shrink-0 items-center justify-between gap-3 sm:mb-2">
        <div>
          <h2 id="cashier-dialog-title" className="text-base font-bold text-gray-900 sm:text-lg">
            Current Order
          </h2>
          <span className="text-xs text-gray-500 sm:text-sm">{items.length} item types</span>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50"
          >
            Close
          </button>
        ) : null}
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,3fr)_minmax(0,2fr)] gap-2">
        <div className="custom-scrollbar min-h-0 space-y-2 overflow-y-auto overscroll-contain sm:space-y-3">
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500 sm:py-10 sm:text-base">
            Tap a product to add it.
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 shadow-sm sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:gap-4 sm:p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-gray-900 sm:text-lg">
                  {item.name}
                </p>
                <p className="mt-1 text-sm text-gray-600 sm:text-base">
                  {formatPrice(item.priceCents)} each
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onDecrement(item.id)}
                  className="h-9 w-9 rounded-lg bg-red-100 text-lg font-bold text-red-700 shadow-sm ring-1 ring-red-200 transition hover:bg-red-200 sm:h-10 sm:w-10 sm:text-xl"
                  aria-label={`Decrease ${item.name}`}
                >
                  -
                </button>
                <span className="w-6 text-center text-base font-bold text-gray-900">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onIncrement(item.id)}
                  className="h-9 w-9 rounded-lg bg-green-600 text-lg font-bold text-white shadow-sm transition hover:bg-green-700 sm:h-10 sm:w-10 sm:text-xl"
                  aria-label={`Increase ${item.name}`}
                >
                  +
                </button>
              </div>
              <span className="col-span-2 min-w-0 text-right text-lg font-bold text-gray-900 sm:col-span-1">
                {formatPrice(item.priceCents * item.quantity)}
              </span>
            </div>
          ))
        )}
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden border-t border-gray-200 pt-2 sm:pt-3">
          <div className="custom-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto sm:space-y-3">
          <div>
          <p className="mb-1 text-xs font-medium text-gray-700">Payment Method</p>
          <div className="grid grid-cols-2 gap-1.5">
            {paymentMethods.map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => onPaymentMethodChange(method)}
                className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                  paymentMethod === method
                    ? "bg-green-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
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
              className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-900"
              placeholder="₱0.00"
            />
          </label>
          <div>
            <span className="text-sm font-medium text-gray-700">Change</span>
            <p
              className={`mt-1 text-lg font-bold ${
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
              Reference Number{" "}
              <span className="font-normal text-gray-500">(Optional)</span>
              <input
                type="text"
                value={referenceNumber}
                onChange={(event) => onReferenceNumberChange(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-900"
                placeholder="Enter reference number"
              />
            </label>
          </div>
        ) : null}

        <label className="block text-sm font-medium text-gray-700">
          Customer Name <span className="font-normal text-gray-500">(Optional)</span>
          <input
            type="text"
            value={customerName}
            onChange={(event) => onCustomerNameChange(event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-900"
            placeholder="Enter customer name"
          />
        </label>

          </div>

          <div className="shrink-0 border-t border-gray-200 bg-white pt-1 pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700 sm:text-base">Total</span>
              <span className="text-xl font-bold text-gray-900 sm:text-2xl">{formatPrice(totalCents)}</span>
            </div>

            <button
              type="button"
              onClick={onSubmit}
              disabled={isSaving || items.length === 0 || insufficientCash}
              className="mt-1 w-full rounded-lg bg-green-600 px-3 py-2 text-base font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300 sm:text-lg"
            >
              {isSaving ? "Saving..." : "Save Sale"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}