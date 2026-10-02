"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Cart, {
  type CartItem,
  type PaymentMethod,
} from "@/components/pos/Cart";
import ProductGrid, {
  type Product,
} from "@/components/pos/ProductGrid";
import {
  enqueueSale,
  syncQueue,
  type SalePayload,
} from "@/lib/sync";
import {
  clearPosDraft,
  POS_DRAFT_STORAGE_KEY,
} from "@/lib/pos-draft";

function getLocalSaleDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type DraftSale = {
  items: CartItem[];
  paymentMethod: PaymentMethod;
  amountTenderedCents: number;
  referenceNumber: string;
  customerName: string;
};

type AddedToast = {
  id: number;
  productName: string;
};

const defaultDraftSale: DraftSale = {
  items: [],
  paymentMethod: "Cash",
  amountTenderedCents: 0,
  referenceNumber: "",
  customerName: "",
};

function getStoredDraftSale(): DraftSale {
  if (typeof window === "undefined") return defaultDraftSale;

  try {
    const storedDraft = window.localStorage.getItem(POS_DRAFT_STORAGE_KEY);
    if (!storedDraft) return defaultDraftSale;

    const draft = JSON.parse(storedDraft) as Partial<DraftSale>;
    return {
      items: Array.isArray(draft.items) ? draft.items : [],
      paymentMethod:
        draft.paymentMethod === "Cash" ||
        draft.paymentMethod === "GCash" ||
        draft.paymentMethod === "Maya" ||
        draft.paymentMethod === "Bank Transfer"
          ? draft.paymentMethod
          : "Cash",
      amountTenderedCents:
        typeof draft.amountTenderedCents === "number"
          ? draft.amountTenderedCents
          : 0,
      referenceNumber:
        typeof draft.referenceNumber === "string" ? draft.referenceNumber : "",
      customerName:
        typeof draft.customerName === "string" ? draft.customerName : "",
    };
  } catch {
    clearPosDraft();
    return defaultDraftSale;
  }
}

export default function PosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [amountTenderedCents, setAmountTenderedCents] = useState(0);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error" | "info">("info");
  const [addedToast, setAddedToast] = useState<AddedToast | null>(null);
  const [isToastExiting, setIsToastExiting] = useState(false);
  const toastTimeout = useRef<number | null>(null);
  const toastRemovalTimeout = useRef<number | null>(null);
  const hasLoadedDraft = useRef(false);

  const totalCents = useMemo(
    () => items.reduce((total, item) => total + item.priceCents * item.quantity, 0),
    [items],
  );

  const refreshQueue = useCallback(async () => {
    await syncQueue();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setIsLoadingProducts(true);
      try {
        const response = await fetch("/api/products?activeOnly=true");
        if (!response.ok) throw new Error("Unable to load products");
        const data = (await response.json()) as Product[];
        if (!cancelled) setProducts(data);
      } catch {
        if (!cancelled) {
          setStatus("Unable to load products. Please refresh.");
          setStatusType("error");
        }
      } finally {
        if (!cancelled) setIsLoadingProducts(false);
      }
    }

    void loadProducts();
    void refreshQueue();
    window.addEventListener("online", refreshQueue);
    const interval = window.setInterval(refreshQueue, 30_000);

    return () => {
      cancelled = true;
      window.removeEventListener("online", refreshQueue);
      window.clearInterval(interval);
    };
  }, [refreshQueue]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const draft = getStoredDraftSale();
      setItems(draft.items);
      setPaymentMethod(draft.paymentMethod);
      setAmountTenderedCents(draft.amountTenderedCents);
      setReferenceNumber(draft.referenceNumber);
      setCustomerName(draft.customerName);
      hasLoadedDraft.current = true;
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hasLoadedDraft.current) return;

    if (items.length === 0) {
      clearPosDraft();
      return;
    }

    const draft: DraftSale = {
      items,
      paymentMethod,
      amountTenderedCents,
      referenceNumber,
      customerName,
    };
    window.localStorage.setItem(POS_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [
    amountTenderedCents,
    customerName,
    items,
    paymentMethod,
    referenceNumber,
  ]);

  useEffect(() => {
    if (!isCartOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsCartOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCartOpen]);

  function addProduct(product: Product) {
    setItems((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...current, { ...product, quantity: 1 }];
    });
    if (toastTimeout.current !== null) {
      window.clearTimeout(toastTimeout.current);
    }
    if (toastRemovalTimeout.current !== null) {
      window.clearTimeout(toastRemovalTimeout.current);
    }
    setIsToastExiting(false);
    setAddedToast({ id: Date.now(), productName: product.name });
    toastTimeout.current = window.setTimeout(() => {
      setIsToastExiting(true);
      toastTimeout.current = null;
      toastRemovalTimeout.current = window.setTimeout(() => {
        setAddedToast(null);
        setIsToastExiting(false);
        toastRemovalTimeout.current = null;
      }, 260);
    }, 1400);
    setStatus("");
  }

  useEffect(
    () => () => {
      if (toastTimeout.current !== null) {
        window.clearTimeout(toastTimeout.current);
      }
      if (toastRemovalTimeout.current !== null) {
        window.clearTimeout(toastRemovalTimeout.current);
      }
    },
    [],
  );

  function changeQuantity(productId: string, amount: number) {
    setItems((current) =>
      current
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity + amount }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  async function saveSale() {
    if (items.length === 0 || isSaving) return;

    const sale: SalePayload = {
      clientId: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      saleDate: getLocalSaleDate(),
      items: items.map((item) => ({
        productId: item.id,
        name: item.name,
        unitPriceCents: item.priceCents,
        quantity: item.quantity,
      })),
      totalCents,
      paymentMethod,
      amountTenderedCents,
      ...(paymentMethod === "Cash"
        ? { changeCents: Math.max(0, amountTenderedCents - totalCents) }
        : referenceNumber.trim()
          ? { referenceNumber: referenceNumber.trim() }
          : {}),
      ...(customerName.trim() ? { customerName: customerName.trim() } : {}),
      source: "app",
    };

    setIsSaving(true);
    setStatus("");

    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sale),
      });

      if (!response.ok) {
        throw new Error("Sale could not be saved");
      }

      setStatus("Sale saved successfully.");
      setStatusType("success");
    } catch {
      enqueueSale(sale);
      setStatus("Saved to Offline Queue.");
      setStatusType("info");
    } finally {
      setItems([]);
      setIsCartOpen(false);
      setAmountTenderedCents(0);
      setReferenceNumber("");
      setCustomerName("");
      setIsSaving(false);
      clearPosDraft();
    }
  }

  return (
    <main className="h-[calc(100dvh-5rem)] max-h-[calc(100dvh-5rem)] overflow-hidden bg-slate-100 p-3 text-slate-950 sm:p-6">
      <div className="mx-auto flex h-full min-h-0 max-w-7xl flex-col">
        <header className="mb-3 flex shrink-0 items-start justify-between gap-3 sm:mb-4 sm:items-center">
          <div>
            <p className="text-sm font-semibold text-slate-500">Gicho POS</p>
            <h1 className="text-xl font-bold sm:text-2xl">Sell</h1>
          </div>
          {status ? (
            <p className={`max-w-[60%] rounded-lg px-3 py-2 text-right text-xs font-semibold shadow-sm sm:max-w-none sm:text-sm ${
              statusType === "success"
                ? "bg-emerald-100 text-emerald-900"
                : statusType === "error"
                  ? "bg-red-100 text-red-900"
                  : "bg-white text-slate-800"
            }`}>
              {statusType === "success" ? "✓ " : null}
              {status}
            </p>
          ) : null}
        </header>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl bg-slate-50">
            <h2 className="mb-3 text-xl font-bold text-slate-950">Products</h2>
            {isLoadingProducts ? (
              <div className="flex min-h-0 flex-1 items-center justify-center text-sm font-semibold text-slate-600">
                <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
                Loading products...
              </div>
            ) : (
              <ProductGrid products={products} onAdd={addProduct} />
            )}
        </section>
      </div>

      {items.length > 0 ? (
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom)+0.75rem)] right-3 z-40 flex items-center gap-2 rounded-full bg-green-600 px-4 py-3 text-left text-white shadow-xl transition hover:bg-green-700 sm:right-6 sm:gap-3 sm:px-5"
          aria-label={`Open cart with ${items.length} item types`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-900">
            {items.reduce((count, item) => count + item.quantity, 0)}
          </span>
          <span>
            <span className="block text-sm font-semibold">View cart</span>
            <span className="block text-xs text-slate-300">
              {formatPrice(totalCents)}
            </span>
          </span>
        </button>
      ) : null}

      {addedToast ? (
        <div
          key={addedToast.id}
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed bottom-[calc(5rem+env(safe-area-inset-bottom)+4.75rem)] left-1/2 z-40 -translate-x-1/2 sm:bottom-[calc(5rem+env(safe-area-inset-bottom)+5rem)]"
        >
          <div
            className={`flex items-center gap-2 rounded-full bg-slate-900/95 px-3 py-2 text-xs font-semibold text-white shadow-lg sm:px-4 sm:text-sm ${
              isToastExiting
                ? "animate-[toast-out_260ms_ease-in_forwards]"
                : "animate-[toast-in_220ms_ease-out]"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">
              ✓
            </span>
            <span className="max-w-[12rem] truncate">{addedToast.productName} added</span>
          </div>
        </div>
      ) : null}

      {isCartOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-2 sm:p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsCartOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cashier-dialog-title"
            className="flex h-[80dvh] max-h-[80dvh] min-h-0 w-full max-w-2xl flex-col overflow-hidden"
          >
            <Cart
              items={items}
              paymentMethod={paymentMethod}
              amountTenderedCents={amountTenderedCents}
              referenceNumber={referenceNumber}
              customerName={customerName}
              totalCents={totalCents}
              onPaymentMethodChange={setPaymentMethod}
              onAmountTenderedChange={setAmountTenderedCents}
              onReferenceNumberChange={setReferenceNumber}
              onCustomerNameChange={setCustomerName}
              onIncrement={(id) => changeQuantity(id, 1)}
              onDecrement={(id) => changeQuantity(id, -1)}
              onSubmit={saveSale}
              isSaving={isSaving}
              onClose={() => setIsCartOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}

function formatPrice(cents: number) {
  return `₱${(cents / 100).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}