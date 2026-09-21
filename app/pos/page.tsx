"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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

function getLocalSaleDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function PosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [amountTenderedCents, setAmountTenderedCents] = useState(0);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error" | "info">("info");

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
    setStatus("");
  }

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
      setAmountTenderedCents(0);
      setReferenceNumber("");
      setIsSaving(false);
    }
  }

  return (
    <main className="h-[calc(100dvh-5rem)] max-h-[calc(100dvh-5rem)] overflow-hidden bg-slate-100 p-4 text-slate-950 sm:p-6">
      <div className="mx-auto flex h-full min-h-0 max-w-7xl flex-col">
        <header className="mb-4 flex shrink-0 items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">Gicho POS</p>
            <h1 className="text-2xl font-bold">Sell</h1>
          </div>
          {status ? (
            <p className={`rounded-lg px-3 py-2 text-sm font-semibold shadow-sm ${
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

        <div className="grid min-h-0 min-w-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:grid-rows-1 lg:gap-4">
          <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl bg-slate-50">
            <h2 className="mb-3 text-xl font-bold text-slate-950">Products</h2>
            {isLoadingProducts ? (
              <div className="flex flex-1 items-center justify-center text-sm font-semibold text-slate-600">
                <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
                Loading products...
              </div>
            ) : (
              <ProductGrid products={products} onAdd={addProduct} />
            )}
          </section>
          <Cart
            items={items}
            paymentMethod={paymentMethod}
            amountTenderedCents={amountTenderedCents}
            referenceNumber={referenceNumber}
            totalCents={totalCents}
            onPaymentMethodChange={setPaymentMethod}
            onAmountTenderedChange={setAmountTenderedCents}
            onQuickCash={(amountCents, mode) =>
              setAmountTenderedCents((current) =>
                mode === "exact" ? amountCents : current + amountCents,
              )
            }
            onReferenceNumberChange={setReferenceNumber}
            onIncrement={(id) => changeQuantity(id, 1)}
            onDecrement={(id) => changeQuantity(id, -1)}
            onSubmit={saveSale}
            isSaving={isSaving}
          />
        </div>
      </div>
    </main>
  );
}