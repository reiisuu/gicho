"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { PRODUCT_CATEGORIES } from "@/lib/product-categories";

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
const CUSTOM_CATEGORY = "__custom__";

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
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [customCategory, setCustomCategory] = useState("");

  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category))),
    [products],
  );
  const availableCategories = useMemo(
    () =>
      Array.from(
        new Set([...PRODUCT_CATEGORIES, ...categories]),
      ),
    [categories],
  );
  const activeCategory =
    selectedCategory === "All" || categories.includes(selectedCategory)
      ? selectedCategory
      : "All";
  const visibleProducts = useMemo(
    () => {
      const query = searchQuery.trim().toLocaleLowerCase();
      return products.filter((product) => {
        const matchesCategory =
          activeCategory === "All" || product.category === activeCategory;
        const matchesSearch =
          !query ||
          product.name.toLocaleLowerCase().includes(query) ||
          product.category.toLocaleLowerCase().includes(query);
        return matchesCategory && matchesSearch;
      });
    },
    [activeCategory, products, searchQuery],
  );

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
    if (!form.name.trim() || !form.category || !Number.isInteger(priceCents)) {
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
      setCustomCategory("");
      setIsAddProductModalOpen(false);
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
      <div className="mx-auto flex h-full min-h-0 max-w-4xl flex-col gap-4">
        <header className="shrink-0">
          <p className="text-sm font-semibold text-slate-500">Gicho POS</p>
          <h1 className="text-3xl font-bold">Menu Manager</h1>
        </header>

        {isAddProductModalOpen ? (
          <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setIsAddProductModalOpen(false);
              }
            }}
          >
            <form
              onSubmit={createProduct}
              className="w-full max-w-lg space-y-4 rounded-xl bg-white p-5 shadow-xl"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold">Add Product</h2>
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(false)}
                  className="rounded-lg px-3 py-1.5 text-sm font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50"
                >
                  Close
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="Product name"
                  required
                  className="rounded-lg border border-gray-300 px-3 py-2"
                />
                <select
                  value={form.category}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (value === CUSTOM_CATEGORY) {
                      setCustomCategory("");
                      setIsCategoryModalOpen(true);
                    } else {
                      setForm({ ...form, category: value });
                    }
                  }}
                  required
                  className="rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="" disabled>
                    Select category
                  </option>
                  {availableCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                  <option value={CUSTOM_CATEGORY}>Create custom category...</option>
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) => setForm({ ...form, price: event.target.value })}
                  placeholder="Price (₱)"
                  required
                  className="rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
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
          </div>
        ) : null}

        {isCategoryModalOpen ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setIsCategoryModalOpen(false);
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="custom-category-title"
              className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
            >
              <h2 id="custom-category-title" className="text-xl font-bold">
                Create category
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Add a category for future products.
              </p>
              <input
                autoFocus
                value={customCategory}
                onChange={(event) => setCustomCategory(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    const category = customCategory.trim();
                    if (category) {
                      setForm((current) => ({ ...current, category }));
                      setIsCategoryModalOpen(false);
                    }
                  }
                }}
                placeholder="Category name"
                className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-3"
              />
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="rounded-lg px-4 py-2 font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const category = customCategory.trim();
                    if (category) {
                      setForm((current) => ({ ...current, category }));
                      setIsCategoryModalOpen(false);
                    }
                  }}
                  disabled={!customCategory.trim()}
                  className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Use category
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {error ? <p className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p> : null}
        {status ? <p className="rounded-lg bg-green-50 p-3 text-green-700">{status}</p> : null}

        <section className="flex min-h-0 flex-1 flex-col space-y-2">
          <div className="flex shrink-0 justify-center">
            <label className="sr-only" htmlFor="menu-product-search">
              Search products
            </label>
            <input
              id="menu-product-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search products"
              className="w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <h2 className="text-lg font-bold sm:text-xl">Products</h2>
          {products.length > 0 ? (
            <div className="custom-scrollbar flex shrink-0 gap-2 overflow-x-auto pb-1">
              {["All", ...categories].map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  aria-pressed={activeCategory === category}
                  className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                    activeCategory === category
                      ? "bg-green-600 text-white"
                      : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-green-50"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          ) : null}
          <div className="custom-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {isLoading ? <p className="flex items-center font-semibold text-slate-600"><span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />Loading products...</p> : null}
            {!isLoading && products.length === 0 ? <p>No products yet.</p> : null}
            {!isLoading && products.length > 0 && visibleProducts.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center font-semibold text-slate-600">
                No products in this category.
              </p>
            ) : null}
            {visibleProducts.map((product) => (
              <article key={product.id} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="mb-4">
                  <h3 className="font-bold">{product.name}</h3>
                  <p className="text-sm text-gray-500">{product.category}</p>
                  <p className="text-lg font-semibold">{formatPrice(product.priceCents)}</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <label className="text-sm font-medium sm:flex-1">
                    Product name
                    <input
                      value={
                        editingProducts[product.id]?.name ??
                        product.name
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
                            name: event.target.value,
                          },
                        }))
                      }
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                  </label>
                  <label className="text-sm font-medium sm:flex-1">
                    Category
                    <select
                      value={
                        editingProducts[product.id]?.category ??
                        product.category
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
                            category: event.target.value,
                          },
                        }))
                      }
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                    >
                      {availableCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>
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
                      className="rounded-lg bg-green-600 px-3 py-2 font-semibold text-white transition hover:bg-green-700 disabled:cursor-wait disabled:opacity-60"
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
                        product.isActive
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-red-100 text-red-800 hover:bg-red-200"
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

      <button
        type="button"
        onClick={() => setIsAddProductModalOpen(true)}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom)+0.75rem)] right-3 z-30 flex items-center gap-2 rounded-full bg-green-600 px-4 py-3 text-left text-white shadow-xl transition hover:bg-green-700 sm:right-6 sm:gap-3 sm:px-5"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg font-bold text-green-700">
          +
        </span>
        <span>
          <span className="block text-sm font-semibold">Add Product</span>
          <span className="block text-xs text-green-100">New menu item</span>
        </span>
      </button>
    </main>
  );
}
