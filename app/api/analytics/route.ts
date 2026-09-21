import { NextResponse } from "next/server";

import connectToDatabase from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

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

type Period = {
  start: Date | null;
  end: Date;
  unit: "day" | "month";
};

function getPeriod(timeframe: Timeframe, now: Date): Period {
  const end = new Date(now);
  const start = new Date(now);

  switch (timeframe) {
    case "Day":
      start.setDate(start.getDate() - 1);
      return { start, end, unit: "day" };
    case "Week":
      start.setDate(start.getDate() - 7);
      return { start, end, unit: "day" };
    case "Month":
      start.setMonth(start.getMonth() - 1);
      return { start, end, unit: "day" };
    case "3 Months":
      start.setMonth(start.getMonth() - 3);
      return { start, end, unit: "day" };
    case "6 Months":
      start.setMonth(start.getMonth() - 6);
      return { start, end, unit: "month" };
    case "Year":
      start.setFullYear(start.getFullYear() - 1);
      return { start, end, unit: "month" };
    case "All Time":
      return { start: null, end, unit: "month" };
  }
}

function getPreviousPeriod(period: Period): Period {
  if (!period.start) {
    return { start: null, end: period.end, unit: period.unit };
  }

  const duration = period.end.getTime() - period.start.getTime();
  return {
    start: new Date(period.start.getTime() - duration),
    end: period.start,
    unit: period.unit,
  };
}

function matchForPeriod(period: Period) {
  return {
    isDeleted: { $ne: true },
    ...(period.start
      ? { createdAt: { $gte: period.start, $lt: period.end } }
      : { createdAt: { $lt: period.end } }),
  };
}

export async function GET(request: Request) {
  const requestedTimeframe = new URL(request.url).searchParams.get("timeframe");
  const timeframe = TIMEFRAMES.includes(requestedTimeframe as Timeframe)
    ? (requestedTimeframe as Timeframe)
    : "Day";
  const now = new Date();
  const period = getPeriod(timeframe, now);
  const previousPeriod = getPreviousPeriod(period);

  try {
    await connectToDatabase();

    const [current] = await Transaction.aggregate([
      { $match: matchForPeriod(period) },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalRevenueCents: { $sum: "$totalCents" },
                totalSalesCount: { $sum: 1 },
              },
            },
          ],
          topItems: [
            { $unwind: "$items" },
            {
              $group: {
                _id: "$items.name",
                revenueCents: {
                  $sum: {
                    $multiply: [
                      "$items.unitPriceCents",
                      "$items.quantity",
                    ],
                  },
                },
                quantity: { $sum: "$items.quantity" },
              },
            },
            { $sort: { revenueCents: -1, quantity: -1 } },
            { $limit: 10 },
            {
              $project: {
                _id: 0,
                name: "$_id",
                revenueCents: 1,
                quantity: 1,
              },
            },
          ],
          timeSeries: [
            {
              $group: {
                _id: {
                  $dateToString: {
                    date: "$createdAt",
                    format: period.unit === "day" ? "%Y-%m-%d" : "%Y-%m",
                  },
                },
                revenueCents: { $sum: "$totalCents" },
                salesCount: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
            {
              $project: {
                _id: 0,
                date: "$_id",
                revenueCents: 1,
                salesCount: 1,
              },
            },
          ],
        },
      },
    ]);

    const [previous] = await Transaction.aggregate([
      { $match: matchForPeriod(previousPeriod) },
      {
        $group: {
          _id: null,
          totalRevenueCents: { $sum: "$totalCents" },
        },
      },
    ]);

    const summary = current?.summary[0] ?? {
      totalRevenueCents: 0,
      totalSalesCount: 0,
    };
    const previousRevenueCents = previous?.totalRevenueCents ?? 0;
    const revenueChangePercent =
      previousRevenueCents === 0
        ? null
        : ((summary.totalRevenueCents - previousRevenueCents) /
            previousRevenueCents) *
          100;

    return NextResponse.json({
      timeframe,
      totalRevenueCents: summary.totalRevenueCents,
      totalSalesCount: summary.totalSalesCount,
      previousRevenueCents,
      revenueChangePercent,
      topItems: current?.topItems ?? [],
      timeSeries: current?.timeSeries ?? [],
    });
  } catch (error) {
    console.error("Unable to load analytics", error);
    return NextResponse.json(
      { error: "Unable to load analytics" },
      { status: 500 },
    );
  }
}
