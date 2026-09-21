import { NextResponse } from "next/server";

import connectToDatabase from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type TransactionItem = {
  productId: { toString: () => string };
  name: string;
  unitPriceCents: number;
  quantity: number;
};

function isValidDate(value: string) {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date");

  if (!date || !isValidDate(date)) {
    return NextResponse.json(
      { error: "A valid date query parameter (YYYY-MM-DD) is required" },
      { status: 400 },
    );
  }

  try {
    await connectToDatabase();
    const retentionCutoff = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    );
    await Transaction.deleteMany({
      isDeleted: true,
      deletedAt: { $ne: null, $lte: retentionCutoff },
    });

    const transactions = await Transaction.find({ saleDate: date })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      transactions.map((transaction) => ({
        id: transaction._id.toString(),
        createdAt: transaction.createdAt.toISOString(),
        saleDate: transaction.saleDate,
        items: transaction.items.map((item: TransactionItem) => ({
          productId: item.productId.toString(),
          name: item.name,
          unitPriceCents: item.unitPriceCents,
          quantity: item.quantity,
        })),
        totalCents: transaction.totalCents,
        paymentMethod: transaction.paymentMethod,
        amountTenderedCents: transaction.amountTenderedCents,
        changeCents: transaction.changeCents,
        referenceNumber: transaction.referenceNumber,
        isDeleted: transaction.isDeleted,
        deletedAt: transaction.deletedAt?.toISOString() ?? null,
      })),
    );
  } catch (error) {
    console.error("Unable to load transaction history", error);
    return NextResponse.json(
      { error: "Unable to load transaction history" },
      { status: 500 },
    );
  }
}
