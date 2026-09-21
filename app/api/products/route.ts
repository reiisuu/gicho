import { NextResponse } from "next/server";
import { Types } from "mongoose";

import connectToDatabase from "@/lib/mongodb";
import Product from "@/models/Product";

type ProductBody = {
  name?: unknown;
  category?: unknown;
  priceCents?: unknown;
  isActive?: unknown;
};

function serializeProduct(product: {
  _id: { toString: () => string };
  name: string;
  category: string;
  priceCents: number;
  isActive: boolean;
  updatedAt?: Date;
}) {
  return {
    id: product._id.toString(),
    name: product.name,
    category: product.category,
    priceCents: product.priceCents,
    isActive: product.isActive,
    updatedAt: product.updatedAt,
  };
}

function isValidProductBody(body: ProductBody, partial = false) {
  const hasName = typeof body.name === "string" && body.name.trim().length > 0;
  const hasCategory =
    typeof body.category === "string" && body.category.trim().length > 0;
  const hasPrice = Number.isInteger(body.priceCents) && Number(body.priceCents) >= 0;
  const hasActive = typeof body.isActive === "boolean";

  if (partial) {
    return (
      (body.name === undefined || hasName) &&
      (body.category === undefined || hasCategory) &&
      (body.priceCents === undefined || hasPrice) &&
      (body.isActive === undefined || hasActive) &&
      Object.keys(body).length > 0
    );
  }

  return hasName && hasCategory && hasPrice;
}

export async function GET(request: Request) {
  await connectToDatabase();
  const activeOnly =
    new URL(request.url).searchParams.get("activeOnly") === "true";
  const products = await Product.find(activeOnly ? { isActive: true } : {})
    .sort({ category: 1, name: 1 })
    .lean();

  return NextResponse.json(products.map(serializeProduct));
}

export async function POST(request: Request) {
  let body: ProductBody;
  try {
    body = (await request.json()) as ProductBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!isValidProductBody(body)) {
    return NextResponse.json(
      { error: "Name, category, and a non-negative integer priceCents are required" },
      { status: 400 },
    );
  }

  try {
    await connectToDatabase();
    const product = await Product.create({
      name: (body.name as string).trim(),
      category: (body.category as string).trim(),
      priceCents: body.priceCents,
      isActive: body.isActive ?? true,
    });
    return NextResponse.json(serializeProduct(product), { status: 201 });
  } catch (error) {
    console.error("Unable to create product", error);
    return NextResponse.json({ error: "Unable to create product" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  let body: ProductBody & { id?: unknown };
  try {
    body = (await request.json()) as ProductBody & { id?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof body.id !== "string" || !Types.ObjectId.isValid(body.id)) {
    return NextResponse.json({ error: "A valid product id is required" }, { status: 400 });
  }

  const { id, ...updates } = body;
  if (!isValidProductBody(updates, true)) {
    return NextResponse.json({ error: "Invalid product update" }, { status: 400 });
  }

  if (typeof updates.name === "string") {
    updates.name = (updates.name as string).trim();
  }
  if (typeof updates.category === "string") {
    updates.category = (updates.category as string).trim();
  }

  try {
    await connectToDatabase();
    const product = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(serializeProduct(product));
  } catch (error) {
    console.error("Unable to update product", error);
    return NextResponse.json({ error: "Unable to update product" }, { status: 500 });
  }
}