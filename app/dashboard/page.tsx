"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const TIMEFRAMES = [
  "Day",
  "Week",
  "Month",
  "3 Months",
  "6 Months",
  "Year",
  "All Time",
] as const;

type Timeframe = (typeof TIMEFRAMES)[number];

type Analytics = {
  totalRevenueCents: number;
  totalSalesCount: number;
  previousRevenueCents: number;
  revenueChangePercent: number | null;
  topItems: {
    name: string;
    revenueCents: number;
    quantity: number;
  }[];
  timeSeries: {
    date: string;
    revenueCents: number;
    salesCount: number;
  }[];
};

const formatMoney = (cents: number) =>
  `₱${(cents / 100).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function DashboardPage() {
  const [timeframe, setTimeframe] = useState<Timeframe>("Day");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setIsLoading(true);
      setError("");
      fetch(`/api/analytics?timeframe=${encodeURIComponent(timeframe)}`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) throw new Error();
          return (await response.json()) as Analytics;
        })
        .then(setAnalytics)
        .catch((requestError: unknown) => {
          if (requestError instanceof DOMException && requestError.name === "AbortError") {
            return;
          }
          setError("Unable to load analytics.");
        })
        .finally(() => setIsLoading(false));
    }, 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [timeframe]);

  return (
    <main className="h-[calc(100dvh-5rem)] max-h-[calc(100dvh-5rem)] overflow-hidden bg-slate-100 p-4 text-slate-950 sm:p-6">
      <div className="mx-auto flex h-full min-h-0 max-w-6xl flex-col gap-5">
        <header className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">Gicho POS</p>
            <h1 className="text-3xl font-bold">Dashboard</h1>
          </div>
          <label className="text-sm font-semibold">
            Timeframe
            <select
              value={timeframe}
              onChange={(event) => setTimeframe(event.target.value as Timeframe)}
              className="mt-1 block rounded-lg border border-gray-300 bg-white px-3 py-2 text-base"
            >
              {TIMEFRAMES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </header>

        <div className="custom-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
          {error ? <p className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p> : null}
          {isLoading && analytics ? (
            <p className="flex items-center text-sm font-semibold text-slate-600">
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
              Updating dashboard...
            </p>
          ) : null}
          {isLoading && !analytics ? <p className="flex items-center font-semibold text-slate-600"><span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />Loading analytics...</p> : null}

          {analytics ? (
            <>
            <section className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="mt-1 text-3xl font-bold">
                  {formatMoney(analytics.totalRevenueCents)}
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  {analytics.revenueChangePercent === null
                    ? "No previous period data"
                    : `${analytics.revenueChangePercent >= 0 ? "+" : ""}${analytics.revenueChangePercent.toFixed(1)}% vs previous period`}
                </p>
              </div>
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-gray-500">Total Sales Count</p>
                <p className="mt-1 text-3xl font-bold">{analytics.totalSalesCount}</p>
              </div>
            </section>

            <section className="min-w-0 rounded-xl bg-white p-4 shadow-sm">
              <h2 className="mb-4 text-xl font-bold">Revenue Trends</h2>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.timeSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis
                      tickFormatter={(value: number) =>
                        `₱${(value / 100).toLocaleString("en-PH")}`
                      }
                    />
                    <Tooltip
                      formatter={(value) => {
                        const numericValue = Array.isArray(value)
                          ? value[0]
                          : value;
                        return formatMoney(Number(numericValue ?? 0));
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenueCents"
                      stroke="#111827"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="min-w-0 rounded-xl bg-white p-4 shadow-sm">
              <h2 className="mb-4 text-xl font-bold">Top Selling Items</h2>
              {analytics.topItems.length === 0 ? (
                <p className="text-gray-500">No sales for this timeframe.</p>
              ) : (
                <div className="space-y-3">
                  {analytics.topItems.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          {item.quantity} sold
                        </p>
                      </div>
                      <p className="font-bold">{formatMoney(item.revenueCents)}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
