import { NextResponse } from "next/server";
import { Types } from "mongoose";

import connectToDatabase from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type PatchBody = {
  action?: unknown;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid transaction id" }, { status: 400 });
  }

  let body: PatchBody = {};
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    // An empty body keeps the original delete behavior.
  }

  const action = body.action ?? "delete";
  if (action !== "delete" && action !== "restore") {
    return NextResponse.json(
      { error: "Action must be delete or restore" },
      { status: 400 },
    );
  }

  try {
    await connectToDatabase();
    const transaction = await Transaction.findByIdAndUpdate(
      id,
      action === "restore"
        ? { isDeleted: false, deletedAt: null }
        : { isDeleted: true, deletedAt: new Date() },
      { new: true },
    ).lean();

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: transaction._id.toString(),
      isDeleted: transaction.isDeleted,
    });
  } catch (error) {
    console.error("Unable to update transaction deletion state", error);
    return NextResponse.json(
      { error: "Unable to update transaction deletion state" },
      { status: 500 },
    );
  }
}
