"use client";

import { useEffect, useState } from "react";

type TransactionItem = {
  name: string;
  quantity: number;
  unitPriceCents: number;
};

type Transaction = {
  id: string;
  createdAt: string;
  items: TransactionItem[];
  totalCents: number;
  paymentMethod: string;
  amountTenderedCents?: number;
  changeCents?: number;
  referenceNumber?: string;
  customerName?: string;
  isDeleted: boolean;
  deletedAt?: string | null;
};

function getToday() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function formatMoney(cents: number) {
  return `₱${(cents / 100).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function HistoryPage() {
  const [date, setDate] = useState(getToday);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  async function loadTransactions(selectedDate: string) {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/sales/history?date=${encodeURIComponent(selectedDate)}`,
      );
      if (!response.ok) throw new Error();
      setTransactions((await response.json()) as Transaction[]);
    } catch {
      setError("Unable to load transaction history.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTransactions(date);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [date]);

  async function updateDeletionState(id: string, action: "delete" | "restore") {
    setUpdatingId(id);
    setError("");

    try {
      const response = await fetch(`/api/sales/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) throw new Error();
      await loadTransactions(date);
    } catch {
      setError(
        action === "restore"
          ? "Unable to restore this order."
          : "Unable to delete this order.",
      );
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <main className="h-[calc(100dvh-5rem)] max-h-[calc(100dvh-5rem)] overflow-hidden bg-slate-100 p-4 text-slate-950 sm:p-6">
      <div className="mx-auto flex h-full min-h-0 max-w-3xl flex-col gap-5">
        <header className="shrink-0">
          <p className="text-sm font-semibold text-slate-500">Gicho POS</p>
          <h1 className="text-3xl font-bold">Transaction History</h1>
        </header>

        <label className="block shrink-0 rounded-xl bg-white p-4 shadow-sm">
          <span className="mb-2 block font-semibold">Select Date</span>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-lg"
          />
        </label>

        <div className="custom-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
          {error ? <p className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p> : null}
          {isLoading ? <p className="flex items-center font-semibold text-slate-600"><span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />Loading transactions...</p> : null}
          {!isLoading && transactions.length === 0 ? (
            <p className="rounded-xl bg-white p-6 text-center text-gray-500 shadow-sm">
              No transactions for this date.
            </p>
          ) : null}

          <section className="space-y-3">
            {transactions.map((transaction) => (
            <article
              key={transaction.id}
              className={`rounded-xl bg-white p-4 shadow-sm ${
                transaction.isDeleted ? "opacity-60" : ""
              }`}
            >
              <div
                className={
                  transaction.isDeleted
                    ? "space-y-3 line-through"
                    : "space-y-3"
                }
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <p className="font-bold">
                      {transaction.items
                        .map((item) => `${item.quantity}× ${item.name}`)
                        .join(", ")}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(transaction.createdAt).toLocaleTimeString(
                        "en-PH",
                        { hour: "numeric", minute: "2-digit" },
                      )}{" "}
                      · {transaction.paymentMethod}
                    </p>
                    {transaction.customerName ? (
                      <p className="text-sm font-semibold text-slate-700">
                        Customer: {transaction.customerName}
                      </p>
                    ) : null}
                  </div>
                  <p className="shrink-0 text-xl font-bold">
                    {formatMoney(transaction.totalCents)}
                  </p>
                </div>
                {transaction.referenceNumber ? (
                  <p className="text-sm text-gray-500">
                    Ref: {transaction.referenceNumber}
                  </p>
                ) : null}
              </div>

              {!transaction.isDeleted ? (
                <button
                  type="button"
                  onClick={() => void updateDeletionState(transaction.id, "delete")}
                  disabled={updatingId === transaction.id}
                  className="mt-4 rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-800 disabled:opacity-50"
                >
                  {updatingId === transaction.id ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-700/40 border-t-red-700" />
                      Deleting...
                    </span>
                  ) : (
                    "Delete Order"
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    void updateDeletionState(transaction.id, "restore")
                  }
                  disabled={updatingId === transaction.id}
                  className="mt-3 rounded-lg bg-green-100 px-3 py-2 text-sm font-semibold text-green-800 hover:bg-green-200 disabled:opacity-50"
                >
                  {updatingId === transaction.id ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-700/40 border-t-slate-700" />
                      Restoring...
                    </span>
                  ) : (
                    "Restore Order"
                  )}
                </button>
              )}
            </article>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
