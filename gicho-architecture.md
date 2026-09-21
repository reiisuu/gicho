# Gicho POS: Master Architecture & Implementation Context
**Target Audience:** AI Coding Agent / LLM Assistant
**Goal:** Build a mobile-first, offline-capable Next.js POS system for a small food store owner.

## 1. Project Overview & Constraints
*   **App Name:** Gicho (from "General Cho" fried rice).
*   **Core Problem:** Replacing manual pen-and-paper sales tracking and end-of-day calculations.
*   **Target User:** Single store owner. Not tech-savvy. Prefers simple, large tablet/mobile UI.
*   **Key Constraints:** 
    *   **No Inventory/Ingredients:** Just sales, revenue, and basic product management.
    *   **No Add-ons/Modifiers:** Standard items only. "Utang" (credit) is handled off-app.
    *   **Offline Mode Required:** Must work during internet outages via a `localStorage` queue and sync later.
    *   **Math:** All money must be handled in **integer cents** (e.g., 100.50 PHP = 10050) to avoid floating-point errors.

## 2. Tech Stack
*   **Framework:** Next.js (App Router)
*   **Frontend:** React, Tailwind CSS (Mobile/Tablet-first UI)
*   **Charts:** Recharts or Tremor.so (for Next.js/React compatibility)
*   **Backend:** Next.js Route Handlers (`app/api/...`)
*   **Database:** MongoDB Atlas + Mongoose
*   **Authentication:** JWT + bcrypt (Single PIN/Password login)
*   **Hosting:** Vercel

## 3. Data Models (Mongoose)

### A. Product Model
*   `_id`: ObjectId
*   `name`: String (e.g., "General Cho Fried Rice")
*   `category`: String
*   `priceCents`: Number (Integer)
*   `isActive`: Boolean (For soft deletes/hiding from menu)
*   `updatedAt`: Date

### B. Transaction (Sale) Model
*   `_id`: ObjectId
*   `clientId`: String (UUID generated on the device - critical for idempotency and offline sync)
*   `createdAt`: Date (Time of actual sale, set by client)
*   `saleDate`: String ("YYYY-MM-DD" local time for aggregation)
*   `items`: Array of Objects: `[{ productId, name, unitPriceCents, quantity }]`
*   `totalCents`: Number (Integer)
*   `paymentMethod`: Enum ("Cash", "GCash", "Maya", "Bank Transfer")
*   `amountTenderedCents`: Number (Optional, used for Cash)
*   `changeCents`: Number (Optional, used for Cash)
*   `isDeleted`: Boolean (Soft delete, replaces "Void")
*   `source`: Enum ("app", "import")

## 4. Authentication Flow (Single User)
1.  **UI:** `/login` page with a single PIN/Password input. No usernames.
2.  **API:** `POST /api/auth/login`. Compares input to a hashed env variable using `bcrypt`.
3.  **Token:** On success, generates a JWT and sets it as an `httpOnly`, `Secure`, `SameSite=Lax` cookie.
4.  **Protection:** `middleware.ts` intercepts all routes except `/login` and `/api/auth/login`. If no valid JWT cookie is present, redirects to `/login`.

## 5. Offline Sync Architecture (The Queue)
Internet connectivity in the store can drop. The system must never block a sale.

*   **Local Storage Queue:** `gicho_offline_queue` (Array of Transaction Objects).
*   **Write Flow:** When the user taps "Save Sale":
    1.  Generate a `clientId` (UUID).
    2.  Construct the transaction object.
    3.  Attempt `POST /api/sales`.
    4.  If network fails or times out, push object to `gicho_offline_queue` in `localStorage` and clear the cart. UI shows "Saved to Offline Queue".
*   **Sync Flow:** 
    1.  A global React `useEffect` listens to `window.addEventListener('online', syncQueue)`.
    2.  A polling interval (e.g., every 30 seconds) also checks if the device is online and the queue is `length > 0`.
    3.  If online, send `POST /api/sales/bulk` with the queue array.
    4.  Server processes based on `clientId` (upserting to prevent duplicates). 
    5.  On 200 OK from server, clear `gicho_offline_queue`.

## 6. Core UI Screens (Mobile/Tablet First)

### A. POS / Sell Screen (Home)
*   **Layout:** Left side/Top: Grid of active Products (large buttons). Right side/Bottom: Active Cart.
*   **Cart Features:** 
    *   Increment/Decrement quantities.
    *   **Payment Method Toggle:** Cash, GCash, Maya, Bank Transfer.
    *   **Cash Calculator:** If "Cash" is selected, show an input for "Amount Received". Automatically calculate and display "Change".
    *   Massive "Save Sale" button.

### B. Dashboard (Analytics)
*   **Timeframe Dropdown:** Must strictly use the labels: *Day, Week, Month, 3 Months, 6 Months, Year, All Time*.
*   **Metrics (Server-side Aggregation):**
    *   Revenue vs Previous Period.
    *   Total Sales Count.
    *   Best Selling Items (By Revenue and Quantity).
*   **Charts:** Line chart for revenue trends (mapped to the selected timeframe).

### C. History Screen
*   List of today's transactions (and date picker for previous days).
*   Action: **Delete Order** (Sets `isDeleted: true` in DB). Strikethrough deleted orders in UI.

### D. Menu Manager
*   Simple CRUD list for Products. 
*   Can add new items, update prices, and toggle `isActive` to hide items without breaking historical data.

## 7. Recommended File Structure for the Agent
```text
/app
  /api
    /auth/login/route.ts
    /products/route.ts
    /sales/route.ts
    /sales/bulk/route.ts      <- For offline sync queue processing
    /analytics/route.ts
  /login/page.tsx
  /pos/page.tsx               <- Main Sell Screen
  /dashboard/page.tsx         <- Analytics
  /history/page.tsx           <- Transaction log & "Delete Order"
  /menu/page.tsx              <- Product CRUD
/components
  /pos/Cart.tsx
  /pos/ProductGrid.tsx
  /dashboard/Charts.tsx
  /layout/BottomNavigation.tsx
/lib
  auth.ts                     <- JWT utilities
  mongodb.ts                  <- Mongoose connection caching (CRITICAL for Vercel)
  sync.ts                     <- Offline queue localStorage logic
  utils.ts                    <- Cents to PHP formatting
middleware.ts                 <- JWT route protection