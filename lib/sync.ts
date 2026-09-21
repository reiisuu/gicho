export const OFFLINE_QUEUE_KEY = "gicho_offline_queue";

export type SaleItem = {
  productId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
};

export type SalePayload = {
  clientId: string;
  createdAt: string;
  saleDate: string;
  items: SaleItem[];
  totalCents: number;
  paymentMethod: "Cash" | "GCash" | "Maya" | "Bank Transfer";
  amountTenderedCents?: number;
  changeCents?: number;
  referenceNumber?: string;
  source: "app" | "import";
};

export function getOfflineQueue(): SalePayload[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!stored) {
      return [];
    }

    const queue = JSON.parse(stored) as unknown;
    return Array.isArray(queue) ? (queue as SalePayload[]) : [];
  } catch {
    return [];
  }
}

export function saveOfflineQueue(queue: SalePayload[]): void {
  window.localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export function enqueueSale(sale: SalePayload): void {
  saveOfflineQueue([...getOfflineQueue(), sale]);
}

export async function syncQueue(): Promise<boolean> {
  const queue = getOfflineQueue();
  if (queue.length === 0 || !navigator.onLine) {
    return true;
  }

  try {
    const response = await fetch("/api/sales/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(queue),
    });

    if (!response.ok) {
      return false;
    }

    saveOfflineQueue([]);
    return true;
  } catch {
    return false;
  }
}