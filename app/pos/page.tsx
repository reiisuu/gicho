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
  const [status, setStatus] = useState("");

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
      try {
        const response = await fetch("/api/products?activeOnly=true");
        if (!response.ok) throw new Error("Unable to load products");
        const data = (await response.json()) as Product[];
        if (!cancelled) setProducts(data);
      } catch {
        if (!cancelled) setStatus("Unable to load products. Please refresh.");
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

      setStatus("Sale saved.");
    } catch {
      enqueueSale(sale);
      setStatus("Saved to Offline Queue.");
    } finally {
      setItems([]);
      setAmountTenderedCents(0);
      setReferenceNumber("");
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 text-gray-900 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Gicho POS</p>
            <h1 className="text-2xl font-bold">Sell</h1>
          </div>
          {status ? (
            <p className="rounded-lg bg-white px-3 py-2 text-sm font-medium shadow-sm">
              {status}
            </p>
          ) : null}
        </header>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <section className="rounded-xl bg-gray-50">
            <h2 className="mb-3 text-xl font-bold">Products</h2>
            <ProductGrid products={products} onAdd={addProduct} />
          </section>
          <Cart
            items={items}
            paymentMethod={paymentMethod}
            amountTenderedCents={amountTenderedCents}
            referenceNumber={referenceNumber}
            totalCents={totalCents}
            onPaymentMethodChange={setPaymentMethod}
            onAmountTenderedChange={setAmountTenderedCents}
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