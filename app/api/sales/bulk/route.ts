import { NextResponse } from "next/server";

import { POST as saveSale } from "@/app/api/sales/route";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!Array.isArray(payload) || payload.length === 0) {
    return NextResponse.json(
      { error: "Expected a non-empty sale queue" },
      { status: 400 },
    );
  }

  const results = [];
  for (const sale of payload) {
    const response = await saveSale(
      new Request(request.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sale),
      }),
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Unable to sync sale queue" },
        { status: response.status },
      );
    }

    results.push(await response.json());
  }

  return NextResponse.json({ synced: results.length, results });
}