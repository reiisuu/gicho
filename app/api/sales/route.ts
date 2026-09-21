import { NextResponse } from "next/server";

import connectToDatabase from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import type { SalePayload } from "@/lib/sync";

function isSalePayload(value: unknown): value is SalePayload {
  if (!value || typeof value !== "object") return false;
  const sale = value as Partial<SalePayload>;
  return (
    typeof sale.clientId === "string" &&
    typeof sale.createdAt === "string" &&
    typeof sale.saleDate === "string" &&
    Array.isArray(sale.items) &&
    sale.items.length > 0 &&
    Number.isInteger(sale.totalCents) &&
    ["Cash", "GCash", "Maya", "Bank Transfer"].includes(
      sale.paymentMethod ?? "",
    ) &&
    (sale.referenceNumber === undefined ||
      typeof sale.referenceNumber === "string") &&
    (sale.source === "app" || sale.source === "import")
  );
}

async function saveSale(sale: SalePayload) {
  const existing = await Transaction.findOne({ clientId: sale.clientId });
  if (existing) {
    return { transaction: existing, duplicate: true };
  }

  try {
    const transaction = await Transaction.create(sale);
    return { transaction, duplicate: false };
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      const transaction = await Transaction.findOne({
        clientId: sale.clientId,
      });
      if (transaction) {
        return { transaction, duplicate: true };
      }
    }
    throw error;
  }
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!isSalePayload(payload)) {
    return NextResponse.json({ error: "Invalid sale data" }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const result = await saveSale(payload);
    return NextResponse.json(
      {
        transactionId: result.transaction._id.toString(),
        duplicate: result.duplicate,
      },
      { status: result.duplicate ? 200 : 201 },
    );
  } catch (error) {
    console.error("Unable to save sale", error);
    return NextResponse.json({ error: "Unable to save sale" }, { status: 500 });
  }
}