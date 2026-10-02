export const PRODUCT_CATEGORIES = ["Ulam", "Drink", "Others"] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export function isProductCategory(value: unknown): value is ProductCategory {
  return (
    typeof value === "string" &&
    PRODUCT_CATEGORIES.includes(value as ProductCategory)
  );
}
