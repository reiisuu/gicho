"use client";

import { FormEvent, useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
  category: string;
  priceCents: number;
  isActive: boolean;
};

type ProductForm = {
  name: string;
  category: string;
  price: string;
};

const emptyForm: ProductForm = { name: "", category: "", price: "" };

function formatPrice(cents: number) {
  return `₱${(cents / 100).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function priceToCents(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) : NaN;
}

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingPrice, setEditingPrice] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState("");

  async function loadProducts() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error();
      setProducts((await response.json()) as Product[]);
    } catch {
      setError("Unable to load products.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProducts();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const priceCents = priceToCents(form.price);
    if (!form.name.trim() || !form.category.trim() || !Number.isInteger(priceCents)) {
      setError("Enter a name, category, and valid price.");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          priceCents,
        }),
      });
      if (!response.ok) throw new Error();
      setForm(emptyForm);
      setStatus("Product added.");
      await loadProducts();
    } catch {
      setError("Unable to add product.");
    } finally {
      setIsSaving(false);
    }
  }

  async function updateProduct(id: string, updates: Partial<Product>) {
    setUpdatingId(id);
    setError("");
    try {
      const response = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      if (!response.ok) {
        setError("Unable to update product.");
        return;
      }
      setStatus("Product updated.");
      await loadProducts();
    } catch {
      setError("Unable to update product.");
    } finally {
      setUpdatingId("");
    }
  }

  async function updatePrice(product: Product) {
    const priceCents = priceToCents(editingPrice[product.id] ?? "");
    if (!Number.isInteger(priceCents)) {
      setError("Enter a valid price.");
      return;
    }
    await updateProduct(product.id, { priceCents });
  }

  return (
    <main className="h-[calc(100dvh-5rem)] max-h-[calc(100dvh-5rem)] overflow-hidden bg-slate-100 p-4 text-slate-950 sm:p-6">
      <div className="mx-auto flex h-full min-h-0 max-w-4xl flex-col gap-6">
        <header className="shrink-0">
          <p className="text-sm font-semibold text-slate-500">Gicho POS</p>
          <h1 className="text-3xl font-bold">Menu Manager</h1>
        </header>

        <form onSubmit={createProduct} className="space-y-4 rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold">Add Product</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Product name"
              required
              className="rounded-lg border border-gray-300 px-3 py-3"
            />
            <input
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
              placeholder="Category"
              required
              className="rounded-lg border border-gray-300 px-3 py-3"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(event) => setForm({ ...form, price: event.target.value })}
              placeholder="Price (₱)"
              required
              className="rounded-lg border border-gray-300 px-3 py-3"
            />
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-50"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Adding...
              </span>
            ) : (
              "Add Product"
            )}
          </button>
        </form>

        {error ? <p className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p> : null}
        {status ? <p className="rounded-lg bg-green-50 p-3 text-green-700">{status}</p> : null}

        <section className="flex min-h-0 flex-1 flex-col space-y-3">
          <h2 className="text-xl font-bold">Products</h2>
          <div className="custom-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {isLoading ? <p className="flex items-center font-semibold text-slate-600"><span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />Loading products...</p> : null}
            {!isLoading && products.length === 0 ? <p>No products yet.</p> : null}
            {products.map((product) => (
              <article key={product.id} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-bold">{product.name}</h3>
                    <p className="text-sm text-gray-500">{product.category}</p>
                    <p className="text-lg font-semibold">{formatPrice(product.priceCents)}</p>
                  </div>
                  <div className="flex flex-wrap items-end gap-2">
                    <label className="text-sm font-medium">
                      New price
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editingPrice[product.id] ?? (product.priceCents / 100).toFixed(2)}
                        onChange={(event) =>
                          setEditingPrice({ ...editingPrice, [product.id]: event.target.value })
                        }
                        className="mt-1 block w-32 rounded-lg border border-gray-300 px-3 py-2"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => void updatePrice(product)}
                      disabled={updatingId === product.id}
                      className="rounded-lg bg-slate-900 px-3 py-2 font-semibold text-white disabled:cursor-wait disabled:opacity-60"
                    >
                      {updatingId === product.id ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          Updating...
                        </span>
                      ) : (
                        "Update Price"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => void updateProduct(product.id, { isActive: !product.isActive })}
                      disabled={updatingId === product.id}
                      className={`rounded-lg px-3 py-2 font-semibold disabled:cursor-wait disabled:opacity-60 ${
                        product.isActive ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
