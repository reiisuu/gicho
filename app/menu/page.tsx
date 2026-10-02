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

type ProductUpdate = {
  name: string;
  category: string;
  priceCents: number;
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
  const [editingProducts, setEditingProducts] = useState<Record<string, ProductForm>>({});
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
        return false;
      }
      setStatus("Product updated.");
      await loadProducts();
      return true;
    } catch {
      setError("Unable to update product.");
      return false;
    } finally {
      setUpdatingId("");
    }
  }

  async function updateProductDetails(product: Product) {
    const editForm = editingProducts[product.id] ?? {
      name: product.name,
      category: product.category,
      price: (product.priceCents / 100).toFixed(2),
    };
    const priceCents = priceToCents(editForm.price);
    const updates: ProductUpdate = {
      name: editForm.name.trim(),
      category: editForm.category.trim(),
      priceCents,
    };

    if (!updates.name || !updates.category) {
      setError("Enter a name, category, and valid price.");
      return;
    }
    if (!Number.isInteger(priceCents)) {
      setError("Enter a valid price.");
      return;
    }
    if (await updateProduct(product.id, updates)) {
      setEditingProducts((current) => {
        const next = { ...current };
        delete next[product.id];
        return next;
      });
    }
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
                <div className="mb-4">
                  <h3 className="font-bold">{product.name}</h3>
                  <p className="text-sm text-gray-500">{product.category}</p>
                  <p className="text-lg font-semibold">{formatPrice(product.priceCents)}</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  {(["name", "category"] as const).map((field) => (
                    <label key={field} className="text-sm font-medium sm:flex-1">
                      {field === "name" ? "Product name" : "Category"}
                      <input
                        value={
                          editingProducts[product.id]?.[field] ??
                          product[field]
                        }
                        onChange={(event) =>
                          setEditingProducts((current) => ({
                            ...current,
                            [product.id]: {
                              ...(current[product.id] ?? {
                                name: product.name,
                                category: product.category,
                                price: (product.priceCents / 100).toFixed(2),
                              }),
                              [field]: event.target.value,
                            },
                          }))
                        }
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                      />
                    </label>
                  ))}
                  <label className="text-sm font-medium">
                    Price (₱)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        editingProducts[product.id]?.price ??
                        (product.priceCents / 100).toFixed(2)
                      }
                      onChange={(event) =>
                        setEditingProducts((current) => ({
                          ...current,
                          [product.id]: {
                            ...(current[product.id] ?? {
                              name: product.name,
                              category: product.category,
                              price: (product.priceCents / 100).toFixed(2),
                            }),
                            price: event.target.value,
                          },
                        }))
                      }
                      className="mt-1 block w-32 rounded-lg border border-gray-300 px-3 py-2"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void updateProductDetails(product)}
                      disabled={updatingId === product.id}
                      className="rounded-lg bg-slate-900 px-3 py-2 font-semibold text-white disabled:cursor-wait disabled:opacity-60"
                    >
                      {updatingId === product.id ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          Updating...
                        </span>
                      ) : (
                        "Update Product"
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
